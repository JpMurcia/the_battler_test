# Implementation Plan: Sistema de Rango de Usuario

**Branch**: `020-user-rank` | **Date**: 2026-08-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/020-user-rank/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Expone el "Rango de Usuario" reutilizando exactamente el cálculo ya existente de `005-player-dashboard` (`PlayerCharacterLevelCalculator.Calculate`, confirmado contra el código antes de diseñar — research.md §1), sin ningún contador ni campo de guardado nuevo para el valor en sí. El trabajo real de esta feature es una capa nueva de umbrales configurables (`UserRankRewardCatalog`/`UserRankThreshold`) con recompensas de objetos de batalla (`018-battle-items`) reclamables manualmente por el jugador vía `UserRankController.TryClaim`, instanciado por `PlayerBaseFlowController` (mismo patrón que `TeamFormationController`/`UnitLevelingController`/`UnitEvolutionController`). El registro de qué umbrales ya se reclamaron (`PlayerProgressSaveData.claimedThresholdIds`) es monótono, mismo criterio que `grantedTreasureSetIds` (014).

## Technical Context

**Language/Version**: C# (Unity 6000.3.20f1 scripting runtime), mismo proyecto que 001-019.

**Primary Dependencies**: Ninguna nueva — únicamente `UnityEngine` ya referenciado por `TheBattler.Core`/`Model`/`Gameplay`/`View`.

**Storage**: N/A para esta feature salvo `PlayerProgressSaveData.claimedThresholdIds` (nuevo, aditivo), que reutiliza el mismo `IPlayerProgressStore`/`LocalPlayerProgressStore` (JSON local) ya usado por `005`/`013`/`014`/`018`/`019`.

**Testing**: Unity Test Framework, mismo split EditMode/PlayMode que 001-019. EditMode para `UserRankController` (clase plana sin dependencias de escena, mismo patrón que `TeamFormationControllerTests`/`BattleItemSelectionControllerTests`, 018): cálculo de `CurrentRank` delegado, `TryClaim` con umbral no alcanzado/ya reclamado/id desconocido, reclamo válido otorgando la recompensa exacta. PlayMode opcional (esta feature no introduce ningún comportamiento nuevo dentro de una batalla, a diferencia de `018`/`019` — todo su ciclo ocurre en la Base del Jugador).

**Target Platform**: El mismo definido por el proyecto (Unity 6000.3.20f1, URP 2D); sin restricciones de plataforma adicionales.

**Project Type**: Proyecto único de Unity (`the_battler_test`); no se crea ningún ensamblado nuevo.

**Performance Goals**: Sin regresión sobre el objetivo de 60 fps ya fijado en 001-019 — esta feature no toca ningún código de combate; su costo se paga únicamente al abrir la Base del Jugador o al reclamar un umbral (operaciones no ligadas a frame-rate).

**Constraints**: `TryClaim` es atómico (FR-005/FR-006) — o se valida y se otorga la recompensa completa, o no se modifica nada. `claimedThresholdIds` es monótono (FR-007) — ninguna operación de esta feature elimina una entrada ya presente.

**Scale/Scope**: 1 tipo `[Serializable]` nuevo (`UserRankThreshold`), 1 ScriptableObject nuevo (`UserRankRewardCatalog`), 1 campo nuevo en `PlayerProgressSaveData`, 1 controller nuevo (`UserRankController`, Gameplay), 1 campo/propiedad nuevos en `PlayerBaseFlowController`. No se autora contenido de nivel/unidad nuevo — los umbrales referencian `BattleItemDefinition` ya existentes de `018`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación |
|---|---|
| I. Narrativa Integrada | N/A — esta feature no toca diálogo pre/post-batalla ni contenido narrativo. |
| II. Combate Automático por Despliegue | N/A — no toca el bucle de despliegue/combate; ocurre enteramente en la Base del Jugador, fuera de batalla. |
| III. Identidad Visual Animada | N/A — no añade unidades ni animaciones nuevas. |
| IV. Progresión por Capítulos con Desbloqueo | N/A — no toca el sistema de desbloqueo entre capítulos; el Rango de Usuario es un valor de cuenta, no de capítulo. |
| V. Balance Dirigido por Datos | Alineación directa: `UserRankRewardCatalog`/`UserRankThreshold` son datos `[SerializeField]` editables en el Inspector sin recompilar, mismo patrón que el resto del proyecto. |
| VI. Simplicidad desde el MVP | Alineación directa: reutiliza `PlayerCharacterLevelCalculator` sin duplicarlo (research.md §1); reutiliza `BattleItemStack`/la regla de fusión de inventario de `018` sin generalizar a un helper compartido para solo 2 consumidores (research.md §4, mismo criterio que `016` aplicó a una decisión equivalente). Sin necesidad de Complexity Tracking. |

