export interface Extent {
  x: number
  width: number
}

/** Superposición AABB en 1D: dos entidades se superponen si sus intervalos [x, x+width] se solapan. */
export function overlaps1D(a: Extent, b: Extent): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width
}

/**
 * Superposición extendida por `range` en ambos bordes (specs/008-tipos-de-ataque) — con `range = 0` es
 * idéntica a `overlaps1D`. Equivale a superponer `a` expandida `range` a cada lado contra `b`.
 */
export function withinRange1D(a: Extent, b: Extent, range: number): boolean {
  return a.x - range < b.x + b.width && b.x - range < a.x + a.width
}

/** Distancia entre bordes: 0 si los intervalos se superponen, positiva si están separados. */
export function edgeGap(a: Extent, b: Extent): number {
  return Math.max(0, b.x - (a.x + a.width), a.x - (b.x + b.width))
}
