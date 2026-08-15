import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { SettingsScreen } from '../../src/screens/SettingsScreen'
import { useMetaStore } from '../../src/state/useMetaStore'

const noop = () => {}

beforeEach(() => {
  useMetaStore.setState({ settings: { musicVolume: 1, sfxVolume: 1, language: 'es' } })
})

describe('SettingsScreen', () => {
  it('no persiste cambios si se sale sin confirmar', () => {
    render(<SettingsScreen onNavigate={noop} />)

    fireEvent.change(screen.getByLabelText('Idioma'), { target: { value: 'en' } })
    fireEvent.click(screen.getByRole('button', { name: 'Volver' }))

    expect(useMetaStore.getState().settings.language).toBe('es')
  })

  it('persiste cambios al confirmar con Aplicar/Guardar', () => {
    render(<SettingsScreen onNavigate={noop} />)

    fireEvent.change(screen.getByLabelText('Idioma'), { target: { value: 'en' } })
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar/Guardar' }))

    expect(useMetaStore.getState().settings.language).toBe('en')
  })
})
