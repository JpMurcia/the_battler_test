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
  /** specs/023-mapa-de-etapas-visual (FR-001). Porcentaje 0-100 de posición del nodo dentro del área del mapa. */
  mapPosition: { x: number; y: number }
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
    mapPosition: { x: 15, y: 80 },
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
    mapPosition: { x: 45, y: 55 },
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
    mapPosition: { x: 75, y: 30 },
  },
]

/**
 * specs/027-capitulo-1-imperio-gatos (T003, research.md Decisión 2). Roster de enemigos disponible
 * para la fórmula de plantilla, acumulado por "tier" según la etapa — nunca incluye al jefe
 * ('enemy-la-mascara'), reservado exclusivamente a la etapa 48 (T005).
 */
const IMPERIO_CAP1_ENEMY_TIERS: { minStage: number; catIds: string[] }[] = [
  { minStage: 1, catIds: ['enemy-merodeador', 'enemy-escudero', 'enemy-triturador', 'enemy-rondador'] },
  { minStage: 9, catIds: ['enemy-turba', 'enemy-planeador', 'enemy-saltarin-alado'] },
  { minStage: 17, catIds: ['enemy-behemot-gris', 'enemy-carmesi', 'enemy-emperador-volador'] },
  { minStage: 25, catIds: ['enemy-foca-blindada', 'enemy-boxeador', 'enemy-embestida'] },
  { minStage: 33, catIds: ['enemy-instructor-feroz', 'enemy-unicornio-guerra'] },
]

function getImperioCap1EnemyRoster(stageIndex: number): string[] {
  return IMPERIO_CAP1_ENEMY_TIERS.filter((tier) => stageIndex >= tier.minStage).flatMap((tier) => tier.catIds)
}

/** specs/027-capitulo-1-imperio-gatos (T004, research.md Decisión 3). Serpenteo de 8 columnas × 6 filas. */
function buildImperioCap1MapPosition(stageIndex: number): { x: number; y: number } {
  const row = Math.floor((stageIndex - 1) / 8)
  const colInRow = (stageIndex - 1) % 8
  const col = row % 2 === 0 ? colInRow : 7 - colInRow
  return { x: 8 + col * 11.7, y: 90 - row * 15.5 }
}

/**
 * specs/027-capitulo-1-imperio-gatos (T003, research.md Decisión 1). Fórmula determinista (sin
 * Math.random) para las 35 etapas sin hito de desbloqueo — dificultad no decreciente, roster de
 * enemigos creciente por tier. Los 13 hitos (T005) parten de esta misma función y sobrescriben
 * solo enemyWave/battleItemRewards/firstVictoryUnlockCatId (y, en la 48, enemyBaseHp).
 */
function buildImperioCap1TemplateLevel(stageIndex: number): Level {
  const roster = getImperioCap1EnemyRoster(stageIndex)
  const pick = (offset: number) => roster[(stageIndex + offset) % roster.length]
  return {
    id: `imperio-cap1-etapa-${stageIndex}`,
    name: `Imperio de los Gatos — Cap. 1, Etapa ${stageIndex}`,
    playerBaseHp: 1000,
    enemyBaseHp: 700 + stageIndex * 60,
    maxEnergy: 100,
    energyRegenPerSecond: 5,
    currencyReward: 90 + stageIndex * 8,
    enemyWave: [
      { catId: pick(0), spawnAtSeconds: 5 },
      { catId: pick(1), spawnAtSeconds: 16 },
      { catId: pick(2), spawnAtSeconds: 30 },
    ],
    energyCost: 6 + Math.floor(stageIndex / 3),
    region: 'imperio-de-los-gatos-cap1',
    difficulty: 1 + Math.floor((stageIndex - 1) / 4),
    mapPosition: buildImperioCap1MapPosition(stageIndex),
    treasureId: `tesoro-imperio-cap1-etapa-${stageIndex}`,
  }
}

