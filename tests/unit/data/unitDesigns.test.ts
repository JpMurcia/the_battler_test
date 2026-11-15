import { describe, expect, it } from 'vitest'
import { CATS } from '../../../src/data/cats'
import { EXTRA_UNIT_DESIGNS, resolveUnitDesign } from '../../../src/data/unitDesigns'
import { parseDeclarations } from '../theme/tokenPolicy'

/**
 * specs/042-unidades-mundo-cartoon — comprobación automática de FR-004, FR-005 y FR-012: ninguna unidad del
 * catálogo se queda sin sprite ni diseño (no hay cuerpo genérico al que caer), los colores principales son
 * únicos y ninguno es un color de información de la paleta.
 */

const themeFiles = import.meta.glob<string>('/src/theme.css', { query: '?raw', import: 'default', eager: true })
const THEME_CSS = themeFiles['/src/theme.css']

const INFO_TOKENS = ['--bc-cyan', '--bc-orange', '--bc-purple', '--bc-gold', '--bc-red', '--bc-green', '--bc-pink']

/** Valores hex de los siete tokens de información, leídos de theme.css (no copiados) para que el test siga a la paleta. */
function infoColors(): Set<number> {
  const colors = new Set<number>()
  for (const decl of parseDeclarations(THEME_CSS)) {
    if (!INFO_TOKENS.includes(decl.prop)) continue
    const match = /#([0-9a-f]{6})\b/i.exec(decl.value)
    if (match) colors.add(Number.parseInt(match[1], 16))
  }
  return colors
}

function toHsl(color: number): { s: number; l: number } {
  const r = ((color >> 16) & 0xff) / 255
  const g = ((color >> 8) & 0xff) / 255
  const b = (color & 0xff) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return { s: 0, l }
  const d = max - min
  return { s: l > 0.5 ? d / (2 - max - min) : d / (max + min), l }
}

const hex = (color: number) => `0x${color.toString(16).padStart(6, '0')}`

/** Colores corregidos por esta spec en registros existentes (data-model.md § 2.3). */
const CORRECTED_IDS = ['seed-cat-ranged', 'seed-cat-titan', 'cat-deidad', 'enemy-saltarin-alado', 'cat-cuchilla']

describe('Diseños de unidad — specs/042-unidades-mundo-cartoon (FR-004/FR-005/FR-012)', () => {
  it('lee los siete colores de información de theme.css', () => {
    expect(infoColors().size).toBeGreaterThanOrEqual(INFO_TOKENS.length)
  })

  it('FR-012: toda unidad del catálogo tiene sprite o diseño — ninguna cae a un cuerpo genérico', () => {
    const missing = CATS.filter((cat) => !cat.spriteKey && !resolveUnitDesign(cat.id)).map((cat) => cat.id)
    expect(missing).toEqual([])
  })

  it('FR-004: las unidades con sprite tienen además un diseño de respaldo', () => {
    const withSprite = CATS.filter((cat) => cat.spriteKey)
    expect(withSprite).toHaveLength(12)
    for (const cat of withSprite) {
      expect(resolveUnitDesign(cat.id), cat.id).toBeDefined()
    }
  })

  it('FR-003/FR-004: el registro de esta spec tiene 28 diseños y su tamaño es el ancho de colisión de su Cat', () => {
    expect(Object.keys(EXTRA_UNIT_DESIGNS)).toHaveLength(28)
    for (const [id, design] of Object.entries(EXTRA_UNIT_DESIGNS)) {
      const cat = CATS.find((candidate) => candidate.id === id)
      expect(cat, id).toBeDefined()
      expect(design.size, id).toBe(cat?.width)
    }
  })

  it('FR-005/FR-012: ningún color principal se repite en todo el catálogo', () => {
    const byColor = new Map<number, string[]>()
    for (const cat of CATS) {
      const design = resolveUnitDesign(cat.id)
      if (!design) continue
      byColor.set(design.primaryColor, [...(byColor.get(design.primaryColor) ?? []), cat.id])
    }
    const duplicated = [...byColor.entries()].filter(([, ids]) => ids.length > 1).map(([color, ids]) => `${hex(color)}: ${ids.join(', ')}`)
    expect(duplicated).toEqual([])
  })

  it('FR-005/FR-012: ningún color principal coincide con un color de información de la paleta', () => {
    const info = infoColors()
    const clashing = CATS.filter((cat) => {
      const design = resolveUnitDesign(cat.id)
      return design !== undefined && info.has(design.primaryColor)
    }).map((cat) => cat.id)
    expect(clashing).toEqual([])
  })

  it('FR-005: los diseños nuevos y los corregidos son menos saturados (S < 0,69) y menos luminosos (L < 0,48) que todo token', () => {
    const ids = [...Object.keys(EXTRA_UNIT_DESIGNS), ...CORRECTED_IDS]
    for (const id of ids) {
      const design = resolveUnitDesign(id)
      expect(design, id).toBeDefined()
      const { s, l } = toHsl(design!.primaryColor)
      expect(s, `${id} ${hex(design!.primaryColor)} saturación`).toBeLessThan(0.69)
      expect(l, `${id} ${hex(design!.primaryColor)} luminosidad`).toBeLessThan(0.48)
    }
  })

  it('el vocabulario de rasgos no crece y ningún aliado nuevo usa rasgos de enemigo (colmillos) ni de anfibio (aleta)', () => {
    for (const [id, design] of Object.entries(EXTRA_UNIT_DESIGNS)) {
      expect(['none', 'horns', 'wings', 'shield', 'spikes', 'tail', 'crest'], id).toContain(design.distinctiveFeature)
    }
  })
})
