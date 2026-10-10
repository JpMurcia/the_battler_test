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

describe('EnemyGuideScreen — inmunidades (specs/040-dinero-extra-inmunidades FR-010)', () => {
  it('un enemigo enfrentado con inmunidades las lista junto a sus stats', () => {
    useMetaStore.setState({ encounteredEnemyCatIds: ['enemy-la-mascara'] })

    render(<EnemyGuideScreen onNavigate={noop} />)

    expect(screen.getByText('La Máscara: HP 99999, Daño 2000')).toBeInTheDocument()
    expect(screen.getByText('Inmune a: Golpe Letal, Killer, Retroceso')).toBeInTheDocument()
  })

  it('un enemigo sin inmunidades se muestra exactamente como antes, sin línea "Inmune a"', () => {
    useMetaStore.setState({ encounteredEnemyCatIds: [cat.id] })

    render(<EnemyGuideScreen onNavigate={noop} />)

    expect(screen.getByText(`${cat.name}: HP ${cat.hp}, Daño ${cat.damage}`)).toBeInTheDocument()
    expect(screen.queryByText(/Inmune a/)).not.toBeInTheDocument()
  })
})
