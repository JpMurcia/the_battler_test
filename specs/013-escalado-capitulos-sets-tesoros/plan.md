# Implementation Plan: Escalado Avanzado por Arco y Sets de Tesoros

**Branch**: `013-escalado-capitulos-sets-tesoros` | **Date**: 2026-08-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/013-escalado-capitulos-sets-tesoros/spec.md`

## Summary

Aplica `enemyStrengthMultiplier` (`specs/012`) a `enemyBase.maxHp` en `startLevel`; añade `energyCostByArc`/`laneLength` a `Level`; saca `LANE_LENGTH` de constante fija de `src/engine/simulation.ts` a parámetro derivado del nivel activo; añade `TreasureSet` y su bonificación pasiva a `useMetaStore`, persistidos en Dexie v6.

## Technical Context

**Language/Version**: TypeScript

**Primary Dependencies**: Ninguna nueva.

**Storage**: Dexie — `db.version(6)`: nueva tabla `treasureSetBonuses` (`{ id: 1; grantedSetIds: string[] }`).

**Testing**: Vitest — `src/engine/simulation.ts` parametrizado por `laneLength`; `useMetaStore` con `fake-indexeddb`.

**Target Platform**: Navegador.

**Project Type**: Web app single-project.

**Performance Goals**: sin cambio.

**Constraints**: `LANE_LENGTH` deja de ser una constante de módulo en `src/engine/simulation.ts` y pasa a resolverse por nivel — cualquier código que hoy importa `LANE_LENGTH` directamente (`PLAYER_BASE_EXTENT`/`ENEMY_BASE_EXTENT` son named exports usados por tests) debe seguir funcionando para el valor por defecto (400) sin romper `tests/unit/engine/simulation.test.ts` existente.

**Scale/Scope**: extensión de `levels.ts`, `simulation.ts`, `useGameStore.ts`, `useMetaStore.ts`, `db/index.ts`; +1 archivo de datos (`treasureSets.ts`).

## Constitution Check

- **§ IV Balance Dirigido por Datos**: `energyCostByArc`, `laneLength`, `TreasureSet` viven en `src/data/` — cumple.
- **§ V Persistencia Local-First**: `grantedTreasureSetIds` persiste en Dexie; el `laneLength` resuelto de una batalla en curso es efímero (vive en `SimState`, no se persiste) — cumple.
- **§ VI Separación Motor/UI**: el escalado de `enemyBase.maxHp` y el `laneLength` se resuelven en `startLevel`/`stepSimulation` (capa de estado/motor puro) — cumple.
- **§ VII Simplicidad/YAGNI**: `laneLength` es un número plano, sin sistema de "zonas" o curvas de dificultad por distancia — cumple.

## Project Structure

### Documentation (this feature)

```text
specs/013-escalado-capitulos-sets-tesoros/
├── plan.md
├── spec.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── data/
│   ├── levels.ts          # Level += energyCostByArc?/laneLength?
│   └── treasureSets.ts     # nuevo: TreasureSet[]
├── db/index.ts              # + tabla treasureSetBonuses (db.version(6))
├── state/
│   ├── useMetaStore.ts     # + grantedTreasureSetIds, + checkTreasureSetCompletion() (llamado tras grantLevelRewards de specs/012)
│   └── useGameStore.ts      # startLevel += enemyBase.maxHp escalado por arco; resuelve laneLength del nivel activo
└── engine/
    └── simulation.ts        # LANE_LENGTH pasa a valor por defecto; PLAYER_BASE_EXTENT/ENEMY_BASE_EXTENT se calculan a partir de un laneLength recibido en SimState o parámetro de stepSimulation
```

**Structure Decision**: extensión aditiva; sin pantallas nuevas.

## Key Design Decisions

1. **`enemyBase.maxHp` escalado en `startLevel`, no en `stepSimulation`**: igual que `specs/012` resuelve el multiplicador de costo/fuerza una sola vez al desplegar/generar una unidad, el escalado de vida de base se resuelve una sola vez al iniciar la batalla — `stepSimulation` sigue operando solo sobre `SimState.enemyBase` ya resuelto, sin conocer arcos.
2. **`laneLength` viaja en `SimState`, `LANE_LENGTH` queda como default**: se añade `SimState.laneLength: number` (poblado en `startLevel` desde `level.laneLength ?? 400`); `PLAYER_BASE_EXTENT`/`ENEMY_BASE_EXTENT` pasan de constantes de módulo a funciones puras `getPlayerBaseExtent(laneLength)`/`getEnemyBaseExtent(laneLength)` — los tests existentes que importan las constantes se migran a llamarlas con `400` explícito (el valor por defecto), sin cambiar su resultado.
3. **Bonificación de set aplicada como modificador de lectura, no de escritura**: `passiveBonus.type: 'EnergyRegenMultiplier'` se lee en `useMetaStore`/`useGameStore.startLevel` al calcular `energyRegenPerSecond` inicial (multiplica el valor del nivel), evitando mutar datos de contenido — mismo patrón que `computeMissionEnergyMax`/`computeRegenPerSecond` de `specs/007` ya usan para derivar valores en tiempo de lectura.
4. **Chequeo de set tras cada recompensa de tesoro**: `checkTreasureSetCompletion()` se invoca inmediatamente después de `grantLevelRewards` (`specs/012` T016) dentro de la misma acción de `useMetaStore`, no como un efecto de React separado — evita una ventana en la que el tesoro está en `obtainedTreasureIds` pero el set todavía no se evaluó.

## Complexity Tracking

*Sin violaciones — tabla omitida.*
