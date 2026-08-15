# Implementation Plan: Sistema de Objetos de Batalla

**Branch**: `018-battle-items` | **Date**: 2026-08-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/018-battle-items/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Añade un inventario persistente de "objetos de batalla" (`PlayerProgressSaveData.battleItemInventory`), obtenidos como recompensa de nivel (extensión aditiva de `ChapterDefinition`, mismo patrón que `XpReward`/`TreasureRewardId` de `013`), seleccionables — hasta un límite máximo — desde un controller nuevo (`BattleItemSelectionController`, mismo patrón que `TeamFormationController` de `005`) antes de entrar a una batalla. La selección cruza la frontera de escena vía `BattleLaunchContext` (mismo puente estático que `RequestedArc` de `014`), se descuenta del inventario únicamente al entrar efectivamente a la batalla (`BattleStateManager.SetupChapter()`, FR-006), y aplica uno de tres efectos según su categoría: velocidad de movimiento (`BattleSessionModifiers`, estático nuevo), recurso inicial instantáneo (`BattleResourceController.AddInstantResource`, método nuevo) o un tesoro adicional aleatorio al ganar (`GrantLevelRewards()`, reutilizando el catálogo de tesoros de `014`). Un hallazgo de diseño corregido antes de `/speckit.tasks` (research.md §6): el efecto de "Dinero Extra" debía sobrevivir a `RetryBattle()` igual que "Aceleración de Velocidad" ya lo hacía por construcción — se cachea el monto otorgado (`m_GrantedInstantResourceAmount`) para reaplicarlo tras `ResetResource()`.

## Technical Context

**Language/Version**: C# (Unity 6000.3.20f1 scripting runtime), mismo proyecto que 001-017.

**Primary Dependencies**: Ninguna nueva — únicamente `UnityEngine` ya referenciado por `TheBattler.Core`/`Model`/`Gameplay`.

**Storage**: N/A para esta feature — no introduce persistencia propia más allá de `PlayerProgressSaveData.battleItemInventory`, que reutiliza el mismo `IPlayerProgressStore`/`LocalPlayerProgressStore` (JSON local) ya usado por `005`/`013`/`014`.

**Testing**: Unity Test Framework, mismo split EditMode/PlayMode que 001-017. EditMode para `BattleItemSelectionController` (validación de límites/inventario, clase plana sin dependencias de escena, mismo patrón que `TeamFormationController`) y para los defaults de `ChapterDefinition`/`BattleItemDefinition`. PlayMode para las 3 historias de usuario end-to-end (efecto observable en una batalla real), siguiendo el mismo patrón que `CombatAbilityCatalogBattlePlayModeTests.cs` (016); el roll de "Radar de Tesoro" siembra `UnityEngine.Random.InitState` para reproducibilidad (mismo criterio que `017-multi-hit-critical/research.md` §4).

**Target Platform**: El mismo definido por el proyecto (Unity 6000.3.20f1, URP 2D); sin restricciones de plataforma adicionales.

**Project Type**: Proyecto único de Unity (`the_battler_test`); no se crea ningún ensamblado nuevo.

**Performance Goals**: Sin regresión sobre el objetivo de 60 fps ya fijado en 001-017. El costo nuevo se paga una única vez por `SetupChapter()` (recorrido de `selectedIds`, como mucho `c_MaxSelectableItems` elementos) — ninguna asignación nueva por frame/ataque.

**Constraints**: El descuento de inventario es atómico por batalla (FR-006/FR-007) — nunca parcial (o se valida y se descuenta todo lo seleccionado, o la selección se rechaza antes de llegar a `SetupChapter()`). Los niveles y saves ya existentes de `001`-`017` deben seguir funcionando sin cambios si no declaran ninguna recompensa/selección de objeto de batalla (FR-011).

