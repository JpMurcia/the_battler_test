import { describe, expect, it } from 'vitest'
import { OTOTO_BUILDINGS, getConstructionRemainingMs, isConstructionReady, type OtotoConstruction } from '../../../src/data/ototoCorps'

const DEFINITION = OTOTO_BUILDINGS[0]
const CONSTRUCTION: OtotoConstruction = { building: DEFINITION.id, choice: 'Floating', startedAtMs: 1000 }

describe('ototoCorps (specs/035-ototo-corps)', () => {
  it('OTOTO_BUILDINGS tiene 2 entradas (foundation/style) con costo/duración positivos', () => {
    expect(OTOTO_BUILDINGS).toHaveLength(2)
    expect(OTOTO_BUILDINGS.map((b) => b.id).sort()).toEqual(['foundation', 'style'])
    for (const def of OTOTO_BUILDINGS) {
      expect(def.materialsCost).toBeGreaterThan(0)
      expect(def.durationMs).toBeGreaterThan(0)
    }
  })

  it('getConstructionRemainingMs decrece con nowMs y nunca es negativo', () => {
    const halfway = 1000 + DEFINITION.durationMs / 2
    expect(getConstructionRemainingMs(CONSTRUCTION, DEFINITION, halfway)).toBeCloseTo(DEFINITION.durationMs / 2)
    expect(getConstructionRemainingMs(CONSTRUCTION, DEFINITION, 1000 + DEFINITION.durationMs * 10)).toBe(0)
  })

  it('isConstructionReady es false mientras falta tiempo, true al cumplirse la duración y después', () => {
    expect(isConstructionReady(CONSTRUCTION, DEFINITION, 1000 + DEFINITION.durationMs - 1)).toBe(false)
    expect(isConstructionReady(CONSTRUCTION, DEFINITION, 1000 + DEFINITION.durationMs)).toBe(true)
  })
})
