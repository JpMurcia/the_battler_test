import { describe, expect, it } from 'vitest'
import { CATS } from '../../../src/data/cats'
import { SPRITE_MANIFEST, resolveSpriteAnimationSet } from '../../../src/game/spriteAssets'

describe('resolveSpriteAnimationSet (specs/021-reskin-cyber-modern)', () => {
  it('resuelve el set correcto para un spriteKey válido', () => {
    const set = resolveSpriteAnimationSet('hero_1')

    expect(set).toBe(SPRITE_MANIFEST['hero_1'])
  })

  it('cada idle tiene 16 rutas y cada attack 12 (data-model.md § SpriteManifest)', () => {
    const set = resolveSpriteAnimationSet('hero_1')!

    expect(set.idle).toHaveLength(16)
    expect(set.attack).toHaveLength(12)
  })

  it('las rutas idle/attack apuntan a public/sprites/<spriteKey>/<carpeta>/', () => {
    const set = resolveSpriteAnimationSet('hero_3')!

    expect(set.idle[0]).toBe('/sprites/hero_3/idle/1.png')
    expect(set.attack[11]).toBe('/sprites/hero_3/attack/12.png')
  })

  it('devuelve undefined para un spriteKey inexistente', () => {
    expect(resolveSpriteAnimationSet('hero_999')).toBeUndefined()
  })

  it('devuelve undefined cuando spriteKey es undefined (FR-011, sin arte asignado)', () => {
    expect(resolveSpriteAnimationSet(undefined)).toBeUndefined()
  })

  it('todo spriteKey asignado en CATS resuelve en el manifest', () => {
    for (const cat of CATS) {
      if (cat.spriteKey) {
        expect(resolveSpriteAnimationSet(cat.spriteKey)).toBeDefined()
      }
    }
  })
})
