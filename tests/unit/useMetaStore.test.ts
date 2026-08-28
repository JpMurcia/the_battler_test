import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { RarityType } from '../../src/data/cats'
import { LEVELS } from '../../src/data/levels'
import { db } from '../../src/db'
import { useMetaStore } from '../../src/state/useMetaStore'

// specs/010-evolucion-de-gatos: gato de prueba con `evolutions` declarado, añadido al catálogo
// real vía importOriginal — el catálogo de producción (CATS[0..3]) no declara evoluciones
// (spec.md Assumptions), así que el mecanismo se prueba con un fixture dedicado.
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

// specs/012-saga-imperio-de-los-gatos: arcos de prueba dedicados — decoupled de los valores de
// producción de SAGA_ARCS. `test-arc-2` ocupa el índice [1] (el "segundo arco" del tope de mejora, FR-017).
// `energyCostByArc` (specs/013 US2) usa 'level-1'/'level-2' reales para poder ejercitar `spendMissionEnergy`.
vi.mock('../../src/data/sagaArcs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/data/sagaArcs')>()
  return {
    ...actual,
    SAGA_ARCS: [
      {
        id: 'test-arc-1',
        name: 'Test Arc 1',
        levelIds: ['level-1'],
        costMultiplier: 1,
        enemyStrengthMultiplier: 1,
        completionRewards: { unlockCatIds: ['tank-cat'] },
      },
      {
        id: 'test-arc-2',
        name: 'Test Arc 2',
        levelIds: ['level-2'],
        costMultiplier: 1,
        enemyStrengthMultiplier: 1,
        completionRewards: {},
      },
      // specs/023-mapa-de-etapas-visual (US2): mismos ids que la producción real (`src/data/sagaArcs.ts`), con
      // el reparto de catId de data-model.md — entradas nuevas, no reemplazan test-arc-1/test-arc-2 (índices
      // usados por otros tests de este archivo, p. ej. el tope escalonado FR-017 sobre SAGA_ARCS[1]).
      {
        id: 'arco-1-imperio-de-los-gatos',
        name: 'Imperio de los Gatos — Arco 1',
        levelIds: ['level-1'],
        costMultiplier: 0.8,
        enemyStrengthMultiplier: 0.8,
        completionRewards: {
          unlockNextArcId: 'arco-2-imperio-de-los-gatos',
          unlockCatIds: ['speed-cat', 'heavy-cat', 'armored-cat', 'frost-cat', 'weaken-cat', 'slow-cat', 'zombie-ward-cat'],
        },
      },
      {
        id: 'arco-2-imperio-de-los-gatos',
        name: 'Imperio de los Gatos — Arco 2',
        levelIds: ['level-2'],
        costMultiplier: 1,
        enemyStrengthMultiplier: 1,
        completionRewards: {
          unlockCatIds: ['triple-strike-cat', 'lucky-cat', 'seed-cat-basic', 'seed-cat-wall', 'seed-cat-ranged', 'seed-cat-titan'],
        },
      },
    ],
  }
})

// specs/013-escalado-capitulos-sets-tesoros (US4): mismos treasureIds reales de level-1/level-2, para poder
// ejercitar la integración completa grantLevelRewards → checkTreasureSetCompletion con datos reales.
vi.mock('../../src/data/treasureSets', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/data/treasureSets')>()
  return {
    ...actual,
    TREASURE_SETS: [
      {
        id: 'test-set',
        name: 'Test Set',
        treasureIds: ['tesoro-nivel-1', 'tesoro-nivel-2'],
        passiveBonus: { type: 'EnergyRegenMultiplier', value: 1.5 },
      },
    ],
  }
})

// specs/019-rango-de-usuario: umbrales de prueba dedicados — decoupled de los valores de producción.
vi.mock('../../src/data/userRankThresholds', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/data/userRankThresholds')>()
  return {
    ...actual,
    USER_RANK_THRESHOLDS: [
      { rank: 2, reward: { itemId: 'extra-energy', count: 1 } },
      { rank: 4, reward: { itemId: 'speed-boost', count: 2 } },
    ],
  }
})

const INITIAL_STATE = {
  isHydrated: false,
  currency: 0,
  highestUnlockedLevelIndex: 0,
  completedLevelIds: [] as string[],
  ownedCats: {},
  settings: { musicVolume: 1, sfxVolume: 1, language: 'es' },
  activeTeamCatIds: [] as string[],
  missionEnergy: { current: 0, max: 0 },
  evolutionItems: {} as Record<string, number>,
  obtainedTreasureIds: [] as string[],
  grantedArcRewardIds: [] as string[],
  grantedTreasureSetIds: [] as string[],
  battleItemInventory: {} as Record<string, number>,
  selectedBattleItemIds: [] as string[],
  pendingTreasureRadar: false,
  encounteredEnemyCatIds: [] as string[],
  claimedRankThresholds: [] as number[],
  gachaCurrency: 0,
  npCurrency: 0,
  gachaStorage: [] as { id?: number; catId: string; rarity: RarityType }[],
  readNewsIds: [] as string[],
}

beforeEach(async () => {
  await Promise.all([
    db.playerProfile.clear(),
    db.settings.clear(),
    db.ownedCats.clear(),
    db.levelProgress.clear(),
    db.teamFormation.clear(),
    db.missionEnergy.clear(),
    db.evolutionItems.clear(),
    db.treasures.clear(),
    db.arcProgress.clear(),
    db.treasureSetBonuses.clear(),
    db.battleItems.clear(),
    db.encounteredEnemies.clear(),
    db.userRank.clear(),
    db.gachaStorage.clear(),
    db.newsRead.clear(),
  ])
  useMetaStore.setState(INITIAL_STATE)
})

