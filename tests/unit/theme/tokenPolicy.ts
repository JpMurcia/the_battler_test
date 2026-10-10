/**
 * Política de tokens de diseño (cabecera de src/theme.css): ninguna pantalla fija color, radio, tipografía,
 * espaciado, sombra, movimiento, capa (z-index) ni desenfoque por valor literal — todo sale de un token
 * `--bc-*` de theme.css. Este módulo es el linter; designTokens.test.ts lo ejecuta sobre el código real.
 *
 * Qué NO cubre a propósito (geometría propia de cada componente, no un valor de diseño compartido):
 * width/height/top/left/inset, line-height, letter-spacing, opacity, transform, grillas y media queries.
 */

export type RuleId =
  | 'color-literal'
  | 'spacing-literal'
  | 'font-literal'
  | 'shadow-literal'
  | 'motion-literal'
  | 'z-index-literal'
  | 'radius-literal'
  | 'blur-literal'

export interface Violation {
  file: string
  line: number
  rule: RuleId
  prop: string
  value: string
}

export interface CssDecl {
  prop: string
  value: string
  line: number
  /** La declaración está dentro de una regla `:root` (definición de tokens si el archivo es theme.css). */
  inRoot: boolean
  /** Dentro de @keyframes: la geometría de una animación (p. ej. el anillo de un pulso) es propia de ella. */
  inKeyframes: boolean
}

const NAMED_COLORS = new Set([
  'white', 'black', 'red', 'green', 'blue', 'yellow', 'orange', 'purple', 'pink', 'gray', 'grey', 'cyan',
  'magenta', 'silver', 'gold', 'brown', 'navy', 'teal', 'lime', 'maroon', 'olive', 'aqua', 'fuchsia',
  'indigo', 'violet', 'coral', 'salmon', 'crimson', 'tomato', 'khaki', 'tan', 'beige', 'ivory',
])

const COLOR_PROPS = /^(color|background(-color|-image)?|border(-(top|right|bottom|left))?(-color)?|outline(-color)?|fill|stroke|box-shadow|text-shadow|caret-color|accent-color)$/
const SPACING_PROPS = /^((padding|margin)(-(top|right|bottom|left|inline|block)(-(start|end))?)?|gap|row-gap|column-gap)$/
const RADIUS_PROPS = /^border(-(top|bottom|start|end)-(left|right|start|end))?-radius$/
const MOTION_PROPS = /^(transition|animation)(-(duration|delay|timing-function))?$/

