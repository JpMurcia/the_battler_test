import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { GamatotoPanel } from '../../src/screens/GamatotoPanel'
import { useMetaStore } from '../../src/state/useMetaStore'

beforeEach(() => {
  useMetaStore.setState({ gamatotoExpedition: null, gamatotoMaterials: 0 })
})

describe('GamatotoPanel (specs/034-gamatoto)', () => {
  it('sin expedición activa, muestra las 3 opciones de duración', () => {
    render(<GamatotoPanel />)

    expect(screen.getByText('Expedición corta')).toBeInTheDocument()
    expect(screen.getByText('Expedición media')).toBeInTheDocument()
    expect(screen.getByText('Expedición larga')).toBeInTheDocument()
  })

  it('elegir una duración invoca startGamatotoExpedition y pasa a mostrar el countdown', () => {
    render(<GamatotoPanel />)

    fireEvent.click(screen.getByRole('button', { name: /Enviar Expedición corta/ }))

    expect(useMetaStore.getState().gamatotoExpedition?.optionId).toBe('gamatoto-corta')
    expect(screen.queryByText('Expedición media')).not.toBeInTheDocument()
  })

  it('con una expedición en curso (no lista), no muestra las opciones de envío ni el botón Reclamar', () => {
    useMetaStore.setState({ gamatotoExpedition: { optionId: 'gamatoto-corta', startedAtMs: Date.now() } })
    render(<GamatotoPanel />)

    expect(screen.queryByText('Expedición media')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Reclamar/ })).not.toBeInTheDocument()
  })

  it('con una expedición completa, muestra un botón Reclamar habilitado', () => {
    useMetaStore.setState({ gamatotoExpedition: { optionId: 'gamatoto-corta', startedAtMs: Date.now() - 6 * 60_000 } })
    render(<GamatotoPanel />)

    expect(screen.getByRole('button', { name: /Reclamar/ })).toBeEnabled()
  })

  it('pulsar Reclamar invoca claimGamatotoExpedition, suma materiales, y vuelve a ofrecer las 3 opciones', () => {
    useMetaStore.setState({ gamatotoExpedition: { optionId: 'gamatoto-corta', startedAtMs: Date.now() - 6 * 60_000 }, gamatotoMaterials: 0 })
    render(<GamatotoPanel />)

    fireEvent.click(screen.getByRole('button', { name: /Reclamar/ }))

    expect(useMetaStore.getState().gamatotoMaterials).toBe(5)
    expect(useMetaStore.getState().gamatotoExpedition).toBeNull()
    expect(screen.getByText('Expedición corta')).toBeInTheDocument()
    expect(screen.getByText('Expedición media')).toBeInTheDocument()
  })
})
