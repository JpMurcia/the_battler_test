# Implementation Plan: Menú Principal y Configuración

**Branch**: `003-main-menu-config` | **Date**: 2026-07-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-main-menu-config/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Pantalla de menú principal como primer punto de entrada del juego: aplica valores por defecto de audio (música/SFX/voces) e idioma (Español/Inglés/Chino/Francés) sin intervención del jugador, ofrece "Empezar" o "Continuar" (según exista progreso válido en `002-local-save-progress`) hacia la batalla del Capítulo 1, y una pantalla de configuración con confirmación explícita ("Aplicar/Guardar") accesible solo desde el menú. Enfoque técnico: se reutiliza el patrón ya validado en 002 (store JSON con escritura atómica y fallback silencioso) para un nuevo `MenuSettings`/`LocalMenuSettingsStore`; se añade un `AudioMixer` de 3 grupos expuestos para los canales de volumen; se resuelve la traducción de textos del menú con una tabla de datos propia (`LocalizedTextTable`, ScriptableObject) en vez de instalar el paquete de Localization de Unity, consistente con Principio V (datos en ScriptableObjects) y Principio VI (simplicidad/YAGNI); y se aísla la navegación de escena detrás de `ISceneNavigator` para que la lógica de "Empezar"/"Continuar" sea testeable sin cargar escenas reales.

## Technical Context

**Language/Version**: C# (Unity 6000.3.20f1 scripting runtime), mismo proyecto que los Capítulos 1 y el guardado local.

**Primary Dependencies**: APIs del propio motor únicamente — `UnityEngine.Audio.AudioMixer`, `UnityEngine.SceneManagement.SceneManager`, `UnityEngine.UI`/`TMPro` (ya referenciado en `TheBattler.View`), `System.IO`, `UnityEngine.JsonUtility`. No se añade ningún paquete nuevo (en particular, no `com.unity.localization` — ver research.md §2).

**Storage**: Dos archivos JSON locales en `Application.persistentDataPath`: `progress.json` (existente, de 002, solo lectura desde esta feature) y `menu-settings.json` (nuevo, mismo patrón de escritura atómica que `LocalChapterProgressStore`).

**Testing**: Unity Test Framework, mismo split que 001/002 — EditMode (NUnit puro) para `LocalMenuSettingsStore` y `LocalizedTextTable`; PlayMode para el flujo del menú (`MainMenuFlowPlayModeTests`).

**Target Platform**: El mismo definido por el proyecto (Unity 6000.3.20f1, URP 2D); esta feature no introduce restricciones de plataforma adicionales. Para SC-004, se asume dispositivo móvil de gama media como hardware objetivo (ver spec.md § Assumptions) — el roadmap general del proyecto (`docs/roadmap-fases.md`) describe "The Battler" como un juego de estilo gacha inspirado en Battle Cats (título móvil); no hay todavía una decisión de plataforma objetivo formalizada en la constitución, así que esto queda documentado como supuesto de esta feature, no como decisión de proyecto definitiva.

**Project Type**: Proyecto único de Unity (`the_battler_test`); no se crea ningún módulo/proyecto nuevo, se extiende la estructura de asmdefs existente (Core→Model→Gameplay→View) y se añade una escena nueva (`MainMenu.unity`).

**Performance Goals**: SC-004 — el menú se muestra y queda interactivo en menos de 2 segundos desde que se abre el juego (escena ligera, sin carga de red), en el hardware objetivo asumido arriba.

**Constraints**: Sin cuentas, login ni conectividad de red (FR-012); los ajustes solo son accesibles desde el menú principal, no durante una aventura/batalla en curso (FR-007); un fallo de persistencia de ajustes confirmados o un guardado de progreso corrupto nunca debe bloquear el arranque ni lanzar una excepción no controlada, tanto en lectura como en escritura (FR-009/FR-013, mismo patrón de tolerancia que 002).

