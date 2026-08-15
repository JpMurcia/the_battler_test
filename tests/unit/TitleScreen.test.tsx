import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TitleScreen } from '../../src/screens/TitleScreen'
import { useMetaStore } from '../../src/state/useMetaStore'

const noop = () => {}

beforeEach(() => {
  useMetaStore.setState({ completedLevelIds: [] })
})

describe('TitleScreen', () => {
  it('muestra "Jugar" con progreso vacío', () => {
    render(<TitleScreen onNavigate={noop} />)
    expect(screen.getByRole('button', { name: 'Jugar' })).toBeInTheDocument()
  })

  it('muestra "Continuar" con progreso existente', () => {
    useMetaStore.setState({ completedLevelIds: ['level-1'] })
    render(<TitleScreen onNavigate={noop} />)
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeInTheDocument()
  })
})
