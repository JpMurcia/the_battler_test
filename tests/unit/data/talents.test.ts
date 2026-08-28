import { describe, expect, it } from 'vitest'
import {
  MAX_TALENT_POINTS,
  getDebuffResistanceMultiplier,
  getOrbDamageMultiplier,
  getStatBoostMultiplier,
  getTalentPointCost,
  isTalentEligible,
} from '../../../src/data/talents'

describe('talents (specs/036-talentos-orbes)', () => {
  it('getTalentPointCost crece con los puntos ya invertidos', () => {
    expect(getTalentPointCost(0)).toBe(100)
    expect(getTalentPointCost(1)).toBe(200)
    expect(getTalentPointCost(2)).toBe(300)
  })

  it('getDebuffResistanceMultiplier: 1.0 en 0 puntos, 0.5 en el máximo', () => {
    expect(getDebuffResistanceMultiplier(0)).toBe(1)
    expect(getDebuffResistanceMultiplier(MAX_TALENT_POINTS)).toBe(0.5)
    expect(getDebuffResistanceMultiplier(3)).toBeCloseTo(0.7)
  })

  it('getStatBoostMultiplier: 1.0 en 0 puntos, 1.10 en el máximo', () => {
    expect(getStatBoostMultiplier(0)).toBe(1)
    expect(getStatBoostMultiplier(MAX_TALENT_POINTS)).toBeCloseTo(1.1)
  })

  it('getOrbDamageMultiplier: 1.0 en 0 puntos, 1.20 en el máximo', () => {
    expect(getOrbDamageMultiplier(0)).toBe(1)
    expect(getOrbDamageMultiplier(MAX_TALENT_POINTS)).toBeCloseTo(1.2)
  })

  it('isTalentEligible: solo Forma Verdadera + rareza Megarraro/Legendario', () => {
    expect(isTalentEligible('True', 'Megarraro')).toBe(true)
    expect(isTalentEligible('True', 'Legendario')).toBe(true)
    expect(isTalentEligible('True', 'Superraro')).toBe(false)
    expect(isTalentEligible('Second', 'Megarraro')).toBe(false)
    expect(isTalentEligible('Base', 'Legendario')).toBe(false)
    expect(isTalentEligible('True', undefined)).toBe(false)
  })
})
