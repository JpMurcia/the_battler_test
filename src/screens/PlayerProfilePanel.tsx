import { Settings } from 'lucide-react'
import { CATS } from '../data/cats'
import { characterLevelOf, useMetaStore } from '../state/useMetaStore'

interface PlayerProfilePanelProps {
  /** No hardcodea el destino — quien monta este panel decide si "Ajustes" se apila encima (HubScreen). */
  onOpenSettings: () => void
}

/** specs/026-navegacion-hub-mockup (FR-007). Rango + colección — sin Leadership ni Meow Medals (FR-017,
 * ninguno tiene mecánica ni dato de origen especificados todavía). */
export function PlayerProfilePanel({ onOpenSettings }: PlayerProfilePanelProps) {
  const ownedCats = useMetaStore((state) => state.ownedCats)
  const rank = characterLevelOf(ownedCats)
  const ownedCount = Object.keys(ownedCats).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--bc-space-5)' }}>
      <h1>Perfil de Jugador</h1>
      <div className="hud-bar">
        <span className="hud-chip">Rango {rank}</span>
        <span className="hud-chip">
          {ownedCount}/{CATS.length} gatos poseídos
        </span>
      </div>
      <button className="btn" onClick={onOpenSettings}>
        <Settings size={16} aria-hidden="true" />
        Ajustes
      </button>
    </div>
  )
}
