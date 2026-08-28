import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { MissionsPanel } from '../../src/screens/MissionsPanel'
import { useMetaStore } from '../../src/state/useMetaStore'

beforeEach(() => {
  useMetaStore.setState({
    currency: 0,
    missionProgress: {},
    claimedMissionIds: [],
    missionsResetDateKey: new Date().toISOString().slice(0, 10),
  })
})

describe('MissionsPanel (specs/033-misiones-catnip-challenges US1)', () => {
  it('lista las 3 misiones con descripción y progreso actual/objetivo', () => {
    render(<MissionsPanel />)

    expect(screen.getByText('Completa 1 etapa')).toBeInTheDocument()
    expect(screen.getByText('Despliega 10 unidades')).toBeInTheDocument()
    expect(screen.getByText('Derrota 20 enemigos')).toBeInTheDocument()
    expect(screen.getByText('0/1')).toBeInTheDocument()
    expect(screen.getByText('0/10')).toBeInTheDocument()
    expect(screen.getByText('0/20')).toBeInTheDocument()
  })

  it('una misión con progreso >= objetivo muestra un botón Reclamar habilitado', () => {
    useMetaStore.setState({ missionProgress: { levelsCompleted: 1 } })
    render(<MissionsPanel />)

    const row = screen.getByText('Completa 1 etapa').closest('li')!
    expect(row.querySelector('button')).toBeEnabled()
    expect(row.querySelector('button')!.textContent).toMatch(/Reclamar/)
  })

  it('pulsar Reclamar invoca claimMission y aumenta la moneda', () => {
    useMetaStore.setState({ missionProgress: { levelsCompleted: 1 }, currency: 0 })
    render(<MissionsPanel />)

    const row = screen.getByText('Completa 1 etapa').closest('li')!
    fireEvent.click(row.querySelector('button')!)

    expect(useMetaStore.getState().currency).toBe(50)
    expect(useMetaStore.getState().claimedMissionIds).toContain('mision-completar-etapa')
  })

  it('una misión ya reclamada muestra "Reclamada" sin botón', () => {
    useMetaStore.setState({ missionProgress: { levelsCompleted: 1 }, claimedMissionIds: ['mision-completar-etapa'] })
    render(<MissionsPanel />)

    const row = screen.getByText('Completa 1 etapa').closest('li')!
    expect(row.querySelector('button')).toBeNull()
    expect(row.textContent).toMatch(/Reclamada/)
  })

  it('FR-004: un progreso interno muy por encima del objetivo nunca se muestra tal cual (queda reclamable en su lugar)', () => {
    useMetaStore.setState({ missionProgress: { unitsDeployed: 999 } })
    render(<MissionsPanel />)

    expect(screen.queryByText('999/10')).not.toBeInTheDocument()
    const row = screen.getByText('Despliega 10 unidades').closest('li')!
    expect(row.querySelector('button')!.textContent).toMatch(/Reclamar/)
  })
})
