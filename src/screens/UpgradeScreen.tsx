import { ArrowLeft, BookOpen, Gem, Skull, Users } from 'lucide-react'
import { useState } from 'react'
import { BASE_UPGRADES, getBaseUpgradeCost } from '../data/baseUpgrades'
import { CATS, RARITY_TAG_CLASS } from '../data/cats'
import { USER_RANK_THRESHOLDS } from '../data/userRankThresholds'
import { characterLevelOf, formatCatLevel, useMetaStore } from '../state/useMetaStore'
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

/** specs/031-mejoras-de-base (US1). Segunda pestaña del panel Mejorar — meta-progresión de cuenta,
 * pagada con la misma `currency`, sin efecto en unidades ni en el comportamiento de "Unidades" (FR-011). */
function BaseUpgradesSection() {
  const currency = useMetaStore((state) => state.currency)
  const baseUpgrades = useMetaStore((state) => state.baseUpgrades)
  const upgradeBaseUpgrade = useMetaStore((state) => state.upgradeBaseUpgrade)

  return (
    <ul className="list-card">
      {BASE_UPGRADES.map((def) => {
        const level = baseUpgrades[def.id] ?? 0
        const atMax = level >= def.maxLevel
        const cost = getBaseUpgradeCost(level)
        const disabled = atMax || currency < cost
        return (
          <li key={def.id} className="list-card__row">
            <div className="list-card__main">
              <span className="list-card__title">{def.name}</span>
              <span className="list-card__meta">
                Nivel {level}/{def.maxLevel}
                {atMax ? ' (máximo)' : ` — siguiente mejora: ${cost}`}
              </span>
            </div>
            <button className="btn btn-primary" disabled={disabled} onClick={() => upgradeBaseUpgrade(def.id)}>
              Mejorar
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export function UpgradeScreen({ onNavigate }: UpgradeScreenProps) {
  const currency = useMetaStore((state) => state.currency)
  const ownedCats = useMetaStore((state) => state.ownedCats)
  const upgradeCat = useMetaStore((state) => state.upgradeCat)
  const [tab, setTab] = useState<'units' | 'base'>('units')

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
      <div className="hud-bar">
        <button className={`btn${tab === 'units' ? ' btn-primary' : ' btn-ghost'}`} onClick={() => setTab('units')}>
          Unidades
        </button>
        <button className={`btn${tab === 'base' ? ' btn-primary' : ' btn-ghost'}`} onClick={() => setTab('base')}>
          Mejoras de Base
        </button>
      </div>
      {/* Única región con scroll interno de esta pantalla — para que la fila de navegación y "Volver"
          de abajo queden siempre visibles (nunca clipeados por el alto fijo de `.screen`). */}
      <div className="screen-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--bc-space-5)' }}>
        {tab === 'units' ? (
          <>
            <ul className="list-card">
              {CATS.filter((cat) => cat.id in ownedCats).map((cat) => {
                const owned = ownedCats[cat.id]
                const cost = upgradeCost(owned.level)
                const disabled = currency < cost
                return (
                  <li key={cat.id} className="list-card__row">
                    <div className="list-card__main">
                      <span className="list-card__title">
                        {cat.name} — Nivel {formatCatLevel(owned)}
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
          </>
        ) : (
          <BaseUpgradesSection />
        )}
      </div>
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
