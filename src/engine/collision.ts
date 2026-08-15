export interface Extent {
  x: number
  width: number
}

/** Superposición AABB en 1D: dos entidades se superponen si sus intervalos [x, x+width] se solapan. */
export function overlaps1D(a: Extent, b: Extent): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width
}
