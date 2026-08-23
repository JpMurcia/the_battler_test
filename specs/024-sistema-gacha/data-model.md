# Data Model: Sistema de Gacha Completo ("Cápsula de Gatos")

## `GachaBanner` (nuevo — `src/data/gacha.ts`)

```ts
export interface GachaRarityOdds {
  rarity: 'Legendario' | 'Megarraro' | 'Superraro' | 'Raro'
  percent: number // suman 100 dentro de un mismo banner (research.md Decisión 6)
}

export interface GachaBanner {
  id: string
  name: string
  tagline: string
  odds: GachaRarityOdds[] // orden Legendario → Raro, coincide con el mockup
}
```

3 banners fijos (research.md Decisión 6), sin fecha de expiración (spec.md § Assumptions):

| `id` | `name` | Legendario | Megarraro | Superraro | Raro |
|---|---|---|---|---|---|
| `uberfest` | UBERFEST | 0.3% | 9% | 26% | 64.7% |
| `epicfest` | EPICFEST | — | 9% | 26% | 65% |
| `estandar` | Banner Estándar | — | 5% | 15% | 80% |

## `GACHA_POOL` (nuevo — `src/data/gacha.ts`)

```ts
export const GACHA_POOL: Record<'Legendario' | 'Megarraro' | 'Superraro' | 'Raro', string[]> // catId[]
```

Poblado filtrando `CATS` (incluye `SEED_CATS_AS_CATS` y los nuevos `GACHA_UNITS_AS_CATS`) por `cat.rarity`:

| Rareza | Origen de los `catId` | Cantidad |
|---|---|---|
| `Raro` | Ya existentes en `CATS` (specs/001-023) | 5 producción + 1 semilla (`seed-cat-wall`) = 6 |
| `Superraro` | Ya existentes en `CATS` | 3 producción + 1 semilla (`seed-cat-ranged`) = 4 |
| `Megarraro` | Ya existentes en `CATS` | 1 semilla (`seed-cat-titan`) = 1 |
| `Legendario` | **Nuevos** — `src/data/gachaUnits.ts` (FR-013) | 2 |

`Colaboración` no participa de ningún banner de esta spec (spec.md § Assumptions: sin evento temporal real) — sus 2 `catId` nuevos (ver abajo) existen en `CATS` con `rarity: 'Colaboración'` para satisfacer la etiqueta/tag, pero fuera del pool de gacha activo hasta una spec de seguimiento con eventos temporales.

## `src/data/gachaUnits.ts` (nuevo — 4 `Cat` gacha-exclusivos)

Mismo shape que cualquier entrada de `CATS` (research.md Decisión 2: sin `spriteKey`, sin registrar en `SEED_UNITS`/`SEED_ENEMIES` — caen en el fallback `Graphics` genérico de `UnitSprite.tsx`, animación idle/ataque vía `animation.ts`, Constitución § III):

| `id` | `name` | `rarity` | Nota de diseño |
|---|---|---|---|
| `legend-cat-eclipse` | Gato Eclipse | `Legendario` | Stats tope del catálogo (por encima de `seed-cat-titan`), coste/cooldown altos — arquetipo "insignia" (manual § 5.2) |
| `legend-cat-supreme` | Gato Supremo | `Legendario` | Segundo Legendario, rol distinto (área/soporte) para no duplicar arquetipo con Eclipse |
| `collab-cat-voidwalker` | Gato Errante del Vacío | `Colaboración` | Reservado para pool futuro de evento (fuera de banners activos, ver arriba) |
| `collab-cat-star-idol` | Gato Ídolo Estelar | `Colaboración` | Reservado para pool futuro de evento (fuera de banners activos, ver arriba) |

`GACHA_UNITS_AS_CATS: Cat[] = GACHA_UNITS.map(...)` se suma a `CATS` en `src/data/cats.ts` (mismo patrón `...SEED_CATS_AS_CATS` ya usado, append, nunca reemplazo).

## `rollOne(banner, random?)` / `rollMany(banner, count, random?)` (nuevo — `src/data/gacha.ts`)

```ts
export interface GachaRollResult {
  catId: string
  rarity: 'Legendario' | 'Megarraro' | 'Superraro' | 'Raro'
}

export function rollOne(banner: GachaBanner, random: () => number = Math.random): GachaRollResult
export function rollMany(banner: GachaBanner, count: number, random?: () => number): GachaRollResult[]
```

