import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { HubScreen } from '../../src/screens/HubScreen'
import { useMetaStore } from '../../src/state/useMetaStore'

const BASE_STATE = {
  currency: 500,
  missionEnergy: { current: 8, max: 10 },
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
