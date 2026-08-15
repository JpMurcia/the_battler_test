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
  /** Costo en energía de misión (specs/007-energia-mision-dificultad), distinto de `energyRegenPerSecond` (energía de batalla). */
  energyCost: number
  region: string
  /** No decreciente entre niveles consecutivos de la misma `region` (FR-008). */
  difficulty: number
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
    energyCost: 20,
    region: 'imperio-de-los-gatos',
    difficulty: 1,
  },
]
