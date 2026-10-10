import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/game/BattleStage', () => ({ BattleStage: () => null }))

// specs/032-festival-de-tesoros: catálogo mockeable, en vez del real (que cubre todo 2026 y haría el
// festival "siempre activo" en tests si no se controla explícitamente).
const { mockTreasureFestivals } = vi.hoisted(() => ({
  mockTreasureFestivals: [] as { id: string; name: string; currencyMultiplier: number; timeWindows: { startMs: number; endMs: number }[] }[],
}))
vi.mock('../../src/data/treasureFestival', () => ({
  TREASURE_FESTIVALS: mockTreasureFestivals,
  getActiveTreasureFestival: (_festivals: unknown, nowMs: number) =>
    mockTreasureFestivals.find((festival) => festival.timeWindows.some((w) => nowMs >= w.startMs && nowMs < w.endMs)),
}))

const { BattleScreen } = await import('../../src/screens/BattleScreen')
const { useGameStore } = await import('../../src/state/useGameStore')
const { useMetaStore } = await import('../../src/state/useMetaStore')

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
    missionProgress: {},
    claimedMissionIds: [],
    missionsResetDateKey: '',
  })
  mockTreasureFestivals.length = 0
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

describe('BattleScreen — Contabilidad (specs/031-mejoras-de-base US3)', () => {
  it('en victoria, con accounting en nivel >0 la moneda otorgada es mayor que en nivel 0', () => {
    useGameStore.setState({ levelId: 'level-1', status: 'InProgress' })
    useMetaStore.setState({ currency: 0, baseUpgrades: {} })
    const first = render(<BattleScreen onNavigate={noop} />)
    act(() => {
      useGameStore.setState({ status: 'Victory' })
    })
    const currencyWithoutBonus = useMetaStore.getState().currency
    first.unmount()

    useGameStore.setState({ levelId: 'level-1', status: 'InProgress' })
    useMetaStore.setState({ currency: 0, baseUpgrades: { accounting: 5 }, completedLevelIds: [] })
    render(<BattleScreen onNavigate={noop} />)
    act(() => {
      useGameStore.setState({ status: 'Victory' })
    })
    const currencyWithBonus = useMetaStore.getState().currency

    expect(currencyWithBonus).toBeGreaterThan(currencyWithoutBonus)
  })
})

describe('BattleScreen — Festival de Tesoros (specs/032-festival-de-tesoros US2)', () => {
  it('en victoria dentro de la ventana del festival, la moneda incluye su multiplicador', () => {
    const now = Date.now()

    useGameStore.setState({ levelId: 'level-1', status: 'InProgress' })
    useMetaStore.setState({ currency: 0, completedLevelIds: [] })
    const first = render(<BattleScreen onNavigate={noop} />)
    act(() => {
      useGameStore.setState({ status: 'Victory' })
    })
    const currencyWithoutFestival = useMetaStore.getState().currency
    first.unmount()

    mockTreasureFestivals.push({
      id: 'festival-prueba',
      name: 'Festival de Prueba',
      currencyMultiplier: 2,
      timeWindows: [{ startMs: now - 1000, endMs: now + 60_000 }],
    })
    useGameStore.setState({ levelId: 'level-1', status: 'InProgress' })
    useMetaStore.setState({ currency: 0, completedLevelIds: [] })
    render(<BattleScreen onNavigate={noop} />)
    act(() => {
      useGameStore.setState({ status: 'Victory' })
    })
    const currencyWithFestival = useMetaStore.getState().currency

    expect(currencyWithFestival).toBe(currencyWithoutFestival * 2)
  })

  it('specs/033-misiones-catnip-challenges: en victoria, incrementa missionProgress.levelsCompleted', () => {
    useGameStore.setState({ levelId: 'level-1', status: 'InProgress' })
    useMetaStore.setState({ missionProgress: {}, completedLevelIds: [] })
    render(<BattleScreen onNavigate={noop} />)

    act(() => {
      useGameStore.setState({ status: 'Victory' })
    })

    expect(useMetaStore.getState().missionProgress.levelsCompleted).toBe(1)
  })

  it('en victoria fuera de cualquier ventana, la moneda no incluye ningún multiplicador de festival', () => {
    useGameStore.setState({ levelId: 'level-1', status: 'InProgress' })
    useMetaStore.setState({ currency: 0, completedLevelIds: [] })
    render(<BattleScreen onNavigate={noop} />)

    act(() => {
      useGameStore.setState({ status: 'Victory' })
    })

    expect(useMetaStore.getState().currency).toBeGreaterThan(0)
  })
})

describe('BattleScreen — efecto de la Cabeza de Cañón en el HUD (specs/041-cabezas-de-canon US3)', () => {
  afterEach(() => {
    useMetaStore.setState({ ototoBuildings: {} })
  })

  it('con una cabeza construida, el control de cañón muestra el nombre del efecto', () => {
    useMetaStore.setState({ ototoBuildings: { cannonHead: 'Knockback' } })

    render(<BattleScreen onNavigate={noop} />)

    expect(screen.getByRole('button', { name: /cañón/i })).toHaveTextContent('Cañón · Retroceso')
  })

  it('sin ninguna cabeza, el control de cañón se muestra exactamente como antes (solo "Cañón")', () => {
    useMetaStore.setState({ ototoBuildings: {} })

    render(<BattleScreen onNavigate={noop} />)

    const button = screen.getByRole('button', { name: /cañón/i })
    expect(button).toHaveTextContent(/^Cañón$/)
    expect(button).not.toHaveTextContent('·')
  })

  it('el efecto mostrado no cambia el estado habilitado/deshabilitado del control', () => {
    useMetaStore.setState({ ototoBuildings: { cannonHead: 'Freeze' } })
    useGameStore.setState({ specialCannon: { rechargeRemaining: 12, rechargeDurationSeconds: 20, areaRadius: 40, damage: 50 } })

    render(<BattleScreen onNavigate={noop} />)

    expect(screen.getByRole('button', { name: /cañón/i })).toBeDisabled()
  })
})
