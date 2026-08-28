# Data Model: Filtro de Gatos y Panel de Detalle de Unidad

Ningún dato nuevo se persiste en Dexie. Todas las entidades son estado efímero de UI o funciones puras derivadas de datos ya existentes.

## `src/data/catFilter.ts` (nuevo módulo puro)

```ts
export type CatFilterAbility = 'Weaken' | 'Freeze' | 'Slow' | 'Curse' | 'Critical' | 'MultiHit'

export interface CatFilterState {
  rarities: RarityType[]      // vacío = sin filtro de rareza
  trait: ClassificationType | null
  ability: CatFilterAbility | null
  mode: 'AND' | 'OR'          // combina trait+ability; sin efecto si solo uno de los dos está marcado
}

export const EMPTY_CAT_FILTER: CatFilterState = { rarities: [], trait: null, ability: null, mode: 'OR' }

export function matchesCatFilter(cat: Cat, filter: CatFilterState): boolean
```

Reglas de `matchesCatFilter`:
1. Si `filter.rarities.length > 0` y `cat.rarity` no está en esa lista (o `cat.rarity` es `undefined`) → `false`.
2. Se evalúan `traitMatch` (¿alguna `Ability` `TraitTargeting` de `cat` tiene `filter.trait` en `targetClassifications`?, `true` si `filter.trait === null`) y `abilityMatch` (¿`cat.appliesEffect?.type === filter.ability` o `cat.attackType === filter.ability`?, `true` si `filter.ability === null`).
3. Si ambos `filter.trait` y `filter.ability` están marcados: `mode === 'AND'` → `traitMatch && abilityMatch`; `mode === 'OR'` → `traitMatch || abilityMatch`.
4. Si solo uno de los dos está marcado, el resultado es directamente ese match (el otro es `true` por regla 2).

## Estado local de componente (no en ningún store)

| Campo | Vive en | Propósito |
|---|---|---|
| `filter: CatFilterState` | `TeamScreen.tsx` y `CatGuideScreen.tsx` (cada una la suya) | Criterios de filtro activos — research.md Decisión 1 |
| `sortByLevel: boolean` | Idem | Orden de la lista visible |
| `detailCatId: string \| null` | Idem | Qué gato tiene el panel de detalle abierto (`null` = cerrado) |
| `selectedFormTab: EvolutionStage` | `UnitDetailPanel.tsx` | Pestaña de forma visualizada, inicializada a `owned.evolutionStage` (research.md Decisión 6) |

## `UnitDetailPanel` — props y derivación

```ts
interface UnitDetailPanelProps {
  catId: string
  onClose: () => void
}
```

Internamente:
- `cat = CATS.find(c => c.id === catId)`, `owned = useMetaStore(s => s.ownedCats[catId])`.
- `availableForms: EvolutionStage[]` = `['Base', ...(cat.evolutions?.second ? ['Second'] : []), ...(cat.evolutions?.true ? ['True'] : [])]`.
- `statsForTab = getEffectiveCatStats(cat, selectedFormTab)` (ya existente, `src/data/cats.ts`).
- `dps = statsForTab.damage / cat.attackIntervalSeconds`.
- `nextForm`: `Base→Second` (requiere `cat.evolutions.second`) o `Second→True` (requiere `cat.evolutions.true`) según `owned.evolutionStage` — `null` si `owned.evolutionStage === 'True'` o si `cat.evolutions` no define el siguiente paso.
- `canEvolve`: `nextForm` no nulo, `owned.level >= nextForm.requiredLevel`, y (si `nextForm` es `true`) `evolutionItems[catId] >= (nextForm.requiredItemCount ?? 0)` — mismas condiciones que ya evalúa `evolveCat()` internamente, recalculadas aquí solo para habilitar/deshabilitar el botón (no duplica la mutación, solo la lectura).
