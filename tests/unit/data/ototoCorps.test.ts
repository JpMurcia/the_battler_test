import { describe, expect, it } from 'vitest'
import {
  CANNON_DEBUFFS,
  CANNON_HEAD_LABELS,
  CANNON_HEAD_OPTIONS,
  CANNON_KNOCKBACK_DISTANCE,
  OTOTO_BUILDINGS,
  getCannonHeadSpec,
  getConstructionRemainingMs,
  isConstructionReady,
  type OtotoConstruction,
} from '../../../src/data/ototoCorps'

const DEFINITION = OTOTO_BUILDINGS[0]
const CONSTRUCTION: OtotoConstruction = { building: DEFINITION.id, choice: 'Floating', startedAtMs: 1000 }

describe('ototoCorps (specs/035-ototo-corps)', () => {
  it('OTOTO_BUILDINGS tiene 3 entradas (foundation/style, specs/035, y cannonHead, specs/041) con costo/duración positivos', () => {
    expect(OTOTO_BUILDINGS).toHaveLength(3)
    expect(OTOTO_BUILDINGS.map((b) => b.id).sort()).toEqual(['cannonHead', 'foundation', 'style'])
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

describe('ototoCorps — Cabeza de Cañón (specs/041-cabezas-de-canon)', () => {
  it('CANNON_HEAD_OPTIONS tiene exactamente las cinco elecciones y cada una tiene etiqueta en español', () => {
    expect(CANNON_HEAD_OPTIONS).toEqual(['Knockback', 'Weaken', 'Freeze', 'Slow', 'Curse'])
    for (const option of CANNON_HEAD_OPTIONS) {
      expect(CANNON_HEAD_LABELS[option]).toBeTruthy()
    }
  })

  it('getCannonHeadSpec devuelve el spec esperado para cada elección', () => {
    expect(getCannonHeadSpec('Knockback')).toEqual({ kind: 'Knockback', distance: CANNON_KNOCKBACK_DISTANCE })
    expect(getCannonHeadSpec('Weaken')).toEqual({ kind: 'Effect', effect: { type: 'Weaken', durationSeconds: 5, magnitude: 0.5 } })
    expect(getCannonHeadSpec('Freeze')).toEqual({ kind: 'Effect', effect: { type: 'Freeze', durationSeconds: 3 } })
    expect(getCannonHeadSpec('Slow')).toEqual({ kind: 'Effect', effect: { type: 'Slow', durationSeconds: 5, magnitude: 0.5 } })
    expect(getCannonHeadSpec('Curse')).toEqual({ kind: 'Effect', effect: { type: 'Curse', durationSeconds: 5 } })
  })

  it('todas las duraciones y la distancia del catálogo son positivas', () => {
    expect(CANNON_KNOCKBACK_DISTANCE).toBeGreaterThan(0)
    for (const debuff of Object.values(CANNON_DEBUFFS)) {
      expect(debuff.durationSeconds).toBeGreaterThan(0)
    }
  })
})