const HEX = /(?<![\w&-])#[0-9a-fA-F]{3,8}\b/
const COLOR_FUNCTION = /\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(|\bcolor\(\s*[a-z-]+/i
const LENGTH = /(?<![\w.#-])(-?\d*\.?\d+)(px|rem|em|vh|vw|pt|ch)\b/g
const TIME = /(?<![\w.#-])(\d*\.?\d+)(ms|s)\b/g
const EASING = /\b(ease|ease-in|ease-out|ease-in-out|linear|step-start|step-end)\b|cubic-bezier\(|steps\(/

/** Sustituye `var(...)` (con un nivel de anidación, p. ej. fallbacks) y `url(...)` por marcadores neutros. */
function neutralize(value: string): string {
  return value.replace(/url\([^)]*\)/g, 'URL').replace(/var\((?:[^()]|\([^()]*\))*\)/g, 'VAR')
}

function nonZero(re: RegExp, text: string): string[] {
  return [...text.matchAll(re)].filter((m) => parseFloat(m[1]) !== 0).map((m) => m[0])
}

/** Palabras de color CSS con nombre en un valor (tras quitar var() y funciones, que no son colores). */
function namedColorsIn(value: string): string[] {
  const words = neutralize(value).toLowerCase().replace(/[a-z-]+\(/g, ' ').match(/[a-z]+/g) ?? []
  return words.filter((w) => NAMED_COLORS.has(w))
}

function hasColorLiteral(value: string): boolean {
  const v = neutralize(value)
  return HEX.test(v) || COLOR_FUNCTION.test(v)
}

/** Reglas por tipo de valor; devuelve las infracciones de UNA declaración (misma lógica para CSS y para estilos en línea). */
function checkValue(prop: string, value: string, inKeyframes: boolean): RuleId[] {
  const rules: RuleId[] = []
  const v = neutralize(value)

  if (hasColorLiteral(value) || (COLOR_PROPS.test(prop) && namedColorsIn(value).length > 0)) rules.push('color-literal')
  if (SPACING_PROPS.test(prop) && nonZero(LENGTH, v).length > 0) rules.push('spacing-literal')
  if (RADIUS_PROPS.test(prop) && nonZero(LENGTH, v).length > 0) rules.push('radius-literal')

  if (prop === 'font-size' && nonZero(/(?<![\w.#-])(-?\d*\.?\d+)(px|rem|em|pt|%)(?!\w)/g, v).length > 0) rules.push('font-literal')
  if (prop === 'font-weight' && /^\s*(\d{3}|bold|bolder|lighter)\s*$/.test(v)) rules.push('font-literal')
  if (prop === 'font-family' && !/VAR|^\s*(inherit|initial|unset)\s*$/.test(v)) rules.push('font-literal')
  if (prop === 'font' && (nonZero(LENGTH, v).length > 0 || /\b[1-9]00\b/.test(v))) rules.push('font-literal')

  if ((prop === 'box-shadow' || prop === 'text-shadow') && !inKeyframes && nonZero(LENGTH, v).length > 0) rules.push('shadow-literal')
  if (MOTION_PROPS.test(prop) && (nonZero(TIME, v).length > 0 || EASING.test(v))) rules.push('motion-literal')
  if (prop === 'z-index' && !/^\s*(auto|var\(\s*--bc-z-[\w-]+\s*\))\s*$/.test(value)) rules.push('z-index-literal')
  if ((prop === 'backdrop-filter' || prop === '-webkit-backdrop-filter' || prop === 'filter') && /blur\(\s*-?\d/.test(v)) {
    rules.push('blur-literal')
  }
  return rules
}

/**
 * Extrae las declaraciones de un CSS conservando el número de línea. Reconoce comentarios, cadenas, paréntesis
 * (un `;` o `{` dentro de `url(...)`/`var(...)` no cierra nada) y anidación de @media/@keyframes.
 */
export function parseDeclarations(css: string): CssDecl[] {
  const src = css.replace(/\r\n/g, '\n').replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
  const decls: CssDecl[] = []
  const stack: string[] = []
  let buf = ''
  let bufLine = 1
  let line = 1
  let paren = 0
  let quote: string | null = null

  const flush = () => {
    const text = buf.trim()
    buf = ''
    if (!text || text.startsWith('@')) return
    const colon = text.indexOf(':')
    if (colon < 0) return
    decls.push({
      prop: text.slice(0, colon).trim().toLowerCase(),
      value: text.slice(colon + 1).trim(),
      line: bufLine,
      inRoot: stack.length > 0 && stack[stack.length - 1] === ':root',
      inKeyframes: stack.some((s) => /^@(-webkit-)?keyframes/.test(s)),
    })
  }

  for (const ch of src) {
    if (ch === '\n') line++
    if (quote) {
      buf += ch
      if (ch === quote) quote = null
      continue
    }
    if (ch === '"' || ch === "'") {
      if (!buf.trim()) bufLine = line
      quote = ch
      buf += ch
      continue
    }
    if (ch === '(') paren++
    if (ch === ')') paren = Math.max(0, paren - 1)
    if (paren === 0 && ch === '{') {
      stack.push(buf.trim())
      buf = ''
      continue
    }
    if (paren === 0 && ch === '}') {
      flush()
      stack.pop()
      continue
    }
    if (paren === 0 && ch === ';') {
      flush()
      continue
    }
    if (!buf.trim() && !/\s/.test(ch)) bufLine = line
    buf += ch
  }
  return decls
}

/**
 * Aplica la política a un CSS. En el archivo de tokens (`isTokenFile`), las propiedades personalizadas dentro de
 * `:root` SON las definiciones y quedan exentas — ahí viven los literales; en cualquier otro sitio no.
 */
export function lintCss(css: string, file: string, isTokenFile = false): Violation[] {
  const out: Violation[] = []
  for (const d of parseDeclarations(css)) {
    if (isTokenFile && d.inRoot && d.prop.startsWith('--')) continue
    for (const rule of checkValue(d.prop, d.value, d.inKeyframes)) {
      out.push({ file, line: d.line, rule, prop: d.prop, value: d.value })
    }
  }
  return out
}

/** Nombres de tokens `--bc-*` definidos (como propiedad personalizada) en un CSS. */
export function definedTokens(css: string): Set<string> {
  return new Set(parseDeclarations(css).filter((d) => d.prop.startsWith('--bc-')).map((d) => d.prop))
}

/** Nombres `--bc-*` referenciados con `var(...)` en cualquier fuente (CSS o TSX). */
export function usedTokens(source: string): Set<string> {
  return new Set([...source.matchAll(/var\(\s*(--bc-[\w-]+)/g)].map((m) => m[1]))
}

// ———————————————————————————————— TSX: estilos en línea ————————————————————————————————

const CAMEL_TO_KEBAB = (key: string) => key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)

/** Parte `texto` por `sep` solo en el nivel superior (ignora lo que va dentro de (), [], {}, comillas y plantillas). */
function splitTopLevel(text: string, sep: string): { text: string; offset: number }[] {
  const parts: { text: string; offset: number }[] = []
  let depth = 0
  let quote: string | null = null
  let start = 0
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quote) {
      if (c === '\\') i++
      else if (c === quote) quote = null
      continue
    }
    if (c === "'" || c === '"' || c === '`') quote = c
    else if (c === '(' || c === '[' || c === '{') depth++
    else if (c === ')' || c === ']' || c === '}') depth--
    else if (c === sep && depth === 0) {
      parts.push({ text: text.slice(start, i), offset: start })
      start = i + 1
    }
  }
  parts.push({ text: text.slice(start), offset: start })
  return parts
}

/** Literales de cadena de una expresión JS (`'a'`, `"b"`, `` `c${x}` `` → `c X`). */
function stringLiterals(expr: string): string[] {
  return [...expr.matchAll(/'([^'\\\n]*)'|"([^"\\\n]*)"|`([^`]*)`/g)].map((m) => (m[1] ?? m[2] ?? m[3].replace(/\$\{[^}]*\}/g, 'X')))
}

function lineAt(src: string, index: number): number {
  return src.slice(0, index).split('\n').length
}

/** Lint de un `.tsx`: literales de color en cadenas y propiedades de `style={{ ... }}` con valores sueltos. */
export function lintTsx(source: string, file: string): Violation[] {
  const src = source.replace(/\r\n/g, '\n')
  const out: Violation[] = []

  // 1) Cualquier cadena que sea un color literal (`'#fff'`, `"rgb(…)"`), también en atributos como fill/stroke.
  for (const m of src.matchAll(/'([^'\\\n]*)'|"([^"\\\n]*)"/g)) {
    const s = m[1] ?? m[2]
    if (/^#[0-9a-fA-F]{3,8}$/.test(s) || /\b(rgba?|hsla?)\(/.test(s)) {
      out.push({ file, line: lineAt(src, m.index ?? 0), rule: 'color-literal', prop: '(cadena)', value: s })
    }
  }

  // 2) Objetos `style={{ ... }}`.
  let from = 0
  for (;;) {
    const at = src.indexOf('style={{', from)
    if (at < 0) break
    const open = at + 'style={'.length
    let depth = 0
    let end = open
    for (; end < src.length; end++) {
      if (src[end] === '{') depth++
      else if (src[end] === '}' && --depth === 0) break
    }
    from = end
    const body = src.slice(open + 1, end)
    for (const entry of splitTopLevel(body, ',')) {
      const m = entry.text.match(/^\s*(?:(\w+)|'([^']+)'|"([^"]+)")\s*:\s*([\s\S]+?)\s*$/)
      if (!m) continue // spread, shorthand, vacío
      const key = m[1] ?? m[2] ?? m[3]
      if (key.startsWith('--')) continue
      const expr = m[4]
      const prop = CAMEL_TO_KEBAB(key)
      const line = lineAt(src, open + 1 + entry.offset + (entry.text.length - entry.text.trimStart().length))
      const add = (rule: RuleId) => out.push({ file, line, rule, prop: key, value: expr })

      // Valor numérico desnudo: en React son px (excepto 0). Solo importa donde la política exige token.
      const numeric = /^-?\d+(\.\d+)?$/.test(expr) ? parseFloat(expr) : null
      if (numeric !== null && numeric !== 0) {
        if (SPACING_PROPS.test(prop)) add('spacing-literal')
        else if (RADIUS_PROPS.test(prop)) add('radius-literal')
        else if (prop === 'font-size') add('font-literal')
        else if (prop === 'z-index') add('z-index-literal')
      }
      if (numeric !== null && prop === 'font-weight') add('font-literal')

      // Cadenas dentro del valor (incluye ramas de ternarios): se evalúan con las mismas reglas que el CSS.
      const seen = new Set<RuleId>()
      for (const s of stringLiterals(expr)) {
        for (const rule of checkValue(prop, s, false)) {
          if (!seen.has(rule)) {
            seen.add(rule)
            add(rule)
          }
        }
      }
    }
  }
  return out
}
