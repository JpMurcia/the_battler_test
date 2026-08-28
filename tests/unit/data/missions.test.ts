import { describe, expect, it } from 'vitest'
import { MISSIONS, getDateKey } from '../../../src/data/missions'

describe('missions (specs/033-misiones-catnip-challenges)', () => {
  it('getDateKey es determinista y usa formato YYYY-MM-DD', () => {
    const ms = Date.parse('2026-08-27T15:30:00Z')
    expect(getDateKey(ms)).toBe('2026-08-27')
    expect(getDateKey(ms)).toBe(getDateKey(ms))
  })

  it('getDateKey produce la misma clave para 2 timestamps del mismo día UTC', () => {
    const morning = Date.parse('2026-08-27T01:00:00Z')
    const night = Date.parse('2026-08-27T23:00:00Z')
    expect(getDateKey(morning)).toBe(getDateKey(night))
  })

  it('getDateKey produce claves distintas para días distintos', () => {
    const day1 = Date.parse('2026-08-27T23:59:00Z')
    const day2 = Date.parse('2026-08-28T00:01:00Z')
    expect(getDateKey(day1)).not.toBe(getDateKey(day2))
  })

  it('MISSIONS tiene 3 entradas con target/currencyReward positivos', () => {
    expect(MISSIONS).toHaveLength(3)
    for (const mission of MISSIONS) {
      expect(mission.target).toBeGreaterThan(0)
      expect(mission.currencyReward).toBeGreaterThan(0)
    }
  })
})
