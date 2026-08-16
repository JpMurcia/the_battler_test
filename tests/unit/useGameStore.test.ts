import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useGameStore } from '../../src/state/useGameStore'
import { useMetaStore } from '../../src/state/useMetaStore'
import type { BattleUnit } from '../../src/engine/types'

// specs/012/013: niveles de prueba dedicados, añadidos al catálogo real vía importOriginal — level-1/level-2
// no se tocan, así los tests existentes (incluidos los de Brote Zombi) permanecen intactos.
vi.mock('../../src/data/levels', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/data/levels')>()
  return {
    ...actual,
    LEVELS: [
      ...actual.LEVELS,
      {
        id: 'strength-arc-test-level',
        name: 'Arco de Fuerza de Prueba',
        playerBaseHp: 1000,
        enemyBaseHp: 500,
        maxEnergy: 100,
        energyRegenPerSecond: 5,
        currencyReward: 0,
        enemyWave: [],
        energyCost: 0,
        region: 'test',
        difficulty: 1,
      },
      {
        id: 'lane-length-test-level',
        name: 'Carril de Prueba',
        playerBaseHp: 1000,
        enemyBaseHp: 1000,
        maxEnergy: 100,
        energyRegenPerSecond: 5,
        currencyReward: 0,
        enemyWave: [],
        energyCost: 0,
        region: 'test',
        difficulty: 1,
        laneLength: 600,
      },
    ],
  }
})

// specs/012-saga-imperio-de-los-gatos (US1): solo los niveles de prueba dedicados tienen arco — decoupled de
// los valores de producción de SAGA_ARCS (level-1/level-2 quedan en multiplicador 1 dentro de este archivo).
vi.mock('../../src/data/sagaArcs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/data/sagaArcs')>()
  return {
    ...actual,
    findArcByLevelId: (levelId: string | null) => {
      if (levelId === 'cost-arc-test-level') {
        return {
          id: 'cost-test-arc',
          name: 'Cost Test Arc',
          levelIds: ['cost-arc-test-level'],
          costMultiplier: 0.5,
          enemyStrengthMultiplier: 1,
          completionRewards: {},
        }
      }
      if (levelId === 'strength-arc-test-level') {
        return {
          id: 'strength-test-arc',
          name: 'Strength Test Arc',
          levelIds: ['strength-arc-test-level'],
          costMultiplier: 1,
          enemyStrengthMultiplier: 3,
          completionRewards: {},
        }
      }
      return undefined
    },
  }
})

const { LEVELS } = await import('../../src/data/levels')

function makeEnemyUnit(overrides: Partial<BattleUnit> = {}): BattleUnit {
  return {
    instanceId: 'enemy-1',
    catId: 'basic-cat',
    team: 'Enemy',
    x: 0,
    width: 16,
    hp: 50,
    maxHp: 50,
    damage: 5,
    attackIntervalSeconds: 1,
    attackCooldownRemaining: 0,
    speed: 20,
    state: 'Moving',
    ...overrides,
  }
}

// specs/010-evolucion-de-gatos: gato de prueba con `evolutions` declarado, añadido al catálogo
// real vía importOriginal — el catálogo de producción no declara evoluciones (spec.md Assumptions).
vi.mock('../../src/data/cats', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/data/cats')>()
  return {
    ...actual,
    CATS: [
      ...actual.CATS,
      {
        id: 'evo-test-cat',
        name: 'Gato de Prueba Evolutivo',
        cost: 10,
        cooldownSeconds: 2,
        hp: 50,
        damage: 5,
        speed: 20,
        width: 16,
        attackIntervalSeconds: 1,
        attackType: 'Single',
        attackRange: 0,
        classification: 'Traitless',
        evolutions: {
          second: { requiredLevel: 5, hpMultiplier: 1.5, damageMultiplier: 1.2 },
          true: { requiredLevel: 10, hpMultiplier: 2, damageMultiplier: 2, requiredItemCount: 3 },
        },
      },
    ],
  }
})

const { CATS } = await import('../../src/data/cats')

const cat = CATS[0]
const evoCat = CATS.find((candidate) => candidate.id === 'evo-test-cat')!

beforeEach(() => {
  useGameStore.getState().reset()
  useMetaStore.setState({ ownedCats: {}, evolutionItems: {} })
})

