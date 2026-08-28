import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HubScreen } from '../../src/screens/HubScreen'
import { useMetaStore } from '../../src/state/useMetaStore'

const BASE_STATE = {
  currency: 500,
  missionEnergy: { current: 8, max: 10, regenPerSecond: 0, lastUpdatedAt: 0 },
  ownedCats: {
    'basic-cat': { level: 3, experienceInvested: 0, evolutionStage: 'Base' as const, plusLevel: 0 },
  },
}

describe('HubScreen', () => {
  it('muestra rango, energía de misión y moneda simultáneamente', () => {
    useMetaStore.setState(BASE_STATE)
    render(<HubScreen onNavigate={vi.fn()} />)

    expect(screen.getByText(/Rango 3/)).toBeInTheDocument()
    expect(screen.getByText(/Energía de misión: 8\/10/)).toBeInTheDocument()
    expect(screen.getByText(/Moneda: 500/)).toBeInTheDocument()
  })

  it('el dock muestra controles reconocibles para Biblioteca, Cápsula de Gatos y Almacén', () => {
    useMetaStore.setState(BASE_STATE)
    render(<HubScreen onNavigate={vi.fn()} />)

    expect(screen.getByRole('button', { name: /Biblioteca/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cápsula de Gatos/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Almacén/ })).toBeInTheDocument()
  })

  it('"¡Batalla!" invoca onNavigate(\'LevelSelect\')', () => {
    useMetaStore.setState(BASE_STATE)
    const onNavigate = vi.fn()
    render(<HubScreen onNavigate={onNavigate} />)

    fireEvent.click(screen.getByRole('button', { name: /¡Batalla!/ }))

    expect(onNavigate).toHaveBeenCalledWith('LevelSelect')
  })

  it('"Configuración" abre Ajustes como panel superpuesto sin ocultar el Hub, y cerrarlo no invoca onNavigate', () => {
    useMetaStore.setState(BASE_STATE)
    const onNavigate = vi.fn()
    render(<HubScreen onNavigate={onNavigate} />)

    fireEvent.click(screen.getByRole('button', { name: 'Configuración' }))

    expect(screen.getByRole('heading', { name: 'Configuración' })).toBeInTheDocument()
    // El Hub sigue en el documento detrás del panel (FR-004).
    expect(screen.getByText(/Rango 3/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Cerrar Configuración/ }))

    expect(screen.queryByRole('heading', { name: 'Configuración' })).not.toBeInTheDocument()
    expect(onNavigate).not.toHaveBeenCalled()
  })

  it('"Perfil de Jugador" abre el panel, y abrir Ajustes desde ahí vuelve al Perfil al cerrarse (FR-013)', () => {
    useMetaStore.setState(BASE_STATE)
    render(<HubScreen onNavigate={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Perfil de Jugador' }))
    expect(screen.getByRole('heading', { name: 'Perfil de Jugador' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Ajustes/ }))
    expect(screen.getByRole('heading', { name: 'Configuración' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Cerrar Configuración/ }))
    expect(screen.getByRole('heading', { name: 'Perfil de Jugador' })).toBeInTheDocument()
  })

  it('muestra un indicador cuando hay novedades no leídas, y desaparece al abrir el Buzón (FR-009)', () => {
    useMetaStore.setState({ ...BASE_STATE, readNewsIds: [] })
    render(<HubScreen onNavigate={vi.fn()} />)

    const newsButton = screen.getByRole('button', { name: /Buzón de Noticias/ })
    expect(newsButton.querySelector('.hub-dock__badge')).not.toBeNull()

    fireEvent.click(newsButton)
    expect(screen.getByRole('heading', { name: 'Buzón de Noticias' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Cerrar Buzón de Noticias/ }))
    expect(screen.getByRole('button', { name: /Buzón de Noticias/ }).querySelector('.hub-dock__badge')).toBeNull()
  })
})

describe('HubScreen — Misiones (specs/033-misiones-catnip-challenges)', () => {
  it('el botón Misiones abre el panel de misiones', () => {
    useMetaStore.setState({ ...BASE_STATE, missionProgress: {}, claimedMissionIds: [] })
    render(<HubScreen onNavigate={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /Misiones/ }))

    expect(screen.getByRole('heading', { name: 'Misiones' })).toBeInTheDocument()
  })

  it('sin misiones completadas sin reclamar, no muestra badge', () => {
    useMetaStore.setState({ ...BASE_STATE, missionProgress: {}, claimedMissionIds: [] })
    render(<HubScreen onNavigate={vi.fn()} />)

    expect(screen.getByRole('button', { name: /Misiones/ }).querySelector('.hub-dock__badge')).toBeNull()
  })

  it('con al menos 1 misión completada y sin reclamar, muestra el badge con la cantidad', () => {
    useMetaStore.setState({ ...BASE_STATE, missionProgress: { levelsCompleted: 1 }, claimedMissionIds: [] })
    render(<HubScreen onNavigate={vi.fn()} />)

    const badge = screen.getByRole('button', { name: /Misiones/ }).querySelector('.hub-dock__badge')
    expect(badge).not.toBeNull()
    expect(badge!.textContent).toBe('1')
  })
})

