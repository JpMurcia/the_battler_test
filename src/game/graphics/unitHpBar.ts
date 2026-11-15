import type { Graphics } from 'pixi.js'
import type { BattleUnit } from '../../engine/types'
import { getHpBarFillWidth } from './baseTower'
import { TEAM_INFO_COLOR } from './teamColors'

/**
 * specs/029-pulido-batalla-hud (US3). Barra de HP individual por unidad, dibujada sobre la cabeza del
 * cuerpo — mismo patrón de "track oscuro + relleno" que `drawBaseTowerHpBar`, pero con relleno sólido
 * (sin `PIXI.FillGradient`) para mantenerse testeable de forma directa (ver data-model.md § drawUnitHpBar).
 * El llamador ya calcula `fraction` con `getHpFraction` (importada de `./baseTower`) antes de invocar esta función.
 *
 * specs/042-unidades-mundo-cartoon (research.md Decisión 5): recibe solo el tamaño del cuerpo — antes recibía
 * el `CyberBodyLayout` del cuerpo "cyber" retirado, del que solo leía `bodyWidth`/`bodyHeight` (copiados tal
 * cual del `VisualProfile`), así que la geometría de la barra no cambia (FR-009).
 */

const BAR_HEIGHT = 3.5
const BAR_WIDTH_RATIO = 1.15
const BAR_Y_OFFSET_RATIO = 0.16

export interface UnitBodySize {
  bodyWidth: number
  bodyHeight: number
}

export function drawUnitHpBar(g: Graphics, body: UnitBodySize, team: BattleUnit['team'], fraction: number): void {
  const barWidth = body.bodyWidth * BAR_WIDTH_RATIO
  const x = (body.bodyWidth - barWidth) / 2
  const y = -body.bodyHeight * BAR_Y_OFFSET_RATIO

  g.clear()
  g.roundRect(x, y, barWidth, BAR_HEIGHT, BAR_HEIGHT / 2).fill({ color: 0x0b1220, alpha: 0.85 })

  const fillWidth = getHpBarFillWidth(fraction, barWidth)
  if (fillWidth > 0.5) {
    g.roundRect(x, y, fillWidth, BAR_HEIGHT, BAR_HEIGHT / 2).fill({ color: TEAM_INFO_COLOR[team] })
  }
}
