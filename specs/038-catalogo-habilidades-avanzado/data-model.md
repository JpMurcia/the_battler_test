# Data Model: Catálogo de Habilidades de Combate — Golpe Letal, Killers, Escudo e Invocar

## `src/engine/types.ts` (modificado)

```ts
export type Ability =
  | { kind: 'TraitTargeting'; targetClassifications: (ClassificationType | SpecialClassificationType)[]; damageMultiplier: number }
  | { kind: 'Neutral'; damageMultiplier: number }
  | { kind: 'TraitResistance'; targetClassifications: (ClassificationType | SpecialClassificationType)[]; damageTakenMultiplier: number }
  /** specs/038-catalogo-habilidades-avanzado (FR-001). Probabilidad `chance` de multiplicar el daño de un golpe por `damageMultiplier`. */
  | { kind: 'MassiveDamage'; chance: number; damageMultiplier: number }
  /** specs/038-catalogo-habilidades-avanzado (FR-002). Probabilidad `chance` de eliminar instantáneamente (hp → 0) a un objetivo de alguno de `targetClassifications`. */
  | { kind: 'TraitKiller'; targetClassifications: (ClassificationType | SpecialClassificationType)[]; chance: number }
  /** specs/038-catalogo-habilidades-avanzado (FR-003). Al desplegarse/generarse, inicializa `BattleUnit.shieldRemainingHp` en `shieldHp`. */
  | { kind: 'Shield'; shieldHp: number }
  /** specs/038-catalogo-habilidades-avanzado (FR-005). Al morir la unidad que lo declara, genera `count` BattleUnit de `summonCatId`. */
  | { kind: 'SummonOnDeath'; summonCatId: string; count: number }
```

`BattleUnit` gana un campo opcional nuevo:

```ts
export interface BattleUnit {
  // ...campos existentes sin cambios...
  /** specs/038-catalogo-habilidades-avanzado (FR-003/FR-004). Ausente/0 = sin escudo activo. Absorbe daño entrante antes que `hp`. */
  shieldRemainingHp?: number
}
```

`Cat` (`src/data/cats.ts`) no necesita ningún campo nuevo — `abilities?: Ability[]` ya acepta los cuatro miembros nuevos sin cambio de interfaz.

## `src/engine/combat.ts` (modificado)

Dos helpers nuevos, mismo estilo que `resolveAbilityMultiplier`/`resolveResistanceMultiplier`:

```ts
/** Busca la primera Ability.MassiveDamage del atacante; undefined si no declara ninguna. */
function findMassiveDamage(attacker: BattleUnit): Extract<Ability, { kind: 'MassiveDamage' }> | undefined

/** Busca la primera Ability.TraitKiller del atacante cuyo targetClassifications matchee al defensor
 *  (mismo algoritmo de exclusión de tipos especiales que resolveAbilityMultiplier). */
function findMatchingTraitKiller(attacker: BattleUnit, defender: BattleUnit): Extract<Ability, { kind: 'TraitKiller' }> | undefined
```

`applyDamageSequence` (modificada) — nuevo orden de resolución por golpe:

```ts
for (let hit = 0; hit < hits; hit += 1) {
  if (defender.hp <= 0) break

  const baseAmount = effectiveDamage(attacker) * resolveAbilityMultiplier(attacker, defender) * resolveResistanceMultiplier(defender, attacker)
  const massiveDamage = findMassiveDamage(attacker)
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
  applyOnHitEffect(attacker, defender)
}
```

`resolveAreaEngagement` (splash) replica el mismo orden (`MassiveDamage` → `Critical` → `TraitKiller` → Shield) en su `map` sobre `splashTargets`, en vez de solo `effectiveDamage(attacker) * multiplier` como hoy.

`resolveBaseDamage` (modificada) — igual que ya hace con `Critical`, agrega el roll de `MassiveDamage` antes de aplicarlo (`TraitKiller`/`Shield` no aplican: una base no es un `BattleUnit`, no tiene `classification` ni `shieldRemainingHp`):

