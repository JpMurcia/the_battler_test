# Implementation Plan: Sistema Visual Cyber-Modern — Tema Compartido y Reskin de Menú Principal

**Branch**: `022-cyber-modern-theme` | **Date**: 2026-08-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/022-cyber-modern-theme/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Añade `UIThemeCatalog` (ScriptableObject nuevo en `Assets/ScriptableObjects/Battler/UI/`) como fuente única de colores de acento, gradiente primario, radios de esquina y referencias de fuente (Orbitron/Inter), y reskinea la escena `MainMenu.unity` añadiendo un puñado de componentes de View reutilizables y pequeños (`ThemedGlassPanel`, `ThemedAccentButton`, `ThemedGlowIcon` — research.md §4) como componentes **hermanos** sobre los GameObjects ya existentes, cada uno con su propia referencia directa al `UIThemeCatalog` compartido. El "cristal"/resplandor se aproxima con sprites (9-slice semitransparente + gradiente radial generados procedimentalmente, sin descargas externas — research.md §3); las animaciones cosméticas (pulso, fade-in) usan DOTween, primera dependencia de terceros de UI del proyecto (research.md §1). Al ser componentes hermanos y no una modificación de los controllers existentes, **`MainMenuUIController.cs` y `SettingsPanelController.cs` no cambian ni una línea** — ningún miembro público ni reflejado de `MainMenuFlowController`/`SettingsPanelController` se toca, y la suite `MainMenuFlowPlayModeTests.cs` ya existente permanece como guardia de regresión funcional sin modificarse.

## Technical Context

**Language/Version**: C# (Unity 6000.3.20f1 scripting runtime), mismo proyecto que 001-021.

**Primary Dependencies**: DOTween (nuevo — única dependencia de terceros dedicada a UI/animación del proyecto; mecanismo de adquisición en research.md §1) + `UnityEngine.UI`/TextMeshPro ya referenciados por `TheBattler.View`.

**Storage**: N/A — `UIThemeCatalog` es un asset de diseño editable en el Inspector (datos de estilo), no dato de guardado; no se toca `MenuSettings`/`ProgressSaveData`/`IMenuSettingsStore`.

**Testing**: Unity Test Framework, mismo split EditMode/PlayMode que 001-021. EditMode nuevo (`UIThemeCatalogTests`) para resolución de valores y fallback ante referencias faltantes (spec.md Edge Cases). `MainMenuFlowPlayModeTests.cs` existente NO se modifica y debe seguir en verde sin cambios (regresión) — es puramente funcional, no toca visuales. Dado que esta spec es casi enteramente perceptual, gran parte de la verificación cae en `quickstart.md` (comparación manual contra el mockup de referencia), mismo criterio ya usado en specs 013-021.

**Target Platform**: el mismo definido por el proyecto (Unity 6000.3.20f1, URP 2D, móvil Android/iOS); sin restricciones de plataforma adicionales.

**Project Type**: Proyecto único de Unity (`the_battler_test`); no se crea ningún ensamblado nuevo.

**Performance Goals**: sin regresión sobre el objetivo de 60 fps ya fijado en 001-021 — sin desenfoque en tiempo real (spec.md FR-005), sprites estáticos + tweens cosméticos acotados a Menú Principal/Ajustes (no al bucle de combate).

**Constraints**: cero cambios de código a `MainMenuFlowController.cs`/`MainMenuUIController.cs`/`SettingsPanelController.cs` — los componentes `Themed*` se añaden como hermanos en la escena, no como modificaciones a esos scripts. Cero cambios a miembros públicos o accedidos por reflexión ya cubiertos por `MainMenuFlowPlayModeTests.cs` (`m_ProgressStore`/`m_SceneNavigator`/`m_SettingsStore`, `HasSavedProgress`, `StartNewGame()`/`ContinueGame()`, `AudioApplier`, `CurrentSettings`, `Initialize`/`SetPendingMusicVolume`/`SetPendingLanguage`/`ApplyAndSave`/`ClosePanel`/`ConfirmedSettings`) — la suite existente debe seguir en verde sin modificarse (spec.md FR-002/FR-003).

**Scale/Scope**: 1 ScriptableObject nuevo (`UIThemeCatalog`) + 3 componentes de View reutilizables y pequeños (`ThemedGlassPanel`, `ThemedAccentButton`, `ThemedGlowIcon`), añadidos como hermanos sobre la jerarquía ya existente de `MainMenu.unity` (`MainPanel`/`ButtonColumn`, `SettingsPanel`/`SettingsColumn`) sin tocar código de controller, 1 fuente nueva importada (Inter), 2-3 sprites generados procedimentalmente (panel 9-slice, glow radial), 1 paquete nuevo (DOTween) — ver data-model.md.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación |
|---|---|
| I. Narrativa Integrada | No aplica — esta spec es un reskin de chrome de UI (menú/ajustes), no toca diálogos ni contenido de capítulo/batalla. |
| II. Combate Automático por Despliegue | No aplica — no se toca ningún sistema de combate, energía ni despliegue. |
| III. Identidad Visual Animada | No aplica a esta spec — no se autora ni modifica ningún personaje jugable/enemigo; `UIThemeCatalog` y los componentes `Themed*` son chrome de interfaz (paneles, botones, iconos genéricos), no arte de unidad. Confirmado explícitamente en spec.md Assumptions. |
| IV. Progresión por Capítulos con Desbloqueo | No aplica — no se toca desbloqueo de capítulos ni contenido narrativo. |
| V. Balance Dirigido por Datos | Alineación directa: `UIThemeCatalog` extiende el mismo patrón dato-en-ScriptableObject (ya usado por `EnemyWaveDefinition`/`UnitDefinition`/etc.) al dominio visual — colores/fuentes/radios viven en un asset editable, nunca hardcodeados por componente (spec.md FR-001). |
| VI. Simplicidad desde el MVP | Requiere justificación explícita: se añade DOTween como dependencia de terceros nueva. Ver Complexity Tracking — la alternativa sin dependencias (corrutinas a mano) fue evaluada y descartada explícitamente durante el brainstorming previo a esta spec. |