Funciones puras (Constitución § IV: balance vive en datos/funciones sobre datos, no en un componente) — `random` inyectable para que `tests/unit/data/gacha.test.ts` pueda validar SC-003 (1.000 tiradas, distribución dentro de ±2pp) sin depender de `Math.random` real.

## `GachaStorageRow` (nueva tabla Dexie — `src/db/index.ts`)

```ts
export interface GachaStorageRow {
  id?: number // clave primaria autoincremental (research.md Decisión 5)
  catId: string
  rarity: 'Legendario' | 'Megarraro' | 'Superraro' | 'Raro'
}
```

```ts
this.version(10).stores({
  gachaStorage: '++id',
})
```

Una fila por cápsula individual pendiente — múltiples filas pueden compartir `catId` (dos cápsulas del mismo gato conviven hasta que cada una se activa/intercambia por separado).

## `PlayerProfileRow` (modificado — campos opcionales nuevos, sin bump de versión)

```ts
export interface PlayerProfileRow {
  // ...campos existentes sin cambios...
  /** specs/024-sistema-gacha (FR-018). Ausente en filas viejas = 0 al leer (sin migración). */
  gachaCurrency?: number
  /** specs/024-sistema-gacha (FR-009). Ausente en filas viejas = 0 al leer (sin migración). */
  npCurrency?: number
}
```

## `OwnedCatRow` / `OwnedCatMeta` (modificado — campo opcional nuevo)

```ts
export interface OwnedCatRow {
  // ...campos existentes sin cambios...
  /** specs/024-sistema-gacha (FR-007). Ausente en filas viejas = 0 al leer (sin migración, mismo patrón que evolutionStage). */
  plusLevel?: number
}
```

`characterLevelOf` (`useMetaStore.ts:107`, Rango de Usuario) pasa a sumar `cat.level + (cat.plusLevel ?? 0)` por gato — único punto de cálculo, ya reutilizado por `UpgradeScreen`/`claimRankThreshold` (sin cambios en esos consumidores).

## Flujo de estado — `useMetaStore` (nuevas acciones)

```ts
interface MetaState {
  // ...
  gachaCurrency: number
  npCurrency: number
  gachaStorage: GachaStorageRow[] // hidratado desde db.gachaStorage.toArray()

  addGachaCurrency: (amount: number) => void
  rollGachaSingle: (bannerId: string) => GachaRollResult | null   // null = saldo insuficiente (FR-004)
  rollGachaMulti: (bannerId: string) => GachaRollResult[] | null  // null = saldo insuficiente (FR-004)
  activateCapsule: (storageRowId: number) => void   // FR-006/FR-007
  exchangeCapsuleForXp: (storageRowId: number) => void   // FR-008 (XP = currency, Decisión 1)
  exchangeCapsuleForNp: (storageRowId: number) => boolean // FR-009 — false si la rareza no es Megarraro/Legendario
}
```

- `rollGachaSingle`/`rollGachaMulti`: descuentan `gachaCurrency` (150/1.500), llaman a `rollOne`/`rollMany` con el banner resuelto por `bannerId`, insertan cada resultado en `db.gachaStorage` y en el estado local `gachaStorage` (FR-001/FR-002/FR-005) — nunca tocan `ownedCats` directamente.
- `activateCapsule(storageRowId)`: busca la fila en `gachaStorage`; si `ownedCats[catId]` no existe, llama a `addOwnedCat(catId)` (mecanismo ya existente, sin cambios); si ya existe, incrementa `plusLevel` en 1 vía `db.ownedCats.put`; en ambos casos elimina la fila de `db.gachaStorage` (FR-006/FR-007).
- `exchangeCapsuleForXp`/`exchangeCapsuleForNp`: eliminan la fila de `db.gachaStorage` y suman a `currency`/`npCurrency` respectivamente (monto de intercambio: alcance de `tasks.md`, no bloquea el modelo de datos) — `exchangeCapsuleForNp` valida `rarity` antes de aplicar (FR-009).

## Pantalla — `GachaScreen.tsx` (reescrita, sin `Screen` nuevo — research.md Decisión 4)

Estado local (efímero, no persistido): `activeTab: 'roll' | 'storage'`, `activeBannerId: string`, `revealResults: GachaRollResult[] | null`. El Almacén (`activeTab === 'storage'`) lista `gachaStorage` agrupado por `catId`, cada fila con dos acciones ("Activar" / "Intercambiar por XP" y, si `rarity` es `Megarraro`/`Legendario`, "Intercambiar por NP").
