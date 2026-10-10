import { fireEvent, render, screen, within } from '@testing-library/react'
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

describe('UnitDetailPanel — Talentos y Orbes (specs/036-talentos-orbes)', () => {
  beforeEach(() => {
    useMetaStore.setState({
      ownedCats: {
        'legend-cat-eclipse': { level: 1, experienceInvested: 0, evolutionStage: 'True' },
      },
      evolutionItems: {},
      npCurrency: 1000,
    })
  })

  it('para un gato NO elegible, la sección Talentos no aparece', () => {
    useMetaStore.setState({ ownedCats: { 'basic-cat': { level: 1, experienceInvested: 0, evolutionStage: 'Base' } } })
    render(<UnitDetailPanel catId="basic-cat" onClose={noop} />)

    expect(screen.queryByText('Talentos')).not.toBeInTheDocument()
  })

  it('para un gato elegible, muestra el NP disponible y el control de Resistencia a Debuff', () => {
    render(<UnitDetailPanel catId="legend-cat-eclipse" onClose={noop} />)

    expect(screen.getByText('Talentos')).toBeInTheDocument()
    expect(screen.getByText(/NP: 1000/)).toBeInTheDocument()
  })

  it('elegir un debuff e invertir invoca investDebuffResistanceTalent con esos argumentos', () => {
    render(<UnitDetailPanel catId="legend-cat-eclipse" onClose={noop} />)

    const row = screen.getByText('Resistencia a Debuff').closest('li')!
    fireEvent.change(within(row).getByRole('combobox'), { target: { value: 'Freeze' } })
    fireEvent.click(within(row).getByRole('button', { name: /\+1 punto/ }))

    expect(useMetaStore.getState().ownedCats['legend-cat-eclipse'].talents?.debuffResistance).toEqual({
      effect: 'Freeze',
      points: 1,
    })
  })

  it('con NP insuficiente, el botón de invertir está deshabilitado', () => {
    useMetaStore.setState({ npCurrency: 0 })
    render(<UnitDetailPanel catId="legend-cat-eclipse" onClose={noop} />)

    const row = screen.getByText('Resistencia a Debuff').closest('li')!
    expect(within(row).getByRole('button', { name: /\+1 punto/ })).toBeDisabled()
  })

  it('en el máximo de puntos, el botón de invertir está deshabilitado', () => {
    useMetaStore.setState({
      ownedCats: {
        'legend-cat-eclipse': {
          level: 1,
          experienceInvested: 0,
          evolutionStage: 'True',
          talents: { debuffResistance: { effect: 'Freeze', points: 5 } },
        },
      },
    })
    render(<UnitDetailPanel catId="legend-cat-eclipse" onClose={noop} />)

    const row = screen.getByText('Resistencia a Debuff').closest('li')!
    expect(within(row).getByRole('button', { name: /\+1 punto/ })).toBeDisabled()
  })

  it('muestra 2 contadores independientes (HP/Daño); invertir en cada uno invoca investStatBoostTalent con el argumento correcto', () => {
    render(<UnitDetailPanel catId="legend-cat-eclipse" onClose={noop} />)

    const hpRow = screen.getByText('Aumento de HP').closest('li')!
    fireEvent.click(within(hpRow).getByRole('button', { name: /\+1 punto/ }))
    expect(useMetaStore.getState().ownedCats['legend-cat-eclipse'].talents?.statBoost).toEqual({ hp: 1, damage: 0 })

    const damageRow = screen.getByText('Aumento de Daño').closest('li')!
    fireEvent.click(within(damageRow).getByRole('button', { name: /\+1 punto/ }))
    expect(useMetaStore.getState().ownedCats['legend-cat-eclipse'].talents?.statBoost).toEqual({ hp: 1, damage: 1 })
  })

  it('elegir un rasgo e invertir en Orbe invoca investOrbTalent con esos argumentos', () => {
    render(<UnitDetailPanel catId="legend-cat-eclipse" onClose={noop} />)

    const row = screen.getByText('Orbe').closest('li')!
    fireEvent.change(within(row).getByRole('combobox'), { target: { value: 'Red' } })
    fireEvent.click(within(row).getByRole('button', { name: /\+1 punto/ }))

    expect(useMetaStore.getState().ownedCats['legend-cat-eclipse'].talents?.orb).toEqual({ classification: 'Red', points: 1 })
  })
})

describe('UnitDetailPanel — habilidades de combate (specs/039-habilidades-control-defensa FR-010)', () => {
  const ownCat = (catId: string) => useMetaStore.setState({ ownedCats: { [catId]: { level: 1, experienceInvested: 0, evolutionStage: 'Base' } } })

  it.each([
    ['strengthen-cat', /Fortalecer \(≤50% HP, x2\)/],
    ['dodge-cat', /Esquivar \(25%\)/],
    ['survivor-cat', /Sobrevivir \(30%\)/],
    ['knockback-cat', /Retroceso \(30%, 30\)/],
  ])('%s describe su habilidad con nombre y valores configurados', (catId, expected) => {
    ownCat(catId)
    render(<UnitDetailPanel catId={catId} onClose={noop} />)

    expect(screen.getByText(/Habilidades:/)).toHaveTextContent(expected)
  })

  it('los gatos de specs/038 siguen mostrando su texto actual', () => {
    ownCat('massive-strike-cat')
    const { unmount } = render(<UnitDetailPanel catId="massive-strike-cat" onClose={noop} />)
    expect(screen.getByText(/Habilidades:/)).toHaveTextContent('Golpe Letal (5%, x3)')
    unmount()

    ownCat('summoner-cat')
    render(<UnitDetailPanel catId="summoner-cat" onClose={noop} />)
    expect(screen.getByText(/Habilidades:/)).toHaveTextContent('Invoca 1x basic-cat al morir')
  })
})

describe('UnitDetailPanel — Dinero Extra e inmunidades (specs/040-dinero-extra-inmunidades FR-010)', () => {
  const ownCat = (catId: string) => useMetaStore.setState({ ownedCats: { [catId]: { level: 1, experienceInvested: 0, evolutionStage: 'Base' } } })

  it('Dinero Extra se describe con su bono de energía y no muestra fila de inmunidades', () => {
    ownCat('wallet-cat')
    render(<UnitDetailPanel catId="wallet-cat" onClose={noop} />)

    expect(screen.getByText(/Habilidades:/)).toHaveTextContent('Dinero Extra (+5 energía por enemigo derrotado)')
    expect(screen.queryByText(/Inmune a/)).not.toBeInTheDocument()
  })

  it('una unidad con inmunidades muestra la fila "Inmune a" con los nombres de esas habilidades', () => {
    ownCat('anchor-cat')
    render(<UnitDetailPanel catId="anchor-cat" onClose={noop} />)

    expect(screen.getByText(/Inmune a:/)).toHaveTextContent('Inmune a: Retroceso')
  })

  it('una unidad sin inmunidades no muestra la fila "Inmune a"', () => {
    ownCat('basic-cat')
    render(<UnitDetailPanel catId="basic-cat" onClose={noop} />)

    expect(screen.queryByText(/Inmune a/)).not.toBeInTheDocument()
  })
})
