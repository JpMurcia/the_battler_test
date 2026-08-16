# Data Model: Reskin Visual Cyber-Modern + Sprites Reales de Combate

Dos tipos de dato conviven en esta spec: **contenido estático** (se añade a `src/data/cats.ts`, mismo patrón ya establecido por el resto de campos de `Cat`) y **catálogos de presentación puros** (tema visual, mapeo de rareza, manifest de sprites — sin lógica de comportamiento, consumidos por pantallas/render pero nunca modificados en runtime). Ninguno toca `src/engine/` ni el esquema persistido de `useMetaStore`/Dexie (Constitución § V/VI).

## Cat (ya existente, `src/data/cats.ts`) — un campo nuevo opcional

```ts
interface Cat {
  // ...todos los campos existentes sin cambios...
  /** specs/021-reskin-cyber-modern (FR-009). Clave hacia SpriteManifest — ausente = sin arte asignado (FR-011, fallback Graphics). */
  spriteKey?: string
}
```

**Validation rules**: si `spriteKey` está presente, DEBE existir como clave en `SPRITE_MANIFEST` (`src/game/spriteAssets.ts`) — se verifica con un test que recorre `CATS` y confirma que todo `spriteKey` no vacío resuelve. Opcional por diseño (research.md Decisión 5 / spec.md FR-011): un `Cat` futuro sin `spriteKey` sigue siendo válido.

**Población inicial** (research.md Decisión 3): los 12 `CATS` existentes reciben, en el mismo orden en que ya aparecen en el array — `basic-cat`, `tank-cat`, `speed-cat`, `heavy-cat`, `solar-cat`, `armored-cat`, `frost-cat`, `weaken-cat`, `slow-cat`, `zombie-ward-cat`, `triple-strike-cat`, `lucky-cat` — los valores `hero_1` … `hero_12` respectivamente.

## ThemeTokens (nuevo, catálogo de presentación — `src/theme.css`)

No es una interfaz TypeScript sino un conjunto de CSS custom properties en `:root`, consumido por `className` desde cualquier pantalla. Se documenta aquí como catálogo de datos porque cumple el mismo rol que `UIThemeCatalog` cumplía en la spec Unity análoga (`legacy-unity-project/specs/022-cyber-modern-theme/data-model.md`): fuente única de verdad, sin lógica.

| Token | Valor | Uso |
|---|---|---|
| `--bc-bg` | `#020308` | fondo de página/pantalla |
| `--bc-surface` | `rgba(20,22,30,.9)` | relleno de panel de cristal |
| `--bc-border` | `rgba(255,255,255,.14)` | borde de panel |
| `--bc-text` / `--bc-text-dim` / `--bc-text-faint` | `#f4f6fb` / `#94a3b8` / `#5b6577` | jerarquía de texto |
| `--bc-cyan` | `#22d3ee` | acento primario / equipo jugador |
| `--bc-orange` | `#fb923c` | acento secundario |
| `--bc-purple` | `#a855f7` | acento terciario |
| `--bc-gold` | `#facc15` | moneda/tesoros/rango |
| `--bc-red` | `#ef4444` | equipo enemigo / peligro |
| `--bc-green` | `#4ade80` | positivo/disponible |
| `--bc-pink` | `#f472b6` | biblioteca/colaboración |
| `--bc-gradient-primary-start` / `-end` | `#fb923c` / `#ef4444` | CTA primario (p. ej. "¡Batalla!") |
| `--bc-radius-sm` / `-md` / `-lg` | `10px` / `14px` / `18px` | radios de esquina |
| `--bc-font-heading` | `'Orbitron', sans-serif` | títulos, botones |
| `--bc-font-body` | `'Inter', sans-serif` | cuerpo, etiquetas |

**Validation rules**: ninguna pantalla dentro del alcance de esta spec fija un color/radio/tipografía por valor literal — siempre a través de uno de estos tokens o de una clase utilitaria que ya los use (spec.md SC-002). Verificable por revisión de código (grep de hex/px literales en los archivos de pantalla tocados), no por test automatizado.