**Scale/Scope**: Hoy existe 1 capítulo jugable (Capítulo 1) y 4 idiomas soportados para los textos del menú principal (FR-004; la UI de 001 no tiene hoy texto estático traducible — ver data-model.md § Relación con entidades existentes). Un único slot de `MenuSettings` local, sin perfiles múltiples, análogo al único slot de `ProgressSaveData` en 002.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación |
|---|---|
| I. Narrativa Integrada | N/A — el menú principal no es contenido narrativo de capítulo; no requiere diálogo pre/post-batalla propio. Sin conflicto. |
| II. Combate Automático por Despliegue | N/A — no toca reglas de combate; solo navega hacia la escena de batalla ya existente. Sin conflicto. |
| III. Identidad Visual Animada | N/A — este principio aplica a personajes jugables (unidades); el menú es UI de sistema, no una unidad. Sin conflicto. |
| IV. Progresión por Capítulos con Desbloqueo | Alineación parcial e intencional, mismo patrón que 002: el menú **lee** `ProgressSaveData` para decidir "Continuar" vs. "Empezar", pero no implementa lógica de desbloqueo de capítulos en sí (solo hay 1 capítulo hoy; el mapa de banners con desbloqueo secuencial real es la Fase 4, todavía sin spec — ver spec.md Assumptions). No contradice el principio, se apoya en él. |
| V. Balance Dirigido por Datos | Consistente: `LocalizedTextTable` (traducciones) es un `ScriptableObject`, mismo patrón que `ChapterDefinition`/`UnitDefinition`. `MenuSettings` (elección del jugador, no dato de diseño) es una clase plana + store JSON, igual que `ProgressSaveData` en 002 — no se modela como ScriptableObject porque no es contenido de diseño. |
| VI. Simplicidad desde el MVP | Fuerte alineación: sin paquete de Localization, sin ajustes de gráficos/controles/accesibilidad, un único slot de configuración, reutiliza el patrón de persistencia ya validado en 002 en vez de introducir uno nuevo. |

Sin violaciones que requieran justificación en Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/003-main-menu-config/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── menu-settings-store.md
│   ├── localized-text-table.md
│   └── scene-navigator.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
Assets/Scripts/
├── Core/Battler/
│   └── SupportedLanguage.cs                 # nuevo — enum Spanish/English/Chinese/French
├── Model/Battler/
│   ├── MenuSettings.cs                      # nuevo — formatVersion, 3 volúmenes lineales [0,1], language
│   ├── IMenuSettingsStore.cs                # nuevo — contrato Load()/Save()
│   ├── LocalizedStringEntry.cs              # nuevo — key + 4 traducciones
│   ├── LocalizedTextTable.cs                # nuevo — ScriptableObject, GetText(key, language) con fallback a Spanish
│   └── ISceneNavigator.cs                   # nuevo — contrato LoadScene(sceneName), para testear navegación sin cargar escenas reales
├── Gameplay/Battler/
│   ├── LocalMenuSettingsStore.cs            # nuevo — implementación JSON, mismo patrón que LocalChapterProgressStore
│   ├── LocalChapterProgressStore.cs         # modificado — extrae el nombre de archivo "progress.json" a una constante pública reutilizable
│   ├── MainMenuFlowController.cs            # nuevo — orquesta: decide Continuar/Empezar (lee IChapterProgressStore), aplica MenuSettings al arrancar, navega de escena (vía ISceneNavigator)
│   ├── UnitySceneNavigator.cs               # nuevo — implementación de ISceneNavigator sobre SceneManager.LoadScene
│   └── MenuAudioApplier.cs                  # nuevo — conversión volumen lineal→dB y AudioMixer.SetFloat para los 3 canales

Assets/Scripts/View/Battler/
├── MainMenuUIController.cs                  # nuevo — botones Empezar/Continuar, visibilidad según progreso
├── SettingsPanelController.cs               # nuevo — sliders/dropdown, estado "pendiente" vs. confirmado, Aplicar/Guardar y descarte al salir
└── LocalizedTextBinder.cs                   # nuevo — componente reutilizable sobre TMP_Text (hoy solo usado dentro de MainMenu.unity; ninguna UI existente de 001 tiene texto estático que retrofitear — ver data-model.md), resuelve texto vía LocalizedTextTable

Assets/Scenes/
└── MainMenu.unity                           # nuevo — escena índice 0 de Build Settings (Chapter1_Battle pasa a índice 1)

Assets/Audio/
└── MainAudioMixer.mixer                     # nuevo — 3 grupos expuestos: MusicVolume, SFXVolume, VoiceVolume

