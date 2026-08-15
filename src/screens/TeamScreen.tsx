import { useState } from 'react'
import { CATS } from '../data/cats'
import { useMetaStore } from '../state/useMetaStore'
import type { Screen } from '../types/screen'

interface TeamScreenProps {
  onNavigate: (screen: Screen) => void
}

export function TeamScreen({ onNavigate }: TeamScreenProps) {
  const ownedCats = useMetaStore((state) => state.ownedCats)
  const activeTeamCatIds = useMetaStore((state) => state.activeTeamCatIds)
  const setActiveTeam = useMetaStore((state) => state.setActiveTeam)

  const [selectedIds, setSelectedIds] = useState<string[]>(
    activeTeamCatIds.length > 0 ? activeTeamCatIds : Object.keys(ownedCats),
  )

  const toggleCat = (catId: string) => {
    setSelectedIds((current) =>
      current.includes(catId) ? current.filter((id) => id !== catId) : [...current, catId],
    )
  }

  return (
    <main>
      <h1>Equipo</h1>
      <ul>
        {CATS.filter((cat) => cat.id in ownedCats).map((cat) => (
          <li key={cat.id}>
            <label>
              <input
                type="checkbox"
                checked={selectedIds.includes(cat.id)}
                onChange={() => toggleCat(cat.id)}
              />
              {cat.name}
            </label>
          </li>
        ))}
      </ul>
      <button disabled={selectedIds.length === 0} onClick={() => setActiveTeam(selectedIds)}>
        Confirmar equipo
      </button>
      <button onClick={() => onNavigate('Upgrade')}>Volver</button>
    </main>
  )
}
