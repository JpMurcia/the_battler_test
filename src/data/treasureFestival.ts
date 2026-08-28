import type { EventTimeWindow } from './events'

/**
 * specs/032-festival-de-tesoros. Catálogo puro de festivales de moneda — mismo tipo `EventTimeWindow`
 * que `EVENT_BANNERS` (specs/014), sin `specialStage` propia (no añade ningún nivel jugable nuevo).
 * Adapta el "Festival de Tesoro" del manual (§9.8, duplica probabilidad de tesoro) a un multiplicador
 * de moneda de victoria, porque este proyecto otorga tesoro garantizado sin probabilidad (spec.md Assumptions).
 */

export interface TreasureFestival {
  id: string
  name: string
  currencyMultiplier: number
  timeWindows: EventTimeWindow[]
}

/** Fixture de bootstrap — ventana amplia que cubre el desarrollo/pruebas actuales, mismo criterio que `EVENT_BANNERS`. */
export const TREASURE_FESTIVALS: TreasureFestival[] = [
  {
    id: 'festival-tesoros-2026',
    name: 'Festival de Tesoros',
    currencyMultiplier: 2,
    timeWindows: [{ startMs: Date.parse('2026-01-01T00:00:00Z'), endMs: Date.parse('2026-12-31T23:59:59Z') }],
  },
]

/** Recibe el catálogo como parámetro (no lee `TREASURE_FESTIVALS` internamente) para quedar testeable con fixtures propias. */
export function getActiveTreasureFestival(festivals: TreasureFestival[], nowMs: number): TreasureFestival | undefined {
  return festivals.find((festival) => festival.timeWindows.some((window) => nowMs >= window.startMs && nowMs < window.endMs))
}

/** Milisegundos hasta que termine la ventana activa que contiene a `nowMs` — 0 si ninguna lo contiene. */
export function getFestivalTimeRemainingMs(festival: TreasureFestival, nowMs: number): number {
  const activeWindow = festival.timeWindows.find((window) => nowMs >= window.startMs && nowMs < window.endMs)
  return activeWindow ? activeWindow.endMs - nowMs : 0
}
