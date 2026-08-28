import type { Graphics } from 'pixi.js'
import type { BattleUnit } from '../../engine/types'
import { getHpBarFillWidth } from './baseTower'
import { CYBER_TEAM_COLOR, type CyberBodyLayout } from './cyberUnitBody'

/**
 * specs/029-pulido-batalla-hud (US3). Barra de HP individual por unidad, dibujada sobre la cabeza del
 * cuerpo Cyber-Modern (`CyberBodyLayout`) — mismo patrón de "track oscuro + relleno" que
 * `drawBaseTowerHpBar`, pero con relleno sólido (sin `PIXI.FillGradient`) para mantenerse testeable
 * de forma directa (ver data-model.md § drawUnitHpBar). El llamador ya calcula `fraction` con
 * `getHpFraction` (importada de `./baseTower`) antes de invocar esta función.
 */

const BAR_HEIGHT = 3.5
const BAR_WIDTH_RATIO = 1.15
const BAR_Y_OFFSET_RATIO = 0.16

export function drawUnitHpBar(g: Graphics, bodyLayout: CyberBodyLayout, team: BattleUnit['team'], fraction: number): void {
  const barWidth = bodyLayout.bodyWidth * BAR_WIDTH_RATIO
  const x = (bodyLayout.bodyWidth - barWidth) / 2
  const y = -bodyLayout.bodyHeight * BAR_Y_OFFSET_RATIO

  g.clear()
  g.roundRect(x, y, barWidth, BAR_HEIGHT, BAR_HEIGHT / 2).fill({ color: 0x0b1220, alpha: 0.85 })

  const fillWidth = getHpBarFillWidth(fraction, barWidth)
  if (fillWidth > 0.5) {
    g.roundRect(x, y, fillWidth, BAR_HEIGHT, BAR_HEIGHT / 2).fill({ color: CYBER_TEAM_COLOR[team] })
  }
}
