import { describe, expect, it } from 'vitest'
import { CATS } from '../../../src/data/cats'

/** specs/027-capitulo-1-imperio-gatos T002. */
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

const NO_EVOLUTIONS_IDS = new Set(['cat-recluta', 'cat-deidad', 'cat-veterano'])

describe('CATS — specs/027-capitulo-1-imperio-gatos', () => {
  it('los 30 id nuevos existen en CATS, son únicos entre sí y no colisionan con ningún id previo', () => {
    expect(new Set(NEW_CAT_IDS).size).toBe(NEW_CAT_IDS.length)

    const allIds = CATS.map((cat) => cat.id)
    expect(new Set(allIds).size).toBe(allIds.length)

    for (const id of NEW_CAT_IDS) {
      expect(CATS.some((cat) => cat.id === id)).toBe(true)
    }
  })

  it('los gatos jugables con evolutions declaran second en nivel 10 y true en nivel 30, sin requiredItemCount', () => {
    const playableIds = NEW_CAT_IDS.filter((id) => id.startsWith('cat-'))
    for (const id of playableIds) {
      const cat = CATS.find((candidate) => candidate.id === id)
      expect(cat).toBeDefined()
      if (NO_EVOLUTIONS_IDS.has(id)) {
        expect(cat?.evolutions).toBeUndefined()
        continue
      }
      expect(cat?.evolutions?.second.requiredLevel).toBe(10)
      expect(cat?.evolutions?.true.requiredLevel).toBe(30)
      expect(cat?.evolutions?.true.requiredItemCount).toBeUndefined()
    }
  })

  it('cat-recluta, cat-deidad y cat-veterano no tienen evolutions', () => {
    for (const id of NO_EVOLUTIONS_IDS) {
      const cat = CATS.find((candidate) => candidate.id === id)
      expect(cat?.evolutions).toBeUndefined()
    }
  })

  it('los 16 enemigos nuevos usan solo los rasgos Traitless/Red/Floating (manual §8.3)', () => {
    const enemyIds = NEW_CAT_IDS.filter((id) => id.startsWith('enemy-'))
    for (const id of enemyIds) {
      const cat = CATS.find((candidate) => candidate.id === id)
      expect(['Traitless', 'Red', 'Floating']).toContain(cat?.classification)
    }
  })
})
