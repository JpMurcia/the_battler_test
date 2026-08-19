import { extend, useApplication, useTick } from '@pixi/react'
import { Container, Graphics, Sprite, type Texture } from 'pixi.js'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CATS } from '../data/cats'
import type { BattleUnit } from '../engine/types'
import { getDeathEchoDurationSeconds, getDeathEchoPose, getVisualProfile } from './animation'
import { computeCyberBodyLayout, drawCyberBodyBase } from './graphics/cyberUnitBody'
import { getLaneScreenX, getLaneScreenY } from './graphics/layout'
import { useGameStore } from '../state/useGameStore'
import { loadSpriteTextures, resolveSpriteAnimationSet } from './spriteAssets'

extend({ Container, Graphics, Sprite })

interface DeathEchoSpriteProps {
  instanceId: string
  catId: string
  team: BattleUnit['team']
  x: number
  onExpire: (instanceId: string) => void
}

/**
 * Señal visual efímera de derrota — cuerpo congelado en su última posición conocida que se
 * encoge y desvanece hasta desaparecer. Vive fuera de useGameStore/SimState por completo
 * (specs/003-identidad-visual-animada/data-model.md § DeathEcho); se retira a sí mismo del
 * registro de BattleField llamando a onExpire al llegar a remainingSeconds === 0.
 *
 * specs/021-reskin-cyber-modern (US4): si `catId` tiene `spriteKey` con carga exitosa, el cuerpo
 * congelado usa el primer frame de reposo (`idle[0]`) en vez del `Graphics` placeholder — sin
 * arte de "muerte" propio en esta spec (data-model.md § Rendering). Fallback igual que UnitSprite.
 */
export function DeathEchoSprite({ instanceId, catId, team, x, onExpire }: DeathEchoSpriteProps) {
  const { app } = useApplication()
  const containerRef = useRef<Container>(null)
  const remainingRef = useRef(getDeathEchoDurationSeconds())

  const cat = useMemo(() => CATS.find((candidate) => candidate.id === catId), [catId])
  const profile = useMemo(() => (cat ? getVisualProfile(cat) : null), [cat])
  const animationSet = useMemo(() => resolveSpriteAnimationSet(cat?.spriteKey), [cat])
  const bodyLayout = useMemo(() => (profile ? computeCyberBodyLayout(profile) : null), [profile])

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

  // specs/021-reskin-cyber-modern: cuerpo "apagado" (dimmed) — desatura el gradiente de equipo y
  // suprime los anillos de resplandor, visualmente distinto de una unidad viva (sin visor/propulsor:
  // un casco inerte, no un droide todavía activo).
  const drawBody = useCallback(
    (g: Graphics) => {
      if (!profile || !bodyLayout) return
      drawCyberBodyBase(g, bodyLayout, team, profile.accentColor, { dimmed: true })
    },
    [profile, bodyLayout, team],
  )

  useTick(({ deltaMS }) => {
    const container = containerRef.current
    if (!container) return

    remainingRef.current -= deltaMS / 1000
    if (remainingRef.current <= 0) {
      onExpire(instanceId)
      return
    }

    const pose = getDeathEchoPose(remainingRef.current)
    container.scale.set(pose.scale)
    container.alpha = pose.alpha
  })

  if (!profile) return null

  return (
    <pixiContainer ref={containerRef} x={screenX} y={screenY} pivot={{ x: 0, y: profile.bodyHeight }}>
      {idleFrame ? (
        <pixiSprite
          texture={idleFrame}
          width={profile.bodyWidth}
          height={profile.bodyHeight}
          anchor={{ x: team === 'Enemy' ? 1 : 0, y: 0 }}
          scale={{ x: team === 'Enemy' ? -1 : 1, y: 1 }}
        />
      ) : (
        <pixiGraphics draw={drawBody} />
      )}
    </pixiContainer>
  )
}
