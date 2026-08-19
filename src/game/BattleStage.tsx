import { Application, extend, useApplication, useTick } from '@pixi/react'
import { Graphics } from 'pixi.js'
import { useCallback, useRef, useState } from 'react'
import type { BattleUnit } from '../engine/types'
import { useGameStore } from '../state/useGameStore'
import { useMetaStore } from '../state/useMetaStore'
import { BaseTower } from './BaseTower'
import { DeathEchoSprite } from './DeathEchoSprite'
import { findNewlyActiveEnemyCatIds, type ActiveUnitSnapshot } from './enemyEncounters'
import { getLaneScreenY } from './graphics/layout'
import { ImpactEffect } from './ImpactEffect'
import { UnitSprite } from './UnitSprite'

extend({ Graphics })

/** Mismo tono que `--bc-gold` (src/theme.css) — daño/impacto en dorado, distinto de los colores de equipo (cian/rojo). */
const IMPACT_COLOR = 0xfacc15
/** Umbral mínimo de pérdida de hp para justificar un efecto de impacto — filtra ruido de punto flotante. */
const IMPACT_HP_EPSILON = 0.01

/**
 * specs/021-reskin-cyber-modern (research.md Decisión 4): capa de fondo del carril, dibujada una
 * sola vez por tamaño de pantalla (no por frame/unidad) — el gradiente radial "nebulosa" real vive
 * en el CSS de `.battle-stage` y se ve a través del canvas transparente (backgroundAlpha=0); esta
 * capa Graphics solo añade el velo de profundidad sutil (claro arriba, oscuro abajo) más una rejilla
 * de "suelo" y una línea de horizonte neón a la altura real del carril (múltiples capas de profundidad).
 */
