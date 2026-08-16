import { Application, extend, useApplication, useTick } from '@pixi/react'
import { Graphics } from 'pixi.js'
import { useCallback, useRef, useState } from 'react'
import type { BattleUnit } from '../engine/types'
import { useGameStore } from '../state/useGameStore'
import { useMetaStore } from '../state/useMetaStore'
import { DeathEchoSprite } from './DeathEchoSprite'
import { findNewlyActiveEnemyCatIds, type ActiveUnitSnapshot } from './enemyEncounters'
import { UnitSprite } from './UnitSprite'

extend({ Graphics })

/**
 * specs/021-reskin-cyber-modern (research.md Decisión 4): capa de fondo del carril, dibujada una
 * sola vez por tamaño de pantalla (no por frame/unidad) — el gradiente radial "nebulosa" real vive
 * en el CSS de `.battle-stage` y se ve a través del canvas transparente (backgroundAlpha=0); esta
 * capa Graphics solo añade el velo de profundidad sutil (claro arriba, oscuro abajo).
 */
function LaneBackground() {
  const { app } = useApplication()

  const draw = useCallback(
    (g: Graphics) => {
      g.clear()
      const width = app.screen.width
      const height = app.screen.height
      g.rect(0, 0, width, height * 0.45).fill({ color: 0xffffff, alpha: 0.03 })
      g.rect(0, height * 0.72, width, height * 0.28).fill({ color: 0x000000, alpha: 0.28 })
    },
    [app],
  )

  return <pixiGraphics draw={draw} />
}

interface DeathEchoState {
  instanceId: string
  team: BattleUnit['team']
  catId: string
  x: number
  width: number
}

function sameActiveUnits(a: ActiveUnitSnapshot[], b: ActiveUnitSnapshot[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 1) {
    if (a[i].instanceId !== b[i].instanceId) return false
  }
  return true
}

function BattleField() {
  // Solo mount/unmount de UnitSprite dispara re-render — nunca la posición/animación por frame
  // (specs/003-identidad-visual-animada/research.md Decisión 3, Constitución § VI).
  const activeRef = useRef<ActiveUnitSnapshot[]>([])
  const [activeUnits, setActiveUnits] = useState<ActiveUnitSnapshot[]>([])

  // Registro efímero de DeathEcho — nunca vive en useGameStore/SimState
  // (specs/003-identidad-visual-animada/data-model.md § DeathEcho).
  const deathEchoesRef = useRef<DeathEchoState[]>([])
  const [deathEchoes, setDeathEchoes] = useState<DeathEchoState[]>([])

  // Un DeathEchoSprite se retira a sí mismo al terminar su cuenta regresiva — solo entonces
  // cambia la composición del registro (mismo patrón mount/unmount que activeUnits).
  const expireDeathEcho = useCallback((instanceId: string) => {
    const next = deathEchoesRef.current.filter((echo) => echo.instanceId !== instanceId)
    deathEchoesRef.current = next
    setDeathEchoes(next)
  }, [])

  useTick(({ deltaTime }) => {
    const deltaSeconds = deltaTime / 60
    const store = useGameStore.getState()
    const wasInProgress = store.status === 'InProgress'
    // Snapshot completo (con x/width) tomado antes del tick — es la única fuente de la última
    // posición conocida de una unidad que muere en este tick, porque tick() ya la elimina de `units`.
    const previousUnits = activeRef.current

    store.tick(deltaSeconds)

    const freshStore = useGameStore.getState()
    const nextActiveUnits = freshStore.units.map((unit) => ({
      instanceId: unit.instanceId,
      catId: unit.catId,
      team: unit.team,
      x: unit.x,
      width: unit.width,
    }))

    // specs/018-bibliotecas-consulta (US2/FR-004): reutiliza este mismo diff de unidades activas para registrar
    // cada catId enemigo nuevo — una vez por catId, nunca por instanceId repetido.
    const newlyActiveEnemyCatIds = findNewlyActiveEnemyCatIds(previousUnits, nextActiveUnits)
    if (newlyActiveEnemyCatIds.length > 0) {
      const recordEncounteredEnemy = useMetaStore.getState().recordEncounteredEnemy
      for (const catId of newlyActiveEnemyCatIds) recordEncounteredEnemy(catId)
    }

    // Solo se generan ecos por muerte tick-a-tick mientras la batalla está en curso — nunca por
    // la limpieza de reset() (data-model.md § DeathEcho, validation rules).
    if (wasInProgress && freshStore.status === 'InProgress') {
      const stillActiveIds = new Set(nextActiveUnits.map((unit) => unit.instanceId))
      const newlyDead = previousUnits.filter((unit) => !stillActiveIds.has(unit.instanceId))
      if (newlyDead.length > 0) {
        const newEchoes: DeathEchoState[] = newlyDead.map((deadUnit) => ({
          instanceId: deadUnit.instanceId,
          team: deadUnit.team,
          catId: deadUnit.catId,
          x: deadUnit.x,
          width: deadUnit.width,
        }))
        deathEchoesRef.current = [...deathEchoesRef.current, ...newEchoes]
        setDeathEchoes(deathEchoesRef.current)
      }
    } else if (freshStore.status !== 'InProgress' && deathEchoesRef.current.length > 0) {
      deathEchoesRef.current = []
      setDeathEchoes([])
    }

    if (!sameActiveUnits(activeRef.current, nextActiveUnits)) {
      activeRef.current = nextActiveUnits
      setActiveUnits(nextActiveUnits)
    }
  })

  return (
    <>
      <LaneBackground />
      {activeUnits.map((unit) => (
        <UnitSprite key={unit.instanceId} instanceId={unit.instanceId} catId={unit.catId} team={unit.team} />
      ))}
      {deathEchoes.map((echo) => (
        <DeathEchoSprite
          key={echo.instanceId}
          instanceId={echo.instanceId}
          catId={echo.catId}
          team={echo.team}
          x={echo.x}
          onExpire={expireDeathEcho}
        />
      ))}
    </>
  )
}

export function BattleStage() {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div ref={containerRef} className="battle-stage">
      <Application resizeTo={containerRef} backgroundAlpha={0}>
        <BattleField />
      </Application>
    </div>
  )
}
