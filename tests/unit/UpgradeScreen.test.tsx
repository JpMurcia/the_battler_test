import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { UpgradeScreen } from '../../src/screens/UpgradeScreen'
import { useMetaStore } from '../../src/state/useMetaStore'

const noop = () => {}

beforeEach(() => {
  useMetaStore.setState({
    currency: 0,
    ownedCats: {},
    claimedRankThresholds: [],
    battleItemInventory: {},
    baseUpgrades: {},
  })
})

describe('UpgradeScreen', () => {
  it('muestra el nivel de personaje agregado y la moneda disponible', () => {
    useMetaStore.setState({
      currency: 250,
      ownedCats: {
        'basic-cat': { level: 3, experienceInvested: 0, evolutionStage: 'Base' },
        'tank-cat': { level: 2, experienceInvested: 0, evolutionStage: 'Base' },
      },
    })

    render(<UpgradeScreen onNavigate={noop} />)

    expect(screen.getByText('Nivel de personaje: 5')).toBeInTheDocument()
    expect(screen.getByText('Moneda: 250')).toBeInTheDocument()
  })

  it('click en Mejorar con moneda suficiente sube el nivel mostrado', () => {
    useMetaStore.setState({
      currency: 100,
      ownedCats: { 'basic-cat': { level: 1, experienceInvested: 0, evolutionStage: 'Base' } },
    })

    render(<UpgradeScreen onNavigate={noop} />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Mejorar' })[0])

    expect(useMetaStore.getState().ownedCats['basic-cat'].level).toBe(2)
    expect(screen.getByText('Nivel de personaje: 2')).toBeInTheDocument()
  })

  it('el botón Mejorar está deshabilitado sin moneda suficiente y no dispara upgradeCat', () => {
    useMetaStore.setState({
      currency: 0,
      ownedCats: { 'basic-cat': { level: 1, experienceInvested: 0, evolutionStage: 'Base' } },
    })

    render(<UpgradeScreen onNavigate={noop} />)
    const button = screen.getAllByRole('button', { name: 'Mejorar' })[0]

    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(useMetaStore.getState().ownedCats['basic-cat'].level).toBe(1)
  })
})

describe('UpgradeScreen — nivel "+" (specs/024-sistema-gacha)', () => {
  it('muestra "Nivel N+M" para un gato con plusLevel > 0, y "Nivel N" sin plusLevel', () => {
    useMetaStore.setState({
      ownedCats: {
        'basic-cat': { level: 3, experienceInvested: 0, evolutionStage: 'Base', plusLevel: 2 },
        'tank-cat': { level: 1, experienceInvested: 0, evolutionStage: 'Base' },
      },
    })

    render(<UpgradeScreen onNavigate={noop} />)

    expect(screen.getByText(/Gato Básico — Nivel 3\+2/)).toBeInTheDocument()
    expect(screen.getByText(/Gato Tanque — Nivel 1$/)).toBeInTheDocument()
  })
})

describe('UpgradeScreen — Rango de Usuario (specs/019-rango-de-usuario)', () => {
  it('FR-001/002: el Rango de Usuario mostrado coincide con la suma de niveles de ownedCats', () => {
    useMetaStore.setState({
      ownedCats: {
        'basic-cat': { level: 3, experienceInvested: 0, evolutionStage: 'Base' },
        'tank-cat': { level: 2, experienceInvested: 0, evolutionStage: 'Base' },
      },
    })

    render(<UpgradeScreen onNavigate={noop} />)

    expect(screen.getByText('Rango de Usuario: 5')).toBeInTheDocument()
  })

  it('un jugador nuevo con solo el gato inicial no produce error', () => {
    useMetaStore.setState({
      ownedCats: { 'basic-cat': { level: 1, experienceInvested: 0, evolutionStage: 'Base' } },
    })

    render(<UpgradeScreen onNavigate={noop} />)

    expect(screen.getByText('Rango de Usuario: 1')).toBeInTheDocument()
  })

  it('FR-004: reclamar un umbral alcanzado suma la recompensa al inventario y deja de mostrar el botón para ese umbral', () => {
    useMetaStore.setState({
      ownedCats: { 'basic-cat': { level: 3, experienceInvested: 0, evolutionStage: 'Base' } }, // alcanza el umbral de rango 3
    })

    render(<UpgradeScreen onNavigate={noop} />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Reclamar' })[0]) // único alcanzado, rango 3

    expect(useMetaStore.getState().battleItemInventory['extra-energy']).toBe(1)
    expect(useMetaStore.getState().claimedRankThresholds).toContain(3)
    expect(screen.getByText(/Rango 3:.*\(Reclamado\)/)).toBeInTheDocument()
  })

  it('FR-005: el botón Reclamar está deshabilitado para un umbral no alcanzado', () => {
    useMetaStore.setState({
      ownedCats: { 'basic-cat': { level: 1, experienceInvested: 0, evolutionStage: 'Base' } },
    })

    render(<UpgradeScreen onNavigate={noop} />)

    for (const button of screen.getAllByRole('button', { name: 'Reclamar' })) {
      expect(button).toBeDisabled()
    }
  })
})

describe('UpgradeScreen — pestaña Mejoras de Base (specs/031-mejoras-de-base US1)', () => {
  it('por defecto muestra la pestaña Unidades, sin las 7 mejoras de base', () => {
    render(<UpgradeScreen onNavigate={noop} />)

    expect(screen.queryByText('Potencia de Cañón')).not.toBeInTheDocument()
  })

  it('cambiar a la pestaña Mejoras de Base lista las 7 mejoras con nivel y costo', () => {
    render(<UpgradeScreen onNavigate={noop} />)

    fireEvent.click(screen.getByRole('button', { name: 'Mejoras de Base' }))

    expect(screen.getByText('Potencia de Cañón')).toBeInTheDocument()
    expect(screen.getByText('Alcance de Cañón')).toBeInTheDocument()
    expect(screen.getByText('Recarga de Cañón')).toBeInTheDocument()
    expect(screen.getByText('Defensa de Base')).toBeInTheDocument()
    expect(screen.getByText('Investigación')).toBeInTheDocument()
    expect(screen.getByText('Contabilidad')).toBeInTheDocument()
    expect(screen.getByText('Energía')).toBeInTheDocument()
  })

  it('con moneda suficiente, pulsar Mejorar sube el nivel de esa mejora', () => {
    useMetaStore.setState({ currency: 1000 })
    render(<UpgradeScreen onNavigate={noop} />)
    fireEvent.click(screen.getByRole('button', { name: 'Mejoras de Base' }))

    const row = screen.getByText('Potencia de Cañón').closest('li')!
    fireEvent.click(within(row).getByRole('button', { name: 'Mejorar' }))

    expect(useMetaStore.getState().baseUpgrades.cannonPower).toBe(1)
  })

  it('sin moneda suficiente, el botón de esa mejora está deshabilitado', () => {
    useMetaStore.setState({ currency: 0 })
    render(<UpgradeScreen onNavigate={noop} />)
    fireEvent.click(screen.getByRole('button', { name: 'Mejoras de Base' }))

    const row = screen.getByText('Potencia de Cañón').closest('li')!
    expect(within(row).getByRole('button', { name: 'Mejorar' })).toBeDisabled()
  })

  it('en el tope de nivel, el botón está deshabilitado', () => {
    useMetaStore.setState({ currency: 1_000_000, baseUpgrades: { cannonPower: 10 } })
    render(<UpgradeScreen onNavigate={noop} />)
    fireEvent.click(screen.getByRole('button', { name: 'Mejoras de Base' }))

    const row = screen.getByText('Potencia de Cañón').closest('li')!
    expect(within(row).getByRole('button', { name: 'Mejorar' })).toBeDisabled()
  })

  it('subir una mejora de base y volver a Unidades no altera el flujo de mejora de unidades', () => {
    useMetaStore.setState({
      currency: 1000,
      ownedCats: { 'basic-cat': { level: 1, experienceInvested: 0, evolutionStage: 'Base' } },
    })
    render(<UpgradeScreen onNavigate={noop} />)
    fireEvent.click(screen.getByRole('button', { name: 'Mejoras de Base' }))
    fireEvent.click(within(screen.getByText('Potencia de Cañón').closest('li')!).getByRole('button', { name: 'Mejorar' }))

    fireEvent.click(screen.getByRole('button', { name: 'Unidades' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Mejorar' })[0])

    expect(useMetaStore.getState().ownedCats['basic-cat'].level).toBe(2)
  })
})