describe('useGameStore.deployUnit', () => {
  it('rechaza sin efecto si la energía es insuficiente', () => {
    useGameStore.setState({ energy: { current: 0, max: 100, regenPerSecond: 0 } })

    const ok = useGameStore.getState().deployUnit(cat.id)

    expect(ok).toBe(false)
    expect(useGameStore.getState().units).toHaveLength(0)
  })

  it('rechaza sin efecto si el catId está en cooldown', () => {
    useGameStore.setState({
      energy: { current: 999, max: 999, regenPerSecond: 0 },
      deployCooldowns: { [cat.id]: 5 },
    })

    const ok = useGameStore.getState().deployUnit(cat.id)

    expect(ok).toBe(false)
    expect(useGameStore.getState().units).toHaveLength(0)
  })

  it('despliega la unidad y descuenta energía cuando es válido', () => {
    useGameStore.setState({ energy: { current: 999, max: 999, regenPerSecond: 0 } })

    const ok = useGameStore.getState().deployUnit(cat.id)

    const state = useGameStore.getState()
    expect(ok).toBe(true)
    expect(state.units).toHaveLength(1)
    expect(state.energy.current).toBe(999 - cat.cost)
    expect(state.deployCooldowns[cat.id]).toBe(cat.cooldownSeconds)
  })
})

describe('useGameStore.deployUnit — evolución (specs/010-evolucion-de-gatos)', () => {
  it('US1/FR-008: en evolutionStage Second aplica hpMultiplier/damageMultiplier a la unidad creada', () => {
    useMetaStore.setState({
      ownedCats: { [evoCat.id]: { level: 5, experienceInvested: 0, evolutionStage: 'Second' } },
    })
    useGameStore.setState({ energy: { current: 999, max: 999, regenPerSecond: 0 } })

    useGameStore.getState().deployUnit(evoCat.id)

    const unit = useGameStore.getState().units[0]
    expect(unit.hp).toBe(evoCat.hp * evoCat.evolutions!.second.hpMultiplier)
    expect(unit.maxHp).toBe(evoCat.hp * evoCat.evolutions!.second.hpMultiplier)
    expect(unit.damage).toBe(evoCat.damage * evoCat.evolutions!.second.damageMultiplier)
  })

  it('US3/FR-008: en evolutionStage True produce el doble de hp/damage respecto a Base', () => {
    useGameStore.setState({ energy: { current: 999, max: 999, regenPerSecond: 0 } })
    useGameStore.getState().deployUnit(evoCat.id)
    const baseUnit = useGameStore.getState().units[0]

    useGameStore.getState().reset()
    useMetaStore.setState({
      ownedCats: { [evoCat.id]: { level: 10, experienceInvested: 0, evolutionStage: 'True' } },
    })
    useGameStore.setState({ energy: { current: 999, max: 999, regenPerSecond: 0 } })
    useGameStore.getState().deployUnit(evoCat.id)
    const trueUnit = useGameStore.getState().units[0]

    expect(trueUnit.hp).toBe(baseUnit.hp * 2)
    expect(trueUnit.damage).toBe(baseUnit.damage * 2)
  })

  it('un gato sin evolutionStage registrado en useMetaStore se despliega con sus stats base (Base por defecto)', () => {
    useGameStore.setState({ energy: { current: 999, max: 999, regenPerSecond: 0 } })

    useGameStore.getState().deployUnit(evoCat.id)

    const unit = useGameStore.getState().units[0]
    expect(unit.hp).toBe(evoCat.hp)
    expect(unit.damage).toBe(evoCat.damage)
  })
})

describe('useGameStore.tick', () => {
  it('delega en stepSimulation: avanza elapsedSeconds y regenera energía mientras la batalla está en curso', () => {
    useGameStore.getState().startLevel('level-1')
    useGameStore.setState({ energy: { current: 0, max: 100, regenPerSecond: 5 } })

    useGameStore.getState().tick(1)

    const state = useGameStore.getState()
    expect(state.elapsedSeconds).toBe(1)
    expect(state.energy.current).toBe(5)
  })

  it('no hace nada si la batalla no está en curso (status Idle)', () => {
    const before = useGameStore.getState()
    useGameStore.getState().tick(1)
    const after = useGameStore.getState()

    expect(after.elapsedSeconds).toBe(before.elapsedSeconds)
    expect(after.status).toBe('Idle')
  })
})

describe('useGameStore.reset', () => {
  it('limpia el estado efímero de la batalla a su estado inicial (US3 — salir sin dejar rastro)', () => {
    useGameStore.getState().startLevel('level-1')
    useGameStore.setState({ energy: { current: 999, max: 999, regenPerSecond: 0 } })
    useGameStore.getState().deployUnit(cat.id)
    useGameStore.getState().tick(3)

    useGameStore.getState().reset()

    const state = useGameStore.getState()
    expect(state.status).toBe('Idle')
    expect(state.levelId).toBeNull()
    expect(state.units).toEqual([])
    expect(state.deployCooldowns).toEqual({})
    expect(state.elapsedSeconds).toBe(0)
    expect(state.enemiesSpawnedCount).toBe(0)
  })
})

