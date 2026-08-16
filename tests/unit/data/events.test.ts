import { describe, expect, it } from 'vitest'
import { isEventActive } from '../../../src/data/events'
import type { EventBanner } from '../../../src/data/events'

function makeBanner(timeWindows: EventBanner['timeWindows']): EventBanner {
  return {
    id: 'test-banner',
    name: 'Banner de Prueba',
    energyCost: 10,
    timeWindows,
    specialStage: {
      id: 'test-banner-stage',
      name: 'Fase Especial de Prueba',
      playerBaseHp: 1000,
      enemyBaseHp: 500,
      maxEnergy: 100,
      energyRegenPerSecond: 5,
      currencyReward: 200,
      enemyWave: [],
      energyCost: 10,
      region: 'test',
      difficulty: 1,
    },
  }
}

describe('isEventActive', () => {
  it('FR-002: true cuando nowMs cae dentro de la ventana (inclusive el inicio)', () => {
    const banner = makeBanner([{ startMs: 1000, endMs: 2000 }])

    expect(isEventActive(banner, 1000)).toBe(true)
    expect(isEventActive(banner, 1500)).toBe(true)
  })

  it('FR-003: false cuando nowMs cae fuera de la ventana (exclusive el final)', () => {
    const banner = makeBanner([{ startMs: 1000, endMs: 2000 }])

    expect(isEventActive(banner, 999)).toBe(false)
    expect(isEventActive(banner, 2000)).toBe(false)
    expect(isEventActive(banner, 5000)).toBe(false)
  })

  it('FR-010: dos ventanas solapadas se comportan como una única ventana continua', () => {
    const banner = makeBanner([
      { startMs: 1000, endMs: 3000 },
      { startMs: 2000, endMs: 4000 },
    ])

    expect(isEventActive(banner, 2500)).toBe(true) // dentro de ambas
    expect(isEventActive(banner, 3500)).toBe(true) // solo dentro de la segunda
    expect(isEventActive(banner, 500)).toBe(false)
    expect(isEventActive(banner, 4500)).toBe(false)
  })

  it('un banner sin ninguna ventana horaria nunca está activo', () => {
    const banner = makeBanner([])

    expect(isEventActive(banner, Date.now())).toBe(false)
  })

  describe('US4/FR-009: múltiples ventanas no solapadas, cada una independiente', () => {
    const banner = makeBanner([
      { startMs: 1000, endMs: 2000 },
      { startMs: 5000, endMs: 6000 },
    ])

    it('activo en la primera ventana', () => {
      expect(isEventActive(banner, 1500)).toBe(true)
    })

    it('activo en la segunda ventana', () => {
      expect(isEventActive(banner, 5500)).toBe(true)
    })

    it('inactivo en el hueco entre ambas', () => {
      expect(isEventActive(banner, 3000)).toBe(false)
    })
  })
})
