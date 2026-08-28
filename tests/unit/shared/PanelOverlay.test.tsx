import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PanelOverlay } from '../../../src/screens/shared/PanelOverlay'

describe('PanelOverlay', () => {
  it('mueve el foco dentro del panel al montar', () => {
    render(
      <PanelOverlay labelledBy="Ajustes" onClose={vi.fn()}>
        <button>Primero</button>
        <button>Segundo</button>
      </PanelOverlay>,
    )

    expect(screen.getByRole('dialog', { name: 'Ajustes' })).toHaveFocus()
  })

  it('Tab nunca saca el foco del panel (ciclo cerrado)', () => {
    render(
      <PanelOverlay labelledBy="Ajustes" onClose={vi.fn()}>
        <button>Primero</button>
        <button>Segundo</button>
      </PanelOverlay>,
    )

    const dialog = screen.getByRole('dialog', { name: 'Ajustes' })
    const close = screen.getByRole('button', { name: 'Cerrar Ajustes' })
    const first = screen.getByRole('button', { name: 'Primero' })
    const second = screen.getByRole('button', { name: 'Segundo' })

    second.focus()
    fireEvent.keyDown(dialog, { key: 'Tab' })
    expect(close).toHaveFocus()

    close.focus()
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true })
    expect(second).toHaveFocus()
    void first
  })

  it('pulsar el control de cierre invoca onClose', () => {
    const onClose = vi.fn()
    render(
      <PanelOverlay labelledBy="Ajustes" onClose={onClose}>
        <button>Contenido</button>
      </PanelOverlay>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar Ajustes' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('Escape invoca onClose', () => {
    const onClose = vi.fn()
    render(
      <PanelOverlay labelledBy="Ajustes" onClose={onClose}>
        <button>Contenido</button>
      </PanelOverlay>,
    )

    fireEvent.keyDown(screen.getByRole('dialog', { name: 'Ajustes' }), { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('al desmontar, devuelve el foco al elemento activo antes de abrir', () => {
    const trigger = document.createElement('button')
    trigger.textContent = 'Abrir'
    document.body.appendChild(trigger)
    trigger.focus()
    expect(trigger).toHaveFocus()

    const { unmount } = render(
      <PanelOverlay labelledBy="Ajustes" onClose={vi.fn()}>
        <button>Contenido</button>
      </PanelOverlay>,
    )
    expect(trigger).not.toHaveFocus()

    unmount()
    expect(trigger).toHaveFocus()
    document.body.removeChild(trigger)
  })
})