describe('useGameStore.deployUnit — escalado de costo por arco (specs/012-saga-imperio-de-los-gatos US1)', () => {
  it('FR-002: cobra el costo base multiplicado por el arco del nivel activo, redondeado', () => {
    useGameStore.setState({ energy: { current: 999, max: 999, regenPerSecond: 0 }, levelId: 'cost-arc-test-level' })

    useGameStore.getState().deployUnit(cat.id)

    expect(useGameStore.getState().energy.current).toBe(999 - Math.round(cat.cost * 0.5))
  })

  it('FR-004: sin arco encontrado para el nivel activo, cobra el costo base sin multiplicar', () => {
    useGameStore.setState({ energy: { current: 999, max: 999, regenPerSecond: 0 }, levelId: 'no-arc-level' })

    useGameStore.getState().deployUnit(cat.id)

    expect(useGameStore.getState().energy.current).toBe(999 - cat.cost)
  })
})

describe('useGameStore.activateSpecialCannon (specs/012-saga-imperio-de-los-gatos US5)', () => {
  it('con recarga completa, aplica daño de área a los enemigos dentro de rango y reinicia la recarga', () => {
    const inRange = makeEnemyUnit({ instanceId: 'in-range', x: 0, hp: 80, maxHp: 80 })
    const outOfRange = makeEnemyUnit({ instanceId: 'out-of-range', x: 300, hp: 80, maxHp: 80 })
    useGameStore.setState({
      specialCannon: { rechargeRemaining: 0, rechargeDurationSeconds: 20, areaRadius: 40, damage: 50 },
      units: [inRange, outOfRange],
    })

    const ok = useGameStore.getState().activateSpecialCannon()

    expect(ok).toBe(true)
    const state = useGameStore.getState()
    expect(state.units.find((u) => u.instanceId === 'in-range')!.hp).toBe(30)
    expect(state.units.find((u) => u.instanceId === 'out-of-range')!.hp).toBe(80)
    expect(state.specialCannon.rechargeRemaining).toBe(20)
  })

  it('mientras recarga, la activación no tiene efecto ni reinicia el temporizador', () => {
    const inRange = makeEnemyUnit({ instanceId: 'in-range', x: 0, hp: 80, maxHp: 80 })
    useGameStore.setState({
      specialCannon: { rechargeRemaining: 5, rechargeDurationSeconds: 20, areaRadius: 40, damage: 50 },
      units: [inRange],
    })

    const ok = useGameStore.getState().activateSpecialCannon()

    expect(ok).toBe(false)
    const state = useGameStore.getState()
    expect(state.units.find((u) => u.instanceId === 'in-range')!.hp).toBe(80)
    expect(state.specialCannon.rechargeRemaining).toBe(5)
  })

  it('un enemigo cuyo hp llega a 0 por el daño de área es removido de units', () => {
    const weak = makeEnemyUnit({ instanceId: 'weak', x: 0, hp: 10, maxHp: 10 })
    useGameStore.setState({
      specialCannon: { rechargeRemaining: 0, rechargeDurationSeconds: 20, areaRadius: 40, damage: 50 },
      units: [weak],
    })

    useGameStore.getState().activateSpecialCannon()

    expect(useGameStore.getState().units).toHaveLength(0)
  })
})

describe('useGameStore.boostEnergyRegen (specs/012-saga-imperio-de-los-gatos US6)', () => {
  it('con energía acumulada suficiente, descuenta el costo una sola vez y sube regenPerSecond', () => {
    useGameStore.setState({ energy: { current: 50, max: 100, regenPerSecond: 5 } })

    const ok = useGameStore.getState().boostEnergyRegen(20, 2)

    expect(ok).toBe(true)
    const state = useGameStore.getState()
    expect(state.energy.current).toBe(30)
    expect(state.energy.regenPerSecond).toBe(7)
  })

  it('sin energía acumulada suficiente, no tiene efecto', () => {
    useGameStore.setState({ energy: { current: 5, max: 100, regenPerSecond: 5 } })

    const ok = useGameStore.getState().boostEnergyRegen(20, 2)

    expect(ok).toBe(false)
    const state = useGameStore.getState()
    expect(state.energy.current).toBe(5)
    expect(state.energy.regenPerSecond).toBe(5)
  })
})

describe('useGameStore.startLevel — Brote Zombi (specs/012-saga-imperio-de-los-gatos US7)', () => {
  const level1 = LEVELS.find((candidate) => candidate.id === 'level-1')!

  it('FR-011: con zombieMode activo y zombieWave configurado, activeEnemyWave usa zombieWave en vez de enemyWave', () => {
    useGameStore.getState().startLevel('level-1', true)

    expect(useGameStore.getState().activeEnemyWave).toEqual(level1.zombieWave)
  })

  it('sin zombieMode, activeEnemyWave usa la oleada estándar del nivel', () => {
    useGameStore.getState().startLevel('level-1')

    expect(useGameStore.getState().activeEnemyWave).toEqual(level1.enemyWave)
  })
})

