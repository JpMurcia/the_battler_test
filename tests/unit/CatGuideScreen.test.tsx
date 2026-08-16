import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// specs/010-evolucion-de-gatos: gato de prueba con `evolutions` declarado, igual patrón que otros tests de esta feature.
vi.mock('../../src/data/cats', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/data/cats')>()
  return {
    ...actual,
    CATS: [
      ...actual.CATS,
      {
        id: 'evo-test-cat',
        name: 'Gato de Prueba Evolutivo',
        cost: 10,
        cooldownSeconds: 2,
        hp: 50,
        damage: 5,
        speed: 20,
        width: 16,
        attackIntervalSeconds: 1,
        attackType: 'Single',
        attackRange: 0,
        classification: 'Traitless',
        evolutions: {
          second: { requiredLevel: 5, hpMultiplier: 1.5, damageMultiplier: 1.2 },
          true: { requiredLevel: 10, hpMultiplier: 2, damageMultiplier: 2, requiredItemCount: 3 },
        },
      },
    ],
  }
})

const { CatGuideScreen } = await import('../../src/screens/CatGuideScreen')
const { useMetaStore } = await import('../../src/state/useMetaStore')

const noop = () => {}

beforeEach(() => {
  useMetaStore.setState({ ownedCats: {} })
})

describe('CatGuideScreen (specs/018-bibliotecas-consulta US1)', () => {
  it('FR-002: muestra los stats efectivos según nivel/evolución vigentes, no los base de CATS', () => {
    useMetaStore.setState({
      ownedCats: { 'evo-test-cat': { level: 5, experienceInvested: 0, evolutionStage: 'Second' } },
    })

    render(<CatGuideScreen onNavigate={noop} />)

    // hp base 50 * 1.5 = 75; damage base 5 * 1.2 = 6
    expect(screen.getByText(/Gato de Prueba Evolutivo — Nivel 5, Forma Second: HP 75, Daño 6/)).toBeInTheDocument()
  })

  it('con solo el gato inicial, muestra únicamente esa unidad sin error', () => {
    useMetaStore.setState({
      ownedCats: { 'basic-cat': { level: 1, experienceInvested: 0, evolutionStage: 'Base' } },
    })

    render(<CatGuideScreen onNavigate={noop} />)

    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(screen.getByText(/Gato Básico/)).toBeInTheDocument()
  })
})
