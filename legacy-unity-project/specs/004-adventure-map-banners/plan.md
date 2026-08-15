# Implementation Plan: Mapa de Aventuras (Banners) y Desbloqueo Secuencial

**Branch**: `004-adventure-map-banners` | **Date**: 2026-07-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-adventure-map-banners/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Pantalla de mapa de aventuras, alcanzable tras el menú principal (`003-main-menu-config`), que muestra la lista de banners de capítulo/aventura de forma libremente desplazable (scroll sin bloqueos, FR-001/FR-002) y permite seleccionar únicamente los banners desbloqueados para navegar a su batalla correspondiente (FR-003). Enfoque técnico: el desbloqueo **se deriva, no se persiste** — un evaluador puro `ChapterBannerUnlockEvaluator` (mismo patrón que `BattleOutcomeResolver` de `001-chapter1-vertical-slice`: lógica sin dependencias de motor, testable en EditMode) calcula, a partir del orden de los banners en un nuevo ScriptableObject `AdventureMap` y del `ProgressSaveData` ya existente (lectura únicamente, `002-local-save-progress`), qué banners están desbloqueados y completados de forma genérica por posición — completar el capítulo del banner N desbloquea el banner N+1, sin lógica hardcodeada por banner (FR-007). Cada `ChapterBannerDefinition` [SO] referencia — no duplica — un `ChapterDefinition` existente (001) cuando tiene contenido jugable real: "Imperio de los Test/Robot" referencia el Capítulo 1 y queda desbloqueado por defecto al ser el primero en el orden del `AdventureMap` (FR-004); "Hacia el Futuro" no referencia ningún `ChapterDefinition` todavía, por lo que su `HasPlayableDestination` deriva a `false` y permanece visible-pero-no-seleccionable con independencia del cálculo de desbloqueo (FR-005). Seleccionar un banner desbloqueado y con destino jugable navega vía `ISceneNavigator` (mismo contrato ya introducido en 003, sin nueva abstracción). El scroll libre (SC-001) se resuelve usando el `ScrollRect` estándar de Unity UI sin ninguna lógica adicional de bloqueo — la ausencia de una restricción es en sí la implementación de FR-002.

## Technical Context

**Language/Version**: C# (Unity 6000.3.20f1 scripting runtime), mismo proyecto que Capítulo 1, guardado local y menú principal.

**Primary Dependencies**: APIs del propio motor únicamente — `UnityEngine.UI.ScrollRect` (scroll libre, FR-002), `UnityEngine.UI`/`TMPro` (ya referenciado en `TheBattler.View`), `UnityEngine.SceneManagement` (vía `ISceneNavigator`, reutilizado de 003). No se añade ningún paquete nuevo.

**Storage**: Ninguna nueva. Esta feature **lee** `progress.json` (existente, de 002, vía `IChapterProgressStore.Load()`) y `menu-settings.json` (existente, de 003, vía `IMenuSettingsStore.Load()`, solo para saber el idioma activo al mostrar nombres de banner) — no escribe en ninguno de los dos. No se introduce ningún archivo de persistencia nuevo (el desbloqueo es derivado, no un dato guardado — ver data-model.md).

**Testing**: Unity Test Framework, mismo split que 001/002/003. EditMode (NUnit puro) para `ChapterBannerUnlockEvaluator` (lógica de desbloqueo/completado) y validación de datos de `ChapterBannerDefinition`/`AdventureMap`. PlayMode para `AdventureMapFlowController` (selección de banner → navegación condicionada).

**Target Platform**: El mismo definido por el proyecto (Unity 6000.3.20f1, URP 2D); sin restricciones de plataforma adicionales. SC-005 asume dispositivo móvil de gama media, misma referencia de hardware objetivo que `003-main-menu-config`.

**Project Type**: Proyecto único de Unity (`the_battler_test`); no se crea ningún módulo/proyecto nuevo, se extiende la estructura de asmdefs existente (Core→Model→Gameplay→View) y se añade una escena nueva (`AdventureMap.unity`).

**Performance Goals**: SC-005 — el mapa de aventuras se muestra y queda interactivo en menos de 2 segundos desde que se entra a él, en el hardware objetivo asumido arriba (escena ligera: lectura de dos archivos JSON pequeños + instanciado de N items de UI, sin carga de red).

**Constraints**: Sin restricción de scroll por banners bloqueados (FR-002, requisito negativo — no añadir lógica de bloqueo); seleccionar un banner bloqueado o sin destino jugable nunca debe iniciar navegación ni lanzar excepción (FR-003, FR-005); un progreso guardado corrupto o ilegible se trata como ausencia de progreso sin bloquear la carga del mapa (FR-008, mismo contrato de tolerancia que 002/003); no se incluyen banners de evento/especiales (FR-009, fuera de alcance explícito).

