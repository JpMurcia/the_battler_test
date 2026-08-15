export interface Level {
  id: string
  name: string
  playerBaseHp: number
  enemyBaseHp: number
  maxEnergy: number
  energyRegenPerSecond: number
  currencyReward: number
}

/** Fixture de bootstrap — valores de diseño provisionales, no balanceados (tasks.md Fase 1). */
export const LEVELS: Level[] = [
  {
    id: 'level-1',
    name: 'Nivel 1',
    playerBaseHp: 1000,
    enemyBaseHp: 1000,
    maxEnergy: 100,
    energyRegenPerSecond: 5,
    currencyReward: 100,
  },
]
