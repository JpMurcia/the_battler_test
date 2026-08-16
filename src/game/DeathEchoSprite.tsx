import { extend, useTick } from '@pixi/react'
import { Container, Graphics, Sprite, type Texture } from 'pixi.js'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CATS } from '../data/cats'
import type { BattleUnit } from '../engine/types'
import { getDeathEchoDurationSeconds, getDeathEchoPose, getVisualProfile } from './animation'
import { loadSpriteTextures, resolveSpriteAnimationSet } from './spriteAssets'

extend({ Container, Graphics, Sprite })

// specs/021-reskin-cyber-modern (research.md Decisión 4): mismos colores de equipo que UnitSprite.
const TEAM_COLOR: Record<BattleUnit['team'], number> = {
  Player: 0x22d3ee,
  Enemy: 0xef4444,
}

const GLOW_RING_COUNT = 3
const GLOW_RING_STEP_PX = 4

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
  const containerRef = useRef<Container>(null)
  const remainingRef = useRef(getDeathEchoDurationSeconds())

  const cat = useMemo(() => CATS.find((candidate) => candidate.id === catId), [catId])
  const profile = useMemo(() => (cat ? getVisualProfile(cat) : null), [cat])
  const animationSet = useMemo(() => resolveSpriteAnimationSet(cat?.spriteKey), [cat])

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

  const drawBody = useCallback(
    (g: Graphics) => {
      if (!profile) return
      g.clear()
      for (let ring = GLOW_RING_COUNT; ring >= 1; ring -= 1) {
        const expand = ring * GLOW_RING_STEP_PX
        g.roundRect(
          -expand,
          -expand,
          profile.bodyWidth + expand * 2,
          profile.bodyHeight + expand * 2,
          profile.cornerRadius + expand,
        ).stroke({ width: 2, color: TEAM_COLOR[team], alpha: 0.16 / ring })
      }
      g.roundRect(0, 0, profile.bodyWidth, profile.bodyHeight, profile.cornerRadius)
        .fill(TEAM_COLOR[team])
        .roundRect(0, profile.bodyHeight * 0.62, profile.bodyWidth, profile.bodyHeight * 0.38, profile.cornerRadius)
        .fill(profile.accentColor)
    },
    [profile, team],
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
    <pixiContainer ref={containerRef} x={x} pivot={{ x: 0, y: profile.bodyHeight }}>
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