describe('HubScreen — Gamatoto (specs/034-gamatoto)', () => {
  it('el botón Gamatoto abre el panel de Gamatoto', () => {
    useMetaStore.setState({ ...BASE_STATE, gamatotoExpedition: null, gamatotoMaterials: 0 })
    render(<HubScreen onNavigate={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /Gamatoto/ }))

    expect(screen.getByRole('heading', { name: 'Gamatoto' })).toBeInTheDocument()
  })

  it('sin expedición, no muestra badge', () => {
    useMetaStore.setState({ ...BASE_STATE, gamatotoExpedition: null, gamatotoMaterials: 0 })
    render(<HubScreen onNavigate={vi.fn()} />)

    expect(screen.getByRole('button', { name: /Gamatoto/ }).querySelector('.hub-dock__badge')).toBeNull()
  })

  it('con una expedición todavía en curso, no muestra badge', () => {
    useMetaStore.setState({ ...BASE_STATE, gamatotoExpedition: { optionId: 'gamatoto-larga', startedAtMs: Date.now() }, gamatotoMaterials: 0 })
    render(<HubScreen onNavigate={vi.fn()} />)

    expect(screen.getByRole('button', { name: /Gamatoto/ }).querySelector('.hub-dock__badge')).toBeNull()
  })

  it('con una expedición completa sin reclamar, muestra badge', () => {
    useMetaStore.setState({
      ...BASE_STATE,
      gamatotoExpedition: { optionId: 'gamatoto-corta', startedAtMs: Date.now() - 6 * 60_000 },
      gamatotoMaterials: 0,
    })
    render(<HubScreen onNavigate={vi.fn()} />)

    expect(screen.getByRole('button', { name: /Gamatoto/ }).querySelector('.hub-dock__badge')).not.toBeNull()
  })
})

describe('HubScreen — temporizador de regeneración de energía (specs/029-pulido-batalla-hud US4)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('con energía por debajo del máximo, muestra un countdown hasta la próxima unidad', () => {
    const now = Date.now()
    useMetaStore.setState({
      ...BASE_STATE,
      missionEnergy: { current: 5, max: 10, regenPerSecond: 0.1, lastUpdatedAt: now },
    })

    render(<HubScreen onNavigate={vi.fn()} />)

    // (6 - 5) / 0.1 = 10s hasta el próximo punto entero.
    expect(screen.getByText(/0:10/)).toBeInTheDocument()
  })

  it('el countdown avanza con el tiempo real (setInterval local)', () => {
    const now = Date.now()
    useMetaStore.setState({
      ...BASE_STATE,
      missionEnergy: { current: 5, max: 10, regenPerSecond: 0.1, lastUpdatedAt: now },
    })

    render(<HubScreen onNavigate={vi.fn()} />)
    expect(screen.getByText(/0:10/)).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(4000)
    })

    // Tras 4s reales, quedan (6 - 5.4) / 0.1 = 6s.
    expect(screen.getByText(/0:06/)).toBeInTheDocument()
  })

  it('con energía ya al máximo, no muestra ningún temporizador', () => {
    useMetaStore.setState({
      ...BASE_STATE,
      missionEnergy: { current: 10, max: 10, regenPerSecond: 0.1, lastUpdatedAt: Date.now() },
    })

    render(<HubScreen onNavigate={vi.fn()} />)

    expect(screen.queryByTestId('energy-regen-timer')).not.toBeInTheDocument()
  })
})
