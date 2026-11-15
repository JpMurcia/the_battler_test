import { ColorMatrixFilter } from 'pixi.js'

/**
 * specs/044-animaciones-de-evento (US1/FR-001, research.md Decisión 3). Destello de «Golpeado»: lleva cada color un 65 %
 * hacia el blanco sin tocar el alfa (`rgb' = 0,35·rgb + 0,65`). El shader de Pixi despremultiplica antes de aplicar la
 * matriz, así que el desplazamiento va en escala 0–1 y el borde transparente del cuerpo se conserva.
 *
 * Una única instancia compartida por todas las unidades: la intensidad es fija (destello binario de 0,08 s), así que no
 * necesita uniformes por unidad. Se crea bajo demanda para que importar este módulo no exija un contexto gráfico.
 */
export const HIT_FLASH_MATRIX = [
  0.35, 0, 0, 0, 0.65,
  0, 0.35, 0, 0, 0.65,
  0, 0, 0.35, 0, 0.65,
  0, 0, 0, 1, 0,
] as const

let sharedFilter: ColorMatrixFilter | null = null

export function getHitFlashFilter(): ColorMatrixFilter {
  if (!sharedFilter) {
    sharedFilter = new ColorMatrixFilter()
    sharedFilter.matrix = [...HIT_FLASH_MATRIX] as ColorMatrixFilter['matrix']
  }
  return sharedFilter
}
