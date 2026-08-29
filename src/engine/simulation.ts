import { CATS } from '../data/cats'
import { LEVELS, type EnemyWaveEntry } from '../data/levels'
import { findArcByLevelId, SAGA_ARCS } from '../data/sagaArcs'
import { edgeGap, overlaps1D, withinRange1D, type Extent } from './collision'
import { resolveAreaEngagement, resolveBaseDamage, resolveEngagement } from './combat'
import type { BattleUnit } from './types'

/** specs/013-escalado-capitulos-sets-tesoros (US3/FR-005): valor por defecto cuando `Level.laneLength` no está declarado. */
export const LANE_LENGTH = 400
const BASE_WIDTH = 24

/** El ancho de la base del jugador no depende del carril — el parámetro existe por simetría con `getEnemyBaseExtent`. */
export function getPlayerBaseExtent(_laneLength: number): Extent {
  return { x: -BASE_WIDTH, width: BASE_WIDTH }
}

export function getEnemyBaseExtent(laneLength: number): Extent {
  return { x: laneLength, width: BASE_WIDTH }
}

interface BaseHp {
  hp: number
  maxHp: number
}

export interface SimState {
  status: 'Idle' | 'InProgress' | 'Victory' | 'Defeat'
  levelId: string | null
  energy: { current: number; max: number; regenPerSecond: number }
  playerBase: BaseHp
  enemyBase: BaseHp
  units: BattleUnit[]
  deployCooldowns: Record<string, number>
  elapsedSeconds: number
  enemiesSpawnedCount: number
  /** specs/012-saga-imperio-de-los-gatos (US7). Ausente = usa `level.enemyWave` en vivo (comportamiento previo). */
  activeEnemyWave?: EnemyWaveEntry[]
  /** specs/012-saga-imperio-de-los-gatos (US2). Refuerzos encolados con `spawnAtSeconds` absoluto, retenidos si el límite de simultáneos ya está alcanzado. */
  pendingReinforcements?: EnemyWaveEntry[]
  /** specs/012-saga-imperio-de-los-gatos (US2). Umbrales de `% hp` de la base enemiga ya disparados esta partida — nunca persistido. */
  triggeredBaseHpThresholdPercents?: number[]
  /** specs/013-escalado-capitulos-sets-tesoros (US3). Poblado en `startLevel` desde `level.laneLength ?? LANE_LENGTH`. */
  laneLength: number
  /** specs/017-objetos-de-batalla (US2). Poblado en `startLevel` desde el objeto "Aceleración de Velocidad" consumido — 1 si no hubo. */
  unitSpeedMultiplier: number
  /**
   * specs/020-barrera-de-base (FR-002). Derivado, recalculado en cada `stepSimulation` a partir de `units` —
   * nunca se escribe desde fuera ni se persiste (plan.md Constraints). `true` mientras el jefe vinculado del
   * `SagaArc.bossLevelId` activo siga vivo.
   */
  bossBarrierActive: boolean
}

/**
 * specs/038-catalogo-habilidades-avanzado (research.md Decisión 3): generalización de la antigua
 * `spawnEnemyUnit`, reutilizada por el spawn de oleada (`team: 'Enemy'`, `x: laneLength - cat.width`,
 * mismo resultado que antes) y por la resolución de `SummonOnDeath` (equipo/posición de la unidad que murió).
 * `enemyStrengthMultiplier` solo escala `hp`/`damage` para `team === 'Enemy'` — nunca escaló al jugador.
 */
