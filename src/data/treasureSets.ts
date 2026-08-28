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
  /** specs/027-capitulo-1-imperio-gatos (FR-011). Los 48 tesoros del capítulo, generados por el mismo patrón que sus id de nivel. */
  {
    id: 'set-imperio-de-los-gatos-cap1',
    name: 'Set Imperio de los Gatos — Capítulo 1',
    treasureIds: Array.from({ length: 48 }, (_, index) => `tesoro-imperio-cap1-etapa-${index + 1}`),
    passiveBonus: { type: 'CurrencyRewardMultiplier', value: 1.15 },
  },
]