## RarityColorMap (nuevo, catálogo de presentación — vive junto a `RarityType` en `src/data/cats.ts` o en `src/theme.css` como clases `.tag--<rareza>`)

| `RarityType` | Token |
|---|---|
| `Normal` | `--bc-text-dim` |
| `Especial` | `--bc-green` |
| `Raro` | `--bc-cyan` |
| `Superraro` | `--bc-purple` |
| `Megarraro` | `--bc-gold` |
| `Legendario` | `--bc-orange` |
| `Colaboración` | `--bc-pink` |

**Validation rules**: cobertura total — las 7 variantes de `RarityType` (`src/data/cats.ts`) tienen una entrada; un test unitario recorre el union type (vía un array literal exhaustivo) y confirma que `RarityColorMap` resuelve para cada una, para que un futuro octavo valor de rareza sin mapeo falle el test en vez de renderizar sin color.

## SpriteManifest (nuevo — `src/game/spriteAssets.ts`)

```ts
interface SpriteAnimationSet {
  idle: string[]   // 16 rutas, public/sprites/hero_N/idle/1.png..16.png (recuento real del pack fuente)
  attack: string[] // 12 rutas, public/sprites/hero_N/attack/1.png..12.png (recuento real del pack fuente — distinto de idle)
}

type SpriteManifest = Record<string, SpriteAnimationSet> // clave = spriteKey (p.ej. "hero_1")
```

`resolveSpriteAnimationSet(spriteKey: string | undefined): SpriteAnimationSet | undefined` — función pura: `undefined` si `spriteKey` es `undefined` o no existe en el manifest (fallback a `Graphics`, FR-011). No depende de Pixi ni de React — testeable con Vitest igual que `getVisualProfile` (`specs/003`).

**Validation rules**: cada `idle` tiene exactamente 16 rutas y cada `attack` exactamente 12 (recuento real verificado en las 12 carpetas fuente asignadas — `assets-source/units/Characters/hero_N/male/1_idle` trae 16 PNGs, `4_attack` trae 12; son recuentos distintos entre sí, no el mismo) — un frame faltante rompería el ciclo de animación a mitad de loop, así que se valida por el propio script de copia (research.md Decisión 5): si alguna `1_idle` no tiene 16 PNGs o alguna `4_attack` no tiene 12, el script falla en vez de generar un manifest incompleto en silencio.

## AnimationState → carpeta de sprite (extensión aditiva de `src/game/animation.ts`)

```ts
const ANIMATION_STATE_TO_SPRITE_FOLDER: Record<AnimationState, keyof SpriteAnimationSet> = {
  Idle: 'idle',
  Attacking: 'attack',
}
```

Vive junto a `getAnimationState`/`getAnimationPose` ya existentes (mismo archivo, mismo criterio de función pura sin dependencias de render) — ninguna de esas dos funciones cambia de firma ni de comportamiento; esta tabla es puramente aditiva.

## Relación entre entidades

```text
Cat.spriteKey (contenido, src/data/cats.ts)
  └─ resolveSpriteAnimationSet() ─→ SpriteAnimationSet | undefined (una vez por unidad, cacheado igual que VisualProfile hoy)

BattleUnit.state (motor, sin cambios)
  └─ getAnimationState() [ya existente] ─→ AnimationState
       └─ ANIMATION_STATE_TO_SPRITE_FOLDER ─→ 'idle' | 'attack' (decide qué arreglo de texturas del SpriteAnimationSet está activo)

RarityType (contenido existente, src/data/cats.ts)
  └─ RarityColorMap ─→ token de color consumido por .tag--<rareza> en pantallas de Biblioteca/Equipar/Mejorar

ThemeTokens (src/theme.css)
  └─ consumido por className en las 12 pantallas + wrapper CSS de BattleStage — nunca modificado en runtime
```

Ningún nodo de este grafo modifica `src/engine/`, `BattleUnit`, `SimState` ni el esquema persistido por `useMetaStore`/Dexie.
