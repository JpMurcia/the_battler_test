import { ArrowLeft, Zap } from 'lucide-react'
import { useState } from 'react'
import { getLevelState, type LevelState } from '../data/levelState'
import { EVENT_BANNERS, isEventActive } from '../data/events'
import { LEVELS } from '../data/levels'
import { useGameStore } from '../state/useGameStore'
import { useMetaStore } from '../state/useMetaStore'
import type { Screen } from '../types/screen'

interface LevelSelectScreenProps {
  onNavigate: (screen: Screen) => void
}

/** specs/023-mapa-de-etapas-visual (data-model.md § StageNode). Derivado en cada render — no persistido. */
interface StageNode {
  id: string
  name: string
  x: number
  y: number
  state: LevelState | 'event'
  difficulty: number
  energyCost: number
}

export function LevelSelectScreen({ onNavigate }: LevelSelectScreenProps) {
  const startLevel = useGameStore((state) => state.startLevel)
  const highestUnlockedLevelIndex = useMetaStore((state) => state.highestUnlockedLevelIndex)
  const completedLevelIds = useMetaStore((state) => state.completedLevelIds)
  const missionEnergy = useMetaStore((state) => state.missionEnergy)
  const spendMissionEnergy = useMetaStore((state) => state.spendMissionEnergy)
  const consumeSelectedBattleItems = useMetaStore((state) => state.consumeSelectedBattleItems)

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const activeBanners = EVENT_BANNERS.filter((banner) => isEventActive(banner, Date.now()))

  // FR-002: líneas puramente derivadas de LEVELS en su orden de arreglo — la fase especial de un
  // EventBanner activo no participa (FR-008).
  const levelNodes: StageNode[] = LEVELS.map((level, index) => ({
    id: level.id,
    name: level.name,
    x: level.mapPosition.x,
    y: level.mapPosition.y,
    state: getLevelState(index, highestUnlockedLevelIndex, completedLevelIds.includes(level.id)),
    difficulty: level.difficulty,
    energyCost: level.energyCost,
  }))

  const eventNodes: StageNode[] = activeBanners.map((banner) => ({
    id: banner.specialStage.id,
    name: banner.specialStage.name,
    x: banner.specialStage.mapPosition.x,
    y: banner.specialStage.mapPosition.y,
    state: 'event',
    difficulty: banner.specialStage.difficulty,
    energyCost: banner.energyCost,
  }))

  const allNodes = [...levelNodes, ...eventNodes]
  const selectedNode = allNodes.find((node) => node.id === selectedNodeId) ?? null
  // Edge Cases (spec.md): reactivo a missionEnergy.current en cada render, sin necesidad de cerrar/reabrir el panel.
  const lacksEnergy = selectedNode !== null && missionEnergy.current < selectedNode.energyCost

  const handleSelectNode = (node: StageNode) => {
    // FR-005: un nodo bloqueado no abre el panel ni tiene ningún efecto.
    if (node.state === 'locked') return
    setSelectedNodeId(node.id)
  }

  const handleAttack = (levelId: string) => {
    // FR-006: mismo flujo exacto que antes usaba el botón "Jugar" — sin duplicar ni reimplementar.
    if (!spendMissionEnergy(levelId)) return
    const battleItemEffects = consumeSelectedBattleItems()
    startLevel(levelId, false, battleItemEffects)
    onNavigate('Battle')
  }

  return (
    <main className="screen">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button className="btn btn-ghost btn-icon" onClick={() => onNavigate('MainMenu')} aria-label="Volver">
          <ArrowLeft size={16} aria-hidden="true" />
        </button>
        <h1>Selección de Nivel</h1>
      </div>
      <div className="hud-chip" style={{ alignSelf: 'flex-start' }}>
        <Zap size={15} aria-hidden="true" color="var(--bc-cyan)" />
        Energía de misión: {Math.floor(missionEnergy.current)}/{missionEnergy.max}
      </div>
      <div className="stage-map">
        <svg className="stage-map__lines" viewBox="0 0 100 100" preserveAspectRatio="none">
          {LEVELS.slice(0, -1).map((level, index) => {
            const next = LEVELS[index + 1]
            return (
              <line
                key={`${level.id}-${next.id}`}
                x1={level.mapPosition.x}
                y1={level.mapPosition.y}
                x2={next.mapPosition.x}
                y2={next.mapPosition.y}
                stroke="rgba(255,255,255,.22)"
                strokeWidth={0.6}
                strokeDasharray="2,2"
              />
            )
          })}
        </svg>
        {allNodes.map((node) => (
          <button
            key={node.id}
            type="button"
            className={`stage-node stage-node--${node.state}`}
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
            disabled={node.state === 'locked'}
            aria-label={node.name}
            onClick={() => handleSelectNode(node)}
          >
            ★{node.difficulty}
          </button>
        ))}
        {selectedNode && (
          <div className="stage-detail-panel">
            <span className="stage-detail-panel__title">{selectedNode.name}</span>
            <div className="stage-detail-panel__meta">
              <span style={{ color: 'var(--bc-gold)' }}>★ {selectedNode.difficulty}</span>
              <span style={{ color: 'var(--bc-cyan)' }}>⚡ {selectedNode.energyCost}</span>
            </div>
            <button className="btn btn-primary" disabled={lacksEnergy} onClick={() => handleAttack(selectedNode.id)}>
              ¡Atacar!
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
