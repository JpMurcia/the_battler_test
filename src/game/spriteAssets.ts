import { Assets, type Texture } from 'pixi.js'

/**
 * specs/021-reskin-cyber-modern (data-model.md § SpriteManifest). Manifest puro — sin dependencia de
 * Pixi/React en su forma de datos — de las rutas de textura idle/attack por spriteKey, generadas por
 * scripts/copy-sprites.mjs hacia public/sprites/. Recuentos reales del pack fuente (research.md
 * Decisión 5): 16 frames de reposo, 12 de ataque — no son el mismo número.
 */
export interface SpriteAnimationSet {
  idle: string[]
  attack: string[]
}

type SpriteManifest = Record<string, SpriteAnimationSet>

const IDLE_FRAME_COUNT = 16
const ATTACK_FRAME_COUNT = 12
const HERO_COUNT = 12

function framePaths(spriteKey: string, folder: 'idle' | 'attack', count: number): string[] {
  return Array.from({ length: count }, (_unused, index) => `/sprites/${spriteKey}/${folder}/${index + 1}.png`)
}

export const SPRITE_MANIFEST: SpriteManifest = Object.fromEntries(
  Array.from({ length: HERO_COUNT }, (_unused, index) => {
    const spriteKey = `hero_${index + 1}`
    return [
      spriteKey,
      {
        idle: framePaths(spriteKey, 'idle', IDLE_FRAME_COUNT),
        attack: framePaths(spriteKey, 'attack', ATTACK_FRAME_COUNT),
      },
    ]
  }),
)

/** `undefined` si `spriteKey` no está definido o no resuelve en el manifest (fallback Graphics, FR-011). */
export function resolveSpriteAnimationSet(spriteKey: string | undefined): SpriteAnimationSet | undefined {
  if (!spriteKey) return undefined
  return SPRITE_MANIFEST[spriteKey]
}

/**
 * Carga (y cachea vía `Assets`, que deduplica por URL) las texturas de un arreglo de rutas, en el
 * mismo orden que `paths`. Puede rechazar (red, archivo movido) — quien llame decide el fallback
 * (spec.md edge case: carga fallida degrada al mismo tratamiento que "sin spriteKey asignado").
 */
export async function loadSpriteTextures(paths: string[]): Promise<Texture[]> {
  const loaded = await Assets.load<Texture>(paths)
  return paths.map((path) => loaded[path])
}
