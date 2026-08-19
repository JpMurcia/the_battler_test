import { FillGradient, type Graphics } from 'pixi.js'
import type { BattleUnit } from '../../engine/types'
import type { VisualProfile } from '../animation'

/**
 * specs/021-reskin-cyber-modern (rediseño Cyber-Modern). Cuerpo Graphics compartido entre
 * `UnitSprite` (unidad viva, placeholder sin `spriteKey`/sin sprite real) y `DeathEchoSprite`
 * (unidad muerta, congelada) — antes duplicado casi idéntico en ambos archivos. Capas: sombra
 * vectorial → anillos de resplandor → cuerpo con gradiente de equipo → placas de armadura →
 * visor holográfico (geometría estática, el llamador anima su `alpha` por frame) → propulsor
 * trasero (misma idea). Sin dependencia de React — solo Pixi puro, consumido desde useCallback/ref
 * en los componentes (Constitución § VI: nada de esto se re-renderiza por el tick de combate).
 */

export const CYBER_TEAM_COLOR: Record<BattleUnit['team'], number> = {
  Player: 0x22d3ee, // cian
  Enemy: 0xef4444, // rojo
}

const GLOW_RING_COUNT = 3
const GLOW_RING_STEP_PX = 4

export interface CyberBodyLayout {
  bodyWidth: number
  bodyHeight: number
  cornerRadius: number
  shadow: { cx: number; cy: number; rx: number; ry: number }
  armorPlateLeft: { x: number; y: number; width: number; height: number; radius: number }
  armorPlateRight: { x: number; y: number; width: number; height: number; radius: number }
  visor: { x: number; y: number; width: number; height: number; radius: number }
  thruster: number[]
  antenna: { x: number; y: number; radius: number }
}

/** Deriva toda la geometría del cuerpo a partir del `VisualProfile` ya existente — determinista, sin Pixi. */
export function computeCyberBodyLayout(profile: Pick<VisualProfile, 'bodyWidth' | 'bodyHeight' | 'cornerRadius'>): CyberBodyLayout {
  const { bodyWidth, bodyHeight, cornerRadius } = profile
  const plateWidth = bodyWidth * 0.22
  const plateHeight = bodyHeight * 0.4
  return {
    bodyWidth,
    bodyHeight,
    cornerRadius,
    shadow: { cx: bodyWidth / 2, cy: bodyHeight + 3, rx: bodyWidth * 0.55, ry: bodyHeight * 0.16 },
    armorPlateLeft: { x: -plateWidth * 0.3, y: bodyHeight * 0.08, width: plateWidth, height: plateHeight, radius: plateWidth * 0.3 },
    armorPlateRight: {
      x: bodyWidth - plateWidth * 0.7,
      y: bodyHeight * 0.08,
      width: plateWidth,
      height: plateHeight,
      radius: plateWidth * 0.3,
    },
    visor: { x: bodyWidth * 0.12, y: bodyHeight * 0.12, width: bodyWidth * 0.76, height: bodyHeight * 0.22, radius: bodyHeight * 0.08 },
    // Triángulo de propulsor asomando por el borde trasero (x=0, convención "mirando a la derecha" — el flip de
    // equipo enemigo se aplica como scale.x=-1 en el Container padre, nunca redibujando esta geometría).
    thruster: [0, bodyHeight * 0.32, -bodyWidth * 0.22, bodyHeight * 0.5, 0, bodyHeight * 0.68],
    antenna: { x: bodyWidth * 0.82, y: -bodyHeight * 0.06, radius: Math.max(1.5, bodyWidth * 0.05) },
  }
}

/** Aclara un color 0xRRGGBB — mismo helper que src/game/graphics/unitFactory.ts, sin compartir módulo por ser trivial. */
function lighten(color: number, amount: number): number {
  const clampChannel = (channel: number) => Math.max(0, Math.min(255, channel + amount))
  const r = clampChannel((color >> 16) & 0xff)
  const g = clampChannel((color >> 8) & 0xff)
  const b = clampChannel(color & 0xff)
  return (r << 16) + (g << 8) + b
}

/** Anillos concéntricos de resplandor por equipo — sin paquete de filtros (specs/021 research.md Decisión 4). */
function drawGlowRings(g: Graphics, layout: CyberBodyLayout, teamColor: number): void {
  for (let ring = GLOW_RING_COUNT; ring >= 1; ring -= 1) {
    const expand = ring * GLOW_RING_STEP_PX
    g.roundRect(-expand, -expand, layout.bodyWidth + expand * 2, layout.bodyHeight + expand * 2, layout.cornerRadius + expand).stroke({
      width: 2,
      color: teamColor,
      alpha: 0.16 / ring,
    })
  }
}

