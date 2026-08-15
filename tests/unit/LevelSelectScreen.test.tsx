import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/data/levels', () => ({
  LEVELS: [
    {
      id: 'level-1',
      name: 'Nivel 1',
      playerBaseHp: 1000,
      enemyBaseHp: 1000,
      maxEnergy: 100,
      energyRegenPerSecond: 5,
      currencyReward: 100,
      enemyWave: [],
      energyCost: 20,
      region: 'imperio-de-los-gatos',
      difficulty: 1,
    },
    {
      id: 'level-2',
      name: 'Nivel 2',
      playerBaseHp: 1000,
      enemyBaseHp: 1000,
      maxEnergy: 100,
      energyRegenPerSecond: 5,
      currencyReward: 100,
      enemyWave: [],
      energyCost: 20,
      region: 'imperio-de-los-gatos',
      difficulty: 1,
    },
  ],
}))

const { LevelSelectScreen } = await import('../../src/screens/LevelSelectScreen')
const { useGameStore } = await import('../../src/state/useGameStore')
const { useMetaStore } = await import('../../src/state/useMetaStore')

beforeEach(() => {
  useMetaStore.setState({
    highestUnlockedLevelIndex: 0,
    completedLevelIds: [],
    missionEnergy: { current: 100, max: 100 },
  })
  useGameStore.getState().reset()
})

describe('LevelSelectScreen', () => {
  it('deshabilita "Jugar" en un nivel bloqueado y no inicia la batalla', () => {
    const onNavigate = vi.fn()
    render(<LevelSelectScreen onNavigate={onNavigate} />)

    const lockedButton = screen.getAllByRole('button', { name: 'Jugar' })[1]
    expect(lockedButton).toBeDisabled()

    fireEvent.click(lockedButton)

    expect(onNavigate).not.toHaveBeenCalled()
    expect(useGameStore.getState().levelId).toBeNull()
  })

  it('permite jugar un nivel desbloqueado y descuenta la energía de misión', () => {
    const onNavigate = vi.fn()
    render(<LevelSelectScreen onNavigate={onNavigate} />)

    fireEvent.click(screen.getAllByRole('button', { name: 'Jugar' })[0])

    expect(onNavigate).toHaveBeenCalledWith('Battle')
    expect(useGameStore.getState().levelId).toBe('level-1')
    expect(useMetaStore.getState().missionEnergy.current).toBe(80)
  })

  it('deshabilita "Jugar" sin energía de misión suficiente y no navega a Battle (specs/007 US2)', () => {
    useMetaStore.setState({ missionEnergy: { current: 5, max: 100 } })
    const onNavigate = vi.fn()
    render(<LevelSelectScreen onNavigate={onNavigate} />)

    const button = screen.getAllByRole('button', { name: 'Jugar' })[0]
    expect(button).toBeDisabled()

    fireEvent.click(button)

    expect(onNavigate).not.toHaveBeenCalled()
    expect(useGameStore.getState().levelId).toBeNull()
    expect(useMetaStore.getState().missionEnergy.current).toBe(5)
  })
})
