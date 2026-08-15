import { getLevelState } from '../data/levelState'
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

export function LevelSelectScreen({ onNavigate }: LevelSelectScreenProps) {
  const startLevel = useGameStore((state) => state.startLevel)
  const highestUnlockedLevelIndex = useMetaStore((state) => state.highestUnlockedLevelIndex)
  const completedLevelIds = useMetaStore((state) => state.completedLevelIds)
  const missionEnergy = useMetaStore((state) => state.missionEnergy)
  const spendMissionEnergy = useMetaStore((state) => state.spendMissionEnergy)

  const handlePlay = (levelId: string) => {
    if (!spendMissionEnergy(levelId)) return
    startLevel(levelId)
    onNavigate('Battle')
  }

  return (
    <main>
      <h1>Selección de Nivel</h1>
      <p>Energía de misión: {Math.floor(missionEnergy.current)}/{missionEnergy.max}</p>
      <ul className="level-list">
        {LEVELS.map((level, index) => {
          const state = getLevelState(index, highestUnlockedLevelIndex, completedLevelIds.includes(level.id))
          const lacksEnergy = missionEnergy.current < level.energyCost
          return (
            <li key={level.id} className={`level-item level-item--${state}`}>
              {level.name} ({STATE_LABEL[state]}, costo: {level.energyCost})
              <button disabled={state === 'locked' || lacksEnergy} onClick={() => handlePlay(level.id)}>
                Jugar
              </button>
            </li>
          )
        })}
      </ul>
      <button onClick={() => onNavigate('MainMenu')}>Volver</button>
    </main>
  )
}
