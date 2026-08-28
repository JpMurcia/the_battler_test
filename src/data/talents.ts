import type { ClassificationType, EffectType } from '../engine/types'

/** specs/036-talentos-orbes. Máximo de puntos invertibles por pista/contador. */
export const MAX_TALENT_POINTS = 5

/** specs/036-talentos-orbes (FR-003). Costo en NP del primer punto — crece linealmente con los puntos ya invertidos. */
export const TALENT_POINT_BASE_COST = 100

export const DEBUFF_RESISTANCE_OPTIONS: EffectType[] = ['Weaken', 'Freeze', 'Slow']

export const ORB_CLASSIFICATION_OPTIONS: ClassificationType[] = [
  'Red',
  'Floating',
  'Black',
  'Angel',
  'Alien',
  'Zombie',
  'Relic',
  'Traitless',
]

/** specs/036-talentos-orbes. Estado de talentos por gato poseído — ausente = sin ninguna inversión. */
export interface CatTalents {
  debuffResistance?: { effect: EffectType; points: number }
  statBoost?: { hp: number; damage: number }
  orb?: { classification: ClassificationType; points: number }
}

/** research.md Decisión 4. Costo del siguiente punto, dado el número de puntos ya invertidos en esa pista/contador. */
export function getTalentPointCost(currentPoints: number): number {
  return TALENT_POINT_BASE_COST * (currentPoints + 1)
}

/** 1.0 sin puntos → 0.5 en MAX_TALENT_POINTS, en pasos de 0.1. */
export function getDebuffResistanceMultiplier(points: number): number {
  return Math.max(0.5, 1 - points * 0.1)
}

/** 1.0 sin puntos → 1.10 en MAX_TALENT_POINTS, en pasos de +2%. */
export function getStatBoostMultiplier(points: number): number {
  return 1 + points * 0.02
}

/** 1.0 sin puntos → 1.20 en MAX_TALENT_POINTS, en pasos de +4%. */
export function getOrbDamageMultiplier(points: number): number {
  return 1 + points * 0.04
}

/** specs/036-talentos-orbes (FR-001). Solo Forma Verdadera + rareza Megarraro/Legendario ven la sección de Talentos. */
export function isTalentEligible(evolutionStage: 'Base' | 'Second' | 'True', rarity: string | undefined): boolean {
  return evolutionStage === 'True' && (rarity === 'Megarraro' || rarity === 'Legendario')
}
