import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// specs/013-escalado-capitulos-sets-tesoros: set de prueba dedicado, decoupled de los valores de producción.
vi.mock('../../src/data/treasureSets', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/data/treasureSets')>()
  return {
    ...actual,
    TREASURE_SETS: [
      {
        id: 'test-set',
        name: 'Set de Prueba',
        treasureIds: ['treasure-a', 'treasure-b'],
        passiveBonus: { type: 'EnergyRegenMultiplier', value: 1.5 },
      },
    ],
  }
})

const { TreasureMenuScreen } = await import('../../src/screens/TreasureMenuScreen')
const { useMetaStore } = await import('../../src/state/useMetaStore')

const noop = () => {}

beforeEach(() => {
  useMetaStore.setState({ obtainedTreasureIds: [], grantedTreasureSetIds: [] })
})

describe('TreasureMenuScreen (specs/018-bibliotecas-consulta US3)', () => {
  it('FR-006: un set con tesoros parciales muestra el conteo correcto', () => {
    useMetaStore.setState({ obtainedTreasureIds: ['treasure-a'] })

    render(<TreasureMenuScreen onNavigate={noop} />)

    expect(screen.getByText('Set de Prueba: 1/2')).toBeInTheDocument()
  })

  it('un set completo muestra la bonificación como otorgada', () => {
    useMetaStore.setState({
      obtainedTreasureIds: ['treasure-a', 'treasure-b'],
      grantedTreasureSetIds: ['test-set'],
    })

    render(<TreasureMenuScreen onNavigate={noop} />)

    expect(screen.getByText('Set de Prueba: 2/2 (Bonificación otorgada)')).toBeInTheDocument()
  })

  it('un set sin ningún tesoro obtenido muestra 0/N sin error', () => {
    render(<TreasureMenuScreen onNavigate={noop} />)

    expect(screen.getByText('Set de Prueba: 0/2')).toBeInTheDocument()
  })
})
