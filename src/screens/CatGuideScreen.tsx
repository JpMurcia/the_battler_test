import { ArrowLeft, Info } from 'lucide-react'
import { useState } from 'react'
import { CATS, RARITY_TAG_CLASS, getEffectiveCatStats } from '../data/cats'
import { EMPTY_CAT_FILTER, matchesCatFilter, type CatFilterState } from '../data/catFilter'
import { CatFilterControls } from './shared/CatFilterControls'
import { UnitDetailPanel } from './shared/UnitDetailPanel'
import { formatCatLevel, useMetaStore } from '../state/useMetaStore'
import type { Screen } from '../types/screen'

interface CatGuideScreenProps {
  onNavigate: (screen: Screen) => void
}

/** specs/018-bibliotecas-consulta (US1). Solo lectura — stats efectivos según nivel/evolución vigentes (FR-002).
 * specs/030-filtro-detalle-unidad (US1/US2): + filtro por rareza/rasgo/habilidad y panel de detalle por gato. */
export function CatGuideScreen({ onNavigate }: CatGuideScreenProps) {
  const ownedCats = useMetaStore((state) => state.ownedCats)
  const [filter, setFilter] = useState<CatFilterState>(EMPTY_CAT_FILTER)
  const [sortByLevel, setSortByLevel] = useState(false)
  const [detailCatId, setDetailCatId] = useState<string | null>(null)

  const visibleCats = CATS.filter((cat) => cat.id in ownedCats && matchesCatFilter(cat, filter))
  if (sortByLevel) visibleCats.sort((a, b) => ownedCats[a.id].level - ownedCats[b.id].level)

  return (
    <main className="screen">
      <h1>Guía de Gatos</h1>
      <CatFilterControls filter={filter} onChange={setFilter} sortByLevel={sortByLevel} onToggleSort={() => setSortByLevel((v) => !v)} />
      <ul className="list-card screen-scroll">
        {visibleCats.map((cat) => {
          const owned = ownedCats[cat.id]
          const stats = getEffectiveCatStats(cat, owned.evolutionStage)
          return (
            <li key={cat.id} className="list-card__row">
              <span className="list-card__title">
                {cat.name} — Nivel {formatCatLevel(owned)}, Forma {owned.evolutionStage}: HP {stats.hp}, Daño {stats.damage}
              </span>
              {cat.rarity && <span className={`tag ${RARITY_TAG_CLASS[cat.rarity]}`}>{cat.rarity}</span>}
              <button className="btn btn-ghost" aria-label={`Ver detalle de ${cat.name}`} onClick={() => setDetailCatId(cat.id)}>
                <Info size={16} aria-hidden="true" />
              </button>
            </li>
          )
        })}
      </ul>
      {detailCatId && <UnitDetailPanel catId={detailCatId} onClose={() => setDetailCatId(null)} />}
      <button className="btn btn-ghost" onClick={() => onNavigate('Upgrade')}>
        <ArrowLeft size={16} aria-hidden="true" />
        Volver
      </button>
    </main>
  )
}
