# Implementation Plan: Bibliotecas de Consulta (Cat Guide / Enemy Guide / Treasure Menu)

**Branch**: `019-library-screens` | **Date**: 2026-08-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/019-library-screens/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Añade tres pantallas de solo lectura accesibles desde la Base del Jugador. Cat Guide y Treasure Menu son puras funciones de agregación sobre datos y controllers ya existentes (`PlayerBaseFlowController.OwnedUnits`/`Leveling`/`Evolution`, `TreasureSetCatalog`/`TreasureSetProgressEvaluator`), sin ningún dato nuevo que persistir. Enemy Guide requiere el único dato genuinamente nuevo de esta feature: un registro persistente de qué enemigos ya aparecieron en el carril (`PlayerProgressSaveData.encounteredEnemyIds`), poblado mediante un evento nuevo en `EnemyWaveSpawner` (`EnemyEncountered`) al que `BattleStateManager` se suscribe, y un catálogo de solo lectura nuevo (`EnemyCatalog`) para resolver esos ids a `UnitDefinition` y mostrar sus stats. Las tres bibliotecas se construyen con clases estáticas puras (`CatGuideBuilder`/`EnemyGuideBuilder`/`TreasureMenuBuilder`, mismo patrón que `TreasureSetProgressEvaluator` ya existente) en vez de controllers con estado, porque ninguna necesita mutar nada.

## Technical Context

**Language/Version**: C# (Unity 6000.3.20f1 scripting runtime), mismo proyecto que 001-018.

**Primary Dependencies**: Ninguna nueva — únicamente `UnityEngine` ya referenciado por `TheBattler.Core`/`Model`/`Gameplay`/`View`.

**Storage**: N/A para esta feature salvo `PlayerProgressSaveData.encounteredEnemyIds` (nuevo, aditivo), que reutiliza el mismo `IPlayerProgressStore`/`LocalPlayerProgressStore` (JSON local) ya usado por `005`/`013`/`014`/`018`.

**Testing**: Unity Test Framework, mismo split EditMode/PlayMode que 001-018. EditMode para los 3 builders puros (`CatGuideBuilder`/`EnemyGuideBuilder`/`TreasureMenuBuilder`, sin dependencias de escena) con dobles de `IPlayerProgressStore`/controllers, y para `EnemyCatalog.Resolve`. PlayMode para el registro de enemigos enfrentados end-to-end (`EnemyWaveSpawner.EnemyEncountered` → `BattleStateManager` → persistencia), mismo patrón que `AdventureMapEventBannerSelectionPlayModeTests.cs` (015).

**Target Platform**: El mismo definido por el proyecto (Unity 6000.3.20f1, URP 2D); sin restricciones de plataforma adicionales.

**Project Type**: Proyecto único de Unity (`the_battler_test`); no se crea ningún ensamblado nuevo.

**Performance Goals**: Sin regresión sobre el objetivo de 60 fps ya fijado en 001-018. Las tres bibliotecas solo se recalculan al abrirse (no por frame); el registro de enemigos enfrentados añade una única comprobación `Array.IndexOf` por enemigo generado (mismo orden de magnitud que el guard ya existente de `obtainedTreasureIds`).

**Constraints**: Las tres bibliotecas son estrictamente de solo lectura (FR-007) — ningún builder puede llamar a `IPlayerProgressStore.Save` ni a ningún método de mutación de los controllers ya existentes. El registro de enemigos enfrentados no debe alterar el comportamiento de combate existente (`EnemyWaveSpawner`/`BattleStateManager` siguen funcionando igual para niveles ya construidos, FR-010).

**Scale/Scope**: 1 campo nuevo en `PlayerProgressSaveData`, 1 ScriptableObject nuevo (`EnemyCatalog`), 3 pares entry/builder nuevos (2 en `Model`, 1 en `Gameplay`), 1 evento nuevo en `EnemyWaveSpawner`, una suscripción nueva en `BattleStateManager` (sin campos serializados nuevos). 3 pantallas nuevas en `View` (fuera del alcance de tipos de datos de este plan, ver Project Structure). No se autora contenido de nivel/unidad nuevo — `EnemyCatalog` solo referencia `UnitDefinition` ya existentes.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación |
|---|---|
| I. Narrativa Integrada | N/A — esta feature no toca diálogo pre/post-batalla ni contenido narrativo; son pantallas de consulta fuera del flujo de combate. |
| II. Combate Automático por Despliegue | N/A — no altera el bucle de despliegue/combate; el único cambio dentro de una batalla es un evento adicional (`EnemyEncountered`) que no afecta timing, coste ni cooldown de ninguna unidad. |
| III. Identidad Visual Animada | N/A — no añade unidades ni animaciones nuevas; muestra datos de unidades/enemigos ya construidos. |
| IV. Progresión por Capítulos con Desbloqueo | N/A — no toca el sistema de desbloqueo entre capítulos; Cat Guide refleja qué está desbloqueado, no lo modifica. |
| V. Balance Dirigido por Datos | Alineación directa: `EnemyCatalog` es un `ScriptableObject` editable en el Inspector, mismo patrón que `UnitUnlockCatalog`/`TreasureSetCatalog`. |
| VI. Simplicidad desde el MVP | Alineación directa: 3 funciones estáticas puras en vez de controllers con estado (research.md §6, alternativa evaluada y rechazada), sin función de búsqueda/filtro/ordenamiento (spec.md Assumptions). Sin necesidad de Complexity Tracking. |