```ts
const massiveDamage = findMassiveDamage(nextAttacker)
const isMassive = massiveDamage !== undefined && random() < massiveDamage.chance
const afterMassive = isMassive ? effectiveDamage(nextAttacker) * massiveDamage!.damageMultiplier : effectiveDamage(nextAttacker)
const isCritical = nextAttacker.attackType === 'Critical' && random() < (nextAttacker.criticalChance ?? 0)
hp = Math.max(0, hp - afterMassive * (isCritical ? 2 : 1))
```

## `src/engine/simulation.ts` (modificado)

El mapeo de campos de `spawnEnemyUnit` se generaliza a una función nueva:

```ts
function spawnUnitFromCat(
  catId: string,
  team: 'Player' | 'Enemy',
  x: number,
  enemyStrengthMultiplier: number,
  unitSpeedMultiplier: number,
): BattleUnit | null
```

- `hp`/`damage` solo se escalan por `enemyStrengthMultiplier` cuando `team === 'Enemy'` (antes se aplicaba siempre, porque la función solo se usaba para enemigos).
- `shieldRemainingHp` se inicializa buscando `cat.abilities?.find(a => a.kind === 'Shield')?.shieldHp`.
- `spawnEnemyUnit(catId, enemyStrengthMultiplier, laneLength, unitSpeedMultiplier)` se conserva como envoltorio delgado: resuelve `x = laneLength - cat.width` (requiere su propio `CATS.find` para conocer `width`, que el llamador del spawn de oleada no tiene) y delega en `spawnUnitFromCat(catId, 'Enemy', x, ...)` — mismo resultado que antes, ambos call sites del spawn de oleada quedan sin cambios.

Nuevo paso en `stepSimulation`, inmediatamente antes de `const units = Array.from(byId.values()).filter(...)`:

```ts
const summoned: BattleUnit[] = []
for (const unit of byId.values()) {
  if (unit.state !== 'Dead') continue
  for (const ability of unit.abilities ?? []) {
    if (ability.kind !== 'SummonOnDeath') continue
    for (let i = 0; i < ability.count; i += 1) {
      const newUnit = spawnUnitFromCat(ability.summonCatId, unit.team, unit.x, enemyStrengthMultiplier, state.unitSpeedMultiplier)
      if (newUnit) summoned.push(newUnit)
    }
  }
}

const units = [...Array.from(byId.values()).filter((unit) => unit.state !== 'Dead'), ...summoned]
```

## `src/state/useGameStore.ts` (modificado)

`deployUnit`: junto a `curseRemainingSeconds: 0`, agrega:

```ts
shieldRemainingHp: cat.abilities?.find((a) => a.kind === 'Shield')?.shieldHp,
```

## `src/data/cats.ts` (modificado — datos semilla de demostración)

Se asigna cada capacidad nueva a al menos una unidad ya existente (sin crear gatos nuevos), mismo criterio que `specs/015`:

- **`MassiveDamage`**: una unidad de daño único ya existente gana `{ kind: 'MassiveDamage', chance: 0.05, damageMultiplier: 3 }`.
- **`TraitKiller`**: 2 unidades ganan `{ kind: 'TraitKiller', targetClassifications: ['Zombie'], chance: 0.15 }` y `{ kind: 'TraitKiller', targetClassifications: ['Metal'], chance: 0.15 }` respectivamente (Zombie Killer / Metálico Killer — prioridad elegida en `spec.md` Assumptions).
- **`Shield`**: una unidad de vida baja ya existente gana `{ kind: 'Shield', shieldHp: 100 }`.
- **`SummonOnDeath`**: una unidad ya existente gana `{ kind: 'SummonOnDeath', summonCatId: '<catId de una unidad barata ya existente>', count: 1 }`.

La elección exacta de qué `catId` recibe cada capacidad se resuelve durante `/speckit-tasks`/implementación (no bloquea el plan — mismo nivel de detalle que `specs/015` Assumptions, que tampoco fijó los `catId` exactos en el documento de planeación).
