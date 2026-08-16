import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { EventBanner } from '../../src/data/events'
import type { Level } from '../../src/data/levels'

// specs/014-banner-evento-especial: valores mutables/compartidos con los mocks de abajo — vi.mock se hoistea
// por encima de imports/variables normales, así que vi.hoisted es la única vía soportada para exponerlos.
const { mockEventBanners, MOCK_LEVELS } = vi.hoisted(() => ({
  mockEventBanners: [] as EventBanner[],
  MOCK_LEVELS: [
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
  ] as Level[],
}))

vi.mock('../../src/data/levels', () => ({ LEVELS: MOCK_LEVELS }))

// resolveLevel/isEventStageId se reimplementan aquí (no `...actual`): una función spread de `actual` conserva
// su closure sobre el `EVENT_BANNERS` ORIGINAL del módulo real, no sobre `mockEventBanners` (gotcha de vi.mock).
vi.mock('../../src/data/events', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/data/events')>()
  return {
    ...actual,
    EVENT_BANNERS: mockEventBanners,
    resolveLevel: (levelId: string) =>
      MOCK_LEVELS.find((level) => level.id === levelId) ?? mockEventBanners.map((banner) => banner.specialStage).find((stage) => stage.id === levelId),
    isEventStageId: (levelId: string) => mockEventBanners.some((banner) => banner.specialStage.id === levelId),
  }
})

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
  mockEventBanners.length = 0
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

  it('specs/011-nivel-2-hacia-el-futuro (T005): con highestUnlockedLevelIndex = 1, level-2 aparece desbloqueado', () => {
    useMetaStore.setState({ highestUnlockedLevelIndex: 1 })
    render(<LevelSelectScreen onNavigate={vi.fn()} />)

    const level2Button = screen.getAllByRole('button', { name: 'Jugar' })[1]
    expect(level2Button).not.toBeDisabled()
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

describe('LevelSelectScreen — banner de evento (specs/014-banner-evento-especial)', () => {
  const activeBanner: EventBanner = {
    id: 'test-banner',
    name: 'Banner de Prueba',
    energyCost: 10,
    timeWindows: [{ startMs: Date.now() - 1000, endMs: Date.now() + 1000 * 60 * 60 }],
    specialStage: {
      id: 'test-banner-stage',
      name: 'Fase Especial de Prueba',
      playerBaseHp: 1000,
      enemyBaseHp: 500,
      maxEnergy: 100,
      energyRegenPerSecond: 5,
      currencyReward: 200,
      enemyWave: [],
      energyCost: 10,
      region: 'test',
      difficulty: 1,
    },
  }

  it('US1/FR-002: un banner dentro de su ventana horaria aparece seleccionable', () => {
    mockEventBanners.push(activeBanner)
    render(<LevelSelectScreen onNavigate={vi.fn()} />)

    expect(screen.getByText(/Banner de Prueba/)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Jugar' })).toHaveLength(3) // banner + level-1 + level-2
  })

  it('US1/FR-003: un banner fuera de todas sus ventanas horarias no se muestra', () => {
    mockEventBanners.push({
      ...activeBanner,
      timeWindows: [{ startMs: Date.now() - 1000 * 60 * 60 * 24 * 2, endMs: Date.now() - 1000 * 60 * 60 * 24 }],
    })
    render(<LevelSelectScreen onNavigate={vi.fn()} />)

    expect(screen.queryByText(/Banner de Prueba/)).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Jugar' })).toHaveLength(2) // solo level-1 + level-2
  })

  it('US2/FR-005: seleccionar el banner activo con energía suficiente navega a Battle con la specialStage, sin exigir desbloqueo secuencial', () => {
    mockEventBanners.push(activeBanner)
    useMetaStore.setState({ highestUnlockedLevelIndex: 0 }) // nada desbloqueado todavía
    const onNavigate = vi.fn()
    render(<LevelSelectScreen onNavigate={onNavigate} />)

    fireEvent.click(screen.getAllByRole('button', { name: 'Jugar' })[0])

    expect(onNavigate).toHaveBeenCalledWith('Battle')
    expect(useGameStore.getState().levelId).toBe('test-banner-stage')
  })

  it('sin energía de misión suficiente, el botón del banner está deshabilitado y no navega', () => {
    mockEventBanners.push(activeBanner)
    useMetaStore.setState({ missionEnergy: { current: 5, max: 100 } })
    const onNavigate = vi.fn()
    render(<LevelSelectScreen onNavigate={onNavigate} />)

    const button = screen.getAllByRole('button', { name: 'Jugar' })[0]
    expect(button).toBeDisabled()

    fireEvent.click(button)

    expect(onNavigate).not.toHaveBeenCalled()
    expect(useGameStore.getState().levelId).toBeNull()
  })
})
