/** Fórmulas de escalado provisionales, no balanceadas (tasks.md Fase 1 / specs/007-energia-mision-dificultad). */
const BASE_MAX = 100
const MAX_PER_CHARACTER_LEVEL = 10
const BASE_REGEN_PER_SECOND = 1 / 60
const REGEN_PER_CHARACTER_LEVEL = 0.01

export interface MissionEnergyPool {
  current: number
  lastUpdatedAt: number
}

export function computeMissionEnergyMax(characterLevel: number): number {
  return BASE_MAX + Math.max(0, characterLevel - 1) * MAX_PER_CHARACTER_LEVEL
}

export function computeRegenPerSecond(characterLevel: number): number {
  return BASE_REGEN_PER_SECOND + Math.max(0, characterLevel - 1) * REGEN_PER_CHARACTER_LEVEL
}

/** Recuperación por tiempo transcurrido real, tope en `maxNow` — nunca negativa ni acumulada más allá del máximo (FR-006). */
export function computeRecoveredEnergy(
  pool: MissionEnergyPool,
  maxNow: number,
  regenPerSecond: number,
  nowMs: number,
): number {
  if (pool.current >= maxNow) return maxNow
  const elapsedSeconds = Math.max(0, (nowMs - pool.lastUpdatedAt) / 1000)
  return Math.min(maxNow, pool.current + elapsedSeconds * regenPerSecond)
}
