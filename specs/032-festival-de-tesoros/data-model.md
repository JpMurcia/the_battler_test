# Data Model: Festival de Tesoros

## `src/data/treasureFestival.ts` (nuevo módulo puro)

```ts
import type { EventTimeWindow } from './events'

export interface TreasureFestival {
  id: string
  name: string
  currencyMultiplier: number
  timeWindows: EventTimeWindow[]
}

export const TREASURE_FESTIVALS: TreasureFestival[] // 1 entrada de bootstrap, ventana amplia (mismo criterio que EVENT_BANNERS)

export function getActiveTreasureFestival(festivals: TreasureFestival[], nowMs: number): TreasureFestival | undefined
// return festivals.find(f => f.timeWindows.some(w => nowMs >= w.startMs && nowMs < w.endMs))
// Recibe el catálogo como parámetro (no lee TREASURE_FESTIVALS internamente) para quedar testeable con
// fixtures propias, sin depender de que las fechas de bootstrap sigan cubriendo "ahora" en el futuro.

export function getFestivalTimeRemainingMs(festival: TreasureFestival, nowMs: number): number
// milisegundos hasta que termine la ventana activa que contiene a nowMs (0 si ninguna lo contiene)
```

Sin entidades persistidas — todo el estado es derivado de `Date.now()` en cada lectura (research.md Decisión 1).

## Puntos de integración (sin cambios de tipo en archivos existentes)

- `src/screens/LevelSelectScreen.tsx`: nuevo componente `TreasureFestivalBanner` (sin props), llama a `getActiveTreasureFestival`/`getFestivalTimeRemainingMs` en un `setInterval` local de 1s.
- `src/screens/BattleScreen.tsx`, `BattleOutcomeWatcher`: `getActiveTreasureFestival(Date.now())?.currencyMultiplier ?? 1` como 4º factor multiplicativo de `addCurrency(...)`.
