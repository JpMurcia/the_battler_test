# Data Model: Cuerpo Ototo

## `src/data/ototoCorps.ts` (nuevo módulo puro)

```ts
export type OtotoBuildingId = 'foundation' | 'style'

export interface OtotoBuildingDefinition {
  id: OtotoBuildingId
  name: string
  materialsCost: number
  durationMs: number
}

export const OTOTO_BUILDINGS: OtotoBuildingDefinition[] = [
  { id: 'foundation', name: 'Base', materialsCost: 40, durationMs: 15 * 60_000 },
  { id: 'style', name: 'Estilo', materialsCost: 40, durationMs: 15 * 60_000 },
]

export interface OtotoConstruction {
  building: OtotoBuildingId
  choice: string // ClassificationType si building==='foundation', EffectType si building==='style'
  startedAtMs: number
}

export function getConstructionRemainingMs(construction: OtotoConstruction, definition: OtotoBuildingDefinition, nowMs: number): number {
  return Math.max(0, definition.durationMs - (nowMs - construction.startedAtMs))
}

export function isConstructionReady(construction: OtotoConstruction, definition: OtotoBuildingDefinition, nowMs: number): boolean {
  return getConstructionRemainingMs(construction, definition, nowMs) <= 0
}

/** research.md Decisión 4 — provisionales, no balanceados. */
export const OTOTO_DAMAGE_REDUCTION = 0.7 // multiplicador de daño RECIBIDO del rasgo elegido (−30%)
export const OTOTO_DEBUFF_RESISTANCE = 0.5 // multiplicador de duración del debuff elegido (mitad)
```

## `useMetaStore` — campos y acciones nuevas

| Campo/acción | Tipo | Descripción |
|---|---|---|
| `ototoConstruction` | `OtotoConstruction \| null` | Construcción en curso o completa sin reclamar — `null` si no hay ninguna |
| `ototoBuildings` | `{ foundation?: ClassificationType; style?: EffectType }` | Elección activa por categoría — ausente = esa construcción nunca se completó |
| `startOtotoConstruction(building, choice)` | `(building: OtotoBuildingId, choice: string) => boolean` | `false` si ya hay una construcción en curso o `gamatotoMaterials` insuficientes; si no, descuenta el costo, registra `{ building, choice, startedAtMs: Date.now() }`, persiste |
| `claimOtotoConstruction()` | `() => boolean` | `false` si no hay construcción o no está lista; si no, escribe `ototoBuildings[construction.building] = construction.choice`, limpia `ototoConstruction`, persiste |

## `useGameStore.deployUnit()` — extensión sin cambio de tipo

Al construir el `unit: BattleUnit`, antes del `set({...})`:
```ts
const { foundation, style } = useMetaStore.getState().ototoBuildings
const abilities = foundation
  ? [{ kind: 'TraitResistance', targetClassifications: [foundation], damageTakenMultiplier: OTOTO_DAMAGE_REDUCTION }, ...(cat.abilities ?? [])]
  : cat.abilities
const resistantTo = style
  ? [{ effect: style, durationMultiplier: OTOTO_DEBUFF_RESISTANCE }, ...(cat.resistantTo ?? [])]
  : cat.resistantTo
```
`unit.abilities`/`unit.resistantTo` usan estos valores en vez de `cat.abilities`/`cat.resistantTo` directos.

## Dexie (`src/db/index.ts`)

```ts
export interface OtotoCorpsRow {
  id: 1 // fila única (singleton)
  construction: OtotoConstruction | null
  buildings: { foundation?: ClassificationType; style?: EffectType }
}
```

`this.version(15).stores({ ototoCorps: 'id' })`. Sin seed en `ensureDefaultProfile()` — ausencia de fila = sin construcciones (mismo patrón que `gamatoto`).

## `types/screen.ts`

`PanelId` gana `'OtotoCorps'`.