## Post-Design Constitution Re-check

*Tras completar research.md, data-model.md, contracts/ y quickstart.md (Fase 1).*

El diseño final redujo la superficie de riesgo descrita en Technical Context en vez de ampliarla: la decisión de research.md §4 (componentes `Themed*` hermanos, no modificación de controllers) deja a `MainMenuFlowController.cs`/`MainMenuUIController.cs`/`SettingsPanelController.cs` con **cero cambios de código**, la garantía más fuerte posible frente a `MainMenuFlowPlayModeTests.cs`. La generación procedimental de sprites (research.md §3) evita toda descarga de arte de terceros. Las dos únicas adquisiciones externas que quedan (DOTween, Inter) están explícitamente fuera del control de este pipeline automatizado — research.md §1-§2 las deja como pasos manuales/con permiso explícito, no como asunciones silenciosas. El Constitution Check original se mantiene sin cambios: la única justificación pendiente (DOTween, Principio VI) sigue documentada en Complexity Tracking; ningún otro principio requiere excepción.

## Project Structure

### Documentation (this feature)

```text
specs/022-cyber-modern-theme/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── ui-theme-consumption.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
Assets/Scripts/Model/Battler/
└── UIThemeCatalog.cs                          # nuevo — ScriptableObject: colores de acento, gradiente primario, radios, referencias TMP_FontAsset (Orbitron/Inter)

Assets/Scripts/View/Battler/
├── ThemedGlassPanel.cs                        # nuevo — Image de fondo semitransparente + borde, a partir de UIThemeCatalog
├── ThemedAccentButton.cs                      # nuevo — botón con color/gradiente de acento + pulso opcional (DOTween) desde UIThemeCatalog
└── ThemedGlowIcon.cs                          # nuevo — sprite de glow radial detrás de un icono/botón, color de acento configurable
# MainMenuUIController.cs / SettingsPanelController.cs / MainMenuFlowController.cs — SIN CAMBIOS (research.md §4)

Assets/ScriptableObjects/Battler/UI/
└── UIThemeCatalog.asset                       # nuevo — instancia de datos consumida por MainMenu.unity

Assets/TextMesh Pro/Resources/Fonts & Materials/  (o ubicación equivalente ya usada por fuentes importadas)
└── Inter-* SDF.asset                          # nuevo — TMP Font Asset importado (research.md §2)

Assets/Sprites/Battler/UI/  (carpeta nueva — Assets/Sprites/ no existe todavía en el proyecto; el nombre sigue por analogía el patrón real ya usado por Scripts/Battler, ScriptableObjects/Battler, Prefabs/Battler)
├── GlassPanel9Slice.png(+.meta)                # nuevo — generado procedimentalmente (research.md §3), sin descarga externa
└── RadialGlow.png(+.meta)                      # nuevo — generado procedimentalmente (research.md §3), sin descarga externa

Assets/Scenes/
└── MainMenu.unity                              # modificado — MainPanel/ButtonColumn y SettingsPanel/SettingsColumn reskinados añadiendo componentes Themed* como hermanos sobre los GameObjects ya existentes; EventSystem/Main Camera y los GameObjects MainMenuFlowController/MainMenuUIController quedan intactos (research.md §4)

Assets/Tests/EditMode/Battler/
└── UIThemeCatalogTests.cs                      # nuevo — resolución de valores, fallback ante referencia de fuente faltante (spec.md Edge Cases)

Packages/manifest.json                          # modificado — + dependencia DOTween (research.md §1)
```

**Structure Decision**: Misma capa de asmdefs ya validada (`TheBattler.Core` → `TheBattler.Model` → `TheBattler.Gameplay` → `TheBattler.View`); no se crea ningún ensamblado nuevo. `UIThemeCatalog` (dato puro, sin dependencia de `Gameplay`) va en `Model`, junto al resto de ScriptableObjects del proyecto. Los componentes `Themed*` (consumen `UIThemeCatalog` + `UnityEngine.UI`/TMP) van en `View`, mismo nivel que `MainMenuUIController`/`SettingsPanelController`, sin introducir ninguna capa nueva ni dependencia de `Gameplay`. Se elige un puñado de componentes `View` reutilizables en vez de estilizar `MainMenuUIController`/`SettingsPanelController` directamente porque la Historia de Usuario 2 (spec.md) exige explícitamente que las ~10 pantallas futuras de esta iniciativa reutilicen el mismo tema sin duplicar lógica de aplicación de estilo por controller.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Dependencia de terceros nueva: DOTween | Animaciones cosméticas (pulso del botón principal, fade-in de panel) consistentes y reutilizables en las ~10 pantallas futuras de esta iniciativa de rediseño (Hub, Mapa, Batalla, Equipar, Mejorar, Biblioteca, Perfil), evitando que cada spec futura reimplemente tweening a mano de forma ligeramente distinta | Corrutinas manuales por pantalla — evaluada y descartada explícitamente durante el brainstorming previo a esta spec: funcionaría para esta única pantalla, pero el coste de mantenimiento compuesto a través de ~10 specs futuras (lógica de easing/tiempo repetida y potencialmente inconsistente) supera el de una única dependencia gratuita y estándar en desarrollo Unity móvil |
