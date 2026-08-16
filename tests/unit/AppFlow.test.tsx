import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../../src/App'
import { SEED_UNITS } from '../../src/data/seedData'
import { db } from '../../src/db'
import { BattleScreen } from '../../src/screens/BattleScreen'
import { ResultScreen } from '../../src/screens/ResultScreen'
import { useGameStore } from '../../src/state/useGameStore'
import { useMetaStore } from '../../src/state/useMetaStore'

// specs/022-datos-semilla-flujo-navegacion (research.md Decisión 3): mismo patrón que
// tests/unit/BattleScreen.test.tsx — evita montar Pixi/Application real en un test de navegación.
vi.mock('../../src/game/BattleStage', () => ({ BattleStage: () => null }))

const SEED_TEAM_CATS = Object.fromEntries(
  SEED_UNITS.map((unit) => [unit.id, { level: 1, experienceInvested: 0, evolutionStage: 'Base' as const }]),
)

async function seedDatabase() {
  await db.playerProfile.clear()
  await db.settings.clear()
  await db.ownedCats.clear()
  await db.teamFormation.clear()
  await db.missionEnergy.clear()
  await db.levelProgress.clear()

  await db.ownedCats.bulkPut(SEED_UNITS.map((unit) => ({ catId: unit.id, level: 1, experienceInvested: 0, evolutionStage: 'Base' as const })))
  // highestUnlockedLevelIndex=2 → 'level-seed-demo' (índice 2 de LEVELS) queda 'unlocked' sin jugar level-1/level-2 antes.
  await db.playerProfile.put({ id: 1, currency: 500, highestUnlockedLevelIndex: 2, createdAt: Date.now() })
  await db.missionEnergy.put({ id: 1, current: 999, max: 999, lastUpdatedAt: Date.now() })
}

beforeEach(async () => {
  await seedDatabase()
  useMetaStore.setState({ isHydrated: false })
  useGameStore.getState().reset()
})

describe('Flujo de navegación completo (spec.md US3)', () => {
  it('Título → Menú → Mejoras → Equipo → Selección de Nivel → Batalla → Victoria → Resultado → Selección de Nivel → Menú', async () => {
    render(<App />)

    // 1. Título carga el progreso guardado (FR-007) y avanza a Menú Principal.
    const playButton = await screen.findByRole('button', { name: /Jugar/ })
    fireEvent.click(playButton)
    expect(await screen.findByRole('heading', { name: 'Menú Principal' })).toBeInTheDocument()
    expect(screen.getByText(/Moneda: 500/)).toBeInTheDocument()

    // 2. Menú → Mejoras: invertir experiencia en una unidad del catálogo semilla (US3 Scenario 3).
    fireEvent.click(screen.getByRole('button', { name: 'Mejorar' }))
    const basicCatRow = screen.getByText(/Gato Básico \(Semilla\)/).closest('li')!
    fireEvent.click(within(basicCatRow).getByRole('button', { name: 'Mejorar' }))
    expect(useMetaStore.getState().ownedCats['seed-cat-basic'].level).toBe(2)
    expect(useMetaStore.getState().currency).toBeLessThan(500)

    // 3. Mejoras → Equipo: equipar la alineación activa (5-10, aquí las 4 unidades semilla disponibles) y persistir (FR-008).
    fireEvent.click(screen.getByRole('button', { name: /Equipo/ }))
    expect(await screen.findByRole('heading', { name: 'Equipo' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar equipo' }))
    expect(useMetaStore.getState().activeTeamCatIds).toHaveLength(SEED_UNITS.length)

    // Equipo vuelve a Mejoras, y desde ahí de regreso al Menú Principal.
    fireEvent.click(screen.getByRole('button', { name: /Volver/ }))
    expect(await screen.findByRole('heading', { name: 'Base' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Volver/ }))
    expect(await screen.findByRole('heading', { name: 'Menú Principal' })).toBeInTheDocument()

    // 4. Menú → Selección de Nivel: el nivel de demostración semilla está disponible (FR-002, research.md Decisión 3).
    fireEvent.click(screen.getByRole('button', { name: /Niveles/ }))
    expect(await screen.findByRole('heading', { name: 'Selección de Nivel' })).toBeInTheDocument()
    const demoLevelRow = screen.getByText('Nivel Semilla (Demo)').closest('li')!
    expect(within(demoLevelRow).getByText(/Disponible/)).toBeInTheDocument()
    fireEvent.click(within(demoLevelRow).getByRole('button', { name: 'Jugar' }))

    // 5. Batalla: HUD superior visible (dinero del jugador vía energía de misión ya gastada, HP de ambas bases) y alineación activa.
    expect(await screen.findByText(/Base jugador:/)).toBeInTheDocument()
    expect(screen.getByText(/Base enemiga:/)).toBeInTheDocument()
    expect(useGameStore.getState().levelId).toBe('level-seed-demo')
    for (const unit of SEED_UNITS) {
      expect(screen.getByRole('button', { name: new RegExp(unit.name.replace(/[()]/g, '\\$&')) })).toBeInTheDocument()
    }

    // 6. Forzar Victoria (spec.md Acceptance Scenario 5) — la simulación de combate ya está cubierta
    // por tests/unit/engine/; aquí solo se valida que la transición de estado navega correctamente.
    // La recompensa (FR-012) se otorga en el mismo efecto que la navegación, así que se captura antes.
    const currencyBeforeVictory = useMetaStore.getState().currency
    await act(async () => {
      useGameStore.setState({ status: 'Victory' })
    })
    expect(await screen.findByRole('heading', { name: 'Victoria' })).toBeInTheDocument()
    expect(useMetaStore.getState().currency).toBeGreaterThan(currencyBeforeVictory)

    // 7. Confirmar resultado — progreso ya reflejado en el estado guardado antes de continuar (FR-012).
    fireEvent.click(screen.getByRole('button', { name: /Volver/ }))

    // El resultado devuelve a Selección de Nivel (parte del mismo flujo de menú que Menú Principal —
    // ambas son alcanzables entre sí con un clic, ver AppFlow.test.tsx nota de research/tasks T016).
    expect(await screen.findByRole('heading', { name: 'Selección de Nivel' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Volver/ }))
    expect(await screen.findByRole('heading', { name: 'Menú Principal' })).toBeInTheDocument()
  })

  it('forzar Derrota muestra el modal de Derrota y navega de vuelta a Selección de Nivel al confirmar (US3 Scenario 6)', () => {
    useGameStore.setState({ status: 'Defeat', levelId: 'level-seed-demo' })
    const onNavigate = vi.fn()

    render(<ResultScreen onNavigate={onNavigate} />)

    expect(screen.getByRole('heading', { name: 'Derrota' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Volver/ }))
    expect(onNavigate).toHaveBeenCalledWith('LevelSelect')
  })

  it('edge case: alineación activa vacía sigue ofreciendo unidades desplegables (nunca deja al jugador sin nada que invocar)', () => {
    useGameStore.setState({ status: 'InProgress', energy: { current: 999, max: 999, regenPerSecond: 0 }, deployCooldowns: {} })
    useMetaStore.setState({ ownedCats: SEED_TEAM_CATS, activeTeamCatIds: [] })

    render(<BattleScreen onNavigate={vi.fn()} />)

    for (const unit of SEED_UNITS) {
      expect(screen.getByRole('button', { name: new RegExp(unit.name.replace(/[()]/g, '\\$&')) })).toBeInTheDocument()
    }
  })
})