**Scale/Scope**: Hoy 2 banners (`AdventureMap.Banners` con 2 entradas): "Imperio de los Test/Robot" (con destino jugable, Capítulo 1) y "Hacia el Futuro" (sin destino jugable todavía). El mecanismo de desbloqueo/evaluación debe escalar a N banners sin cambios de diseño (FR-007, Assumptions de spec.md).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación |
|---|---|
| I. Narrativa Integrada | N/A — el mapa de banners es navegación/hub, no contenido narrativo propio; no duplica ni sustituye el diálogo pre/post-batalla que ya vive en `ChapterDefinition` (001). Sin conflicto. |
| II. Combate Automático por Despliegue | N/A — no toca reglas de combate; solo decide si se puede navegar hacia la escena de batalla ya existente. Sin conflicto. |
| III. Identidad Visual Animada | N/A — este principio aplica a personajes jugables (unidades); un banner de mapa es UI/presentación de capítulo, no una unidad. El arte del banner (`ChapterBannerDefinition.BannerArt`, opcional) no requiere animación de idle/ataque. Sin conflicto. |
| IV. Progresión por Capítulos con Desbloqueo | Alineación central — esta feature **implementa directamente** el mecanismo de desbloqueo secuencial que el principio exige ("cada etapa se desbloquea al completar la anterior"), de forma genérica por orden y progreso, no hardcodeada por banner (FR-007). |
| V. Balance Dirigido por Datos | Consistente: `ChapterBannerDefinition`/`AdventureMap` son ScriptableObjects (Principio V), mismo patrón que `ChapterDefinition`/`UnitDefinition`; el orden de desbloqueo y qué capítulo referencia cada banner son datos de diseño editables sin recompilar, no literales en la lógica de desbloqueo (`ChapterBannerUnlockEvaluator` opera sobre el orden del array, no sobre nombres de banner hardcodeados). |
| VI. Simplicidad desde el MVP | Fuerte alineación: reutiliza `IChapterProgressStore`, `ISceneNavigator`, `IMenuSettingsStore` y `LocalizedTextTable` ya existentes (002/003) en vez de introducir mecanismos nuevos; el desbloqueo se deriva en memoria en vez de persistirse por separado (menos estado que sincronizar); el scroll libre se resuelve con el `ScrollRect` estándar de Unity sin lógica de bloqueo añadida — cumplir FR-002 es, literalmente, no construir nada adicional. |

Sin violaciones que requieran justificación en Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/004-adventure-map-banners/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── chapter-banner-unlock-evaluator.md
│   ├── chapter-banner-definition.md
│   └── adventure-map-selection.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
Assets/Scripts/
├── Model/Battler/
│   ├── ChapterBannerDefinition.cs        # nuevo — SO: referencia opcional a ChapterDefinition (001), TargetSceneName, DisplayNameKey (clave de LocalizedTextTable, 003), BannerArt opcional. HasPlayableDestination/ChapterId son propiedades derivadas, no campos duplicados.
│   └── AdventureMap.cs                   # nuevo — SO: Banners (ChapterBannerDefinition[], el orden del array ES la secuencia de desbloqueo, FR-007)
├── Gameplay/Battler/
│   ├── ChapterBannerUnlockEvaluator.cs   # nuevo — logica pura Evaluate(banners, progress) -> ChapterBannerState[] (testable sin escena, mismo patron que BattleOutcomeResolver de 001)
│   └── AdventureMapFlowController.cs     # nuevo — MonoBehaviour: resuelve IChapterProgressStore/IMenuSettingsStore/ISceneNavigator en Awake() (mismo patron que MainMenuFlowController de 003), expone BannerStates, TrySelectBanner(index) navega solo si IsSelectable

Assets/Scripts/View/Battler/
├── AdventureMapUIController.cs           # nuevo — puebla el Content de un ScrollRect con un ChapterBannerItemView por banner, sin restringir el scroll (FR-002); reacciona a AdventureMapFlowController.BannerStates
└── ChapterBannerItemView.cs              # nuevo — item individual: nombre localizado (LocalizedTextTable.GetText directo, ver research.md §5), indicador visual bloqueado/desbloqueado/completado, boton "Select" -> AdventureMapFlowController.TrySelectBanner(index)

Assets/Scenes/
└── AdventureMap.unity                    # nueva — registrada en Build Settings junto a MainMenu.unity/Chapter1_Battle.unity (indice exacto definido en tasks.md, ver research.md §7)

