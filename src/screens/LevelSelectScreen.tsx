import { ArrowLeft, Gem, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getLevelState, type LevelState } from '../data/levelState'
import { EVENT_BANNERS, isEventActive } from '../data/events'
import { LEVELS } from '../data/levels'
import { TREASURE_SETS } from '../data/treasureSets'
import { TREASURE_FESTIVALS, getActiveTreasureFestival, getFestivalTimeRemainingMs } from '../data/treasureFestival'
import { PanelOverlay } from './shared/PanelOverlay'
import { TreasureMenuScreen } from './TreasureMenuScreen'
import { useGameStore } from '../state/useGameStore'
import { useMetaStore } from '../state/useMetaStore'
import type { Screen } from '../types/screen'

interface LevelSelectScreenProps {
  onNavigate: (screen: Screen) => void
}

/** Mismo formateador que `formatCountdown` de `HubScreen.tsx` (specs/029) — duplicado deliberado, trivial
 * de mantener sincronizado, mismo criterio que `lighten()` en `cyberUnitBody.ts`/`unitFactory.ts`. */
function formatCountdown(totalSeconds: number): string {
  const clamped = Math.max(0, Math.ceil(totalSeconds))
  const minutes = Math.floor(clamped / 60)
  const seconds = clamped % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/** specs/032-festival-de-tesoros (US1). Mismo patrón que `EnergyRegenTimer` (specs/029): `setInterval`
 * local de 1s para recalcular el countdown, sin escribir a ningún store. */
function TreasureFestivalBanner() {
  const [, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick((value) => value + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const festival = getActiveTreasureFestival(TREASURE_FESTIVALS, Date.now())
  if (!festival) return null

  const remainingSeconds = getFestivalTimeRemainingMs(festival, Date.now()) / 1000

  return (
    <div className="glass-panel" data-testid="treasure-festival-banner" style={{ display: 'flex', alignItems: 'center', gap: 'var(--bc-space-4)', padding: 'var(--bc-space-4) var(--bc-space-6)' }}>
      <Gem size={16} aria-hidden="true" color="var(--bc-gold)" />
      <strong>{festival.name}</strong>
      <span>x{festival.currencyMultiplier} Moneda</span>
      <span>⏱ {formatCountdown(remainingSeconds)}</span>
    </div>
  )
}

/**
 * specs/028-ajustes-combate-mapa-disenos (US2/FR-006). Etiqueta legible por región de `Level.region` — fallback
 * al valor crudo si una región nueva todavía no tiene entrada aquí (no bloquea, solo pierde formato bonito).
 */
const REGION_LABELS: Record<string, string> = {
  'imperio-de-los-gatos': 'Imperio de los Gatos',
  'imperio-de-los-gatos-cap1': 'Capítulo 1',
}

/** specs/028-ajustes-combate-mapa-disenos (research.md Decisión 3). Mínimo visual + estimación por nodo, sin tocar `mapPosition`. */
const MIN_STAGE_MAP_CANVAS_HEIGHT_PX = 320
const STAGE_MAP_CANVAS_PX_PER_NODE = 70

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
  const obtainedTreasureIds = useMetaStore((state) => state.obtainedTreasureIds)

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  // specs/028-ajustes-combate-mapa-disenos (US2/FR-006). Primera región de LEVELS (en su orden de arreglo) por
  // defecto — puramente presentación/filtrado, no toca `getLevelState`/`highestUnlockedLevelIndex` (FR-008).
  const [activeRegion, setActiveRegion] = useState<string>(LEVELS[0]?.region ?? '')
  // specs/026-navegacion-hub-mockup (US5/FR-010). Stack propio, independiente del Hub (research.md Decisión 1)
  // — el Mapa de Etapas es su propia vista base, no un panel del Hub.
  const [showTreasureMenu, setShowTreasureMenu] = useState(false)

  // Mismo cálculo (obtenido/total → %) que TreasureMenuScreen usa por set, agregado a todos los tesoros
  // existentes: hoy no hay selector de "capítulo activo" en este mapa, así que el % es global.
  const allTreasureIds = TREASURE_SETS.flatMap((set) => set.treasureIds)
  const obtainedTreasureCount = allTreasureIds.filter((id) => obtainedTreasureIds.includes(id)).length
  const treasurePct = allTreasureIds.length > 0 ? Math.round((obtainedTreasureCount / allTreasureIds.length) * 100) : 0

  const activeBanners = EVENT_BANNERS.filter((banner) => isEventActive(banner, Date.now()))

  // specs/028-ajustes-combate-mapa-disenos (US2/FR-006). Pestañas derivadas de Level.region, en el orden en que
  // aparecen por primera vez en LEVELS — sin nuevo campo de agrupación (research.md Decisión 3).
  const regions = [...new Set(LEVELS.map((level) => level.region))]

  // FR-002: líneas puramente derivadas de LEVELS en su orden de arreglo — la fase especial de un
  // EventBanner activo no participa (FR-008). FR-006/FR-007: filtrado a la región activa — el índice
  // usado por getLevelState sigue siendo el del arreglo COMPLETO, nunca el de la lista filtrada, para no
  // alterar ningún cálculo de desbloqueo existente.
  const activeRegionLevels = LEVELS.map((level, index) => ({ level, index })).filter(({ level }) => level.region === activeRegion)
  const levelNodes: StageNode[] = activeRegionLevels.map(({ level, index }) => ({
    id: level.id,
    name: level.name,
    x: level.mapPosition.x,
    y: level.mapPosition.y,
    state: getLevelState(index, highestUnlockedLevelIndex, completedLevelIds.includes(level.id)),
    difficulty: level.difficulty,
    energyCost: level.energyCost,
  }))
  const activeRegionLevelList = activeRegionLevels.map(({ level }) => level)
  const stageMapCanvasHeightPx = Math.max(MIN_STAGE_MAP_CANVAS_HEIGHT_PX, levelNodes.length * STAGE_MAP_CANVAS_PX_PER_NODE)

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--bc-space-4)' }}>
        <button className="btn btn-ghost btn-icon" onClick={() => onNavigate('MainMenu')} aria-label="Volver">
          <ArrowLeft size={16} aria-hidden="true" />
        </button>
        <h1>Selección de Nivel</h1>
        <button className="btn" style={{ marginLeft: 'auto' }} onClick={() => setShowTreasureMenu(true)}>
          <Gem size={14} aria-hidden="true" color="var(--bc-gold)" />
          Tesoros {treasurePct}%
        </button>
      </div>
      <div className="hud-chip" style={{ alignSelf: 'flex-start' }}>
        <Zap size={15} aria-hidden="true" color="var(--bc-cyan)" />
        Energía de misión: {Math.floor(missionEnergy.current)}/{missionEnergy.max}
      </div>
      <TreasureFestivalBanner />
      {regions.length > 1 && (
        <div className="region-tabs">
          {regions.map((region) => (
            <button
              key={region}
              type="button"
              className={`region-tab${region === activeRegion ? ' region-tab--active' : ''}`}
              onClick={() => setActiveRegion(region)}
            >
              {REGION_LABELS[region] ?? region}
            </button>
          ))}
        </div>
      )}
      <div className="stage-map stage-map--scrollable">
        <div className="stage-map__canvas" style={{ height: `${stageMapCanvasHeightPx}px` }}>
          <svg className="stage-map__lines" viewBox="0 0 100 100" preserveAspectRatio="none">
            {activeRegionLevelList.slice(0, -1).map((level, index) => {
              const next = activeRegionLevelList[index + 1]
              return (
                <line
                  key={`${level.id}-${next.id}`}
                  x1={level.mapPosition.x}
                  y1={level.mapPosition.y}
                  x2={next.mapPosition.x}
                  y2={next.mapPosition.y}
                  className="stage-map__link"
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
        </div>
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

      {showTreasureMenu && (
        <PanelOverlay labelledBy="Menú de Tesoros" onClose={() => setShowTreasureMenu(false)}>
          <TreasureMenuScreen onNavigate={() => setShowTreasureMenu(false)} />
        </PanelOverlay>
      )}
    </main>
  )
}
