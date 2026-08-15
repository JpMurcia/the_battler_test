import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { UpgradeScreen } from '../../src/screens/UpgradeScreen'
import { useMetaStore } from '../../src/state/useMetaStore'

const noop = () => {}

beforeEach(() => {
  useMetaStore.setState({
    currency: 0,
    ownedCats: {},
  })
})

describe('UpgradeScreen', () => {
  it('muestra el nivel de personaje agregado y la moneda disponible', () => {
    useMetaStore.setState({
      currency: 250,
      ownedCats: {
        'basic-cat': { level: 3, experienceInvested: 0 },
        'tank-cat': { level: 2, experienceInvested: 0 },
      },
    })

    render(<UpgradeScreen onNavigate={noop} />)

    expect(screen.getByText('Nivel de personaje: 5')).toBeInTheDocument()
    expect(screen.getByText('Moneda: 250')).toBeInTheDocument()
  })

  it('click en Mejorar con moneda suficiente sube el nivel mostrado', () => {
    useMetaStore.setState({
      currency: 100,
      ownedCats: { 'basic-cat': { level: 1, experienceInvested: 0 } },
    })

    render(<UpgradeScreen onNavigate={noop} />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Mejorar' })[0])

    expect(useMetaStore.getState().ownedCats['basic-cat'].level).toBe(2)
    expect(screen.getByText('Nivel de personaje: 2')).toBeInTheDocument()
  })

  it('el botón Mejorar está deshabilitado sin moneda suficiente y no dispara upgradeCat', () => {
    useMetaStore.setState({
      currency: 0,
      ownedCats: { 'basic-cat': { level: 1, experienceInvested: 0 } },
    })

    render(<UpgradeScreen onNavigate={noop} />)
    const button = screen.getAllByRole('button', { name: 'Mejorar' })[0]

    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(useMetaStore.getState().ownedCats['basic-cat'].level).toBe(1)
  })
})
