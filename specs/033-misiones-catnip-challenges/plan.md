# Implementation Plan: Misiones (Catnip Challenges)

**Branch**: `033-misiones-catnip-challenges` | **Date**: 2026-08-27 | **Spec**: [spec.md](./spec.md)

## Summary

Catálogo puro `src/data/missions.ts` (3 misiones, `getDateKey` para reinicio diario) + progreso/reclamo en `useMetaStore` (tabla Dexie nueva `missions`, versión 13) + un panel nuevo `MissionsPanel` en el stack de paneles del Hub (`PanelId` += `'Missions'`) + instrumentación en 3 puntos ya existentes (`deployUnit`, `BattleOutcomeWatcher`, detección de `newlyDead` en `BattleStage.tsx`). Sin cambios a `src/engine/`.

## Technical Context

**Language/Version**: TypeScript 5.x · **Dependencies**: React 19, Zustand, Dexie (sin cambio) · **Storage**: Dexie — tabla `missions` nueva (v13, fila singleton) · **Testing**: Vitest — `missions.ts` puro (`getDateKey` con `nowMs` inyectado); `useMetaStore`/`useGameStore` con `fake-indexeddb`; `HubScreen`/`MissionsPanel`/`BattleScreen` con Testing Library · **Target**: Navegador web · **Project Type**: Single project · **Performance**: N/A · **Constraints**: FR-004 (progreso nunca visualmente > objetivo), FR-006 (reinicio por fecha, sin scheduler) · **Scope**: 1 módulo de datos, 1 panel, 3 puntos de instrumentación.

## Constitution Check

| Principio | Evaluación |
|---|---|
| I-III | Sin cambios de combate/progresión/identidad visual — las misiones observan eventos ya existentes, no los alteran. ✅ |
| IV. Balance Dirigido por Datos | Catálogo de 3 misiones en `src/data/missions.ts`, sin valores hardcodeados en componentes. ✅ |
| V. Persistencia Local-First | Tabla Dexie nueva, mismo patrón singleton ya usado 9 veces. Reinicio diario resuelto localmente, sin servidor (spec.md Assumptions). ✅ |
| VI. Separación Motor/UI | `src/engine/` no se toca — la detección de enemigos derrotados reutiliza el diff `newlyDead` ya calculado en `BattleStage.tsx` para death echoes (research.md Decisión 3), no un hook nuevo en el motor. ✅ |
| VII. Simplicidad | Sin scheduler recurrente genérico (research.md Decisión 2); Meow Medals excluidos (spec.md Assumptions). ✅ |

Sin violaciones.

## Project Structure

```text
specs/033-misiones-catnip-challenges/
├── plan.md / research.md / data-model.md / quickstart.md / tasks.md

src/
├── data/
│   └── missions.ts              # NUEVO — MissionMetric, MissionDefinition, MISSIONS, getDateKey
├── db/index.ts                   # + MissionsRow, tabla missions, versión 13
├── state/
│   ├── useMetaStore.ts           # + missionProgress, claimedMissionIds, missionsResetDateKey, recordMissionProgress(), claimMission()
│   └── useGameStore.ts           # deployUnit() invoca recordMissionProgress('unitsDeployed', 1)
├── game/
│   └── BattleStage.tsx           # BattleField invoca recordMissionProgress('enemiesDefeated', N) sobre newlyDead.filter(Enemy)
├── screens/
│   ├── HubScreen.tsx             # + botón "Misiones" con badge, + case 'Missions' en el panel stack
│   ├── BattleScreen.tsx          # BattleOutcomeWatcher invoca recordMissionProgress('levelsCompleted', 1)
│   └── MissionsPanel.tsx         # NUEVO — lista de misiones, progreso, reclamo
├── types/screen.ts               # PanelId += 'Missions'

tests/unit/
├── data/
│   └── missions.test.ts             # NUEVO — getDateKey puro
├── db.test.ts                        # + tabla missions (si aplica)
├── useMetaStore.test.ts              # + recordMissionProgress/claimMission/reinicio diario
├── useGameStore.test.ts              # + deployUnit registra progreso
├── HubScreen.test.tsx                # + botón Misiones + badge
├── BattleScreen.test.tsx             # + BattleOutcomeWatcher registra progreso; UnitSprite/BattleStage no tiene test propio (research.md specs/029 Decisión 3) — la detección de enemiesDefeated se prueba indirectamente vía useMetaStore
└── MissionsPanel.test.tsx            # NUEVO — progreso, reclamo, FR-004
```

**Structure Decision**: Extiende el single-project existente — un módulo de datos nuevo, una tabla Dexie nueva, un panel nuevo integrado al stack ya existente del Hub (sin pantalla base nueva).

## Complexity Tracking

*Sin violaciones — sección no aplica.*
