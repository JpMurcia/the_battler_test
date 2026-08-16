import { ArrowLeft, Coins, Skull, Trophy } from 'lucide-react'
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
    <main className="screen" style={{ alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      <div className="glass-panel" style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 14, minWidth: 260 }}>
        {isVictory ? (
          <Trophy size={36} aria-hidden="true" color="var(--bc-gold)" />
        ) : (
          <Skull size={36} aria-hidden="true" color="var(--bc-red)" />
        )}
        <h1 style={{ color: isVictory ? 'var(--bc-gold)' : 'var(--bc-red)' }}>{isVictory ? 'Victoria' : 'Derrota'}</h1>
        {isVictory && level && (
          <p style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
            <Coins size={15} aria-hidden="true" color="var(--bc-gold)" />
            Moneda ganada: {level.currencyReward}
          </p>
        )}
        <button className="btn btn-primary" onClick={handleBack}>
          <ArrowLeft size={16} aria-hidden="true" />
          Volver
        </button>
      </div>
    </main>
  )
}
