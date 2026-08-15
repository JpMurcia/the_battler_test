# Implementation Plan: Reskin Visual Cyber-Modern — Base del Jugador / Hub

**Branch**: `023-player-base-reskin` | **Date**: 2026-08-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/023-player-base-reskin/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Reskinea `PlayerBase.unity` reutilizando el `UIThemeCatalog` y los tres componentes `Themed*` (`ThemedGlassPanel`, `ThemedAccentButton`, `ThemedGlowIcon`) ya creados por `022-cyber-modern-theme`, añadidos como componentes **hermanos** sobre la cabecera de nivel/XP y los 7 botones de navegación ya construidos (Mejorar, Equipo, Objetos de Batalla, Cat Guide, Enemy Guide, Menú de Tesoros, Rango de Usuario) — mismo patrón que `022` aplicó a `MainMenu.unity`, así que `PlayerBaseDashboardUIController.cs` no cambia su lógica existente. Se añade un único componente nuevo, pequeño y genérico, `ComingSoonUIController` (View), y 4 botones nuevos en la escena (Gamatoto/Cápsula/Almacén/Tienda) que abren ese mismo panel compartido — resolviendo FR-007 sin inventar contenido de los 4 sistemas que todavía no existen. La construcción/wiring de la escena se hace, como en el resto del proyecto, extendiendo el Editor tool ya existente `PlayerBaseContentBuilder.cs`, no editando la escena a mano.

## Technical Context

**Language/Version**: C# (Unity 6000.3.20f1 scripting runtime), mismo proyecto que 001-022.

**Primary Dependencies**: `UIThemeCatalog`, `ThemedGlassPanel`, `ThemedAccentButton`, `ThemedGlowIcon` (todos ya creados por `022-cyber-modern-theme`, sin cambios) + DOTween (ya introducida por `022`, no se agrega ninguna dependencia nueva en esta spec) + `UnityEngine.UI`/TextMeshPro ya referenciados por `TheBattler.View`.

**Storage**: N/A — reskin puramente visual; no se toca `PlayerProgressSaveData` ni ningún store existente.

**Testing**: Unity Test Framework, mismo split EditMode/PlayMode que 001-022. EditMode nuevo (`ComingSoonUIControllerTests`) para el único comportamiento no trivial nuevo (mostrar el nombre de sistema correcto, reutilizar la misma instancia). Se extiende `PlayerBaseFlowPlayModeTests.cs` (test de integración ya existente que cubre la navegación de `PlayerBaseDashboardUIController`) con 4 casos nuevos que verifican que los accesos a Gamatoto/Cápsula/Almacén/Tienda abren el panel "Próximamente" con el nombre correcto (SC-005) sin tocar ningún assert ya existente sobre los 7 accesos previos. Gran parte de la verificación perceptual cae en `quickstart.md` (comparación manual contra el mockup), mismo criterio que 013-022.

**Target Platform**: el mismo definido por el proyecto (Unity 6000.3.20f1, URP 2D, móvil Android/iOS); sin restricciones de plataforma adicionales.

**Project Type**: Proyecto único de Unity (`the_battler_test`); no se crea ningún ensamblado nuevo.

**Performance Goals**: sin regresión sobre el objetivo de 60 fps ya fijado — sin desenfoque en tiempo real (mismo criterio que `022` FR-005), sprites ya generados por `022` reutilizados tal cual, sin generación adicional.

**Constraints**: cero cambios a la lógica pública de `PlayerBaseDashboardUIController.cs` más allá de agregar los 4 campos `[SerializeField]` nuevos (botones + panel + controller "Próximamente") siguiendo exactamente el mismo patrón nulo-seguro ya usado por los 7 campos opcionales existentes (spec.md FR-005) — ningún método existente (`Refresh()`, `OpenXPanel()`) cambia su firma ni su comportamiento. Cero cambios a `UIThemeCatalog`/`ThemedGlassPanel`/`ThemedAccentButton`/`ThemedGlowIcon` (se consumen tal cual quedaron en `022`).