Assets/Data/Battler/
└── MainLocalizedText.asset                  # nuevo — instancia de LocalizedTextTable con las claves de menú + UI existente en 4 idiomas

Assets/Tests/
├── EditMode/Battler/
│   ├── LocalMenuSettingsStoreTests.cs       # nuevo — round-trip, sin archivo, archivo corrupto, clamp de valores
│   └── LocalizedTextTableTests.cs           # nuevo — lookup exacto, fallback a español, marcador de clave faltante
└── PlayMode/Battler/
    └── MainMenuFlowPlayModeTests.cs         # nuevo — visibilidad Continuar/Empezar, navegación, aplicar/descartar ajustes
```

**Structure Decision**: Se reutiliza la misma capa de asmdefs ya validada en 001/002 (`TheBattler.Core` → `TheBattler.Model` → `TheBattler.Gameplay` → `TheBattler.View`); no se crea ningún ensamblado nuevo. `SupportedLanguage` va en Core junto a `BattleOutcome`/`Team` (valor compartido sin I/O). Los datos y contratos (`MenuSettings`, `IMenuSettingsStore`, `LocalizedTextTable`, `ISceneNavigator`) van en Model, igual que `ProgressSaveData`/`IChapterProgressStore`/`ChapterDefinition` — `ISceneNavigator` sigue el mismo motivo que `IChapterProgressStore`: permitir que `MainMenuFlowController` se pruebe en PlayMode con un doble de test, sin cargar una escena real ni depender de `SceneManager` directamente (ver research.md §7). Las implementaciones con `System.IO`/`AudioMixer`/`SceneManager` van en Gameplay, igual que `LocalChapterProgressStore`/`BattleResourceController`. Los componentes de UI (botones, sliders, binders de texto) van en View, igual que `DeploymentUIController`/`DialoguePlaybackController`. No se toca `Assets/Scripts/UI` ni `Assets/Scripts/Mechanics` (código de la plantilla de muestra `Platformer.*` de Unity, sin relación con `TheBattler.*`) — el menú se construye desde cero en la jerarquía `TheBattler.*` ya establecida, no sobre ese código heredado. Tampoco se modifica `Chapter1_Battle.unity` ni sus componentes de UI (001): no tienen texto estático traducible hoy (ver data-model.md).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Sin violaciones — tabla omitida.

## Post-Design Constitution Re-check

*Tras completar research.md, data-model.md, contracts/ y quickstart.md (Fase 1).*

El diseño final (`LocalizedTextTable` como ScriptableObject en Model, `MenuSettings`/`IMenuSettingsStore`/`LocalMenuSettingsStore` replicando exactamente el patrón de `ProgressSaveData`/`IChapterProgressStore`/`LocalChapterProgressStore` de 002, `AudioMixer` con conversión lineal→dB aislada en `MenuAudioApplier`, `ISceneNavigator`/`UnitySceneNavigator` con el mismo patrón de inyección que `IChapterProgressStore`, y el estado "pendiente vs. confirmado" contenido en la capa View sin filtrarse a Model/Gameplay) no introdujo ninguna dependencia, capa o mecanismo fuera de lo ya contemplado en el Constitution Check inicial. Las 6 evaluaciones de la tabla anterior se mantienen sin cambios. Sigue sin haber violaciones ni necesidad de Complexity Tracking.

Dos ajustes de alcance identificados durante el diseño (no cambios de scope de la feature, sino prerrequisitos/correcciones de infraestructura):
1. `LocalChapterProgressStore.cs` requiere una modificación mínima (extraer el nombre de archivo `"progress.json"` a una constante pública) para que `MainMenuFlowController` pueda construir la misma ruta de archivo sin duplicar el literal — ver Project Structure arriba. No cambia el comportamiento de 002, solo evita una cadena mágica repetida.
2. Verificación posterior con `/speckit-analyze` (2026-07-28): la UI existente de 001 (`DeploymentUIController`, `DialoguePlaybackController`) no tiene texto estático traducible, así que FR-004/spec.md se corrigió para no reclamar una traducción de "HUD/pantallas existentes" que no aplica hoy; `ISceneNavigator` se añadió para que la navegación de "Empezar"/"Continuar" (US1/US2) fuera testeable sin cargar `Chapter1_Battle.unity` en cada test de PlayMode del menú. Ninguno de los dos cambia el Constitution Check.
