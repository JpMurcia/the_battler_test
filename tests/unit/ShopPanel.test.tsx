import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// specs/037-tienda (US2): gato de prueba con evolutions.true.requiredItemCount declarado — el catálogo de
// producción (CATS) no exige ítems para ningún gato (requiredItemCount ausente = 0 en los 12 con Forma
// Verdadera), así que este mecanismo se prueba con un fixture dedicado, mismo patrón que useMetaStore.test.ts.
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

const { ShopPanel } = await import('../../src/screens/ShopPanel')
const { useMetaStore } = await import('../../src/state/useMetaStore')

beforeEach(() => {
  useMetaStore.setState({ currency: 1000, battleItemInventory: {}, ownedCats: {}, evolutionItems: {} })
})

describe('ShopPanel — Objetos de Batalla (specs/037-tienda US1)', () => {
  it('muestra cada Objeto de Batalla con su precio y cantidad en inventario', () => {
    render(<ShopPanel />)

    expect(screen.getByText('Aceleración de Velocidad')).toBeInTheDocument()
    expect(screen.getByText('Energía Extra')).toBeInTheDocument()
    expect(screen.getByText('Radar de Tesoro')).toBeInTheDocument()
  })

  it('pulsar Comprar invoca purchaseBattleItem con el id correcto', () => {
    render(<ShopPanel />)

    const row = screen.getByText('Aceleración de Velocidad').closest('li')!
    fireEvent.click(within(row).getByRole('button', { name: /Comprar/ }))

    expect(useMetaStore.getState().battleItemInventory['speed-boost']).toBe(1)
  })

  it('con moneda insuficiente, el botón de compra está deshabilitado', () => {
    useMetaStore.setState({ currency: 0 })
    render(<ShopPanel />)

    const row = screen.getByText('Aceleración de Velocidad').closest('li')!
    expect(within(row).getByRole('button', { name: /Comprar/ })).toBeDisabled()
  })
})

describe('ShopPanel — Ítems de Evolución (specs/037-tienda US2)', () => {
  beforeEach(() => {
    useMetaStore.setState({
      ownedCats: { 'evo-test-cat': { level: 1, experienceInvested: 0, evolutionStage: 'Base' } },
    })
  })

  it('lista solo gatos elegibles (Forma Verdadera definida, no alcanzada) con su progreso actual/requerido', () => {
    useMetaStore.setState({ evolutionItems: { 'evo-test-cat': 1 } })
    render(<ShopPanel />)

    expect(screen.getByText('Gato de Prueba Evolutivo')).toBeInTheDocument()
    expect(screen.getByText(/1\/3 ítems/)).toBeInTheDocument()
  })

  it('pulsar Comprar invoca purchaseEvolutionItem con el catId correcto', () => {
    render(<ShopPanel />)

    const row = screen.getByText('Gato de Prueba Evolutivo').closest('li')!
    fireEvent.click(within(row).getByRole('button', { name: /Comprar/ }))

    expect(useMetaStore.getState().evolutionItems['evo-test-cat']).toBe(1)
  })

  it('un gato ya en Forma Verdadera no aparece en la lista', () => {
    useMetaStore.setState({
      ownedCats: { 'evo-test-cat': { level: 1, experienceInvested: 0, evolutionStage: 'True' } },
    })
    render(<ShopPanel />)

    expect(screen.queryByText('Gato de Prueba Evolutivo')).not.toBeInTheDocument()
  })

  it('un gato sin Forma Verdadera definida no aparece en la lista', () => {
    useMetaStore.setState({
      ownedCats: { 'basic-cat': { level: 1, experienceInvested: 0, evolutionStage: 'Base' } },
    })
    render(<ShopPanel />)

    expect(screen.queryByText('Gato Básico')).not.toBeInTheDocument()
  })

  it('al alcanzar requiredItemCount, el botón de compra para ese gato está deshabilitado', () => {
    useMetaStore.setState({ currency: 100_000, evolutionItems: { 'evo-test-cat': 3 } })
    render(<ShopPanel />)

    const row = screen.getByText('Gato de Prueba Evolutivo').closest('li')!
    expect(within(row).getByRole('button', { name: /Comprar/ })).toBeDisabled()
  })
})
