import { extend, useTick } from '@pixi/react'
import { Container, Graphics } from 'pixi.js'
import { useCallback, useMemo, useRef } from 'react'
import { CATS } from '../data/cats'
import type { BattleUnit } from '../engine/types'
import { useGameStore } from '../state/useGameStore'
import { getAnimationPose, getAnimationState, getVisualProfile } from './animation'

extend({ Container, Graphics })

const TEAM_COLOR: Record<BattleUnit['team'], number> = {
  Player: 0x3b82f6, // azul
  Enemy: 0xef4444, // rojo
}

interface UnitSpriteProps {
  instanceId: string
  catId: string
  team: BattleUnit['team']
}

/**
 * Representación visual animada de una BattleUnit — el cuerpo se dibuja una sola vez (por
 * catId/team, que nunca cambian tras el spawn); la posición y la animación de idle/ataque se
 * aplican por transform en cada frame vía un useTick propio que lee la unidad fresca directo de
 * useGameStore, sin pasar por props/re-render de React (specs/003-identidad-visual-animada/research.md
 * Decisión 2/3). Cierra la excepción a Constitución § III declarada en specs/002-motor-de-combate/plan.md.
 */
export function UnitSprite({ instanceId, catId, team }: UnitSpriteProps) {
  const containerRef = useRef<Container>(null)
  // Offset aleatorio por instancia para que el bob de idle de varias unidades no quede sincronizado.
  const clockRef = useRef(Math.random() * 10)

  const cat = useMemo(() => CATS.find((candidate) => candidate.id === catId), [catId])
  const profile = useMemo(() => (cat ? getVisualProfile(cat) : null), [cat])

  const drawBody = useCallback(
    (g: Graphics) => {
      if (!profile) return
      g.clear()
      g.roundRect(0, 0, profile.bodyWidth, profile.bodyHeight, profile.cornerRadius)
        .fill(TEAM_COLOR[team])
        .roundRect(0, profile.bodyHeight * 0.62, profile.bodyWidth, profile.bodyHeight * 0.38, profile.cornerRadius)
        .fill(profile.accentColor)
    },
    [profile, team],
  )

  useTick(({ deltaMS }) => {
    const container = containerRef.current
    if (!profile || !container) return

    const unit = useGameStore.getState().units.find((candidate) => candidate.instanceId === instanceId)
    if (!unit) return

    clockRef.current += deltaMS / 1000

    const animationState = getAnimationState(unit.state)
    const pose = getAnimationPose(animationState, profile, clockRef.current, unit.attackCooldownRemaining)

    container.x = unit.x
    container.y = pose.bobOffsetY
    container.scale.set(pose.scaleX, pose.scaleY)
    container.rotation = pose.rotationRadians
  })

  if (!profile) return null

  return (
    <pixiContainer ref={containerRef} pivot={{ x: 0, y: profile.bodyHeight }}>
      <pixiGraphics draw={drawBody} />
    </pixiContainer>
  )
}
