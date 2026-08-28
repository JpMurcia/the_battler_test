import { Graphics, type Renderer, type Texture } from 'pixi.js'
import type { ProceduralDesign } from '../../data/seedData'

/**
 * specs/022-datos-semilla-flujo-navegacion (FR-006) / specs/028-ajustes-combate-mapa-disenos (US3, research.md
 * Decisión 5 punto 5): ambos roles usan `design.distinctiveFeature` por igual — 'ally' ya no fuerza orejas de
 * gato (los 4 `SEED_UNITS` declaran `distinctiveFeature: 'cat-ears'` explícitamente, así que su render no cambia).
 */
export type UnitRole = 'ally' | 'enemy'

const EAR_SIZE_RATIO = 0.28
const EYE_RADIUS_RATIO = 0.08
const FACE_COLOR = 0x1f2937

/** Aclara un color 0xRRGGBB sumando `amount` a cada canal (recorte a 255) — usado para acentos neón derivados de `primaryColor`. */
function lighten(color: number, amount: number): number {
  const r = Math.min(255, ((color >> 16) & 0xff) + amount)
  const g = Math.min(255, ((color >> 8) & 0xff) + amount)
  const b = Math.min(255, (color & 0xff) + amount)
  return (r << 16) + (g << 8) + b
}

/** specs/021-reskin-cyber-modern: sombra vectorial elíptica bajo la unidad — se dibuja primero, detrás del cuerpo. */
function drawShadow(g: Graphics, design: ProceduralDesign): void {
  const half = design.size / 2
  g.ellipse(0, half * 0.94, half * 0.85, half * 0.22).fill({ color: 0x000000, alpha: 0.32 })
}

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

/** specs/021-reskin-cyber-modern: contorno neón sobre el borde del cuerpo — mismo shape que drawBody, solo stroke. */
function drawNeonRim(g: Graphics, design: ProceduralDesign): void {
  const half = design.size / 2
  const rimColor = lighten(design.primaryColor, 100)
  const stroke = { width: Math.max(1, design.size * 0.05), color: rimColor, alpha: 0.85 }
  if (design.baseShape === 'circle') {
    g.circle(0, 0, half).stroke(stroke)
  } else if (design.baseShape === 'rect') {
    g.rect(-half, -half, design.size, design.size).stroke(stroke)
  } else {
    g.poly([0, -half, half, half, -half, half]).stroke(stroke)
  }
}

/** specs/021-reskin-cyber-modern: par de placas de armadura metálica a los flancos inferiores del cuerpo. */
function drawArmorPlates(g: Graphics, design: ProceduralDesign): void {
  const half = design.size / 2
  const plateWidth = half * 0.3
  const plateHeight = half * 0.5
  g.roundRect(-half - plateWidth * 0.15, half * 0.1, plateWidth, plateHeight, plateWidth * 0.25).fill({ color: 0x334155, alpha: 0.9 })
  g.roundRect(half - plateWidth * 0.85, half * 0.1, plateWidth, plateHeight, plateWidth * 0.25).fill({ color: 0x334155, alpha: 0.9 })
}

/** specs/021-reskin-cyber-modern: visor holográfico — panel oscuro + franja brillante, detrás de drawFace. */
function drawVisorPanel(g: Graphics, design: ProceduralDesign): void {
  const half = design.size / 2
  const visorGlow = lighten(design.primaryColor, 140)
  g.roundRect(-half * 0.45, -half * 0.32, half * 0.9, half * 0.34, half * 0.1).fill({ color: 0x0b1220, alpha: 0.82 })
  g.roundRect(-half * 0.36, -half * 0.22, half * 0.72, half * 0.14, half * 0.05).fill({ color: visorGlow, alpha: 0.85 })
}

function drawCatEars(g: Graphics, design: ProceduralDesign): void {
  const half = design.size / 2
  const earSize = design.size * EAR_SIZE_RATIO
  g.poly([-half * 0.6, -half, -half * 0.6 - earSize, -half - earSize, -half * 0.1, -half]).fill(design.primaryColor)
  g.poly([half * 0.6, -half, half * 0.6 + earSize, -half - earSize, half * 0.1, -half]).fill(design.primaryColor)
}

/**
 * specs/022-datos-semilla-flujo-navegacion (research.md Decisión 2) / specs/028-ajustes-combate-mapa-disenos
 * (US3/FR-010, research.md Decisión 5): rasgo distintivo de la unidad, para AMBOS roles por igual — ausente/'none'
 * no dibuja nada extra. Generalizado de "solo enemigo" (drawEnemyFeature) porque `drawSeedUnit` ya no fuerza
 * orejas de gato para `role === 'ally'` (research.md Decisión 5, punto 5).
 */
function drawDistinctiveFeature(g: Graphics, design: ProceduralDesign): void {
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
    // specs/028-ajustes-combate-mapa-disenos (US3/FR-010): 5 rasgos nuevos (research.md Decisión 5).
    case 'horns':
      g.poly([-half * 0.55, -half * 0.85, -half * 0.4 - spike * 0.6, -half - spike, -half * 0.2, -half * 0.85]).fill(design.primaryColor)
      g.poly([half * 0.55, -half * 0.85, half * 0.4 + spike * 0.6, -half - spike, half * 0.2, -half * 0.85]).fill(design.primaryColor)
      break
    case 'wings':
      g.poly([-half, -half * 0.1, -half - spike * 1.4, -half * 0.5, -half * 0.5, half * 0.15]).fill(design.primaryColor)
      g.poly([half, -half * 0.1, half + spike * 1.4, -half * 0.5, half * 0.5, half * 0.15]).fill(design.primaryColor)
      break
    case 'shield':
      g.roundRect(-half * 0.4, -half * 0.15, half * 0.8, half * 0.85, half * 0.12).fill({ color: lighten(design.primaryColor, 40), alpha: 0.92 })
      break
    case 'spikes':
      for (const offset of [-0.5, 0, 0.5]) {
        g.poly([half * offset - half * 0.12, -half * 0.8, half * offset, -half - spike * 0.6, half * offset + half * 0.12, -half * 0.8]).fill(
          design.primaryColor,
        )
      }
      break
    case 'tail':
      g.poly([-half * 0.85, half * 0.3, -half - spike, half * 0.55, -half * 0.7, -half * 0.1]).fill(design.primaryColor)
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
export function drawSeedUnit(g: Graphics, design: ProceduralDesign, _role: UnitRole): void {
  g.clear()
  drawShadow(g, design)
  drawBody(g, design)
  drawArmorPlates(g, design)
  drawDistinctiveFeature(g, design)
  drawVisorPanel(g, design)
  drawFace(g, design)
  drawNeonRim(g, design)
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
