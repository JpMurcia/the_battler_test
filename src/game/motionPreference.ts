/**
 * specs/044-animaciones-de-evento (FR-007, research.md Decisión 8). Preferencia del sistema «reducir movimiento» para
 * el render de batalla en Pixi (el CSS ya la respeta con `@media`). La media query se crea una sola vez y se lee su
 * `.matches` en cada consulta, así que un cambio en vivo de la preferencia se refleja sin recargar.
 */

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

let cachedQuery: MediaQueryList | null | undefined

export function prefersReducedMotion(): boolean {
  if (cachedQuery === undefined) {
    try {
      cachedQuery = typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(REDUCED_MOTION_QUERY) : null
    } catch {
      cachedQuery = null
    }
  }
  return cachedQuery?.matches ?? false
}

/** Solo para tests: olvida la media query cacheada. */
export function resetMotionPreferenceCache(): void {
  cachedQuery = undefined
}
