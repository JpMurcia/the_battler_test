# Implementation Plan: Integración de Arte Real Importado

**Branch**: `012-real-asset-integration` | **Date**: 2026-07-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/012-real-asset-integration/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Las 5 pantallas del juego (`MainMenu`, `AdventureMap`, `PlayerBase`, `Chapter1_Battle`, `Chapter2_Battle`) se generan hoy con arte 100% procedural (`CreateSquareSprite`: rectángulos de un solo color; `CreateScaleClip`: un pulso de escala sobre ese mismo cuadrado, sin cambiar de sprite) — verificado directamente contra el código de los 5 content builders (research.md §1). Esta feature reemplaza ese arte placeholder por los 8 packs ya importados y catalogados en `011-imported-asset-audit`, siguiendo su recomendación por pantalla, sin introducir ningún sistema nuevo: el runtime de combate (`UnitRuntime`) ya es 100% data-driven (lee un `RuntimeAnimatorController`/prefab genérico desde `UnitDefinition`), así que el cambio real es de **tooling de Editor** (qué generan los 5 `*ContentBuilder.cs`) y de **datos** (qué asset queda referenciado), más 4 campos nuevos de presentación (`UnitDefinition.Portrait`, y un `Image` nuevo en `ChapterBannerItemView`/`UnitUpgradeRowView`/`TeamFormationRowView`) porque esas tres vistas nunca tuvieron dónde pintar un sprite (research.md §2). Se centraliza la lógica nueva de carga de sprites y horneado de animación por frames en una única clase de Editor (`BattlerArtLibrary`) para no triplicarla entre `Chapter1ContentBuilder`/`Chapter2ContentBuilder`/`PlayerBaseContentBuilder` (research.md §6). El mapeo unidad→sprite es determinista por índice (contracts/unit-visual-identity-mapping.md), no un campo nuevo de autoría. Fuera de alcance: moneda/gacha (Principio VI), VFX de `Dragon Warrior Files/Effects`, y el fondo de la escena de batalla en sí (solo se piden fondos de banner de mapa).

## Technical Context

**Language/Version**: C# (Unity 6000.3.20f1 scripting runtime), mismo proyecto que el resto de specs.

**Primary Dependencies**: Ninguna nueva. Reutiliza `AssetDatabase`, `AnimationUtility`, `UnityEditor.Animations.AnimatorController` (ya usados hoy por los content builders) y los componentes runtime ya existentes (`Image`, `SpriteRenderer`, `Animator`) — no se añade ningún paquete de Unity.

**Storage**: N/A (sin cambios de guardado — `progress.json`/`IChapterProgressStore` no se tocan).

**Testing**: Unity Test Framework, mismo split que el resto del proyecto — EditMode para `UnitDefinition.Portrait` y estabilidad del mapeo unidad→sprite (nuevo); PlayMode existente (`AdventureMapFlowPlayModeTests`, `Chapter2BattleLoopPlayModeTests`, etc.) no debe requerir cambios en sus aserciones (research.md §7).

**Target Platform**: El mismo del proyecto (Unity 6000.3.20f1, URP 2D); sin restricciones adicionales.

**Project Type**: Proyecto único de Unity (`the_battler_test`); no se crea ningún ensamblado nuevo. El único archivo nuevo fuera de una capa de asmdef de juego es `BattlerArtLibrary.cs`, que vive en `Assets/Editor/Battler/` (ya fuera de los asmdefs `Core/Model/Gameplay/View`, mismo lugar que los `*ContentBuilder.cs` existentes).

**Performance Goals**: Sin cambio respecto al proyecto — esta feature no toca el bucle de combate; reemplazar un `SpriteRenderer` de un color por uno con sprite real y una animación por frames en vez de un tween de escala no cambia el orden de magnitud de trabajo por frame (mismo componente, mismo patrón `Animator` + `RuntimeAnimatorController` ya validado con hasta ~10 unidades simultáneas).

