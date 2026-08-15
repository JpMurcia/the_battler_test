import { extend } from '@pixi/react'
import { Graphics } from 'pixi.js'
import { useCallback } from 'react'
import type { BattleUnit } from '../engine/types'

extend({ Graphics })

const UNIT_HEIGHT = 24
const TEAM_COLOR: Record<BattleUnit['team'], number> = {
  Player: 0x3b82f6, // azul
  Enemy: 0xef4444, // rojo
}

interface UnitSpriteProps {
  unit: BattleUnit
}

/**
 * Representación visual mínima de una BattleUnit — rectángulo de color por equipo, sin animación real.
 * Excepción declarada a Constitución § III (Identidad Visual Animada), ver plan.md § Complexity Tracking.
 */
export function UnitSprite({ unit }: UnitSpriteProps) {
  const draw = useCallback(
    (g: Graphics) => {
      g.clear()
      g.rect(0, 0, unit.width, UNIT_HEIGHT).fill(TEAM_COLOR[unit.team])
    },
    [unit.team, unit.width],
  )

  return <pixiGraphics draw={draw} x={unit.x} y={0} />
}
