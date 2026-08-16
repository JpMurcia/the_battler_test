export interface TreasureSetPassiveBonus {
  type: 'EnergyRegenMultiplier' | 'CurrencyRewardMultiplier'
  value: number
}

/** specs/013-escalado-capitulos-sets-tesoros (FR-006). Agrupa tesoros de `specs/012` ya existentes. */
export interface TreasureSet {
  id: string
  name: string
  treasureIds: string[]
  passiveBonus: TreasureSetPassiveBonus
}

/** Fixture de bootstrap — valores de diseño provisionales, no balanceados (tasks.md Fase 1). */
export const TREASURE_SETS: TreasureSet[] = [
  {
    id: 'set-imperio-de-los-gatos',
    name: 'Set Imperio de los Gatos',
    treasureIds: ['tesoro-nivel-1', 'tesoro-nivel-2'],
    passiveBonus: { type: 'EnergyRegenMultiplier', value: 1.1 },
  },
]
