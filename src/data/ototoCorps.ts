/**
 * specs/035-ototo-corps. Catálogo puro de construcciones (manual técnico §9.2) — sin dependencia de
 * React/Zustand (Constitución § IV/VI). Mismo patrón de progreso por timestamp que `specs/034-gamatoto`.
 */

import type { AppliesEffect, CannonHeadSpec, ClassificationType, EffectType } from '../engine/types'

export type OtotoBuildingId = 'foundation' | 'style' | 'cannonHead'

export interface OtotoBuildingDefinition {
  id: OtotoBuildingId
  name: string
  materialsCost: number
  durationMs: number
}

export const OTOTO_BUILDINGS: OtotoBuildingDefinition[] = [
  { id: 'foundation', name: 'Base', materialsCost: 40, durationMs: 15 * 60_000 },
  { id: 'style', name: 'Estilo', materialsCost: 40, durationMs: 15 * 60_000 },
  /** specs/041-cabezas-de-canon (FR-001). Valores provisionales, no balanceados — mismos que Base/Estilo. */
  { id: 'cannonHead', name: 'Cabeza de Cañón', materialsCost: 40, durationMs: 15 * 60_000 },
]

export interface OtotoConstruction {
  building: OtotoBuildingId
  /** `ClassificationType` si `building === 'foundation'`, `EffectType` si `'style'`, `CannonHeadEffect` si `'cannonHead'`. */
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

/** specs/041-cabezas-de-canon (FR-002). Efecto secundario elegible del cañón especial: Retroceso o un efecto de estado. */
export type CannonHeadEffect = 'Knockback' | EffectType

export const CANNON_HEAD_OPTIONS: CannonHeadEffect[] = ['Knockback', 'Weaken', 'Freeze', 'Slow', 'Curse']

/** Elección activa por construcción ya completada — ausente = esa construcción nunca se completó (specs/035, ampliado en specs/041). */
export interface OtotoBuildings {
  foundation?: ClassificationType
  style?: EffectType
  cannonHead?: CannonHeadEffect
}

/** Nombres en español para la UI (el id persistido sigue siendo la clave). */
export const CANNON_HEAD_LABELS: Record<CannonHeadEffect, string> = {
  Knockback: 'Retroceso',
  Weaken: 'Debilitar',
  Freeze: 'Congelar',
  Slow: 'Ralentizar',
  Curse: 'Maldecir',
}

/** specs/041 research.md Decisión 7 — provisionales, no balanceados. Mayor que el Retroceso de una unidad: el cañón es de carga lenta. */
export const CANNON_KNOCKBACK_DISTANCE = 40

export const CANNON_DEBUFFS: Record<EffectType, AppliesEffect> = {
  Weaken: { type: 'Weaken', durationSeconds: 5, magnitude: 0.5 },
  Freeze: { type: 'Freeze', durationSeconds: 3 },
  Slow: { type: 'Slow', durationSeconds: 5, magnitude: 0.5 },
  Curse: { type: 'Curse', durationSeconds: 5 },
}

/** Traduce la elección persistida al valor que consume el motor (`applyCannonHead`, src/engine/combat.ts). */
export function getCannonHeadSpec(effect: CannonHeadEffect): CannonHeadSpec {
  if (effect === 'Knockback') return { kind: 'Knockback', distance: CANNON_KNOCKBACK_DISTANCE }
  return { kind: 'Effect', effect: CANNON_DEBUFFS[effect] }
}
