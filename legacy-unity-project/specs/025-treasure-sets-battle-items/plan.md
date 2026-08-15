# Implementation Plan: Sets de Tesoros y Objetos de Batalla en la Versión Web

**Branch**: `025-treasure-sets-battle-items` | **Date**: 2026-08-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/025-treasure-sets-battle-items/spec.md`, informada por [research.md](./research.md) y [data-model.md](./data-model.md). Extiende `specs/024-react-web-migration/plan.md` — mismo stack, mismo repositorio nuevo, sin decisiones de arquitectura adicionales.

## Summary

Rellenar dos huecos que `024-react-web-migration` dejó explícitamente marcados como fuera de su alcance inicial (`tasks.md` T033): sets de tesoros con bonificación pasiva permanente, y objetos de batalla consumibles seleccionables antes de entrar a una batalla. Ningún sistema nuevo de persistencia ni de render — ambos usan campos que `PlayerProgressSaveData` ya declaraba (`grantedTreasureSetIds`, `obtainedTreasureIds`, `battleItemInventory`) y se integran directamente en `battleSession.ts` (`024`), extendiendo `setupChapter` y el flujo de recompensas de victoria.

## Technical Context

Sin cambios respecto a `specs/024-react-web-migration/plan.md` — mismo stack (Vite + React + TS + Pixi.js + Zustand + `localStorage`), mismo repositorio (`the-battler-web/`). Esta spec no añade dependencias nuevas.

**Storage**: sin claves nuevas de `localStorage` — reutiliza `battler.playerProgress` (ver `024` Decisión 1 y `data-model.md` de esta spec).

**Scale/Scope**: 1 catálogo de sets de tesoros (JSON), 1 catálogo de objetos de batalla (JSON, 3 categorías), 2 funciones puras nuevas (`treasureSetProgress.ts`, `battleItemSelection.ts`), extensión de `battleSession.ts` y `battleResource.ts` ya creados por `024`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Misma lectura que `specs/024-react-web-migration/plan.md` § Constitution Check — `.specify/memory/constitution.md` gobierna el proyecto Unity, no el repositorio nuevo. Evaluación por intención de diseño:

| Principio | Evaluación |
|---|---|
| I. Narrativa Integrada | No aplica — ningún cambio a diálogo pre/post-batalla. |
| II. Combate Automático por Despliegue | Preservado: los objetos de batalla modifican parámetros del bucle ya definido en `024` (velocidad, recurso inicial) sin introducir control directo del jugador sobre una unidad desplegada. |
| III. Identidad Visual Animada | No aplica — sin unidades ni animaciones nuevas. |
| IV. Progresión por Capítulos con Desbloqueo | No aplica directamente — los sets de tesoros son una capa de recompensa sobre capítulos ya desbloqueados, no cambian su secuencia. |
| V. Balance Dirigido por Datos | Preservado por diseño: `TreasureSetCatalog`/`BattleItemCatalog` son contenido estático versionado (`data-model.md`), ningún valor de magnitud/bono hardcodeado en `src/engine/`. |
| VI. Simplicidad desde el MVP | Guía el alcance: solo los dos sistemas pedidos (ver spec.md Assumptions) — saga arcs/Gatorreta/tracking de enemigos quedan fuera hasta una spec futura explícita. |

Sin violaciones — Complexity Tracking vacío.

## Project Structure

### Documentation (this feature)

```text
specs/025-treasure-sets-battle-items/
├── spec.md
├── plan.md                # Este archivo
├── research.md
├── data-model.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (extiende la estructura ya fijada por `024/plan.md`, mismo repo `the-battler-web/`)

```text
src/
├── data/
│   ├── catalogs/
│   │   ├── treasureSets.json     # nuevo — TreasureSetCatalog
│   │   └── battleItems.json      # nuevo — BattleItemCatalog
│   └── enums.ts                  # +BattleItemCategory (024 ya crea el archivo)
├── engine/
│   ├── treasureSetProgress.ts    # nuevo — port de TreasureSetProgressEvaluator
│   ├── battleItemSelection.ts    # nuevo — port de BattleItemSelectionController
│   ├── battleResource.ts         # existente (024 T016) — sin cambios de firma, solo nuevo llamador
│   └── battleSession.ts          # existente (024 T024) — MODIFICADO: setupChapter reaplica bonos de
│                                  #   sets + resuelve BattleItemSelection; flujo de recompensas de
│                                  #   victoria evalúa sets recién completados + "Radar de Tesoro"
├── state/
│   └── useBattleSessionStore.ts  # existente (024 T025) — expone selección de objetos como acción
│                                  #   efímera (no persistida), consumida al montar BattleScreen
└── components/
    └── roster/
        └── BattleItemSelectionPanel.tsx   # nuevo — en la misma pantalla de preparación que
                                            # TeamFormationScreen.tsx (024 T041)
```

**Structure Decision**: sin proyecto ni carpeta nueva — esta spec es una extensión in-place de la estructura ya definida por `024/plan.md`, coherente con que ambos sistemas ya vivían dentro del mismo `BattleStateManager.cs` en el original Unity.

## Tabla de Mapeo Unity → React

| Unity (C#) | Naturaleza | React/TS equivalente |
|---|---|---|
| `TreasureSetDefinition`, `TreasureSetCatalog` (ScriptableObjects) | Contenido | `src/data/catalogs/treasureSets.json` + tipos en `src/types/content.ts` |
| `TreasureSetProgressEvaluator` (clase estática, sin `MonoBehaviour`) | Lógica pura | `src/engine/treasureSetProgress.ts` (`isSetComplete`, `hasRewardsGranted`) |
| `BattleItemDefinition`, `BattleItemCatalog` (ScriptableObjects) | Contenido | `src/data/catalogs/battleItems.json` + tipos en `src/types/content.ts` |
| `BattleItemCategory` (enum) | Contenido | `src/data/enums.ts` |
| `BattleItemStack` (`[Serializable]`) | Guardado (ya declarado en `024`) | Campo `battleItemInventory` de `PlayerProgressSaveData` (`src/types/saveData.ts`, sin cambios) |
| `BattleItemSelectionController` (clase plana) | Lógica pura + estado efímero | `src/engine/battleItemSelection.ts` (validación pura) + estado local de `BattleItemSelectionPanel.tsx` |
| Fragmento de `BattleStateManager.SetupChapter` relativo a sets/objetos (líneas 194-276 del original) | Runtime, integrado en el orquestador | Extiende `battleSession.setupChapter()` (`024` T024) |
| Fragmento de `BattleStateManager.GrantLevelRewards` relativo a sets/"Radar de Tesoro" (líneas 404-489) | Runtime | Extiende el flujo de recompensas de victoria dentro de `battleSession.ts` |
| `BattleItemSelectionUIController`, `BattleItemSelectionRowView` (Vista) | Vista | `src/components/roster/BattleItemSelectionPanel.tsx` + `BattleItemRow.tsx` |

## Complexity Tracking

*Sin violaciones que justificar — tabla vacía.*
