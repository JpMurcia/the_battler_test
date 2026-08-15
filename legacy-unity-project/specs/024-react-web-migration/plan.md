# Implementation Plan: Migración de The Battler a React Web

**Branch**: `024-react-web-migration` | **Date**: 2026-08-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/024-react-web-migration/spec.md`, informada por [research.md](./research.md) y [data-model.md](./data-model.md).

## Summary

Portar The Battler (Unity/C#, confirmado sin backend — todo el guardado es local) a una aplicación web nueva de solo-frontend: **Vite + React + TypeScript**, render de juego 100% en **Pixi.js** (`@pixi/react`) — no hay ningún modelo 3D en el proyecto original, así que React Three Fiber queda disponible en el stack pero fuera del alcance de esta feature —, estado con **Zustand**, y persistencia en `localStorage` con el mismo split en 4 dominios que hoy usan los 4 `Local*Store` de Unity. La lógica de juego que ya está desacoplada de `MonoBehaviour` en C# (fórmulas de energía, nivelado, evolución, daño, resolución de batalla) se porta 1:1 a funciones TypeScript puras, testeables sin UI. El contenido de diseño (unidades, capítulos, diálogos) se exporta de ScriptableObject a JSON estático versionado en el repo.

## Technical Context

**Language/Version**: TypeScript 5.x + React 18, Node.js 20 LTS para tooling.

**Primary Dependencies**: Vite (bundler/dev server), `pixi.js` + `@pixi/react` (render de juego 2D — mapa, carriles, unidades, Hub), `@react-three/fiber` + `@react-three/drei` (incluidas en el stack pedido, sin uso activo en el alcance actual — ver `research.md` Decisión 2), `zustand` (+ middleware `persist` sobre `localStorage`), `react-router-dom` (navegación entre pantallas: Menú, Mapa, Batalla, Base/Hub), i18n propio o `i18next` sobre el shape de `LocalizedTextTable` (ver `research.md` Decisión 7).

**Storage**: `localStorage` del navegador, 4 claves (`battler.chapterProgress`, `battler.menuSettings`, `battler.missionEnergy`, `battler.playerProgress`) — ver `research.md` Decisión 1 y `data-model.md`. Sin backend remoto (no existe uno que migrar).

**Testing**: Vitest + React Testing Library para componentes y funciones puras de `src/engine/`; Playwright para el flujo end-to-end de User Story 1 (desplegar → combate automático → resultado). Sin equivalente EditMode/PlayMode de Unity — se reemplaza por unit tests de Vitest sobre las funciones portadas de la Decisión 6 de `research.md`.

**Target Platform**: Navegadores evergreen de escritorio y móvil (Chrome/Safari/Firefox/Edge recientes) — mismo público objetivo (Android/iOS) que la build móvil actual de Unity, ahora vía navegador en vez de instalación nativa.

**Project Type**: Aplicación web de un solo proyecto (frontend puro, sin `backend/`) — repositorio nuevo, separado del proyecto Unity.

**Performance Goals**: Animaciones de combate y Hub sin tirones perceptibles en un dispositivo Android/iOS de gama media (objetivo interno: 60 fps, degradación aceptable no menor a 30 fps sostenidos); primera batalla jugable en menos de 5 s de carga sobre banda ancha típica (alinea con SC-001/SC-004 de `spec.md`).

**Constraints**: Sin backend — toda persistencia es local al navegador (`localStorage`); sin cuenta de usuario ni login (fuera de alcance, no existe en Unity); guardado best-effort y tolerante a corrupción/versión inesperada, igual que los `Local*Store` de Unity (`research.md`, hallazgo base).

**Scale/Scope**: 2 capítulos ya construidos en Unity + contenido de `EmpireOfCats`/eventos, ~16 variantes visuales de unidad base (más etapas de evolución), 4 idiomas soportados, 4 dominios de guardado, ~7 pantallas principales (Menú, Mapa de Capítulo, Batalla, Base/Hub, Formación de Equipo, Mejora/Evolución, Diálogo).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` fija sus Restricciones Técnicas para **el proyecto Unity actual** (`Motor: Unity 6000.3.20f1 ... el proyecto vive en the_battler_test/`) — no gobierna un repositorio nuevo de React. Por eso cada principio se evalúa aquí por su **intención de diseño**, no como gate bloqueante literal de stack:

| Principio | Evaluación |
|---|---|
| I. Narrativa Integrada | Preservado por diseño: FR-011 de `spec.md` exige reproducir diálogo pre/post-batalla para toda batalla que lo tenga configurado; `DialogueSequence` es una entidad de primera clase en `data-model.md`. |
| II. Combate Automático por Despliegue | Preservado por diseño: FR-002/003/004 de `spec.md` replican exactamente el modelo (energía acumulable, coste/cooldown por unidad, autonomía tras desplegar) — es el corazón de User Story 1. |
| III. Identidad Visual Animada | Preservado por diseño: FR-014 exige idle+attack distintos por unidad; `research.md` Decisión 3 fija el formato de atlas Pixi para portar exactamente ese mínimo, etapa por etapa (ver también Principio III extendido de la constitución sobre evolución — `evolutionStages[]` en `data-model.md`). |
| IV. Progresión por Capítulos con Desbloqueo | Preservado por diseño: FR-006 replica el desbloqueo secuencial; `AdventureMap.banners[]` codifica el mismo orden que hoy. |
| V. Balance Dirigido por Datos | Preservado por diseño: `research.md` Decisión 5 exporta cada ScriptableObject a JSON estático versionado — ningún valor de balance queda hardcodeado en `src/engine/`. |
| VI. Simplicidad desde el MVP | Guía la Decisión 2 de `research.md` (no se adopta R3F sin necesidad real) y el alcance de `tasks.md` (User Story 1 primero, resto incremental) — sin gacha real, cosméticos libres ni multijugador, igual que hoy. |

No hay violaciones que requieran justificación — Complexity Tracking queda vacío.

## Project Structure

### Documentation (this feature)

```text
specs/024-react-web-migration/
├── spec.md               # Fase 2a — QUÉ/POR QUÉ (/speckit-specify)
├── plan.md                # Este archivo — Fase 2b, CÓMO (/speckit-plan)
├── research.md            # Fase 0 — decisiones técnicas y su razón
├── data-model.md          # Fase 1 — entidades, DTOs, inventario de assets
├── checklists/
│   └── requirements.md    # Validación de calidad de spec.md
└── tasks.md               # Fase 3 — desglose de tareas (/speckit-tasks)
```

### Source Code (repositorio nuevo — fuera de `the_battler_test/`)

Esta feature es documentación/planificación; la implementación vive en un repositorio nuevo, separado del proyecto Unity (no se modifica ningún archivo de `Assets/` como parte de esta feature). Estructura propuesta para ese repositorio:

```text
the-battler-web/
├── src/
│   ├── data/                    # Contenido estático exportado (research.md Decisión 5)
│   │   ├── units/*.json         # UnitDefinition por unidad
│   │   ├── chapters/*.json      # ChapterDefinition por capítulo/saga-arc
│   │   ├── banners/*.json       # ChapterBannerDefinition, AdventureMap
│   │   ├── catalogs/*.json      # BattleItemCatalog, TreasureSetCatalog, UserRankRewardCatalog, UnitUnlockCatalog
│   │   ├── localization/*.json  # LocalizedTextTable
│   │   └── enums.ts
│   ├── engine/                  # Funciones puras portadas 1:1 (research.md Decisión 6) — sin dependencia de React/Pixi
│   │   ├── combat/               # ComputeOutgoingDamage, ApplyDamage, multi-hit, inmunidad/resistencia
│   │   ├── missionEnergy.ts       # port de MissionEnergyController
│   │   ├── unitLeveling.ts        # port de UnitLevelingController / PlayerCharacterLevelCalculator
│   │   ├── unitEvolution.ts       # port de UnitEvolutionController / UnitEvolutionStageResolver
│   │   ├── teamFormation.ts       # port de TeamFormationController
│   │   ├── sagaArcProgress.ts     # port de SagaArcProgressEvaluator
│   │   ├── battleOutcome.ts       # port de BattleOutcomeResolver
│   │   └── battleSession.ts       # equivalente BattleStateManager (requiere lectura dedicada, ver data-model.md Nota)
│   ├── services/
│   │   └── persistence/           # wrappers localStorage por dominio (research.md Decisión 1)
│   ├── state/                     # stores Zustand (uno por dominio de guardado + uno efímero de battleSession)
│   ├── components/
│   │   ├── battle/                # Pixi: carriles, unidades, HUD de energía
│   │   ├── hub/                   # Base del jugador
│   │   ├── map/                   # Mapa de capítulos/banners
│   │   ├── roster/                # Formación de equipo, mejora, evolución
│   │   └── dialogue/              # Reproductor de diálogo pre/post batalla
│   ├── i18n/                      # lookup sobre LocalizedTextTable (research.md Decisión 7)
│   └── App.tsx / router
├── public/assets/
│   ├── units/<unitId>/<stage>/{idle,attack}.json+png   # atlas Pixi por unidad+etapa
│   ├── ui/                        # sprites de interfaz seleccionados (ver data-model.md, pase de uso previo)
│   └── fonts/Baloo2-*.ttf
└── tests/
    ├── unit/                      # Vitest sobre src/engine/**
    └── e2e/                       # Playwright, User Story 1 end-to-end
```