function LaneBackground() {
  const { app } = useApplication()

  const draw = useCallback(
    (g: Graphics) => {
      g.clear()
      // `<Application>` monta el árbol de children antes de que su instancia PIXI termine de
      // inicializarse (root.render corre de inmediato, applicationRef se resuelve después) — este
      // draw puede ejecutarse una vez con `app.renderer` todavía sin asignar. El getter `app.screen`
      // hace `this.renderer.screen` internamente, así que `app?.screen` NO basta como guard (el optional
      // chaining solo protege `app`, no evita que el getter lance al leer `renderer` undefined) — hay
      // que comprobar `app?.renderer` antes de tocar `app.screen` en absoluto (mismo guard que UnitSprite
      // ya usaba). Se deja vacío ese primer frame; en cuanto `app` queda listo, `[app]` cambia de
      // referencia y Pixi vuelve a invocar este callback con dimensiones reales.
      if (!app?.renderer) return
      const width = app.screen.width
      const height = app.screen.height
      const laneY = getLaneScreenY(height)

      g.rect(0, 0, width, height * 0.45).fill({ color: 0xffffff, alpha: 0.03 })
      g.rect(0, height * 0.72, width, height * 0.28).fill({ color: 0x000000, alpha: 0.28 })

      // Rejilla de suelo Cyber-Modern por debajo de la línea de carril — profundidad sin coste de
      // filtros: líneas horizontales que se van espaciando y verticales convergentes hacia el centro.
      const floorHeight = height - laneY
      const horizontalLines = 4
      for (let i = 1; i <= horizontalLines; i += 1) {
        const y = laneY + (floorHeight * i) / (horizontalLines + 1)
        g.moveTo(0, y).lineTo(width, y).stroke({ width: 1, color: 0x22d3ee, alpha: 0.05 })
      }
      const verticalLines = 10
      for (let i = 0; i <= verticalLines; i += 1) {
        const x = (width * i) / verticalLines
        g.moveTo(x, laneY).lineTo(width / 2, height).stroke({ width: 1, color: 0x22d3ee, alpha: 0.04 })
      }

      // Línea de horizonte — el "suelo" del carril donde se apoyan unidades y bases.
      g.moveTo(0, laneY).lineTo(width, laneY).stroke({ width: 1, color: 0x67e8f9, alpha: 0.18 })
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

interface ImpactEffectState {
  id: string
  laneX: number
  damage: number
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

  // Registro efímero de ImpactEffect — mismo patrón que DeathEcho, disparado por caída de hp
  // tick-a-tick (unidad o base), nunca por la limpieza de reset().
  const impactEffectsRef = useRef<ImpactEffectState[]>([])
  const [impactEffects, setImpactEffects] = useState<ImpactEffectState[]>([])
  const impactIdCounterRef = useRef(0)

  // Un DeathEchoSprite se retira a sí mismo al terminar su cuenta regresiva — solo entonces
  // cambia la composición del registro (mismo patrón mount/unmount que activeUnits).
  const expireDeathEcho = useCallback((instanceId: string) => {
    const next = deathEchoesRef.current.filter((echo) => echo.instanceId !== instanceId)
    deathEchoesRef.current = next
    setDeathEchoes(next)
  }, [])

  const expireImpactEffect = useCallback((id: string) => {
    const next = impactEffectsRef.current.filter((effect) => effect.id !== id)
    impactEffectsRef.current = next
    setImpactEffects(next)
  }, [])

  useTick(({ deltaTime }) => {
    const deltaSeconds = deltaTime / 60
    const store = useGameStore.getState()
    const wasInProgress = store.status === 'InProgress'
    // Snapshot completo (con x/width) tomado antes del tick — es la única fuente de la última
    // posición conocida de una unidad que muere en este tick, porque tick() ya la elimina de `units`.
    const previousUnits = activeRef.current
    // specs/021-reskin-cyber-modern: hp "antes" de este tick, por instanceId — para detectar impactos
    // sin depender de un evento explícito del motor (Constitución § VI: el motor no sabe de Pixi).
    const previousHpById = new Map(store.units.map((unit) => [unit.instanceId, unit.hp]))
    const previousPlayerBaseHp = store.playerBase.hp
    const previousEnemyBaseHp = store.enemyBase.hp

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

    // Solo se generan ecos/impactos por muerte o daño tick-a-tick mientras la batalla está en curso
    // — nunca por la limpieza de reset() (data-model.md § DeathEcho, validation rules).
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

      // specs/021-reskin-cyber-modern: chispas/onda de choque/daño flotante — una unidad viva que
      // perdió hp este tick, o una base que perdió hp este tick.
      const newImpacts: ImpactEffectState[] = []
      for (const unit of freshStore.units) {
        const previousHp = previousHpById.get(unit.instanceId)
        if (previousHp !== undefined && previousHp - unit.hp > IMPACT_HP_EPSILON) {
          newImpacts.push({ id: `impact-${impactIdCounterRef.current++}`, laneX: unit.x, damage: previousHp - unit.hp })
        }
      }
      if (previousPlayerBaseHp - freshStore.playerBase.hp > IMPACT_HP_EPSILON) {
        newImpacts.push({ id: `impact-${impactIdCounterRef.current++}`, laneX: 0, damage: previousPlayerBaseHp - freshStore.playerBase.hp })
      }
      if (previousEnemyBaseHp - freshStore.enemyBase.hp > IMPACT_HP_EPSILON) {
        newImpacts.push({
          id: `impact-${impactIdCounterRef.current++}`,
          laneX: freshStore.laneLength,
          damage: previousEnemyBaseHp - freshStore.enemyBase.hp,
        })
      }
      if (newImpacts.length > 0) {
        impactEffectsRef.current = [...impactEffectsRef.current, ...newImpacts]
        setImpactEffects(impactEffectsRef.current)
      }
    } else if (freshStore.status !== 'InProgress') {
      if (deathEchoesRef.current.length > 0) {
        deathEchoesRef.current = []
        setDeathEchoes([])
      }
      if (impactEffectsRef.current.length > 0) {
        impactEffectsRef.current = []
        setImpactEffects([])
      }
    }

    if (!sameActiveUnits(activeRef.current, nextActiveUnits)) {
      activeRef.current = nextActiveUnits
      setActiveUnits(nextActiveUnits)
    }
  })

  return (
    <>
      <LaneBackground />
      <BaseTower role="ally" />
      <BaseTower role="enemy" />
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
      {impactEffects.map((effect) => (
        <ImpactEffect
          key={effect.id}
          id={effect.id}
          laneX={effect.laneX}
          damage={effect.damage}
          color={IMPACT_COLOR}
          onExpire={expireImpactEffect}
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
