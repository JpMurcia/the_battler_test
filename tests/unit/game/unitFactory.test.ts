import { Graphics, type Renderer, type Texture } from 'pixi.js'
import { describe, expect, it, vi } from 'vitest'
import type { ProceduralDesign } from '../../../src/data/seedData'
import { clearUnitTextureCache, drawSeedUnit, getOrCreateUnitTexture, type UnitRole } from '../../../src/game/graphics/unitFactory'

const CIRCLE_DESIGN: ProceduralDesign = { primaryColor: 0x2b8a99, baseShape: 'circle', size: 20, distinctiveFeature: 'cat-ears' }
const RECT_DESIGN: ProceduralDesign = { primaryColor: 0xa33a3a, baseShape: 'rect', size: 40, distinctiveFeature: 'fangs' }

const SHAPES: ProceduralDesign['baseShape'][] = ['circle', 'rect', 'poly']
const FEATURES: ProceduralDesign['distinctiveFeature'][] = ['cat-ears', 'fangs', 'fin', 'crest', 'none', 'horns', 'wings', 'shield', 'spikes', 'tail']
const ROLES: UnitRole[] = ['ally', 'enemy']

function fakeRenderer(): Renderer {
  let counter = 0
  return {
    generateTexture: vi.fn(() => ({ id: `texture-${counter++}` }) as unknown as Texture),
  } as unknown as Renderer
}

function drawn(design: ProceduralDesign, role: UnitRole): Graphics {
  const g = new Graphics()
  drawSeedUnit(g, design, role)
  return g
}

/** Número de operaciones de dibujo (relleno/trazo) registradas — cuenta piezas, no píxeles. */
function instructionCount(g: Graphics): number {
  return g.context.instructions.length
}

describe('drawSeedUnit', () => {
  it('es determinista — el mismo ProceduralDesign produce los mismos bounds', () => {
    const g1 = drawn(CIRCLE_DESIGN, 'ally')
    const g2 = drawn(CIRCLE_DESIGN, 'ally')

    expect(g1.width).toBe(g2.width)
    expect(g1.height).toBe(g2.height)
    expect(instructionCount(g1)).toBe(instructionCount(g2))
  })

  it('specs/042: no lanza para ningún rasgo × forma × rol y siempre produce un dibujo no vacío', () => {
    for (const baseShape of SHAPES) {
      for (const distinctiveFeature of FEATURES) {
        for (const role of ROLES) {
          const design: ProceduralDesign = { ...RECT_DESIGN, baseShape, distinctiveFeature }
          const g = new Graphics()
          expect(() => drawSeedUnit(g, design, role)).not.toThrow()
          expect(g.width, `${baseShape}/${distinctiveFeature}/${role}`).toBeGreaterThan(0)
        }
      }
    }
  })

  it('rasgos distintos producen dibujos distintos', () => {
    const withShield = drawn({ ...RECT_DESIGN, distinctiveFeature: 'shield' }, 'enemy')
    const withWings = drawn({ ...RECT_DESIGN, distinctiveFeature: 'wings' }, 'enemy')

    expect(withShield.width).not.toBe(withWings.width)
  })

  it('produce un dibujo con tamaño distinto para designs de tamaño distinto', () => {
    const small = drawn(CIRCLE_DESIGN, 'ally')
    const large = drawn(RECT_DESIGN, 'ally')

    expect(small.width).not.toBe(large.width)
  })
})

describe('drawSeedUnit — specs/042 orejas de aliado (FR-006/FR-007)', () => {
  it('todo aliado lleva orejas además de su rasgo: más piezas que el enemigo del mismo diseño', () => {
    for (const baseShape of SHAPES) {
      for (const distinctiveFeature of FEATURES.filter((feature) => feature !== 'cat-ears')) {
        const design: ProceduralDesign = { ...RECT_DESIGN, baseShape, distinctiveFeature }
        const label = `${baseShape}/${distinctiveFeature}`
        expect(instructionCount(drawn(design, 'ally')), label).toBeGreaterThan(instructionCount(drawn(design, 'enemy')))
      }
    }
  })

  it('un aliado cuyo rasgo ya es "orejas de gato" las muestra una sola vez (mismas piezas que con rol enemigo)', () => {
    for (const baseShape of SHAPES) {
      const design: ProceduralDesign = { ...CIRCLE_DESIGN, baseShape, distinctiveFeature: 'cat-ears' }
      expect(instructionCount(drawn(design, 'ally')), baseShape).toBe(instructionCount(drawn(design, 'enemy')))
    }
  })

  it('con un rasgo de cabeza (cuernos) el aliado es al menos tan ancho y alto como el enemigo — las orejas asoman a los lados', () => {
    for (const baseShape of SHAPES) {
      const design: ProceduralDesign = { ...RECT_DESIGN, baseShape, distinctiveFeature: 'horns' }
      const ally = drawn(design, 'ally')
      const enemy = drawn(design, 'enemy')
      expect(ally.width, baseShape).toBeGreaterThanOrEqual(enemy.width)
      expect(ally.height, baseShape).toBeGreaterThanOrEqual(enemy.height)
    }
  })
})

describe('getOrCreateUnitTexture', () => {
  it('llama a renderer.generateTexture una sola vez por (unitId, role) — instancias repetidas reutilizan la textura', () => {
    clearUnitTextureCache()
    const renderer = fakeRenderer()

    const first = getOrCreateUnitTexture(renderer, 'seed-cat-basic', CIRCLE_DESIGN, 'ally')
    const second = getOrCreateUnitTexture(renderer, 'seed-cat-basic', CIRCLE_DESIGN, 'ally')

    expect(renderer.generateTexture).toHaveBeenCalledTimes(1)
    expect(second).toBe(first)
  })

  it('specs/042 (research.md Decisión 10): genera la textura a resolución 2', () => {
    clearUnitTextureCache()
    const renderer = fakeRenderer()

    getOrCreateUnitTexture(renderer, 'seed-cat-basic', CIRCLE_DESIGN, 'ally')

    expect(renderer.generateTexture).toHaveBeenCalledWith(expect.objectContaining({ resolution: 2 }))
  })

  it('genera texturas distintas para unitId distinto, aunque el design sea el mismo', () => {
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
