# Phase 1 Data Model: Datos Semilla, Assets Procedimentales y Flujo de Navegación

## SeedUnit (nuevo — `src/data/seedData.ts`)

Esquema exacto pedido por el usuario; independiente del `Cat` de producción (ver research.md Decisión 1).

```ts
export type SeedRarity = 'Normal' | 'Rare' | 'SuperRare' | 'UberRare'
export type SeedTargetType = 'Single' | 'Area'
export type SeedTrait = 'Red' | 'Floating' | 'Black' | 'Angel' | 'Alien'
export type ProceduralShape = 'circle' | 'rect' | 'poly'

export interface SeedUnitStats {
  hp: number
  attackPower: number
  attackRange: number
  moveSpeed: number
  attackCooldown: number
  cost: number
  spawnCooldown: number
}

export interface ProceduralDesign {
  primaryColor: number       // color hex 0xRRGGBB
  baseShape: ProceduralShape
  size: number                // px, lado o diámetro base del cuerpo
  distinctiveFeature: 'cat-ears' | 'fangs' | 'fin' | 'crest' | 'none'
}

export interface SeedUnit {
  id: string
  name: string
  rarity: SeedRarity
  stats: SeedUnitStats
  targetType: SeedTargetType
  traits: SeedTrait[]
  proceduralDesign: ProceduralDesign
}
```

**Reglas de validación** (derivadas de spec.md FR-001 a FR-004):
- `traits` puede ser `[]` (unidad "sin rasgo especial", ej. Perro Básico) — nunca `undefined`.
- `stats.*` son todos > 0, salvo `attackRange` que puede ser 0 (solo superposición directa).
- Exactamente 4 entradas de `rarity` distinta en `SEED_UNITS` (una por valor de `SeedRarity`).
- Exactamente 3 entradas en `SEED_ENEMIES`, con `traits` = `[]`, `['Red']`, `['Floating']` respectivamente.

### Catálogo semilla (contenido inicial — FR-001/FR-002)

| id | rarity | rol/arquetipo | hp | attackPower | attackRange | moveSpeed | attackCooldown | cost | spawnCooldown | traits |
|---|---|---|---|---|---|---|---|---|---|---|
| `seed-cat-basic` | Normal | Básico equilibrado | 50 | 5 | 0 | 20 | 1.0 | 10 | 2 | [] |
| `seed-cat-wall` | Rare | Muro/Tanque (HP muy alto, rango corto, lento) | 400 | 3 | 0 | 8 | 1.5 | 60 | 5 | [] |
| `seed-cat-ranged` | SuperRare | A distancia (rango alto, HP bajo, costo medio) | 35 | 12 | 250 | 14 | 1.8 | 200 | 8 | [] |
| `seed-cat-titan` | UberRare | Titán/Boss (daño masivo, HP alto, cooldown/costo muy altos) | 600 | 90 | 0 | 10 | 4.0 | 2700 | 40 | [] |
| `seed-enemy-dog` | — | Perro Básico (sin rasgo) | 60 | 6 | 0 | 12 | 1.2 | 0 | 3 | [] |
| `seed-enemy-red-snake` | — | Serpiente Roja (Red, alta velocidad) | 45 | 8 | 0 | 35 | 0.9 | 0 | 3 | [Red] |
| `seed-enemy-floating-hippo` | — | Hipopótamo Flotante (Floating, HP alto) | 350 | 10 | 0 | 9 | 1.6 | 0 | 6 | [Floating] |

Los enemigos no llevan `rarity` de jugador con sentido de gacha — se les asigna `'Normal'` por consistencia de tipo (`rarity` es obligatorio en `SeedUnit`), sin efecto funcional (no se gastan en invocación de jugador).

## Adaptador `seedUnitToCat` (nuevo — `src/data/seedData.ts`)

Función pura, sin estado, que produce un `Cat` (tipo ya existente en `src/data/cats.ts`) a partir de un `SeedUnit`, según la tabla de mapeo de research.md Decisión 1. `width` se deriva de `proceduralDesign.size` con la misma escala que usa `getVisualProfile` para `bodyWidth` hoy (evita dos fuentes de verdad de tamaño visual vs. hitbox).

```ts
export function seedUnitToCat(unit: SeedUnit): Cat
export const SEED_UNITS: SeedUnit[]           // los 4 gatos
export const SEED_ENEMIES: SeedUnit[]         // los 3 enemigos
export const SEED_CATS_AS_CATS: Cat[]         // SEED_UNITS.map(seedUnitToCat)
export const SEED_ENEMIES_AS_CATS: Cat[]      // SEED_ENEMIES.map(seedUnitToCat)
```

`src/data/cats.ts` importa y hace spread de `SEED_CATS_AS_CATS` + `SEED_ENEMIES_AS_CATS` dentro de `CATS` (append, nunca reemplazo — spec.md § Assumptions).

## ProceduralDesign → Textura (nuevo — `src/game/graphics/unitFactory.ts`)

No es una entidad persistida; es una función determinista de `ProceduralDesign` + `role` (`'ally' | 'enemy'`) a una `Texture` de PixiJS, cacheada en memoria por el proceso (nunca en Dexie — es un derivado reconstruible, no estado de progreso).

```ts
export function drawSeedUnit(g: Graphics, design: ProceduralDesign, role: 'ally' | 'enemy'): void
export function getOrCreateUnitTexture(renderer: Renderer, seedUnitId: string, design: ProceduralDesign, role: 'ally' | 'enemy'): Texture
export function clearUnitTextureCache(): void // solo para tests — evita fugas de estado entre casos
```

**Relaciones**: `UnitSprite.tsx` consulta `getOrCreateUnitTexture` solo cuando el `Cat` resuelto no tiene `spriteKey` (sprite real) **y** su `id` existe en `SEED_UNITS`/`SEED_ENEMIES` (tiene `proceduralDesign`). Ver research.md Decisión 2 para la cadena de fallback completa.

## Nivel de demostración (nuevo — `src/data/levels.ts`)

Se añade una entrada a `LEVELS` (o se reutiliza `level-1` si el checklist de balance lo permite — decisión final en tasks.md) cuyo `enemyWave` referencia `seed-enemy-dog`, `seed-enemy-red-snake`, `seed-enemy-floating-hippo` por `catId`, de modo que el catálogo semilla sea jugable de punta a punta (research.md Decisión 3, spec.md US3).

No se modifica la forma de `Level` — reutiliza `EnemyWaveEntry.catId` ya existente.

## Sin cambios de esquema en

- `BattleUnit` (`src/engine/types.ts`) — el motor de combate sigue leyendo `Cat`, nunca `SeedUnit` directamente.
- `db/index.ts` (Dexie) — ninguna tabla nueva; el catálogo semilla es contenido estático, no progreso de jugador.
- `useGameStore.ts` / `useMetaStore.ts` — sin cambios de forma; consumen `CATS` ya extendido.
