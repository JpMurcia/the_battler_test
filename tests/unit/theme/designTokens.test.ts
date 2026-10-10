import { describe, expect, it } from 'vitest'
import { definedTokens, lintCss, lintTsx, parseDeclarations, usedTokens, type RuleId, type Violation } from './tokenPolicy'

/**
 * Política de tokens de diseño (cabecera de src/theme.css): color, radio, tipografía, espaciado, sombras,
 * movimiento, capas y desenfoques salen de tokens `--bc-*`, nunca de valores literales en las pantallas.
 *
 * `src/game/` queda fuera a propósito: es el lienzo de PixiJS, que pinta con colores numéricos (0xRRGGBB) y
 * no pasa por CSS. Las reglas y lo que NO cubren están en ./tokenPolicy.ts.
 */
const cssFiles = import.meta.glob<string>('/src/**/*.css', { query: '?raw', import: 'default', eager: true })
const tsxFiles = import.meta.glob<string>(['/src/**/*.tsx', '!/src/game/**'], { query: '?raw', import: 'default', eager: true })

const THEME = '/src/theme.css'

interface AllowEntry {
  file: string
  rule: RuleId
  prop: RegExp
  reason: string
}

const VITE_LEGACY = 'Plantilla de Vite heredada de index.css; se retira al unificarla con los tokens --bc-* (auditoría de diseño, prioridad 6).'

/**
 * Deuda conocida y acotada: cada entrada nombra archivo, regla y propiedad. No es un cajón de sastre — el test
 * "sin entradas obsoletas" obliga a borrar la entrada en cuanto deja de coincidir con algo, y cualquier valor
 * suelto nuevo (incluso en index.css) falla porque no encaja en ninguna entrada.
 */
const ALLOWLIST: AllowEntry[] = [
  { file: '/src/index.css', rule: 'color-literal', prop: /^--(text|text-h|bg)$/, reason: VITE_LEGACY },
  { file: '/src/index.css', rule: 'font-literal', prop: /^font$/, reason: VITE_LEGACY },
  { file: '/src/index.css', rule: 'font-literal', prop: /^font-weight$/, reason: VITE_LEGACY },
]

const format = (v: Violation) => `${v.file}:${v.line} [${v.rule}] ${v.prop}: ${v.value}`
const isAllowed = (v: Violation) => ALLOWLIST.some((e) => e.file === v.file && e.rule === v.rule && e.prop.test(v.prop))

const cssViolations = (): Violation[] => Object.entries(cssFiles).flatMap(([file, css]) => lintCss(css, file, file === THEME))
const tsxViolations = (): Violation[] => Object.entries(tsxFiles).flatMap(([file, src]) => lintTsx(src, file))

describe('política de tokens de diseño — código real', () => {
  it('escanea los archivos esperados (el glob no coincide en silencio con nada)', () => {
    expect(Object.keys(cssFiles)).toEqual(expect.arrayContaining([THEME, '/src/index.css']))
    expect(Object.keys(tsxFiles).length).toBeGreaterThan(10)
    expect(Object.keys(tsxFiles).some((f) => f.startsWith('/src/game/'))).toBe(false)
  })

  it('el CSS llega con contenido (Vitest lo vacía si no se procesa: ver vite.config.ts)', () => {
    for (const [file, css] of Object.entries(cssFiles)) expect(css.length, file).toBeGreaterThan(0)
    expect(parseDeclarations(cssFiles[THEME]).length).toBeGreaterThan(300)
  })

  it('los CSS no fijan valores sueltos fuera de los tokens', () => {
    const found = cssViolations().filter((v) => !isAllowed(v))
    expect(found.map(format)).toEqual([])
  })

  it('los estilos en línea de los TSX no fijan valores sueltos', () => {
    expect(tsxViolations().map(format)).toEqual([])
  })

  it('la lista de excepciones no tiene entradas obsoletas', () => {
    const violations = cssViolations()
    const stale = ALLOWLIST.filter((e) => !violations.some((v) => v.file === e.file && v.rule === e.rule && e.prop.test(v.prop)))
    expect(stale.map((e) => `${e.file} ${e.rule} ${e.prop}`)).toEqual([])
  })

  it('toda var(--bc-*) que se usa está definida en theme.css (sin tokens huérfanos ni erratas)', () => {
    const defined = definedTokens(cssFiles[THEME])
    const used = new Set<string>()
    for (const source of [...Object.values(cssFiles), ...Object.values(tsxFiles)]) usedTokens(source).forEach((t) => used.add(t))
    expect([...used].filter((t) => !defined.has(t)).sort()).toEqual([])
  })

  it('theme.css solo define propiedades personalizadas con el prefijo --bc-', () => {
    const custom = parseDeclarations(cssFiles[THEME]).filter((d) => d.prop.startsWith('--'))
    expect(custom.length).toBeGreaterThan(50)
    expect(custom.filter((d) => !d.prop.startsWith('--bc-')).map((d) => d.prop)).toEqual([])
  })
})

