import { Graphics } from 'pixi.js'
import { describe, expect, it } from 'vitest'
import { computeTeamRingGeometry, drawTeamRing } from '../../../src/game/graphics/teamRing'

describe('Anillo de equipo — specs/042-unidades-mundo-cartoon (US2/FR-008)', () => {
  it('está centrado bajo el cuerpo (el cuerpo ocupa [0, bodyWidth])', () => {
    for (const bodyWidth of [12, 16, 30, 44]) {
      expect(computeTeamRingGeometry(bodyWidth).cx).toBe(bodyWidth / 2)
    }
  })

  it('es proporcional al ancho de la unidad', () => {
    expect(computeTeamRingGeometry(44).rx).toBeGreaterThan(computeTeamRingGeometry(14).rx)
    expect(computeTeamRingGeometry(20).rx).toBeCloseTo(20 * 0.62)
  })

  it('su alto queda acotado a [2, 6] px para no tapar la silueta ni el rasgo', () => {
    expect(computeTeamRingGeometry(4).ry).toBe(2)
    expect(computeTeamRingGeometry(12).ry).toBeCloseTo(2.4)
    expect(computeTeamRingGeometry(44).ry).toBe(6)
  })

  it('se dibuja para ambos equipos con el ancho de la elipse más el resplandor', () => {
    const geometry = computeTeamRingGeometry(20)
    for (const team of ['Player', 'Enemy'] as const) {
      const g = new Graphics()
      expect(() => drawTeamRing(g, geometry, team)).not.toThrow()
      expect(g.width).toBeGreaterThanOrEqual(geometry.rx * 2)
      expect(g.width).toBeLessThanOrEqual(geometry.rx * 2 + 6)
    }
  })

  it('redibujar no acumula trazos (clear antes de dibujar)', () => {
    const geometry = computeTeamRingGeometry(20)
    const g = new Graphics()
    drawTeamRing(g, geometry, 'Player')
    const once = g.context.instructions.length
    drawTeamRing(g, geometry, 'Player')
    expect(g.context.instructions.length).toBe(once)
  })
})
