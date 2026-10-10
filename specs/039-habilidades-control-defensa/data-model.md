# Data Model: Catálogo de Habilidades de Combate — Fortalecer, Esquivar, Sobrevivir y Retroceso

## `src/engine/types.ts` (modificado)

```ts
export type Ability =
  | { kind: 'TraitTargeting'; targetClassifications: (ClassificationType | SpecialClassificationType)[]; damageMultiplier: number }
  | { kind: 'Neutral'; damageMultiplier: number }
  | { kind: 'TraitResistance'; targetClassifications: (ClassificationType | SpecialClassificationType)[]; damageTakenMultiplier: number }
  | { kind: 'MassiveDamage'; chance: number; damageMultiplier: number }
  | { kind: 'TraitKiller'; targetClassifications: (ClassificationType | SpecialClassificationType)[]; chance: number }
  | { kind: 'Shield'; shieldHp: number }
  | { kind: 'SummonOnDeath'; summonCatId: string; count: number }
  /** specs/039-habilidades-control-defensa (FR-001). Mientras `hp <= maxHp * hpThresholdFraction` (inclusivo), el daño base de la unidad se multiplica por `damageMultiplier`. */
  | { kind: 'Strengthen'; hpThresholdFraction: number; damageMultiplier: number }
  /** specs/039-habilidades-control-defensa (FR-002). Probabilidad `chance` (0-1) de anular por completo un golpe recibido de otra unidad. */
  | { kind: 'Dodge'; chance: number }
  /** specs/039-habilidades-control-defensa (FR-003). Probabilidad `chance` (0-1) de quedar con `hp = 1` ante un golpe que dejaría `hp <= 0`. */
  | { kind: 'Survive'; chance: number }
  /** specs/039-habilidades-control-defensa (FR-004). Probabilidad `chance` (0-1) de desplazar `distance` al objetivo golpeado hacia su propia base. */
  | { kind: 'Knockback'; chance: number; distance: number }
```

`BattleUnit` **no cambia** (ningún campo nuevo, ver research.md Decisión 1). `Cat` (`src/data/cats.ts`) tampoco necesita ningún campo nuevo — `abilities?: Ability[]` ya acepta los cuatro miembros nuevos sin cambio de interfaz.

## `src/engine/combat.ts` (modificado)

Helper genérico — generaliza `findMassiveDamage` (`specs/038`) y bloquea por `Curse` (FR-008):

```ts
function findActiveAbility<K extends Ability['kind']>(unit: BattleUnit, kind: K): Extract<Ability, { kind: K }> | undefined {
  if ((unit.curseRemainingSeconds ?? 0) > 0) return undefined
  return unit.abilities?.find((ability): ability is Extract<Ability, { kind: K }> => ability.kind === kind)
}
```

`effectiveDamage` (FR-001) — Fortalecer se suma a Debilitar:

```ts
function effectiveDamage(unit: BattleUnit): number {
  const weakened = (unit.weakenRemainingSeconds ?? 0) > 0 ? unit.damage * (1 - (unit.weakenMagnitude ?? 0)) : unit.damage
  const strengthen = findActiveAbility(unit, 'Strengthen')
  if (strengthen !== undefined && unit.hp <= unit.maxHp * strengthen.hpThresholdFraction) return weakened * strengthen.damageMultiplier
  return weakened
}
```

Retroceso (FR-004/FR-005):

```ts
function knockBack(unit: BattleUnit, distance: number, laneLength?: number): void {
  if (unit.team === 'Player') {
    unit.x = Math.max(Math.min(unit.x, 0), unit.x - distance)
  } else {
    const maxX = laneLength === undefined ? Number.POSITIVE_INFINITY : laneLength - unit.width
    unit.x = Math.min(Math.max(unit.x, maxX), unit.x + distance)
  }
}
```

Tubería de un golpe individual (FR-006) — nueva `applyHit`, extraída del cuerpo del bucle actual de `applyDamageSequence`:

```ts
function applyHit(attacker: BattleUnit, defender: BattleUnit, random: () => number, laneLength?: number): void {
  // 1. Esquivar — anula el golpe entero, sin consumir ningún roll posterior
  const dodge = findActiveAbility(defender, 'Dodge')
  if (dodge !== undefined && random() < dodge.chance) return

  // 2-3. Daño base → Golpe Letal → Crítico (sin cambios respecto a specs/038, salvo Fortalecer dentro de effectiveDamage)
  const baseAmount = effectiveDamage(attacker) * resolveAbilityMultiplier(attacker, defender) * resolveResistanceMultiplier(defender, attacker)
  const massiveDamage = findActiveAbility(attacker, 'MassiveDamage')
  const afterMassive = massiveDamage !== undefined && random() < massiveDamage.chance ? baseAmount * massiveDamage.damageMultiplier : baseAmount
  const isCritical = attacker.attackType === 'Critical' && random() < (attacker.criticalChance ?? 0)
  const finalDamage = afterMassive * (isCritical ? 2 : 1)

  // 4. Killer, o escudo + hp (sin cambios respecto a specs/038)
  const killer = findMatchingTraitKiller(attacker, defender)
  if (killer !== undefined && random() < killer.chance) {
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

  // 5. Sobrevivir — solo ante un resultado letal (incluida la eliminación de un Killer)
  const survive = findActiveAbility(defender, 'Survive')
  if (defender.hp <= 0 && survive !== undefined && random() < survive.chance) defender.hp = 1

  // 6. Retroceso — solo si el objetivo sigue vivo
  const knockback = findActiveAbility(attacker, 'Knockback')
  if (defender.hp > 0 && knockback !== undefined && random() < knockback.chance) knockBack(defender, knockback.distance, laneLength)

  // 7. Efectos on-hit (sin cambios)
  applyOnHitEffect(attacker, defender)
}
```