## Post-Design Constitution Re-check

*Tras completar research.md, data-model.md, contracts/ y quickstart.md (Fase 1).*

El diseño final no amplió la superficie descrita en Technical Context. El hallazgo más importante de esta feature se confirmó y se mantuvo sin desviaciones: el Rango de Usuario nunca duplica el cálculo de `PlayerCharacterLevelCalculator` (research.md §1) — `UserRankController.CurrentRank` es una simple delegación. La única escritura nueva de progreso (`TryClaim`) es atómica y monótona, sin ningún camino que dañe `claimedThresholdIds` ya persistido. El Constitution Check original se mantiene sin cambios: ningún principio requiere una excepción documentada.

## Project Structure

### Documentation (this feature)

```text
specs/020-user-rank/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
│   └── user-rank-claim.md
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
Assets/Scripts/
├── Model/Battler/
│   ├── UserRankThreshold.cs                 # nuevo — [Serializable] plano (ThresholdId, RequiredRank, Reward, RewardCount)
│   ├── UserRankRewardCatalog.cs              # nuevo — ScriptableObject (UserRankThreshold[])
│   └── PlayerProgressSaveData.cs             # modificado — + claimedThresholdIds: string[]
└── Gameplay/Battler/
    ├── UserRankController.cs                 # nuevo — clase plana: CurrentRank (delega en PlayerCharacterLevelCalculator), Thresholds, TryClaim
    └── PlayerBaseFlowController.cs           # modificado — + m_UserRankCatalog (opcional), + propiedad UserRank instanciada en Awake()

Assets/Scripts/View/Battler/
└── UserRankUIController.cs                   # nuevo — pantalla de solo lectura + botón de reclamo por umbral, mismo patrón que TeamFormationUIController

Assets/Editor/Battler/
└── PlayerBaseContentBuilder.cs                # modificado — crea un UserRankRewardCatalog de ejemplo con umbrales iniciales, añade el template de UserRankUIController a PlayerBase.unity y lo cablea

Assets/Tests/
└── EditMode/Battler/
    └── UserRankControllerTests.cs             # nuevo — CurrentRank delega correctamente; TryClaim: umbral no alcanzado, ya reclamado, id desconocido, reclamo válido (otorga la recompensa exacta y persiste); Thresholds refleja Reached/Claimed correctos; catálogo null ⇒ sin umbrales, sin error (FR-010)
```

**Structure Decision**: Misma capa de asmdefs ya validada (`TheBattler.Core` → `TheBattler.Model` → `TheBattler.Gameplay` → `TheBattler.View`); no se crea ningún ensamblado nuevo. `UserRankThreshold`/`UserRankRewardCatalog` van en `Model`, mismo patrón que `TreasureSetDefinition`/`TreasureSetCatalog`. `UserRankController` va en `Gameplay` porque depende de `PlayerCharacterLevelCalculator` (clase `Gameplay`, research.md §1) — no puede vivir en `Model` sin invertir la dependencia de capas ya establecida. `UserRankUIController` va en `View`, mismo patrón que el resto de pantallas de la Base del Jugador.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Sin violaciones — el Constitution Check no encontró ningún ítem que requiera justificación (ver Principio VI arriba). No se rellena esta tabla.
