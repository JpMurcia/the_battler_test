import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TeamScreen } from '../../src/screens/TeamScreen'
import { useMetaStore } from '../../src/state/useMetaStore'

const noop = () => {}

beforeEach(() => {
  useMetaStore.setState({
    ownedCats: {
      'basic-cat': { level: 1, experienceInvested: 0, evolutionStage: 'Base' },
      'tank-cat': { level: 1, experienceInvested: 0, evolutionStage: 'Base' },
    },
    activeTeamCatIds: [],
    battleItemInventory: {},
    selectedBattleItemIds: [],
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

describe('TeamScreen — tope de equipo equipable (specs/022-datos-semilla-flujo-navegacion FR-008)', () => {
  // specs/022 FR-008: equipo equipable de 5 a 10 unidades — no confundir con MAX_ACTIVE_TEAM_SIZE (6),
  // el tope de la grilla de despliegue en batalla (specs/023), que no limita cuántas se pueden equipar.
  const ELEVEN_OWNED_CAT_IDS = [
    'basic-cat', 'tank-cat', 'speed-cat', 'heavy-cat', 'solar-cat', 'armored-cat',
    'frost-cat', 'weaken-cat', 'slow-cat', 'zombie-ward-cat', 'triple-strike-cat',
  ]

  it('un 7º gato poseído puede seleccionarse (el tope de 6 es solo de la grilla de despliegue, no del equipo)', () => {
    useMetaStore.setState({
      ownedCats: Object.fromEntries(
        ELEVEN_OWNED_CAT_IDS.map((catId) => [catId, { level: 1, experienceInvested: 0, evolutionStage: 'Base' as const }]),
      ),
      activeTeamCatIds: ELEVEN_OWNED_CAT_IDS.slice(0, 6),
    })
    render(<TeamScreen onNavigate={noop} />)

    const seventhCatCheckbox = screen.getByRole('checkbox', { name: /Gato Escarcha/ })
    expect(seventhCatCheckbox).not.toBeDisabled()
  })

  it('con 10 gatos ya seleccionados, el checkbox de un 11º gato poseído queda deshabilitado', () => {
    useMetaStore.setState({
      ownedCats: Object.fromEntries(
        ELEVEN_OWNED_CAT_IDS.map((catId) => [catId, { level: 1, experienceInvested: 0, evolutionStage: 'Base' as const }]),
      ),
      activeTeamCatIds: ELEVEN_OWNED_CAT_IDS.slice(0, 10),
    })
    render(<TeamScreen onNavigate={noop} />)

    const eleventhCatCheckbox = screen.getByRole('checkbox', { name: /Gato Triple Golpe/ })
    expect(eleventhCatCheckbox).toBeDisabled()
    expect(eleventhCatCheckbox).not.toBeChecked()
  })
})

describe('TeamScreen — Cat Combos (specs/025-cat-combos US2)', () => {
  it('lista los Cat Combos definidos con nombre y estado agregado', () => {
    // beforeEach ya deja basic-cat + tank-cat poseídos y activeTeamCatIds: [] → selectedIds inicial = ownedCats (ambos)
    render(<TeamScreen onNavigate={noop} />)

    expect(screen.getByText('Núcleo Original')).toBeInTheDocument()
    expect(screen.getByText('Especialistas de Control')).toBeInTheDocument()
  })

  it('con ambos miembros poseídos y seleccionados, combo-nucleo-original se muestra completo', () => {
    render(<TeamScreen onNavigate={noop} />)

    const comboRow = screen.getByText('Núcleo Original').closest('li')!
    expect(within(comboRow).getByText('Completo')).toBeInTheDocument()
  })

  it('FR-007: distingue un miembro no poseído de uno poseído pero no incluido en la formación', () => {
    useMetaStore.setState({
      ownedCats: { 'basic-cat': { level: 1, experienceInvested: 0, evolutionStage: 'Base' } },
      activeTeamCatIds: [],
    })
    render(<TeamScreen onNavigate={noop} />)

    const comboRow = screen.getByText('Núcleo Original').closest('li')!
    expect(within(comboRow).getByText('Incompleto')).toBeInTheDocument()
    expect(within(comboRow).getByText(/Gato Tanque.*no posee/)).toBeInTheDocument()
  })

  it('FR-007: un miembro poseído pero no en la formación se distingue de uno no poseído', () => {
    useMetaStore.setState({
      ownedCats: {
        'basic-cat': { level: 1, experienceInvested: 0, evolutionStage: 'Base' },
        'tank-cat': { level: 1, experienceInvested: 0, evolutionStage: 'Base' },
      },
      activeTeamCatIds: ['basic-cat'], // tank-cat poseído pero fuera de la formación
    })
    render(<TeamScreen onNavigate={noop} />)

    const comboRow = screen.getByText('Núcleo Original').closest('li')!
    expect(within(comboRow).getByText(/Gato Tanque.*no está en el equipo/)).toBeInTheDocument()
  })

  it('Acceptance Scenario 4: togglear el checkbox del miembro faltante completa el combo en el mismo render, sin Confirmar equipo', () => {
    useMetaStore.setState({
      ownedCats: {
        'basic-cat': { level: 1, experienceInvested: 0, evolutionStage: 'Base' },
        'tank-cat': { level: 1, experienceInvested: 0, evolutionStage: 'Base' },
      },
      activeTeamCatIds: ['basic-cat'],
    })
    render(<TeamScreen onNavigate={noop} />)

    let comboRow = screen.getByText('Núcleo Original').closest('li')!
    expect(within(comboRow).getByText('Incompleto')).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Gato Tanque'))

    comboRow = screen.getByText('Núcleo Original').closest('li')!
    expect(within(comboRow).getByText('Completo')).toBeInTheDocument()
    // no se guardó la formación — activeTeamCatIds no cambia hasta pulsar "Confirmar equipo"
    expect(useMetaStore.getState().activeTeamCatIds).toEqual(['basic-cat'])
  })
})

describe('TeamScreen — objetos de batalla (specs/017-objetos-de-batalla US1)', () => {
  it('con un objeto en inventario, seleccionarlo lo marca elegido', () => {
    useMetaStore.setState({ battleItemInventory: { 'speed-boost': 1 } })
    render(<TeamScreen onNavigate={noop} />)

    const checkbox = screen.getByLabelText(/Aceleración de Velocidad/)
    expect(checkbox).not.toBeChecked()

    fireEvent.click(checkbox)

    expect(checkbox).toBeChecked()
    expect(useMetaStore.getState().selectedBattleItemIds).toEqual(['speed-boost'])
  })

  it('sin inventario, el objeto se renderiza deshabilitado, sin error', () => {
    render(<TeamScreen onNavigate={noop} />)

    expect(screen.getByLabelText(/Aceleración de Velocidad/)).toBeDisabled()
  })

  it('deseleccionar un objeto ya elegido lo libera', () => {
    useMetaStore.setState({ battleItemInventory: { 'speed-boost': 1 }, selectedBattleItemIds: ['speed-boost'] })
    render(<TeamScreen onNavigate={noop} />)

    fireEvent.click(screen.getByLabelText(/Aceleración de Velocidad/))

    expect(useMetaStore.getState().selectedBattleItemIds).toEqual([])
  })
})
