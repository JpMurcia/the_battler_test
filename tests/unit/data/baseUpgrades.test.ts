import { describe, expect, it } from 'vitest'
import {
  BASE_UPGRADES,
  MIN_CANNON_RECHARGE_SECONDS,
  MIN_UNIT_COOLDOWN_SECONDS,
  getAccountingMultiplier,
  getBaseDefenseBonus,
  getBaseUpgradeCost,
  getCannonChargeReduction,
  getCannonPowerBonus,
  getCannonRangeBonus,
  getEnergyCapBonus,
  getResearchCooldownReduction,
} from '../../../src/data/baseUpgrades'

describe('baseUpgrades (specs/031-mejoras-de-base)', () => {
  it('BASE_UPGRADES tiene las 7 mejoras con tope de nivel positivo', () => {
    expect(BASE_UPGRADES).toHaveLength(7)
    for (const def of BASE_UPGRADES) {
      expect(def.maxLevel).toBeGreaterThan(0)
    }
  })

  it('getBaseUpgradeCost crece con el nivel', () => {
    const cost0 = getBaseUpgradeCost(0)
    const cost5 = getBaseUpgradeCost(5)
    expect(cost5).toBeGreaterThan(cost0)
  })

  it('cada función de efecto es 0 (o 1 para el multiplicador) en nivel 0 y crece con el nivel', () => {
    expect(getCannonPowerBonus(0)).toBe(0)
    expect(getCannonPowerBonus(5)).toBeGreaterThan(0)

    expect(getCannonRangeBonus(0)).toBe(0)
    expect(getCannonRangeBonus(5)).toBeGreaterThan(0)

    expect(getCannonChargeReduction(0)).toBe(0)
    expect(getCannonChargeReduction(5)).toBeGreaterThan(0)

    expect(getBaseDefenseBonus(0)).toBe(0)
    expect(getBaseDefenseBonus(5)).toBeGreaterThan(0)

    expect(getResearchCooldownReduction(0)).toBe(0)
    expect(getResearchCooldownReduction(5)).toBeGreaterThan(0)

    expect(getAccountingMultiplier(0)).toBe(1)
    expect(getAccountingMultiplier(5)).toBeGreaterThan(1)

    expect(getEnergyCapBonus(0)).toBe(0)
    expect(getEnergyCapBonus(5)).toBeGreaterThan(0)
  })

  it('MIN_CANNON_RECHARGE_SECONDS y MIN_UNIT_COOLDOWN_SECONDS son positivos', () => {
    expect(MIN_CANNON_RECHARGE_SECONDS).toBeGreaterThan(0)
    expect(MIN_UNIT_COOLDOWN_SECONDS).toBeGreaterThan(0)
  })
})
