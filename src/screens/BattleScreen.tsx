import { Heart, Pause, Play, Rows2, Target, X, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { CATS } from '../data/cats'
import { isEventStageId, resolveLevel } from '../data/events'
import { findArcByLevelId } from '../data/sagaArcs'
import { TREASURE_FESTIVALS, getActiveTreasureFestival } from '../data/treasureFestival'
import { BattleStage } from '../game/BattleStage'
import { useGameStore } from '../state/useGameStore'
import { MAX_ACTIVE_TEAM_SIZE, useMetaStore } from '../state/useMetaStore'
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

/** specs/029-pulido-batalla-hud (US1): expone `activateSpecialCannon()` (ya existente en useGameStore
 * desde specs/012) con un botón + indicador de progreso — mismo patrón `.hud-chip`/`.progress-bar`
 * que EnergyReadout/PlayerBaseReadout, sin campo de estado nuevo (research.md Decisión 1). */
function CannonControl() {
  const specialCannon = useGameStore((state) => state.specialCannon)
  const activateSpecialCannon = useGameStore((state) => state.activateSpecialCannon)
  const ready = specialCannon.rechargeRemaining <= 0
  const pct =
    specialCannon.rechargeDurationSeconds > 0
      ? Math.min(100, ((specialCannon.rechargeDurationSeconds - specialCannon.rechargeRemaining) / specialCannon.rechargeDurationSeconds) * 100)
      : 100
  return (
    <button
      className={`hud-chip btn${ready ? ' btn-primary' : ''}`}
      disabled={!ready}
      onClick={() => activateSpecialCannon()}
    >
      <Target size={14} aria-hidden="true" color={ready ? undefined : 'var(--bc-cyan)'} />
      <span>Cañón</span>
      <div className="progress-bar" style={{ width: 60 }}>
        <div className="progress-bar__fill progress-bar__fill--gold" style={{ width: `${pct}%` }} />
      </div>
    </button>
  )
}

/** specs/029-pulido-batalla-hud (US2): x1/x2 escalan `deltaSeconds` en BattleStage.tsx; pausa detiene
 * por completo la llamada a `tick()` ese frame — ver research.md Decisiones 2/3. */
function SpeedControls() {
  const speedMultiplier = useGameStore((state) => state.speedMultiplier)
  const paused = useGameStore((state) => state.paused)
  const setSpeedMultiplier = useGameStore((state) => state.setSpeedMultiplier)
  const setPaused = useGameStore((state) => state.setPaused)
  return (
    <div className="hud-chip" style={{ gap: 6 }}>
      <button className={`btn${speedMultiplier === 1 ? ' btn-primary' : ''}`} onClick={() => setSpeedMultiplier(1)}>
        x1
      </button>
      <button className={`btn${speedMultiplier === 2 ? ' btn-primary' : ''}`} onClick={() => setSpeedMultiplier(2)}>
        x2
      </button>
      <button className="btn btn-ghost" onClick={() => setPaused(!paused)}>
        {paused ? (
          <>
            <Play size={14} aria-hidden="true" /> Reanudar
          </>
        ) : (
          <>
            <Pause size={14} aria-hidden="true" /> Pausar
          </>
        )}
      </button>
    </div>
  )
}

function DeployBar() {
  const ownedCatsById = useMetaStore((state) => state.ownedCats)
  const activeTeamCatIds = useMetaStore((state) => state.activeTeamCatIds)
  const energyCurrent = useGameStore((state) => state.energy.current)
  const deployCooldowns = useGameStore((state) => state.deployCooldowns)
  const deployUnit = useGameStore((state) => state.deployUnit)
  // specs/029-pulido-batalla-hud (US5): preferencia de sesión, no persistida (research.md Decisión 6).
  const [rowLayout, setRowLayout] = useState<1 | 2>(1)

  const deployableCats = CATS.filter((cat) => cat.id in ownedCatsById)
  const ownedCats = (
    activeTeamCatIds.length > 0
      ? deployableCats.filter((cat) => activeTeamCatIds.includes(cat.id))
      : deployableCats
  ).slice(0, MAX_ACTIVE_TEAM_SIZE) // specs/023-mapa-de-etapas-visual (FR-016): equipos heredados de más de 6 no rompen la grilla.

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
      <div className={`deploy-bar${rowLayout === 2 ? ' deploy-bar--two-rows' : ''}`}>
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
      <button
        className="btn btn-ghost"
        aria-label="Alternar filas de despliegue"
        onClick={() => setRowLayout((current) => (current === 1 ? 2 : 1))}
      >
        <Rows2 size={16} aria-hidden="true" />
      </button>
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
  const getActiveComboBonusMultiplier = useMetaStore((state) => state.getActiveComboBonusMultiplier)
  const getBaseUpgradeCurrencyMultiplier = useMetaStore((state) => state.getBaseUpgradeCurrencyMultiplier)
  const recordMissionProgress = useMetaStore((state) => state.recordMissionProgress)
  const pendingTreasureRadar = useMetaStore((state) => state.pendingTreasureRadar)
  const grantRandomUnownedTreasure = useMetaStore((state) => state.grantRandomUnownedTreasure)
  const clearPendingTreasureRadar = useMetaStore((state) => state.clearPendingTreasureRadar)

  useEffect(() => {
    if (status === 'Victory') {
      // specs/014-banner-evento-especial (FR-005/006/007): resuelve tanto LEVELS como la specialStage de un EventBanner.
      const level = levelId ? resolveLevel(levelId) : undefined
      if (level) {
        // specs/013-escalado-capitulos-sets-tesoros (US4): bonificación pasiva de sets de tesoros ya otorgados.
        // specs/025-cat-combos (FR-003/FR-008): bonificación de Cat Combo activo, combinada con la de arriba.
        // specs/031-mejoras-de-base (US3/FR-009): "Contabilidad", combinada multiplicativamente con las 2 anteriores.
        // specs/032-festival-de-tesoros (US2/FR-005): 4º factor, vigente al momento exacto de otorgar la recompensa.
        addCurrency(
          Math.round(
            level.currencyReward *
              getActiveBonusMultiplier('CurrencyRewardMultiplier') *
              getActiveComboBonusMultiplier('CurrencyRewardMultiplier') *
              getBaseUpgradeCurrencyMultiplier() *
              (getActiveTreasureFestival(TREASURE_FESTIVALS, Date.now())?.currencyMultiplier ?? 1),
          ),
        )
        // specs/033-misiones-catnip-challenges (US2/FR-002): cualquier victoria cuenta, incluida la fase especial de un evento.
        recordMissionProgress('levelsCompleted', 1)
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
    getActiveComboBonusMultiplier,
    getBaseUpgradeCurrencyMultiplier,
    recordMissionProgress,
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
        <CannonControl />
        <SpeedControls />
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
