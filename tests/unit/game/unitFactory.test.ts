import { Graphics, type Renderer, type Texture } from 'pixi.js'
import { describe, expect, it, vi } from 'vitest'
import type { ProceduralDesign } from '../../../src/data/seedData'
import { clearUnitTextureCache, drawSeedUnit, getOrCreateUnitTexture } from '../../../src/game/graphics/unitFactory'

const CIRCLE_DESIGN: ProceduralDesign = { primaryColor: 0x22d3ee, baseShape: 'circle', size: 20, distinctiveFeature: 'cat-ears' }
const RECT_DESIGN: ProceduralDesign = { primaryColor: 0xef4444, baseShape: 'rect', size: 40, distinctiveFeature: 'fangs' }

function fakeRenderer(): Renderer {
  let counter = 0
  return {
    generateTexture: vi.fn(() => ({ id: `texture-${counter++}` }) as unknown as Texture),
  } as unknown as Renderer
}

describe('drawSeedUnit', () => {
  it('es determinista — el mismo ProceduralDesign produce los mismos bounds', () => {
    const g1 = new Graphics()
    const g2 = new Graphics()
    drawSeedUnit(g1, CIRCLE_DESIGN, 'ally')
    drawSeedUnit(g2, CIRCLE_DESIGN, 'ally')

    expect(g1.width).toBe(g2.width)
    expect(g1.height).toBe(g2.height)
  })

  it('no lanza para role="enemy" con cualquier distinctiveFeature', () => {
    const features: ProceduralDesign['distinctiveFeature'][] = ['cat-ears', 'fangs', 'fin', 'crest', 'none']
    for (const distinctiveFeature of features) {
      const g = new Graphics()
      expect(() => drawSeedUnit(g, { ...RECT_DESIGN, distinctiveFeature }, 'enemy')).not.toThrow()
    }
  })

  it('produce un dibujo con tamaño distinto para designs de tamaño distinto', () => {
    const small = new Graphics()
    const large = new Graphics()
    drawSeedUnit(small, CIRCLE_DESIGN, 'ally')
    drawSeedUnit(large, RECT_DESIGN, 'ally')

    expect(small.width).not.toBe(large.width)
  })
})

describe('getOrCreateUnitTexture', () => {
  it('llama a renderer.generateTexture una sola vez por (seedUnitId, role) — instancias repetidas reutilizan la textura', () => {
    clearUnitTextureCache()
    const renderer = fakeRenderer()

    const first = getOrCreateUnitTexture(renderer, 'seed-cat-basic', CIRCLE_DESIGN, 'ally')
    const second = getOrCreateUnitTexture(renderer, 'seed-cat-basic', CIRCLE_DESIGN, 'ally')

    expect(renderer.generateTexture).toHaveBeenCalledTimes(1)
    expect(second).toBe(first)
  })

  it('genera texturas distintas para seedUnitId distinto, aunque el design sea el mismo', () => {
    clearUnitTextureCache()
    const renderer = fakeRenderer()

    const a = getOrCreateUnitTexture(renderer, 'seed-cat-basic', CIRCLE_DESIGN, 'ally')
    const b = getOrCreateUnitTexture(renderer, 'seed-enemy-dog', CIRCLE_DESIGN, 'enemy')

    expect(renderer.generateTexture).toHaveBeenCalledTimes(2)
    expect(a).not.toBe(b)
  })

  it('clearUnitTextureCache() fuerza una regeneración en la siguiente llamada', () => {
    clearUnitTextureCache()
    const renderer = fakeRenderer()

    getOrCreateUnitTexture(renderer, 'seed-cat-basic', CIRCLE_DESIGN, 'ally')
    clearUnitTextureCache()
    getOrCreateUnitTexture(renderer, 'seed-cat-basic', CIRCLE_DESIGN, 'ally')

    expect(renderer.generateTexture).toHaveBeenCalledTimes(2)
  })
})