**Scale/Scope**: 1 enum nuevo (`BattleItemCategory`, 3 valores), 3 tipos nuevos en `Model` (`BattleItemDefinition`, `BattleItemCatalog`, `BattleItemStack`), 1 campo nuevo en `PlayerProgressSaveData`, 2 campos nuevos en `ChapterDefinition`, 1 campo nuevo en `BattleLaunchContext`, 1 clase estática nueva (`BattleSessionModifiers`), 1 controller nuevo (`BattleItemSelectionController`), extensiones acotadas a `BattleStateManager` (`SetupChapter`/`GrantLevelRewards`/`RetryBattle`) y a `BattleResourceController` (`AddInstantResource`) y `UnitRuntime.Move()` (lectura del multiplicador). No se autora contenido de nivel nuevo — se extienden `ChapterDefinition`/catálogos ya existentes, sin reautorado obligatorio de niveles previos.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación |
|---|---|
| I. Narrativa Integrada | N/A — esta feature no toca diálogo pre/post-batalla ni contenido narrativo; solo inventario, selección pre-batalla y efectos de combate/recurso/recompensa. Sin conflicto. |
| II. Combate Automático por Despliegue | Alineación directa: los efectos de "Aceleración de Velocidad"/"Dinero Extra" se resuelven antes del combate (`SetupChapter()`) y se leen pasivamente durante el ciclo autónomo ya existente (`UnitRuntime.Move()`), sin introducir control directo del jugador durante la batalla. La selección de objetos ocurre íntegramente en la fase de preparación pre-batalla, no durante el combate. |
| III. Identidad Visual Animada | N/A — no añade animaciones ni variantes visuales nuevas; los objetos de batalla no son unidades. |
| IV. Progresión por Capítulos con Desbloqueo | N/A — no toca el sistema de desbloqueo entre capítulos; los objetos se obtienen por recompensa de nivel ya jugado, no alteran el orden de desbloqueo. |
| V. Balance Dirigido por Datos | Fuerte alineación: `BattleItemDefinition`/`BattleItemCatalog`/la recompensa de `ChapterDefinition` son ScriptableObjects/campos `[SerializeField]`, editables en el Inspector sin recompilar — mismo patrón que el resto del proyecto. |
| VI. Simplicidad desde el MVP | Alineación directa: 3 categorías con un mecanismo de aplicación cada una, sin sistema de efectos genérico (research.md §4, alternativa Strategy evaluada y rechazada); "Radar de Tesoro" reutiliza el catálogo de tesoros ya existente en vez de introducir un segundo sistema de recompensas. Ningún objeto depende de gacha ni moneda premium (FR-012). Sin necesidad de Complexity Tracking. |

## Post-Design Constitution Re-check

*Tras completar research.md, data-model.md, contracts/ y quickstart.md (Fase 1).*

El diseño final no amplió la superficie descrita en Technical Context. Un hallazgo de diseño se corrigió durante la Fase 1 (research.md §6, antes de `/speckit.tasks`): el efecto de "Dinero Extra" debía sobrevivir a `RetryBattle()` con el mismo criterio que "Aceleración de Velocidad" ya lo hacía por construcción (ninguno de los dos objetos se reembolsa ni se vuelve a cobrar en un reintento de la misma entrada a la batalla, FR-013) — la corrección (`m_GrantedInstantResourceAmount` cacheado, reaplicado tras `ResetResource()`) no introduce ningún concepto nuevo, solo extiende el mismo patrón que `m_DesignRegenPerSecond` ya usa en `BattleResourceController`. El Constitution Check original se mantiene sin cambios: ningún principio requiere una excepción documentada.

## Project Structure

### Documentation (this feature)

