# Implementation Plan: Sistema de Objetos de Batalla

**Branch**: `017-objetos-de-batalla` | **Date**: 2026-08-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/017-objetos-de-batalla/spec.md`

## Summary

Añade `BattleItem` (`src/data/battleItems.ts`) y `battleItemInventory` persistido en `useMetaStore` (Dexie v7); una selección pendiente (`selectedBattleItemIds`, no persistida) elegida en `TeamScreen` y consumida en `LevelSelectScreen` al entrar efectivamente a una batalla; los efectos de combate/recurso inicial se aplican en `useGameStore.startLevel`, y "Radar de Tesoro" se resuelve en `BattleOutcomeWatcher` junto al resto de recompensas de `specs/012`.

## Technical Context

**Language/Version**: TypeScript

**Primary Dependencies**: Ninguna nueva.

**Storage**: Dexie — `db.version(7)`: nueva tabla `battleItems` (`{ id: 1; counts: Record<string, number> }`).

**Testing**: Vitest — `useMetaStore`/`useGameStore` con `fake-indexeddb`; RNG inyectable para "Radar de Tesoro" (mismo patrón de `specs/016`).

**Target Platform**: Navegador.

**Project Type**: Web app single-project.

**Performance Goals**: sin cambio.

**Constraints**: la selección pendiente (`selectedBattleItemIds`) es estado de sesión, no persistido en Dexie — reiniciar la aplicación la limpia (consistente con que solo el inventario, no la selección, sobrevive un reinicio).

**Scale/Scope**: +1 archivo de datos (`battleItems.ts`), extensión de `db/index.ts`, `useMetaStore.ts`, `useGameStore.ts`, `TeamScreen.tsx`, `LevelSelectScreen.tsx`, `BattleScreen.tsx`.

## Constitution Check

- **§ IV Balance Dirigido por Datos**: catálogo de `BattleItem` vive en `src/data/battleItems.ts` — cumple.
- **§ V Persistencia Local-First**: `battleItemInventory` persiste en Dexie; `selectedBattleItemIds` es efímero de sesión (no de batalla — sobrevive navegar entre pantallas, pero no un reinicio de la app) — cumple, documentado como excepción menor de "efímero" en Key Design Decisions.
- **§ VI Separación Motor/UI**: el efecto de "Aceleración de Velocidad"/"Energía Extra" se resuelve como un multiplicador/bonus aplicado una sola vez en `startLevel` (capa de estado), nunca leído dentro de `stepSimulation` — `src/engine/` sigue sin conocer objetos de batalla — cumple.
- **§ VII Simplicidad/YAGNI**: tres objetos con efectos independientes y aditivos, sin sistema de combinación/sinergia — cumple.

## Project Structure

### Documentation (this feature)

```text
specs/017-objetos-de-batalla/
├── plan.md
├── spec.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── data/
│   ├── battleItems.ts     # nuevo: BattleItem[] (Aceleración de Velocidad, Energía Extra, Radar de Tesoro)
│   └── levels.ts            # Level += battleItemRewards?: { itemId: string; count: number }[]
├── db/index.ts               # + tabla battleItems (db.version(7))
├── state/
│   ├── useMetaStore.ts      # + battleItemInventory, + selectedBattleItemIds (no persistido), + selectBattleItem()/deselectBattleItem(), grantLevelRewards += battleItemRewards
│   └── useGameStore.ts       # startLevel += aplica efectos de Combat/InitialResource de los objetos consumidos
├── screens/
│   ├── TeamScreen.tsx        # + selector de objetos de batalla (hasta el máximo configurado)
│   ├── LevelSelectScreen.tsx  # "Jugar" += consume selectedBattleItemIds (descuenta inventario, pasa efectos a startLevel)
│   └── BattleScreen.tsx      # BattleOutcomeWatcher += resolución de "Radar de Tesoro" al ganar
```

**Structure Decision**: extensión aditiva; sin pantalla nueva (el selector vive dentro de `TeamScreen` ya existente).

## Key Design Decisions

1. **Selección pendiente en `useMetaStore`, no persistida**: `selectedBattleItemIds: string[]` es un campo más del store en memoria (como `isHydrated`), nunca escrito a Dexie — sobrevive la navegación entre pantallas de una sesión pero se pierde al recargar la app, evitando modelar "objetos reservados" como progreso persistente.
2. **Consumo en el punto de entrada real a la batalla**: `LevelSelectScreen`'s "Jugar" (donde ya se llama `spendMissionEnergy`/`startLevel`) es el único lugar que descuenta `battleItemInventory` y limpia `selectedBattleItemIds` — nunca `TeamScreen` (FR-006).
3. **Efectos de combate/recurso inicial como parámetros de `startLevel`**: `startLevel(levelId, { speedMultiplier?, energyBonus? })` — calculados una vez a partir de los objetos consumidos, aplicados a `energy.current` inicial y a un nuevo campo `GameFields.unitSpeedMultiplier` que `deployUnit`/`spawnEnemyUnit` multiplican sobre `cat.speed` al crear el `BattleUnit` — mismo patrón que `specs/012` ya usa para `costMultiplier`.
4. **"Radar de Tesoro" resuelto junto a `grantLevelRewards`**: `BattleOutcomeWatcher` ya invoca `grantLevelRewards(level.id)` (`specs/012`); si `selectedBattleItemIds` (leído antes de limpiarse en el paso 2) incluía "Radar de Tesoro", se llama una función adicional `grantRandomUnownedTreasure(random)` con el mismo patrón de RNG inyectable de `specs/016-multigolpe-critico`.

## Complexity Tracking

*Sin violaciones — tabla omitida.*
