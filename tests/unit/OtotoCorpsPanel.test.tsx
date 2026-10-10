import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { OtotoCorpsPanel } from '../../src/screens/OtotoCorpsPanel'
import { useMetaStore } from '../../src/state/useMetaStore'

beforeEach(() => {
  useMetaStore.setState({ ototoConstruction: null, ototoBuildings: {}, gamatotoMaterials: 100 })
})

describe('OtotoCorpsPanel (specs/035-ototo-corps)', () => {
  it('sin construcción activa, muestra las 3 construcciones con selector (specs/041 añade la Cabeza de Cañón)', () => {
    render(<OtotoCorpsPanel />)

    expect(screen.getByText('Base')).toBeInTheDocument()
    expect(screen.getByText('Estilo')).toBeInTheDocument()
    expect(screen.getByText('Cabeza de Cañón')).toBeInTheDocument()
  })

  it('con materiales insuficientes, el botón de construir está deshabilitado', () => {
    useMetaStore.setState({ gamatotoMaterials: 0 })
    render(<OtotoCorpsPanel />)

    const row = screen.getByText('Base').closest('li')!
    expect(within(row).getByRole('button', { name: /Construir/ })).toBeDisabled()
  })

  it('elegir un rasgo y construir invoca startOtotoConstruction con esos argumentos', () => {
    render(<OtotoCorpsPanel />)

    const row = screen.getByText('Base').closest('li')!
    fireEvent.change(within(row).getByRole('combobox'), { target: { value: 'Floating' } })
    fireEvent.click(within(row).getByRole('button', { name: /Construir/ }))

    expect(useMetaStore.getState().ototoConstruction).toEqual(
      expect.objectContaining({ building: 'foundation', choice: 'Floating' }),
    )
  })

  it('con una construcción en curso, no se ofrece iniciar otra', () => {
    useMetaStore.setState({ ototoConstruction: { building: 'foundation', choice: 'Floating', startedAtMs: Date.now() } })
    render(<OtotoCorpsPanel />)

    expect(screen.queryByText('Estilo')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Construir/ })).not.toBeInTheDocument()
  })

  it('con una construcción completa, muestra Reclamar habilitado e invoca claimOtotoConstruction', () => {
    useMetaStore.setState({
      ototoConstruction: { building: 'foundation', choice: 'Floating', startedAtMs: Date.now() - 16 * 60_000 },
    })
    render(<OtotoCorpsPanel />)

    const claimButton = screen.getByRole('button', { name: /Reclamar/ })
    expect(claimButton).toBeEnabled()

    fireEvent.click(claimButton)

    expect(useMetaStore.getState().ototoBuildings.foundation).toBe('Floating')
  })
})

describe('OtotoCorpsPanel — Cabeza de Cañón (specs/041-cabezas-de-canon US1)', () => {
  const headRow = () => screen.getByText('Cabeza de Cañón').closest('li')!

  it('la fila de Cabeza de Cañón ofrece las cinco elecciones con etiquetas en español y el id como valor', () => {
    render(<OtotoCorpsPanel />)

    const options = within(headRow()).getAllByRole('option')

    expect(options.map((option) => option.textContent)).toEqual(['Retroceso', 'Debilitar', 'Congelar', 'Ralentizar', 'Maldecir'])
    expect(options.map((option) => (option as HTMLOptionElement).value)).toEqual(['Knockback', 'Weaken', 'Freeze', 'Slow', 'Curse'])
  })

  it('con materiales insuficientes, el botón de construir de la Cabeza de Cañón está deshabilitado', () => {
    useMetaStore.setState({ gamatotoMaterials: 0 })
    render(<OtotoCorpsPanel />)

    expect(within(headRow()).getByRole('button', { name: /Construir/ })).toBeDisabled()
  })

  it('elegir un efecto y construir invoca startOtotoConstruction("cannonHead", id)', () => {
    render(<OtotoCorpsPanel />)

    fireEvent.change(within(headRow()).getByRole('combobox'), { target: { value: 'Freeze' } })
    fireEvent.click(within(headRow()).getByRole('button', { name: /Construir/ }))

    expect(useMetaStore.getState().ototoConstruction).toEqual(expect.objectContaining({ building: 'cannonHead', choice: 'Freeze' }))
  })

  it('con una cabeza ya construida muestra el efecto actual en español', () => {
    useMetaStore.setState({ ototoBuildings: { cannonHead: 'Knockback' } })
    render(<OtotoCorpsPanel />)

    expect(within(headRow()).getByText(/actual: Retroceso/)).toBeInTheDocument()
  })

  it('con la Cabeza de Cañón en curso muestra su nombre y la elección en español, y no ofrece iniciar otra', () => {
    useMetaStore.setState({ ototoConstruction: { building: 'cannonHead', choice: 'Weaken', startedAtMs: Date.now() } })
    render(<OtotoCorpsPanel />)

    expect(screen.getByText('Cabeza de Cañón — Debilitar')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Construir/ })).not.toBeInTheDocument()
  })

  it('Base y Estilo se muestran con sus opciones y textos de siempre (FR-009)', () => {
    useMetaStore.setState({ ototoBuildings: { foundation: 'Floating', style: 'Freeze' } })
    render(<OtotoCorpsPanel />)

    const base = screen.getByText('Base').closest('li')!
    const style = screen.getByText('Estilo').closest('li')!
    expect(within(base).getByText(/actual: Floating/)).toBeInTheDocument()
    expect(within(style).getByText(/actual: Freeze/)).toBeInTheDocument()
    expect(within(base).getAllByRole('option').map((o) => o.textContent)).toContain('Floating')
    expect(within(style).getAllByRole('option').map((o) => o.textContent)).toEqual(['Weaken', 'Freeze', 'Slow', 'Curse'])
  })
})
