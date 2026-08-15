import { BattleStage } from '../game/BattleStage'
import { useGameStore } from '../state/useGameStore'
import type { Screen } from '../types/screen'

interface BattleScreenProps {
  onNavigate: (screen: Screen) => void
}

export function BattleScreen({ onNavigate }: BattleScreenProps) {
  const reset = useGameStore((state) => state.reset)

  const handleExit = () => {
    reset()
    onNavigate('MainMenu')
  }

  return (
    <div className="battle-screen">
      <div className="battle-overlay">
        <span>Energía: —</span>
        <span>Base jugador: —</span>
        <span>Base enemiga: —</span>
        <button onClick={handleExit}>Salir</button>
      </div>
      <BattleStage />
    </div>
  )
}
