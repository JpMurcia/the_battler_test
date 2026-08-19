import { extend, useApplication, useTick } from '@pixi/react'
import { Container, Graphics, Text } from 'pixi.js'
import { useCallback, useMemo, useRef } from 'react'
import {
  getFloatingDamageDurationSeconds,
  getFloatingDamagePose,
  getShockwavePose,
  getSparkCount,
  getSparkPose,
} from './graphics/cyberEffects'
import { getLaneScreenX, getLaneScreenY } from './graphics/layout'
import { useGameStore } from '../state/useGameStore'

extend({ Container, Graphics, Text })

const SHOCKWAVE_MAX_RADIUS = 16
const SPARK_MAX_DISTANCE = 14
/** Altura a la que "impacta" visualmente respecto a la línea de carril — aprox. torso de una unidad. */
const IMPACT_Y_OFFSET = -14

interface ImpactEffectProps {
  id: string
  /** Coordenada `x` del carril de simulación (misma convención que UnitSprite/DeathEchoSprite). */
  laneX: number
  damage: number
  color: number
  onExpire: (id: string) => void
}

/**
 * specs/021-reskin-cyber-modern (rediseño Cyber-Modern): efecto de impacto efímero — onda de choque
 * (círculo que se expande y desvanece), ráfaga de chispas radiales, y texto de daño flotante. Se
 * dispara desde `BattleField` al detectar una caída de hp tick-a-tick (unidad o base) y se retira a
 * sí mismo vía `onExpire`, mismo patrón que `DeathEchoSprite` — nunca vive en useGameStore/SimState.
 */
export function ImpactEffect({ id, laneX, damage, color, onExpire }: ImpactEffectProps) {
  const { app } = useApplication()
  const elapsedRef = useRef(0)
  const shockwaveRef = useRef<Graphics>(null)
  const sparkRefs = useRef<(Graphics | null)[]>([])
  const textRef = useRef<Text>(null)

  const sparkCount = useMemo(() => getSparkCount(), [])

  // El getter `app.screen` hace `this.renderer.screen` internamente — hay que comprobar
  // `app?.renderer` (no `app?.screen`, que ya invoca el getter y puede lanzar) antes de tocarlo, por
  // si este efecto llegase a montar en el mismo commit inicial que <Application> (ver LaneBackground).
  // En la práctica un ImpactEffect solo se crea desde dentro de un useTick ya en marcha, pero el
  // guard cuesta una línea y evita el mismo crash.
  const screenX = useMemo(
    () => (app?.renderer ? getLaneScreenX(laneX, useGameStore.getState().laneLength, app.screen.width) : 0),
    [laneX, app],
  )
  const screenY = useMemo(() => (app?.renderer ? getLaneScreenY(app.screen.height) + IMPACT_Y_OFFSET : 0), [app])

  const drawShockwave = useCallback(
    (g: Graphics) => {
      g.clear()
      g.circle(0, 0, 1).stroke({ width: 2, color })
    },
    [color],
  )

  const drawSpark = useCallback(
    (g: Graphics) => {
      g.clear()
      g.circle(0, 0, 2).fill({ color: 0xffffff })
      g.circle(0, 0, 1).fill({ color })
    },
    [color],
  )

  useTick(({ deltaMS }) => {
    elapsedRef.current += deltaMS / 1000
    const elapsed = elapsedRef.current

    if (elapsed >= getFloatingDamageDurationSeconds()) {
      onExpire(id)
      return
    }

    if (shockwaveRef.current) {
      const pose = getShockwavePose(elapsed, SHOCKWAVE_MAX_RADIUS)
      shockwaveRef.current.scale.set(Math.max(0.01, pose.radius))
      shockwaveRef.current.alpha = pose.alpha
    }

    for (let index = 0; index < sparkCount; index += 1) {
      const spark = sparkRefs.current[index]
      if (!spark) continue
      const pose = getSparkPose(elapsed, index, sparkCount, SPARK_MAX_DISTANCE)
      spark.x = pose.offsetX
      spark.y = pose.offsetY
      spark.alpha = pose.alpha
      spark.scale.set(pose.scale)
    }

    if (textRef.current) {
      const pose = getFloatingDamagePose(elapsed)
      textRef.current.y = pose.offsetY
      textRef.current.alpha = pose.alpha
    }
  })

  return (
    <pixiContainer x={screenX} y={screenY}>
      <pixiGraphics ref={shockwaveRef} draw={drawShockwave} />
      {Array.from({ length: sparkCount }, (_unused, index) => (
        <pixiGraphics
          key={index}
          ref={(instance) => {
            sparkRefs.current[index] = instance
          }}
          draw={drawSpark}
        />
      ))}
      <pixiText
        ref={textRef}
        text={`-${Math.max(1, Math.round(damage))}`}
        anchor={{ x: 0.5, y: 1 }}
        style={{ fontSize: 12, fontWeight: 'bold', fill: 0xffffff, stroke: { color: 0x000000, width: 3 } }}
      />
    </pixiContainer>
  )
}
