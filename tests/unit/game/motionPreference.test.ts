import { afterEach, describe, expect, it, vi } from 'vitest'
import { prefersReducedMotion, resetMotionPreferenceCache } from '../../../src/game/motionPreference'

describe('prefersReducedMotion — specs/044-animaciones-de-evento (FR-007)', () => {
  const originalMatchMedia = window.matchMedia

  afterEach(() => {
    window.matchMedia = originalMatchMedia
    resetMotionPreferenceCache()
  })

  it('devuelve false si el navegador no ofrece matchMedia', () => {
    // @ts-expect-error — simula un entorno sin matchMedia
    window.matchMedia = undefined
    resetMotionPreferenceCache()
    expect(prefersReducedMotion()).toBe(false)
  })

  it('consulta la media query de reducir movimiento y refleja cambios en vivo', () => {
    const query = { matches: true } as MediaQueryList
    const matchMedia = vi.fn(() => query)
    window.matchMedia = matchMedia as unknown as typeof window.matchMedia
    resetMotionPreferenceCache()

    expect(prefersReducedMotion()).toBe(true)
    expect(matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
    ;(query as { matches: boolean }).matches = false
    expect(prefersReducedMotion()).toBe(false)
    expect(matchMedia).toHaveBeenCalledTimes(1)
  })

  it('devuelve false si matchMedia lanza', () => {
    window.matchMedia = (() => {
      throw new Error('no disponible')
    }) as unknown as typeof window.matchMedia
    resetMotionPreferenceCache()
    expect(prefersReducedMotion()).toBe(false)
  })
})
