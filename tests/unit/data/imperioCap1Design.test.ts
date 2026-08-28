import { describe, expect, it } from 'vitest'
import { IMPERIO_CAP1_DESIGNS } from '../../../src/data/imperioCap1Design'

/** specs/027-capitulo-1-imperio-gatos T002 (misma lista que tests/unit/data/cats.test.ts). */
const NEW_CAT_IDS = [
  'enemy-merodeador',
  'enemy-escudero',
  'enemy-triturador',
  'enemy-rondador',
  'enemy-turba',
  'enemy-planeador',
  'enemy-saltarin-alado',
  'enemy-behemot-gris',
  'enemy-carmesi',
  'enemy-emperador-volador',
  'enemy-foca-blindada',
  'enemy-boxeador',
  'enemy-embestida',
  'enemy-instructor-feroz',
  'enemy-unicornio-guerra',
  'enemy-la-mascara',
  'cat-recluta',
  'cat-yunque',
  'cat-sigiloso',
  'cat-cuchilla',
  'cat-forzudo',
  'cat-verdoso',
  'cat-deidad',
  'cat-cornamenta',
  'cat-migratorio',
  'cat-centinela',
  'cat-anfibio',
  'cat-escamado',
  'cat-coloso',
  'cat-veterano',
]

describe('IMPERIO_CAP1_DESIGNS — specs/028-ajustes-combate-mapa-disenos (US3/FR-010/FR-012)', () => {
  it('las 30 unidades nuevas de specs/027 tienen una entrada propia', () => {
    expect(NEW_CAT_IDS).toHaveLength(30)
    for (const id of NEW_CAT_IDS) {
      expect(IMPERIO_CAP1_DESIGNS[id]).toBeDefined()
    }
    expect(Object.keys(IMPERIO_CAP1_DESIGNS)).toHaveLength(30)
  })

  it('FR-012: ninguna pareja comparte exactamente la misma combinación baseShape + distinctiveFeature + primaryColor', () => {
    const combos = Object.values(IMPERIO_CAP1_DESIGNS).map(
      (design) => `${design.baseShape}:${design.distinctiveFeature}:${design.primaryColor}`,
    )
    expect(new Set(combos).size).toBe(combos.length)
  })

  it('cada diseño usa una forma/rasgo/tamaño válidos', () => {
    for (const design of Object.values(IMPERIO_CAP1_DESIGNS)) {
      expect(['circle', 'rect', 'poly']).toContain(design.baseShape)
      expect(design.size).toBeGreaterThan(0)
      expect(Number.isInteger(design.primaryColor)).toBe(true)
    }
  })
})
