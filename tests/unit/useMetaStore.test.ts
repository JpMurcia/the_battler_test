import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../../src/db'
import { useMetaStore } from '../../src/state/useMetaStore'

const INITIAL_STATE = {
  isHydrated: false,
  currency: 0,
  highestUnlockedLevelIndex: 0,
  completedLevelIds: [] as string[],
  ownedCats: {},
  settings: { musicVolume: 1, sfxVolume: 1, language: 'es' },
}

beforeEach(async () => {
  await Promise.all([
    db.playerProfile.clear(),
    db.settings.clear(),
    db.ownedCats.clear(),
    db.levelProgress.clear(),
  ])
  useMetaStore.setState(INITIAL_STATE)
})

describe('useMetaStore', () => {
  it('hydrate() sobre una base de datos vacía deja el estado por defecto esperado', async () => {
    await useMetaStore.getState().hydrate()

    const state = useMetaStore.getState()
    expect(state.isHydrated).toBe(true)
    expect(state.currency).toBe(0)
    expect(state.highestUnlockedLevelIndex).toBe(0)
    expect(state.completedLevelIds).toEqual([])
    expect(state.ownedCats).toEqual({})
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
})
