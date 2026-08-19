import { extend, useApplication, useTick } from '@pixi/react'
import { Container, Graphics } from 'pixi.js'
import { useCallback, useMemo, useRef } from 'react'
import {
  computeBaseTowerLayout,
  drawBaseTowerBody,
  drawBaseTowerHpBar,
  drawBaseTowerShield,
  drawBaseTowerTurret,
  getHpFraction,
  TURRET_ROTATION_SPEED_RAD_PER_SEC,
  type BaseTowerRole,
} from './graphics/baseTower'
import { getLaneScreenX, getLaneScreenY } from './graphics/layout'
import { useGameStore } from '../state/useGameStore'

extend({ Container, Graphics })

/** Fracción de cambio de HP mínima para justificar un redraw de la barra — evita redibujar por ruido de punto flotante. */
const HP_BAR_REDRAW_THRESHOLD = 0.004

interface BaseTowerProps {
  role: BaseTowerRole
}

/**
 * specs/021-reskin-cyber-modern (rediseño Cyber-Modern). "Torre Gato Cyber" (base aliada, x=0 del
 * carril) / Base Enemiga (x=laneLength) — varias capas de profundidad en Container (plataforma+cuerpo
 * → torreta que rota → barra de HP con gradiente neón → escudo del jefe si aplica). Lee
 * `playerBase`/`enemyBase`/`bossBarrierActive` de useGameStore vía un useTick propio, igual que
 * UnitSprite — nunca vuelve a renderizar el componente React por el tick de combate (Constitución § VI).
 */
export function BaseTower({ role }: BaseTowerProps) {
  const { app } = useApplication()
  const layout = useMemo(() => computeBaseTowerLayout(), [])

  const containerRef = useRef<Container>(null)
  const turretRef = useRef<Container>(null)
  const hpBarRef = useRef<Graphics>(null)
  const shieldRef = useRef<Graphics>(null)

  const turretAngleRef = useRef(role === 'enemy' ? Math.PI : 0)
  const clockRef = useRef(0)
  const lastDrawnFractionRef = useRef(-1)

  const drawBody = useCallback((g: Graphics) => drawBaseTowerBody(g, layout, role), [layout, role])
  const drawTurret = useCallback((g: Graphics) => drawBaseTowerTurret(g, layout, role), [layout, role])
  const drawShield = useCallback((g: Graphics) => drawBaseTowerShield(g, layout), [layout])
  // La barra de HP se dibuja imperativamente por ref en useTick (solo cuando cambia la fracción) — el
  // `draw` inicial solo deja el Graphics listo para recibir esas llamadas (Graphics exige `draw`).
  const drawHpBarPlaceholder = useCallback((g: Graphics) => g.clear(), [])

  useTick(({ deltaMS }) => {
    const container = containerRef.current
    if (!container) return

    const deltaSeconds = deltaMS / 1000
    clockRef.current += deltaSeconds

    const store = useGameStore.getState()
    const laneLength = store.laneLength
    const unitX = role === 'ally' ? 0 : laneLength
    container.x = getLaneScreenX(unitX, laneLength, app.screen.width)
    container.y = getLaneScreenY(app.screen.height)

    if (turretRef.current) {
      turretAngleRef.current += TURRET_ROTATION_SPEED_RAD_PER_SEC * deltaSeconds * (role === 'ally' ? 1 : -1)
      turretRef.current.rotation = turretAngleRef.current
    }

    const base = role === 'ally' ? store.playerBase : store.enemyBase
    const fraction = getHpFraction(base.hp, base.maxHp)
    if (hpBarRef.current && Math.abs(fraction - lastDrawnFractionRef.current) > HP_BAR_REDRAW_THRESHOLD) {
      lastDrawnFractionRef.current = fraction
      drawBaseTowerHpBar(hpBarRef.current, layout, role, fraction)
    }

    // specs/020-barrera-de-base (FR-008): overlay de escudo solo en la base enemiga mientras el
    // jefe vinculado siga vivo — mismo booleano derivado que ya consume EnemyBaseReadout (HUD).
    if (shieldRef.current) {
      const active = role === 'enemy' && store.bossBarrierActive
      shieldRef.current.visible = active
      if (active) shieldRef.current.alpha = 0.6 + Math.sin(clockRef.current * 3) * 0.25
    }
  })

  return (
    <pixiContainer ref={containerRef} pivot={{ x: layout.width / 2, y: layout.height }}>
      <pixiGraphics draw={drawBody} />
      <pixiContainer ref={turretRef} x={layout.turretPivot.x} y={layout.turretPivot.y}>
        <pixiGraphics draw={drawTurret} />
      </pixiContainer>
      <pixiGraphics ref={shieldRef} draw={drawShield} visible={false} />
      <pixiGraphics ref={hpBarRef} draw={drawHpBarPlaceholder} />
    </pixiContainer>
  )
}
