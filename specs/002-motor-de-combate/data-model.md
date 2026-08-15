# Data Model: Motor de Combate Real

## BattleUnit (ya existente, `src/state/useGameStore.ts`)

Sin cambios de forma respecto a `specs/001-nucleo-del-juego/spec.md` — esta spec es la primera que efectivamente lo puebla, mueve y hace combatir.

```ts
interface BattleUnit {
  instanceId: string
  catId: string
  team: 'Player' | 'Enemy'
  x: number
  width: number
  hp: number
  maxHp: number
  damage: number
  attackIntervalSeconds: number
  attackCooldownRemaining: number
  speed: number // 0 mientras está "Engaged"
  state: 'Moving' | 'Engaged' | 'Dead'
}
```

**Transiciones de estado**: `Moving` → `Engaged` (al superponerse con una entidad enemiga) → `Dead` (hp llega a 0) — nunca al revés; una unidad `Engaged` cuyo oponente muere vuelve a `Moving`, no hay estado intermedio adicional.

## EnemyWave (nuevo, `src/data/levels.ts`)

```ts
interface EnemyWaveEntry {
  catId: string        // referencia a CATS — reutiliza el catálogo existente
  spawnAtSeconds: number // segundos transcurridos de batalla en que aparece
}
```

`Level.enemyWave: EnemyWaveEntry[]` — lista ordenada por `spawnAtSeconds`. Una entrada se "consume" (spawnea como `BattleUnit` con `team: 'Enemy'`, posición inicial junto a la base enemiga) exactamente una vez, cuando `elapsedSeconds >= spawnAtSeconds` y no fue spawneada todavía.

**Validation rules**: `spawnAtSeconds` no decreciente en la lista (orden de definición = orden de spawn); `catId` debe existir en `CATS` (mismo catálogo que las unidades del jugador).

## Extensión de estado efímero (`useGameStore` — campos internos, no expuestos en la spec pública de la store)

```ts
interface GameState {
  // ...campos ya existentes (status, levelId, energy, playerBase, enemyBase, units, deployCooldowns)
  elapsedSeconds: number      // nuevo — tiempo transcurrido de la batalla en curso
  enemiesSpawnedCount: number // nuevo — cuántas entradas de enemyWave ya se consumieron
}
```

Ambos campos son efímeros (no persistidos, igual que el resto de `useGameStore` — Constitución § V) y se reinician en `startLevel()`/`reset()`.

## PlayerProfile / OwnedCat (ya existentes, `src/db/index.ts`) — sin cambio de esquema

Cambio de comportamiento, no de forma: `ensureDefaultProfile()` ahora también hace `db.ownedCats.put({ catId: STARTER_CAT_ID, level: 1, experienceInvested: 0 })` si `ownedCats` está vacío al arrancar — cierra FR-011 de esta spec (equivalente a FR-009 de `specs/001-nucleo-del-juego/spec.md`, nunca implementado en el bootstrap).

## Resultado de batalla (flujo entre stores, sin entidad nueva)

Al `status` de `useGameStore` transicionar a `'Victory'`, `BattleScreen` invoca (una sola vez, no en cada tick): `useMetaStore.addCurrency(level.currencyReward)` y `useMetaStore.unlockNextLevel()` + `useMetaStore.markLevelCompleted(levelId)`. En `'Defeat'` no se invoca ninguna acción de `useMetaStore` (FR-009 de esta spec).
