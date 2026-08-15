export interface EnemyWaveEntry {
  catId: string
  spawnAtSeconds: number
}

export interface Level {
  id: string
  name: string
  playerBaseHp: number
  enemyBaseHp: number
  maxEnergy: number
  energyRegenPerSecond: number
  currencyReward: number
  enemyWave: EnemyWaveEntry[]
}

/** Fixture de bootstrap — valores de diseño provisionales, no balanceados (tasks.md Fase 1 / specs/002-motor-de-combate). */
export const LEVELS: Level[] = [
  {
    id: 'level-1',
    name: 'Nivel 1',
    playerBaseHp: 1000,
    enemyBaseHp: 1000,
    maxEnergy: 100,
    energyRegenPerSecond: 5,
    currencyReward: 100,
    enemyWave: [
      { catId: 'basic-cat', spawnAtSeconds: 5 },
      { catId: 'speed-cat', spawnAtSeconds: 15 },
      { catId: 'tank-cat', spawnAtSeconds: 30 },
    ],
  },
]
