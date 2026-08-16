import { describe, expect, it, vi } from 'vitest'
import { CATS } from '../../../src/data/cats'
import type { BattleUnit } from '../../../src/engine/types'
import { getEnemyBaseExtent, LANE_LENGTH, type SimState, stepSimulation } from '../../../src/engine/simulation'

// specs/013-escalado-capitulos-sets-tesoros (US3): ENEMY_BASE_EXTENT pasó de constante de módulo a función de
// `laneLength` — mismo resultado con el valor por defecto (400), sin cambiar aserciones.
const ENEMY_BASE_EXTENT = getEnemyBaseExtent(LANE_LENGTH)

// specs/012-saga-imperio-de-los-gatos: niveles de prueba dedicados, añadidos al catálogo real vía
// importOriginal — level-1/level-2 no se tocan, así los tests existentes permanecen intactos.
vi.mock('../../../src/data/levels', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/data/levels')>()
  return {
    ...actual,
    LEVELS: [
      ...actual.LEVELS,
      {
        id: 'arc-strength-test-level',
        name: 'Arco de Prueba',
        playerBaseHp: 1000,
        enemyBaseHp: 1000,
        maxEnergy: 100,
        energyRegenPerSecond: 5,
        currencyReward: 0,
        enemyWave: [{ catId: 'basic-cat', spawnAtSeconds: 0 }],
        energyCost: 0,
        region: 'test',
        difficulty: 1,
      },
      {
        id: 'threshold-test-level',
        name: 'Umbral de Prueba',
        playerBaseHp: 1000,
        enemyBaseHp: 100,
        maxEnergy: 100,
        energyRegenPerSecond: 5,
        currencyReward: 0,
        enemyWave: [],
        energyCost: 0,
        region: 'test',
        difficulty: 1,
        baseHpTriggers: [
          { thresholdPercent: 50, reinforcementWave: [{ catId: 'basic-cat', spawnAtSeconds: 0 }] },
          { thresholdPercent: 20, reinforcementWave: [{ catId: 'speed-cat', spawnAtSeconds: 0 }] },
        ],
      },
      {
        id: 'cap-test-level',
        name: 'Límite de Prueba',
        playerBaseHp: 1000,
        enemyBaseHp: 1000,
        maxEnergy: 100,
        energyRegenPerSecond: 5,
        currencyReward: 0,
        enemyWave: [
          { catId: 'basic-cat', spawnAtSeconds: 0 },
          { catId: 'basic-cat', spawnAtSeconds: 0 },
          { catId: 'basic-cat', spawnAtSeconds: 0 },
          { catId: 'basic-cat', spawnAtSeconds: 0 },
        ],
        energyCost: 0,
        region: 'test',
        difficulty: 1,
        maxSimultaneousEnemies: 3,
      },
    ],
  }
})

// specs/012-saga-imperio-de-los-gatos (US1): solo `arc-strength-test-level` tiene arco — el resto (incluido
// level-1/level-2 reales) queda en multiplicador 1, decoupled de los valores de producción de SAGA_ARCS.
vi.mock('../../../src/data/sagaArcs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/data/sagaArcs')>()
  return {
    ...actual,
    // specs/020-barrera-de-base: arco de prueba dedicado con bossLevelId/bossCatId — decoupled de arco-2 real.
    SAGA_ARCS: [
      ...actual.SAGA_ARCS,
      {
        id: 'test-boss-arc',
        name: 'Test Boss Arc',
        levelIds: ['boss-test-level'],
        costMultiplier: 1,
        enemyStrengthMultiplier: 1,
        bossLevelId: 'boss-test-level',
        bossCatId: 'test-boss-cat',
        completionRewards: {},
      },
    ],
    findArcByLevelId: (levelId: string | null) =>
      levelId === 'arc-strength-test-level'
        ? {
            id: 'test-arc',
            name: 'Test Arc',
            levelIds: ['arc-strength-test-level'],
            costMultiplier: 1,
            enemyStrengthMultiplier: 4,
            completionRewards: {},
          }
        : undefined,
  }
})

const { LEVELS } = await import('../../../src/data/levels')

