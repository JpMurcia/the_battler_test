import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// specs/030-filtro-detalle-unidad (US2): gato de prueba con evolutions.second SOLAMENTE (sin .true),
// para probar el caso "solo pestañas Base/Evolucionada" sin depender del catálogo de producción
// (que no declara evoluciones, spec.md Assumptions de specs/010) — mismo patrón que useMetaStore.test.ts.
vi.mock('../../../src/data/cats', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/data/cats')>()
  return {
    ...actual,
    CATS: [
      ...actual.CATS,
      {
        id: 'evo-cat',
        name: 'Gato Evolutivo de Prueba',
        cost: 10,
        cooldownSeconds: 2,
        hp: 100,
        damage: 10,
        speed: 20,
        width: 16,
        attackIntervalSeconds: 1,
        attackType: 'Single',
        attackRange: 0,
        classification: 'Traitless',
        evolutions: { second: { requiredLevel: 10, hpMultiplier: 1.5, damageMultiplier: 1.2 } },
      },
    ],
  }
})

const { UnitDetailPanel } = await import('../../../src/screens/shared/UnitDetailPanel')
const { useMetaStore } = await import('../../../src/state/useMetaStore')

const noop = () => {}

beforeEach(() => {
  useMetaStore.setState({
    ownedCats: {
      'basic-cat': { level: 1, experienceInvested: 0, evolutionStage: 'Base' },
    },
    evolutionItems: {},
  })
})

describe('UnitDetailPanel (specs/030-filtro-detalle-unidad US2)', () => {
  it('muestra las estadísticas completas del gato', () => {
    render(<UnitDetailPanel catId="basic-cat" onClose={noop} />)

    expect(screen.getByText(/HP/)).toBeInTheDocument()
    expect(screen.getByText(/DPS/)).toBeInTheDocument()
    expect(screen.getByText(/Alcance/)).toBeInTheDocument()
    expect(screen.getByText(/Velocidad/)).toBeInTheDocument()
    expect(screen.getByText(/Coste/)).toBeInTheDocument()
    expect(screen.getByText(/recarga/i)).toBeInTheDocument()
  })

  it('un gato sin evolutions no muestra pestañas de forma', () => {
    render(<UnitDetailPanel catId="basic-cat" onClose={noop} />)

    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
  })

  it('un gato con evolutions.second (sin .true) muestra solo pestañas Base/Evolucionada', () => {
    useMetaStore.setState({ ownedCats: { 'evo-cat': { level: 1, experienceInvested: 0, evolutionStage: 'Base' } } })
    render(<UnitDetailPanel catId="evo-cat" onClose={noop} />)

    expect(screen.getByRole('tab', { name: /Base/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Evolucionada/ })).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: /Verdadera/ })).not.toBeInTheDocument()
  })

  it('cambiar de pestaña cambia los stats mostrados sin invocar evolveCat', () => {
    useMetaStore.setState({ ownedCats: { 'evo-cat': { level: 1, experienceInvested: 0, evolutionStage: 'Base' } } })
    render(<UnitDetailPanel catId="evo-cat" onClose={noop} />)

    const baseHp = screen.getByTestId('detail-stat-hp').textContent
    fireEvent.click(screen.getByRole('tab', { name: /Evolucionada/ }))
    const evolvedHp = screen.getByTestId('detail-stat-hp').textContent

    expect(evolvedHp).not.toBe(baseHp)
    expect(useMetaStore.getState().ownedCats['evo-cat'].evolutionStage).toBe('Base')
  })

  it('con nivel suficiente, el botón de evolución está habilitado e invoca evolveCat', () => {
    useMetaStore.setState({ ownedCats: { 'evo-cat': { level: 99, experienceInvested: 0, evolutionStage: 'Base' } } })
    render(<UnitDetailPanel catId="evo-cat" onClose={noop} />)

    const evolveButton = screen.getByRole('button', { name: /Evolucionar/ })
    expect(evolveButton).toBeEnabled()

    fireEvent.click(evolveButton)

    expect(useMetaStore.getState().ownedCats['evo-cat'].evolutionStage).toBe('Second')
  })

  it('con nivel insuficiente, el botón de evolución está deshabilitado mostrando el requisito', () => {
    useMetaStore.setState({ ownedCats: { 'evo-cat': { level: 1, experienceInvested: 0, evolutionStage: 'Base' } } })
    render(<UnitDetailPanel catId="evo-cat" onClose={noop} />)

    const evolveButton = screen.getByRole('button', { name: /Evolucionar/ })
    expect(evolveButton).toBeDisabled()
    expect(screen.getByText(/nivel/i)).toBeInTheDocument()
  })

  it('en la forma máxima del gato, no se muestra ningún botón de evolución', () => {
    useMetaStore.setState({ ownedCats: { 'evo-cat': { level: 99, experienceInvested: 0, evolutionStage: 'Second' } } })
    render(<UnitDetailPanel catId="evo-cat" onClose={noop} />)

    expect(screen.queryByRole('button', { name: /Evolucionar/ })).not.toBeInTheDocument()
  })

  it('pulsar cerrar invoca onClose', () => {
    const onClose = vi.fn()
    render(<UnitDetailPanel catId="basic-cat" onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: /Cerrar/ }))

    expect(onClose).toHaveBeenCalled()
  })
})
