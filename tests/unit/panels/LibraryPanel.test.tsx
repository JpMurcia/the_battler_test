import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LibraryPanel } from '../../../src/screens/panels/LibraryPanel'
import { useMetaStore } from '../../../src/state/useMetaStore'

beforeEach(() => {
  useMetaStore.setState({
    ownedCats: { 'basic-cat': { level: 1, experienceInvested: 0, evolutionStage: 'Base' } },
    encounteredEnemyCatIds: ['tank-cat'],
  })
})

describe('LibraryPanel (specs/026-navegacion-hub-mockup, research.md Decisión 3)', () => {
  it('arranca en la tab "Cat Guide" mostrando el contenido de CatGuideScreen', () => {
    render(<LibraryPanel onClose={vi.fn()} />)

    expect(screen.getByText(/Gato Básico/)).toBeInTheDocument()
  })

  it('alternar a "Enemy Guide" muestra el contenido de EnemyGuideScreen', () => {
    render(<LibraryPanel onClose={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Enemy Guide' }))

    expect(screen.getByText(/Gato Tanque/)).toBeInTheDocument()
    expect(screen.queryByText(/Gato Básico/)).not.toBeInTheDocument()
  })
})