Assets/Data/Battler/
└── MainAdventureMap.asset                # nuevo — instancia de AdventureMap con los 2 banners descritos en spec.md (Imperio de los Test/Robot -> Chapter1_Battle, Hacia el Futuro -> sin ChapterDefinition)

Assets/Tests/
├── EditMode/Battler/
│   ├── ChapterBannerUnlockEvaluatorTests.cs   # nuevo — primer banner siempre desbloqueado, N+1 bloqueado hasta completar N, progreso corrupto/vacio = solo primero desbloqueado, banner sin ChapterDefinition nunca cuenta como "completado" para desbloquear el siguiente
│   └── ChapterBannerDefinitionValidationTests.cs # nuevo — HasPlayableDestination coherente con LinkedChapter, TargetSceneName obligatorio cuando hay LinkedChapter, AdventureMap no vacio
└── PlayMode/Battler/
    └── AdventureMapFlowPlayModeTests.cs        # nuevo — TrySelectBanner navega solo para banner desbloqueado+jugable; banner bloqueado o "Hacia el Futuro" (desbloqueado pero sin destino) no navega ni lanza excepcion
```

**Structure Decision**: Se reutiliza la misma capa de asmdefs ya validada en 001/002/003 (`TheBattler.Core` → `TheBattler.Model` → `TheBattler.Gameplay` → `TheBattler.View`); no se crea ningún ensamblado nuevo. Los datos de diseño (`ChapterBannerDefinition`, `AdventureMap`) van en Model, igual que `ChapterDefinition`/`UnitDefinition` (Principio V). La lógica pura de desbloqueo (`ChapterBannerUnlockEvaluator`) va en Gameplay siguiendo el mismo precedente que `BattleOutcomeResolver` (001): es lógica sin dependencias de motor y testable sin escena, pero se agrupa con el resto de comportamiento en tiempo de ejecución del capítulo/mapa en vez de vivir en Model, para no mezclar "contrato de datos" con "cómputo sobre esos datos". `AdventureMapFlowController` resuelve `IChapterProgressStore`/`IMenuSettingsStore`/`ISceneNavigator` en `Awake()` exactamente como `MainMenuFlowController` (003) — ningún contrato nuevo se introduce, los tres ya existen. Los componentes de UI (`AdventureMapUIController`, `ChapterBannerItemView`) van en View, igual que `MainMenuUIController`/`SettingsPanelController`. No se modifica `MainMenuFlowController.cs` ni ningún archivo de 001/002/003 — spec.md marca explícitamente cómo se llega al mapa (botones "Empezar"/"Continuar" del menú) como fuera de alcance de esta feature (ver Assumptions de spec.md y research.md §8); esta feature asume que la escena `AdventureMap.unity` ya se alcanzó por ese camino, igual que 003 asumió llegar al menú.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Sin violaciones — tabla omitida.

## Post-Design Constitution Re-check

*Tras completar research.md, data-model.md, contracts/ y quickstart.md (Fase 1).*

El diseño final (`ChapterBannerDefinition`/`AdventureMap` como ScriptableObjects en Model que referencian — no duplican — `ChapterDefinition` de 001; `ChapterBannerUnlockEvaluator` como función pura en Gameplay que deriva desbloqueo/completado por posición y `ProgressSaveData`, sin persistir nada nuevo; `AdventureMapFlowController`/`AdventureMapUIController` replicando exactamente el patrón `MainMenuFlowController`/`MainMenuUIController` de 003; reutilización directa de `IChapterProgressStore`, `ISceneNavigator`, `IMenuSettingsStore` y `LocalizedTextTable.GetText` ya existentes; `ScrollRect` estándar sin lógica de bloqueo para el scroll libre) no introdujo ninguna dependencia, capa o mecanismo fuera de lo ya contemplado en el Constitution Check inicial. Las 6 evaluaciones de la tabla anterior se mantienen sin cambios. Sigue sin haber violaciones ni necesidad de Complexity Tracking.

Un ajuste de alcance identificado durante el diseño (no cambio de scope de la feature, sino una precisión de diseño): `LocalizedTextBinder` (003) no expone forma pública de asignar su `m_Key` en tiempo de ejecución (está pensado para elementos de UI fijos, cableados en el Editor vía `MainMenuContentBuilder`-style tooling) — por eso `ChapterBannerItemView` llama directamente a `LocalizedTextTable.GetText(key, language)` en vez de depender de `LocalizedTextBinder`/`RefreshAll`, ya que los items de banner se generan dinámicamente a partir de `AdventureMap.Banners` (data-driven, cantidad no fija en tiempo de diseño de la escena). No se modifica `LocalizedTextTable` ni `LocalizedTextBinder`: `GetText` ya es público y su contrato de fallback (spec.md 003) se reutiliza tal cual — ver research.md §5.
