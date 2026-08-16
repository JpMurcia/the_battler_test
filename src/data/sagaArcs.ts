export interface SagaArcCompletionRewards {
  unlockCatIds?: string[]
  unlockNextArcId?: string
}

/** specs/012-saga-imperio-de-los-gatos. Un nivel pertenece a lo sumo un arco (plan.md Key Design Decision 1). */
export interface SagaArc {
  id: string
  name: string
  levelIds: string[]
  costMultiplier: number
  enemyStrengthMultiplier: number
  /** Nivel jefe del arco. */
  bossLevelId?: string
  /** specs/020-barrera-de-base (FR-001). `catId` del enemigo jefe dentro de `bossLevelId.enemyWave` — sin `bossLevelId`, no aplica. */
  bossCatId?: string
  completionRewards: SagaArcCompletionRewards
}

/** Fixture de bootstrap — valores de diseño provisionales, no balanceados (tasks.md Fase 1). */
export const SAGA_ARCS: SagaArc[] = [
  {
    id: 'arco-1-imperio-de-los-gatos',
    name: 'Imperio de los Gatos — Arco 1',
    levelIds: ['level-1'],
    costMultiplier: 0.8,
    enemyStrengthMultiplier: 0.8,
    completionRewards: { unlockNextArcId: 'arco-2-imperio-de-los-gatos' },
  },
  {
    id: 'arco-2-imperio-de-los-gatos',
    name: 'Imperio de los Gatos — Arco 2',
    levelIds: ['level-2'],
    costMultiplier: 1,
    enemyStrengthMultiplier: 1,
    // specs/020-barrera-de-base: level-2 es su propio nivel jefe — armored-cat (ya en su enemyWave) protege
    // la base enemiga hasta ser derrotado.
    bossLevelId: 'level-2',
    bossCatId: 'armored-cat',
    completionRewards: {},
  },
]

/** `deployUnit`/`spawnEnemyUnit`/`startLevel` resuelven el arco activo con este helper (FR-004: sin match, `undefined`). */
export function findArcByLevelId(levelId: string | null): SagaArc | undefined {
  if (!levelId) return undefined
  return SAGA_ARCS.find((arc) => arc.levelIds.includes(levelId))
}