describe('useMetaStore', () => {
  it('hydrate() sobre una base de datos vacía deja el estado por defecto esperado, incluido el gato inicial (FR-011)', async () => {
    await useMetaStore.getState().hydrate()

    const state = useMetaStore.getState()
    expect(state.isHydrated).toBe(true)
    expect(state.currency).toBe(0)
    expect(state.highestUnlockedLevelIndex).toBe(0)
    expect(state.completedLevelIds).toEqual([])
    // specs/027-capitulo-1-imperio-gatos (FR-001, US2 Escenario 1): "cat-recluta" es un segundo gato inicial
    // garantizado, aditivo sobre CATS[0] — ver db/index.ts ensureDefaultProfile.
    expect(state.ownedCats).toEqual({
      [CATS[0].id]: { level: 1, experienceInvested: 0, evolutionStage: 'Base', plusLevel: 0 },
      'cat-recluta': { level: 1, experienceInvested: 0, evolutionStage: 'Base', plusLevel: 0 },
    })
    // specs/024-sistema-gacha.
    expect(state.gachaCurrency).toBe(0)
    expect(state.npCurrency).toBe(0)
    expect(state.gachaStorage).toEqual([])
    // specs/026-navegacion-hub-mockup.
    expect(state.readNewsIds).toEqual([])
    // specs/012-saga-imperio-de-los-gatos.
    expect(state.obtainedTreasureIds).toEqual([])
    expect(state.grantedArcRewardIds).toEqual([])
    // specs/017-objetos-de-batalla.
    expect(state.battleItemInventory).toEqual({})
  })

  it('hydrate() expone evolutionStage \'Base\' por defecto para filas de ownedCats sin ese campo declarado', async () => {
    await db.ownedCats.put({ catId: 'evo-test-cat', level: 5, experienceInvested: 0 })

    await useMetaStore.getState().hydrate()

    expect(useMetaStore.getState().ownedCats['evo-test-cat'].evolutionStage).toBe('Base')
  })

  it('spendCurrency rechaza sin efecto si el monto excede la moneda actual', async () => {
    await useMetaStore.getState().hydrate()
    useMetaStore.setState({ currency: 10 })

    const ok = useMetaStore.getState().spendCurrency(20)

    expect(ok).toBe(false)
    expect(useMetaStore.getState().currency).toBe(10)
  })

  it('spendCurrency descuenta cuando hay fondos suficientes', async () => {
    await useMetaStore.getState().hydrate()
    useMetaStore.setState({ currency: 50 })

    const ok = useMetaStore.getState().spendCurrency(20)

    expect(ok).toBe(true)
    expect(useMetaStore.getState().currency).toBe(30)
  })

  it('setActiveTeam rechaza una selección vacía sin mutar el estado', async () => {
    await useMetaStore.getState().hydrate()
    useMetaStore.setState({ activeTeamCatIds: ['basic-cat'] })

    const ok = useMetaStore.getState().setActiveTeam([])

    expect(ok).toBe(false)
    expect(useMetaStore.getState().activeTeamCatIds).toEqual(['basic-cat'])
  })

  it('specs/022-datos-semilla-flujo-navegacion (FR-008): setActiveTeam rechaza más de MAX_TEAM_ROSTER_SIZE (10) sin mutar el estado', async () => {
    await useMetaStore.getState().hydrate()
    useMetaStore.setState({ activeTeamCatIds: ['basic-cat'] })

    const ok = useMetaStore.getState().setActiveTeam(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'])

    expect(ok).toBe(false)
    expect(useMetaStore.getState().activeTeamCatIds).toEqual(['basic-cat'])
  })

  it('specs/022-datos-semilla-flujo-navegacion (FR-008): setActiveTeam acepta hasta 10 catId, incluidos más de 6 (no confundir con MAX_ACTIVE_TEAM_SIZE de la grilla de despliegue, specs/023)', async () => {
    await useMetaStore.getState().hydrate()

    const ok = useMetaStore.getState().setActiveTeam(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'])

    expect(ok).toBe(true)
    expect(useMetaStore.getState().activeTeamCatIds).toHaveLength(10)
  })

  it('setActiveTeam persiste y actualiza una selección no vacía', async () => {
    await useMetaStore.getState().hydrate()

    const ok = useMetaStore.getState().setActiveTeam(['basic-cat', 'tank-cat'])

    expect(ok).toBe(true)
    expect(useMetaStore.getState().activeTeamCatIds).toEqual(['basic-cat', 'tank-cat'])
    const row = await db.teamFormation.get(1)
    expect(row).toEqual({ id: 1, catIds: ['basic-cat', 'tank-cat'] })
  })

  it('hydrate() restaura el equipo activo persistido', async () => {
    await db.teamFormation.put({ id: 1, catIds: ['speed-cat'] })

    await useMetaStore.getState().hydrate()

    expect(useMetaStore.getState().activeTeamCatIds).toEqual(['speed-cat'])
  })

  it('hydrate() sobre una base vacía siembra la energía de misión al máximo (FR-010)', async () => {
    await useMetaStore.getState().hydrate()

    const { missionEnergy } = useMetaStore.getState()
    expect(missionEnergy.current).toBe(missionEnergy.max)
    expect(missionEnergy.max).toBeGreaterThan(0)
  })

  it('spendMissionEnergy con energía suficiente descuenta el costo exacto del nivel', async () => {
    await useMetaStore.getState().hydrate()
    const before = useMetaStore.getState().missionEnergy.current

    const ok = useMetaStore.getState().spendMissionEnergy(LEVELS[0].id)

    expect(ok).toBe(true)
    expect(useMetaStore.getState().missionEnergy.current).toBe(before - LEVELS[0].energyCost)
  })

  it('spendMissionEnergy sin energía suficiente devuelve false y no muta el estado', async () => {
    await useMetaStore.getState().hydrate()
    useMetaStore.setState({ missionEnergy: { current: 1, max: 100 } })

    const ok = useMetaStore.getState().spendMissionEnergy(LEVELS[0].id)

    expect(ok).toBe(false)
    expect(useMetaStore.getState().missionEnergy.current).toBe(1)
  })

  it('hydrate() recupera energía de misión proporcional al tiempo transcurrido, topada al máximo', async () => {
    await db.missionEnergy.put({ id: 1, current: 10, max: 100, lastUpdatedAt: 0 })

    await useMetaStore.getState().hydrate()

    const { missionEnergy } = useMetaStore.getState()
    expect(missionEnergy.current).toBe(missionEnergy.max)
  })

  describe('evolveCat (specs/010-evolucion-de-gatos)', () => {
    beforeEach(async () => {
      await useMetaStore.getState().hydrate()
      useMetaStore.setState({
        ownedCats: { 'evo-test-cat': { level: 1, experienceInvested: 0, evolutionStage: 'Base' } },
        evolutionItems: {},
      })
    })

    it('US1: evoluciona Base → Second con nivel suficiente y persiste el cambio', async () => {
      useMetaStore.setState({
        ownedCats: { 'evo-test-cat': { level: 5, experienceInvested: 0, evolutionStage: 'Base' } },
      })

      const ok = useMetaStore.getState().evolveCat('evo-test-cat')

      expect(ok).toBe(true)
      expect(useMetaStore.getState().ownedCats['evo-test-cat'].evolutionStage).toBe('Second')
      const row = await db.ownedCats.get('evo-test-cat')
      expect(row?.evolutionStage).toBe('Second')
    })

    it('US1: sin nivel suficiente para Second, devuelve false y no muta nada', () => {
      const ok = useMetaStore.getState().evolveCat('evo-test-cat')

      expect(ok).toBe(false)
      expect(useMetaStore.getState().ownedCats['evo-test-cat'].evolutionStage).toBe('Base')
    })

    it('US2: evoluciona Second → True con nivel e ítem suficientes, descontando el ítem exacto', async () => {
      useMetaStore.setState({
        ownedCats: { 'evo-test-cat': { level: 10, experienceInvested: 0, evolutionStage: 'Second' } },
        evolutionItems: { 'evo-test-cat': 5 },
      })

      const ok = useMetaStore.getState().evolveCat('evo-test-cat')

      expect(ok).toBe(true)
      expect(useMetaStore.getState().ownedCats['evo-test-cat'].evolutionStage).toBe('True')
      expect(useMetaStore.getState().evolutionItems['evo-test-cat']).toBe(2)
      const itemsRow = await db.evolutionItems.get(1)
      expect(itemsRow?.counts['evo-test-cat']).toBe(2)
    })

    it('US2: sin ítem suficiente, bloquea sin descontar nada ni cambiar etapa', () => {
      useMetaStore.setState({
        ownedCats: { 'evo-test-cat': { level: 10, experienceInvested: 0, evolutionStage: 'Second' } },
        evolutionItems: { 'evo-test-cat': 1 },
      })

      const ok = useMetaStore.getState().evolveCat('evo-test-cat')

      expect(ok).toBe(false)
      expect(useMetaStore.getState().ownedCats['evo-test-cat'].evolutionStage).toBe('Second')
      expect(useMetaStore.getState().evolutionItems['evo-test-cat']).toBe(1)
    })

    it('US2: con ítem suficiente pero sin nivel, bloquea sin descontar el ítem', () => {
      useMetaStore.setState({
        ownedCats: { 'evo-test-cat': { level: 1, experienceInvested: 0, evolutionStage: 'Second' } },
        evolutionItems: { 'evo-test-cat': 5 },
      })

      const ok = useMetaStore.getState().evolveCat('evo-test-cat')

      expect(ok).toBe(false)
      expect(useMetaStore.getState().ownedCats['evo-test-cat'].evolutionStage).toBe('Second')
      expect(useMetaStore.getState().evolutionItems['evo-test-cat']).toBe(5)
    })

    it('Edge case: las evoluciones son secuenciales — no salta de Base directo a True aunque cumpla ambos niveles', () => {
      useMetaStore.setState({
        ownedCats: { 'evo-test-cat': { level: 10, experienceInvested: 0, evolutionStage: 'Base' } },
        evolutionItems: { 'evo-test-cat': 5 },
      })

      const ok = useMetaStore.getState().evolveCat('evo-test-cat')

      expect(ok).toBe(true)
      expect(useMetaStore.getState().ownedCats['evo-test-cat'].evolutionStage).toBe('Second')
      expect(useMetaStore.getState().evolutionItems['evo-test-cat']).toBe(5)
    })

    it('un gato sin evolutions declarado permanece en Base indefinidamente (FR-011)', () => {
      useMetaStore.setState({
        ownedCats: { 'basic-cat': { level: 99, experienceInvested: 0, evolutionStage: 'Base' } },
      })

      const ok = useMetaStore.getState().evolveCat('basic-cat')

      expect(ok).toBe(false)
      expect(useMetaStore.getState().ownedCats['basic-cat'].evolutionStage).toBe('Base')
    })
  })

  describe('grantLevelRewards (specs/012-saga-imperio-de-los-gatos US4)', () => {
    const levelWithRewards = LEVELS.find((candidate) => candidate.treasureId && candidate.firstVictoryUnlockCatId)!

    it('FR-007: otorga el tesoro en cada victoria; el gato de primera victoria solo la primera vez', async () => {
      await useMetaStore.getState().hydrate()

      useMetaStore.getState().grantLevelRewards(levelWithRewards.id)
      expect(useMetaStore.getState().obtainedTreasureIds).toEqual([levelWithRewards.treasureId])
      expect(useMetaStore.getState().ownedCats[levelWithRewards.firstVictoryUnlockCatId!]).toBeDefined()

      const ownedBefore = useMetaStore.getState().ownedCats[levelWithRewards.firstVictoryUnlockCatId!]
      useMetaStore.getState().grantLevelRewards(levelWithRewards.id)
      expect(useMetaStore.getState().obtainedTreasureIds).toEqual([levelWithRewards.treasureId]) // sin duplicar
      expect(useMetaStore.getState().ownedCats[levelWithRewards.firstVictoryUnlockCatId!]).toEqual(ownedBefore) // sin re-otorgar
    })

    it('un levelId no encontrado no muta el estado', async () => {
      await useMetaStore.getState().hydrate()

      useMetaStore.getState().grantLevelRewards('non-existent-level')

      expect(useMetaStore.getState().obtainedTreasureIds).toEqual([])
    })
  })

  describe('isZombieModeAvailable (specs/012-saga-imperio-de-los-gatos US7)', () => {
    const levelWithZombie = LEVELS.find((candidate) => candidate.zombieWave)!

    it('FR-013: false para un nivel con zombieWave configurado pero todavía no superado', async () => {
      await useMetaStore.getState().hydrate()

      expect(useMetaStore.getState().isZombieModeAvailable(levelWithZombie.id)).toBe(false)
    })

    it('true una vez superado, con zombieWave configurado', async () => {
      await useMetaStore.getState().hydrate()
      useMetaStore.getState().markLevelCompleted(levelWithZombie.id)

      expect(useMetaStore.getState().isZombieModeAvailable(levelWithZombie.id)).toBe(true)
    })

    it('FR-013: false para un nivel superado sin zombieWave configurado', async () => {
      await useMetaStore.getState().hydrate()
      useMetaStore.getState().markLevelCompleted('level-without-zombie-wave')

      expect(useMetaStore.getState().isZombieModeAvailable('level-without-zombie-wave')).toBe(false)
    })
  })

  describe('claimArcRewardsIfComplete (specs/012-saga-imperio-de-los-gatos US8)', () => {
    it('FR-014: otorga las recompensas exactamente al completar el último nivel pendiente del arco', async () => {
      await useMetaStore.getState().hydrate()
      useMetaStore.setState({ completedLevelIds: ['level-1'] }) // test-arc-1.levelIds = ['level-1']

      useMetaStore.getState().claimArcRewardsIfComplete('test-arc-1')

      const state = useMetaStore.getState()
      expect(state.grantedArcRewardIds).toEqual(['test-arc-1'])
      expect(state.ownedCats['tank-cat']).toBeDefined()
    })

    it('no otorga nada si quedan niveles del arco sin completar', async () => {
      await useMetaStore.getState().hydrate()
      useMetaStore.setState({ completedLevelIds: [] })

      useMetaStore.getState().claimArcRewardsIfComplete('test-arc-1')

      const state = useMetaStore.getState()
      expect(state.grantedArcRewardIds).toEqual([])
      expect(state.ownedCats['tank-cat']).toBeUndefined()
    })

    it('no vuelve a otorgar las recompensas si el arco ya estaba en grantedArcRewardIds', async () => {
      await useMetaStore.getState().hydrate()
      useMetaStore.setState({ completedLevelIds: ['level-1'], grantedArcRewardIds: ['test-arc-1'], ownedCats: {} })

      useMetaStore.getState().claimArcRewardsIfComplete('test-arc-1')

      expect(useMetaStore.getState().ownedCats['tank-cat']).toBeUndefined()
    })

    describe('specs/023-mapa-de-etapas-visual (US2/FR-010/FR-011/FR-012): catálogo completo obtenible', () => {
      it('FR-010/FR-011: completar arco-1 otorga exactamente los 7 catId sin obtención previa, sin tocar recompensas existentes', async () => {
        await useMetaStore.getState().hydrate()
        useMetaStore.setState({ completedLevelIds: ['level-1'] })

        useMetaStore.getState().claimArcRewardsIfComplete('arco-1-imperio-de-los-gatos')

        const state = useMetaStore.getState()
        for (const catId of ['speed-cat', 'heavy-cat', 'armored-cat', 'frost-cat', 'weaken-cat', 'slow-cat', 'zombie-ward-cat']) {
          expect(state.ownedCats[catId]).toBeDefined()
        }
        expect(state.grantedArcRewardIds).toContain('arco-1-imperio-de-los-gatos')
      })

      it('FR-010/FR-011: completar arco-2 otorga el resto de los 13 catId', async () => {
        await useMetaStore.getState().hydrate()
        useMetaStore.setState({ completedLevelIds: ['level-1', 'level-2'] })

        useMetaStore.getState().claimArcRewardsIfComplete('arco-2-imperio-de-los-gatos')

        const state = useMetaStore.getState()
        for (const catId of ['triple-strike-cat', 'lucky-cat', 'seed-cat-basic', 'seed-cat-wall', 'seed-cat-ranged', 'seed-cat-titan']) {
          expect(state.ownedCats[catId]).toBeDefined()
        }
      })

      it('FR-012: no altera firstVictoryUnlockCatId/grantedArcRewardIds ya otorgados por level-1/level-2', async () => {
        await useMetaStore.getState().hydrate()
        useMetaStore.setState({ completedLevelIds: ['level-1'] })
        useMetaStore.getState().grantLevelRewards('level-1') // otorga tank-cat (firstVictoryUnlockCatId real)

        useMetaStore.getState().claimArcRewardsIfComplete('arco-1-imperio-de-los-gatos')

        expect(useMetaStore.getState().ownedCats['tank-cat']).toBeDefined()
      })

      it('volver a llamar sobre un arco ya otorgado no duplica ni vuelve a otorgar', async () => {
        await useMetaStore.getState().hydrate()
        useMetaStore.setState({ completedLevelIds: ['level-1'] })
        useMetaStore.getState().claimArcRewardsIfComplete('arco-1-imperio-de-los-gatos')
        const ownedAfterFirst = { ...useMetaStore.getState().ownedCats }

        useMetaStore.getState().claimArcRewardsIfComplete('arco-1-imperio-de-los-gatos')

        expect(useMetaStore.getState().ownedCats).toEqual(ownedAfterFirst)
        expect(
          useMetaStore.getState().grantedArcRewardIds.filter((id) => id === 'arco-1-imperio-de-los-gatos'),
        ).toHaveLength(1)
      })
    })
  })

  describe('upgradeCat — tope escalonado (specs/012-saga-imperio-de-los-gatos US8/FR-017)', () => {
    it('rechaza la mejora sin efecto al alcanzar el tope de 10 sin la recompensa del segundo arco', async () => {
      await useMetaStore.getState().hydrate()
      useMetaStore.setState({
        currency: 999999,
        ownedCats: { 'basic-cat': { level: 10, experienceInvested: 0, evolutionStage: 'Base' } },
      })

      const ok = useMetaStore.getState().upgradeCat('basic-cat')

      expect(ok).toBe(false)
      expect(useMetaStore.getState().ownedCats['basic-cat'].level).toBe(10)
    })

    it('permite mejorar hasta 20 una vez otorgada la recompensa del segundo arco de la saga', async () => {
      await useMetaStore.getState().hydrate()
      useMetaStore.setState({
        currency: 999999,
        ownedCats: { 'basic-cat': { level: 10, experienceInvested: 0, evolutionStage: 'Base' } },
        grantedArcRewardIds: ['test-arc-2'],
      })

      const ok = useMetaStore.getState().upgradeCat('basic-cat')

      expect(ok).toBe(true)
      expect(useMetaStore.getState().ownedCats['basic-cat'].level).toBe(11)
    })
  })

  describe('spendMissionEnergy — costo por arco de acceso (specs/013-escalado-capitulos-sets-tesoros US2)', () => {
    it('FR-002: sin energyCostByArc configurado, descuenta el energyCost base del nivel', async () => {
      await useMetaStore.getState().hydrate()
      const level1 = LEVELS.find((candidate) => candidate.id === 'level-1')!
      const before = useMetaStore.getState().missionEnergy.current

      const ok = useMetaStore.getState().spendMissionEnergy(level1.id)

      expect(ok).toBe(true)
      expect(useMetaStore.getState().missionEnergy.current).toBe(before - level1.energyCost)
    })
  })

  describe('checkTreasureSetCompletion / getActiveBonusMultiplier (specs/013-escalado-capitulos-sets-tesoros US4)', () => {
    it('FR-007: otorga la bonificación exactamente al completar el último tesoro pendiente del set, en cualquier orden', async () => {
      await useMetaStore.getState().hydrate()
      useMetaStore.setState({ obtainedTreasureIds: ['tesoro-nivel-2'] })

      useMetaStore.getState().checkTreasureSetCompletion()
      expect(useMetaStore.getState().grantedTreasureSetIds).toEqual([]) // falta tesoro-nivel-1

      useMetaStore.setState({ obtainedTreasureIds: ['tesoro-nivel-2', 'tesoro-nivel-1'] })
      useMetaStore.getState().checkTreasureSetCompletion()

      expect(useMetaStore.getState().grantedTreasureSetIds).toEqual(['test-set'])
      expect(useMetaStore.getState().getActiveBonusMultiplier('EnergyRegenMultiplier')).toBe(1.5)
    })

    it('no otorga la bonificación una segunda vez', async () => {
      await useMetaStore.getState().hydrate()
      useMetaStore.setState({ obtainedTreasureIds: ['tesoro-nivel-1', 'tesoro-nivel-2'], grantedTreasureSetIds: ['test-set'] })

      useMetaStore.getState().checkTreasureSetCompletion()

      expect(useMetaStore.getState().grantedTreasureSetIds).toEqual(['test-set'])
    })

    it('FR-009: un tesoro sin set configurado no dispara ninguna bonificación', async () => {
      await useMetaStore.getState().hydrate()
      useMetaStore.setState({ obtainedTreasureIds: ['tesoro-suelto-sin-set'] })

      useMetaStore.getState().checkTreasureSetCompletion()

      expect(useMetaStore.getState().grantedTreasureSetIds).toEqual([])
    })

    it('getActiveBonusMultiplier devuelve 1 sin ningún set otorgado', async () => {
      await useMetaStore.getState().hydrate()

      expect(useMetaStore.getState().getActiveBonusMultiplier('EnergyRegenMultiplier')).toBe(1)
    })

  })

  describe('getActiveComboBonusMultiplier (specs/025-cat-combos US1/US3)', () => {
    it('FR-002: formación completa de combo-nucleo-original devuelve el multiplicador de energía de ese combo', async () => {
      await useMetaStore.getState().hydrate()
      useMetaStore.setState({ activeTeamCatIds: ['basic-cat', 'tank-cat'] })

      expect(useMetaStore.getState().getActiveComboBonusMultiplier('EnergyRegenMultiplier')).toBe(1.05)
    })

    it('FR-004: falta un miembro del combo — el multiplicador vuelve a 1, sin bono parcial', async () => {
      await useMetaStore.getState().hydrate()
      useMetaStore.setState({ activeTeamCatIds: ['basic-cat'] })

      expect(useMetaStore.getState().getActiveComboBonusMultiplier('EnergyRegenMultiplier')).toBe(1)
    })

    it('sin ningún combo activo, devuelve 1 (mismo default que getActiveBonusMultiplier)', async () => {
      await useMetaStore.getState().hydrate()

      expect(useMetaStore.getState().getActiveComboBonusMultiplier('EnergyRegenMultiplier')).toBe(1)
      expect(useMetaStore.getState().getActiveComboBonusMultiplier('CurrencyRewardMultiplier')).toBe(1)
    })

    it('Historia 3 (FR-005): con los 4 catIds de ambos combos fixture activos, cada tipo de bono se lee de forma independiente', async () => {
      await useMetaStore.getState().hydrate()
      useMetaStore.setState({ activeTeamCatIds: ['basic-cat', 'tank-cat', 'weaken-cat', 'slow-cat'] })

      expect(useMetaStore.getState().getActiveComboBonusMultiplier('EnergyRegenMultiplier')).toBe(1.05)
      expect(useMetaStore.getState().getActiveComboBonusMultiplier('CurrencyRewardMultiplier')).toBe(1.1)
    })

    it('FR-009: no persiste nada — recalcula si activeTeamCatIds cambia entre llamadas', async () => {
      await useMetaStore.getState().hydrate()
      useMetaStore.setState({ activeTeamCatIds: ['basic-cat', 'tank-cat'] })
      expect(useMetaStore.getState().getActiveComboBonusMultiplier('EnergyRegenMultiplier')).toBe(1.05)

      useMetaStore.setState({ activeTeamCatIds: [] })
      expect(useMetaStore.getState().getActiveComboBonusMultiplier('EnergyRegenMultiplier')).toBe(1)
    })
  })

  describe('grantLevelRewards + checkTreasureSetCompletion (specs/013-escalado-capitulos-sets-tesoros US4)', () => {
    it('grantLevelRewards (specs/012) dispara checkTreasureSetCompletion automáticamente al completar el set', async () => {
      await useMetaStore.getState().hydrate()
      const level1 = LEVELS.find((candidate) => candidate.id === 'level-1')!
      const level2 = LEVELS.find((candidate) => candidate.id === 'level-2')!

      useMetaStore.getState().grantLevelRewards(level1.id)
      expect(useMetaStore.getState().grantedTreasureSetIds).toEqual([])

      useMetaStore.getState().grantLevelRewards(level2.id)
      expect(useMetaStore.getState().grantedTreasureSetIds).toEqual(['test-set'])
    })
  })

  describe('selectBattleItem / deselectBattleItem (specs/017-objetos-de-batalla US1)', () => {
    it('FR-001: selecciona un objeto con stock disponible', async () => {
      await useMetaStore.getState().hydrate()
      useMetaStore.setState({ battleItemInventory: { 'speed-boost': 1 } })

      const ok = useMetaStore.getState().selectBattleItem('speed-boost')

      expect(ok).toBe(true)
      expect(useMetaStore.getState().selectedBattleItemIds).toEqual(['speed-boost'])
    })

    it('FR-007: rechaza seleccionar sin stock disponible', async () => {
      await useMetaStore.getState().hydrate()
      useMetaStore.setState({ battleItemInventory: {} })

      const ok = useMetaStore.getState().selectBattleItem('speed-boost')

      expect(ok).toBe(false)
      expect(useMetaStore.getState().selectedBattleItemIds).toEqual([])
    })

    it('FR-007: rechaza seleccionar sobre el máximo configurado (MAX_BATTLE_ITEMS_PER_BATTLE)', async () => {
      await useMetaStore.getState().hydrate()
      useMetaStore.setState({
        battleItemInventory: { 'speed-boost': 10 },
        selectedBattleItemIds: ['speed-boost', 'speed-boost', 'speed-boost'],
      })

      const ok = useMetaStore.getState().selectBattleItem('speed-boost')

      expect(ok).toBe(false)
    })

    it('Edge Case: permite varias unidades del mismo objeto si hay stock, respetando el límite total', async () => {
      await useMetaStore.getState().hydrate()
      useMetaStore.setState({ battleItemInventory: { 'extra-energy': 2 } })

      expect(useMetaStore.getState().selectBattleItem('extra-energy')).toBe(true)
      expect(useMetaStore.getState().selectBattleItem('extra-energy')).toBe(true)
      expect(useMetaStore.getState().selectBattleItem('extra-energy')).toBe(false) // sin más stock

      expect(useMetaStore.getState().selectedBattleItemIds).toEqual(['extra-energy', 'extra-energy'])
    })

    it('deselectBattleItem libera un cupo', async () => {
      await useMetaStore.getState().hydrate()
      useMetaStore.setState({ battleItemInventory: { 'speed-boost': 1 }, selectedBattleItemIds: ['speed-boost'] })

      useMetaStore.getState().deselectBattleItem('speed-boost')

      expect(useMetaStore.getState().selectedBattleItemIds).toEqual([])
    })
  })

  describe('consumeSelectedBattleItems (specs/017-objetos-de-batalla US2)', () => {
    it('FR-006: descuenta cada objeto seleccionado del inventario y limpia la selección', async () => {
      await useMetaStore.getState().hydrate()
      useMetaStore.setState({
        battleItemInventory: { 'speed-boost': 2, 'extra-energy': 1 },
        selectedBattleItemIds: ['speed-boost', 'extra-energy'],
      })

      useMetaStore.getState().consumeSelectedBattleItems()

      const state = useMetaStore.getState()
      expect(state.battleItemInventory['speed-boost']).toBe(1)
      expect(state.battleItemInventory['extra-energy']).toBe(0)
      expect(state.selectedBattleItemIds).toEqual([])
    })

    it('devuelve los efectos resueltos: speedMultiplier y energyBonus del catálogo', async () => {
      await useMetaStore.getState().hydrate()
      useMetaStore.setState({
        battleItemInventory: { 'speed-boost': 1, 'extra-energy': 1 },
        selectedBattleItemIds: ['speed-boost', 'extra-energy'],
      })

      const effects = useMetaStore.getState().consumeSelectedBattleItems()

      expect(effects.speedMultiplier).toBe(1.5)
      expect(effects.energyBonus).toBe(30)
    })

    it('marca pendingTreasureRadar cuando "Radar de Tesoro" fue seleccionado', async () => {
      await useMetaStore.getState().hydrate()
      useMetaStore.setState({ battleItemInventory: { 'treasure-radar': 1 }, selectedBattleItemIds: ['treasure-radar'] })

      useMetaStore.getState().consumeSelectedBattleItems()

      expect(useMetaStore.getState().pendingTreasureRadar).toBe(true)
    })

    it('sin ningún objeto seleccionado, devuelve efectos neutros y no cambia el inventario', async () => {
      await useMetaStore.getState().hydrate()
      useMetaStore.setState({ battleItemInventory: { 'speed-boost': 1 }, selectedBattleItemIds: [] })

      const effects = useMetaStore.getState().consumeSelectedBattleItems()

      expect(effects).toEqual({ speedMultiplier: 1, energyBonus: 0 })
      expect(useMetaStore.getState().battleItemInventory['speed-boost']).toBe(1)
    })
  })

  describe('grantRandomUnownedTreasure (specs/017-objetos-de-batalla US2)', () => {
    it('FR-009: añade un tesoro elegido al azar entre los no poseídos', async () => {
      await useMetaStore.getState().hydrate()
      const { getAllTreasureIds } = await import('../../src/data/events')
      const all = getAllTreasureIds()
      useMetaStore.setState({ obtainedTreasureIds: [all[0]] })

      useMetaStore.getState().grantRandomUnownedTreasure(() => 0)

      expect(useMetaStore.getState().obtainedTreasureIds.length).toBe(2)
    })

    it('FR-010: con todos los tesoros ya poseídos, no añade nada y no lanza error', async () => {
      await useMetaStore.getState().hydrate()
      const { getAllTreasureIds } = await import('../../src/data/events')
      const all = getAllTreasureIds()
      useMetaStore.setState({ obtainedTreasureIds: all })

      expect(() => useMetaStore.getState().grantRandomUnownedTreasure()).not.toThrow()
      expect(useMetaStore.getState().obtainedTreasureIds).toEqual(all)
    })
  })

  describe('grantLevelRewards — battleItemRewards (specs/017-objetos-de-batalla US3)', () => {
    it('FR-003: ganar un nivel con battleItemRewards suma la cantidad correcta al inventario', async () => {
      await useMetaStore.getState().hydrate()
      const level1 = LEVELS.find((candidate) => candidate.id === 'level-1')!

      useMetaStore.getState().grantLevelRewards(level1.id)

      expect(useMetaStore.getState().battleItemInventory['extra-energy']).toBe(1)
    })

    it('otorgar la misma recompensa dos veces acumula sobre la cantidad ya poseída', async () => {
      await useMetaStore.getState().hydrate()
      const level2 = LEVELS.find((candidate) => candidate.id === 'level-2')!

      useMetaStore.getState().grantLevelRewards(level2.id)
      useMetaStore.getState().grantLevelRewards(level2.id)

      expect(useMetaStore.getState().battleItemInventory['speed-boost']).toBe(2)
    })

    it('un nivel sin battleItemRewards no cambia el inventario', async () => {
      await useMetaStore.getState().hydrate()

      useMetaStore.getState().grantLevelRewards('non-existent-level')

      expect(useMetaStore.getState().battleItemInventory).toEqual({})
    })
  })

  describe('recordEncounteredEnemy (specs/018-bibliotecas-consulta US2)', () => {
    it('FR-004/005: añade un catId nuevo y persiste', async () => {
      await useMetaStore.getState().hydrate()

      useMetaStore.getState().recordEncounteredEnemy('basic-cat')

      expect(useMetaStore.getState().encounteredEnemyCatIds).toEqual(['basic-cat'])
      const row = await db.encounteredEnemies.get(1)
      expect(row?.catIds).toEqual(['basic-cat'])
    })

    it('llamarlo de nuevo con el mismo catId no duplica', async () => {
      await useMetaStore.getState().hydrate()
      useMetaStore.getState().recordEncounteredEnemy('basic-cat')

      useMetaStore.getState().recordEncounteredEnemy('basic-cat')

      expect(useMetaStore.getState().encounteredEnemyCatIds).toEqual(['basic-cat'])
    })
  })

  describe('claimRankThreshold (specs/019-rango-de-usuario US2)', () => {
    it('FR-004/009: otorga la recompensa configurada cuando el rango alcanza o supera el umbral', async () => {
      await useMetaStore.getState().hydrate()
      useMetaStore.setState({ ownedCats: { 'basic-cat': { level: 2, experienceInvested: 0, evolutionStage: 'Base' } } })

      const ok = useMetaStore.getState().claimRankThreshold(2)

      expect(ok).toBe(true)
      expect(useMetaStore.getState().battleItemInventory['extra-energy']).toBe(1)
      expect(useMetaStore.getState().claimedRankThresholds).toEqual([2])
      const row = await db.userRank.get(1)
      expect(row?.claimedThresholds).toEqual([2])
    })

    it('FR-005: rechaza sin efecto un umbral no alcanzado todavía', async () => {
      await useMetaStore.getState().hydrate()
      useMetaStore.setState({ ownedCats: { 'basic-cat': { level: 1, experienceInvested: 0, evolutionStage: 'Base' } } })

      const ok = useMetaStore.getState().claimRankThreshold(2)

      expect(ok).toBe(false)
      expect(useMetaStore.getState().claimedRankThresholds).toEqual([])
      expect(useMetaStore.getState().battleItemInventory['extra-energy'] ?? 0).toBe(0)
    })

    it('FR-006: rechaza sin efecto un umbral ya reclamado', async () => {
      await useMetaStore.getState().hydrate()
      useMetaStore.setState({
        ownedCats: { 'basic-cat': { level: 2, experienceInvested: 0, evolutionStage: 'Base' } },
        claimedRankThresholds: [2],
      })

      const ok = useMetaStore.getState().claimRankThreshold(2)

      expect(ok).toBe(false)
      expect(useMetaStore.getState().battleItemInventory['extra-energy'] ?? 0).toBe(0)
    })

    it('FR-008: permite reclamar varios umbrales alcanzados en cualquier orden', async () => {
      await useMetaStore.getState().hydrate()
      useMetaStore.setState({ ownedCats: { 'basic-cat': { level: 4, experienceInvested: 0, evolutionStage: 'Base' } } })

      const okHigherFirst = useMetaStore.getState().claimRankThreshold(4)
      const okLowerSecond = useMetaStore.getState().claimRankThreshold(2)

      expect(okHigherFirst).toBe(true)
      expect(okLowerSecond).toBe(true)
      expect(useMetaStore.getState().battleItemInventory['speed-boost']).toBe(2)
      expect(useMetaStore.getState().battleItemInventory['extra-energy']).toBe(1)
      expect([...useMetaStore.getState().claimedRankThresholds].sort()).toEqual([2, 4])
    })
  })

  // specs/024-sistema-gacha.
  describe('gacha', () => {
    beforeEach(async () => {
      await useMetaStore.getState().hydrate()
    })

    it('FR-001/FR-005: rollGachaSingle con saldo suficiente descuenta 150, agrega 1 cápsula al Almacén y no toca ownedCats', async () => {
      useMetaStore.setState({ gachaCurrency: 150 })

      const result = await useMetaStore.getState().rollGachaSingle('estandar')

      expect(result).not.toBeNull()
      expect(useMetaStore.getState().gachaCurrency).toBe(0)
      expect(useMetaStore.getState().gachaStorage).toHaveLength(1)
      expect(useMetaStore.getState().gachaStorage[0].catId).toBe(result!.catId)
      expect(useMetaStore.getState().ownedCats[result!.catId]).toBeUndefined()
      const rows = await db.gachaStorage.toArray()
      expect(rows).toHaveLength(1)
    })

    it('FR-004: rollGachaSingle con saldo insuficiente no descuenta ni agrega ninguna cápsula', async () => {
      useMetaStore.setState({ gachaCurrency: 100 })

      const result = await useMetaStore.getState().rollGachaSingle('estandar')

      expect(result).toBeNull()
      expect(useMetaStore.getState().gachaCurrency).toBe(100)
      expect(useMetaStore.getState().gachaStorage).toHaveLength(0)
    })

    it('FR-002: rollGachaMulti con saldo suficiente descuenta 1500 (no 11x150) y agrega exactamente 11 cápsulas', async () => {
      useMetaStore.setState({ gachaCurrency: 1500 })

      const results = await useMetaStore.getState().rollGachaMulti('estandar')

      expect(results).toHaveLength(11)
      expect(useMetaStore.getState().gachaCurrency).toBe(0)
      expect(useMetaStore.getState().gachaStorage).toHaveLength(11)
    })

    it('FR-004: rollGachaMulti con saldo insuficiente para la x11 retorna null sin efecto', async () => {
      useMetaStore.setState({ gachaCurrency: 1499 })

      const results = await useMetaStore.getState().rollGachaMulti('estandar')

      expect(results).toBeNull()
      expect(useMetaStore.getState().gachaCurrency).toBe(1499)
      expect(useMetaStore.getState().gachaStorage).toHaveLength(0)
    })

    it('FR-006: activateCapsule de un catId no poseído lo agrega a ownedCats y retira la cápsula del Almacén', async () => {
      const id = await db.gachaStorage.add({ catId: 'tank-cat', rarity: 'Raro' })
      useMetaStore.setState({ gachaStorage: [{ id, catId: 'tank-cat', rarity: 'Raro' }] })

      await useMetaStore.getState().activateCapsule(id)

      expect(useMetaStore.getState().ownedCats['tank-cat']).toEqual({ level: 1, experienceInvested: 0, evolutionStage: 'Base' })
      expect(useMetaStore.getState().gachaStorage).toHaveLength(0)
      expect(await db.gachaStorage.toArray()).toHaveLength(0)
    })

    it('FR-007: activateCapsule de un catId ya poseído suma nivel "+" y no crea una segunda entrada', async () => {
      const id = await db.gachaStorage.add({ catId: 'basic-cat', rarity: 'Raro' })
      useMetaStore.setState({
        ownedCats: { 'basic-cat': { level: 3, experienceInvested: 200, evolutionStage: 'Base' } },
        gachaStorage: [{ id, catId: 'basic-cat', rarity: 'Raro' }],
      })

      await useMetaStore.getState().activateCapsule(id)

      const ownedCats = useMetaStore.getState().ownedCats
      expect(Object.keys(ownedCats)).toEqual(['basic-cat'])
      expect(ownedCats['basic-cat'].plusLevel).toBe(1)
      expect(ownedCats['basic-cat'].level).toBe(3)
      expect(useMetaStore.getState().gachaStorage).toHaveLength(0)
    })

    it('FR-008: exchangeCapsuleForXp suma a currency, retira la cápsula, no toca plusLevel', async () => {
      const id = await db.gachaStorage.add({ catId: 'basic-cat', rarity: 'Raro' })
      useMetaStore.setState({
        currency: 0,
        ownedCats: { 'basic-cat': { level: 1, experienceInvested: 0, evolutionStage: 'Base', plusLevel: 2 } },
        gachaStorage: [{ id, catId: 'basic-cat', rarity: 'Raro' }],
      })

      await useMetaStore.getState().exchangeCapsuleForXp(id)

      expect(useMetaStore.getState().currency).toBe(150)
      expect(useMetaStore.getState().gachaStorage).toHaveLength(0)
      expect(useMetaStore.getState().ownedCats['basic-cat'].plusLevel).toBe(2)
    })

    it('FR-009: exchangeCapsuleForNp en una cápsula Megarraro suma a npCurrency', async () => {
      const id = await db.gachaStorage.add({ catId: 'seed-cat-titan', rarity: 'Megarraro' })
      useMetaStore.setState({ npCurrency: 0, gachaStorage: [{ id, catId: 'seed-cat-titan', rarity: 'Megarraro' }] })

      const ok = await useMetaStore.getState().exchangeCapsuleForNp(id)

      expect(ok).toBe(true)
      expect(useMetaStore.getState().npCurrency).toBe(150)
      expect(useMetaStore.getState().gachaStorage).toHaveLength(0)
    })

    it('FR-009: exchangeCapsuleForNp en una cápsula Raro/Superraro retorna false sin efecto', async () => {
      const id = await db.gachaStorage.add({ catId: 'tank-cat', rarity: 'Raro' })
      useMetaStore.setState({ npCurrency: 0, gachaStorage: [{ id, catId: 'tank-cat', rarity: 'Raro' }] })

      const ok = await useMetaStore.getState().exchangeCapsuleForNp(id)

      expect(ok).toBe(false)
      expect(useMetaStore.getState().npCurrency).toBe(0)
      expect(useMetaStore.getState().gachaStorage).toHaveLength(1)
    })
  })

  describe('Buzón de Noticias (specs/026-navegacion-hub-mockup, FR-008/FR-009)', () => {
    it('hydrate() puebla readNewsIds desde Dexie', async () => {
      await db.newsRead.put({ id: 1, readIds: ['news-cat-combos'] })

      await useMetaStore.getState().hydrate()

      expect(useMetaStore.getState().readNewsIds).toEqual(['news-cat-combos'])
    })

    it('markNewsRead agrega el id a readNewsIds en memoria y en Dexie', async () => {
      await useMetaStore.getState().hydrate()

      await useMetaStore.getState().markNewsRead('news-cat-combos')

      expect(useMetaStore.getState().readNewsIds).toEqual(['news-cat-combos'])
      expect(await db.newsRead.get(1)).toEqual({ id: 1, readIds: ['news-cat-combos'] })
    })

    it('markNewsRead no duplica un id ya marcado como leído', async () => {
      await useMetaStore.getState().hydrate()
      await useMetaStore.getState().markNewsRead('news-cat-combos')

      await useMetaStore.getState().markNewsRead('news-cat-combos')

      expect(useMetaStore.getState().readNewsIds).toEqual(['news-cat-combos'])
    })
  })
})