`applyDamageSequence` (modificada) — queda solo como el bucle de `MultiHit`:

```ts
function applyDamageSequence(attacker: BattleUnit, defender: BattleUnit, random: () => number, laneLength?: number): void {
  const hits = attacker.attackType === 'MultiHit' ? Math.max(1, attacker.hitsPerSequence ?? 1) : 1
  for (let hit = 0; hit < hits; hit += 1) {
    if (defender.hp <= 0) break
    applyHit(attacker, defender, random, laneLength)
  }
}
```

`resolveEngagement` y `resolveAreaEngagement` ganan un parámetro final opcional `laneLength?: number` (tras `random`), reenviado a `applyDamageSequence`/`applyHit`. La salpicadura de `resolveAreaEngagement` pasa a:

```ts
const nextSplashTargets = splashTargets.map((target) => {
  if (!attackerFires || target.state === 'Dead') return target
  const nextTarget = { ...target }
  applyHit(attacker, nextTarget, random, laneLength)
  if (nextTarget.hp <= 0) nextTarget.state = 'Dead'
  return nextTarget
})
```

`resolveBaseDamage` — única modificación: `effectiveDamage(...)` ya incluye Fortalecer, así que el daño contra bases lo recibe sin más cambios (Esquivar/Sobrevivir/Retroceso no aplican a bases; no se agrega `laneLength` a su firma).

## `src/engine/simulation.ts` (modificado)

Única modificación — en `stepSimulation`, los dos llamados a combate entre unidades reciben el largo del carril del estado de la partida:

```ts
const result = resolveAreaEngagement(attacker, primary, splashTargets, deltaSeconds, Math.random, state.laneLength)
// ...
const result = resolveEngagement(attacker, primary, deltaSeconds, Math.random, state.laneLength)
```

## `src/screens/shared/UnitDetailPanel.tsx` (modificado)

`describeAbility` se reescribe como `switch (ability.kind)` exhaustivo (el `else` implícito actual para `SummonOnDeath` ya no es válido con más miembros en la unión), con cuatro casos nuevos:

| `kind` | Texto |
|---|---|
| `Strengthen` | `Fortalecer (≤{umbral %} HP, x{multiplicador})` |
| `Dodge` | `Esquivar ({chance %})` |
| `Survive` | `Sobrevivir ({chance %})` |
| `Knockback` | `Retroceso ({chance %}, {distance})` |

## `src/data/cats.ts` (modificado — datos semilla de demostración)

Cuatro gatos nuevos, añadidos tras los de `specs/038` y antes del spread de `SEED_CATS_AS_CATS` (sin modificar ningún gato existente, FR-009). Misma forma que los de `specs/038`: `attackType: 'Single'`, `attackRange: 0`, `classification: 'Traitless'`, sin `spriteKey` (fallback `Graphics`):

| `id` | Nombre | Coste / recarga | HP / daño | Vel. / ancho / intervalo | Rareza | `abilities` |
|---|---|---|---|---|---|---|
| `strengthen-cat` | Gato Enfurecido | 45 / 7 s | 110 / 9 | 14 / 20 / 1.4 s | Raro | `[{ kind: 'Strengthen', hpThresholdFraction: 0.5, damageMultiplier: 2 }]` |
| `dodge-cat` | Gato Escurridizo | 40 / 6 s | 70 / 7 | 22 / 16 / 1.1 s | Raro | `[{ kind: 'Dodge', chance: 0.25 }]` |
| `survivor-cat` | Gato Superviviente | 50 / 8 s | 90 / 8 | 12 / 20 / 1.5 s | Raro | `[{ kind: 'Survive', chance: 0.3 }]` |
| `knockback-cat` | Gato Empujón | 55 / 8 s | 130 / 12 | 12 / 22 / 1.8 s | Raro | `[{ kind: 'Knockback', chance: 0.3, distance: 30 }]` |

Valores provisionales no balanceados (mismo estatus que los de `specs/038`) — ajustables sin tocar código (Constitución § IV).
