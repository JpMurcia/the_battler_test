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

/**
 * specs/045-escala-visual-batalla. Canvas de referencia: el que deja una ventana de 1280×720 (medido: 1256×535).
 * En él el Gato Básico (cuerpo de 16×18,5 en unidades de mundo) se dibuja a 64 px de alto.
 */
export const BATTLE_REFERENCE_SCREEN = { width: 1256, height: 535 } as const
export const BATTLE_VISUAL_SCALE_AT_REFERENCE = 64 / 18.5
export const BATTLE_VISUAL_SCALE_MIN = 1.5
export const BATTLE_VISUAL_SCALE_MAX = 6
/**
 * Las bases crecen al 75 % de la escala de las unidades: a escala completa ocupaban casi la mitad del alto del
 * canvas y su barra de vida se salía por el borde (comprobado en 1256×535). Así siguen ≈ 2,8 veces más altas que el
 * Gato Básico y la barra cabe dentro del margen lateral del carril.
 */
export const BASE_VISUAL_SCALE_RATIO = 0.75

/**
 * Escala visual única de la batalla: multiplica el tamaño dibujado de unidades, anillos, barras de vida, ecos,
 * impactos y bases. Solo render — la simulación (anchos de colisión, posiciones del carril) no cambia.
 * Sigue al lado más limitante del canvas para que las proporciones con el carril no se rompan en pantallas
 * muy anchas o muy bajas.
 */
export function getBattleVisualScale(screenWidth: number, screenHeight: number): number {
  if (screenWidth <= 0 || screenHeight <= 0) return BATTLE_VISUAL_SCALE_MIN
  const factor = Math.min(screenWidth / BATTLE_REFERENCE_SCREEN.width, screenHeight / BATTLE_REFERENCE_SCREEN.height)
  return Math.min(BATTLE_VISUAL_SCALE_MAX, Math.max(BATTLE_VISUAL_SCALE_MIN, BATTLE_VISUAL_SCALE_AT_REFERENCE * factor))
}
