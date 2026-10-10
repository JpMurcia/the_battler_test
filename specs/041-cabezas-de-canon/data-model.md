# Data Model: Cabezas de Cañón (Ototo Corps)

## `src/engine/types.ts` (modificado)

```ts
/**
 * specs/041-cabezas-de-canon (FR-003..FR-005). Efecto secundario del cañón especial ya traducido desde el catálogo del
 * Cuerpo Ototo — el motor no importa `src/data/`, así que el catálogo (`getCannonHeadSpec`) construye este valor.
 */
export type CannonHeadSpec =
  | { kind: 'Knockback'; distance: number }
  | { kind: 'Effect'; effect: AppliesEffect }
```

`BattleUnit` y `Ability` no cambian.

## `src/engine/combat.ts` (modificado)

Refactor sin cambio de comportamiento — `applyOnHitEffect` extrae su cuerpo a una función compartida:

```ts
/** specs/015 (FR-008/FR-009), extraída en specs/041: aplica `effect` a `defender` respetando inmunidad y resistencia, refrescando sin acumular. */
function applyEffectToDefender(effect: AppliesEffect, defender: BattleUnit): void {
  if (defender.immuneEffects?.includes(effect.type)) return

  const resistance = defender.resistantTo?.find((entry) => entry.effect === effect.type)
  const effectiveDuration = resistance ? effect.durationSeconds * resistance.durationMultiplier : effect.durationSeconds
  if (effectiveDuration <= 0) return

  switch (effect.type) {
    // ...mismos cuatro casos de hoy (Curse / Weaken / Freeze / Slow)...
  }
}

function applyOnHitEffect(attacker: BattleUnit, defender: BattleUnit): void {
  if (attacker.appliesEffect) applyEffectToDefender(attacker.appliesEffect, defender)
}
```

Función nueva, exportada y pura (no muta su entrada):

```ts
/**
 * specs/041-cabezas-de-canon (FR-003..FR-005). Efecto secundario del cañón especial sobre un enemigo alcanzado que sigue vivo.
 * Retroceso reutiliza `knockBack` (specs/039) y respeta `immuneAbilities` (specs/040); los efectos de estado reutilizan
 * `applyEffectToDefender`, así que inmunidad, resistencia y refresco son exactamente los del combate normal.
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
```

## `src/data/ototoCorps.ts` (modificado)

```ts
import type { AppliesEffect, CannonHeadSpec, EffectType } from '../engine/types'

export type OtotoBuildingId = 'foundation' | 'style' | 'cannonHead'

export const OTOTO_BUILDINGS: OtotoBuildingDefinition[] = [
  { id: 'foundation', name: 'Base', materialsCost: 40, durationMs: 15 * 60_000 },
  { id: 'style', name: 'Estilo', materialsCost: 40, durationMs: 15 * 60_000 },
  /** specs/041-cabezas-de-canon (FR-001). Valores provisionales, no balanceados. */
  { id: 'cannonHead', name: 'Cabeza de Cañón', materialsCost: 40, durationMs: 15 * 60_000 },
]

/** specs/041 (FR-002). Efecto secundario elegible del cañón especial. */
export type CannonHeadEffect = 'Knockback' | EffectType

export const CANNON_HEAD_OPTIONS: CannonHeadEffect[] = ['Knockback', 'Weaken', 'Freeze', 'Slow', 'Curse']

export const CANNON_HEAD_LABELS: Record<CannonHeadEffect, string> = {
  Knockback: 'Retroceso',
  Weaken: 'Debilitar',
  Freeze: 'Congelar',
  Slow: 'Ralentizar',
  Curse: 'Maldecir',
}

/** Provisionales, no balanceados (research.md Decisión 7). */
export const CANNON_KNOCKBACK_DISTANCE = 40

export const CANNON_DEBUFFS: Record<EffectType, AppliesEffect> = {
  Weaken: { type: 'Weaken', durationSeconds: 5, magnitude: 0.5 },
  Freeze: { type: 'Freeze', durationSeconds: 3 },
  Slow: { type: 'Slow', durationSeconds: 5, magnitude: 0.5 },
  Curse: { type: 'Curse', durationSeconds: 5 },
}

/** Traduce la elección persistida al valor que consume el motor (`applyCannonHead`). */
export function getCannonHeadSpec(effect: CannonHeadEffect): CannonHeadSpec {
  if (effect === 'Knockback') return { kind: 'Knockback', distance: CANNON_KNOCKBACK_DISTANCE }
  return { kind: 'Effect', effect: CANNON_DEBUFFS[effect] }
}
```

`OtotoConstruction.choice` sigue siendo `string` (la elección de `cannonHead` es un `CannonHeadEffect`; la de `foundation`, un `ClassificationType`; la de `style`, un `EffectType`).

## `src/db/index.ts` y `src/state/useMetaStore.ts` (modificados)

`OtotoCorpsRow.buildings` y `useMetaStore.ototoBuildings` pasan de `{ foundation?: ClassificationType; style?: EffectType }` a:

```ts
{ foundation?: ClassificationType; style?: EffectType; cannonHead?: CannonHeadEffect }
```

`startOtotoConstruction: (building: OtotoBuildingId, choice: string) => boolean` (antes `'foundation' | 'style'`), con una comprobación adicional solo para la construcción nueva, antes de descontar nada:

```ts
if (building === 'cannonHead' && !CANNON_HEAD_OPTIONS.includes(choice as CannonHeadEffect)) return false
```

`claimOtotoConstruction` y `hydrate` no cambian (ya son genéricos sobre `building`; la fila persistida gana la clave `cannonHead` sin nueva versión de Dexie).

## `src/state/useGameStore.ts` (modificado)

`activateSpecialCannon` lee la cabeza activa y la aplica a cada enemigo alcanzado que sobrevive (el resto de la función no cambia):

```ts
const cannonHead = useMetaStore.getState().ototoBuildings.cannonHead
const headSpec = cannonHead ? getCannonHeadSpec(cannonHead) : undefined

const nextUnits = units
  .map((unit) => {
    if (unit.team !== 'Enemy' || !withinRange1D(playerBaseExtent, unit, specialCannon.areaRadius)) return unit
    const hp = Math.max(0, unit.hp - specialCannon.damage)
    const damaged = { ...unit, hp, state: hp <= 0 ? ('Dead' as const) : unit.state }
    return hp > 0 && headSpec ? applyCannonHead(damaged, headSpec, laneLength) : damaged
  })
  .filter((unit) => unit.state !== 'Dead')
```

## `src/screens/OtotoCorpsPanel.tsx` (modificado)

- Las opciones por construcción pasan a un mapa: `foundation` → rasgos (`TRAIT_OPTIONS`), `style` → debuffs (`DEBUFF_OPTIONS`), `cannonHead` → `CANNON_HEAD_OPTIONS`; el estado `choices` gana `cannonHead: CANNON_HEAD_OPTIONS[0]`.
- Para `cannonHead`, el texto de cada `<option>` y el "actual: …" usan `CANNON_HEAD_LABELS` (español); el `value` sigue siendo el id (`Knockback`, `Weaken`, …). Base y Estilo se muestran exactamente como hoy.
- `ototoBuildings[definition.id]` se indexa con `OtotoBuildingId` (sin el `as 'foundation' | 'style'` actual).

## `src/screens/BattleScreen.tsx` (modificado)

`CannonControl` lee `useMetaStore((state) => state.ototoBuildings.cannonHead)` y, si existe, muestra `Cañón · {CANNON_HEAD_LABELS[cannonHead]}` en la etiqueta; sin cabeza, la etiqueta sigue siendo `Cañón`.