export interface CyberBodyOptions {
  /** DeathEcho: cuerpo apagado/sin vida — colores desaturados, sin anillos de resplandor. */
  dimmed?: boolean
}

/**
 * Capas estáticas del cuerpo — sombra, anillos, relleno con gradiente de equipo, placas de armadura.
 * Se dibuja una sola vez (useCallback memoizado por profile/team), nunca redibujado por frame.
 */
export function drawCyberBodyBase(g: Graphics, layout: CyberBodyLayout, team: BattleUnit['team'], accentColor: number, options: CyberBodyOptions = {}): void {
  const teamColor = CYBER_TEAM_COLOR[team]
  const bodyColor = options.dimmed ? 0x4b5563 : teamColor
  const bodyColorDark = options.dimmed ? 0x1f2937 : lighten(teamColor, -70)

  g.clear()

  g.ellipse(layout.shadow.cx, layout.shadow.cy, layout.shadow.rx, layout.shadow.ry).fill({ color: 0x000000, alpha: 0.35 })

  if (!options.dimmed) drawGlowRings(g, layout, teamColor)

  const bodyGradient = new FillGradient({
    type: 'linear',
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
    textureSpace: 'local',
    colorStops: [
      { offset: 0, color: bodyColor },
      { offset: 1, color: bodyColorDark },
    ],
  })

  g.roundRect(0, 0, layout.bodyWidth, layout.bodyHeight, layout.cornerRadius)
    .fill({ fill: bodyGradient })
    .roundRect(0, layout.bodyHeight * 0.62, layout.bodyWidth, layout.bodyHeight * 0.38, layout.cornerRadius)
    .fill({ color: options.dimmed ? 0x374151 : accentColor })

  const plateColor = options.dimmed ? 0x1f2937 : 0x334155
  g.roundRect(layout.armorPlateLeft.x, layout.armorPlateLeft.y, layout.armorPlateLeft.width, layout.armorPlateLeft.height, layout.armorPlateLeft.radius).fill({
    color: plateColor,
    alpha: 0.92,
  })
  g.roundRect(
    layout.armorPlateRight.x,
    layout.armorPlateRight.y,
    layout.armorPlateRight.width,
    layout.armorPlateRight.height,
    layout.armorPlateRight.radius,
  ).fill({ color: plateColor, alpha: 0.92 })

  g.circle(layout.antenna.x, layout.antenna.y, layout.antenna.radius).fill({ color: options.dimmed ? 0x374151 : 0xe2e8f0 })
}

/** Visor holográfico — geometría fija dibujada una sola vez; el llamador anima `.alpha` por frame (sin redraw). */
export function drawCyberVisor(g: Graphics, layout: CyberBodyLayout, team: BattleUnit['team'], options: CyberBodyOptions = {}): void {
  const glowColor = options.dimmed ? 0x6b7280 : lighten(CYBER_TEAM_COLOR[team], 60)
  g.clear()
  g.roundRect(layout.visor.x, layout.visor.y, layout.visor.width, layout.visor.height, layout.visor.radius).fill({
    color: 0x0b1220,
    alpha: 0.75,
  })
  g.roundRect(
    layout.visor.x + layout.visor.width * 0.08,
    layout.visor.y + layout.visor.height * 0.28,
    layout.visor.width * 0.84,
    layout.visor.height * 0.44,
    layout.visor.height * 0.2,
  ).fill({ color: glowColor })
}

/** Propulsor trasero — misma idea que el visor: geometría fija, alpha/escala animados por el llamador. */
export function drawCyberThruster(g: Graphics, layout: CyberBodyLayout, team: BattleUnit['team'], options: CyberBodyOptions = {}): void {
  const flameColor = options.dimmed ? 0x4b5563 : lighten(CYBER_TEAM_COLOR[team], 40)
  g.clear()
  g.poly(layout.thruster).fill({ color: flameColor, alpha: 0.85 })
}

/**
 * Pulso sinusoidal 0-1 remapeado a `[min,max]` — usado para animar `.alpha` de capas ya dibujadas
 * (visor "ojos animados", propulsor con parpadeo) sin redibujar Graphics por frame. Pura, testeable.
 */
export function getGlowPulseAlpha(elapsedSeconds: number, frequencyHz: number, min = 0.55, max = 1): number {
  const wave = (Math.sin(elapsedSeconds * frequencyHz * Math.PI * 2) + 1) / 2
  return min + wave * (max - min)
}
