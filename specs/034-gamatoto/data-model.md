# Data Model: Gamatoto

## `src/data/gamatoto.ts` (nuevo módulo puro)

```ts
export interface GamatotoExpeditionOption {
  id: string
  name: string
  durationMs: number
  materialsReward: number
}

export const GAMATOTO_EXPEDITION_OPTIONS: GamatotoExpeditionOption[] = [
  { id: 'gamatoto-corta', name: 'Expedición corta', durationMs: 5 * 60_000, materialsReward: 5 },
  { id: 'gamatoto-media', name: 'Expedición media', durationMs: 30 * 60_000, materialsReward: 20 },
  { id: 'gamatoto-larga', name: 'Expedición larga', durationMs: 120 * 60_000, materialsReward: 60 },
]

export interface GamatotoExpedition {
  optionId: string
  startedAtMs: number
}

export function getExpeditionRemainingMs(expedition: GamatotoExpedition, option: GamatotoExpeditionOption, nowMs: number): number {
  return Math.max(0, option.durationMs - (nowMs - expedition.startedAtMs))
}

export function isExpeditionReady(expedition: GamatotoExpedition, option: GamatotoExpeditionOption, nowMs: number): boolean {
  return getExpeditionRemainingMs(expedition, option, nowMs) <= 0
}
```

Duraciones de bootstrap deliberadamente cortas (5/30/120 minutos, no horas) para que sean verificables manualmente en una sesión de desarrollo — valor de diseño provisional, no balanceado (research.md, mismo criterio que el resto del proyecto).

## `useMetaStore` — campos y acciones nuevas

| Campo/acción | Tipo | Descripción |
|---|---|---|
| `gamatotoExpedition` | `GamatotoExpedition \| null` | Expedición en curso o completa sin reclamar — `null` si no hay ninguna |
| `gamatotoMaterials` | `number` | Contador de cuenta, incrementado solo por `claimGamatotoExpedition()` |
| `startGamatotoExpedition(optionId)` | `(optionId: string) => boolean` | `false` si ya hay una expedición activa o `optionId` no existe en el catálogo; si no, registra `{ optionId, startedAtMs: Date.now() }`, persiste |
| `claimGamatotoExpedition()` | `() => boolean` | `false` si no hay expedición o no está lista (`isExpeditionReady` con `Date.now()`); si no, suma `materialsReward` a `gamatotoMaterials`, pone `gamatotoExpedition: null`, persiste |

## Dexie (`src/db/index.ts`)

```ts
export interface GamatotoRow {
  id: 1 // fila única (singleton)
  expedition: { optionId: string; startedAtMs: number } | null
  materials: number
}
```

`this.version(14).stores({ gamatoto: 'id' })`. Sin seed en `ensureDefaultProfile()` — ausencia de fila = sin expedición, 0 materiales (mismo patrón que `baseUpgrades`/`missions`).

## `types/screen.ts`

`PanelId` gana `'Gamatoto'`.
