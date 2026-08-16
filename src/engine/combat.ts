import type { BattleUnit } from './types'

/**
 * specs/009-clasificacion-habilidades: multiplicador de daño del atacante contra el defensor.
 * Un atacante `Cursed` (`curseRemainingSeconds > 0`) no aplica ninguna habilidad (FR-009) — devuelve 1.
 * Si no, devuelve el `damageMultiplier` de la primera `Ability` que coincida (`Neutral` siempre coincide;
 * `TraitTargeting` coincide si la clasificación estándar o especial del defensor está en `targetClassifications`,
 * FR-004/FR-006), o 1 si ninguna coincide.
 */
export function resolveAbilityMultiplier(attacker: BattleUnit, defender: BattleUnit): number {
  if ((attacker.curseRemainingSeconds ?? 0) > 0) return 1

  for (const ability of attacker.abilities ?? []) {
    if (ability.kind === 'Neutral') return ability.damageMultiplier
    if (ability.kind === 'TraitResistance') continue

    // Un defensor CON specialClassification solo es alcanzable por inclusión explícita de ese tipo especial —
    // su clasificación estándar deja de contar para el match (FR-004): excluye a los tipos especiales de
    // habilidades "contra todos los estándar" salvo que las liste de forma explícita.
    const matches =
      defender.specialClassification !== undefined
        ? ability.targetClassifications.includes(defender.specialClassification)
        : ability.targetClassifications.includes(defender.classification ?? 'Traitless')

    if (matches) return ability.damageMultiplier
  }

  return 1
}

/**
 * specs/015-catalogo-habilidades-combate (FR-007): multiplicador de daño *recibido* por `defender` cuando
 * `attacker` pertenece a un rasgo listado en alguna `TraitResistance` de `defender.abilities` — complementa a
 * `resolveAbilityMultiplier` (daño *infligido*), evaluado sobre el lado opuesto de forma independiente.
 */
export function resolveResistanceMultiplier(defender: BattleUnit, attacker: BattleUnit): number {
  for (const ability of defender.abilities ?? []) {
    if (ability.kind !== 'TraitResistance') continue

    const matches =
      attacker.specialClassification !== undefined
        ? ability.targetClassifications.includes(attacker.specialClassification)
        : ability.targetClassifications.includes(attacker.classification ?? 'Traitless')

    if (matches) return ability.damageTakenMultiplier
  }

  return 1
}

/** specs/015-catalogo-habilidades-combate (FR-003). Daño base tras Debilitar si está activo — `weakenMagnitude` es fracción de reducción (0-1). */
function effectiveDamage(unit: BattleUnit): number {
  if ((unit.weakenRemainingSeconds ?? 0) <= 0) return unit.damage
  return unit.damage * (1 - (unit.weakenMagnitude ?? 0))
}

/**
 * Aplica `attacker.appliesEffect` a `defender` on-hit, salvo inmunidad — se refresca, no se acumula (FR-008).
 * specs/015-catalogo-habilidades-combate: generaliza de "solo Curse" a cualquier `EffectType`; aplica la
 * `resistantTo` del defensor a la duración antes de escribirla (FR-009) — duración ≤0 resultante ⇒ no se aplica.
 */
function applyOnHitEffect(attacker: BattleUnit, defender: BattleUnit): void {
  const effect = attacker.appliesEffect
  if (!effect || defender.immuneEffects?.includes(effect.type)) return

  const resistance = defender.resistantTo?.find((entry) => entry.effect === effect.type)
  const effectiveDuration = resistance ? effect.durationSeconds * resistance.durationMultiplier : effect.durationSeconds
  if (effectiveDuration <= 0) return

  switch (effect.type) {
    case 'Curse':
      defender.curseRemainingSeconds = effectiveDuration
      break
    case 'Weaken':
      defender.weakenRemainingSeconds = effectiveDuration
      defender.weakenMagnitude = effect.magnitude ?? 0
      break
    case 'Freeze':
      defender.freezeRemainingSeconds = effectiveDuration
      break
    case 'Slow':
      defender.slowRemainingSeconds = effectiveDuration
      defender.slowMagnitude = effect.magnitude ?? 0
      break
  }
}

/**
 * specs/016-multigolpe-critico: aplica el ataque de `attacker` contra `defender`, mutando `defender.hp`.
 * `MultiHit` repite `hitsPerSequence` impactos independientes dentro de esta misma llamada, deteniéndose en
 * cuanto `defender.hp` llega a 0 (FR-004: los golpes restantes se descartan, nunca se trasladan a otro objetivo;
 * FR-005: al ser atómica por invocación, la siguiente secuencia siempre vuelve a empezar en el primer golpe —
 * no hay progreso que reanudar entre ticks, ver plan.md Key Design Decision 3). `Critical` duplica cada impacto
 * con probabilidad `criticalChance`, aplicado al final sobre el daño ya resuelto por Debilitar/TraitTargeting/TraitResistance.
 */
