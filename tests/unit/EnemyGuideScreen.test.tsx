import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { EnemyGuideScreen } from '../../src/screens/EnemyGuideScreen'
import { CATS } from '../../src/data/cats'
import { useMetaStore } from '../../src/state/useMetaStore'

const noop = () => {}
const cat = CATS[0]

beforeEach(() => {
  useMetaStore.setState({ encounteredEnemyCatIds: [] })
})

describe('EnemyGuideScreen (specs/018-bibliotecas-consulta US2)', () => {
  it('FR-003: con encounteredEnemyCatIds vacío, se renderiza vacía sin error', () => {
    render(<EnemyGuideScreen onNavigate={noop} />)

    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  it('FR-003: con entradas, muestra sus stats base de CATS', () => {
    useMetaStore.setState({ encounteredEnemyCatIds: [cat.id] })

    render(<EnemyGuideScreen onNavigate={noop} />)

    expect(screen.getByText(`${cat.name}: HP ${cat.hp}, Daño ${cat.damage}`)).toBeInTheDocument()
  })
})
