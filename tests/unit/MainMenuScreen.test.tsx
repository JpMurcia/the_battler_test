import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MainMenuScreen } from '../../src/screens/MainMenuScreen'

describe('MainMenuScreen', () => {
  it('navega a Settings al presionar Configuración', () => {
    const onNavigate = vi.fn()
    render(<MainMenuScreen onNavigate={onNavigate} />)

    fireEvent.click(screen.getByRole('button', { name: 'Configuración' }))

    expect(onNavigate).toHaveBeenCalledWith('Settings')
  })
})