function makeUnit(overrides: Partial<BattleUnit> = {}): BattleUnit {
  return {
    instanceId: 'unit-1',
    catId: 'basic-cat',
    team: 'Player',
    x: 0,
    width: 16,
    hp: 50,
    maxHp: 50,
    damage: 10,
    attackIntervalSeconds: 1,
    attackCooldownRemaining: 0,
    speed: 20,
    state: 'Moving',
    ...overrides,
  }
}

function makeState(overrides: Partial<SimState> = {}): SimState {
  return {
    status: 'InProgress',
    levelId: 'level-1',
    energy: { current: 0, max: 100, regenPerSecond: 5 },
    playerBase: { hp: 1000, maxHp: 1000 },
    enemyBase: { hp: 1000, maxHp: 1000 },
    units: [],
    deployCooldowns: {},
    elapsedSeconds: 0,
    enemiesSpawnedCount: 3, // sin oleada pendiente salvo que el test la reactive
    laneLength: LANE_LENGTH,
    unitSpeedMultiplier: 1,
    bossBarrierActive: false,
    ...overrides,
  }
}

describe('stepSimulation', () => {
  it('mueve una unidad sin bloqueo según su velocidad', () => {
    const unit = makeUnit({ x: 0, speed: 20 })
    const next = stepSimulation(makeState({ units: [unit] }), 1)

    expect(next.units[0].x).toBe(20)
    expect(next.units[0].state).toBe('Moving')
  })

  it('bloquea y combate cuando dos unidades enemigas se superponen', () => {
    const player = makeUnit({ instanceId: 'p1', team: 'Player', x: 0, width: 16, damage: 10, attackCooldownRemaining: 0 })
    const enemy = makeUnit({ instanceId: 'e1', team: 'Enemy', x: 5, width: 16, damage: 8, attackCooldownRemaining: 0 })

    const next = stepSimulation(makeState({ units: [player, enemy] }), 0.5)

    const nextPlayer = next.units.find((u) => u.instanceId === 'p1')!
    const nextEnemy = next.units.find((u) => u.instanceId === 'e1')!
    expect(nextPlayer.state).toBe('Engaged')
    expect(nextEnemy.state).toBe('Engaged')
    expect(nextPlayer.x).toBe(0) // no avanza mientras está bloqueada
    expect(nextEnemy.hp).toBeLessThan(50)
    expect(nextPlayer.hp).toBeLessThan(50)
  })

  it('inflige daño directo a la base enemiga cuando ninguna unidad bloquea el camino', () => {
    const unit = makeUnit({
      x: ENEMY_BASE_EXTENT.x,
      width: 16,
      damage: 30,
      attackCooldownRemaining: 0,
    })

    const next = stepSimulation(makeState({ units: [unit], enemyBase: { hp: 100, maxHp: 100 } }), 0.2)

    expect(next.enemyBase.hp).toBe(70)
    expect(next.units[0].x).toBe(ENEMY_BASE_EXTENT.x) // no avanza mientras ataca la base
  })

  it('regenera energía con el tiempo hasta el máximo del nivel', () => {
    const next = stepSimulation(makeState({ energy: { current: 98, max: 100, regenPerSecond: 5 } }), 1)
    expect(next.energy.current).toBe(100) // clamp al máximo, no 103
  })

  it('spawnea una entrada de la oleada enemiga exactamente cuando su spawnAtSeconds vence', () => {
    const before = stepSimulation(makeState({ elapsedSeconds: 4.8, enemiesSpawnedCount: 0 }), 0.1)
    expect(before.enemiesSpawnedCount).toBe(0)
    expect(before.units).toHaveLength(0)

    const after = stepSimulation(makeState({ elapsedSeconds: 4.9, enemiesSpawnedCount: 0 }), 0.2)
    expect(after.enemiesSpawnedCount).toBe(1)
    expect(after.units).toHaveLength(1)
    expect(after.units[0].team).toBe('Enemy')
    expect(after.units[0].catId).toBe('basic-cat')
  })

  it('resuelve Defeat cuando la base del jugador llega a 0 y detiene todo movimiento posterior', () => {
    const lethalUnit = makeUnit({
      team: 'Enemy',
      x: -24, // PLAYER_BASE_EXTENT.x
      width: 24,
      damage: 999,
      attackCooldownRemaining: 0,
    })
    const state = makeState({ units: [lethalUnit], playerBase: { hp: 10, maxHp: 1000 } })

    const afterHit = stepSimulation(state, 0.1)
    expect(afterHit.status).toBe('Defeat')

    const frozen = stepSimulation(afterHit, 1)
    expect(frozen).toBe(afterHit) // no-op: el estado ya no es 'InProgress'
  })

  it('resuelve Victory cuando la base enemiga llega a 0', () => {
    const finisher = makeUnit({
      team: 'Player',
      x: ENEMY_BASE_EXTENT.x,
      width: 16,
      damage: 999,
      attackCooldownRemaining: 0,
    })
    const state = makeState({ units: [finisher], enemyBase: { hp: 10, maxHp: 1000 } })

    const next = stepSimulation(state, 0.1)
    expect(next.status).toBe('Victory')
  })

  it('no avanza el estado cuando status no es InProgress', () => {
    const state = makeState({ status: 'Victory', elapsedSeconds: 42 })
    const next = stepSimulation(state, 5)
    expect(next).toBe(state)
  })

  it('una unidad Area daña a los 3 enemigos agrupados dentro de areaRadius en el mismo tick (specs/008 US1)', () => {
    const attacker = makeUnit({
      instanceId: 'attacker',
      team: 'Player',
      x: 0,
      width: 16,
      damage: 10,
      attackCooldownRemaining: 0,
      attackType: 'Area',
      attackRange: 0,
      areaRadius: 30,
    })
    const primary = makeUnit({ instanceId: 'primary', team: 'Enemy', x: 10, width: 16, hp: 50, attackCooldownRemaining: 5 })
    const splashA = makeUnit({ instanceId: 'splash-a', team: 'Enemy', x: 30, width: 16, hp: 50, attackCooldownRemaining: 5 })
    const splashB = makeUnit({ instanceId: 'splash-b', team: 'Enemy', x: 50, width: 16, hp: 50, attackCooldownRemaining: 5 })

    const next = stepSimulation(makeState({ units: [attacker, primary, splashA, splashB] }), 0.1)

    expect(next.units.find((u) => u.instanceId === 'primary')!.hp).toBe(40)
    expect(next.units.find((u) => u.instanceId === 'splash-a')!.hp).toBe(40)
    expect(next.units.find((u) => u.instanceId === 'splash-b')!.hp).toBe(40)
  })

  it('una unidad Single agrupada con varios enemigos solo daña a uno (specs/008 US2)', () => {
    const attacker = makeUnit({ instanceId: 'attacker', team: 'Player', x: 0, width: 16, damage: 10, attackCooldownRemaining: 0 })
    const near = makeUnit({ instanceId: 'near', team: 'Enemy', x: 10, width: 16, hp: 50, attackCooldownRemaining: 5 })
    const far = makeUnit({ instanceId: 'far', team: 'Enemy', x: 30, width: 16, hp: 50, attackCooldownRemaining: 5 })

    const next = stepSimulation(makeState({ units: [attacker, near, far] }), 0.1)

    expect(next.units.find((u) => u.instanceId === 'near')!.hp).toBe(40)
    expect(next.units.find((u) => u.instanceId === 'far')!.hp).toBe(50)
  })

  it('una unidad LongRange daña al enemigo más lejano dentro de attackRange, no al más cercano (specs/008 US3)', () => {
    const attacker = makeUnit({
      instanceId: 'attacker',
      team: 'Player',
      x: 0,
      width: 16,
      damage: 10,
      attackCooldownRemaining: 0,
      attackType: 'LongRange',
      attackRange: 100,
    })
    const near = makeUnit({ instanceId: 'near', team: 'Enemy', x: 20, width: 16, hp: 50, attackCooldownRemaining: 5 })
    const far = makeUnit({ instanceId: 'far', team: 'Enemy', x: 80, width: 16, hp: 50, attackCooldownRemaining: 5 })

    const next = stepSimulation(makeState({ units: [attacker, near, far] }), 0.1)

    expect(next.units.find((u) => u.instanceId === 'far')!.hp).toBe(40)
    expect(next.units.find((u) => u.instanceId === 'near')!.hp).toBe(50)
  })

  it('curseRemainingSeconds decrece por tick y no queda negativo (specs/009 US5)', () => {
    const cursed = makeUnit({ x: 200, curseRemainingSeconds: 0.15 })

    const next = stepSimulation(makeState({ units: [cursed] }), 0.1)
    expect(next.units[0].curseRemainingSeconds).toBeCloseTo(0.05)

    const after = stepSimulation(next, 0.1)
    expect(after.units[0].curseRemainingSeconds).toBe(0)
  })

  it('un enemigo Area daña a varias unidades del jugador agrupadas, igual que en US1 (specs/008 US4 — simetría)', () => {
    const attacker = makeUnit({
      instanceId: 'attacker',
      team: 'Enemy',
      x: 0,
      width: 16,
      damage: 10,
      attackCooldownRemaining: 0,
      attackType: 'Area',
      attackRange: 0,
      areaRadius: 30,
    })
    const primary = makeUnit({ instanceId: 'primary', team: 'Player', x: 10, width: 16, hp: 50, attackCooldownRemaining: 5 })
    const splashA = makeUnit({ instanceId: 'splash-a', team: 'Player', x: 30, width: 16, hp: 50, attackCooldownRemaining: 5 })
    const splashB = makeUnit({ instanceId: 'splash-b', team: 'Player', x: 50, width: 16, hp: 50, attackCooldownRemaining: 5 })

    const next = stepSimulation(makeState({ units: [attacker, primary, splashA, splashB] }), 0.1)

    expect(next.units.find((u) => u.instanceId === 'primary')!.hp).toBe(40)
    expect(next.units.find((u) => u.instanceId === 'splash-a')!.hp).toBe(40)
    expect(next.units.find((u) => u.instanceId === 'splash-b')!.hp).toBe(40)
  })

  it('specs/011-nivel-2-hacia-el-futuro (T004): con la configuración real de level-2, spawnea toda la oleada y termina en Victory cuando la base enemiga llega a 0', () => {
    const level2 = LEVELS.find((candidate) => candidate.id === 'level-2')!
    let state = makeState({ levelId: 'level-2', enemyBase: { hp: 5, maxHp: level2.enemyBaseHp }, enemiesSpawnedCount: 0 })

    // Avanza más allá del último spawnAtSeconds de la oleada de level-2.
    const lastSpawn = Math.max(...level2.enemyWave.map((entry) => entry.spawnAtSeconds))
    state = stepSimulation(state, lastSpawn + 1)
    expect(state.enemiesSpawnedCount).toBe(level2.enemyWave.length)
    expect(state.units.filter((u) => u.team === 'Enemy')).toHaveLength(level2.enemyWave.length)

    const finisher = makeUnit({
      instanceId: 'finisher',
      team: 'Player',
      x: ENEMY_BASE_EXTENT.x,
      width: 16,
      damage: 999,
      attackCooldownRemaining: 0,
    })
    const next = stepSimulation({ ...state, units: [finisher] }, 0.1)

    expect(next.status).toBe('Victory')
  })

  describe('specs/012-saga-imperio-de-los-gatos', () => {
    it('US1/FR-003: un enemigo generado en un nivel de un arco aplica enemyStrengthMultiplier a hp/damage, redondeado', () => {
      const baseCat = CATS.find((candidate) => candidate.id === 'basic-cat')!
      const state = makeState({ levelId: 'arc-strength-test-level', enemiesSpawnedCount: 0 })

      const next = stepSimulation(state, 0.1)

      const enemy = next.units.find((unit) => unit.team === 'Enemy')!
      expect(enemy.hp).toBe(Math.round(baseCat.hp * 4))
      expect(enemy.maxHp).toBe(Math.round(baseCat.hp * 4))
      expect(enemy.damage).toBe(Math.round(baseCat.damage * 4))
    })

    it('US1/FR-004: un nivel sin arco declarado genera enemigos con sus stats base, sin multiplicar', () => {
      const baseCat = CATS.find((candidate) => candidate.id === 'basic-cat')!
      const state = makeState({ levelId: 'level-1', activeEnemyWave: [{ catId: 'basic-cat', spawnAtSeconds: 0 }], enemiesSpawnedCount: 0 })

      const next = stepSimulation(state, 0.1)

      const enemy = next.units.find((unit) => unit.team === 'Enemy')!
      expect(enemy.hp).toBe(baseCat.hp)
      expect(enemy.damage).toBe(baseCat.damage)
    })

    it('US2/FR-005: un umbral de vida de base se dispara exactamente una vez al cruzarlo hacia abajo', () => {
      const attacker = makeUnit({
        instanceId: 'attacker',
        team: 'Player',
        x: ENEMY_BASE_EXTENT.x,
        width: 16,
        damage: 15,
        attackCooldownRemaining: 0,
      })
      const state = makeState({ levelId: 'threshold-test-level', enemyBase: { hp: 60, maxHp: 100 }, units: [attacker] })

      const next = stepSimulation(state, 0.1)
      expect(next.enemyBase.hp).toBe(45) // 60% → 45%, cruza el umbral del 50%
      expect(next.triggeredBaseHpThresholdPercents).toEqual([50])
      expect(next.pendingReinforcements).toEqual([{ catId: 'basic-cat', spawnAtSeconds: next.elapsedSeconds }])

      // Sigue bajando del 45% al 30% — el umbral ya disparado (50%) no vuelve a añadir refuerzos.
      const after = stepSimulation({ ...next, units: [], pendingReinforcements: [], enemyBase: { hp: 30, maxHp: 100 } }, 10)
      expect(after.triggeredBaseHpThresholdPercents).toEqual([50])
    })

    it('US2 Edge Case: dos umbrales cruzados en el mismo tick se disparan ambos, cada uno una única vez', () => {
      const state = makeState({ levelId: 'threshold-test-level', enemyBase: { hp: 60, maxHp: 100 } })

      // Un solo golpe lleva la vida de 60% a 15% en el mismo tick: ambos umbrales (50 y 20) se cruzan a la vez.
      const finisher = makeUnit({
        instanceId: 'finisher',
        team: 'Player',
        x: ENEMY_BASE_EXTENT.x,
        width: 16,
        damage: 45,
        attackCooldownRemaining: 0,
      })
      const droppedTo15 = stepSimulation({ ...state, units: [finisher] }, 0.1)

      expect(droppedTo15.enemyBase.hp).toBe(15)
      expect(droppedTo15.triggeredBaseHpThresholdPercents).toEqual(expect.arrayContaining([50, 20]))
      expect(droppedTo15.triggeredBaseHpThresholdPercents).toHaveLength(2)
    })

    it('US3/FR-006: con maxSimultaneousEnemies alcanzado, retiene la generación sin descartar la entrada', () => {
      const state = makeState({ levelId: 'cap-test-level', enemiesSpawnedCount: 0 })

      const next = stepSimulation(state, 0.1)
      expect(next.units.filter((unit) => unit.team === 'Enemy')).toHaveLength(3)
      expect(next.enemiesSpawnedCount).toBe(3) // el 4º queda retenido, no descartado

      // Uno de los tres muere y ya fue filtrado de `units` (invariante entre ticks) — el retenido se genera ahora.
      const oneDead = { ...next, units: next.units.filter((_unit, index) => index !== 0) }
      const after = stepSimulation(oneDead, 0.1)
      expect(after.units.filter((unit) => unit.team === 'Enemy')).toHaveLength(3)
      expect(after.enemiesSpawnedCount).toBe(4)
    })

    it('US7/FR-011: con activeEnemyWave declarado (Brote Zombi), los enemigos provienen de él, nunca de level.enemyWave', () => {
      const state = makeState({
        levelId: 'level-1', // enemyWave real de level-1 spawnearía basic-cat a los 5s — no debe usarse aquí.
        activeEnemyWave: [{ catId: 'speed-cat', spawnAtSeconds: 0 }],
        enemiesSpawnedCount: 0,
        elapsedSeconds: 0,
      })

      const next = stepSimulation(state, 5.1) // más allá del spawnAtSeconds del enemyWave real (5s)

      const enemies = next.units.filter((unit) => unit.team === 'Enemy')
      expect(enemies).toHaveLength(1)
      expect(enemies[0].catId).toBe('speed-cat')
      expect(next.enemiesSpawnedCount).toBe(1) // agotó activeEnemyWave (longitud 1), no el enemyWave real de level-1
    })
  })

  describe('specs/013-escalado-capitulos-sets-tesoros', () => {
    it('US3/FR-004/SC-003: el punto de llegada a la base enemiga escala con laneLength, no queda fijo en 400', () => {
      const unit = makeUnit({ x: 400, width: 16, speed: 50, damage: 20, attackCooldownRemaining: 0 })

      const shortLane = stepSimulation(makeState({ laneLength: 400, units: [unit], enemyBase: { hp: 100, maxHp: 100 } }), 0.1)
      const longLane = stepSimulation(makeState({ laneLength: 600, units: [unit], enemyBase: { hp: 100, maxHp: 100 } }), 0.1)

      expect(shortLane.enemyBase.hp).toBe(80) // x=400 ya alcanza getEnemyBaseExtent(400).x
      expect(longLane.enemyBase.hp).toBe(100) // x=400 todavía no alcanza getEnemyBaseExtent(600).x
      expect(longLane.units[0].x).toBeGreaterThan(400) // sigue avanzando como freeMover hacia la base
    })
  })

  describe('specs/015-catalogo-habilidades-combate', () => {
    it('US2/FR-004: una unidad congelada no cambia su x mientras freezeRemainingSeconds > 0', () => {
      const frozen = makeUnit({ x: 0, speed: 50, freezeRemainingSeconds: 2 })

      const next = stepSimulation(makeState({ units: [frozen] }), 0.5)

      expect(next.units[0].x).toBe(0)
      expect(next.units[0].freezeRemainingSeconds).toBeCloseTo(1.5)
    })

    it('una unidad congelada descubierta como objetivo de otra no contraataca (no inflige daño)', () => {
      const frozenEnemy = makeUnit({
        instanceId: 'frozen-enemy',
        team: 'Enemy',
        x: 5,
        width: 16,
        damage: 999,
        attackCooldownRemaining: 0,
        freezeRemainingSeconds: 2,
      })
      const player = makeUnit({ instanceId: 'player', team: 'Player', x: 0, width: 16, hp: 50, damage: 10, attackCooldownRemaining: 0 })

      const next = stepSimulation(makeState({ units: [player, frozenEnemy] }), 0.1)

      expect(next.units.find((u) => u.instanceId === 'player')!.hp).toBe(50) // el enemigo congelado no devolvió el golpe
    })

    it('al expirar freezeRemainingSeconds, retoma su comportamiento normal en el siguiente tick', () => {
      const almostThawed = makeUnit({ x: 0, speed: 50, freezeRemainingSeconds: 0.05 })

      const next = stepSimulation(makeState({ units: [almostThawed] }), 0.1) // decae a 0 este mismo tick, ya clasificado como congelada
      expect(next.units[0].freezeRemainingSeconds).toBe(0)
      expect(next.units[0].x).toBe(0)

      const after = stepSimulation(next, 0.1)
      expect(after.units[0].x).toBeGreaterThan(0)
    })

    it('con immuneEffects incluyendo Freeze, un impacto de Congelar no la congela (specs/009 FR-007)', () => {
      const attacker = makeUnit({
        instanceId: 'attacker',
        team: 'Player',
        x: 0,
        width: 16,
        damage: 5,
        attackCooldownRemaining: 0,
        appliesEffect: { type: 'Freeze', durationSeconds: 3 },
      })
      const immuneDefender = makeUnit({
        instanceId: 'immune',
        team: 'Enemy',
        x: 5,
        width: 16,
        attackCooldownRemaining: 5,
        immuneEffects: ['Freeze'],
      })

      const next = stepSimulation(makeState({ units: [attacker, immuneDefender] }), 0.1)

      expect(next.units.find((u) => u.instanceId === 'immune')!.freezeRemainingSeconds ?? 0).toBe(0)
    })

    it('US3/FR-005: una unidad ralentizada avanza menos distancia por tick que sin el efecto', () => {
      const slowed = makeUnit({ x: 0, speed: 100, slowRemainingSeconds: 2, slowMagnitude: 0.5 })
      const normal = makeUnit({ x: 0, speed: 100 })

      const slowedNext = stepSimulation(makeState({ units: [slowed] }), 1)
      const normalNext = stepSimulation(makeState({ units: [normal] }), 1)

      expect(slowedNext.units[0].x).toBe(50) // 100 * (1-0.5) * 1
      expect(normalNext.units[0].x).toBe(100)
    })

    it('US3/FR-006: ralentizada y congelada simultáneamente no se mueve — Congelar prevalece', () => {
      const both = makeUnit({ x: 0, speed: 100, slowRemainingSeconds: 2, slowMagnitude: 0.5, freezeRemainingSeconds: 2 })

      const next = stepSimulation(makeState({ units: [both] }), 1)

      expect(next.units[0].x).toBe(0)
    })
  })

  describe('specs/016-multigolpe-critico', () => {
    it('US2/FR-005: MultiHit que pierde su objetivo y adquiere uno nuevo aplica una secuencia completa, no una parcial', () => {
      const attacker = makeUnit({
        instanceId: 'attacker',
        team: 'Player',
        x: 0,
        width: 16,
        damage: 10,
        attackCooldownRemaining: 0,
        attackType: 'MultiHit',
        hitsPerSequence: 3,
      })
      const firstTarget = makeUnit({ instanceId: 'first', team: 'Enemy', x: 5, width: 16, hp: 15, attackCooldownRemaining: 5 }) // muere en el 2º golpe

      const afterFirst = stepSimulation(makeState({ units: [attacker, firstTarget] }), 0.1)
      expect(afterFirst.units.find((u) => u.instanceId === 'first')).toBeUndefined() // murió, ya filtrada de units

      const nextAttacker = { ...afterFirst.units.find((u) => u.instanceId === 'attacker')!, attackCooldownRemaining: 0 }
      const secondTarget = makeUnit({ instanceId: 'second', team: 'Enemy', x: 5, width: 16, hp: 1000, attackCooldownRemaining: 5 })

      const afterSecond = stepSimulation(makeState({ units: [nextAttacker, secondTarget] }), 0.1)

      expect(afterSecond.units.find((u) => u.instanceId === 'second')!.hp).toBe(970) // 1000 - 10*3, secuencia completa nueva
    })
  })

  describe('specs/017-objetos-de-batalla', () => {
    it('US2/FR-008: unitSpeedMultiplier se aplica también a enemigos generados por la oleada, simétrico con deployUnit', () => {
      const baseCat = CATS.find((candidate) => candidate.id === 'basic-cat')!
      const state = makeState({ levelId: 'arc-strength-test-level', enemiesSpawnedCount: 0, unitSpeedMultiplier: 1.5 })

      const next = stepSimulation(state, 0.1)

      const enemy = next.units.find((unit) => unit.team === 'Enemy')!
      expect(enemy.speed).toBe(baseCat.speed * 1.5)
    })

    it('sin unitSpeedMultiplier (1, valor por defecto), un enemigo generado usa su speed base', () => {
      const baseCat = CATS.find((candidate) => candidate.id === 'basic-cat')!
      const state = makeState({ levelId: 'arc-strength-test-level', enemiesSpawnedCount: 0 })

      const next = stepSimulation(state, 0.1)

      const enemy = next.units.find((unit) => unit.team === 'Enemy')!
      expect(enemy.speed).toBe(baseCat.speed)
    })
  })

  describe('specs/020-barrera-de-base', () => {
    const bossUnit = () =>
      makeUnit({ instanceId: 'boss', catId: 'test-boss-cat', team: 'Enemy', x: 5, width: 16, hp: 100, attackCooldownRemaining: 5 })

    it('US1/FR-002: con el jefe vinculado vivo, enemyBase.hp no cambia tras varios ticks de ataque', () => {
      const attacker = makeUnit({
        instanceId: 'attacker',
        team: 'Player',
        x: ENEMY_BASE_EXTENT.x,
        width: 16,
        damage: 999,
        attackCooldownRemaining: 0,
      })
      let state = makeState({ levelId: 'boss-test-level', units: [attacker, bossUnit()], enemyBase: { hp: 100, maxHp: 100 } })

      for (let i = 0; i < 5; i += 1) state = stepSimulation(state, 0.1)

      expect(state.enemyBase.hp).toBe(100)
      expect(state.bossBarrierActive).toBe(true)
    })

    it('FR-006: un nivel sin bossLevelId/bossCatId configurado se comporta exactamente igual que hoy', () => {
      const attacker = makeUnit({
        instanceId: 'attacker',
        team: 'Player',
        x: ENEMY_BASE_EXTENT.x,
        width: 16,
        damage: 30,
        attackCooldownRemaining: 0,
      })
      const state = makeState({ levelId: 'level-1', units: [attacker], enemyBase: { hp: 100, maxHp: 100 } })

      const next = stepSimulation(state, 0.1)

      expect(next.enemyBase.hp).toBe(70)
      expect(next.bossBarrierActive).toBe(false)
    })

    it('US2/FR-004: sin el jefe vinculado en units (derrotado), el daño se aplica con normalidad y la barrera está inactiva', () => {
      const attacker = makeUnit({
        instanceId: 'attacker',
        team: 'Player',
        x: ENEMY_BASE_EXTENT.x,
        width: 16,
        damage: 30,
        attackCooldownRemaining: 0,
      })
      // El jefe ya no está en units — mismo invariante que cualquier unidad Dead, ya filtrada entre ticks.
      const state = makeState({ levelId: 'boss-test-level', units: [attacker], enemyBase: { hp: 100, maxHp: 100 } })

      const next = stepSimulation(state, 0.1)

      expect(next.bossBarrierActive).toBe(false)
      expect(next.enemyBase.hp).toBe(70)
    })

    it('FR-005: derrotar únicamente enemigos regulares (no el jefe) no retira la barrera', () => {
      const attacker = makeUnit({
        instanceId: 'attacker',
        team: 'Player',
        x: ENEMY_BASE_EXTENT.x,
        width: 16,
        damage: 999,
        attackCooldownRemaining: 0,
      })
      const regularEnemy = makeUnit({ instanceId: 'regular', catId: 'basic-cat', team: 'Enemy', x: 200, width: 16 })
      const state = makeState({
        levelId: 'boss-test-level',
        units: [attacker, regularEnemy, bossUnit()],
        enemyBase: { hp: 100, maxHp: 100 },
      })

      const next = stepSimulation(state, 0.1)

      expect(next.bossBarrierActive).toBe(true)
      expect(next.enemyBase.hp).toBe(100)
    })

    it('US2: con el jefe derrotado, una unidad puede reducir enemyBase.hp hasta 0 y el nivel resuelve Victory', () => {
      const finisher = makeUnit({
        instanceId: 'finisher',
        team: 'Player',
        x: ENEMY_BASE_EXTENT.x,
        width: 16,
        damage: 999,
        attackCooldownRemaining: 0,
      })
      const state = makeState({ levelId: 'boss-test-level', units: [finisher], enemyBase: { hp: 10, maxHp: 100 } })

      const next = stepSimulation(state, 0.1)

      expect(next.status).toBe('Victory')
    })

    it('FR-007: un nuevo intento con el jefe otra vez vivo recalcula bossBarrierActive a true — nada se recuerda entre partidas', () => {
      const attacker = makeUnit({
        instanceId: 'attacker',
        team: 'Player',
        x: ENEMY_BASE_EXTENT.x,
        width: 16,
        damage: 30,
        attackCooldownRemaining: 0,
      })
      const freshAttempt = makeState({ levelId: 'boss-test-level', units: [attacker, bossUnit()], enemyBase: { hp: 100, maxHp: 100 } })

      const next = stepSimulation(freshAttempt, 0.1)

      expect(next.bossBarrierActive).toBe(true)
      expect(next.enemyBase.hp).toBe(100)
    })
  })
})
