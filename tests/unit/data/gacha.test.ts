import { describe, expect, it } from 'vitest'
import { GACHA_BANNERS, GACHA_POOL, rollMany, rollOne, type GachaRarity } from '../../../src/data/gacha'

/** Generador determinista simple (LCG) — evita depender de Math.random real en un test de distribución (SC-003). */
function seededRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff
    return state / 0x7fffffff
  }
}

describe('GACHA_POOL', () => {
  it('tiene al menos un catId en cada rareza ofrecida por algún banner (FR-013/SC-009)', () => {
    const rarities: GachaRarity[] = ['Legendario', 'Megarraro', 'Superraro', 'Raro']
    for (const rarity of rarities) {
      expect(GACHA_POOL[rarity].length).toBeGreaterThan(0)
    }
  })

  it('el pool de Legendario incluye los gatos gacha-exclusivos nuevos', () => {
    expect(GACHA_POOL.Legendario).toEqual(expect.arrayContaining(['legend-cat-eclipse', 'legend-cat-supreme']))
  })
})

describe('GACHA_BANNERS', () => {
  it('las tasas de cada banner suman 100', () => {
    for (const banner of GACHA_BANNERS) {
      const total = banner.odds.reduce((sum, odds) => sum + odds.percent, 0)
      expect(total).toBeCloseTo(100, 5)
    }
  })
})

describe('rollOne', () => {
  it('siempre devuelve un catId perteneciente al pool de la rareza resuelta', () => {
    const banner = GACHA_BANNERS[0]
    const random = seededRandom(42)
    for (let i = 0; i < 50; i++) {
      const result = rollOne(banner, random)
      expect(GACHA_POOL[result.rarity]).toContain(result.catId)
    }
  })
})

describe('rollMany — distribución dentro de ±2pp (SC-003)', () => {
  it.each(GACHA_BANNERS.map((banner) => banner.id))('banner %s', (bannerId) => {
    const banner = GACHA_BANNERS.find((candidate) => candidate.id === bannerId)!
    const random = seededRandom(1337)
    const results = rollMany(banner, 1000, random)

    for (const odds of banner.odds) {
      const observed = results.filter((result) => result.rarity === odds.rarity).length / 1000
      const observedPercent = observed * 100
      expect(Math.abs(observedPercent - odds.percent)).toBeLessThanOrEqual(2)
    }
  })

  it('rollMany(banner, 11) produce exactamente 11 resultados independientes', () => {
    const results = rollMany(GACHA_BANNERS[0], 11, seededRandom(7))
    expect(results).toHaveLength(11)
  })
})
