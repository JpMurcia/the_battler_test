import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TeamScreen } from '../../src/screens/TeamScreen'
import { useMetaStore } from '../../src/state/useMetaStore'

const noop = () => {}

beforeEach(() => {
  useMetaStore.setState({
    ownedCats: {
      'basic-cat': { level: 1, experienceInvested: 0 },
      'tank-cat': { level: 1, experienceInvested: 0 },
    },
    activeTeamCatIds: [],
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
