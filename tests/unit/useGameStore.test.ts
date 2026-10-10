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
      // Cualquier otro levelId (p.ej. 'level-2', nivel jefe real de specs/020) resuelve por el arco real —
      // solo los dos niveles de prueba de arriba necesitan un arco sintético.
      return actual.findArcByLevelId(levelId)
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
  // specs/025-cat-combos: activeTeamCatIds se resetea aquí para que ningún test de esta suite dependa del
  // orden de ejecución respecto a los tests de getActiveComboBonusMultiplier más abajo.
  // specs/031-mejoras-de-base: baseUpgrades también se resetea aquí por el mismo motivo (aislar tests
  // de esta suite de los de "Mejoras de Base" más abajo).
  useMetaStore.setState({
    ownedCats: {},
    evolutionItems: {},
    activeTeamCatIds: [],
    baseUpgrades: {},
    // specs/033-misiones-catnip-challenges: mismo motivo de aislamiento que baseUpgrades arriba.
    missionProgress: {},
    claimedMissionIds: [],
    missionsResetDateKey: '',
    // specs/035-ototo-corps: mismo motivo de aislamiento.
    ototoBuildings: {},
  })
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

  it('specs/033-misiones-catnip-challenges: un despliegue exitoso incrementa missionProgress.unitsDeployed', () => {
    useGameStore.setState({ energy: { current: 999, max: 999, regenPerSecond: 0 } })

    useGameStore.getState().deployUnit(cat.id)

    expect(useMetaStore.getState().missionProgress.unitsDeployed).toBe(1)
  })

  it('specs/033-misiones-catnip-challenges: un despliegue rechazado no incrementa missionProgress', () => {
    useGameStore.setState({ energy: { current: 0, max: 100, regenPerSecond: 0 } })

    useGameStore.getState().deployUnit(cat.id)

    expect(useMetaStore.getState().missionProgress.unitsDeployed ?? 0).toBe(0)
  })

  it('specs/035-ototo-corps: con foundation construida, la unidad desplegada recibe la TraitResistance correspondiente', () => {
    useMetaStore.setState({ ototoBuildings: { foundation: 'Floating' } })
    useGameStore.setState({ energy: { current: 999, max: 999, regenPerSecond: 0 } })

    useGameStore.getState().deployUnit(cat.id)

    const unit = useGameStore.getState().units[0]
    expect(unit.abilities).toContainEqual({ kind: 'TraitResistance', targetClassifications: ['Floating'], damageTakenMultiplier: 0.7 })
  })

  it('specs/035-ototo-corps: con style construido, la unidad desplegada recibe la entrada resistantTo correspondiente', () => {
    useMetaStore.setState({ ototoBuildings: { style: 'Freeze' } })
    useGameStore.setState({ energy: { current: 999, max: 999, regenPerSecond: 0 } })

    useGameStore.getState().deployUnit(cat.id)

    const unit = useGameStore.getState().units[0]
    expect(unit.resistantTo).toContainEqual({ effect: 'Freeze', durationMultiplier: 0.5 })
  })

  it('specs/035-ototo-corps: sin ninguna construcción, abilities/resistantTo son exactamente los del Cat original', () => {
    useGameStore.setState({ energy: { current: 999, max: 999, regenPerSecond: 0 } })

    useGameStore.getState().deployUnit(cat.id)

    const unit = useGameStore.getState().units[0]
    expect(unit.abilities).toEqual(cat.abilities)
    expect(unit.resistantTo).toEqual(cat.resistantTo)
  })
})

