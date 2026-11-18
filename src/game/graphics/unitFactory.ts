import { Graphics, type Renderer, type StrokeInput, type Texture } from 'pixi.js'
import type { ProceduralDesign, ProceduralDistinctiveFeature } from '../../data/seedData'

/**
 * specs/042-unidades-mundo-cartoon (FR-006/FR-007, research.md Decisión 3): el rol decide las orejas de gato —
 * todo aliado las lleva además de su rasgo distintivo (una sola vez si su rasgo ya es 'cat-ears'); un enemigo
 * nunca. Revierte la decisión de specs/028 (Decisión 5, punto 5), que las había quitado porque su única posición
 * chocaba con cuernos y crestas; ahora se abren hacia los lados cuando el rasgo ocupa la cabeza.
 */
export type UnitRole = 'ally' | 'enemy'

/** Biblia de arte §4: contorno del mundo = casi negro, equivalente a `--bc-bg-2`. */
const OUTLINE_COLOR = 0x0a0c14
/** Blanco roto plano para los colmillos — sin el blanco puro que se leería como brillo. */
const FANG_COLOR = 0xe8e2d4
/**
 * research.md Decisión 10: el sprite se estira a la caja del cuerpo. specs/045: la batalla ahora dibuja los cuerpos
 * hasta 6 veces más grandes (getBattleVisualScale), así que la textura se rasteriza a resolución 8 para que el
 * contorno siga nítido; con 2 se vería borroso a 64 px.
 */
const TEXTURE_RESOLUTION = 8

const EAR_SIZE_RATIO = 0.28
const EYE_RADIUS_RATIO = 0.08

/** Rasgos que ocupan la cabeza: con ellos las orejas del aliado se abren a los lados (research.md Decisión 3). */
const HEAD_FEATURES: ReadonlySet<ProceduralDistinctiveFeature> = new Set(['horns', 'crest', 'spikes', 'fin'])

/**
 * research.md Decisión 2: grosor proporcional al tamaño con un mínimo visible a 14 px. La biblia propone ≥ 8 px a
 * 300 px (2,7 %), que a 14–44 px sería invisible; 8 % da 1,5–3,5 px.
 */
function outlineWidth(size: number): number {
  return Math.max(1.5, size * 0.08)
}

function outline(design: ProceduralDesign, scale = 1): StrokeInput {
  return { width: outlineWidth(design.size) * scale, color: OUTLINE_COLOR, join: 'round' }
}

/** Aclara un color 0xRRGGBB sumando `amount` a cada canal (recorte a 255) — tono plano del escudo. */
function lighten(color: number, amount: number): number {
  const r = Math.min(255, ((color >> 16) & 0xff) + amount)
  const g = Math.min(255, ((color >> 8) & 0xff) + amount)
  const b = Math.min(255, (color & 0xff) + amount)
  return (r << 16) + (g << 8) + b
}

/**
 * research.md Decisión 3: marco donde se apoyan los rasgos de cabeza (y las orejas del círculo y el rectángulo).
 * En el círculo y el rectángulo es el borde superior. En el triángulo el vértice es un punto: el marco baja a
 * y = −0,75·half (semiancho real ≈ 0,125·half), así la base del rasgo queda dentro del cuerpo y su punta asoma
 * por encima del vértice en vez de flotar o quedar tapada.
 */
interface HeadFrame {
  top: number
  halfWidth: number
}

function headFrame(design: ProceduralDesign): HeadFrame {
  const half = design.size / 2
  if (design.baseShape === 'poly') return { top: -0.75 * half, halfWidth: 0.25 * half }
  return { top: -half, halfWidth: half }
}

/** specs/021-reskin-cyber-modern: sombra de contacto elíptica bajo la unidad — se dibuja primero, detrás de todo. */
function drawShadow(g: Graphics, design: ProceduralDesign): void {
  const half = design.size / 2
  g.ellipse(0, half * 0.94, half * 0.85, half * 0.22).fill({ color: 0x000000, alpha: 0.32 })
}

function drawBody(g: Graphics, design: ProceduralDesign): void {
  const half = design.size / 2
  if (design.baseShape === 'circle') {
    g.circle(0, 0, half)
  } else if (design.baseShape === 'rect') {
    g.rect(-half, -half, design.size, design.size)
  } else {
    g.poly([0, -half, half, half, -half, half])
  }
  g.fill(design.primaryColor).stroke(outline(design))
}

