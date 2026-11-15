import { extend, useApplication, useTick } from '@pixi/react'
import { Container, Sprite, type Texture } from 'pixi.js'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CATS } from '../data/cats'
import { resolveUnitDesign } from '../data/unitDesigns'
import type { BattleUnit } from '../engine/types'
import { getVisualProfile } from './animation'
import { EVENT_ANIMATION, getDeathPose } from './eventAnimations'
import { getLaneScreenX, getLaneScreenY } from './graphics/layout'
import { getOrCreateUnitTexture } from './graphics/unitFactory'
import { prefersReducedMotion } from './motionPreference'
import { useGameStore } from '../state/useGameStore'
import { loadSpriteTextures, resolveSpriteAnimationSet } from './spriteAssets'

extend({ Container, Sprite })

/**
 * specs/042-unidades-mundo-cartoon (US4/FR-010, research.md Decisión 6): tinte multiplicativo que apaga el dibujo
 * cartoon del eco sin redibujarlo ni generar otra textura — misma forma, tonos apagados, sin brillo.
 */
export const ECHO_TINT = 0x8a8f99

interface DeathEchoSpriteProps {
  instanceId: string
  catId: string
  team: BattleUnit['team']
  x: number
  onExpire: (instanceId: string) => void
}

/**
 * Señal visual efímera de derrota — cuerpo congelado en su última posición conocida que sale
 * despedido hacia su propia base, gira y se desvanece (specs/044-animaciones-de-evento US2/FR-003,
 * que sustituye al encogimiento de specs/003). Con «reducir movimiento» solo se desvanece. El pivote
 * está en el centro de los pies para que el giro no desplace el punto de partida (research.md Decisión 7). Vive fuera de useGameStore/SimState por completo
 * (specs/003-identidad-visual-animada/data-model.md § DeathEcho); se retira a sí mismo del
 * registro de BattleField llamando a onExpire al llegar a remainingSeconds === 0.
 *
 * specs/021-reskin-cyber-modern (US4): si `catId` tiene `spriteKey` con carga exitosa, el cuerpo
 * congelado usa el primer frame de reposo (`idle[0]`) — sin arte de "muerte" propio.
 *
 * specs/042-unidades-mundo-cartoon (US4/FR-010): en cualquier otro caso el cuerpo es la misma textura
 * cartoon cacheada de la unidad viva (mismo diseño, misma clave de caché), apagada con `ECHO_TINT` — nunca el
 * cuerpo "cyber" retirado. El eco no lleva anillo de equipo.
 */
export function DeathEchoSprite({ instanceId, catId, team, x, onExpire }: DeathEchoSpriteProps) {
  const { app } = useApplication()
  const containerRef = useRef<Container>(null)
  const elapsedRef = useRef(0)

  const cat = useMemo(() => CATS.find((candidate) => candidate.id === catId), [catId])
  const profile = useMemo(() => (cat ? getVisualProfile(cat) : null), [cat])
  const animationSet = useMemo(() => resolveSpriteAnimationSet(cat?.spriteKey), [cat])
  const design = useMemo(() => resolveUnitDesign(catId), [catId])

  // specs/021-reskin-cyber-modern: `x` llega en coordenadas del carril de simulación (misma
  // convención que UnitSprite) — un DeathEcho no se mueve, así que el mapeo a pantalla se calcula
  // una sola vez al montar (su vida útil es de 0.35s, un resize en esa ventana es irrelevante).
  // El getter `app.screen` hace `this.renderer.screen` internamente — hay que comprobar
  // `app?.renderer` (no `app?.screen`, que ya invoca el getter y puede lanzar) por si este eco
  // llegase a montar en el mismo commit inicial que <Application> (ver LaneBackground). En la
  // práctica solo se crea desde dentro de un useTick ya en marcha, pero el guard cuesta una línea.
  const screenX = useMemo(
    () => (app?.renderer ? getLaneScreenX(x, useGameStore.getState().laneLength, app.screen.width) : 0),
    [x, app],
  )
  const screenY = useMemo(() => (app?.renderer ? getLaneScreenY(app.screen.height) : 0), [app])

  const [idleFrame, setIdleFrame] = useState<Texture | null>(null)

  useEffect(() => {
    if (!animationSet) {
      setIdleFrame(null)
      return
    }
    let cancelled = false
    loadSpriteTextures(animationSet.idle)
      .then((frames) => {
        if (!cancelled) setIdleFrame(frames[0] ?? null)
      })
      .catch(() => {
        if (!cancelled) setIdleFrame(null)
      })
    return () => {
      cancelled = true
    }
  }, [animationSet])

  // specs/042: misma textura (y misma clave de caché) que la unidad viva — un eco no genera ninguna textura nueva.
  const designTexture = useMemo(() => {
    if (idleFrame || !design || !app?.renderer) return null
    return getOrCreateUnitTexture(app.renderer, catId, design, team === 'Player' ? 'ally' : 'enemy')
  }, [idleFrame, design, app, catId, team])

  useTick(({ deltaMS }) => {
    const container = containerRef.current
    if (!container || !profile) return

    elapsedRef.current += deltaMS / 1000
    if (elapsedRef.current >= EVENT_ANIMATION.deathSeconds) {
      onExpire(instanceId)
      return
    }

    const pose = getDeathPose(elapsedRef.current, team, prefersReducedMotion())
    container.x = screenX + profile.bodyWidth / 2 + pose.offsetX
    container.y = screenY + pose.offsetY
    container.rotation = pose.rotation
    container.alpha = pose.alpha
  })

  if (!profile) return null

  const body = idleFrame ?? designTexture

  return (
    <pixiContainer
      ref={containerRef}
      x={screenX + profile.bodyWidth / 2}
      y={screenY}
      pivot={{ x: profile.bodyWidth / 2, y: profile.bodyHeight }}
    >
      {body ? (
        <pixiSprite
          texture={body}
          width={profile.bodyWidth}
          height={profile.bodyHeight}
          anchor={{ x: team === 'Enemy' ? 1 : 0, y: 0 }}
          scale={{ x: team === 'Enemy' ? -1 : 1, y: 1 }}
          // El fotograma de un sprite no cambia (FR-010); solo el dibujo cartoon se apaga.
          tint={idleFrame ? 0xffffff : ECHO_TINT}
        />
      ) : null}
    </pixiContainer>
  )
}