describe('useGameStore.deployUnit — Talentos y Orbes (specs/036-talentos-orbes)', () => {
  it('US1: con debuffResistance invertido, la unidad recibe la entrada resistantTo antepuesta a la de Ototo/el propio gato', () => {
    useMetaStore.setState({
      ownedCats: { [cat.id]: { level: 1, experienceInvested: 0, evolutionStage: 'True', talents: { debuffResistance: { effect: 'Freeze', points: 3 } } } },
      ototoBuildings: { style: 'Slow' },
    })
    useGameStore.setState({ energy: { current: 999, max: 999, regenPerSecond: 0 } })

    useGameStore.getState().deployUnit(cat.id)

    const unit = useGameStore.getState().units[0]
    expect(unit.resistantTo).toContainEqual({ effect: 'Freeze', durationMultiplier: 0.7 })
    expect(unit.resistantTo).toContainEqual({ effect: 'Slow', durationMultiplier: 0.5 })
  })

  it('sin talentos, resistantTo es exactamente el ya resuelto por Ototo/el propio gato (sin regresión)', () => {
    useMetaStore.setState({ ototoBuildings: { style: 'Slow' } })
    useGameStore.setState({ energy: { current: 999, max: 999, regenPerSecond: 0 } })

    useGameStore.getState().deployUnit(cat.id)

    const unit = useGameStore.getState().units[0]
    expect(unit.resistantTo).toEqual([{ effect: 'Slow', durationMultiplier: 0.5 }, ...(cat.resistantTo ?? [])])
  })

  it('US2: con statBoost.hp = 5, la unidad recibe +10% de HP sobre getEffectiveCatStats, sin afectar el Daño', () => {
    useMetaStore.setState({
      ownedCats: { [cat.id]: { level: 1, experienceInvested: 0, evolutionStage: 'True', talents: { statBoost: { hp: 5, damage: 0 } } } },
    })
    useGameStore.setState({ energy: { current: 999, max: 999, regenPerSecond: 0 } })

    useGameStore.getState().deployUnit(cat.id)

    const unit = useGameStore.getState().units[0]
    expect(unit.hp).toBeCloseTo(cat.hp * 1.1)
    expect(unit.maxHp).toBeCloseTo(cat.hp * 1.1)
    expect(unit.damage).toBe(cat.damage)
  })

  it('US2: con statBoost.damage = 5, la unidad recibe +10% de Daño, sin afectar el HP (caso simétrico)', () => {
    useMetaStore.setState({
      ownedCats: { [cat.id]: { level: 1, experienceInvested: 0, evolutionStage: 'True', talents: { statBoost: { hp: 0, damage: 5 } } } },
    })
    useGameStore.setState({ energy: { current: 999, max: 999, regenPerSecond: 0 } })

    useGameStore.getState().deployUnit(cat.id)

    const unit = useGameStore.getState().units[0]
    expect(unit.damage).toBeCloseTo(cat.damage * 1.1)
    expect(unit.hp).toBe(cat.hp)
  })

  it('US3: con orb.classification = Red, points = 5, la unidad recibe una TraitTargeting antepuesta a las abilities propias', () => {
    useMetaStore.setState({
      ownedCats: { [cat.id]: { level: 1, experienceInvested: 0, evolutionStage: 'True', talents: { orb: { classification: 'Red', points: 5 } } } },
    })
    useGameStore.setState({ energy: { current: 999, max: 999, regenPerSecond: 0 } })

    useGameStore.getState().deployUnit(cat.id)

    const unit = useGameStore.getState().units[0]
    expect(unit.abilities?.[0]).toEqual({ kind: 'TraitTargeting', targetClassifications: ['Red'], damageMultiplier: 1.2 })
    expect(unit.abilities).toEqual([
      { kind: 'TraitTargeting', targetClassifications: ['Red'], damageMultiplier: 1.2 },
      ...(cat.abilities ?? []),
    ])
  })

  it('sin orb, abilities es exactamente el del Cat original (más cualquier bono de Ototo ya existente)', () => {
    useMetaStore.setState({ ototoBuildings: { foundation: 'Floating' } })
    useGameStore.setState({ energy: { current: 999, max: 999, regenPerSecond: 0 } })

    useGameStore.getState().deployUnit(cat.id)

    const unit = useGameStore.getState().units[0]
    expect(unit.abilities).toEqual([
      { kind: 'TraitResistance', targetClassifications: ['Floating'], damageTakenMultiplier: 0.7 },
      ...(cat.abilities ?? []),
    ])
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
    expect(unit.hp).toBe(evoCat.hp * evoCat.evolutions!.second!.hpMultiplier)
    expect(unit.maxHp).toBe(evoCat.hp * evoCat.evolutions!.second!.hpMultiplier)
    expect(unit.damage).toBe(evoCat.damage * evoCat.evolutions!.second!.damageMultiplier)
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

  // FR-012 + specs/020-barrera-de-base: level-2 es el bossLevelId de arco-2 (armored-cat) — su propio
  // zombieWave lista a armored-cat como enemigo más, por lo que sin este filtro el jefe seguiría
  // generándose y bloqueando la base enemiga incluso en Brote Zombi (encontrado en el recorrido manual
  // de tasks.md T036, ausente de la cobertura previa porque solo ejercía level-1, que no es nivel jefe).
  it('FR-012: en un nivel que es bossLevelId de su arco, Brote Zombi filtra al jefe de activeEnemyWave', () => {
    const level2 = LEVELS.find((candidate) => candidate.id === 'level-2')!

    useGameStore.getState().startLevel('level-2', true)

    const activeEnemyWave = useGameStore.getState().activeEnemyWave!
    expect(activeEnemyWave.some((entry) => entry.catId === 'armored-cat')).toBe(false)
    expect(activeEnemyWave).toEqual(level2.zombieWave!.filter((entry) => entry.catId !== 'armored-cat'))
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
    // 'level-1' ya no sirve como representante de "sin arco" — specs/012 lo agregó a arco-1-imperio-de-los-gatos.
    // 'lane-length-test-level' (mock de arriba) no pertenece a ningún SagaArc real ni de prueba.
    const level = LEVELS.find((candidate) => candidate.id === 'lane-length-test-level')!

    useGameStore.getState().startLevel('lane-length-test-level')

    expect(useGameStore.getState().enemyBase.maxHp).toBe(level.enemyBaseHp)
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

describe('useGameStore.startLevel — bonificación de Cat Combo (specs/025-cat-combos US1)', () => {
  it('FR-003: con la formación activa completa de combo-nucleo-original, regenPerSecond incluye el multiplicador 1.05', () => {
    useMetaStore.setState({ activeTeamCatIds: ['basic-cat', 'tank-cat'] })

    useGameStore.getState().startLevel('level-1')

    expect(useGameStore.getState().energy.regenPerSecond).toBeCloseTo(5 * 1.05)
  })

  it('FR-004: con la formación incompleta (falta un miembro), regenPerSecond no incluye ningún multiplicador de combo', () => {
    useMetaStore.setState({ activeTeamCatIds: ['basic-cat'] })

    useGameStore.getState().startLevel('level-1')

    expect(useGameStore.getState().energy.regenPerSecond).toBe(5)
  })
})

describe('useGameStore — velocidad y pausa (specs/029-pulido-batalla-hud US2)', () => {
  it('speedMultiplier inicia en 1 y paused en false', () => {
    const state = useGameStore.getState()
    expect(state.speedMultiplier).toBe(1)
    expect(state.paused).toBe(false)
  })

  it('setSpeedMultiplier(2) lo cambia a 2', () => {
    useGameStore.getState().setSpeedMultiplier(2)
    expect(useGameStore.getState().speedMultiplier).toBe(2)
  })

  it('setPaused(true) lo cambia a true', () => {
    useGameStore.getState().setPaused(true)
    expect(useGameStore.getState().paused).toBe(true)
  })

  it('startLevel() restaura speedMultiplier a 1 y paused a false', () => {
    useGameStore.getState().setSpeedMultiplier(2)
    useGameStore.getState().setPaused(true)

    useGameStore.getState().startLevel('level-1')

    expect(useGameStore.getState().speedMultiplier).toBe(1)
    expect(useGameStore.getState().paused).toBe(false)
  })

  it('reset() restaura speedMultiplier a 1 y paused a false', () => {
    useGameStore.getState().startLevel('level-1')
    useGameStore.getState().setSpeedMultiplier(2)
    useGameStore.getState().setPaused(true)

    useGameStore.getState().reset()

    expect(useGameStore.getState().speedMultiplier).toBe(1)
    expect(useGameStore.getState().paused).toBe(false)
  })

  // La escala real de deltaSeconds por speedMultiplier, y el salto de tick() mientras paused,
  // ocurren en el useTick de BattleField (src/game/BattleStage.tsx) — ese componente no tiene test
  // unitario propio en este repo (se mockea por completo en BattleScreen.test.tsx, igual que el resto
  // de la lógica dependiente de Pixi), consistente con research.md Decisión 3. tick() en sí mismo no
  // conoce speedMultiplier/paused — solo aplica el deltaSeconds que se le pase, sin cambios en esta spec.
})

describe('useGameStore.startLevel — bonos de cañón especial (specs/031-mejoras-de-base US2)', () => {
  it('con cannonPower/cannonRange/cannonCharge en nivel 0, specialCannon usa los valores por defecto de specs/012', () => {
    useGameStore.getState().startLevel('level-1')

    const { specialCannon } = useGameStore.getState()
    expect(specialCannon.damage).toBe(50)
    expect(specialCannon.areaRadius).toBe(40)
    expect(specialCannon.rechargeDurationSeconds).toBe(20)
  })

  it('con las 3 mejoras de cañón en nivel >0, specialCannon incluye sus bonos', () => {
    useMetaStore.setState({ baseUpgrades: { cannonPower: 3, cannonRange: 2, cannonCharge: 4 } })

    useGameStore.getState().startLevel('level-1')

    const { specialCannon } = useGameStore.getState()
    expect(specialCannon.damage).toBe(50 + 3 * 10)
    expect(specialCannon.areaRadius).toBe(40 + 2 * 5)
    expect(specialCannon.rechargeDurationSeconds).toBe(20 - 4 * 1)
    expect(specialCannon.rechargeRemaining).toBe(specialCannon.rechargeDurationSeconds)
  })

  it('Recarga de Cañón nunca baja de MIN_CANNON_RECHARGE_SECONDS', () => {
    useMetaStore.setState({ baseUpgrades: { cannonCharge: 10 } })

    useGameStore.getState().startLevel('level-1')

    expect(useGameStore.getState().specialCannon.rechargeDurationSeconds).toBeGreaterThanOrEqual(5)
  })
})

describe('useGameStore.startLevel — Defensa de Base (specs/031-mejoras-de-base US3)', () => {
  it('con baseDefense en nivel 0, playerBase.maxHp es el valor base del nivel', () => {
    useGameStore.getState().startLevel('level-1')

    expect(useGameStore.getState().playerBase.maxHp).toBe(1000)
  })

  it('con baseDefense en nivel >0, playerBase.maxHp incluye el bono', () => {
    useMetaStore.setState({ baseUpgrades: { baseDefense: 2 } })

    useGameStore.getState().startLevel('level-1')

    const { playerBase } = useGameStore.getState()
    expect(playerBase.maxHp).toBe(1000 + 2 * 100)
    expect(playerBase.hp).toBe(playerBase.maxHp)
  })
})

describe('useGameStore.deployUnit — Investigación (specs/031-mejoras-de-base US3)', () => {
  it('con research en nivel 0, el cooldown asignado es el cooldownSeconds base del gato', () => {
    useGameStore.setState({ energy: { current: 999, max: 999, regenPerSecond: 0 } })

    useGameStore.getState().deployUnit(cat.id)

    expect(useGameStore.getState().deployCooldowns[cat.id]).toBe(cat.cooldownSeconds)
  })

  it('con research en nivel >0, el cooldown asignado es menor que el base, sin bajar del piso', () => {
    useMetaStore.setState({ baseUpgrades: { research: 5 } })
    useGameStore.setState({ energy: { current: 999, max: 999, regenPerSecond: 0 } })

    useGameStore.getState().deployUnit(cat.id)

    const assigned = useGameStore.getState().deployCooldowns[cat.id]
    expect(assigned).toBeLessThan(cat.cooldownSeconds)
    expect(assigned).toBeGreaterThanOrEqual(0.5)
  })
})

describe('useGameStore.activateSpecialCannon — Cabeza de Cañón (specs/041-cabezas-de-canon US2)', () => {
  const cannon = { rechargeRemaining: 0, rechargeDurationSeconds: 20, areaRadius: 40, damage: 50 }

  it('con cabeza de Retroceso, solo los enemigos alcanzados que sobreviven se desplazan y todos reciben el mismo daño que sin cabeza', () => {
    useMetaStore.setState({ ototoBuildings: { cannonHead: 'Knockback' } })
    const survivor = makeEnemyUnit({ instanceId: 'survivor', x: 0, hp: 80, maxHp: 80 })
    const doomed = makeEnemyUnit({ instanceId: 'doomed', x: 4, hp: 10, maxHp: 10 })
    const outOfRange = makeEnemyUnit({ instanceId: 'out-of-range', x: 300, hp: 80, maxHp: 80 })
    const ally = makeEnemyUnit({ instanceId: 'ally', team: 'Player', x: 2, hp: 80, maxHp: 80 })
    useGameStore.setState({ specialCannon: cannon, units: [survivor, doomed, outOfRange, ally] })

    const ok = useGameStore.getState().activateSpecialCannon()

    expect(ok).toBe(true)
    const { units, specialCannon } = useGameStore.getState()
    expect(units.find((u) => u.instanceId === 'survivor')).toMatchObject({ hp: 30, x: 40 }) // 50 de daño, +40 de retroceso
    expect(units.find((u) => u.instanceId === 'doomed')).toBeUndefined() // derrotado: removido, sin efecto
    expect(units.find((u) => u.instanceId === 'out-of-range')).toMatchObject({ hp: 80, x: 300 }) // fuera del radio: intacto
    expect(units.find((u) => u.instanceId === 'ally')).toMatchObject({ hp: 80, x: 2 }) // no enemiga: intacta
    expect(specialCannon.rechargeRemaining).toBe(20) // la recarga se reinicia igual
  })

  it('con cabeza de Congelar, los enemigos alcanzados que sobreviven quedan congelados con la duración del catálogo', () => {
    useMetaStore.setState({ ototoBuildings: { cannonHead: 'Freeze' } })
    useGameStore.setState({ specialCannon: cannon, units: [makeEnemyUnit({ instanceId: 'e1', x: 0, hp: 80, maxHp: 80 })] })

    useGameStore.getState().activateSpecialCannon()

    expect(useGameStore.getState().units[0]).toMatchObject({ hp: 30, freezeRemainingSeconds: 3 })
  })

  it('un enemigo inmune a Retroceso recibe el daño pero no se desplaza', () => {
    useMetaStore.setState({ ototoBuildings: { cannonHead: 'Knockback' } })
    useGameStore.setState({
      specialCannon: cannon,
      units: [makeEnemyUnit({ instanceId: 'boss', x: 0, hp: 80, maxHp: 80, immuneAbilities: ['Knockback'] })],
    })

    useGameStore.getState().activateSpecialCannon()

    expect(useGameStore.getState().units[0]).toMatchObject({ hp: 30, x: 0 })
  })

  it('sin ninguna cabeza el disparo es idéntico al de antes: daño y recarga, sin ningún efecto secundario', () => {
    useMetaStore.setState({ ototoBuildings: {} })
    useGameStore.setState({ specialCannon: cannon, units: [makeEnemyUnit({ instanceId: 'e1', x: 0, hp: 80, maxHp: 80 })] })

    useGameStore.getState().activateSpecialCannon()

    const unit = useGameStore.getState().units[0]
    expect(unit).toMatchObject({ hp: 30, x: 0 })
    expect(unit.freezeRemainingSeconds).toBeUndefined()
    expect(useGameStore.getState().specialCannon.rechargeRemaining).toBe(20)
  })

  it('el tope de Retroceso del enemigo sale del laneLength de la partida', () => {
    useMetaStore.setState({ ototoBuildings: { cannonHead: 'Knockback' } })
    // Enemigo dentro del radio de una base cuyo carril es corto: el retroceso se detiene en laneLength - width.
    useGameStore.setState({
      laneLength: 50,
      specialCannon: cannon,
      units: [makeEnemyUnit({ instanceId: 'e1', x: 0, width: 16, hp: 80, maxHp: 80 })],
    })

    useGameStore.getState().activateSpecialCannon()

    expect(useGameStore.getState().units[0].x).toBe(34) // 50 - 16, no 0 + 40
  })
})
