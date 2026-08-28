import { useState } from 'react'
import type { Ability } from '../../engine/types'
import { CATS, RARITY_TAG_CLASS, getEffectiveCatStats, type EvolutionStage } from '../../data/cats'
import { useMetaStore } from '../../state/useMetaStore'
import { PanelOverlay } from './PanelOverlay'

/**
 * specs/030-filtro-detalle-unidad (US2). Stats completos + tabs de forma + botón de evolución,
 * compartido entre `TeamScreen` y `CatGuideScreen` (research.md Decisión 4). Conecta `evolveCat()`
 * (useMetaStore, ya implementado desde specs/010-evolucion-de-gatos) por primera vez a la UI.
 */

interface UnitDetailPanelProps {
  catId: string
  onClose: () => void
}

const FORM_LABELS: Record<EvolutionStage, string> = { Base: 'Base', Second: 'Evolucionada', True: 'Verdadera' }

function describeAbility(ability: Ability): string {
  if (ability.kind === 'Neutral') return `Neutral x${ability.damageMultiplier}`
  if (ability.kind === 'TraitTargeting') return `Fuerte contra ${ability.targetClassifications.join('/')} (x${ability.damageMultiplier})`
  return `Resistencia a ${ability.targetClassifications.join('/')} (x${ability.damageTakenMultiplier})`
}

export function UnitDetailPanel({ catId, onClose }: UnitDetailPanelProps) {
  const cat = CATS.find((candidate) => candidate.id === catId)
  const owned = useMetaStore((state) => state.ownedCats[catId])
  const evolutionItemCount = useMetaStore((state) => state.evolutionItems[catId] ?? 0)
  const evolveCat = useMetaStore((state) => state.evolveCat)

  const availableForms: EvolutionStage[] = cat
    ? (['Base', ...(cat.evolutions?.second ? ['Second' as const] : []), ...(cat.evolutions?.true ? ['True' as const] : [])] as EvolutionStage[])
    : []

  const [selectedForm, setSelectedForm] = useState<EvolutionStage>(owned?.evolutionStage ?? 'Base')

  if (!cat || !owned) return null

  const stats = getEffectiveCatStats(cat, selectedForm)
  const dps = stats.damage / cat.attackIntervalSeconds

  // FR-008/FR-009: solo hay forma siguiente si la forma correspondiente de `evolutions` existe.
  const nextForm = owned.evolutionStage === 'Base' ? cat.evolutions?.second : owned.evolutionStage === 'Second' ? cat.evolutions?.true : undefined
  const nextStageName: EvolutionStage | null = !nextForm ? null : owned.evolutionStage === 'Base' ? 'Second' : 'True'
  const requiredItemCount = nextForm?.requiredItemCount ?? 0
  const canEvolve = !!nextForm && owned.level >= nextForm.requiredLevel && evolutionItemCount >= requiredItemCount

  return (
    <PanelOverlay labelledBy={cat.name} onClose={onClose}>
      <h2>{cat.name}</h2>
      {cat.rarity && <span className={`tag ${RARITY_TAG_CLASS[cat.rarity]}`}>{cat.rarity}</span>}

      {availableForms.length > 1 && (
        <div role="tablist" style={{ display: 'flex', gap: 6, margin: '8px 0' }}>
          {availableForms.map((form) => (
            <button
              key={form}
              role="tab"
              aria-selected={selectedForm === form}
              className={`btn${selectedForm === form ? ' btn-primary' : ' btn-ghost'}`}
              onClick={() => setSelectedForm(form)}
            >
              {FORM_LABELS[form]}
            </button>
          ))}
        </div>
      )}

      <ul className="list-card">
        <li className="list-card__row" data-testid="detail-stat-hp">
          HP: {stats.hp}
        </li>
        <li className="list-card__row">Daño: {stats.damage}</li>
        <li className="list-card__row">DPS: {dps.toFixed(1)}</li>
        <li className="list-card__row">
          Alcance: {cat.attackRange}
          {cat.attackMinRange ? ` (mínimo ${cat.attackMinRange})` : ''}
        </li>
        <li className="list-card__row">Velocidad: {cat.speed}</li>
        <li className="list-card__row">Coste: {cat.cost}</li>
        <li className="list-card__row">Tiempo de recarga: {cat.cooldownSeconds}s</li>
        <li className="list-card__row">Tipo de ataque: {cat.attackType}</li>
        <li className="list-card__row">
          Rasgo: {cat.classification}
          {cat.specialClassification ? ` / ${cat.specialClassification}` : ''}
        </li>
        {cat.abilities && cat.abilities.length > 0 && (
          <li className="list-card__row">Habilidades: {cat.abilities.map(describeAbility).join(', ')}</li>
        )}
      </ul>

      {nextStageName && (
        <div style={{ marginTop: 8 }}>
          <button className="btn btn-primary" disabled={!canEvolve} onClick={() => evolveCat(catId)}>
            Evolucionar a {FORM_LABELS[nextStageName]}
          </button>
          {!canEvolve && nextForm && (
            <p className="list-card__meta">
              Requiere nivel {nextForm.requiredLevel}
              {requiredItemCount > 0 ? ` y ${requiredItemCount} ítems de evolución (tiene ${evolutionItemCount})` : ''}
            </p>
          )}
        </div>
      )}
    </PanelOverlay>
  )
}
