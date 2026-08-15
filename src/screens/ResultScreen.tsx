import { LEVELS } from '../data/levels'
import { useGameStore } from '../state/useGameStore'
import type { Screen } from '../types/screen'

interface ResultScreenProps {
  onNavigate: (screen: Screen) => void
}

export function ResultScreen({ onNavigate }: ResultScreenProps) {
  const status = useGameStore((state) => state.status)
  const levelId = useGameStore((state) => state.levelId)
  const reset = useGameStore((state) => state.reset)

  const isVictory = status === 'Victory'
  const level = LEVELS.find((candidate) => candidate.id === levelId)

  const handleBack = () => {
    reset()
    onNavigate('LevelSelect')
  }

  return (
    <main>
      <h1>{isVictory ? 'Victoria' : 'Derrota'}</h1>
      {isVictory && level && <p>Moneda ganada: {level.currencyReward}</p>}
      <button onClick={handleBack}>Volver</button>
    </main>
  )
}
