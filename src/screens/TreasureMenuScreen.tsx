import { ArrowLeft } from 'lucide-react'
import { TREASURE_SETS } from '../data/treasureSets'
import { useMetaStore } from '../state/useMetaStore'
import type { Screen } from '../types/screen'

interface TreasureMenuScreenProps {
  onNavigate: (screen: Screen) => void
}

/** specs/018-bibliotecas-consulta (US3). Solo lectura — progreso por `TreasureSet` (FR-006). */
export function TreasureMenuScreen({ onNavigate }: TreasureMenuScreenProps) {
  const obtainedTreasureIds = useMetaStore((state) => state.obtainedTreasureIds)
  const grantedTreasureSetIds = useMetaStore((state) => state.grantedTreasureSetIds)

  return (
    <main className="screen">
      <h1>Menú de Tesoros</h1>
      <ul className="list-card">
        {TREASURE_SETS.map((set) => {
          const obtainedCount = set.treasureIds.filter((id) => obtainedTreasureIds.includes(id)).length
          const isGranted = grantedTreasureSetIds.includes(set.id)
          const pct = set.treasureIds.length > 0 ? Math.round((obtainedCount / set.treasureIds.length) * 100) : 0
          return (
            <li key={set.id} className="list-card__row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
              <span className="list-card__title">
                {set.name}: {obtainedCount}/{set.treasureIds.length}
                {isGranted ? ' (Bonificación otorgada)' : ''}
              </span>
              <div className="progress-bar">
                <div className="progress-bar__fill progress-bar__fill--gold" style={{ width: `${pct}%` }} />
              </div>
            </li>
          )
        })}
      </ul>
      <button className="btn btn-ghost" onClick={() => onNavigate('Upgrade')}>
        <ArrowLeft size={16} aria-hidden="true" />
        Volver
      </button>
    </main>
  )
}
