import { Heart, X, Zap } from 'lucide-react'
import { useEffect } from 'react'
import { CATS } from '../data/cats'
import { isEventStageId, resolveLevel } from '../data/events'
import { findArcByLevelId } from '../data/sagaArcs'
import { BattleStage } from '../game/BattleStage'
import { useGameStore } from '../state/useGameStore'
import { useMetaStore } from '../state/useMetaStore'
import type { Screen } from '../types/screen'

interface BattleScreenProps {
  onNavigate: (screen: Screen) => void
}

function EnergyReadout() {
  const energy = useGameStore((state) => state.energy)
  const pct = energy.max > 0 ? Math.min(100, (energy.current / energy.max) * 100) : 0
  return (
    <div className="hud-chip">
      <Zap size={14} aria-hidden="true" color="var(--bc-cyan)" />
      <span>
        Energía: {Math.floor(energy.current)}/{energy.max}
      </span>
      <div className="progress-bar" style={{ width: 60 }}>
        <div className="progress-bar__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function PlayerBaseReadout() {
  const playerBase = useGameStore((state) => state.playerBase)
  const pct = playerBase.maxHp > 0 ? Math.min(100, (Math.max(0, playerBase.hp) / playerBase.maxHp) * 100) : 0
  return (
    <div className="hud-chip">
      <Heart size={14} aria-hidden="true" color="var(--bc-cyan)" />
      <span>
        Base jugador: {Math.max(0, Math.ceil(playerBase.hp))}/{playerBase.maxHp}
      </span>
      <div className="progress-bar" style={{ width: 60 }}>
        <div className="progress-bar__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function EnemyBaseReadout() {
  const enemyBase = useGameStore((state) => state.enemyBase)
  // specs/020-barrera-de-base (FR-008, plan.md Key Design Decision 4): indicador mínimo, sin librería/animación nueva.
  // El emoji 🛡 se conserva literal (no se reemplaza por icono) porque tests/unit/BattleScreen.test.tsx
  // lo verifica directamente vía getByText(/🛡/) — specs/021-reskin-cyber-modern prioriza no romper
  // aserciones existentes por encima de FR-006 para este glifo puntual.
  const bossBarrierActive = useGameStore((state) => state.bossBarrierActive)
  const pct = enemyBase.maxHp > 0 ? Math.min(100, (Math.max(0, enemyBase.hp) / enemyBase.maxHp) * 100) : 0
  return (
    <div className="hud-chip">
      <span>
        {bossBarrierActive ? '🛡 ' : ''}
        Base enemiga: {Math.max(0, Math.ceil(enemyBase.hp))}/{enemyBase.maxHp}
      </span>
      <div className="progress-bar" style={{ width: 60 }}>
        <div className="progress-bar__fill progress-bar__fill--danger" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function DeployBar() {
  const ownedCatsById = useMetaStore((state) => state.ownedCats)
  const activeTeamCatIds = useMetaStore((state) => state.activeTeamCatIds)
  const energyCurrent = useGameStore((state) => state.energy.current)
  const deployCooldowns = useGameStore((state) => state.deployCooldowns)
  const deployUnit = useGameStore((state) => state.deployUnit)

  const deployableCats = CATS.filter((cat) => cat.id in ownedCatsById)
  const ownedCats =
    activeTeamCatIds.length > 0
      ? deployableCats.filter((cat) => activeTeamCatIds.includes(cat.id))
      : deployableCats

  return (
    <div className="deploy-bar">
      {ownedCats.map((cat) => {
        const onCooldown = (deployCooldowns[cat.id] ?? 0) > 0
        const disabled = onCooldown || energyCurrent < cat.cost
        return (
          <button key={cat.id} className="btn" disabled={disabled} onClick={() => deployUnit(cat.id)}>
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
  const grantLevelRewards = useMetaStore((state) => state.grantLevelRewards)
  const claimArcRewardsIfComplete = useMetaStore((state) => state.claimArcRewardsIfComplete)
  const getActiveBonusMultiplier = useMetaStore((state) => state.getActiveBonusMultiplier)
  const pendingTreasureRadar = useMetaStore((state) => state.pendingTreasureRadar)
  const grantRandomUnownedTreasure = useMetaStore((state) => state.grantRandomUnownedTreasure)
  const clearPendingTreasureRadar = useMetaStore((state) => state.clearPendingTreasureRadar)

  useEffect(() => {
    if (status === 'Victory') {
      // specs/014-banner-evento-especial (FR-005/006/007): resuelve tanto LEVELS como la specialStage de un EventBanner.
      const level = levelId ? resolveLevel(levelId) : undefined
      if (level) {
        // specs/013-escalado-capitulos-sets-tesoros (US4): bonificación pasiva de sets de tesoros ya otorgados.
        addCurrency(Math.round(level.currencyReward * getActiveBonusMultiplier('CurrencyRewardMultiplier')))
        // specs/014-banner-evento-especial (FR-004): la fase especial de un evento no participa del desbloqueo secuencial.
        if (!isEventStageId(level.id)) {
          markLevelCompleted(level.id)
          unlockNextLevel()
        }
        // specs/012-saga-imperio-de-los-gatos (US4/US8): tesoro + gato de primera victoria, luego recompensas de arco si ya cierra.
        grantLevelRewards(level.id)
        const arc = findArcByLevelId(level.id)
        if (arc) claimArcRewardsIfComplete(arc.id)
        // specs/017-objetos-de-batalla (US2/FR-009): "Radar de Tesoro" consumido al entrar — tesoro adicional al azar.
        if (pendingTreasureRadar) grantRandomUnownedTreasure()
      }
      clearPendingTreasureRadar()
      onNavigate('Result')
    } else if (status === 'Defeat') {
      clearPendingTreasureRadar()
      onNavigate('Result')
    }
  }, [
    status,
    levelId,
    addCurrency,
    markLevelCompleted,
    unlockNextLevel,
    grantLevelRewards,
    claimArcRewardsIfComplete,
    getActiveBonusMultiplier,
    pendingTreasureRadar,
    grantRandomUnownedTreasure,
    clearPendingTreasureRadar,
    onNavigate,
  ])

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
      <div className="battle-overlay hud-bar">
        <EnergyReadout />
        <PlayerBaseReadout />
        <EnemyBaseReadout />
        <button className="btn btn-ghost" onClick={handleExit}>
          <X size={16} aria-hidden="true" />
          Salir
        </button>
      </div>
      <BattleStage />
      <DeployBar />
      <BattleOutcomeWatcher onNavigate={onNavigate} />
    </div>
  )
}
