import { LEVELS } from '../data/levels'
import { useGameStore } from '../state/useGameStore'
import type { Screen } from '../types/screen'

interface LevelSelectScreenProps {
  onNavigate: (screen: Screen) => void
}

export function LevelSelectScreen({ onNavigate }: LevelSelectScreenProps) {
  const startLevel = useGameStore((state) => state.startLevel)

  const handlePlay = (levelId: string) => {
    startLevel(levelId)
    onNavigate('Battle')
  }

  return (
    <main>
      <h1>Selección de Nivel</h1>
      <ul>
        {LEVELS.map((level) => (
          <li key={level.id}>
            {level.name} <button onClick={() => handlePlay(level.id)}>Jugar</button>
          </li>
        ))}
      </ul>
      <button onClick={() => onNavigate('MainMenu')}>Volver</button>
    </main>
  )
}