describe('el linter de CSS detecta cada tipo de valor suelto', () => {
  const rulesOf = (css: string) => lintCss(css, 'x.css').map((v) => v.rule)

  it.each<[string, string, RuleId]>([
    ['hex corto', '.a { color: #fff; }', 'color-literal'],
    ['hex largo en degradado', '.a { background: linear-gradient(90deg, var(--bc-cyan), #0891b2); }', 'color-literal'],
    ['rgba()', '.a { background: rgba(255, 255, 255, 0.06); }', 'color-literal'],
    ['hsl()', '.a { color: hsl(200 50% 50%); }', 'color-literal'],
    ['color con nombre', '.a { border: 1px solid white; }', 'color-literal'],
    ['padding en px', '.a { padding: 10px; }', 'spacing-literal'],
    ['margin mixto con px', '.a { margin: 0 8px; }', 'spacing-literal'],
    ['gap en rem', '.a { gap: 0.5rem; }', 'spacing-literal'],
    ['margen negativo', '.a { margin-top: -4px; }', 'spacing-literal'],
    ['font-size en px', '.a { font-size: 14px; }', 'font-literal'],
    ['font-size en %', '.a { font-size: 120%; }', 'font-literal'],
    ['font-weight numérico', '.a { font-weight: 800; }', 'font-literal'],
    ['font-family literal', ".a { font-family: 'Orbitron', sans-serif; }", 'font-literal'],
    ['font abreviado con px', '.a { font: 700 12px var(--bc-font-heading); }', 'font-literal'],
    ['font abreviado con peso literal', '.a { font: 700 var(--bc-text-xs) var(--bc-font-heading); }', 'font-literal'],
    ['box-shadow con px', '.a { box-shadow: 0 8px 24px var(--bc-border); }', 'shadow-literal'],
    ['transition con duración', '.a { transition: transform 0.15s var(--bc-ease-standard); }', 'motion-literal'],
    ['transition con curva', '.a { transition: transform var(--bc-duration-fast) ease; }', 'motion-literal'],
    ['animation con cubic-bezier', '.a { animation: x var(--bc-duration-loop) cubic-bezier(0.4, 0, 0.2, 1); }', 'motion-literal'],
    ['animation-duration literal', '.a { animation-duration: 2s; }', 'motion-literal'],
    ['z-index numérico', '.a { z-index: 5; }', 'z-index-literal'],
    ['z-index con var que no es de capas', '.a { z-index: var(--bc-space-4); }', 'z-index-literal'],
    ['border-radius en px', '.a { border-radius: 8px; }', 'radius-literal'],
    ['radio de una esquina en px', '.a { border-top-left-radius: 4px; }', 'radius-literal'],
    ['blur en px', '.a { backdrop-filter: blur(10px); }', 'blur-literal'],
    ['blur con prefijo', '.a { -webkit-backdrop-filter: blur(4px); }', 'blur-literal'],
    ['literal dentro de @media', '@media (max-width: 900px) { .a { padding: 12px; } }', 'spacing-literal'],
  ])('%s', (_name, css, rule) => {
    expect(rulesOf(css)).toContain(rule)
  })

  it('una propiedad personalizada con literal solo se acepta en :root del archivo de tokens', () => {
    expect(lintCss(':root { --bc-x: #fff; --bc-pad: 10px; }', 'theme.css', true)).toEqual([])
    expect(lintCss(':root { --bc-x: #fff; }', 'otro.css', false).map((v) => v.rule)).toEqual(['color-literal'])
    expect(lintCss('.a { --bc-x: #fff; }', 'theme.css', true).map((v) => v.rule)).toEqual(['color-literal'])
  })

  it('informa de la línea correcta aunque haya comentarios y varias líneas antes', () => {
    const css = '/* uno\n   dos */\n\n.a {\n  color: var(--bc-text);\n  padding: 10px;\n}\n'
    const [v] = lintCss(css, 'x.css')
    expect(v).toMatchObject({ rule: 'spacing-literal', prop: 'padding', line: 6 })
  })
})

