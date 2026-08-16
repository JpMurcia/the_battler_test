import { Graphics, type Renderer, type Texture } from 'pixi.js'
import type { ProceduralDesign } from '../../data/seedData'

/** specs/022-datos-semilla-flujo-navegacion (FR-006). 'ally' siempre dibuja orejas de gato; 'enemy' usa design.distinctiveFeature. */
export type UnitRole = 'ally' | 'enemy'

const EAR_SIZE_RATIO = 0.28
const EYE_RADIUS_RATIO = 0.08
const FACE_COLOR = 0x1f2937

function drawBody(g: Graphics, design: ProceduralDesign): void {
  const half = design.size / 2
  if (design.baseShape === 'circle') {
    g.circle(0, 0, half).fill(design.primaryColor)
  } else if (design.baseShape === 'rect') {
    g.rect(-half, -half, design.size, design.size).fill(design.primaryColor)
  } else {
    g.poly([0, -half, half, half, -half, half]).fill(design.primaryColor)
  }
}

function drawCatEars(g: Graphics, design: ProceduralDesign): void {
  const half = design.size / 2
  const earSize = design.size * EAR_SIZE_RATIO
  g.poly([-half * 0.6, -half, -half * 0.6 - earSize, -half - earSize, -half * 0.1, -half]).fill(design.primaryColor)
  g.poly([half * 0.6, -half, half * 0.6 + earSize, -half - earSize, half * 0.1, -half]).fill(design.primaryColor)
}

/** specs/022-datos-semilla-flujo-navegacion (research.md Decisión 2). Rasgo distintivo del enemigo — ausente/'none' no dibuja nada extra. */
function drawEnemyFeature(g: Graphics, design: ProceduralDesign): void {
  const half = design.size / 2
  const spike = design.size * 0.3
  switch (design.distinctiveFeature) {
    case 'fangs':
      g.poly([-half * 0.3, half * 0.1, -half * 0.15, half * 0.4, 0, half * 0.1]).fill(0xffffff)
      g.poly([half * 0.3, half * 0.1, half * 0.15, half * 0.4, 0, half * 0.1]).fill(0xffffff)
      break
    case 'fin':
      g.poly([0, -half, half * 0.4, -half - spike, 0, -half * 0.5]).fill(design.primaryColor)
      break
    case 'crest':
      g.poly([-half * 0.4, -half, 0, -half - spike, half * 0.4, -half]).fill(design.primaryColor)
      break
    case 'cat-ears':
      drawCatEars(g, design)
      break
    case 'none':
      break
  }
}

function drawFace(g: Graphics, design: ProceduralDesign): void {
  const half = design.size / 2
  const eyeRadius = Math.max(1, design.size * EYE_RADIUS_RATIO)
  const eyeOffsetX = half * 0.35
  const eyeOffsetY = -half * 0.1
  g.circle(-eyeOffsetX, eyeOffsetY, eyeRadius).fill(FACE_COLOR)
  g.circle(eyeOffsetX, eyeOffsetY, eyeRadius).fill(FACE_COLOR)
  g.moveTo(-half * 0.2, half * 0.35)
    .lineTo(half * 0.2, half * 0.35)
    .stroke({ width: Math.max(1, design.size * 0.04), color: FACE_COLOR })
}

/**
 * specs/022-datos-semilla-flujo-navegacion (FR-004/FR-006). Dibuja cuerpo + rasgo distintivo + expresión
 * facial simple según `ProceduralDesign`. Determinista — el mismo `design`/`role` produce siempre el mismo
 * dibujo (research.md Decisión 2). Solo consumida internamente por `getOrCreateUnitTexture`, exportada para test.
 */
export function drawSeedUnit(g: Graphics, design: ProceduralDesign, role: UnitRole): void {
  g.clear()
  drawBody(g, design)
  if (role === 'ally') {
    drawCatEars(g, design)
  } else {
    drawEnemyFeature(g, design)
  }
  drawFace(g, design)
}

/** Caché en memoria, no persistida (reconstruible) — keyed por unidad semilla + rol (FR-005). */
const textureCache = new Map<string, Texture>()

/**
 * specs/022-datos-semilla-flujo-navegacion (FR-005). Genera la textura una sola vez por `(seedUnitId, role)`
 * vía `renderer.generateTexture()` y la reutiliza en llamadas siguientes — instancias repetidas de la misma
 * unidad en batalla no regeneran el dibujo.
 */
export function getOrCreateUnitTexture(renderer: Renderer, seedUnitId: string, design: ProceduralDesign, role: UnitRole): Texture {
  const key = `${seedUnitId}:${role}`
  const cached = textureCache.get(key)
  if (cached) return cached

  const g = new Graphics()
  drawSeedUnit(g, design, role)
  const texture = renderer.generateTexture(g)
  textureCache.set(key, texture)
  return texture
}

/** Solo para tests — evita fugas de estado entre casos (data-model.md § ProceduralDesign → Textura). */
export function clearUnitTextureCache(): void {
  textureCache.clear()
}