/**
 * Orejas de gato (biblia §5: obligatorias en todo aliado, siempre asomando en la silueta). La base se hunde dentro
 * del cuerpo para que el contorno del cuerpo, dibujado encima, la tape. 'flanking': el rasgo ocupa la cabeza y las
 * orejas se abren a ambos lados sin superponerse a él (FR-006, escenario 2).
 */
function drawCatEars(g: Graphics, design: ProceduralDesign, layout: 'default' | 'flanking'): void {
  const half = design.size / 2
  // Triángulo: las orejas nacen de los lados inclinados, bajo el vértice, y apuntan arriba y afuera — el vértice
  // queda libre para el rasgo de cabeza, así que no hace falta abrirlas (las dos disposiciones coinciden).
  if (design.baseShape === 'poly') {
    for (const side of [-1, 1]) {
      g.poly([side * 0.25 * half, -0.4 * half, side * 0.55 * half, -0.8 * half, side * 0.42 * half, -0.1 * half])
        .fill(design.primaryColor)
        .stroke(outline(design))
    }
    return
  }
  const { top, halfWidth: w } = headFrame(design)
  const earSize = design.size * EAR_SIZE_RATIO
  const flanking = layout === 'flanking'
  const [inner, outer, tip] = flanking ? [0.55, 0.98, 1.05] : [0.15, 0.7, 0.75]
  const baseY = top + (flanking && design.baseShape === 'circle' ? 0.4 : 0.15) * half
  const tipY = flanking ? top - earSize * 0.5 : top - earSize
  for (const side of [-1, 1]) {
    g.poly([side * inner * w, baseY, side * tip * w, tipY, side * outer * w, baseY])
      .fill(design.primaryColor)
      .stroke(outline(design))
  }
}

/**
 * specs/022 (research.md Decisión 2) / specs/028 (US3/FR-010, Decisión 5) / specs/042 (research.md Decisión 2):
 * rasgos que sobresalen de la silueta, dibujados DETRÁS del cuerpo — el contorno del cuerpo tapa su base y la
 * silueta queda limpia (FR-001). Los de cabeza se apoyan en el `HeadFrame` de la forma.
 */
function drawBackFeature(g: Graphics, design: ProceduralDesign): void {
  const half = design.size / 2
  const spike = design.size * 0.3
  const { top, halfWidth: w } = headFrame(design)
  const x = (k: number) => k * w
  const y = (k: number) => top + k * half
  const lean = w / half // los desplazamientos horizontales de cabeza escalan con el ancho del marco
  const stroke = outline(design)

  switch (design.distinctiveFeature) {
    case 'cat-ears':
      drawCatEars(g, design, 'default')
      break
    case 'fin':
      g.poly([0, y(0.15), x(0.4), top - spike, 0, y(0.5)]).fill(design.primaryColor).stroke(stroke)
      break
    case 'crest':
      g.poly([x(-0.4), y(0.15), 0, top - spike, x(0.4), y(0.15)]).fill(design.primaryColor).stroke(stroke)
      break
    case 'horns':
      for (const side of [-1, 1]) {
        g.poly([side * x(0.55), y(0.15), side * (x(0.4) + spike * 0.6 * lean), top - spike, side * x(0.2), y(0.15)])
          .fill(design.primaryColor)
          .stroke(stroke)
      }
      break
    case 'spikes':
      for (const offset of [-0.5, 0, 0.5]) {
        g.poly([x(offset - 0.12), y(0.2), x(offset), top - spike * 0.6, x(offset + 0.12), y(0.2)])
          .fill(design.primaryColor)
          .stroke(stroke)
      }
      break
    case 'wings':
      for (const side of [-1, 1]) {
        g.poly([side * half, -half * 0.1, side * (half + spike * 1.4), -half * 0.5, side * half * 0.5, half * 0.15])
          .fill(design.primaryColor)
          .stroke(stroke)
      }
      break
    case 'tail':
      g.poly([-half * 0.85, half * 0.3, -half - spike, half * 0.55, -half * 0.7, -half * 0.1]).fill(design.primaryColor).stroke(stroke)
      break
    case 'fangs':
    case 'shield':
    case 'none':
      break
  }
}

/**
 * Rasgos que van DELANTE del cuerpo y de la cara (escudo, colmillos) — relleno plano y contorno, sin transparencia
 * ni brillo. El escudo se sostiene abajo y hacia delante (la unidad mira a la derecha): deja los ojos a la vista.
 */