**Scale/Scope**: 1 componente de View nuevo y pequeño (`ComingSoonUIController`), 4 campos nuevos `[SerializeField]` + 4 métodos privados de apertura en `PlayerBaseDashboardUIController.cs`, componentes `Themed*` añadidos como hermanos sobre ~9 GameObjects ya existentes en `PlayerBase.unity` (cabecera + 7 botones + 4 botones nuevos), 1 panel nuevo en la escena (`ComingSoonPanel`) — ver data-model.md.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación |
|---|---|
| I. Narrativa Integrada | No aplica — reskin de chrome de UI (Hub), no toca diálogos ni contenido de capítulo/batalla. |
| II. Combate Automático por Despliegue | No aplica — no se toca energía, despliegue ni combate. |
| III. Identidad Visual Animada | No aplica — no se autora ni modifica ningún personaje jugable/enemigo; `Themed*` y `ComingSoonUIController` son chrome de interfaz, no arte de unidad. |
| IV. Progresión por Capítulos con Desbloqueo | No aplica — no se toca desbloqueo de capítulos. |
| V. Balance Dirigido por Datos | Alineación directa: reutiliza `UIThemeCatalog` tal cual (sin duplicar valores de estilo por componente, spec.md FR-001); el nombre de sistema mostrado por `ComingSoonUIController` es texto de UI pasado por parámetro en la escena, no un dato de balance — no requiere ScriptableObject propio. |
| VI. Simplicidad desde el MVP | Cumple sin necesidad de excepción: cero dependencias nuevas (reutiliza DOTween ya justificada en `022`), y `ComingSoonUIController` es deliberadamente el componente más simple posible (un único `TMP_Text`) en vez de 4 paneles a medida — ver Complexity Tracking (vacío, no hay violación que justificar). |

## Post-Design Constitution Re-check

*Tras completar research.md, data-model.md, contracts/ y quickstart.md (Fase 1).*

El diseño no amplió superficie de riesgo: `PlayerBaseDashboardUIController.cs` gana campos opcionales nuevos siguiendo el patrón ya establecido por sus propios 7 campos existentes (mismo autor, mismo criterio), sin tocar ningún método ya cubierto por los tests de integración de `005`/`018`/`019`/`020`. `ComingSoonUIController` no tiene dependencia de ningún otro sistema (ni siquiera de `UIThemeCatalog` directamente — solo consume `Themed*` como hermanos, igual que cualquier otro botón/panel del Hub). Ningún principio requiere excepción; Complexity Tracking permanece vacío.

## Project Structure

### Documentation (this feature)

```text
specs/023-player-base-reskin/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── coming-soon-panel.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
Assets/Scripts/View/Battler/
└── ComingSoonUIController.cs                  # nuevo — panel placeholder genérico: un TMP_Text, un método ShowSystem(string)
# PlayerBaseDashboardUIController.cs — modificado: +4 campos [SerializeField] (botones Gamatoto/
#   Cápsula/Almacén/Tienda + panel + ComingSoonUIController) +4 métodos privados de apertura
#   (mismo patrón que OpenUpgradePanel()/OpenTeamPanel()/etc. ya existentes), sin tocar Refresh()
#   ni ningún miembro público existente.
# UIThemeCatalog.cs / ThemedGlassPanel.cs / ThemedAccentButton.cs / ThemedGlowIcon.cs — SIN CAMBIOS (de 022)

Assets/Editor/Battler/
└── PlayerBaseContentBuilder.cs                 # modificado — añade los componentes Themed*
                                                  # como hermanos sobre la cabecera y los 7 botones
                                                  # ya construidos, crea los 4 GameObjects de botón
                                                  # nuevos (Gamatoto/Cápsula/Almacén/Tienda) y el
                                                  # GameObject ComingSoonPanel, y los cablea a
                                                  # PlayerBaseDashboardUIController — mismo patrón
                                                  # ya usado para construir el resto de PlayerBase.unity

Assets/Scenes/
└── PlayerBase.unity                            # modificado — cabecera y 7 botones existentes ganan
                                                  # componentes Themed* como hermanos; 4 botones nuevos
                                                  # + ComingSoonPanel se agregan a la jerarquía existente

Assets/Tests/EditMode/Battler/
└── ComingSoonUIControllerTests.cs               # nuevo — ShowSystem() actualiza el label, misma
                                                  # instancia reutilizada entre llamadas sucesivas

Assets/Tests/PlayMode/Battler/
└── PlayerBaseFlowPlayModeTests.cs               # extendido — 4 casos nuevos: cada botón
                                                  # Gamatoto/Cápsula/Almacén/Tienda abre
                                                  # ComingSoonPanel con el nombre de sistema correcto,
                                                  # sin tocar ningún assert ya existente sobre los
                                                  # 7 accesos previos (005/018/019/020)
```

**Structure Decision**: Misma capa de asmdefs ya validada (`Core → Model → Gameplay → View`); no se crea ningún ensamblado nuevo. `ComingSoonUIController` es puramente `View` (no depende de `Model`/`Gameplay` — ni siquiera de `UIThemeCatalog` directamente, ese trabajo lo hacen los `Themed*` ya existentes como hermanos sobre el mismo GameObject). Se extiende `PlayerBaseContentBuilder.cs` en vez de editar `PlayerBase.unity` a mano, siguiendo el mismo patrón de "Editor tools construyen contenido de escena" ya usado por las 8 fases previas (`Chapter1ContentBuilder`, `MainMenuContentBuilder`, `EmpireOfCatsContentBuilder`, etc.).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*(vacío — ninguna violación que justificar)*
