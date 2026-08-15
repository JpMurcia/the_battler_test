import { describe, expect, it } from 'vitest'
import {
  computeMissionEnergyMax,
  computeRecoveredEnergy,
  computeRegenPerSecond,
} from '../../../src/data/missionEnergy'

describe('computeMissionEnergyMax', () => {
  it('aumenta con el nivel de personaje', () => {
    expect(computeMissionEnergyMax(10)).toBeGreaterThan(computeMissionEnergyMax(1))
  })
})

describe('computeRegenPerSecond', () => {
  it('aumenta con el nivel de personaje', () => {
    expect(computeRegenPerSecond(10)).toBeGreaterThan(computeRegenPerSecond(1))
  })
})

describe('computeRecoveredEnergy', () => {
  it('no cambia si no pasó tiempo', () => {
    const result = computeRecoveredEnergy({ current: 50, lastUpdatedAt: 1000 }, 100, 1, 1000)
    expect(result).toBe(50)
  })

  it('recupera proporcionalmente al tiempo transcurrido', () => {
    const result = computeRecoveredEnergy({ current: 50, lastUpdatedAt: 0 }, 100, 1, 10_000)
    expect(result).toBe(60)
  })

  it('nunca supera el máximo, sin importar cuánto tiempo pase', () => {
    const result = computeRecoveredEnergy({ current: 50, lastUpdatedAt: 0 }, 100, 1, 1_000_000_000)
    expect(result).toBe(100)
  })

  it('nunca es negativa ni retrocede si nowMs es anterior a lastUpdatedAt', () => {
    const result = computeRecoveredEnergy({ current: 50, lastUpdatedAt: 10_000 }, 100, 1, 0)
    expect(result).toBe(50)
  })
})