**Constraints**:
- Ningún cambio al núcleo de combate (`BattleStateManager`, `UnitDeploymentController`, `EnemyWaveSpawner`, `UnitRuntime`) — son 100% agnósticos del contenido visual (research.md §1).
- Los 3 campos nuevos de vista (`ChapterBannerItemView`, `UnitUpgradeRowView`, `TeamFormationRowView`) deben ser aditivos: mismos métodos públicos, mismas firmas, solo una línea nueva con guarda de nulo en `Initialize()` — no deben requerir tocar ningún caller existente de esas clases.
- `UnitDefinition.m_Portrait` es un campo nuevo sin `FormerlySerializedAs`, con `null` como valor por defecto seguro (no participa de `HasValidVisualIdentity`).
- No se introduce moneda, gacha, ni VFX de `Dragon Warrior Files/Effects` (fuera de alcance explícito, FR-008/FR-010 de spec.md).
- No se mezclan `Hyper_Casual_UI` (ilustrado) y `Assets/Assets/UI Elements` (plano) dentro de la misma pantalla (Edge Case de spec.md, ya resuelto por `asset-catalog.md`).

**Scale/Scope**: 5 content builders modificados, 1 clase de Editor nueva (`BattlerArtLibrary`), 1 campo nuevo en `UnitDefinition`, 3 campos nuevos de vista (uno por clase ya existente), 2 assets de banner poblados (`m_BannerArt`), 7 unidades de jugador + 2 de enemigo con sprite real asignado — mismo orden de magnitud que una fase de contenido normal del roadmap (Principio VI).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación | Estado |
|---|---|---|
| I. Narrativa Integrada | Sin impacto — esta feature no toca diálogo ni narrativa, solo presentación visual de pantallas y unidades ya existentes. | N/A |
| II. Combate Automático por Despliegue | Sin impacto en el núcleo — `BattleStateManager`/`UnitDeploymentController`/`UnitRuntime` no cambian de comportamiento, solo el contenido visual que ya consumían de forma genérica (research.md §1). | PASS |
| III. Identidad Visual Animada | Refuerza directamente este principio: hoy ninguna unidad tiene animación de frames real (solo un tween de escala sobre un color, research.md §1) — esta feature es la primera vez que idle/ataque son animaciones de sprite reales, y añade una variante visual adicional real (ícono de acento) en vez del cuadrado desplazado actual (contracts/unit-visual-identity-mapping.md). `HasValidVisualIdentity` sigue siendo la misma regla, ahora satisfecha con contenido real en vez de placeholder. | PASS |
| IV. Progresión por Capítulos con Desbloqueo | Sin impacto en la lógica de desbloqueo — solo se puebla `BannerArt` de banners que `004` ya desbloquea/bloquea según progreso; no se crea contenido de capítulos 3/4 (siguen "por definir"). | PASS |
| V. Balance Dirigido por Datos | Refuerza este principio: `Portrait`, `BannerArt` y las animaciones por frame quedan como referencias a asset en ScriptableObjects/prefabs existentes, nunca hardcodeadas en código de comportamiento; `BattlerArtLibrary` es una utilidad de build-time sin estado de balance. | PASS |
| VI. Simplicidad desde el MVP | Fuerte alineación: no se introduce ningún sistema nuevo (moneda/gacha explícitamente excluidos, FR-008), no se toca el fondo de la escena de batalla (fuera de alcance explícito del usuario), la única abstracción nueva (`BattlerArtLibrary`) está justificada por duplicación ya real entre 3 builders (research.md §6), no especulativa. | PASS |

No hay violaciones que justificar; la sección **Complexity Tracking** queda vacía.

## Project Structure

### Documentation (this feature)

