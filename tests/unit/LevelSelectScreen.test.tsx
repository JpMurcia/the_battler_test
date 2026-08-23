import { act, fireEvent, render, screen } from '@testing-library/react'
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
      mapPosition: { x: 15, y: 80 },
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
      difficulty: 2,
      mapPosition: { x: 45, y: 55 },
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

describe('LevelSelectScreen — mapa de nodos (specs/023-mapa-de-etapas-visual US1)', () => {
  it('refleja el estado correcto por nodo (bloqueado/disponible) y un nodo bloqueado no tiene efecto', () => {
    const onNavigate = vi.fn()
    render(<LevelSelectScreen onNavigate={onNavigate} />)

    const unlockedNode = screen.getByRole('button', { name: 'Nivel 1' })
    const lockedNode = screen.getByRole('button', { name: 'Nivel 2' })
    expect(unlockedNode).not.toBeDisabled()
    expect(unlockedNode).toHaveClass('stage-node--unlocked')
    expect(lockedNode).toBeDisabled()
    expect(lockedNode).toHaveClass('stage-node--locked')

    fireEvent.click(lockedNode)

    expect(screen.queryByText('¡Atacar!')).not.toBeInTheDocument()
    expect(onNavigate).not.toHaveBeenCalled()
    expect(useGameStore.getState().levelId).toBeNull()
  })

  it('un nodo completado refleja ese estado y desbloquea el siguiente', () => {
    useMetaStore.setState({ highestUnlockedLevelIndex: 1, completedLevelIds: ['level-1'] })
    render(<LevelSelectScreen onNavigate={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Nivel 1' })).toHaveClass('stage-node--completed')
    expect(screen.getByRole('button', { name: 'Nivel 2' })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: 'Nivel 2' })).toHaveClass('stage-node--unlocked')
  })

  it('tocar un nodo disponible abre el panel de detalle con nombre, estrellas y costo de energía', () => {
    render(<LevelSelectScreen onNavigate={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Nivel 1' }))

    expect(screen.getByText('Nivel 1', { selector: '.stage-detail-panel__title' })).toBeInTheDocument()
    expect(screen.getByText('★ 1')).toBeInTheDocument()
    expect(screen.getByText('⚡ 20')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '¡Atacar!' })).not.toBeDisabled()
  })

  it('"¡Atacar!" descuenta la energía de misión y navega a Battle, igual que el "Jugar" anterior', () => {
    const onNavigate = vi.fn()
    render(<LevelSelectScreen onNavigate={onNavigate} />)

    fireEvent.click(screen.getByRole('button', { name: 'Nivel 1' }))
    fireEvent.click(screen.getByRole('button', { name: '¡Atacar!' }))

    expect(onNavigate).toHaveBeenCalledWith('Battle')
    expect(useGameStore.getState().levelId).toBe('level-1')
    expect(useMetaStore.getState().missionEnergy.current).toBe(80)
  })

  it('"¡Atacar!" queda deshabilitado sin energía de misión suficiente y no navega', () => {
    useMetaStore.setState({ missionEnergy: { current: 5, max: 100 } })
    const onNavigate = vi.fn()
    render(<LevelSelectScreen onNavigate={onNavigate} />)

    fireEvent.click(screen.getByRole('button', { name: 'Nivel 1' }))
    const attackButton = screen.getByRole('button', { name: '¡Atacar!' })
    expect(attackButton).toBeDisabled()

    fireEvent.click(attackButton)

    expect(onNavigate).not.toHaveBeenCalled()
    expect(useGameStore.getState().levelId).toBeNull()
    expect(useMetaStore.getState().missionEnergy.current).toBe(5)
  })

  it('el panel se reactiva a missionEnergy sin cerrarse (Edge Cases)', () => {
    render(<LevelSelectScreen onNavigate={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Nivel 1' }))
    expect(screen.getByRole('button', { name: '¡Atacar!' })).not.toBeDisabled()

    act(() => {
      useMetaStore.setState({ missionEnergy: { current: 0, max: 100 } })
    })

    expect(screen.getByRole('button', { name: '¡Atacar!' })).toBeDisabled()
  })
})

describe('LevelSelectScreen — banner de evento (specs/014-banner-evento-especial / specs/023 FR-008)', () => {
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
      mapPosition: { x: 90, y: 12 },
    },
  }

  it('un banner activo aparece como nodo distinguido, fuera de la cadena de líneas de desbloqueo', () => {
    mockEventBanners.push(activeBanner)
    render(<LevelSelectScreen onNavigate={vi.fn()} />)

    const eventNode = screen.getByRole('button', { name: 'Fase Especial de Prueba' })
    expect(eventNode).toHaveClass('stage-node--event')
    expect(eventNode).not.toBeDisabled()
  })

  it('un banner fuera de ventana horaria no se muestra', () => {
    mockEventBanners.push({
      ...activeBanner,
      timeWindows: [{ startMs: Date.now() - 1000 * 60 * 60 * 24 * 2, endMs: Date.now() - 1000 * 60 * 60 * 24 }],
    })
    render(<LevelSelectScreen onNavigate={vi.fn()} />)

    expect(screen.queryByRole('button', { name: 'Fase Especial de Prueba' })).not.toBeInTheDocument()
  })

  it('seleccionar el nodo de evento con energía suficiente navega a Battle con la specialStage, sin exigir desbloqueo secuencial', () => {
    mockEventBanners.push(activeBanner)
    useMetaStore.setState({ highestUnlockedLevelIndex: 0 }) // nada desbloqueado todavía
    const onNavigate = vi.fn()
    render(<LevelSelectScreen onNavigate={onNavigate} />)

    fireEvent.click(screen.getByRole('button', { name: 'Fase Especial de Prueba' }))
    fireEvent.click(screen.getByRole('button', { name: '¡Atacar!' }))

    expect(onNavigate).toHaveBeenCalledWith('Battle')
    expect(useGameStore.getState().levelId).toBe('test-banner-stage')
  })

  it('sin energía de misión suficiente, "¡Atacar!" del nodo de evento está deshabilitado y no navega', () => {
    mockEventBanners.push(activeBanner)
    useMetaStore.setState({ missionEnergy: { current: 5, max: 100 } })
    const onNavigate = vi.fn()
    render(<LevelSelectScreen onNavigate={onNavigate} />)

    fireEvent.click(screen.getByRole('button', { name: 'Fase Especial de Prueba' }))
    const attackButton = screen.getByRole('button', { name: '¡Atacar!' })
    expect(attackButton).toBeDisabled()

    fireEvent.click(attackButton)

    expect(onNavigate).not.toHaveBeenCalled()
    expect(useGameStore.getState().levelId).toBeNull()
  })
})
