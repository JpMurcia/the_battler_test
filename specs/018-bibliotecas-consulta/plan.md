# Implementation Plan: Bibliotecas de Consulta (Guía de Gatos, Guía de Enemigos, Menú de Tesoros)

**Branch**: `018-bibliotecas-consulta` | **Date**: 2026-08-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/018-bibliotecas-consulta/spec.md`

## Summary

Añade tres pantallas de solo lectura (`CatGuideScreen`, `EnemyGuideScreen`, `TreasureMenuScreen`) accesibles desde `UpgradeScreen`, y un registro nuevo `encounteredEnemyCatIds` en `useMetaStore` (Dexie v8), poblado observando la composición de `units` enemigas ya calculada en `BattleField` (`src/game/BattleStage.tsx`) — sin que `src/engine/` conozca este registro.

## Technical Context

**Language/Version**: TypeScript

**Primary Dependencies**: Ninguna nueva (React, `@pixi/react` sin cambios).

**Storage**: Dexie — `db.version(8)`: nueva tabla `encounteredEnemies` (`{ id: 1; catIds: string[] }`).

**Testing**: Vitest para el cálculo de progreso de cada biblioteca; Testing Library para las tres pantallas.

**Target Platform**: Navegador.

**Project Type**: Web app single-project.

**Performance Goals**: sin cambio.

**Constraints**: `src/engine/` no gana ninguna dependencia nueva — el registro de enemigos enfrentados se puebla desde la capa de estado/render (`BattleField`), no desde `stepSimulation`.

**Scale/Scope**: +3 pantallas, extensión de `db/index.ts`, `useMetaStore.ts`, `game/BattleStage.tsx`, `screens/UpgradeScreen.tsx`, `types/screen.ts`.

## Constitution Check

- **§ V Persistencia Local-First**: `encounteredEnemyCatIds` persiste en Dexie — cumple.
- **§ VI Separación Motor/UI**: `stepSimulation` no gana ninguna dependencia de `useMetaStore`; el registro se puebla desde `BattleField` (capa de render/estado), reutilizando el diff de `units` activas que ya calcula para el mount/unmount de `UnitSprite` (`specs/003-identidad-visual-animada`) — cumple sin tocar el motor puro.
- **§ VII Simplicidad/YAGNI**: sin búsqueda/filtro/ordenamiento en las tres pantallas — cumple.

## Project Structure

### Documentation (this feature)

```text
specs/018-bibliotecas-consulta/
├── plan.md
├── spec.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── db/index.ts                # + tabla encounteredEnemies (db.version(8))
├── state/useMetaStore.ts       # + encounteredEnemyCatIds, + recordEncounteredEnemy(catId)
├── game/BattleStage.tsx        # BattleField: al detectar nuevas unidades activas de team 'Enemy', llama recordEncounteredEnemy por cada catId nuevo
├── screens/
│   ├── CatGuideScreen.tsx      # nuevo: lista ownedCats con stats efectivos
│   ├── EnemyGuideScreen.tsx    # nuevo: lista encounteredEnemyCatIds resueltos contra CATS
│   ├── TreasureMenuScreen.tsx  # nuevo: lista TREASURE_SETS con progreso de obtainedTreasureIds/grantedTreasureSetIds
│   └── UpgradeScreen.tsx        # + 3 botones de navegación a las bibliotecas
├── types/screen.ts              # Screen += 'CatGuide' | 'EnemyGuide' | 'TreasureMenu'
└── App.tsx                      # + 3 casos de navegación
```

**Structure Decision**: tres pantallas nuevas siguiendo el patrón ya establecido de `src/screens/*.tsx` + entrada en `Screen`/`App.tsx`; sin cambios a `src/engine/`.

## Key Design Decisions

1. **Registro de encuentros poblado desde `BattleField`, no desde el motor**: `BattleField` ya recalcula, tick a tick, el conjunto de `instanceId`s activos para decidir mount/unmount de `UnitSprite` (`specs/003` research.md Decisión 3) y para el registro de `DeathEcho`. Se añade un tercer diff sobre ese mismo cálculo: `catId`s de unidades `team === 'Enemy'` nuevas en este tick que no estén ya en `useMetaStore.getState().encounteredEnemyCatIds`, llamando `recordEncounteredEnemy(catId)` una vez por `catId` nuevo — nunca por `instanceId` (un mismo `catId` puede aparecer múltiples veces sin volver a registrarse).
2. **Guía de Gatos reutiliza el cálculo de stats efectivos ya existente**: en vez de duplicar la fórmula de evolución (`specs/010`), `CatGuideScreen` construye el mismo objeto `{ hp: cat.hp * hpMultiplier, damage: cat.damage * damageMultiplier, ... }` que ya usa `useGameStore.deployUnit` — se extrae esa fórmula a una función compartida `getEffectiveCatStats(cat, ownedMeta)` si no existe ya, en vez de tener dos copias.
3. **Guía de Enemigos resuelve stats *base* directo de `CATS`**: `EnemyGuideScreen` mapea `encounteredEnemyCatIds` contra `CATS.find(catId)` sin aplicar ningún `SagaArc.enemyStrengthMultiplier` — es intencional (spec.md Assumptions), no requiere resolver el arco en el que se enfrentó cada vez.
4. **Tres pantallas, no una con tabs**: sigue el patrón ya establecido de una pantalla de React por destino en `Screen`/`App.tsx`, consistente con `TitleScreen`/`MainMenuScreen`/etc. existentes — sin introducir un sistema de tabs/subrutas nuevo.

## Complexity Tracking

*Sin violaciones — tabla omitida.*