describe('el linter de CSS acepta valores que salen de tokens', () => {
  it.each<[string, string]>([
    ['color y espaciado con var()', '.a { color: var(--bc-text); padding: var(--bc-space-4) 0; margin: 0 auto; gap: var(--bc-space-2); }'],
    ['mezcla de paleta con color-mix', '.a { background: color-mix(in srgb, var(--bc-cyan) var(--bc-wash-soft), transparent); }'],
    ['resplandor con tamaño y color de token', '.a { box-shadow: 0 0 var(--bc-glow-size-sm) var(--bc-glow-cyan); }'],
    ['movimiento con tokens y none', '.a { transition: transform var(--bc-duration-fast) var(--bc-ease-standard); animation: none; }'],
    ['capa, radio de círculo y de token', '.a { z-index: var(--bc-z-overlay); border-radius: 50%; border-radius: var(--bc-radius-pill); }'],
    ['tipografía con tokens', '.a { font: var(--bc-weight-bold) var(--bc-text-xs)/1 var(--bc-font-heading); font-size: var(--bc-text-sm); font-weight: var(--bc-weight-black); }'],
    ['blur con token', '.a { backdrop-filter: blur(var(--bc-blur-md)); }'],
    ['selector #id y literales dentro de comentarios', '#root { margin: 0; } /* color: #fff; padding: 10px; font-size: 14px */'],
    ['url() con fragmento no es un color', '.a { background: url(#grad); }'],
    ['geometría del anillo dentro de @keyframes', '@keyframes k { 50% { box-shadow: 0 0 0 10px transparent, var(--bc-shadow-cta-lifted); } }'],
    ['cadena con ; y { dentro no cierra la regla', ".a::after { content: 'a;b{c'; padding: var(--bc-space-1); }"],
  ])('%s', (_name, css) => {
    expect(lintCss(css, 'x.css')).toEqual([])
  })

  it('un color literal sigue prohibido dentro de @keyframes', () => {
    expect(lintCss('@keyframes k { 0% { box-shadow: 0 0 0 0 rgba(1, 2, 3, 0.5); } }', 'x.css').map((v) => v.rule)).toContain('color-literal')
  })
})

describe('el linter de TSX detecta valores sueltos en estilos en línea', () => {
  const rulesOf = (tsx: string) => lintTsx(tsx, 'x.tsx').map((v) => v.rule)

  it.each<[string, string, RuleId]>([
    ['gap numérico', '<div style={{ gap: 10 }} />', 'spacing-literal'],
    ['margin numérico', '<div style={{ marginTop: 8 }} />', 'spacing-literal'],
    ['padding en cadena con px', "<div style={{ padding: '8px 12px' }} />", 'spacing-literal'],
    ['color hex', "<div style={{ color: '#fff' }} />", 'color-literal'],
    ['hex en la rama de un ternario', "<h1 style={{ color: ok ? 'var(--bc-gold)' : '#f00' }} />", 'color-literal'],
    ['fondo rgba', "<div style={{ background: 'rgba(0,0,0,.5)' }} />", 'color-literal'],
    ['fontSize numérico', '<div style={{ fontSize: 30 }} />', 'font-literal'],
    ['fontWeight numérico', '<div style={{ fontWeight: 700 }} />', 'font-literal'],
    ['zIndex numérico', '<div style={{ zIndex: 3 }} />', 'z-index-literal'],
    ['borderRadius numérico', '<div style={{ borderRadius: 5 }} />', 'radius-literal'],
    ['transición con duración', "<div style={{ transition: 'width 0.2s ease' }} />", 'motion-literal'],
    ['boxShadow con px', "<div style={{ boxShadow: '0 4px 8px var(--bc-border)' }} />", 'shadow-literal'],
    ['objeto en varias líneas', "<div\n  style={{\n    display: 'flex',\n    gap: 6,\n  }}\n/>", 'spacing-literal'],
    ['color literal en un atributo fuera de style', '<svg stroke="#22d3ee" />', 'color-literal'],
    ['rgba literal en un atributo SVG', '<line stroke="rgba(255,255,255,.22)" />', 'color-literal'],
    ['propiedad personalizada con color literal', "<div style={{ '--x': '#fff' }} />", 'color-literal'],
  ])('%s', (_name, tsx, rule) => {
    expect(rulesOf(tsx)).toContain(rule)
  })

  it('informa de la línea de la propiedad infractora', () => {
    const [v] = lintTsx("<div\n  style={{\n    display: 'flex',\n    gap: 6,\n  }}\n/>", 'x.tsx')
    expect(v).toMatchObject({ prop: 'gap', line: 4 })
  })
})

describe('el linter de TSX acepta estilos en línea con tokens', () => {
  it.each<[string, string]>([
    ['tokens de espaciado', "<div style={{ display: 'flex', gap: 'var(--bc-space-4)', padding: 'var(--bc-space-4) var(--bc-space-6)' }} />"],
    ['0 y auto', "<div style={{ margin: 0, marginLeft: 'auto' }} />"],
    ['color de token en ambas ramas de un ternario', "<h1 style={{ color: win ? 'var(--bc-gold)' : 'var(--bc-red)' }} />"],
    ['geometría que no es política (ancho, alto, plantilla)', '<div style={{ width: 260, height: 130, minWidth: 90, flex: 1, left: `${x}%` }} />'],
    ['radio, tamaño y capa de token', "<div style={{ borderRadius: 'var(--bc-radius-pill)', fontSize: 'var(--bc-text-xl)', zIndex: 'var(--bc-z-overlay)' }} />"],
    ['propiedad personalizada con token y spread', "<div style={{ '--x': 'var(--bc-cyan)', ...rest }} />"],
    ['sin estilos en línea', '<div className="screen">#fff 10px</div>'],
  ])('%s', (_name, tsx) => {
    expect(lintTsx(tsx, 'x.tsx')).toEqual([])
  })
})
