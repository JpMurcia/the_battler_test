import type { ClassificationType } from '../engine/types'
import type { Cat, RarityType } from './cats'

/**
 * specs/030-filtro-detalle-unidad (US1). Filtro de gatos por rareza/rasgo objetivo/habilidad —
 * función pura sin React (Constitución § VI), consumida por `TeamScreen` y `CatGuideScreen`.
 */

export type CatFilterAbility = 'Weaken' | 'Freeze' | 'Slow' | 'Curse' | 'Critical' | 'MultiHit'

export interface CatFilterState {
  rarities: RarityType[]
  trait: ClassificationType | null
  ability: CatFilterAbility | null
  mode: 'AND' | 'OR'
}

export const EMPTY_CAT_FILTER: CatFilterState = { rarities: [], trait: null, ability: null, mode: 'OR' }

const EFFECT_ABILITIES: CatFilterAbility[] = ['Weaken', 'Freeze', 'Slow', 'Curse']

function matchesTrait(cat: Cat, trait: ClassificationType | null): boolean {
  if (trait === null) return true
  return (cat.abilities ?? []).some((ability) => ability.kind === 'TraitTargeting' && ability.targetClassifications.includes(trait))
}

function matchesAbility(cat: Cat, ability: CatFilterAbility | null): boolean {
  if (ability === null) return true
  if (EFFECT_ABILITIES.includes(ability)) return cat.appliesEffect?.type === ability
  return cat.attackType === ability
}

export function matchesCatFilter(cat: Cat, filter: CatFilterState): boolean {
  if (filter.rarities.length > 0 && (!cat.rarity || !filter.rarities.includes(cat.rarity))) return false

  const traitMatch = matchesTrait(cat, filter.trait)
  const abilityMatch = matchesAbility(cat, filter.ability)

  if (filter.trait !== null && filter.ability !== null) {
    return filter.mode === 'AND' ? traitMatch && abilityMatch : traitMatch || abilityMatch
  }
  return traitMatch && abilityMatch
}
