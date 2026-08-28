import { Graphics } from 'pixi.js'
import { describe, expect, it } from 'vitest'
import { computeCyberBodyLayout } from '../../../src/game/graphics/cyberUnitBody'
import { drawUnitHpBar } from '../../../src/game/graphics/unitHpBar'

describe('drawUnitHpBar (specs/029-pulido-batalla-hud US3)', () => {
  const layout = computeCyberBodyLayout({ bodyWidth: 30, bodyHeight: 30, cornerRadius: 4 })

  it('no lanza para team Player/Enemy en fracciones 0, 0.5 y 1', () => {
    for (const team of ['Player', 'Enemy'] as const) {
      for (const fraction of [0, 0.5, 1]) {
        expect(() => drawUnitHpBar(new Graphics(), layout, team, fraction)).not.toThrow()
      }
    }
  })

  it('no lanza con fracciones fuera de [0,1] (defensivo, mismo criterio que getHpFraction)', () => {
    expect(() => drawUnitHpBar(new Graphics(), layout, 'Player', -0.2)).not.toThrow()
    expect(() => drawUnitHpBar(new Graphics(), layout, 'Player', 1.4)).not.toThrow()
  })
})
