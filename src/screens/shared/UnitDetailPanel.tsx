import { useState } from 'react'
import type { Ability } from '../../engine/types'
import { CATS, RARITY_TAG_CLASS, getEffectiveCatStats, type EvolutionStage } from '../../data/cats'
import {
  DEBUFF_RESISTANCE_OPTIONS,
  MAX_TALENT_POINTS,
  ORB_CLASSIFICATION_OPTIONS,
  getTalentPointCost,
  isTalentEligible,
} from '../../data/talents'
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

/** specs/036-talentos-orbes (US1). Sección visible solo para un gato elegible (Forma Verdadera + Megarraro/Legendario). */
function TalentsSection({ catId }: { catId: string }) {
  const owned = useMetaStore((state) => state.ownedCats[catId])
  const npCurrency = useMetaStore((state) => state.npCurrency)
  const investDebuffResistanceTalent = useMetaStore((state) => state.investDebuffResistanceTalent)
  const investStatBoostTalent = useMetaStore((state) => state.investStatBoostTalent)
  const investOrbTalent = useMetaStore((state) => state.investOrbTalent)
  const [debuffChoice, setDebuffChoice] = useState(DEBUFF_RESISTANCE_OPTIONS[0])
  const [orbChoice, setOrbChoice] = useState(ORB_CLASSIFICATION_OPTIONS[0])

  const debuffResistance = owned?.talents?.debuffResistance
  const debuffPoints = debuffResistance?.points ?? 0
  const debuffCost = getTalentPointCost(debuffPoints)
  const debuffMaxed = debuffPoints >= MAX_TALENT_POINTS

  const statBoost = owned?.talents?.statBoost ?? { hp: 0, damage: 0 }

  const orb = owned?.talents?.orb
  const orbPoints = orb?.points ?? 0
  const orbCost = getTalentPointCost(orbPoints)
  const orbMaxed = orbPoints >= MAX_TALENT_POINTS

  return (
    <div style={{ marginTop: 8 }}>
      <h3>Talentos</h3>
      <span className="hud-chip">NP: {npCurrency}</span>

      <ul className="list-card">
        <li className="list-card__row">
          <div className="list-card__main">
            <span className="list-card__title">Resistencia a Debuff</span>
            <span className="list-card__meta">
              {debuffResistance ? `${debuffResistance.effect} — ${debuffPoints}/${MAX_TALENT_POINTS} puntos` : `0/${MAX_TALENT_POINTS} puntos`}
            </span>
          </div>
          {debuffPoints === 0 && (
            <select aria-label="Elegir debuff" value={debuffChoice} onChange={(event) => setDebuffChoice(event.target.value as typeof debuffChoice)}>
              {DEBUFF_RESISTANCE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}
          <button
            className="btn btn-primary"
            disabled={debuffMaxed || npCurrency < debuffCost}
            onClick={() => investDebuffResistanceTalent(catId, debuffResistance?.effect ?? debuffChoice)}
          >
            +1 punto ({debuffCost} NP)
          </button>
        </li>
        <li className="list-card__row">
          <div className="list-card__main">
            <span className="list-card__title">Aumento de HP</span>
            <span className="list-card__meta">{statBoost.hp}/{MAX_TALENT_POINTS} puntos</span>
          </div>
          <button
            className="btn btn-primary"
            disabled={statBoost.hp >= MAX_TALENT_POINTS || npCurrency < getTalentPointCost(statBoost.hp)}
            onClick={() => investStatBoostTalent(catId, 'hp')}
          >
            +1 punto ({getTalentPointCost(statBoost.hp)} NP)
          </button>
        </li>
        <li className="list-card__row">
          <div className="list-card__main">
            <span className="list-card__title">Aumento de Daño</span>
            <span className="list-card__meta">{statBoost.damage}/{MAX_TALENT_POINTS} puntos</span>
          </div>
          <button
            className="btn btn-primary"
            disabled={statBoost.damage >= MAX_TALENT_POINTS || npCurrency < getTalentPointCost(statBoost.damage)}
            onClick={() => investStatBoostTalent(catId, 'damage')}
          >
            +1 punto ({getTalentPointCost(statBoost.damage)} NP)
          </button>
        </li>
        <li className="list-card__row">
          <div className="list-card__main">
            <span className="list-card__title">Orbe</span>
            <span className="list-card__meta">{orb ? `${orb.classification} — ${orbPoints}/${MAX_TALENT_POINTS} puntos` : `0/${MAX_TALENT_POINTS} puntos`}</span>
          </div>
          {orbPoints === 0 && (
            <select aria-label="Elegir rasgo" value={orbChoice} onChange={(event) => setOrbChoice(event.target.value as typeof orbChoice)}>
              {ORB_CLASSIFICATION_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}
          <button
            className="btn btn-primary"
            disabled={orbMaxed || npCurrency < orbCost}
            onClick={() => investOrbTalent(catId, orb?.classification ?? orbChoice)}
          >
            +1 punto ({orbCost} NP)
          </button>
        </li>
      </ul>
    </div>
  )
}

function describeAbility(ability: Ability): string {
  if (ability.kind === 'Neutral') return `Neutral x${ability.damageMultiplier}`
  if (ability.kind === 'TraitTargeting') return `Fuerte contra ${ability.targetClassifications.join('/')} (x${ability.damageMultiplier})`
  if (ability.kind === 'TraitResistance') return `Resistencia a ${ability.targetClassifications.join('/')} (x${ability.damageTakenMultiplier})`
  // specs/038-catalogo-habilidades-avanzado
  if (ability.kind === 'MassiveDamage') return `Golpe Letal (${Math.round(ability.chance * 100)}%, x${ability.damageMultiplier})`
  if (ability.kind === 'TraitKiller') return `Killer contra ${ability.targetClassifications.join('/')} (${Math.round(ability.chance * 100)}%)`
  if (ability.kind === 'Shield') return `Escudo (${ability.shieldHp} HP)`
  return `Invoca ${ability.count}x ${ability.summonCatId} al morir`
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

      {isTalentEligible(owned.evolutionStage, cat.rarity) && <TalentsSection catId={catId} />}
    </PanelOverlay>
  )
}
