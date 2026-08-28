import { fireEvent, render, screen } from '@testing-library/react'
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
    speedMultiplier: 1,
    paused: false,
    specialCannon: { rechargeRemaining: 0, rechargeDurationSeconds: 20, areaRadius: 40, damage: 50 },
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

describe('BattleScreen DeployBar — tope de equipo heredado (specs/023-mapa-de-etapas-visual US3/FR-016)', () => {
  const SEVEN_OWNED_CAT_IDS = ['basic-cat', 'tank-cat', 'speed-cat', 'heavy-cat', 'solar-cat', 'armored-cat', 'frost-cat']

  it('con activeTeamCatIds de 7 catId (dato heredado), muestra como máximo los primeros 6 sin error', () => {
    useMetaStore.setState({
      ownedCats: Object.fromEntries(
        SEVEN_OWNED_CAT_IDS.map((catId) => [catId, { level: 1, experienceInvested: 0, evolutionStage: 'Base' as const }]),
      ),
      activeTeamCatIds: SEVEN_OWNED_CAT_IDS,
    })

    render(<BattleScreen onNavigate={noop} />)

    expect(screen.getByRole('button', { name: /Gato Blindado/ })).toBeInTheDocument() // 6º (armored-cat)
    expect(screen.queryByRole('button', { name: /Gato Escarcha/ })).not.toBeInTheDocument() // 7º excluido
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

describe('BattleScreen — cañón especial (specs/029-pulido-batalla-hud US1)', () => {
  it('mientras recarga, el control está deshabilitado', () => {
    useGameStore.setState({
      specialCannon: { rechargeRemaining: 12, rechargeDurationSeconds: 20, areaRadius: 40, damage: 50 },
    })

    render(<BattleScreen onNavigate={noop} />)

    expect(screen.getByRole('button', { name: /cañón/i })).toBeDisabled()
  })

  it('con la recarga en 0, el control se habilita', () => {
    useGameStore.setState({
      specialCannon: { rechargeRemaining: 0, rechargeDurationSeconds: 20, areaRadius: 40, damage: 50 },
    })

    render(<BattleScreen onNavigate={noop} />)

    expect(screen.getByRole('button', { name: /cañón/i })).toBeEnabled()
  })

  it('pulsarlo habilitado invoca activateSpecialCannon() (la recarga vuelve a su duración total)', () => {
    useGameStore.setState({
      specialCannon: { rechargeRemaining: 0, rechargeDurationSeconds: 20, areaRadius: 40, damage: 50 },
    })

    render(<BattleScreen onNavigate={noop} />)
    fireEvent.click(screen.getByRole('button', { name: /cañón/i }))

    expect(useGameStore.getState().specialCannon.rechargeRemaining).toBe(20)
  })

  it('pulsarlo deshabilitado no invoca activateSpecialCannon() (la recarga no cambia)', () => {
    useGameStore.setState({
      specialCannon: { rechargeRemaining: 12, rechargeDurationSeconds: 20, areaRadius: 40, damage: 50 },
    })

    render(<BattleScreen onNavigate={noop} />)
    fireEvent.click(screen.getByRole('button', { name: /cañón/i }))

    expect(useGameStore.getState().specialCannon.rechargeRemaining).toBe(12)
  })
})

describe('BattleScreen — velocidad y pausa (specs/029-pulido-batalla-hud US2)', () => {
  it('x1 está resaltado por defecto', () => {
    render(<BattleScreen onNavigate={noop} />)

    expect(screen.getByRole('button', { name: 'x1' })).toHaveClass('btn-primary')
  })

  it('pulsar x2 invoca setSpeedMultiplier(2)', () => {
    render(<BattleScreen onNavigate={noop} />)
    fireEvent.click(screen.getByRole('button', { name: 'x2' }))

    expect(useGameStore.getState().speedMultiplier).toBe(2)
  })

  it('con speedMultiplier=2, x2 queda resaltado', () => {
    useGameStore.setState({ speedMultiplier: 2 })

    render(<BattleScreen onNavigate={noop} />)

    expect(screen.getByRole('button', { name: 'x2' })).toHaveClass('btn-primary')
  })

  it('pulsar pausa invoca setPaused(true) y cambia la etiqueta', () => {
    render(<BattleScreen onNavigate={noop} />)
    fireEvent.click(screen.getByRole('button', { name: /pausar/i }))

    expect(useGameStore.getState().paused).toBe(true)
  })

  it('con paused=true, el botón ofrece reanudar', () => {
    useGameStore.setState({ paused: true })

    render(<BattleScreen onNavigate={noop} />)

    expect(screen.getByRole('button', { name: /reanudar/i })).toBeInTheDocument()
  })
})

describe('BattleScreen — disposición de filas de despliegue (specs/029-pulido-batalla-hud US5)', () => {
  it('por defecto la barra de despliegue está en 1 fila', () => {
    const { container } = render(<BattleScreen onNavigate={noop} />)

    expect(container.querySelector('.deploy-bar')).not.toHaveClass('deploy-bar--two-rows')
  })

  it('pulsar el toggle pasa a 2 filas sin cambiar las unidades disponibles', () => {
    const { container } = render(<BattleScreen onNavigate={noop} />)

    fireEvent.click(screen.getByRole('button', { name: /filas/i }))

    expect(container.querySelector('.deploy-bar')).toHaveClass('deploy-bar--two-rows')
    expect(screen.getByRole('button', { name: /Gato Básico/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Gato Tanque/ })).toBeInTheDocument()
  })

  it('alternar de nuevo vuelve a 1 fila', () => {
    const { container } = render(<BattleScreen onNavigate={noop} />)
    const toggle = screen.getByRole('button', { name: /filas/i })

    fireEvent.click(toggle)
    fireEvent.click(toggle)

    expect(container.querySelector('.deploy-bar')).not.toHaveClass('deploy-bar--two-rows')
  })
})
