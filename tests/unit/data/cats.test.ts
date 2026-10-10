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
      expect(cat?.evolutions?.second?.requiredLevel).toBe(10)
      expect(cat?.evolutions?.true?.requiredLevel).toBe(30)
      expect(cat?.evolutions?.true?.requiredItemCount).toBeUndefined()
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

/** specs/039-habilidades-control-defensa T020. */
const ABILITY_DEMO_CATS = {
  'strengthen-cat': { kind: 'Strengthen', hpThresholdFraction: 0.5, damageMultiplier: 2 },
  'dodge-cat': { kind: 'Dodge', chance: 0.25 },
  'survivor-cat': { kind: 'Survive', chance: 0.3 },
  'knockback-cat': { kind: 'Knockback', chance: 0.3, distance: 30 },
} as const

describe('CATS — specs/039-habilidades-control-defensa', () => {
  it('los 4 gatos de demostración existen, son únicos y no colisionan con ningún id previo', () => {
    const demoIds = Object.keys(ABILITY_DEMO_CATS)
    const allIds = CATS.map((cat) => cat.id)

    expect(new Set(allIds).size).toBe(allIds.length)
    for (const id of demoIds) {
      expect(CATS.filter((cat) => cat.id === id)).toHaveLength(1)
    }
  })

  it('cada gato de demostración declara exactamente su habilidad (data-model.md § src/data/cats.ts)', () => {
    for (const [id, ability] of Object.entries(ABILITY_DEMO_CATS)) {
      const cat = CATS.find((candidate) => candidate.id === id)
      expect(cat?.abilities).toEqual([ability])
      expect(cat?.attackType).toBe('Single')
      expect(cat?.classification).toBe('Traitless')
    }
  })

  it('FR-009: los gatos de specs/038 y el gato básico conservan exactamente sus habilidades anteriores', () => {
    const abilitiesOf = (id: string) => CATS.find((candidate) => candidate.id === id)?.abilities

    expect(abilitiesOf('basic-cat')).toBeUndefined()
    expect(abilitiesOf('massive-strike-cat')).toEqual([{ kind: 'MassiveDamage', chance: 0.05, damageMultiplier: 3 }])
    expect(abilitiesOf('zombie-hunter-cat')).toEqual([{ kind: 'TraitKiller', targetClassifications: ['Zombie'], chance: 0.15 }])
    expect(abilitiesOf('metal-hunter-cat')).toEqual([{ kind: 'TraitKiller', targetClassifications: ['Metal'], chance: 0.15 }])
    expect(abilitiesOf('shield-cat')).toEqual([{ kind: 'Shield', shieldHp: 100 }])
    expect(abilitiesOf('summoner-cat')).toEqual([{ kind: 'SummonOnDeath', summonCatId: 'basic-cat', count: 1 }])
  })
})

describe('CATS — specs/040-dinero-extra-inmunidades', () => {
  it('wallet-cat y anchor-cat existen, son únicos y declaran exactamente su habilidad / inmunidad', () => {
    expect(CATS.filter((cat) => cat.id === 'wallet-cat')).toHaveLength(1)
    expect(CATS.filter((cat) => cat.id === 'anchor-cat')).toHaveLength(1)

    const wallet = CATS.find((cat) => cat.id === 'wallet-cat')
    expect(wallet?.abilities).toEqual([{ kind: 'ExtraMoney', energyBonus: 5 }])
    expect(wallet?.immuneAbilities).toBeUndefined()

    const anchor = CATS.find((cat) => cat.id === 'anchor-cat')
    expect(anchor?.immuneAbilities).toEqual(['Knockback'])
    expect(anchor?.abilities).toBeUndefined()
  })

  it('FR-008: el jefe del Capítulo 1 es inmune a Golpe Letal, Killer y Retroceso y conserva el resto de sus datos', () => {
    const boss = CATS.find((cat) => cat.id === 'enemy-la-mascara')

    expect(boss?.immuneAbilities).toEqual(['MassiveDamage', 'TraitKiller', 'Knockback'])
    expect(boss?.hp).toBe(99999)
    expect(boss?.damage).toBe(2000)
  })

  it('FR-009: ningún otro gato del catálogo declara inmunidades a habilidades', () => {
    const withImmunities = CATS.filter((cat) => cat.immuneAbilities !== undefined).map((cat) => cat.id)

    expect(withImmunities.sort()).toEqual(['anchor-cat', 'enemy-la-mascara'])
  })
})
