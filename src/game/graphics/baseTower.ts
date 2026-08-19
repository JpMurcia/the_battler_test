import { FillGradient, type Graphics } from 'pixi.js'

/**
 * specs/021-reskin-cyber-modern (rediseño Cyber-Modern). Geometría y dibujo de la Base Aliada
 * ("Torre Gato Cyber") y la Base Enemiga — capas de profundidad en `PIXI.Container` (plataforma →
 * cuerpo de torre con gradiente → orejas/púas → torreta que rota → baliza) más una barra de HP con
 * gradiente neón redibujada solo cuando la fracción cambia perceptiblemente. Sin dependencia de
 * React (Constitución § VI) — consumido desde `BaseTower.tsx` vía refs/useTick, nunca por prop.
 */

export type BaseTowerRole = 'ally' | 'enemy'

export const BASE_TOWER_WIDTH = 46
export const BASE_TOWER_HEIGHT = 70
export const TURRET_ROTATION_SPEED_RAD_PER_SEC = 0.5

const TOWER_COLOR: Record<BaseTowerRole, { top: number; bottom: number; rim: number }> = {
  ally: { top: 0x22d3ee, bottom: 0x0e5a68, rim: 0x67e8f9 },
  enemy: { top: 0xef4444, bottom: 0x6b1414, rim: 0xfca5a5 },
}

export interface BaseTowerLayout {
  width: number
  height: number
  platform: { x: number; y: number; width: number; height: number; radius: number }
  towerBody: { x: number; y: number; width: number; height: number; radius: number }
  crown: number[]
  turretPivot: { x: number; y: number }
  turretHead: { radius: number; barrelLength: number; barrelWidth: number }
  beacon: { x: number; y: number; radius: number }
  hpBar: { x: number; y: number; width: number; height: number }
  shieldRadius: number
}

/** Geometría fija — sin parámetros porque la torre tiene un tamaño constante en pantalla (no escala con stats). */
export function computeBaseTowerLayout(): BaseTowerLayout {
  const width = BASE_TOWER_WIDTH
  const height = BASE_TOWER_HEIGHT
  const bodyWidth = width * 0.62
  const bodyHeight = height * 0.62
  const bodyX = (width - bodyWidth) / 2
  const bodyY = height - bodyHeight - height * 0.14

  return {
    width,
    height,
    platform: { x: 0, y: height - height * 0.16, width, height: height * 0.16, radius: 4 },
    towerBody: { x: bodyX, y: bodyY, width: bodyWidth, height: bodyHeight, radius: 6 },
    // Silueta de "orejas" (base aliada) / púas (base enemiga) — mismo arreglo de puntos sirve para
    // ambas, la diferencia visual real está en el color de equipo (TOWER_COLOR) y el nº de puntas
    // dibujado por drawBaseTowerCrown.
    crown: [bodyX, bodyY, bodyX + bodyWidth * 0.22, bodyY - height * 0.16, bodyX + bodyWidth * 0.42, bodyY],
    turretPivot: { x: width / 2, y: bodyY + bodyHeight * 0.32 },
    turretHead: { radius: bodyWidth * 0.26, barrelLength: bodyWidth * 0.55, barrelWidth: bodyWidth * 0.16 },
    beacon: { x: width / 2, y: bodyY - height * 0.2, radius: 2.4 },
    hpBar: { x: -width * 0.15, y: -height * 0.22, width: width * 1.3, height: 6 },
    shieldRadius: Math.max(bodyWidth, bodyHeight) * 0.9,
  }
}

/** Fracción de HP `[0,1]`, con las mismas reglas de recorte que el resto del HUD (playerBase/enemyBase). */
export function getHpFraction(hp: number, maxHp: number): number {
  if (maxHp <= 0) return 0
  return Math.min(1, Math.max(0, hp / maxHp))
}

/** Ancho en píxeles de relleno de la barra de HP para una fracción dada — usado tanto al dibujar como en tests. */
export function getHpBarFillWidth(hpFraction: number, barWidth: number): number {
  return barWidth * Math.min(1, Math.max(0, hpFraction))
}