```text
specs/012-real-asset-integration/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
│   ├── screen-asset-wiring.md
│   └── unit-visual-identity-mapping.md
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
Assets/
├── Editor/Battler/
│   ├── BattlerArtLibrary.cs                # NUEVO — carga de sprites reales + horneado de AnimationClip por frames (research.md §6)
│   ├── Chapter1ContentBuilder.cs           # MODIFICADO — usa BattlerArtLibrary en vez de CreateSquareSprite/CreateScaleClip
│   ├── Chapter2ContentBuilder.cs           # MODIFICADO — idem
│   ├── MainMenuContentBuilder.cs           # MODIFICADO — fondo/botones reales de Hyper_Casual_UI
│   ├── AdventureMapContentBuilder.cs       # MODIFICADO — panel/botones reales, cablea BannerArt en el item template
│   └── PlayerBaseContentBuilder.cs         # MODIFICADO — paneles reales, cablea Portrait en filas de plantel/formación
│
├── Scripts/
│   ├── Model/Battler/
│   │   └── UnitDefinition.cs               # MODIFICADO — + campo m_Portrait (Sprite) y getter Portrait
│   └── View/Battler/
│       ├── ChapterBannerItemView.cs        # MODIFICADO — + campo m_BackgroundImage (Image)
│       ├── UnitUpgradeRowView.cs           # MODIFICADO — + campo m_PortraitImage (Image)
│       └── TeamFormationRowView.cs         # MODIFICADO — + campo m_PortraitImage (Image)
│
├── Data/Battler/Banners/
│   ├── Banner_Chapter1.asset               # MODIFICADO (datos) — m_BannerArt asignado
│   └── Banner_HaciaElFuturo.asset          # MODIFICADO (datos) — m_BannerArt asignado
│
└── ScriptableObjects/Battler/{Chapter1,Chapter2}/PlaceholderArt/
                                             # Contenido generado por los builders migra a usar
                                             # sprites/clips reales en su lugar; la carpeta puede
                                             # renombrarse o vaciarse según decida tasks.md
                                             # (no es una carpeta de arte final "canónica" del proyecto,
                                             # solo el output del builder).

Assets/Tests/EditMode/Battler/
└── UnitDefinitionPortraitTests.cs          # NUEVO — Portrait se expone correctamente; mapeo unidad→sprite estable entre 2 corridas del builder (research.md §7)
```

**Ningún archivo bajo `Assets/Scripts/Gameplay/` cambia** — `UnitRuntime`, `BattleStateManager`, `UnitDeploymentController`, `EnemyWaveSpawner` quedan intactos (research.md §1).

**Structure Decision**: Se añade una única clase de utilidad de Editor (`BattlerArtLibrary.cs`) en el mismo directorio que los `*ContentBuilder.cs` que reemplazará el placeholder de código, evitando triplicar la lógica de carga/horneado de sprites (research.md §6, único caso de duplicación real ya presente). Los 4 campos nuevos (`UnitDefinition.Portrait` + 3 `Image` de vista) son estrictamente aditivos sobre clases ya existentes, sin nuevas clases de dominio ni ScriptableObject nuevo — mantiene el patrón "un capítulo/pantalla = datos + contenido, no arquitectura nueva" que ya establecieron `009`/`010`.

## Complexity Tracking

*Sin violaciones de la Constitution Check — sección no aplica.*

## Post-Design Constitution Re-check

Tras completar Phase 0 ([research.md](./research.md)) y Phase 1 ([data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)):

- Se confirmó contra el código real que `UnitRuntime`/`BattleStateManager`/`UnitDeploymentController`/`EnemyWaveSpawner` no requieren ningún cambio — el diseño de "solo tooling + datos + 4 campos de presentación aditivos" queda validado, no solo asumido (research.md §1-2).
- La única abstracción nueva (`BattlerArtLibrary`) se justificó por duplicación de código ya real (3 builders con la misma función `CreateSquareSprite`/`CreateScaleClip` copiada) — no se introdujo ninguna capa especulativa adicional.
- El mapeo unidad→sprite (contracts/unit-visual-identity-mapping.md) es 100% determinista por índice posicional existente, sin requerir ningún campo de autoría nuevo en `UnitDefinition` más allá de `Portrait` — mantiene el modelo de datos lo más chico posible (Principio VI).
- Los 3 campos de vista nuevos siguen el patrón ya validado por `DialoguePlaybackController.m_PortraitImage` (research.md §2) — no se inventó un patrón nuevo de UI.
- El alcance sigue excluyendo moneda/gacha/VFX de Dragon Warrior y el fondo de la escena de batalla — ningún hallazgo de Phase 0/1 amplió el alcance original de spec.md.

No se detectan violaciones nuevas introducidas por el diseño. **Constitution Check: PASS.**