**Structure Decision**: Proyecto único frontend (sin `backend/`), separando estrictamente `src/engine/` (lógica pura portada, sin imports de React/Pixi) de `src/components/` (presentación) — preserva la misma separación que ya existía en Unity entre `Model`/`Gameplay` (clases planas) y `View` (MonoBehaviours de UI), facilitando que `src/engine/` se teste sin renderer.

## Tabla de Mapeo Unity → React

| Unity (C#) | Naturaleza | React/TS equivalente |
|---|---|---|
| `IChapterProgressStore` / `LocalChapterProgressStore` | Persistencia | `src/services/persistence/chapterProgress.ts` + store Zustand `useChapterProgressStore` (`persist` middleware, clave `battler.chapterProgress`) |
| `IPlayerProgressStore` / `LocalPlayerProgressStore` | Persistencia | `src/services/persistence/playerProgress.ts` + `usePlayerProgressStore` |
| `IMissionEnergyStore` / `LocalMissionEnergyStore` | Persistencia | `src/services/persistence/missionEnergy.ts` + `useMissionEnergyStore` |
| `IMenuSettingsStore` / `LocalMenuSettingsStore` | Persistencia | `src/services/persistence/menuSettings.ts` + `useMenuSettingsStore` |
| `ProgressSaveData`, `PlayerProgressSaveData`, `MissionEnergySaveData`, `MenuSettings` (DTOs) | Datos | Interfaces TS en `src/types/saveData.ts` (ver `data-model.md`) |
| `UnitDefinition`, `ChapterDefinition`, `SagaArcDefinition`, `ChapterBannerDefinition`, `AdventureMap`, `*Catalog` (ScriptableObjects) | Contenido | JSON estático en `src/data/**` + tipos TS espejo |
| `BattleOutcomeResolver` | Lógica pura | `src/engine/battleOutcome.ts` |
| `MissionEnergyController` | Lógica pura | `src/engine/missionEnergy.ts` |
| `UnitLevelingController`, `PlayerCharacterLevelCalculator` | Lógica pura | `src/engine/unitLeveling.ts` |
| `UnitEvolutionController`, `UnitEvolutionStageResolver` | Lógica pura | `src/engine/unitEvolution.ts` |
| `TeamFormationController` | Lógica pura | `src/engine/teamFormation.ts` |
| `SagaArcProgressEvaluator`, `TreasureSetProgressEvaluator` | Lógica pura | `src/engine/sagaArcProgress.ts`, `src/engine/treasureSetProgress.ts` |
| `UserRankController` | Lógica pura | `src/engine/userRank.ts` |
| `UnitRuntime` (daño, crítico, multi-hit, efectos de estado) | Lógica pura + runtime | `src/engine/combat/*.ts` (puro) consumido por `src/components/battle/UnitSprite.tsx` (Pixi) |
| `BattleStateManager` — orquestador (leído en detalle, ver `data-model.md` § BattleSession) | Máquina de estados runtime | `src/engine/battleSession.ts` (orquesta los 4 sub-sistemas de abajo + `battleOutcome.ts`) + `useBattleSessionStore` (efímero, no persistido) |
| `BattleResourceController` (recurso de despliegue **en batalla** — distinto de Energía de Misión) | Runtime | `src/engine/battleResource.ts` |
| `UnitDeploymentController` (slots/cooldown por unidad del roster activo) | Runtime | `src/engine/unitDeployment.ts` |
| `EnemyWaveSpawner` (oleadas por tiempo/umbral de salud, modo Zombie Outbreak) | Runtime | `src/engine/enemyWaveSpawner.ts` |
| `BaseHealth` | Runtime | `src/engine/baseHealth.ts` |
| `BattleLaunchContext` (estático, handoff entre pantallas, consumido-y-reseteado en el mismo frame) | Runtime, no persistido | `state` de navegación de `react-router` leído una vez al montar `BattleScreen.tsx` |
| `BattleSessionModifiers` (estático, `MoveSpeedMultiplier` del objeto `SpeedBoost`) | Runtime | Campo de `BattleSession` en `useBattleSessionStore`, reseteado en `setupChapter`, no en retry |
| `BattleCameraFraming` (ajuste de cámara ortográfica Unity al ancho del carril) | Runtime, específico de Unity | No aplica directo — el canvas Pixi se ajusta por CSS/viewport responsive; revisar al implementar `BattleScreen.tsx` |
| `IBattleOutcomeListener`, `LevelRewardResult`, `ArcRewardResult` | Contrato + payloads de evento | Callback/evento de `useBattleSessionStore` (o `EventEmitter` interno) al pasar a Victory/Defeat |
| `LaneRegistry`, `UnitRuntimePool` | Optimización Unity (object pooling) | Reconciliación normal de React (`key`-based); revalorar solo si el profiling muestra necesidad real (Principio VI) |
| `TreasureSetCatalog`/`TreasureSetProgressEvaluator`, `BattleItemCatalog`, `SagaArcDefinition` (multiplicadores+recompensas), `GatorretaController`, tracking de `encounteredEnemyIds` | Sistemas ya construidos en Unity, **fuera de las 5 historias actuales de `spec.md`** | No mapeados a componentes todavía — ver `data-model.md` Nota de alcance; requieren ampliar `spec.md` antes de planificarse |
| `MainMenuFlowController` | Flow controller (MonoBehaviour) | Ruta `/` + inicialización de stores Zustand al bootstrap de la app (`App.tsx`) |
| `PlayerBaseFlowController` | Flow controller | Ruta `/hub` + `src/components/hub/PlayerBaseScreen.tsx` |
| `AdventureMapFlowController` | Flow controller | Ruta `/map` + `src/components/map/AdventureMapScreen.tsx` |
| `TeamFormationUIController`, `TeamFormationRowView` | Vista (MonoBehaviour) | `src/components/roster/TeamFormationScreen.tsx` + `TeamFormationRow.tsx` |
| `UnitUpgradeUIController`, `UnitUpgradeRowView` | Vista | `src/components/roster/UnitUpgradeScreen.tsx` |
| `DialoguePlaybackController`, `IDialogueSequencePlayer` | Vista + contrato | `src/components/dialogue/DialoguePlayer.tsx` + hook `useDialogueSequence` |
| `LocalizedTextTable`, `LocalizedTextBinder` | Datos + vista | `src/data/localization/*.json` + hook `useLocalizedText(key)` (`research.md` Decisión 7) |
| `MissionEnergyBarView` | Vista | `src/components/battle/MissionEnergyBar.tsx` |
| `ChapterBannerItemView` | Vista | `src/components/map/ChapterBannerCard.tsx` |
| `SettingsPanelController`, `MenuAudioApplier` | Vista + audio | `src/components/menu/SettingsPanel.tsx` + `src/services/audio.ts` (Web Audio / `<audio>`) |
| Assets/Scripts/Mechanics/*, Gameplay/Player*.cs, GameController.cs (sample 2D Platformer de Unity) | No pertenece a The Battler | **Fuera de alcance — no se porta** (ver `research.md` Decisión 8) |

## Complexity Tracking

*Sin violaciones que justificar — tabla vacía.*
