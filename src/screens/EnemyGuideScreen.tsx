import { ArrowLeft } from 'lucide-react'
import { CATS } from '../data/cats'
import { useMetaStore } from '../state/useMetaStore'
import type { Screen } from '../types/screen'

interface EnemyGuideScreenProps {
  onNavigate: (screen: Screen) => void
}

/**
 * specs/018-bibliotecas-consulta (US2). Solo lectura — stats *base* de `CATS`, sin escalar por `SagaArc`
 * (plan.md Key Design Decision 3): un mismo enemigo debe mostrarse igual sin importar en qué arco se enfrentó.
 */
export function EnemyGuideScreen({ onNavigate }: EnemyGuideScreenProps) {
  const encounteredEnemyCatIds = useMetaStore((state) => state.encounteredEnemyCatIds)

  return (
    <main className="screen">
      <h1>Guía de Enemigos</h1>
      <ul className="list-card">
        {CATS.filter((cat) => encounteredEnemyCatIds.includes(cat.id)).map((cat) => (
          <li key={cat.id} className="list-card__row">
            <span className="list-card__title">
              {cat.name}: HP {cat.hp}, Daño {cat.damage}
            </span>
          </li>
        ))}
      </ul>
      <button className="btn btn-ghost" onClick={() => onNavigate('Upgrade')}>
        <ArrowLeft size={16} aria-hidden="true" />
        Volver
      </button>
    </main>
  )
}