function applyDamageSequence(attacker: BattleUnit, defender: BattleUnit, random: () => number): void {
  const hits = attacker.attackType === 'MultiHit' ? Math.max(1, attacker.hitsPerSequence ?? 1) : 1

  for (let hit = 0; hit < hits; hit += 1) {
    if (defender.hp <= 0) break

    const perHitDamage = effectiveDamage(attacker) * resolveAbilityMultiplier(attacker, defender) * resolveResistanceMultiplier(defender, attacker)
    const isCritical = attacker.attackType === 'Critical' && random() < (attacker.criticalChance ?? 0)
    defender.hp = Math.max(0, defender.hp - perHitDamage * (isCritical ? 2 : 1))
    applyOnHitEffect(attacker, defender)
  }
}

/**
 * Un paso de intercambio de daño entre dos unidades bloqueadas entre sí.
 * Cada unidad ataca según su propio cooldown; el daño se aplica sobre la salud
 * previa al tick (simultáneo), así que ambas pueden morir en el mismo paso.
 */
export function resolveEngagement(
  a: BattleUnit,
  b: BattleUnit,
  deltaSeconds: number,
  random: () => number = Math.random,
): { a: BattleUnit; b: BattleUnit } {
  const nextA = { ...a, attackCooldownRemaining: a.attackCooldownRemaining - deltaSeconds }
  const nextB = { ...b, attackCooldownRemaining: b.attackCooldownRemaining - deltaSeconds }

  // specs/015-catalogo-habilidades-combate (US2/FR-004): congelada nunca inflige daño, iniciadora o no
  // (una unidad congelada puede ser descubierta como objetivo de otra unidad — ver simulation.ts).
  if (nextA.attackCooldownRemaining <= 0 && nextA.state !== 'Dead' && (nextA.freezeRemainingSeconds ?? 0) <= 0) {
    applyDamageSequence(nextA, nextB, random)
    nextA.attackCooldownRemaining += nextA.attackIntervalSeconds
  }
  if (nextB.attackCooldownRemaining <= 0 && nextB.state !== 'Dead' && (nextB.freezeRemainingSeconds ?? 0) <= 0) {
    applyDamageSequence(nextB, nextA, random)
    nextB.attackCooldownRemaining += nextB.attackIntervalSeconds
  }

  if (nextA.hp <= 0) nextA.state = 'Dead'
  if (nextB.hp <= 0) nextB.state = 'Dead'

  return { a: nextA, b: nextB }
}

/**
 * specs/008-tipos-de-ataque (US1): combate mutuo atacante/objetivo primario idéntico a `resolveEngagement`,
 * más daño unidireccional del atacante a cada `splashTargets[i]` dentro de `areaRadius`, en el mismo tick
 * de cooldown vencido del atacante — los objetivos de salpicadura no contraatacan por esta vía.
 * `attackType === 'Area'` es mutuamente excluyente con `'MultiHit'`/`'Critical'` (specs/016, mismo campo), así
 * que la salpicadura nunca necesita ese tratamiento — solo el intercambio con el objetivo primario (vía
 * `resolveEngagement`) podría, en teoría, pero tampoco aplica por el mismo motivo.
 */
export function resolveAreaEngagement(
  attacker: BattleUnit,
  primaryTarget: BattleUnit,
  splashTargets: BattleUnit[],
  deltaSeconds: number,
  random: () => number = Math.random,
): { attacker: BattleUnit; primaryTarget: BattleUnit; splashTargets: BattleUnit[] } {
  const attackerFires =
    attacker.attackCooldownRemaining - deltaSeconds <= 0 && attacker.state !== 'Dead' && (attacker.freezeRemainingSeconds ?? 0) <= 0
  const { a: nextAttacker, b: nextPrimary } = resolveEngagement(attacker, primaryTarget, deltaSeconds, random)

  const nextSplashTargets = splashTargets.map((target) => {
    if (!attackerFires || target.state === 'Dead') return target
    const multiplier = resolveAbilityMultiplier(attacker, target) * resolveResistanceMultiplier(target, attacker)
    const hp = Math.max(0, target.hp - effectiveDamage(attacker) * multiplier)
    const nextTarget = { ...target, hp, state: hp <= 0 ? ('Dead' as const) : target.state }
    applyOnHitEffect(attacker, nextTarget)
    return nextTarget
  })

  return { attacker: nextAttacker, primaryTarget: nextPrimary, splashTargets: nextSplashTargets }
}

/** Daño directo de una unidad contra una base (sin cooldown de la base — solo el de la unidad atacante). */
export function resolveBaseDamage(
  attacker: BattleUnit,
  base: { hp: number; maxHp: number },
  deltaSeconds: number,
  random: () => number = Math.random,
): { attacker: BattleUnit; base: { hp: number; maxHp: number } } {
  const nextAttacker = { ...attacker, attackCooldownRemaining: attacker.attackCooldownRemaining - deltaSeconds }
  let hp = base.hp

  if (nextAttacker.attackCooldownRemaining <= 0) {
    const hits = nextAttacker.attackType === 'MultiHit' ? Math.max(1, nextAttacker.hitsPerSequence ?? 1) : 1
    for (let hit = 0; hit < hits; hit += 1) {
      if (hp <= 0) break
      const isCritical = nextAttacker.attackType === 'Critical' && random() < (nextAttacker.criticalChance ?? 0)
      hp = Math.max(0, hp - effectiveDamage(nextAttacker) * (isCritical ? 2 : 1))
    }
    nextAttacker.attackCooldownRemaining += nextAttacker.attackIntervalSeconds
  }

  return { attacker: nextAttacker, base: { ...base, hp } }
}