describe('useGameStore — fase especial de evento (specs/014-banner-evento-especial US2/US3)', () => {
  it('FR-005: startLevel resuelve la specialStage de un EventBanner igual que un Level de LEVELS', async () => {
    const { EVENT_BANNERS } = await import('../../src/data/events')
    const specialStage = EVENT_BANNERS[0].specialStage

    useGameStore.getState().startLevel(specialStage.id)

    const state = useGameStore.getState()
    expect(state.status).toBe('InProgress')
    expect(state.levelId).toBe(specialStage.id)
    expect(state.enemyBase.maxHp).toBe(specialStage.enemyBaseHp) // sin arco (plan.md Key Design Decision 4) — multiplicador 1
  })

  it('FR-008/T009: tick() avanza una batalla de specialStage hasta su resolución sin leer la hora del sistema en ningún punto', async () => {
    const { EVENT_BANNERS } = await import('../../src/data/events')
    const specialStage = EVENT_BANNERS[0].specialStage
    useGameStore.getState().startLevel(specialStage.id)

    // 200 ticks de 1s — mucho más allá de cualquier ventana horaria posible; stepSimulation/tick nunca la consultan.
    for (let i = 0; i < 200 && useGameStore.getState().status === 'InProgress'; i += 1) {
      useGameStore.getState().tick(1)
    }

    expect(['Victory', 'Defeat']).toContain(useGameStore.getState().status)
  })
})

describe('useGameStore — efectos de objetos de batalla (specs/017-objetos-de-batalla US2)', () => {
  it('FR-008: startLevel con energyBonus produce energy.current inicial mayor que sin él', () => {
    useGameStore.getState().startLevel('level-1', false, { energyBonus: 25 })

    expect(useGameStore.getState().energy.current).toBe(25)
  })

  it('sin battleItemEffects, energy.current inicial sigue siendo 0 (comportamiento previo)', () => {
    useGameStore.getState().startLevel('level-1')

    expect(useGameStore.getState().energy.current).toBe(0)
  })

  it('FR-008: deployUnit con unitSpeedMultiplier (Aceleración de Velocidad) produce un BattleUnit.speed mayor al base', () => {
    useGameStore.getState().startLevel('level-1', false, { speedMultiplier: 1.5 })
    useGameStore.setState({ energy: { current: 999, max: 999, regenPerSecond: 0 } })

    useGameStore.getState().deployUnit(cat.id)

    expect(useGameStore.getState().units[0].speed).toBe(cat.speed * 1.5)
  })

  it('sin speedMultiplier, deployUnit produce el speed base del gato (comportamiento previo)', () => {
    useGameStore.getState().startLevel('level-1')
    useGameStore.setState({ energy: { current: 999, max: 999, regenPerSecond: 0 } })

    useGameStore.getState().deployUnit(cat.id)

    expect(useGameStore.getState().units[0].speed).toBe(cat.speed)
  })
})

describe('useGameStore.startLevel — vida de base enemiga por arco (specs/013-escalado-capitulos-sets-tesoros US1)', () => {
  it('FR-001: enemyBase.maxHp/hp se multiplican por el enemyStrengthMultiplier del arco activo, redondeado', () => {
    const level = LEVELS.find((candidate) => candidate.id === 'strength-arc-test-level')!

    useGameStore.getState().startLevel('strength-arc-test-level')

    const state = useGameStore.getState()
    expect(state.enemyBase.maxHp).toBe(Math.round(level.enemyBaseHp * 3))
    expect(state.enemyBase.hp).toBe(Math.round(level.enemyBaseHp * 3))
  })

  it('sin arco encontrado, enemyBase.maxHp usa Level.enemyBaseHp sin multiplicar', () => {
    const level1 = LEVELS.find((candidate) => candidate.id === 'level-1')!

    useGameStore.getState().startLevel('level-1')

    expect(useGameStore.getState().enemyBase.maxHp).toBe(level1.enemyBaseHp)
  })
})

describe('useGameStore.startLevel — laneLength (specs/013-escalado-capitulos-sets-tesoros US3)', () => {
  it('FR-004: usa el laneLength configurado del nivel', () => {
    useGameStore.getState().startLevel('lane-length-test-level')

    expect(useGameStore.getState().laneLength).toBe(600)
  })

  it('FR-005: sin laneLength configurado, usa 400 por defecto', () => {
    useGameStore.getState().startLevel('level-1')

    expect(useGameStore.getState().laneLength).toBe(400)
  })
})
