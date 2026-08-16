import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BattleScreen } from '../../src/screens/BattleScreen'
import { useGameStore } from '../../src/state/useGameStore'
import { useMetaStore } from '../../src/state/useMetaStore'

vi.mock('../../src/game/BattleStage', () => ({ BattleStage: () => null }))

const noop = () => {}

beforeEach(() => {
  useGameStore.setState({
    status: 'InProgress',
    energy: { current: 999, max: 999, regenPerSecond: 0 },
    deployCooldowns: {},
  })
  useMetaStore.setState({
    ownedCats: {
      'basic-cat': { level: 1, experienceInvested: 0, evolutionStage: 'Base' },
      'tank-cat': { level: 1, experienceInvested: 0, evolutionStage: 'Base' },
    },
    activeTeamCatIds: [],
  })
})

describe('BattleScreen DeployBar', () => {
  it('sin equipo activo guardado ofrece todos los ownedCats', () => {
    render(<BattleScreen onNavigate={noop} />)

    expect(screen.getByRole('button', { name: /Gato Básico/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Gato Tanque/ })).toBeInTheDocument()
  })

  it('con equipo activo guardado no ofrece un gato excluido', () => {
    useMetaStore.setState({ activeTeamCatIds: ['basic-cat'] })

    render(<BattleScreen onNavigate={noop} />)

    expect(screen.getByRole('button', { name: /Gato Básico/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Gato Tanque/ })).not.toBeInTheDocument()
  })
})

describe('BattleScreen — indicador de barrera de jefe (specs/020-barrera-de-base)', () => {
  it('FR-008: con bossBarrierActive true, el indicador aparece', () => {
    useGameStore.setState({ bossBarrierActive: true, enemyBase: { hp: 100, maxHp: 100 } })

    render(<BattleScreen onNavigate={noop} />)

    expect(screen.getByText(/🛡/)).toBeInTheDocument()
  })

  it('con bossBarrierActive false, el indicador no aparece', () => {
    useGameStore.setState({ bossBarrierActive: false, enemyBase: { hp: 100, maxHp: 100 } })

    render(<BattleScreen onNavigate={noop} />)

    expect(screen.queryByText(/🛡/)).not.toBeInTheDocument()
  })
})
