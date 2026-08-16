# Implementation Plan: Saga "Imperio de los Gatos" — Arcos, Gatorreta y Brote Zombi

**Branch**: `012-saga-imperio-de-los-gatos` | **Date**: 2026-08-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/012-saga-imperio-de-los-gatos/spec.md`

## Summary

Añade `SagaArc` (`src/data/sagaArcs.ts`) y extiende `Level`/`Cat` con los campos de FR-001/005/006/007/011/016; aplica los multiplicadores de costo/fuerza en `deployUnit`/`spawnEnemyUnit`; extiende `stepSimulation` con umbrales de vida de base, límite de enemigos simultáneos, cañón especial y boost de regeneración; añade recompensas de nivel/arco y el tope de mejora escalonado a `useMetaStore`, persistidos en Dexie v5.

## Technical Context

**Language/Version**: TypeScript

**Primary Dependencies**: Ninguna nueva.

**Storage**: Dexie — `db.version(5)`: nuevas tablas `treasures` (`{ id: 1; obtainedIds: string[] }`) y `arcProgress` (`{ id: 1; grantedRewardArcIds: string[] }`).

**Testing**: Vitest — `src/engine/simulation.ts` (umbrales de vida de base, límite simultáneo, cañón, boost de regeneración) sin canvas ni DOM; `useMetaStore`/`useGameStore` con `fake-indexeddb`.

**Target Platform**: Navegador.

**Project Type**: Web app single-project.

**Performance Goals**: sin cambio — mismo objetivo de 60fps/10+ unidades de `specs/002`/`specs/003`.

**Constraints**: `src/engine/` sigue sin conocer `SagaArc`/`Level` directamente salvo por los valores ya resueltos que recibe en `SimState`/`BattleUnit` — los multiplicadores se resuelven una sola vez al desplegar/generar una unidad o al iniciar el nivel, nunca leídos en caliente dentro del bucle de combate por fuera de `stepSimulation`.

**Scale/Scope**: +1 archivo de datos (`sagaArcs.ts`), extensión de `levels.ts`/`cats.ts`, extensión de `simulation.ts`/`useGameStore.ts`/`useMetaStore.ts`/`db/index.ts`.

## Constitution Check

- **§ I Combate Automático por Despliegue**: el cañón especial es la única excepción a "sin control directo del jugador sobre una unidad ya desplegada" — no es una unidad, es un sistema de base activado manualmente, mismo patrón que la energía ya es un recurso gestionado por el jugador — cumple sin violar el espíritu del principio.
- **§ IV Balance Dirigido por Datos**: multiplicadores de arco, umbrales, límite simultáneo, recompensas y rareza viven en `src/data/` — cumple.
- **§ V Persistencia Local-First**: tesoros y recompensas de arco otorgadas persisten en Dexie; el estado efímero de batalla (umbrales disparados, carga del cañón, boost de regeneración) vive solo en `SimState`, nunca en Dexie — cumple.
- **§ VI Separación Motor/UI**: los multiplicadores se resuelven en `deployUnit`/`spawnEnemyUnit` (capa de estado/motor puro), no en componentes de React; el cañón especial y los umbrales de vida de base son lógica pura dentro de `stepSimulation` — cumple.
- **§ VII Simplicidad/YAGNI**: sin sistema de inventario general para tesoros (una lista de IDs basta), sin gacha para el desbloqueo de gatos — cumple.

## Project Structure

### Documentation (this feature)

```text
specs/012-saga-imperio-de-los-gatos/
├── plan.md
├── spec.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── data/
│   ├── sagaArcs.ts       # nuevo: SagaArc[], EvolutionFormData-style plain content
│   ├── levels.ts         # Level += baseHpTriggers?/maxSimultaneousEnemies?/treasureId?/firstVictoryUnlockCatId?/zombieWave?
│   └── cats.ts            # Cat += rarity?: RarityType
├── db/index.ts             # + tabla treasures, + tabla arcProgress (db.version(5))
├── state/
│   ├── useMetaStore.ts    # + obtainedTreasureIds, + grantedArcRewardIds, + grantLevelRewards()/claimArcRewardsIfComplete(), upgradeCat += tope escalonado
│   └── useGameStore.ts     # deployUnit += costMultiplier; + specialCannon state/activateSpecialCannon(); + boostEnergyRegen(); startLevel += arco activo
└── engine/
    └── simulation.ts       # spawnEnemyUnit += enemyStrengthMultiplier; stepSimulation += umbrales de vida de base, límite simultáneo, tick del cañón (aplicado desde useGameStore, no aquí — ver Key Design Decisions)
```

**Structure Decision**: extensión aditiva de los mismos cuatro módulos ya centrales (`data/`, `db/`, `state/`, `engine/`) — sin nuevas pantallas de React en esta spec (el cañón/boost de regeneración son controles dentro de `BattleScreen`, no una pantalla nueva).

## Key Design Decisions

1. **Resolución de arco por nivel, no por `SagaArc` mirando hacia adentro**: `deployUnit`/`spawnEnemyUnit`/`startLevel` resuelven el arco activo buscando `SAGA_ARCS.find(arc => arc.levelIds.includes(levelId))` — un nivel pertenece a lo sumo un arco; sin arco encontrado, multiplicador 1 (FR-004).
2. **Umbrales de vida de base como estado efímero en `SimState`**: `SimState.triggeredBaseHpThresholdPercents: number[]` (reset en `startLevel`, nunca persistido) — `stepSimulation` compara el % de vida de la base enemiga antes/después del tick contra los umbrales del nivel no disparados todavía.
3. **Cañón especial vive en `useGameStore`, no en `src/engine/`**: a diferencia de la simulación de unidades, el cañón es un temporizador simple sin colisión ni combate — se modela como un campo más de `GameFields` (`specialCannon: { rechargeRemaining, rechargeDurationSeconds, areaRadius, damage }`), actualizado en el mismo `tick()` junto a `stepSimulation`, y `activateSpecialCannon()` aplica daño directo a `units` filtrando por `team === 'Enemy'` y distancia a la base del jugador — reutiliza `overlaps1D`/`withinRange1D` de `src/engine/collision.ts` sin necesitar que `stepSimulation` lo conozca.
4. **"Primera victoria" derivada, salvo recompensa de arco**: si `firstVictoryUnlockCatId` no está en `ownedCats` antes de procesar la victoria, es primera vez — no se persiste un flag nuevo (FR-015). Solo `grantedArcRewardIds` requiere persistencia propia porque "todos los niveles del arco ya estaban completados antes de esta victoria" no es trivial de re-derivar sin guardar que ya se otorgó.
5. **Tope de mejora escalonado**: `upgradeCat` calcula el tope vigente como `20` si el segundo arco de `SAGA_ARCS` (por orden de declaración) está en `grantedArcRewardIds`, si no `10` — sin campo de guardado adicional para el tope en sí.

## Complexity Tracking

*Sin violaciones — tabla omitida.*
