import { beforeEach, describe, expect, it } from 'vitest'
import { CATS } from '../../src/data/cats'
import { useGameStore } from '../../src/state/useGameStore'

const cat = CATS[0]

beforeEach(() => {
  useGameStore.getState().reset()
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
