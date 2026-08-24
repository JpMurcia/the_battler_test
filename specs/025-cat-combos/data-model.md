# Data Model: Cat Combos

## `CatCombo` / `CatComboBonus` (nuevo — `src/data/catCombos.ts`)

```ts
export interface CatComboBonus {
  type: 'EnergyRegenMultiplier' | 'CurrencyRewardMultiplier' // mismo shape que TreasureSetPassiveBonus (specs/013)
  value: number
}

export interface CatCombo {
  id: string
  name: string
  memberCatIds: string[] // 2+ catIds de src/data/cats.ts — FR-001/FR-010
  bonus: CatComboBonus
}
```

## `CAT_COMBOS` (fixture — 2 combos, research.md Decisión 3)

| `id` | `name` | `memberCatIds` | `bonus.type` | `bonus.value` |
|---|---|---|---|---|
| `combo-nucleo-original` | Núcleo Original | `['basic-cat', 'tank-cat']` | `EnergyRegenMultiplier` | `1.05` |
| `combo-especialistas-control` | Especialistas de Control | `['weaken-cat', 'slow-cat']` | `CurrencyRewardMultiplier` | `1.1` |

Ambos grupos son subconjuntos ya existentes de `CATS` (`src/data/cats.ts`) — ningún gato nuevo se crea para esta spec (FR-010, Constitución § III no aplica).

## `getCompletedCombos(catIds: string[]): CatCombo[]` (nuevo — `src/data/catCombos.ts`)

```ts
export function getCompletedCombos(catIds: string[]): CatCombo[] {
  const catIdSet = new Set(catIds)
  return CAT_COMBOS.filter((combo) => combo.memberCatIds.every((memberId) => catIdSet.has(memberId)))
}
```

Función pura — sin acceso a `useMetaStore`/Dexie. Recibe cualquier lista de catIds (la formación activa persistida, o una selección local aún sin guardar) y devuelve los combos cuyos miembros están **todos** presentes (FR-002/FR-004). Testeada directamente con arrays de catIds fijos (`tests/unit/data/catCombos.test.ts`), sin store ni componente.

## `getComboMemberStatus(combo, ownedCatIds, selectedCatIds)` (nuevo — `src/data/catCombos.ts`)

```ts
export interface ComboMemberStatus {
  catId: string
  owned: boolean // el jugador tiene este catId en ownedCats
  selected: boolean // este catId está en la formación consultada (persistida o en edición)
}

export function getComboMemberStatus(
  combo: CatCombo,
  ownedCatIds: string[],
  selectedCatIds: string[],
): ComboMemberStatus[]
```

Soporta FR-007 (distinguir, para un combo incompleto, un miembro no poseído de uno poseído pero no incluido en la formación) sin duplicar la lógica de completitud de `getCompletedCombos` — ambas funciones comparten el mismo criterio de "todos los miembros presentes", solo que esta expone el detalle por miembro para la UI de `TeamScreen` en vez de un booleano agregado.

## `useMetaStore.getActiveComboBonusMultiplier(type)` (nuevo — `src/state/useMetaStore.ts`)

```ts
getActiveComboBonusMultiplier: (type: CatComboBonus['type']) => number
```

Implementación: `getCompletedCombos(get().activeTeamCatIds).filter((combo) => combo.bonus.type === type).reduce((product, combo) => product * combo.bonus.value, 1)` — mismo patrón `reduce` que `getActiveBonusMultiplier` ya existente (`specs/013`), pero sin ningún campo de estado propio: se recalcula en cada llamada a partir de `activeTeamCatIds` (FR-009, research.md Decisión 1). Sin escritura a Dexie — nada que hidratar en `hydrate()`.

## Puntos de lectura modificados (multiplican junto al bono de tesoros ya existente)

| Archivo | Antes | Después |
|---|---|---|
| `src/state/useGameStore.ts` (`startLevel`) | `regenPerSecond: level.energyRegenPerSecond * energyRegenMultiplier` | `regenPerSecond: level.energyRegenPerSecond * energyRegenMultiplier * comboEnergyMultiplier`, con `comboEnergyMultiplier = useMetaStore.getState().getActiveComboBonusMultiplier('EnergyRegenMultiplier')` calculado junto a `energyRegenMultiplier` existente |
| `src/screens/BattleScreen.tsx` (`BattleOutcomeWatcher`, victoria) | `addCurrency(Math.round(level.currencyReward * getActiveBonusMultiplier('CurrencyRewardMultiplier')))` | `addCurrency(Math.round(level.currencyReward * getActiveBonusMultiplier('CurrencyRewardMultiplier') * getActiveComboBonusMultiplier('CurrencyRewardMultiplier')))` |

## `TeamScreen.tsx` — sección nueva "Cat Combos"

Sin entidad de datos nueva — consume `getCompletedCombos(selectedIds)`/`getComboMemberStatus` directamente sobre el estado local `selectedIds` ya existente del componente (research.md Decisión 5), junto a `ownedCats` (para resolver `owned` por miembro) ya leído del store. Renderiza, por cada `CatCombo` de `CAT_COMBOS`: nombre, lista de miembros con su nombre de gato (`CATS.find`) y estado individual (✅ en formación / poseído pero no en formación / no poseído), y un indicador agregado "Completo"/"Incompleto" derivado de si `getCompletedCombos(selectedIds)` incluye ese combo.

## Persistencia (`src/db/index.ts`)

Sin cambios — cero tablas, cero campos nuevos. `CAT_COMBOS` es contenido estático (`src/data/`, Constitución § IV); el único dato que la feature consulta (`activeTeamCatIds`) ya existe desde `specs/006`.
