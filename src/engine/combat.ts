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

/** Aplica `attacker.appliesEffect` a `defender` on-hit, salvo inmunidad — se refresca, no se acumula (FR-008). */
function applyOnHitEffect(attacker: BattleUnit, defender: BattleUnit): void {
  if (attacker.appliesEffect?.type === 'Curse' && !defender.immuneEffects?.includes('Curse')) {
    defender.curseRemainingSeconds = attacker.appliesEffect.durationSeconds
  }
}

/**
 * Un paso de intercambio de daño entre dos unidades bloqueadas entre sí.
 * Cada unidad ataca según su propio cooldown; el daño se aplica sobre la salud
 * previa al tick (simultáneo), así que ambas pueden morir en el mismo paso.
 */
export function resolveEngagement(a: BattleUnit, b: BattleUnit, deltaSeconds: number): { a: BattleUnit; b: BattleUnit } {
  const nextA = { ...a, attackCooldownRemaining: a.attackCooldownRemaining - deltaSeconds }
  const nextB = { ...b, attackCooldownRemaining: b.attackCooldownRemaining - deltaSeconds }

  let damageToA = 0
  let damageToB = 0

  if (nextA.attackCooldownRemaining <= 0 && nextA.state !== 'Dead') {
    damageToB += nextA.damage * resolveAbilityMultiplier(nextA, nextB)
    nextA.attackCooldownRemaining += nextA.attackIntervalSeconds
    applyOnHitEffect(nextA, nextB)
  }
  if (nextB.attackCooldownRemaining <= 0 && nextB.state !== 'Dead') {
    damageToA += nextB.damage * resolveAbilityMultiplier(nextB, nextA)
    nextB.attackCooldownRemaining += nextB.attackIntervalSeconds
    applyOnHitEffect(nextB, nextA)
  }

  nextA.hp = Math.max(0, nextA.hp - damageToA)
  nextB.hp = Math.max(0, nextB.hp - damageToB)

  if (nextA.hp <= 0) nextA.state = 'Dead'
  if (nextB.hp <= 0) nextB.state = 'Dead'

  return { a: nextA, b: nextB }
}

/**
 * specs/008-tipos-de-ataque (US1): combate mutuo atacante/objetivo primario idéntico a `resolveEngagement`,
 * más daño unidireccional del atacante a cada `splashTargets[i]` dentro de `areaRadius`, en el mismo tick
 * de cooldown vencido del atacante — los objetivos de salpicadura no contraatacan por esta vía.
 */
export function resolveAreaEngagement(
  attacker: BattleUnit,
  primaryTarget: BattleUnit,
  splashTargets: BattleUnit[],
  deltaSeconds: number,
): { attacker: BattleUnit; primaryTarget: BattleUnit; splashTargets: BattleUnit[] } {
  const attackerFires = attacker.attackCooldownRemaining - deltaSeconds <= 0 && attacker.state !== 'Dead'
  const { a: nextAttacker, b: nextPrimary } = resolveEngagement(attacker, primaryTarget, deltaSeconds)

  const nextSplashTargets = splashTargets.map((target) => {
    if (!attackerFires || target.state === 'Dead') return target
    const multiplier = resolveAbilityMultiplier(attacker, target)
    const hp = Math.max(0, target.hp - attacker.damage * multiplier)
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
): { attacker: BattleUnit; base: { hp: number; maxHp: number } } {
  const nextAttacker = { ...attacker, attackCooldownRemaining: attacker.attackCooldownRemaining - deltaSeconds }
  let damage = 0

  if (nextAttacker.attackCooldownRemaining <= 0) {
    damage = nextAttacker.damage
    nextAttacker.attackCooldownRemaining += nextAttacker.attackIntervalSeconds
  }

  return { attacker: nextAttacker, base: { ...base, hp: Math.max(0, base.hp - damage) } }
}