```text
specs/018-battle-items/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
│   ├── battle-item-selection.md
│   └── battle-item-effects.md
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
Assets/Scripts/
├── Core/Battler/
│   └── BattleItemCategory.cs                # nuevo — enum SpeedBoost/ExtraResource/BonusTreasure
├── Model/Battler/
│   ├── BattleItemDefinition.cs              # nuevo — ScriptableObject
│   ├── BattleItemCatalog.cs                 # nuevo — ScriptableObject (lista + TryGetItem)
│   ├── BattleItemStack.cs                   # nuevo — [Serializable] plano (itemId, count)
│   ├── PlayerProgressSaveData.cs            # modificado — + battleItemInventory: BattleItemStack[]
│   └── ChapterDefinition.cs                 # modificado — + m_BattleItemReward, m_BattleItemRewardCount
└── Gameplay/Battler/
    ├── BattleLaunchContext.cs               # modificado — + SelectedBattleItemIds: string[]
    ├── BattleSessionModifiers.cs            # nuevo — estático, MoveSpeedMultiplier
    ├── BattleItemSelectionController.cs     # nuevo — clase plana, mismo patrón que TeamFormationController
    ├── BattleResourceController.cs          # modificado — + AddInstantResource(float)
    ├── UnitRuntime.cs                       # modificado — Move() multiplica c_MoveSpeed por BattleSessionModifiers.MoveSpeedMultiplier
    └── BattleStateManager.cs                # modificado — + m_BattleItemCatalog (opcional); SetupChapter() consume BattleLaunchContext.SelectedBattleItemIds; GrantLevelRewards() otorga BattleItemReward y resuelve "Radar de Tesoro"; RetryBattle() reaplica m_GrantedInstantResourceAmount

Assets/Scripts/View/Battler/
├── BattleItemSelectionRowView.cs            # nuevo — componente View, mismo patrón que TeamFormationRowView (005): Initialize(BattleItemDefinition, count actual, isSelected, callback de selección/deselección) — sin BattleItemSelectionController como parámetro (a diferencia del borrador original de este plan): la fila no lo necesita, la selección pendiente de varias filas se agrega en BattleItemSelectionUIController y se confirma con una única llamada a TryConfirmSelection, mismo motivo (Principio VI) por el que contracts/battle-item-selection.md ya evita pasarle BattleItemCatalog al controller.
└── BattleItemSelectionUIController.cs       # nuevo — no anticipado en el borrador original de este plan: agregador de la selección pendiente entre filas (HashSet<string> en memoria) + botón Confirmar, mismo patrón que TeamFormationUIController (005) — necesario para que BattleItemSelectionRowView tenga a quién notificar sus toggles sin conocer al controller directamente.

Assets/Editor/Battler/
└── PlayerBaseContentBuilder.cs               # modificado — crea el BattleItemCatalog de ejemplo (3 objetos mínimos de FR-002) bajo Assets/ScriptableObjects/Battler/BattleItems/, añade el panel + template de BattleItemSelectionRowView/BattleItemSelectionUIController a la escena PlayerBase.unity (con su propio botón de navegación en el dashboard, mismo patrón que Mejorar Unidades/Organizar Equipo) y cablea PlayerBaseFlowController.BattleItemCatalog, mismo patrón que el resto de templates ya construidos por este builder (005)

Assets/Tests/
├── EditMode/Battler/
│   ├── BattleItemSelectionControllerTests.cs    # nuevo — límite máximo, inventario insuficiente, selección vacía válida (FR-004/FR-007)
│   └── ChapterDefinitionBattleItemRewardDefaultsTests.cs   # nuevo — defaults null/0 para ChapterDefinition ya serializada (FR-011)
└── PlayMode/Battler/
    └── BattleItemEffectsBattlePlayModeTests.cs      # nuevo — US1-US3 end-to-end: selección + descuento, efecto de velocidad/recurso desde el inicio, tesoro adicional al ganar (con seed fijo), persistencia de efectos a través de RetryBattle() (FR-013)
```

**Structure Decision**: Misma capa de asmdefs ya validada (`TheBattler.Core` → `TheBattler.Model` → `TheBattler.Gameplay` → `TheBattler.View`); no se crea ningún ensamblado nuevo. `BattleItemCategory` va en `Core` junto a `AttackType`/`ClassificationType`/`AbilityEffectType` — mismo motivo (tipo de dato puro consultado desde `Model`/`Gameplay`). `BattleItemDefinition`/`BattleItemCatalog`/`BattleItemStack` van en `Model` junto a `TreasureSetDefinition`/`TreasureSetCatalog`, mismo patrón. `BattleItemSelectionController`/`BattleSessionModifiers` van en `Gameplay`, junto a `TeamFormationController`/`LaneRegistry` respectivamente. `BattleItemSelectionRowView` va en `View`, mismo patrón que `TeamFormationRowView` (005) — la fila de UI llama a `BattleItemSelectionController.TryConfirmSelection` (que a su vez fija `BattleLaunchContext.SelectedBattleItemIds`), cerrando el puente entre la pantalla de preparación y la escena de batalla íntegramente dentro del código de esta feature, sin dejar ningún cableado "fuera de alcance de código" (a diferencia de `RequestedArc` en `014`, donde la pantalla de selección de nivel ya existía de una feature previa y solo se le añadía una asignación).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Sin violaciones — el Constitution Check no encontró ningún ítem que requiera justificación (ver Principio VI arriba). No se rellena esta tabla.
