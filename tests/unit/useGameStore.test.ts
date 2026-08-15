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
