import type { Ability, AppliesEffect, BattleUnit, CannonHeadSpec, ImmunizableAbilityKind } from './types'

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
    // specs/038-catalogo-habilidades-avanzado: MassiveDamage/TraitKiller/Shield/SummonOnDeath se resuelven
    // aparte (findMassiveDamage/findMatchingTraitKiller) — no participan del multiplicador de TraitTargeting.
    if (ability.kind !== 'TraitTargeting') continue

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

/**
 * specs/015-catalogo-habilidades-combate (FR-003). Daño base tras Debilitar si está activo — `weakenMagnitude` es fracción de reducción (0-1).
 * specs/039-habilidades-control-defensa (FR-001, research.md Decisión 4): además multiplica por `Ability.Strengthen` mientras
 * `unit.hp <= unit.maxHp * hpThresholdFraction` (umbral inclusivo, evaluado en vivo contra el `hp` al momento de atacar) —
 * punto único por el que pasa el daño base contra unidades, salpicadura y bases, así que los tres lo reciben sin más cambios.
 */
function effectiveDamage(unit: BattleUnit): number {
  const weakened = (unit.weakenRemainingSeconds ?? 0) > 0 ? unit.damage * (1 - (unit.weakenMagnitude ?? 0)) : unit.damage

  const strengthen = findActiveAbility(unit, 'Strengthen')
  if (strengthen !== undefined && unit.hp <= unit.maxHp * strengthen.hpThresholdFraction) return weakened * strengthen.damageMultiplier

  return weakened
}

/**
 * specs/038-catalogo-habilidades-avanzado (FR-001/FR-007), generalizada en specs/039-habilidades-control-defensa
 * (research.md Decisión 6): primera `Ability` del `kind` pedido que declara `unit`, o `undefined` si no declara
 * ninguna o está `Cursed` (mismo criterio de bloqueo que `resolveAbilityMultiplier`). Solo para habilidades que
 * se "aplican" en combate — `Shield`/`TraitResistance`, pasivas, no pasan por aquí.
 */
function findActiveAbility<K extends Ability['kind']>(unit: BattleUnit, kind: K): Extract<Ability, { kind: K }> | undefined {
  if ((unit.curseRemainingSeconds ?? 0) > 0) return undefined
  return unit.abilities?.find((ability): ability is Extract<Ability, { kind: K }> => ability.kind === kind)
}

/**
 * specs/040-dinero-extra-inmunidades (FR-005/FR-007, research.md Decisión 2): `true` si `defender` lista `kind` en
 * `immuneAbilities`. Propiedad pasiva del defensor — no se ve afectada por `Curse`, igual que `immuneEffects` (`specs/015`).
 */
function isImmuneToAbility(defender: BattleUnit, kind: ImmunizableAbilityKind): boolean {
  return defender.immuneAbilities?.includes(kind) ?? false
}

/**
 * specs/038-catalogo-habilidades-avanzado (FR-002/FR-007): primera `Ability.TraitKiller` de `attacker` cuyo
 * `targetClassifications` coincida con el rasgo de `defender` (mismo algoritmo de exclusión de tipos
 * especiales que `resolveAbilityMultiplier`), o `undefined` si ninguna coincide o `attacker` está `Cursed`.
 * specs/040: también `undefined` si `defender` es inmune a `TraitKiller` (la habilidad se trata como no declarada
 * para ese golpe, así que ni siquiera consume su tirada).
 */
function findMatchingTraitKiller(attacker: BattleUnit, defender: BattleUnit): Extract<Ability, { kind: 'TraitKiller' }> | undefined {
  if ((attacker.curseRemainingSeconds ?? 0) > 0) return undefined
  if (isImmuneToAbility(defender, 'TraitKiller')) return undefined

  for (const ability of attacker.abilities ?? []) {
    if (ability.kind !== 'TraitKiller') continue

    const matches =
      defender.specialClassification !== undefined
        ? ability.targetClassifications.includes(defender.specialClassification)
        : ability.targetClassifications.includes(defender.classification ?? 'Traitless')

    if (matches) return ability
  }

  return undefined
}

