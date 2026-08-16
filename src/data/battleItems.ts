export type BattleItemCategory = 'Combat' | 'InitialResource' | 'TreasureBonus'

/** specs/017-objetos-de-batalla (FR-002). */
export interface BattleItem {
  id: string
  name: string
  category: BattleItemCategory
  /** Solo relevante si `category === 'Combat'` — multiplicador aplicado a `speed` de toda unidad creada (jugador y enemiga). */
  speedMultiplier?: number
  /** Solo relevante si `category === 'InitialResource'` — sumado a `energy.current` inicial. */
  energyBonus?: number
}

/** specs/017-objetos-de-batalla (Assumptions). Configurable a nivel de proyecto, no por nivel. */
export const MAX_BATTLE_ITEMS_PER_BATTLE = 3

/** Fixture de bootstrap — valores de diseño provisionales, no balanceados (tasks.md Fase 1). */
export const BATTLE_ITEMS: BattleItem[] = [
  { id: 'speed-boost', name: 'Aceleración de Velocidad', category: 'Combat', speedMultiplier: 1.5 },
  { id: 'extra-energy', name: 'Energía Extra', category: 'InitialResource', energyBonus: 30 },
  // specs/017 Clarifications: otorga un tesoro adicional al azar entre los no poseídos — no garantiza el treasureId propio del nivel.
  { id: 'treasure-radar', name: 'Radar de Tesoro', category: 'TreasureBonus' },
]