function drawFrontFeature(g: Graphics, design: ProceduralDesign): void {
  const half = design.size / 2
  if (design.distinctiveFeature === 'shield') {
    g.roundRect(half * 0.05, half * 0.15, half * 0.75, half * 0.75, half * 0.14)
      .fill(lighten(design.primaryColor, 40))
      .stroke(outline(design))
  } else if (design.distinctiveFeature === 'fangs') {
    const detail = outline(design, 0.5)
    g.poly([-half * 0.3, half * 0.1, -half * 0.15, half * 0.4, 0, half * 0.1]).fill(FANG_COLOR).stroke(detail)
    g.poly([half * 0.3, half * 0.1, half * 0.15, half * 0.4, 0, half * 0.1]).fill(FANG_COLOR).stroke(detail)
  }
}

/** En el triángulo la cara baja y se estrecha para que los ojos no pisen los lados inclinados. */
function drawFace(g: Graphics, design: ProceduralDesign): void {
  const half = design.size / 2
  const poly = design.baseShape === 'poly'
  const eyeRadius = Math.max(1, design.size * EYE_RADIUS_RATIO)
  const eyeOffsetX = half * (poly ? 0.2 : 0.35)
  const eyeOffsetY = half * (poly ? 0.15 : -0.1)
  const mouthY = half * (poly ? 0.5 : 0.35)
  const mouthHalfWidth = half * (poly ? 0.14 : 0.2)
  g.circle(-eyeOffsetX, eyeOffsetY, eyeRadius).fill(OUTLINE_COLOR)
  g.circle(eyeOffsetX, eyeOffsetY, eyeRadius).fill(OUTLINE_COLOR)
  g.moveTo(-mouthHalfWidth, mouthY)
    .lineTo(mouthHalfWidth, mouthY)
    .stroke({ width: Math.max(1, design.size * 0.04), color: OUTLINE_COLOR, cap: 'round' })
}

/**
 * specs/022-datos-semilla-flujo-navegacion (FR-004/FR-006) / specs/042-unidades-mundo-cartoon (FR-001/FR-006/FR-007,
 * research.md Decisiones 2 y 3). Dibujo cartoon de la biblia de arte: relleno plano de un solo color y contorno
 * oscuro en cada parte, sin borde neón, visor, placas, propulsor ni degradado. Capas: sombra → orejas (aliado) →
 * rasgo trasero → cuerpo → cara → rasgo delantero. Determinista — el mismo `design`/`role` produce siempre el mismo
 * dibujo. Solo consumida internamente por `getOrCreateUnitTexture`, exportada para test.
 */
export function drawSeedUnit(g: Graphics, design: ProceduralDesign, role: UnitRole): void {
  g.clear()
  drawShadow(g, design)
  if (role === 'ally' && design.distinctiveFeature !== 'cat-ears') {
    drawCatEars(g, design, HEAD_FEATURES.has(design.distinctiveFeature) ? 'flanking' : 'default')
  }
  drawBackFeature(g, design)
  drawBody(g, design)
  drawFace(g, design)
  drawFrontFeature(g, design)
}

/** Caché en memoria, no persistida (reconstruible) — keyed por unidad + rol (FR-005 de specs/022, FR-013 de specs/042). */
const textureCache = new Map<string, Texture>()

/**
 * specs/022-datos-semilla-flujo-navegacion (FR-005). Genera la textura una sola vez por `(unitId, role)` vía
 * `renderer.generateTexture()` y la reutiliza en llamadas siguientes — instancias repetidas de la misma unidad en
 * batalla (y su eco de muerte) no regeneran el dibujo. specs/042/045: a resolución 8 (research.md Decisión 10); el tamaño
 * lógico de la textura, y por tanto el de la unidad en pantalla, no cambia.
 */
export function getOrCreateUnitTexture(renderer: Renderer, unitId: string, design: ProceduralDesign, role: UnitRole): Texture {
  const key = `${unitId}:${role}`
  const cached = textureCache.get(key)
  if (cached) return cached

  const g = new Graphics()
  drawSeedUnit(g, design, role)
  const texture = renderer.generateTexture({ target: g, resolution: TEXTURE_RESOLUTION })
  textureCache.set(key, texture)
  return texture
}

/** Solo para tests — evita fugas de estado entre casos (data-model.md § ProceduralDesign → Textura). */
export function clearUnitTextureCache(): void {
  textureCache.clear()
}
