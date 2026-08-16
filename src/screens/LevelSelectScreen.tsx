import { ArrowLeft, Zap } from 'lucide-react'
import { getLevelState } from '../data/levelState'
import { EVENT_BANNERS, isEventActive } from '../data/events'
import { LEVELS } from '../data/levels'
import { useGameStore } from '../state/useGameStore'
import { useMetaStore } from '../state/useMetaStore'
import type { Screen } from '../types/screen'

interface LevelSelectScreenProps {
  onNavigate: (screen: Screen) => void
}

const STATE_LABEL = {
  locked: 'Bloqueado',
  unlocked: 'Disponible',
  completed: 'Completado',
} as const

/** specs/014-banner-evento-especial (US1): tarjeta condicional, fuera del desbloqueo secuencial (FR-002/003/004). */
function EventBannerCard({ onPlay }: { onPlay: (levelId: string) => void }) {
  const missionEnergy = useMetaStore((state) => state.missionEnergy)
  const activeBanners = EVENT_BANNERS.filter((banner) => isEventActive(banner, Date.now()))

  return (
    <ul className="event-banner-list list-card">
      {activeBanners.map((banner) => {
        const lacksEnergy = missionEnergy.current < banner.energyCost
        return (
          <li key={banner.id} className="event-banner-item list-card__row" style={{ borderColor: 'var(--bc-gold)' }}>
            <div className="list-card__main">
              <span className="list-card__title">{banner.name}</span>
              <span className="list-card__meta">costo: {banner.energyCost}</span>
            </div>
            <button className="btn btn-primary" disabled={lacksEnergy} onClick={() => onPlay(banner.specialStage.id)}>
              Jugar
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export function LevelSelectScreen({ onNavigate }: LevelSelectScreenProps) {
  const startLevel = useGameStore((state) => state.startLevel)
  const highestUnlockedLevelIndex = useMetaStore((state) => state.highestUnlockedLevelIndex)
  const completedLevelIds = useMetaStore((state) => state.completedLevelIds)
  const missionEnergy = useMetaStore((state) => state.missionEnergy)
  const spendMissionEnergy = useMetaStore((state) => state.spendMissionEnergy)
  const consumeSelectedBattleItems = useMetaStore((state) => state.consumeSelectedBattleItems)

  const handlePlay = (levelId: string) => {
    if (!spendMissionEnergy(levelId)) return
    // specs/017-objetos-de-batalla (FR-006, plan.md Key Design Decision 2): único punto de consumo — entrada real a la batalla.
    const battleItemEffects = consumeSelectedBattleItems()
    startLevel(levelId, false, battleItemEffects)
    onNavigate('Battle')
  }

  return (
    <main className="screen">
      <h1>Selección de Nivel</h1>
      <div className="hud-chip" style={{ alignSelf: 'flex-start' }}>
        <Zap size={15} aria-hidden="true" color="var(--bc-cyan)" />
        Energía de misión: {Math.floor(missionEnergy.current)}/{missionEnergy.max}
      </div>
      <EventBannerCard onPlay={handlePlay} />
      <ul className="level-list list-card">
        {LEVELS.map((level, index) => {
          const state = getLevelState(index, highestUnlockedLevelIndex, completedLevelIds.includes(level.id))
          const lacksEnergy = missionEnergy.current < level.energyCost
          return (
            <li
              key={level.id}
              className={`level-item level-item--${state} list-card__row${state === 'locked' ? ' list-card__row--locked' : ''}`}
            >
              <div className="list-card__main">
                <span className="list-card__title">{level.name}</span>
                <span className="list-card__meta">
                  {STATE_LABEL[state]}, costo: {level.energyCost}
                </span>
              </div>
              <button className="btn btn-primary" disabled={state === 'locked' || lacksEnergy} onClick={() => handlePlay(level.id)}>
                Jugar
              </button>
            </li>
          )
        })}
      </ul>
      <button className="btn btn-ghost" onClick={() => onNavigate('MainMenu')}>
        <ArrowLeft size={16} aria-hidden="true" />
        Volver
      </button>
    </main>
  )
}
