import { describe, expect, it } from 'vitest'
import type { Cat } from '../../../src/data/cats'
import { EMPTY_CAT_FILTER, matchesCatFilter, type CatFilterState } from '../../../src/data/catFilter'

function makeCat(overrides: Partial<Cat> = {}): Cat {
  return {
    id: 'test-cat',
    name: 'Test Cat',
    cost: 10,
    cooldownSeconds: 2,
    hp: 100,
    damage: 10,
    speed: 10,
    width: 16,
    attackIntervalSeconds: 1,
    attackType: 'Single',
    attackRange: 0,
    classification: 'Traitless',
    ...overrides,
  }
}

describe('matchesCatFilter (specs/030-filtro-detalle-unidad US1)', () => {
  it('sin criterios devuelve true para cualquier gato', () => {
    expect(matchesCatFilter(makeCat(), EMPTY_CAT_FILTER)).toBe(true)
    expect(matchesCatFilter(makeCat({ rarity: undefined }), EMPTY_CAT_FILTER)).toBe(true)
  })

  it('filtro de rareza incluye solo la rareza marcada', () => {
    const filter: CatFilterState = { ...EMPTY_CAT_FILTER, rarities: ['Raro'] }
    expect(matchesCatFilter(makeCat({ rarity: 'Raro' }), filter)).toBe(true)
    expect(matchesCatFilter(makeCat({ rarity: 'Normal' }), filter)).toBe(false)
  })

  it('un gato sin rarity queda excluido de cualquier filtro de rareza', () => {
    const filter: CatFilterState = { ...EMPTY_CAT_FILTER, rarities: ['Raro'] }
    expect(matchesCatFilter(makeCat({ rarity: undefined }), filter)).toBe(false)
  })

  it('filtro de rasgo objetivo matchea por Ability TraitTargeting', () => {
    const filter: CatFilterState = { ...EMPTY_CAT_FILTER, trait: 'Floating' }
    const withTrait = makeCat({ abilities: [{ kind: 'TraitTargeting', targetClassifications: ['Floating'], damageMultiplier: 2 }] })
    const withoutTrait = makeCat({ abilities: [{ kind: 'TraitTargeting', targetClassifications: ['Red'], damageMultiplier: 2 }] })
    expect(matchesCatFilter(withTrait, filter)).toBe(true)
    expect(matchesCatFilter(withoutTrait, filter)).toBe(false)
    expect(matchesCatFilter(makeCat(), filter)).toBe(false)
  })

  it('filtro de habilidad matchea appliesEffect.type', () => {
    const filter: CatFilterState = { ...EMPTY_CAT_FILTER, ability: 'Freeze' }
    expect(matchesCatFilter(makeCat({ appliesEffect: { type: 'Freeze', durationSeconds: 2 } }), filter)).toBe(true)
    expect(matchesCatFilter(makeCat({ appliesEffect: { type: 'Weaken', durationSeconds: 2 } }), filter)).toBe(false)
    expect(matchesCatFilter(makeCat(), filter)).toBe(false)
  })

  it('filtro de habilidad matchea attackType Critical/MultiHit sin necesitar abilities', () => {
    const filter: CatFilterState = { ...EMPTY_CAT_FILTER, ability: 'Critical' }
    expect(matchesCatFilter(makeCat({ attackType: 'Critical' }), filter)).toBe(true)
    expect(matchesCatFilter(makeCat({ attackType: 'Single' }), filter)).toBe(false)
  })

  it('modo AND exige rasgo y habilidad a la vez', () => {
    const filter: CatFilterState = { rarities: [], trait: 'Floating', ability: 'Critical', mode: 'AND' }
    const both = makeCat({
      attackType: 'Critical',
      abilities: [{ kind: 'TraitTargeting', targetClassifications: ['Floating'], damageMultiplier: 2 }],
    })
    const onlyAbility = makeCat({ attackType: 'Critical' })
    expect(matchesCatFilter(both, filter)).toBe(true)
    expect(matchesCatFilter(onlyAbility, filter)).toBe(false)
  })

  it('modo OR incluye con cualquiera de los dos criterios', () => {
    const filter: CatFilterState = { rarities: [], trait: 'Floating', ability: 'Critical', mode: 'OR' }
    const onlyAbility = makeCat({ attackType: 'Critical' })
    const onlyTrait = makeCat({ abilities: [{ kind: 'TraitTargeting', targetClassifications: ['Floating'], damageMultiplier: 2 }] })
    const neither = makeCat()
    expect(matchesCatFilter(onlyAbility, filter)).toBe(true)
    expect(matchesCatFilter(onlyTrait, filter)).toBe(true)
    expect(matchesCatFilter(neither, filter)).toBe(false)
  })

  it('un gato sin abilities nunca matchea un filtro de rasgo, pero sí puede matchear por attackType', () => {
    const traitFilter: CatFilterState = { ...EMPTY_CAT_FILTER, trait: 'Red' }
    const abilityFilter: CatFilterState = { ...EMPTY_CAT_FILTER, ability: 'MultiHit' }
    const cat = makeCat({ attackType: 'MultiHit' })
    expect(matchesCatFilter(cat, traitFilter)).toBe(false)
    expect(matchesCatFilter(cat, abilityFilter)).toBe(true)
  })
})