/**
 * Aplica `effect` a `defender`, salvo inmunidad — se refresca, no se acumula (specs/009 FR-008).
 * specs/015-catalogo-habilidades-combate: generaliza de "solo Curse" a cualquier `EffectType`; aplica la
 * `resistantTo` del defensor a la duración antes de escribirla (FR-009) — duración ≤0 resultante ⇒ no se aplica.
 * specs/041-cabezas-de-canon (research.md Decisión 3): extraída de `applyOnHitEffect` para que el efecto del cañón
 * especial (`applyCannonHead`) use exactamente las mismas reglas de inmunidad/resistencia/refresco que el combate normal.
 */
function applyEffectToDefender(effect: AppliesEffect, defender: BattleUnit): void {
  if (defender.immuneEffects?.includes(effect.type)) return

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

/** Aplica `attacker.appliesEffect` (si lo declara) a `defender` on-hit — ver `applyEffectToDefender`. */
function applyOnHitEffect(attacker: BattleUnit, defender: BattleUnit): void {
  if (attacker.appliesEffect) applyEffectToDefender(attacker.appliesEffect, defender)
}

/**
 * specs/039-habilidades-control-defensa (FR-004/FR-005, research.md Decisión 5): desplaza `unit` `distance` unidades
 * hacia su propia base — menor `x` para el jugador, mayor `x` para el enemigo — sin sacarla del carril. El jugador no
 * baja de `x = 0` (origen de despliegue); el enemigo no supera `laneLength - width` (borde de aparición), o no tiene tope
 * superior si `laneLength` no se conoce. Una unidad ya en (o más allá de) ese borde no se desplaza: los `min`/`max` anidados
 * evitan que el tope la "devuelva" hacia el interior del carril en los casos legítimos fuera de rango (un enemigo que
 * ya cruzó `x < 0` para atacar la base del jugador, o un jugador pasado de `laneLength - width` atacando la base enemiga).
 */
function knockBack(unit: BattleUnit, distance: number, laneLength?: number): void {
  if (unit.team === 'Player') {
    unit.x = Math.max(Math.min(unit.x, 0), unit.x - distance)
    return
  }

  const maxX = laneLength === undefined ? Number.POSITIVE_INFINITY : laneLength - unit.width
  unit.x = Math.min(Math.max(unit.x, maxX), unit.x + distance)
}

/**
 * specs/041-cabezas-de-canon (FR-003..FR-005, research.md Decisiones 2-4). Efecto secundario del cañón especial sobre
 * un enemigo alcanzado que sigue vivo — función pura: devuelve una copia, no muta `unit`. Retroceso reutiliza `knockBack`
 * (specs/039) y respeta `immuneAbilities` (specs/040); los efectos de estado reutilizan `applyEffectToDefender`, así que
 * inmunidad (`immuneEffects`), resistencia (`resistantTo`) y refresco son exactamente los del combate normal.
 * El cañón NO es un golpe de unidad: no pasa por `applyHit` (no activa Esquivar/Sobrevivir/Escudo ni Dinero Extra).
 */
export function applyCannonHead(unit: BattleUnit, head: CannonHeadSpec, laneLength: number): BattleUnit {
  const next = { ...unit }

  if (head.kind === 'Knockback') {
    if (!isImmuneToAbility(next, 'Knockback')) knockBack(next, head.distance, laneLength)
  } else {
    applyEffectToDefender(head.effect, next)
  }

  return next
}

/**
 * specs/039-habilidades-control-defensa (research.md Decisiones 2 y 3): un único golpe de `attacker` contra `defender`,
 * mutando al defensor. Tubería unificada — antes duplicada entre `applyDamageSequence` y la salpicadura de
 * `resolveAreaEngagement` — donde vive el orden de resolución por golpe (FR-006):
 * `Dodge` del defensor (si acierta, el golpe termina aquí) → daño base (Debilitar × Fortalecer × TraitTargeting ×
 * TraitResistance) → `MassiveDamage` (specs/038) → `Critical` (specs/016) → `TraitKiller` (specs/038) o, si no, descuento
 * de `shieldRemainingHp` y de `hp` (specs/038) → `Survive` del defensor (solo si el resultado fue letal) → crédito de
 * `ExtraMoney` (`defeatBounty`, solo en un golpe letal del jugador contra un enemigo, specs/040) → `Knockback` del
 * atacante (solo si el defensor sigue vivo) → efectos on-hit. Un defensor con `immuneAbilities` (specs/040) hace que
 * `MassiveDamage`/`TraitKiller`/`Knockback` se traten como no declaradas para ese golpe. Cada `random()` solo se consume
 * si la habilidad correspondiente aplica, así que una unidad sin las habilidades de `specs/038`/`specs/039`/`specs/040`
 * nunca consume más rolls que antes (FR-009). `laneLength` solo lo usa `Knockback` (tope del lado enemigo).
 */
function applyHit(attacker: BattleUnit, defender: BattleUnit, random: () => number, laneLength?: number): void {
  // specs/039-habilidades-control-defensa (FR-002/FR-006): Esquivar anula el golpe entero — sin daño, sin escudo
  // consumido, sin Killer/Retroceso ni efecto on-hit — y termina aquí sin consumir ningún roll posterior.
  const dodge = findActiveAbility(defender, 'Dodge')
  if (dodge !== undefined && random() < dodge.chance) return

  const baseAmount = effectiveDamage(attacker) * resolveAbilityMultiplier(attacker, defender) * resolveResistanceMultiplier(defender, attacker)

  // specs/040-dinero-extra-inmunidades (FR-005/FR-006): un defensor inmune a Golpe Letal ignora la habilidad por completo.
  const massiveDamage = isImmuneToAbility(defender, 'MassiveDamage') ? undefined : findActiveAbility(attacker, 'MassiveDamage')
  const isMassive = massiveDamage !== undefined && random() < massiveDamage.chance
  const afterMassive = isMassive ? baseAmount * massiveDamage!.damageMultiplier : baseAmount

  const isCritical = attacker.attackType === 'Critical' && random() < (attacker.criticalChance ?? 0)
  const finalDamage = afterMassive * (isCritical ? 2 : 1)

  const killer = findMatchingTraitKiller(attacker, defender)
  const isKillingBlow = killer !== undefined && random() < killer.chance

  if (isKillingBlow) {
    defender.hp = 0
  } else {
    let remaining = finalDamage
    if ((defender.shieldRemainingHp ?? 0) > 0) {
      const absorbed = Math.min(defender.shieldRemainingHp!, remaining)
      defender.shieldRemainingHp = defender.shieldRemainingHp! - absorbed
      remaining -= absorbed
    }
    defender.hp = Math.max(0, defender.hp - remaining)
  }

  // specs/039-habilidades-control-defensa (FR-003/FR-006): Sobrevivir solo interviene ante un resultado letal —
  // incluida una eliminación instantánea de Killer, y evaluado tras descontar el escudo — dejando al defensor con 1 de vida.
  const survive = findActiveAbility(defender, 'Survive')
  if (defender.hp <= 0 && survive !== undefined && random() < survive.chance) defender.hp = 1

  // specs/040-dinero-extra-inmunidades (FR-001/FR-003/FR-004, research.md Decisión 3): el crédito de la derrota se fija
  // aquí, en el golpe letal, para evaluar `Curse` del atacante en el instante exacto del golpe — `stepSimulation` suma
  // después el `defeatBounty` de los enemigos derrotados a la energía del jugador. Solo golpes de unidad (el cañón
  // especial baja `hp` directamente y nunca pasa por aquí) y solo del jugador contra enemigos.
  if (defender.hp <= 0 && attacker.team === 'Player' && defender.team === 'Enemy') {
    const extraMoney = findActiveAbility(attacker, 'ExtraMoney')
    if (extraMoney !== undefined) defender.defeatBounty = extraMoney.energyBonus
  }

  // specs/039-habilidades-control-defensa (FR-004/FR-006): Retroceso solo empuja a un defensor que sigue con vida;
  // un objetivo muerto se descarta igual que hoy y su desplazamiento no tendría efecto observable.
  // specs/040 (FR-005/FR-006): un defensor inmune a Retroceso nunca se desplaza, y la habilidad no consume su tirada.
  const knockback = isImmuneToAbility(defender, 'Knockback') ? undefined : findActiveAbility(attacker, 'Knockback')
  if (defender.hp > 0 && knockback !== undefined && random() < knockback.chance) knockBack(defender, knockback.distance, laneLength)

  applyOnHitEffect(attacker, defender)
}

/**
 * specs/016-multigolpe-critico: aplica el ataque de `attacker` contra `defender`, mutando `defender.hp`.
 * `MultiHit` repite `hitsPerSequence` impactos independientes dentro de esta misma llamada, deteniéndose en
 * cuanto `defender.hp` llega a 0 (FR-004: los golpes restantes se descartan, nunca se trasladan a otro objetivo;
 * FR-005: al ser atómica por invocación, la siguiente secuencia siempre vuelve a empezar en el primer golpe —
 * no hay progreso que reanudar entre ticks, ver plan.md Key Design Decision 3). Cada impacto se resuelve con `applyHit`
 * (specs/039), donde viven `Critical` (duplica el impacto con probabilidad `criticalChance`) y el resto de reglas por golpe.
 */
function applyDamageSequence(attacker: BattleUnit, defender: BattleUnit, random: () => number, laneLength?: number): void {
  const hits = attacker.attackType === 'MultiHit' ? Math.max(1, attacker.hitsPerSequence ?? 1) : 1

  for (let hit = 0; hit < hits; hit += 1) {
    if (defender.hp <= 0) break
    applyHit(attacker, defender, random, laneLength)
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
  laneLength?: number,
): { a: BattleUnit; b: BattleUnit } {
  const nextA = { ...a, attackCooldownRemaining: a.attackCooldownRemaining - deltaSeconds }
  const nextB = { ...b, attackCooldownRemaining: b.attackCooldownRemaining - deltaSeconds }

  // specs/015-catalogo-habilidades-combate (US2/FR-004): congelada nunca inflige daño, iniciadora o no
  // (una unidad congelada puede ser descubierta como objetivo de otra unidad — ver simulation.ts).
  if (nextA.attackCooldownRemaining <= 0 && nextA.state !== 'Dead' && (nextA.freezeRemainingSeconds ?? 0) <= 0) {
    applyDamageSequence(nextA, nextB, random, laneLength)
    nextA.attackCooldownRemaining += nextA.attackIntervalSeconds
  }
  if (nextB.attackCooldownRemaining <= 0 && nextB.state !== 'Dead' && (nextB.freezeRemainingSeconds ?? 0) <= 0) {
    applyDamageSequence(nextB, nextA, random, laneLength)
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
 * specs/039-habilidades-control-defensa (research.md Decisión 2): cada objetivo de salpicadura recibe exactamente un
 * golpe de `applyHit` (sobre una copia — esta función nunca muta a sus entradas), con las mismas reglas por golpe
 * que el objetivo primario; el atacante se evalúa con su estado previo al intercambio con el primario.
 */
export function resolveAreaEngagement(
  attacker: BattleUnit,
  primaryTarget: BattleUnit,
  splashTargets: BattleUnit[],
  deltaSeconds: number,
  random: () => number = Math.random,
  laneLength?: number,
): { attacker: BattleUnit; primaryTarget: BattleUnit; splashTargets: BattleUnit[] } {
  const attackerFires =
    attacker.attackCooldownRemaining - deltaSeconds <= 0 && attacker.state !== 'Dead' && (attacker.freezeRemainingSeconds ?? 0) <= 0
  const { a: nextAttacker, b: nextPrimary } = resolveEngagement(attacker, primaryTarget, deltaSeconds, random, laneLength)

  const nextSplashTargets = splashTargets.map((target) => {
    if (!attackerFires || target.state === 'Dead') return target

    const nextTarget = { ...target }
    applyHit(attacker, nextTarget, random, laneLength)
    if (nextTarget.hp <= 0) nextTarget.state = 'Dead'
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

      // specs/038-catalogo-habilidades-avanzado (FR-001, spec.md Historia 1 Escenario 4): mismo alcance que
      // `Critical` — TraitKiller/Shield no aplican aquí, una base no es un BattleUnit (sin classification/escudo).
      const massiveDamage = findActiveAbility(nextAttacker, 'MassiveDamage')
      const isMassive = massiveDamage !== undefined && random() < massiveDamage.chance
      const afterMassive = isMassive ? effectiveDamage(nextAttacker) * massiveDamage!.damageMultiplier : effectiveDamage(nextAttacker)

      const isCritical = nextAttacker.attackType === 'Critical' && random() < (nextAttacker.criticalChance ?? 0)
      hp = Math.max(0, hp - afterMassive * (isCritical ? 2 : 1))
    }
    nextAttacker.attackCooldownRemaining += nextAttacker.attackIntervalSeconds
  }

  return { attacker: nextAttacker, base: { ...base, hp } }
}
