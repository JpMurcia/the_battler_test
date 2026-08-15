import { beforeEach, describe, expect, it } from 'vitest'
import { CATS } from '../../src/data/cats'
import { LEVELS } from '../../src/data/levels'
import { db } from '../../src/db'
import { useMetaStore } from '../../src/state/useMetaStore'

const INITIAL_STATE = {
  isHydrated: false,
  currency: 0,
  highestUnlockedLevelIndex: 0,
  completedLevelIds: [] as string[],
  ownedCats: {},
  settings: { musicVolume: 1, sfxVolume: 1, language: 'es' },
  activeTeamCatIds: [] as string[],
  missionEnergy: { current: 0, max: 0 },
}

beforeEach(async () => {
  await Promise.all([
    db.playerProfile.clear(),
    db.settings.clear(),
    db.ownedCats.clear(),
    db.levelProgress.clear(),
    db.teamFormation.clear(),
    db.missionEnergy.clear(),
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
    expect(state.ownedCats).toEqual({ [CATS[0].id]: { level: 1, experienceInvested: 0 } })
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
})
