import { Graphics } from 'pixi.js'
import { describe, expect, it } from 'vitest'
import {
  computeBaseTowerLayout,
  drawBaseTowerShield,
  drawBaseTowerTurret,
  getHpBarFillWidth,
  getHpFraction,
} from '../../../src/game/graphics/baseTower'

describe('getHpFraction', () => {
  it('a hp completo devuelve 1', () => {
    expect(getHpFraction(100, 100)).toBe(1)
  })

  it('a hp 0 devuelve 0', () => {
    expect(getHpFraction(0, 100)).toBe(0)
  })

  it('nunca es negativo aunque hp sea negativo', () => {
    expect(getHpFraction(-20, 100)).toBe(0)
  })

  it('nunca excede 1 aunque hp exceda maxHp', () => {
    expect(getHpFraction(150, 100)).toBe(1)
  })

  it('con maxHp 0 devuelve 0 sin dividir por cero', () => {
    expect(getHpFraction(10, 0)).toBe(0)
  })
})

describe('getHpBarFillWidth', () => {
  it('a fracción 1 llena todo el ancho', () => {
    expect(getHpBarFillWidth(1, 80)).toBe(80)
  })

  it('a fracción 0.5 llena la mitad', () => {
    expect(getHpBarFillWidth(0.5, 80)).toBe(40)
  })

  it('a fracción 0 no llena nada', () => {
    expect(getHpBarFillWidth(0, 80)).toBe(0)
  })
})

describe('computeBaseTowerLayout', () => {
  it('es determinista', () => {
    expect(computeBaseTowerLayout()).toEqual(computeBaseTowerLayout())
  })

  it('produce dimensiones positivas para todas las piezas', () => {
    const layout = computeBaseTowerLayout()
    expect(layout.width).toBeGreaterThan(0)
    expect(layout.height).toBeGreaterThan(0)
    expect(layout.towerBody.width).toBeGreaterThan(0)
    expect(layout.hpBar.width).toBeGreaterThan(0)
    expect(layout.turretHead.radius).toBeGreaterThan(0)
  })
})

// drawBaseTowerBody/drawBaseTowerHpBar no se testean directamente: usan PIXI.FillGradient, que en
// jsdom (sin el paquete `canvas`) lanza al construir su textura — mismo límite que cyberUnitBody.test.ts.
describe('drawBaseTowerTurret / drawBaseTowerShield', () => {
  it('no lanzan para ningún rol', () => {
    const layout = computeBaseTowerLayout()
    for (const role of ['ally', 'enemy'] as const) {
      expect(() => drawBaseTowerTurret(new Graphics(), layout, role)).not.toThrow()
    }
    expect(() => drawBaseTowerShield(new Graphics(), layout)).not.toThrow()
  })
})
