import { ArrowLeft } from 'lucide-react'
import { CATS, RARITY_TAG_CLASS, getEffectiveCatStats } from '../data/cats'
import { useMetaStore } from '../state/useMetaStore'
import type { Screen } from '../types/screen'

interface CatGuideScreenProps {
  onNavigate: (screen: Screen) => void
}

/** specs/018-bibliotecas-consulta (US1). Solo lectura — stats efectivos según nivel/evolución vigentes (FR-002). */
export function CatGuideScreen({ onNavigate }: CatGuideScreenProps) {
  const ownedCats = useMetaStore((state) => state.ownedCats)

  return (
    <main className="screen">
      <h1>Guía de Gatos</h1>
      <ul className="list-card">
        {CATS.filter((cat) => cat.id in ownedCats).map((cat) => {
          const owned = ownedCats[cat.id]
          const stats = getEffectiveCatStats(cat, owned.evolutionStage)
          return (
            <li key={cat.id} className="list-card__row">
              <span className="list-card__title">
                {cat.name} — Nivel {owned.level}, Forma {owned.evolutionStage}: HP {stats.hp}, Daño {stats.damage}
              </span>
              {cat.rarity && <span className={`tag ${RARITY_TAG_CLASS[cat.rarity]}`}>{cat.rarity}</span>}
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