/**
 * specs/027-capitulo-1-imperio-gatos (T005, data-model.md § 13 hitos hechos a mano). Cada uno parte
 * de buildImperioCap1TemplateLevel(N) (mismos difficulty/energyCost/currencyReward/mapPosition/treasureId
 * que la plantilla) y sobrescribe solo su oleada curada, sus objetos de batalla y su desbloqueo.
 */
const IMPERIO_CAP1_MILESTONE_LEVELS: Level[] = [
  {
    ...buildImperioCap1TemplateLevel(1),
    firstVictoryUnlockCatId: 'cat-yunque',
    enemyWave: [
      { catId: 'enemy-merodeador', spawnAtSeconds: 5 },
      { catId: 'enemy-escudero', spawnAtSeconds: 16 },
      { catId: 'enemy-merodeador', spawnAtSeconds: 30 },
    ],
    battleItemRewards: [{ itemId: 'extra-energy', count: 1 }],
  },
  {
    ...buildImperioCap1TemplateLevel(2),
    firstVictoryUnlockCatId: 'cat-sigiloso',
    enemyWave: [
      { catId: 'enemy-escudero', spawnAtSeconds: 5 },
      { catId: 'enemy-rondador', spawnAtSeconds: 16 },
      { catId: 'enemy-triturador', spawnAtSeconds: 30 },
    ],
    battleItemRewards: [{ itemId: 'extra-energy', count: 1 }],
  },
  {
    ...buildImperioCap1TemplateLevel(4),
    firstVictoryUnlockCatId: 'cat-cuchilla',
    enemyWave: [
      { catId: 'enemy-rondador', spawnAtSeconds: 5 },
      { catId: 'enemy-triturador', spawnAtSeconds: 16 },
      { catId: 'enemy-rondador', spawnAtSeconds: 30 },
    ],
    battleItemRewards: [{ itemId: 'speed-boost', count: 1 }],
  },
  {
    ...buildImperioCap1TemplateLevel(6),
    firstVictoryUnlockCatId: 'cat-forzudo',
    enemyWave: [
      { catId: 'enemy-triturador', spawnAtSeconds: 5 },
      { catId: 'enemy-rondador', spawnAtSeconds: 16 },
      { catId: 'enemy-turba', spawnAtSeconds: 30 },
    ],
    battleItemRewards: [{ itemId: 'speed-boost', count: 1 }],
  },
  {
    ...buildImperioCap1TemplateLevel(8),
    firstVictoryUnlockCatId: 'cat-verdoso',
    enemyWave: [
      { catId: 'enemy-turba', spawnAtSeconds: 5 },
      { catId: 'enemy-planeador', spawnAtSeconds: 16 },
      { catId: 'enemy-turba', spawnAtSeconds: 30 },
    ],
    battleItemRewards: [{ itemId: 'treasure-radar', count: 1 }],
  },
  {
    ...buildImperioCap1TemplateLevel(10),
    firstVictoryUnlockCatId: 'cat-deidad',
    enemyWave: [
      { catId: 'enemy-planeador', spawnAtSeconds: 5 },
      { catId: 'enemy-saltarin-alado', spawnAtSeconds: 16 },
      { catId: 'enemy-turba', spawnAtSeconds: 30 },
    ],
    battleItemRewards: [{ itemId: 'treasure-radar', count: 1 }],
  },
  {
    ...buildImperioCap1TemplateLevel(12),
    firstVictoryUnlockCatId: 'cat-cornamenta',
    enemyWave: [
      { catId: 'enemy-saltarin-alado', spawnAtSeconds: 5 },
      { catId: 'enemy-planeador', spawnAtSeconds: 16 },
      { catId: 'enemy-behemot-gris', spawnAtSeconds: 30 },
    ],
    battleItemRewards: [{ itemId: 'extra-energy', count: 1 }],
  },
  {
    ...buildImperioCap1TemplateLevel(16),
    firstVictoryUnlockCatId: 'cat-migratorio',
    enemyWave: [
      { catId: 'enemy-behemot-gris', spawnAtSeconds: 5 },
      { catId: 'enemy-carmesi', spawnAtSeconds: 16 },
      { catId: 'enemy-saltarin-alado', spawnAtSeconds: 30 },
    ],
    battleItemRewards: [{ itemId: 'speed-boost', count: 1 }],
  },
  {
    ...buildImperioCap1TemplateLevel(20),
    firstVictoryUnlockCatId: 'cat-centinela',
    enemyWave: [
      { catId: 'enemy-carmesi', spawnAtSeconds: 5 },
      { catId: 'enemy-emperador-volador', spawnAtSeconds: 16 },
      { catId: 'enemy-behemot-gris', spawnAtSeconds: 30 },
    ],
    battleItemRewards: [{ itemId: 'treasure-radar', count: 1 }],
  },
  {
    ...buildImperioCap1TemplateLevel(24),
    firstVictoryUnlockCatId: 'cat-anfibio',
    enemyWave: [
      { catId: 'enemy-emperador-volador', spawnAtSeconds: 5 },
      { catId: 'enemy-foca-blindada', spawnAtSeconds: 16 },
      { catId: 'enemy-carmesi', spawnAtSeconds: 30 },
    ],
    battleItemRewards: [{ itemId: 'extra-energy', count: 1 }],
  },
  {
    ...buildImperioCap1TemplateLevel(28),
    firstVictoryUnlockCatId: 'cat-escamado',
    enemyWave: [
      { catId: 'enemy-foca-blindada', spawnAtSeconds: 5 },
      { catId: 'enemy-boxeador', spawnAtSeconds: 16 },
      { catId: 'enemy-emperador-volador', spawnAtSeconds: 30 },
    ],
    battleItemRewards: [{ itemId: 'speed-boost', count: 1 }],
  },
  {
    ...buildImperioCap1TemplateLevel(32),
    firstVictoryUnlockCatId: 'cat-coloso',
    enemyWave: [
      { catId: 'enemy-boxeador', spawnAtSeconds: 5 },
      { catId: 'enemy-embestida', spawnAtSeconds: 16 },
      { catId: 'enemy-foca-blindada', spawnAtSeconds: 30 },
    ],
    battleItemRewards: [{ itemId: 'treasure-radar', count: 1 }],
  },
  {
    // specs/027 US5/specs/020: jefe de arco — enemyBaseHp propio (no la fórmula), sin firstVictoryUnlockCatId
    // (la recompensa de esta etapa es SagaArc.completionRewards.unlockCatIds, ver sagaArcs.ts).
    ...buildImperioCap1TemplateLevel(48),
    enemyBaseHp: 20000,
    enemyWave: [
      { catId: 'enemy-instructor-feroz', spawnAtSeconds: 5 },
      { catId: 'enemy-unicornio-guerra', spawnAtSeconds: 20 },
      { catId: 'enemy-la-mascara', spawnAtSeconds: 45 },
    ],
    battleItemRewards: [{ itemId: 'extra-energy', count: 2 }],
  },
]

const IMPERIO_CAP1_MILESTONE_STAGE_INDICES = new Set(
  IMPERIO_CAP1_MILESTONE_LEVELS.map((level) => Number(level.id.replace('imperio-cap1-etapa-', ''))),
)

/**
 * specs/027-capitulo-1-imperio-gatos (T006, FR-007). Los 13 hitos de T005 + las 35 etapas restantes
 * generadas por T003, en orden de N ascendente — export nombrado para que sagaArcs.ts (T007) construya
 * su `levelIds` sin repetir la lista de ids a mano.
 */
export const IMPERIO_CAP1_LEVELS: Level[] = Array.from({ length: 48 }, (_, index) => index + 1).map((stageIndex) =>
  IMPERIO_CAP1_MILESTONE_STAGE_INDICES.has(stageIndex)
    ? IMPERIO_CAP1_MILESTONE_LEVELS.find((level) => level.id === `imperio-cap1-etapa-${stageIndex}`)!
    : buildImperioCap1TemplateLevel(stageIndex),
)

LEVELS.push(...IMPERIO_CAP1_LEVELS)
