/**
 * specs/035-ototo-corps. Catálogo puro de construcciones (manual técnico §9.2) — sin dependencia de
 * React/Zustand (Constitución § IV/VI). Mismo patrón de progreso por timestamp que `specs/034-gamatoto`.
 */

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
  /** `ClassificationType` si `building === 'foundation'`, `EffectType` si `building === 'style'`. */
  choice: string
  startedAtMs: number
}

export function getConstructionRemainingMs(construction: OtotoConstruction, definition: OtotoBuildingDefinition, nowMs: number): number {
  return Math.max(0, definition.durationMs - (nowMs - construction.startedAtMs))
}

export function isConstructionReady(construction: OtotoConstruction, definition: OtotoBuildingDefinition, nowMs: number): boolean {
  return getConstructionRemainingMs(construction, definition, nowMs) <= 0
}

/** research.md Decisión 4 — provisionales, no balanceados. */
export const OTOTO_DAMAGE_REDUCTION = 0.7
export const OTOTO_DEBUFF_RESISTANCE = 0.5
