import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TeamScreen } from '../../src/screens/TeamScreen'
import { useMetaStore } from '../../src/state/useMetaStore'

const noop = () => {}

beforeEach(() => {
  useMetaStore.setState({
    ownedCats: {
      'basic-cat': { level: 1, experienceInvested: 0, evolutionStage: 'Base' },
      'tank-cat': { level: 1, experienceInvested: 0, evolutionStage: 'Base' },
    },
    activeTeamCatIds: [],
    battleItemInventory: {},
    selectedBattleItemIds: [],
  })
})

describe('TeamScreen', () => {
  it('deseleccionar todos deshabilita Confirmar equipo', () => {
    render(<TeamScreen onNavigate={noop} />)

    fireEvent.click(screen.getByLabelText('Gato Básico'))
    fireEvent.click(screen.getByLabelText('Gato Tanque'))

    expect(screen.getByRole('button', { name: 'Confirmar equipo' })).toBeDisabled()
  })

  it('confirmar con selección no vacía llama setActiveTeam', () => {
    render(<TeamScreen onNavigate={noop} />)

    fireEvent.click(screen.getByLabelText('Gato Tanque'))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar equipo' }))

    expect(useMetaStore.getState().activeTeamCatIds).toEqual(['basic-cat'])
  })
})

describe('TeamScreen — objetos de batalla (specs/017-objetos-de-batalla US1)', () => {
  it('con un objeto en inventario, seleccionarlo lo marca elegido', () => {
    useMetaStore.setState({ battleItemInventory: { 'speed-boost': 1 } })
    render(<TeamScreen onNavigate={noop} />)

    const checkbox = screen.getByLabelText(/Aceleración de Velocidad/)
    expect(checkbox).not.toBeChecked()

    fireEvent.click(checkbox)

    expect(checkbox).toBeChecked()
    expect(useMetaStore.getState().selectedBattleItemIds).toEqual(['speed-boost'])
  })

  it('sin inventario, el objeto se renderiza deshabilitado, sin error', () => {
    render(<TeamScreen onNavigate={noop} />)

    expect(screen.getByLabelText(/Aceleración de Velocidad/)).toBeDisabled()
  })

  it('deseleccionar un objeto ya elegido lo libera', () => {
    useMetaStore.setState({ battleItemInventory: { 'speed-boost': 1 }, selectedBattleItemIds: ['speed-boost'] })
    render(<TeamScreen onNavigate={noop} />)

    fireEvent.click(screen.getByLabelText(/Aceleración de Velocidad/))

    expect(useMetaStore.getState().selectedBattleItemIds).toEqual([])
  })
})