## Post-Design Constitution Re-check

*Tras completar research.md, data-model.md, contracts/ y quickstart.md (Fase 1).*

El diseño final no amplió la superficie descrita en Technical Context. La única pieza de estado nuevo persistido es `PlayerProgressSaveData.encounteredEnemyIds`; las tres funciones de biblioteca permanecen puras y sin efectos secundarios (FR-007), y `EnemyWaveSpawner` no adquirió ninguna dependencia de persistencia (research.md §1) — la separación de responsabilidades (el spawner solo notifica, `BattleStateManager` decide qué hacer con la notificación) se mantuvo sin excepciones. El Constitution Check original se mantiene sin cambios: ningún principio requiere una excepción documentada.

## Project Structure

### Documentation (this feature)

```text
specs/019-library-screens/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
│   ├── enemy-encounter-tracking.md
│   └── library-builders.md
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
Assets/Scripts/
├── Model/Battler/
│   ├── PlayerProgressSaveData.cs            # modificado — + encounteredEnemyIds: string[]
│   ├── EnemyCatalog.cs                      # nuevo — ScriptableObject (UnitDefinition[] + Resolve)
│   ├── EnemyGuideBuilder.cs                 # nuevo — struct EnemyGuideEntry + función estática Build
│   └── TreasureMenuBuilder.cs               # nuevo — struct TreasureMenuEntry + función estática Build
└── Gameplay/Battler/
    ├── EnemyWaveSpawner.cs                  # modificado — + evento EnemyEncountered, disparado en SpawnEnemy()
    ├── BattleStateManager.cs                # modificado — Awake() se suscribe a EnemyEncountered; persiste encounteredEnemyIds
    └── CatGuideBuilder.cs                    # nuevo — struct CatGuideEntry + función estática Build (depende de UnitLevelingController/UnitEvolutionController)

Assets/Scripts/View/Battler/
├── CatGuideUIController.cs                  # nuevo — pantalla de solo lectura, mismo patrón que TeamFormationUIController
├── EnemyGuideUIController.cs                # nuevo — ídem
└── TreasureMenuUIController.cs              # nuevo — ídem

Assets/Editor/Battler/
└── PlayerBaseContentBuilder.cs               # modificado — crea EnemyCatalog de ejemplo (enemigos de 001/010/013), añade los 3 templates de biblioteca a PlayerBase.unity, cablea los 3 UIController nuevos

Assets/Tests/
├── EditMode/Battler/
│   ├── CatGuideBuilderTests.cs               # nuevo — construye entradas correctas a partir de dobles de OwnedUnits/Leveling/Evolution
│   ├── EnemyGuideBuilderTests.cs             # nuevo — filtra por encounteredEnemyIds, catálogo/registro vacíos ⇒ lista vacía (FR-009)
│   └── TreasureMenuBuilderTests.cs           # nuevo — conteo obtenidos/total y BonusGranted correctos, set sin progreso ⇒ 0/total (FR-009)
└── PlayMode/Battler/
    └── EnemyEncounterTrackingPlayModeTests.cs   # nuevo — un enemigo generado en batalla queda en encounteredEnemyIds tras la batalla; un enemigo planeado pero nunca generado no queda registrado (US2 Escenario 3); persiste tras RetryBattle() sin duplicarse
```

**Structure Decision**: Misma capa de asmdefs ya validada (`TheBattler.Core` → `TheBattler.Model` → `TheBattler.Gameplay` → `TheBattler.View`); no se crea ningún ensamblado nuevo. `EnemyCatalog`/`EnemyGuideBuilder`/`TreasureMenuBuilder` van en `Model` (solo dependen de tipos `Model`, research.md §6); `CatGuideBuilder` va en `Gameplay` porque depende de `UnitLevelingController`/`UnitEvolutionController` (clases `Gameplay`, no pueden moverse a `Model` sin invertir la dependencia de capas ya establecida). Los 3 `UIController` van en `View`, mismo patrón que `TeamFormationUIController`/`AdventureMapUIController` — instancian el builder correspondiente y solo renderizan su resultado, sin lógica de negocio propia.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Sin violaciones — el Constitution Check no encontró ningún ítem que requiera justificación (ver Principio VI arriba). No se rellena esta tabla.
