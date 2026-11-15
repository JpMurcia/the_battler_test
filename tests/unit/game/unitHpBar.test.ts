import { Graphics } from 'pixi.js'
import { describe, expect, it } from 'vitest'
import { drawUnitHpBar } from '../../../src/game/graphics/unitHpBar'

describe('drawUnitHpBar (specs/029-pulido-batalla-hud US3)', () => {
  // specs/042-unidades-mundo-cartoon: recibe solo el tamaño del cuerpo (antes un CyberBodyLayout).
  const body = { bodyWidth: 30, bodyHeight: 30 }

  it('no lanza para team Player/Enemy en fracciones 0, 0.5 y 1', () => {
    for (const team of ['Player', 'Enemy'] as const) {
      for (const fraction of [0, 0.5, 1]) {
        expect(() => drawUnitHpBar(new Graphics(), body, team, fraction)).not.toThrow()
      }
    }
  })

  it('no lanza con fracciones fuera de [0,1] (defensivo, mismo criterio que getHpFraction)', () => {
    expect(() => drawUnitHpBar(new Graphics(), body, 'Player', -0.2)).not.toThrow()
    expect(() => drawUnitHpBar(new Graphics(), body, 'Player', 1.4)).not.toThrow()
  })

  it('specs/042: la barra mide 1,15 × bodyWidth y queda centrada sobre el cuerpo (geometría sin cambios)', () => {
    const g = new Graphics()
    drawUnitHpBar(g, body, 'Player', 1)
    const bounds = g.getLocalBounds()
    expect(bounds.width).toBeCloseTo(30 * 1.15, 1)
    expect(bounds.x).toBeCloseTo((30 - 30 * 1.15) / 2, 1)
  })
})
