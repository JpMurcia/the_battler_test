import { Graphics } from 'pixi.js'
import { describe, expect, it } from 'vitest'
import { computeCyberBodyLayout, drawCyberThruster, drawCyberVisor, getGlowPulseAlpha } from '../../../src/game/graphics/cyberUnitBody'

const PROFILE = { bodyWidth: 20, bodyHeight: 30, cornerRadius: 4 }

describe('computeCyberBodyLayout', () => {
  it('es determinista — el mismo profile produce la misma geometría', () => {
    expect(computeCyberBodyLayout(PROFILE)).toEqual(computeCyberBodyLayout(PROFILE))
  })

  it('escala con el tamaño del cuerpo', () => {
    const small = computeCyberBodyLayout(PROFILE)
    const large = computeCyberBodyLayout({ ...PROFILE, bodyWidth: 40, bodyHeight: 60 })
    expect(large.visor.width).toBeGreaterThan(small.visor.width)
    expect(large.armorPlateLeft.height).toBeGreaterThan(small.armorPlateLeft.height)
  })
})

// drawCyberBodyBase no se testea aquí de forma directa: usa PIXI.FillGradient para el degradado del
// cuerpo, que en jsdom (sin el paquete `canvas`) intenta `HTMLCanvasElement.getContext('2d')` y lanza
// — mismo límite ya tolerado por el resto de la suite ("Not implemented: ...getContext()" en stdout).
// En un navegador real (dev/prod) el contexto 2D existe y el degradado se construye sin problema.
describe('drawCyberVisor / drawCyberThruster', () => {
  it('no lanzan para ningún equipo, con o sin dimmed', () => {
    const layout = computeCyberBodyLayout(PROFILE)
    for (const team of ['Player', 'Enemy'] as const) {
      for (const dimmed of [false, true]) {
        expect(() => drawCyberVisor(new Graphics(), layout, team, { dimmed })).not.toThrow()
        expect(() => drawCyberThruster(new Graphics(), layout, team, { dimmed })).not.toThrow()
      }
    }
  })

  it('produce contenido dibujado (bounds no vacíos)', () => {
    const layout = computeCyberBodyLayout(PROFILE)
    const g = new Graphics()
    drawCyberVisor(g, layout, 'Player')
    expect(g.width).toBeGreaterThan(0)
    expect(g.height).toBeGreaterThan(0)
  })
})

describe('getGlowPulseAlpha', () => {
  it('nunca sale del rango [min,max]', () => {
    for (let t = 0; t < 5; t += 0.1) {
      const alpha = getGlowPulseAlpha(t, 1.5, 0.5, 1)
      expect(alpha).toBeGreaterThanOrEqual(0.5)
      expect(alpha).toBeLessThanOrEqual(1)
    }
  })

  it('es periódico — vuelve al mismo valor tras un ciclo completo', () => {
    const a = getGlowPulseAlpha(0.2, 2, 0.5, 1)
    const b = getGlowPulseAlpha(0.2 + 1 / 2, 2, 0.5, 1)
    expect(a).toBeCloseTo(b)
  })
})
