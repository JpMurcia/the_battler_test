import type { Graphics } from 'pixi.js'
import type { BattleUnit } from '../../engine/types'
import { TEAM_INFO_COLOR } from './teamColors'

/**
 * specs/042-unidades-mundo-cartoon (US2/FR-008, research.md Decisión 4; data-model.md § 4). Anillo de equipo bajo los
 * pies de cada unidad viva: la señal de bando que antes daba el neón del cuerpo, ahora en la capa de información
 * (biblia de arte §5). Estático — se dibuja una sola vez y por fotograma solo se mueve (Constitución § VI). El
 * resplandor son trazos concéntricos del mismo color con alfa bajo, sin filtros (misma técnica que specs/021).
 */

const RING_WIDTH_RATIO = 0.62
const RING_HEIGHT_RATIO = 0.2
const RING_MIN_RY = 2
const RING_MAX_RY = 6

/** De fuera hacia dentro: dos trazos de resplandor y el trazo principal. */
const RING_STROKES = [
  { width: 5, alpha: 0.1 },
  { width: 3, alpha: 0.22 },
  { width: 1.25, alpha: 0.95 },
] as const

export interface TeamRingGeometry {
  /** Centro en x, en coordenadas locales del anillo (el cuerpo ocupa [0, bodyWidth]). */
  cx: number
  rx: number
  ry: number
}

/** Proporcional al ancho del cuerpo, con un alto acotado para que no tape la silueta (FR-008, edge case de 14 px). */
export function computeTeamRingGeometry(bodyWidth: number): TeamRingGeometry {
  return {
    cx: bodyWidth / 2,
    rx: bodyWidth * RING_WIDTH_RATIO,
    ry: Math.min(RING_MAX_RY, Math.max(RING_MIN_RY, bodyWidth * RING_HEIGHT_RATIO)),
  }
}

export function drawTeamRing(g: Graphics, geometry: TeamRingGeometry, team: BattleUnit['team']): void {
  const color = TEAM_INFO_COLOR[team]
  g.clear()
  for (const { width, alpha } of RING_STROKES) {
    g.ellipse(geometry.cx, 0, geometry.rx, geometry.ry).stroke({ width, color, alpha })
  }
}
