import { useEffect } from 'react'
import { CATS } from '../data/cats'
import { LEVELS } from '../data/levels'
import { BattleStage } from '../game/BattleStage'
import { useGameStore } from '../state/useGameStore'
import { useMetaStore } from '../state/useMetaStore'
import type { Screen } from '../types/screen'

interface BattleScreenProps {
  onNavigate: (screen: Screen) => void
}

function EnergyReadout() {
  const energy = useGameStore((state) => state.energy)
  return (
    <span>
      Energía: {Math.floor(energy.current)}/{energy.max}
    </span>
  )
}

function PlayerBaseReadout() {
  const playerBase = useGameStore((state) => state.playerBase)
  return (
    <span>
      Base jugador: {Math.max(0, Math.ceil(playerBase.hp))}/{playerBase.maxHp}
    </span>
  )
}

function EnemyBaseReadout() {
  const enemyBase = useGameStore((state) => state.enemyBase)
  return (
    <span>
      Base enemiga: {Math.max(0, Math.ceil(enemyBase.hp))}/{enemyBase.maxHp}
    </span>
  )
}

function DeployBar() {
  const ownedCatsById = useMetaStore((state) => state.ownedCats)
  const energyCurrent = useGameStore((state) => state.energy.current)
  const deployCooldowns = useGameStore((state) => state.deployCooldowns)
  const deployUnit = useGameStore((state) => state.deployUnit)

  const ownedCats = CATS.filter((cat) => cat.id in ownedCatsById)

  return (
    <div className="deploy-bar">
      {ownedCats.map((cat) => {
        const onCooldown = (deployCooldowns[cat.id] ?? 0) > 0
        const disabled = onCooldown || energyCurrent < cat.cost
        return (
          <button key={cat.id} disabled={disabled} onClick={() => deployUnit(cat.id)}>
            {cat.name} ({cat.cost})
          </button>
        )
      })}
    </div>
  )
}

/** Observa la transición de status a Victory/Defeat — al ganar, otorga recompensa una sola vez y navega a Result. */
function BattleOutcomeWatcher({ onNavigate }: BattleScreenProps) {
  const status = useGameStore((state) => state.status)
  const levelId = useGameStore((state) => state.levelId)
  const addCurrency = useMetaStore((state) => state.addCurrency)
  const markLevelCompleted = useMetaStore((state) => state.markLevelCompleted)
  const unlockNextLevel = useMetaStore((state) => state.unlockNextLevel)

  useEffect(() => {
    if (status === 'Victory') {
      const level = LEVELS.find((candidate) => candidate.id === levelId)
      if (level) {
        addCurrency(level.currencyReward)
        markLevelCompleted(level.id)
        unlockNextLevel()
      }
      onNavigate('Result')
    } else if (status === 'Defeat') {
      onNavigate('Result')
    }
  }, [status, levelId, addCurrency, markLevelCompleted, unlockNextLevel, onNavigate])

  return null
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
        <EnergyReadout />
        <PlayerBaseReadout />
        <EnemyBaseReadout />
        <button onClick={handleExit}>Salir</button>
      </div>
      <BattleStage />
      <DeployBar />
      <BattleOutcomeWatcher onNavigate={onNavigate} />
    </div>
  )
}
