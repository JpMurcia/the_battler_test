/**
 * specs/034-gamatoto. Catálogo puro de expediciones (manual técnico §9.1) — sin dependencia de
 * React/Zustand (Constitución § IV/VI). El progreso se deriva siempre de `nowMs - startedAtMs`,
 * nunca de un contador persistido que se desincronizaría con el tiempo real (research.md Decisión 1).
 */

export interface GamatotoExpeditionOption {
  id: string
  name: string
  durationMs: number
  materialsReward: number
}

/** Duraciones cortas deliberadas (minutos, no horas) para quedar verificables en una sesión de desarrollo. */
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