/** Plataforma + cuerpo de torre (gradiente de equipo) + corona (orejas/púas) — capas estáticas, un solo draw. */
export function drawBaseTowerBody(g: Graphics, layout: BaseTowerLayout, role: BaseTowerRole): void {
  const colors = TOWER_COLOR[role]
  g.clear()

  // Plataforma — base metálica oscura, común a ambos equipos.
  g.roundRect(layout.platform.x, layout.platform.y, layout.platform.width, layout.platform.height, layout.platform.radius).fill({
    color: 0x111827,
  })

  const bodyGradient = new FillGradient({
    type: 'linear',
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
    textureSpace: 'local',
    colorStops: [
      { offset: 0, color: colors.top },
      { offset: 1, color: colors.bottom },
    ],
  })

  g.roundRect(layout.towerBody.x, layout.towerBody.y, layout.towerBody.width, layout.towerBody.height, layout.towerBody.radius)
    .fill({ fill: bodyGradient })
    .roundRect(layout.towerBody.x, layout.towerBody.y, layout.towerBody.width, layout.towerBody.height, layout.towerBody.radius)
    .stroke({ width: 1.5, color: colors.rim, alpha: 0.8 })

  // Corona: 2 orejas de gato (ally) o 3 púas más angulosas (enemy) — misma franja superior del cuerpo.
  const bx = layout.towerBody.x
  const by = layout.towerBody.y
  const bw = layout.towerBody.width
  const spikeHeight = layout.height * 0.16
  if (role === 'ally') {
    g.poly([bx + bw * 0.08, by, bx + bw * 0.08 - bw * 0.14, by - spikeHeight, bx + bw * 0.3, by]).fill(colors.top)
    g.poly([bx + bw * 0.92, by, bx + bw * 0.92 + bw * 0.14, by - spikeHeight, bx + bw * 0.7, by]).fill(colors.top)
  } else {
    g.poly([bx + bw * 0.1, by, bx + bw * 0.22, by - spikeHeight * 1.3, bx + bw * 0.34, by]).fill(colors.top)
    g.poly([bx + bw * 0.38, by, bx + bw * 0.5, by - spikeHeight * 1.7, bx + bw * 0.62, by]).fill(colors.top)
    g.poly([bx + bw * 0.66, by, bx + bw * 0.78, by - spikeHeight * 1.3, bx + bw * 0.9, by]).fill(colors.top)
  }

  g.circle(layout.beacon.x, layout.beacon.y, layout.beacon.radius).fill({ color: 0xfef08a })
}

/** Torreta (cabeza + cañón) dibujada en el origen local del Container rotable — el padre gira, esto no se redibuja. */
export function drawBaseTowerTurret(g: Graphics, layout: BaseTowerLayout, role: BaseTowerRole): void {
  const colors = TOWER_COLOR[role]
  g.clear()
  g.rect(0, -layout.turretHead.barrelWidth / 2, layout.turretHead.barrelLength, layout.turretHead.barrelWidth).fill({ color: 0x1f2937 })
  g.circle(0, 0, layout.turretHead.radius).fill({ color: colors.rim }).circle(0, 0, layout.turretHead.radius * 0.5).fill({ color: 0x111827 })
}

/** Anillo de escudo — geometría fija; el llamador anima `.alpha`/`.visible` según `bossBarrierActive`. */
export function drawBaseTowerShield(g: Graphics, layout: BaseTowerLayout): void {
  g.clear()
  const cx = layout.width / 2
  const cy = layout.towerBody.y + layout.towerBody.height / 2
  g.circle(cx, cy, layout.shieldRadius).stroke({ width: 2, color: 0x38bdf8, alpha: 0.9 })
  g.circle(cx, cy, layout.shieldRadius * 0.86).stroke({ width: 1, color: 0x38bdf8, alpha: 0.5 })
}

/** Barra de HP con gradiente neón — track oscuro + relleno degradado + borde brillante. Redibujar solo si cambia la fracción. */
export function drawBaseTowerHpBar(g: Graphics, layout: BaseTowerLayout, role: BaseTowerRole, hpFraction: number): void {
  const colors = TOWER_COLOR[role]
  const { x, y, width, height } = layout.hpBar
  g.clear()
  g.roundRect(x, y, width, height, height / 2).fill({ color: 0x0b1220, alpha: 0.85 })

  const fillWidth = getHpBarFillWidth(hpFraction, width)
  if (fillWidth > 0.5) {
    const fillGradient = new FillGradient({
      type: 'linear',
      start: { x: 0, y: 0 },
      end: { x: 1, y: 0 },
      textureSpace: 'local',
      colorStops: [
        { offset: 0, color: colors.bottom },
        { offset: 1, color: colors.top },
      ],
    })
    g.roundRect(x, y, fillWidth, height, height / 2).fill({ fill: fillGradient })
  }

  g.roundRect(x, y, width, height, height / 2).stroke({ width: 1, color: colors.rim, alpha: 0.6 })
}
