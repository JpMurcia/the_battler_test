/**
 * specs/033-misiones-catnip-challenges. Catálogo puro de misiones diarias (manual técnico §9.6) — sin
 * dependencia de React/Zustand (Constitución § IV/VI). Valores de diseño provisionales, no balanceados.
 */

export type MissionMetric = 'levelsCompleted' | 'unitsDeployed' | 'enemiesDefeated'

export interface MissionDefinition {
  id: string
  description: string
  metric: MissionMetric
  target: number
  currencyReward: number
}

export const MISSIONS: MissionDefinition[] = [
  { id: 'mision-completar-etapa', description: 'Completa 1 etapa', metric: 'levelsCompleted', target: 1, currencyReward: 50 },
  { id: 'mision-desplegar-unidades', description: 'Despliega 10 unidades', metric: 'unitsDeployed', target: 10, currencyReward: 50 },
  { id: 'mision-derrotar-enemigos', description: 'Derrota 20 enemigos', metric: 'enemiesDefeated', target: 20, currencyReward: 100 },
]

/** `YYYY-MM-DD` en UTC — determinista y testeable con `nowMs` inyectado (research.md Decisión 2). */
export function getDateKey(nowMs: number): string {
  return new Date(nowMs).toISOString().slice(0, 10)
}
