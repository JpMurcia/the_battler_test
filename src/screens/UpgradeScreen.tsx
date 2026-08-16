import { ArrowLeft, BookOpen, Gem, Skull, Users } from 'lucide-react'
import { CATS, RARITY_TAG_CLASS } from '../data/cats'
import { USER_RANK_THRESHOLDS } from '../data/userRankThresholds'
import { characterLevelOf, useMetaStore } from '../state/useMetaStore'
import type { Screen } from '../types/screen'

interface UpgradeScreenProps {
  onNavigate: (screen: Screen) => void
}

/** Costo de la siguiente mejora — debe coincidir con `upgradeCost` de `useMetaStore`. */
const upgradeCost = (currentLevel: number) => currentLevel * 100

/**
 * specs/019-rango-de-usuario (US1/US2). "Rango de Usuario" es el mismo valor que "Nivel de personaje" arriba
 * (`characterLevelOf`, FR-001) — esta sección añade los umbrales y su reclamo, no un segundo contador.
 */
function UserRankSection() {
  const ownedCats = useMetaStore((state) => state.ownedCats)
  const claimedRankThresholds = useMetaStore((state) => state.claimedRankThresholds)
  const claimRankThreshold = useMetaStore((state) => state.claimRankThreshold)

  const rank = characterLevelOf(ownedCats)

  return (
    <section className="glass-panel">
      <h2>Rango de Usuario: {rank}</h2>
      <ul className="list-card">
        {USER_RANK_THRESHOLDS.map((threshold) => {
          const claimed = claimedRankThresholds.includes(threshold.rank)
          const reached = rank >= threshold.rank
          return (
            <li key={threshold.rank} className="list-card__row">
              <span className="list-card__title">
                Rango {threshold.rank}: {threshold.reward.itemId} x{threshold.reward.count}
                {claimed ? ' (Reclamado)' : ''}
              </span>
              {!claimed && (
                <button className="btn btn-outline--cyan" disabled={!reached} onClick={() => claimRankThreshold(threshold.rank)}>
                  Reclamar
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export function UpgradeScreen({ onNavigate }: UpgradeScreenProps) {
  const currency = useMetaStore((state) => state.currency)
  const ownedCats = useMetaStore((state) => state.ownedCats)
  const upgradeCat = useMetaStore((state) => state.upgradeCat)

  const characterLevel = characterLevelOf(ownedCats)

  return (
    <main className="screen">
      <h1>Base</h1>
      <div className="hud-bar">
        <span className="hud-chip">Nivel de personaje: {characterLevel}</span>
        <span className="hud-chip">
          <Gem size={14} aria-hidden="true" color="var(--bc-purple)" />
          Moneda: {currency}
        </span>
      </div>
      <ul className="list-card">
        {CATS.filter((cat) => cat.id in ownedCats).map((cat) => {
          const owned = ownedCats[cat.id]
          const cost = upgradeCost(owned.level)
          const disabled = currency < cost
          return (
            <li key={cat.id} className="list-card__row">
              <div className="list-card__main">
                <span className="list-card__title">
                  {cat.name} — Nivel {owned.level}
                </span>
                <span className="list-card__meta">siguiente mejora: {cost}</span>
              </div>
              {cat.rarity && <span className={`tag ${RARITY_TAG_CLASS[cat.rarity]}`}>{cat.rarity}</span>}
              <button className="btn btn-primary" disabled={disabled} onClick={() => upgradeCat(cat.id)}>
                Mejorar
              </button>
            </li>
          )
        })}
      </ul>
      <UserRankSection />
      <div className="hud-bar">
        <button className="btn btn-outline--cyan" onClick={() => onNavigate('Team')}>
          <Users size={16} aria-hidden="true" />
          Equipo
        </button>
        {/* specs/018-bibliotecas-consulta: tres pantallas de solo lectura, únicamente accesibles desde aquí (FR-001). */}
        <button className="btn btn-outline--purple" onClick={() => onNavigate('CatGuide')}>
          <BookOpen size={16} aria-hidden="true" />
          Guía de Gatos
        </button>
        <button className="btn btn-outline--orange" onClick={() => onNavigate('EnemyGuide')}>
          <Skull size={16} aria-hidden="true" />
          Guía de Enemigos
        </button>
        <button className="btn" onClick={() => onNavigate('TreasureMenu')}>
          <Gem size={16} aria-hidden="true" />
          Menú de Tesoros
        </button>
      </div>
      <button className="btn btn-ghost" onClick={() => onNavigate('MainMenu')}>
        <ArrowLeft size={16} aria-hidden="true" />
        Volver
      </button>
    </main>
  )
}
