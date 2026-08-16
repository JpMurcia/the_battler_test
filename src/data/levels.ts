export interface EnemyWaveEntry {
  catId: string
  spawnAtSeconds: number
}

/** specs/012-saga-imperio-de-los-gatos (US2). `reinforcementWave[].spawnAtSeconds` es relativo al instante en que el umbral se dispara. */
export interface BaseHpTrigger {
  thresholdPercent: number
  reinforcementWave: EnemyWaveEntry[]
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
  /** specs/012 US2. Ausente = sin oleadas de refuerzo (comportamiento previo). */
  baseHpTriggers?: BaseHpTrigger[]
  /** specs/012 US3. Ausente = sin límite de enemigos vivos simultáneos (comportamiento previo). */
  maxSimultaneousEnemies?: number
  /** specs/012 US4. Ausente = sin tesoro otorgado al ganar. */
  treasureId?: string
  /** specs/012 US4. Ausente = sin desbloqueo de gato de primera victoria. */
  firstVictoryUnlockCatId?: string
  /** specs/012 US7. Ausente = "Brote Zombi" no disponible para este nivel (FR-013). */
  zombieWave?: EnemyWaveEntry[]
  /** specs/013-escalado-capitulos-sets-tesoros (US2). Ausente para un arco = usa `energyCost` (FR-003). */
  energyCostByArc?: Record<string, number>
  /** specs/013-escalado-capitulos-sets-tesoros (US3). Ausente = usa 400, el valor ya vigente hoy (FR-005). */
  laneLength?: number
  /** specs/017-objetos-de-batalla (US3/FR-003). Ausente = sin objetos de batalla otorgados al ganar. */
  battleItemRewards?: { itemId: string; count: number }[]
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
    // specs/012-saga-imperio-de-los-gatos: contenido mínimo de ejemplo — población completa fuera de alcance (spec.md Assumptions).
    baseHpTriggers: [
      { thresholdPercent: 50, reinforcementWave: [{ catId: 'speed-cat', spawnAtSeconds: 0 }, { catId: 'speed-cat', spawnAtSeconds: 3 }] },
    ],
    maxSimultaneousEnemies: 3,
    treasureId: 'tesoro-nivel-1',
    firstVictoryUnlockCatId: 'tank-cat',
    // specs/017-objetos-de-batalla: contenido mínimo de ejemplo — población completa fuera de alcance.
    battleItemRewards: [{ itemId: 'extra-energy', count: 1 }],
    zombieWave: [
      { catId: 'basic-cat', spawnAtSeconds: 3 },
      { catId: 'basic-cat', spawnAtSeconds: 8 },
      { catId: 'tank-cat', spawnAtSeconds: 15 },
      { catId: 'speed-cat', spawnAtSeconds: 20 },
    ],
  },
  // specs/011-nivel-2-hacia-el-futuro: segundo nivel, desbloqueado vía specs/005-mapa-de-niveles
  // (sin excepción hardcodeada), misma región que level-1 con dificultad no decreciente (FR-008).
  {
    id: 'level-2',
    name: 'Nivel 2: Hacia el Futuro',
    playerBaseHp: 1200,
    enemyBaseHp: 1300,
    maxEnergy: 120,
    energyRegenPerSecond: 6,
    currencyReward: 150,
    enemyWave: [
      { catId: 'speed-cat', spawnAtSeconds: 4 },
      { catId: 'basic-cat', spawnAtSeconds: 8 },
      { catId: 'armored-cat', spawnAtSeconds: 18 },
      { catId: 'heavy-cat', spawnAtSeconds: 28 },
      { catId: 'solar-cat', spawnAtSeconds: 40 },
    ],
    energyCost: 25,
    region: 'imperio-de-los-gatos',
    difficulty: 2,
    // specs/012-saga-imperio-de-los-gatos: contenido mínimo de ejemplo — población completa fuera de alcance (spec.md Assumptions).
    baseHpTriggers: [{ thresholdPercent: 40, reinforcementWave: [{ catId: 'armored-cat', spawnAtSeconds: 0 }] }],
    maxSimultaneousEnemies: 5,
    treasureId: 'tesoro-nivel-2',
    firstVictoryUnlockCatId: 'solar-cat',
    // specs/017-objetos-de-batalla: contenido mínimo de ejemplo — población completa fuera de alcance.
    battleItemRewards: [
      { itemId: 'speed-boost', count: 1 },
      { itemId: 'treasure-radar', count: 1 },
    ],
    zombieWave: [
      { catId: 'speed-cat', spawnAtSeconds: 2 },
      { catId: 'speed-cat', spawnAtSeconds: 6 },
      { catId: 'armored-cat', spawnAtSeconds: 20 },
    ],
  },
  // specs/022-datos-semilla-flujo-navegacion (research.md Decisión 3, data-model.md § Nivel de demostración):
  // hace jugable de punta a punta el catálogo semilla — su enemyWave referencia los 3 seed-enemy-* por catId.
  {
    id: 'level-seed-demo',
    name: 'Nivel Semilla (Demo)',
    playerBaseHp: 1000,
    enemyBaseHp: 800,
    maxEnergy: 100,
    energyRegenPerSecond: 5,
    currencyReward: 80,
    enemyWave: [
      { catId: 'seed-enemy-dog', spawnAtSeconds: 5 },
      { catId: 'seed-enemy-red-snake', spawnAtSeconds: 15 },
      { catId: 'seed-enemy-floating-hippo', spawnAtSeconds: 30 },
    ],
    energyCost: 20,
    region: 'imperio-de-los-gatos',
    difficulty: 2,
  },
]
