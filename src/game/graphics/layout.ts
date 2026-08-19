/**
 * specs/021-reskin-cyber-modern (rediseño Cyber-Modern). Mapeo puro de coordenadas del carril de
 * combate (`BattleUnit.x` en `[-BASE_WIDTH, laneLength + BASE_WIDTH]`, ver src/engine/simulation.ts)
 * a coordenadas de pantalla en píxeles. Antes de este módulo, UnitSprite/DeathEchoSprite usaban
 * `unit.x` directo como `container.x` — con `laneLength` (400 por defecto) casi siempre menor que
 * `app.screen.width` real, el combate quedaba apretado contra el borde izquierdo del canvas y las
 * bases (en x=0 y x=laneLength) no coincidían con los bordes visibles. Sin dependencia de Pixi/React
 * — testeable con Vitest puro (Constitución § VI).
 */

/** Fracción del ancho de pantalla reservada como margen a cada lado, donde viven las bases. */
export const LANE_MARGIN_FRACTION = 0.08

/** Fracción de la altura de pantalla donde se apoya el carril (resto de la altura = fondo/profundidad). */
export const LANE_Y_FRACTION = 0.62

/** Convierte una coordenada `x` del carril de simulación a píxeles de pantalla horizontales. */
export function getLaneScreenX(unitX: number, laneLength: number, screenWidth: number): number {
  if (laneLength <= 0 || screenWidth <= 0) return 0
  const margin = screenWidth * LANE_MARGIN_FRACTION
  const usableWidth = Math.max(0, screenWidth - margin * 2)
  return margin + (unitX / laneLength) * usableWidth
}

/** Altura en píxeles a la que se apoya el carril (línea de suelo) dentro de la pantalla. */
export function getLaneScreenY(screenHeight: number): number {
  return screenHeight * LANE_Y_FRACTION
}
