import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { OtotoCorpsPanel } from '../../src/screens/OtotoCorpsPanel'
import { useMetaStore } from '../../src/state/useMetaStore'

beforeEach(() => {
  useMetaStore.setState({ ototoConstruction: null, ototoBuildings: {}, gamatotoMaterials: 100 })
})

describe('OtotoCorpsPanel (specs/035-ototo-corps)', () => {
  it('sin construcción activa, muestra las 2 construcciones con selector', () => {
    render(<OtotoCorpsPanel />)

    expect(screen.getByText('Base')).toBeInTheDocument()
    expect(screen.getByText('Estilo')).toBeInTheDocument()
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