function spawnUnitFromCat(
  catId: string,
  team: 'Player' | 'Enemy',
  x: number,
  enemyStrengthMultiplier: number,
  unitSpeedMultiplier: number,
): BattleUnit | null {
  const cat = CATS.find((candidate) => candidate.id === catId)
  if (!cat) return null
  // specs/012-saga-imperio-de-los-gatos (FR-003): multiplicador del arco activo, redondeado, sin modificar CATS.
  const strengthMultiplier = team === 'Enemy' ? enemyStrengthMultiplier : 1
  const hp = Math.round(cat.hp * strengthMultiplier)
  const damage = Math.round(cat.damage * strengthMultiplier)
  return {
    instanceId: `${team === 'Enemy' ? 'enemy-' : ''}${cat.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    catId: cat.id,
    team,
    x,
    width: cat.width,
    hp,
    maxHp: hp,
    damage,
    attackIntervalSeconds: cat.attackIntervalSeconds,
    attackCooldownRemaining: 0,
    // specs/017-objetos-de-batalla (US2/FR-008): "Aceleración de Velocidad" consumida, simétrica jugador/enemigo.
    speed: cat.speed * unitSpeedMultiplier,
    state: 'Moving',
    attackType: cat.attackType,
    attackRange: cat.attackRange,
    attackMinRange: cat.attackMinRange,
    areaRadius: cat.areaRadius,
    classification: cat.classification,
    specialClassification: cat.specialClassification,
    abilities: cat.abilities,
    immuneEffects: cat.immuneEffects,
    appliesEffect: cat.appliesEffect,
    curseRemainingSeconds: 0,
    resistantTo: cat.resistantTo,
    hitsPerSequence: cat.hitsPerSequence,
    criticalChance: cat.criticalChance,
    // specs/038-catalogo-habilidades-avanzado (FR-003): inicializado desde Ability.Shield si el gato lo declara.
    shieldRemainingHp: cat.abilities?.find((ability) => ability.kind === 'Shield')?.shieldHp,
  }
}

/**
 * Spawn de oleada enemiga en el borde del carril — envoltorio delgado sobre `spawnUnitFromCat` que resuelve
 * `x` a partir del `width` del gato (no disponible para el llamador sin su propio `CATS.find`, specs/038).
 */
function spawnEnemyUnit(catId: string, enemyStrengthMultiplier: number, laneLength: number, unitSpeedMultiplier: number): BattleUnit | null {
  const cat = CATS.find((candidate) => candidate.id === catId)
  if (!cat) return null
  return spawnUnitFromCat(catId, 'Enemy', laneLength - cat.width, enemyStrengthMultiplier, unitSpeedMultiplier)
}

/**
 * specs/008-tipos-de-ataque: generaliza "el primer oponente que se superpone" a los 3 tipos de ataque.
 * `candidates` ya debe venir filtrado al equipo enemigo y a instancias no procesadas todavía este tick.
 * `attackMinRange` (unidad "de salto/garrocha") descarta candidatos por debajo de esa distancia de borde
 * antes de aplicar cualquiera de las reglas de abajo — con `attackMinRange` ausente/0 no cambia nada.
 * - 'Single' (por defecto): el candidato más cercano dentro de `attackRange`.
 * - 'LongRange': el candidato más lejano dentro de `attackRange`; si además declara `areaRadius`, suma
 *   salpicadura alrededor de ese objetivo más lejano igual que 'Area' (unidad de ataque a distancia + impacto en área).
 * - 'Area': el más cercano (objetivo primario) + todo candidato adicional dentro de `areaRadius` de ese primario.
 */
export function findTargetsInRange(unit: BattleUnit, candidates: BattleUnit[]): BattleUnit[] {
  const attackType = unit.attackType ?? 'Single'
  const attackRange = unit.attackRange ?? 0
  const attackMinRange = unit.attackMinRange ?? 0
  const inRange = candidates.filter(
    (candidate) => withinRange1D(unit, candidate, attackRange) && edgeGap(unit, candidate) >= attackMinRange,
  )
  if (inRange.length === 0) return []

  if (attackType === 'LongRange') {
    const farthest = inRange.reduce((best, candidate) => (edgeGap(unit, candidate) > edgeGap(unit, best) ? candidate : best))
    if (!unit.areaRadius) return [farthest]
    const splash = candidates.filter(
      (candidate) => candidate.instanceId !== farthest.instanceId && withinRange1D(farthest, candidate, unit.areaRadius!),
    )
    return [farthest, ...splash]
  }

  const primary = inRange.reduce((best, candidate) => (edgeGap(unit, candidate) < edgeGap(unit, best) ? candidate : best))

  if (attackType === 'Area') {
    const areaRadius = unit.areaRadius ?? 0
    const splash = candidates.filter(
      (candidate) => candidate.instanceId !== primary.instanceId && withinRange1D(primary, candidate, areaRadius),
    )
    return [primary, ...splash]
  }

  return [primary]
}

/** Paso de simulación puro y determinista — sin temporizadores internos, sin dependencias de React/Pixi. */
export function stepSimulation(state: SimState, deltaSeconds: number): SimState {
  if (state.status !== 'InProgress') return state

  const elapsedSeconds = state.elapsedSeconds + deltaSeconds
  const energy = {
    ...state.energy,
    current: Math.min(state.energy.max, state.energy.current + state.energy.regenPerSecond * deltaSeconds),
  }
  const deployCooldowns = Object.fromEntries(
    Object.entries(state.deployCooldowns).map(([catId, remaining]) => [catId, Math.max(0, remaining - deltaSeconds)]),
  )

  const level = LEVELS.find((candidate) => candidate.id === state.levelId)
  // specs/012-saga-imperio-de-los-gatos (US1/FR-003): resuelto una vez por tick, nunca dentro del bucle de combate.
  const enemyStrengthMultiplier = findArcByLevelId(state.levelId)?.enemyStrengthMultiplier ?? 1
  // specs/012-saga-imperio-de-los-gatos (US7): `activeEnemyWave` explícito (Brote Zombi) o la oleada estándar del nivel en vivo.
  const activeWave = state.activeEnemyWave ?? level?.enemyWave ?? []
  const maxSimultaneousEnemies = level?.maxSimultaneousEnemies

  const spawned: BattleUnit[] = []
  let enemiesSpawnedCount = state.enemiesSpawnedCount
  let liveEnemyCount = state.units.filter((unit) => unit.team === 'Enemy' && unit.state !== 'Dead').length

  // specs/012-saga-imperio-de-los-gatos (US3/FR-006): retiene la generación sin descartar la entrada.
  while (
    enemiesSpawnedCount < activeWave.length &&
    activeWave[enemiesSpawnedCount].spawnAtSeconds <= elapsedSeconds &&
    (maxSimultaneousEnemies === undefined || liveEnemyCount < maxSimultaneousEnemies)
  ) {
    const unit = spawnEnemyUnit(activeWave[enemiesSpawnedCount].catId, enemyStrengthMultiplier, state.laneLength, state.unitSpeedMultiplier)
    if (unit) {
      spawned.push(unit)
      liveEnemyCount += 1
    }
    enemiesSpawnedCount += 1
  }

  // specs/012-saga-imperio-de-los-gatos (US2): refuerzos encolados por umbral de vida de base, mismo límite de simultáneos que US3.
  const stillPendingReinforcements: EnemyWaveEntry[] = []
  for (const entry of state.pendingReinforcements ?? []) {
    if (entry.spawnAtSeconds <= elapsedSeconds && (maxSimultaneousEnemies === undefined || liveEnemyCount < maxSimultaneousEnemies)) {
      const unit = spawnEnemyUnit(entry.catId, enemyStrengthMultiplier, state.laneLength, state.unitSpeedMultiplier)
      if (unit) {
        spawned.push(unit)
        liveEnemyCount += 1
      }
    } else {
      stillPendingReinforcements.push(entry)
    }
  }
  let pendingReinforcements = stillPendingReinforcements

  const alive = [...state.units, ...spawned]

  // specs/020-barrera-de-base (FR-001/002, plan.md Key Design Decision 1): recalculado cada tick a partir de
  // `units` — nunca un booleano que "apagar" manualmente, así que retirar la barrera al derrotar al jefe es
  // automático (deja de estar en `alive` la próxima vez que se evalúa).
  const bossArc = SAGA_ARCS.find((candidate) => candidate.bossLevelId === state.levelId && candidate.bossCatId)
  const bossBarrierActive = bossArc
    ? alive.some((unit) => unit.team === 'Enemy' && unit.catId === bossArc.bossCatId && unit.state !== 'Dead')
    : false

  const byId = new Map(alive.map((unit) => [unit.instanceId, unit]))
  const processed = new Set<string>()
  const engagements: { attackerId: string; targetIds: string[] }[] = []
  const baseAttackers: string[] = []
  const freeMovers: string[] = []

  for (const unit of alive) {
    if (processed.has(unit.instanceId)) continue
    // specs/015-catalogo-habilidades-combate (US2/FR-004): congelada no inicia engagement/ataque a base/movimiento
    // este tick — sigue en `alive` sin marcar `processed`, así que otra unidad todavía puede descubrirla como
    // objetivo (combat.ts impide que ella misma inflija daño al ser esa unidad pasiva).
    if ((unit.freezeRemainingSeconds ?? 0) > 0) continue
    const enemyTeam = unit.team === 'Player' ? 'Enemy' : 'Player'
    const candidatesInTeam = alive.filter((candidate) => candidate.team === enemyTeam && !processed.has(candidate.instanceId))
    const targets = findTargetsInRange(unit, candidatesInTeam)

    if (targets.length > 0) {
      processed.add(unit.instanceId)
      for (const target of targets) processed.add(target.instanceId)
      engagements.push({ attackerId: unit.instanceId, targetIds: targets.map((target) => target.instanceId) })
      continue
    }

    const opponentBaseExtent = unit.team === 'Player' ? getEnemyBaseExtent(state.laneLength) : getPlayerBaseExtent(state.laneLength)
    if (overlaps1D(unit, opponentBaseExtent)) {
      processed.add(unit.instanceId)
      baseAttackers.push(unit.instanceId)
      continue
    }

    processed.add(unit.instanceId)
    freeMovers.push(unit.instanceId)
  }

  // specs/028-ajustes-combate-mapa-disenos (US1/FR-001..FR-005): "refuerzo de fila" — promueve a `engagements`
  // toda unidad de `freeMovers` cuyo avance tentativo choque con un aliado ya trabado en combate (mismo
  // criterio `overlaps1D` que ya usa el bloqueo de movimiento más abajo), reutilizando el objetivo PRIMARIO
  // de ESE aliado (nunca sus objetivos de salpicadura, FR-002). `attackerId` de un engagement es arbitrario
  // (lo decide el orden de iteración de `alive` en el bucle de detección — puede ser el aliado o el enemigo
  // que lo descubrió primero), así que `opponentOf` mapea AMBOS lados de cada engagement a su rival, para que
  // un aliado bloqueado encuentre al bloqueador sin importar en qué lado quedó registrado. Fixed-point: repite
  // hasta una pasada sin promociones, para resolver cadenas de cualquier longitud sin depender del orden de
  // `alive` (research.md Decisión 2).
  const opponentOf = new Map<string, string>()
  for (const engagement of engagements) {
    opponentOf.set(engagement.attackerId, engagement.targetIds[0])
    for (const targetId of engagement.targetIds) {
      if (!opponentOf.has(targetId)) opponentOf.set(targetId, engagement.attackerId)
    }
  }
  let promotedAny = true
  while (promotedAny) {
    promotedAny = false
    const promotions: { id: string; targetId: string }[] = []
    for (const id of freeMovers) {
      const unit = byId.get(id)!
      const direction = unit.team === 'Player' ? 1 : -1
      const effectiveSpeed = (unit.slowRemainingSeconds ?? 0) > 0 ? unit.speed * (1 - (unit.slowMagnitude ?? 0)) : unit.speed
      const tentativeX = unit.x + direction * effectiveSpeed * deltaSeconds
      const blocker = alive.find(
        (candidate) =>
          candidate.instanceId !== unit.instanceId &&
          candidate.team === unit.team &&
          opponentOf.has(candidate.instanceId) &&
          overlaps1D({ x: tentativeX, width: unit.width }, candidate),
      )
      if (blocker) promotions.push({ id, targetId: opponentOf.get(blocker.instanceId)! })
    }
    for (const { id, targetId } of promotions) {
      engagements.push({ attackerId: id, targetIds: [targetId] })
      opponentOf.set(id, targetId)
      const index = freeMovers.indexOf(id)
      if (index !== -1) freeMovers.splice(index, 1)
      promotedAny = true
    }
  }

  let playerBase = { ...state.playerBase }
  let enemyBase = { ...state.enemyBase }
  const previousEnemyBaseHp = state.enemyBase.hp

  for (const { attackerId, targetIds } of engagements) {
    const attacker = { ...byId.get(attackerId)!, state: 'Engaged' as const }
    const primary = { ...byId.get(targetIds[0])!, state: 'Engaged' as const }

    // Más de un objetivo solo ocurre por salpicadura de área ('Area', o 'LongRange' con areaRadius) —
    // findTargetsInRange nunca devuelve >1 candidato para el resto de attackType.
    if (targetIds.length > 1) {
      const splashTargets = targetIds.slice(1).map((id) => byId.get(id)!)
      const result = resolveAreaEngagement(attacker, primary, splashTargets, deltaSeconds)
      byId.set(attackerId, result.attacker)
      byId.set(targetIds[0], result.primaryTarget)
      result.splashTargets.forEach((target, index) => byId.set(targetIds[index + 1], target))
    } else {
      const result = resolveEngagement(attacker, primary, deltaSeconds)
      byId.set(attackerId, result.a)
      byId.set(targetIds[0], result.b)
    }
  }

  for (const id of baseAttackers) {
    const unit = byId.get(id)!
    const targetBase = unit.team === 'Player' ? enemyBase : playerBase
    const result = resolveBaseDamage(unit, targetBase, deltaSeconds)
    byId.set(id, result.attacker)
    if (unit.team === 'Player') {
      // specs/020-barrera-de-base (FR-002/003, plan.md Key Design Decision 2): la unidad sigue "atacando" (su
      // cooldown ya se consumió arriba), pero el daño resuelto se descarta mientras el jefe vinculado viva.
      if (!bossBarrierActive) enemyBase = result.base
    } else {
      playerBase = result.base
    }
  }

  for (const id of freeMovers) {
    const unit = byId.get(id)!
    const direction = unit.team === 'Player' ? 1 : -1
    // specs/015-catalogo-habilidades-combate (US3/FR-005): Ralentizar reduce la velocidad efectiva de movimiento.
    const effectiveSpeed = (unit.slowRemainingSeconds ?? 0) > 0 ? unit.speed * (1 - (unit.slowMagnitude ?? 0)) : unit.speed
    const tentativeX = unit.x + direction * effectiveSpeed * deltaSeconds
    const blockedByAlly = alive.some(
      (candidate) =>
        candidate.instanceId !== unit.instanceId &&
        candidate.team === unit.team &&
        candidate.state !== 'Moving' &&
        overlaps1D({ x: tentativeX, width: unit.width }, candidate),
    )
    byId.set(id, { ...unit, x: blockedByAlly ? unit.x : tentativeX, state: 'Moving' })
  }

  // specs/009-clasificacion-habilidades (US5) / specs/015-catalogo-habilidades-combate: los 4 efectos de duración
  // decaen por tiempo real, para toda unidad viva sin importar su acción este tick.
  const DECAYING_EFFECT_FIELDS = ['curseRemainingSeconds', 'weakenRemainingSeconds', 'freezeRemainingSeconds', 'slowRemainingSeconds'] as const
  for (const [id, unit] of byId) {
    let next = unit
    for (const field of DECAYING_EFFECT_FIELDS) {
      if ((next[field] ?? 0) > 0) next = { ...next, [field]: Math.max(0, next[field]! - deltaSeconds) }
    }
    if (next !== unit) byId.set(id, next)
  }

  // specs/038-catalogo-habilidades-avanzado (FR-005/FR-007): toda unidad que murió este mismo tick con
  // `SummonOnDeath` genera sus invocaciones — nunca una que ya estuviera Dead al empezar el tick, porque
  // `units` filtra a las muertas al final de cada tick (invariante ya existente, nunca persisten a `state.units`).
  const summoned: BattleUnit[] = []
  for (const unit of byId.values()) {
    if (unit.state !== 'Dead' || (unit.curseRemainingSeconds ?? 0) > 0) continue
    for (const ability of unit.abilities ?? []) {
      if (ability.kind !== 'SummonOnDeath') continue
      for (let i = 0; i < ability.count; i += 1) {
        const newUnit = spawnUnitFromCat(ability.summonCatId, unit.team, unit.x, enemyStrengthMultiplier, state.unitSpeedMultiplier)
        if (newUnit) summoned.push(newUnit)
      }
    }
  }

  const units = [...Array.from(byId.values()).filter((unit) => unit.state !== 'Dead'), ...summoned]

  // specs/012-saga-imperio-de-los-gatos (US2/FR-005): dispara cada umbral no disparado todavía exactamente una vez al cruzarlo hacia abajo.
  let triggeredBaseHpThresholdPercents = state.triggeredBaseHpThresholdPercents ?? []
  if (level?.baseHpTriggers && state.enemyBase.maxHp > 0) {
    const previousPercent = (previousEnemyBaseHp / state.enemyBase.maxHp) * 100
    const currentPercent = (enemyBase.hp / enemyBase.maxHp) * 100
    for (const trigger of level.baseHpTriggers) {
      if (triggeredBaseHpThresholdPercents.includes(trigger.thresholdPercent)) continue
      if (previousPercent > trigger.thresholdPercent && currentPercent <= trigger.thresholdPercent) {
        triggeredBaseHpThresholdPercents = [...triggeredBaseHpThresholdPercents, trigger.thresholdPercent]
        pendingReinforcements = [
          ...pendingReinforcements,
          ...trigger.reinforcementWave.map((entry) => ({ catId: entry.catId, spawnAtSeconds: elapsedSeconds + entry.spawnAtSeconds })),
        ]
      }
    }
  }

  const nextState: SimState = {
    ...state,
    playerBase,
    enemyBase,
    units,
    energy,
    deployCooldowns,
    elapsedSeconds,
    enemiesSpawnedCount,
    pendingReinforcements,
    triggeredBaseHpThresholdPercents,
    bossBarrierActive,
  }

  if (playerBase.hp <= 0) return { ...nextState, status: 'Defeat' }
  if (enemyBase.hp <= 0) return { ...nextState, status: 'Victory' }
  return nextState
}
