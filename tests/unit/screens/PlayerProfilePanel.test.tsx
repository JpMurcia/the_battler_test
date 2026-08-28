import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CATS } from '../../../src/data/cats'
import { PlayerProfilePanel } from '../../../src/screens/PlayerProfilePanel'
import { useMetaStore } from '../../../src/state/useMetaStore'

describe('PlayerProfilePanel (specs/026-navegacion-hub-mockup, FR-007)', () => {
  it('muestra el rango y la colección X/Y de gatos poseídos', () => {
    useMetaStore.setState({
      ownedCats: {
        'basic-cat': { level: 3, experienceInvested: 0, evolutionStage: 'Base', plusLevel: 0 },
        'tank-cat': { level: 2, experienceInvested: 0, evolutionStage: 'Base', plusLevel: 1 },
      },
    })

    render(<PlayerProfilePanel onOpenSettings={vi.fn()} />)

    // characterLevelOf: (3+0) + (2+1) = 6
    expect(screen.getByText(/Rango 6/)).toBeInTheDocument()
    expect(screen.getByText(new RegExp(`2/${CATS.length} gatos poseídos`))).toBeInTheDocument()
  })

  it('el botón de Ajustes invoca onOpenSettings', () => {
    useMetaStore.setState({ ownedCats: {} })
    const onOpenSettings = vi.fn()

    render(<PlayerProfilePanel onOpenSettings={onOpenSettings} />)
    fireEvent.click(screen.getByRole('button', { name: /Ajustes/ }))

    expect(onOpenSettings).toHaveBeenCalledTimes(1)
  })
})
