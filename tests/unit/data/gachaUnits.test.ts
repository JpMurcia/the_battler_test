import { describe, expect, it } from 'vitest'
import { GACHA_UNITS } from '../../../src/data/gachaUnits'

// specs/024-sistema-gacha (FR-013, US5). Auditoría de los 4 gatos gacha-exclusivos: Constitución § III (nunca
// estático — sin spriteKey, caen en el fallback Graphics animado) y § IV (stats en datos, no hardcodeadas).
describe('GACHA_UNITS', () => {
  it('tiene exactamente 2 Legendario y 2 Colaboración', () => {
    const rarities = GACHA_UNITS.map((cat) => cat.rarity)
    expect(rarities.filter((rarity) => rarity === 'Legendario')).toHaveLength(2)
    expect(rarities.filter((rarity) => rarity === 'Colaboración')).toHaveLength(2)
  })

  it('ninguna unidad declara spriteKey (research.md Decisión 2 — fallback Graphics genérico)', () => {
    for (const cat of GACHA_UNITS) {
      expect(cat.spriteKey).toBeUndefined()
    }
  })

  it('cada unidad tiene stats de combate completos', () => {
    for (const cat of GACHA_UNITS) {
      expect(cat.hp).toBeGreaterThan(0)
      expect(cat.damage).toBeGreaterThan(0)
      expect(cat.cost).toBeGreaterThan(0)
      expect(cat.cooldownSeconds).toBeGreaterThan(0)
      expect(cat.attackType).toBeTruthy()
      expect(cat.classification).toBeTruthy()
    }
  })

  it('los Legendario son las unidades más caras/potentes del catálogo gacha-exclusivo', () => {
    const legendarios = GACHA_UNITS.filter((cat) => cat.rarity === 'Legendario')
    const colaboracion = GACHA_UNITS.filter((cat) => cat.rarity === 'Colaboración')

    for (const legend of legendarios) {
      expect(colaboracion.every((collab) => collab.cost < legend.cost)).toBe(true)
    }
  })
})
