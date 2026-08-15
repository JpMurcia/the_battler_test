# Implementation Plan: Escalado Avanzado por Capítulo y Sets de Tesoros

**Branch**: `014-chapter-scaling-treasure-sets` | **Date**: 2026-07-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/014-chapter-scaling-treasure-sets/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Esta feature extiende spec 013 ("Imperio de los Gatos", cuya implementación ya está prácticamente completa — 65/66 tareas de `013-empire-of-cats-saga/tasks.md`, solo pendiente `T063` de validación manual de quickstart) con cuatro capacidades verificadas contra el código real de spec 013: (1) escalar `ChapterDefinition.EnemyBaseMaxHealth` (campo ya existente hoy) con el mismo `EnemyStrengthMultiplier` que spec 013 ya aplica a unidades enemigas, en el mismo punto de `BattleStateManager.SetupChapter()` (research.md §1); (2) descubrir, tras verificar `MissionEnergyController`/`ChapterBannerDefinition` reales, que el costo de energía por capítulo **ya está resuelto** por el campo plano `ChapterBannerDefinition.EnergyCost` existente — el gap real es que la escena de batalla no sabe qué `SagaArcDefinition` corresponde al banner elegido, así que se añade `BattleLaunchContext.RequestedArc` (nuevo campo sobre el puente estático que spec 013 ya introduce para Brote Zombi) para resolverlo dinámicamente (research.md §2); (3) un campo nuevo `ChapterDefinition.LevelWidth` que reemplaza el `LanePosition` de base enemiga hoy hardcodeado por override de escena (verificado: ambos prefabs de base tienen `LanePosition: 0` de fábrica) por un valor data-driven (research.md §3); (4) un sistema nuevo de `TreasureSetDefinition`/`TreasureSetCatalog` con bonificación pasiva permanente sobre `BattleResourceController.RegenPerSecond`, que requiere añadir la persistencia de tesoros obtenidos que **spec 013 deliberadamente omite** (su propio research.md §7: "recompensa transitoria, sin inventario persistido") — esta feature la añade sin modificar el diseño de spec 013, de forma aditiva sobre `PlayerProgressSaveData` (research.md §4-5). Ningún dato base compartido entre capítulos (`UnitDefinition`, `EnemyWaveDefinition`) se modifica; todo escalado ocurre en el punto de consumo, mismo criterio que spec 013.

## Technical Context

**Language/Version**: C# (Unity 6000.3.20f1 scripting runtime), mismo proyecto que `001`-`013`.

**Primary Dependencies**: Ninguna nueva de terceros. Reutiliza infraestructura real existente (`ChapterDefinition`, `BattleStateManager`, `BattleResourceController`, `LaneRegistry`, `MissionEnergyController`, `ChapterBannerDefinition`, `PlayerProgressSaveData`/`IPlayerProgressStore`) y, allí donde spec 013 todavía no está implementada, construye directamente sobre su diseño planeado (`SagaArcDefinition`, `BattleLaunchContext`, `ChapterDefinition.TreasureRewardId`/`HealthThresholdWaveTriggers`/`MaxSimultaneousEnemies`, `UnitCombatProfile.Scaled`) — **esta feature no es implementable de forma aislada sin que spec 013 se implemente primero** (ver Constraints). No se añade ningún paquete de Unity.

**Storage**: Ninguna nueva. Se extiende `PlayerProgressSaveData` (vía `IPlayerProgressStore`, spec 005, ya extendido por spec 013 con `unlockedBonusUnitIds`) con dos campos aditivos: `obtainedTreasureIds: string[]` y `grantedTreasureSetIds: string[]` (sin bump de `formatVersion`, mismo criterio que spec 013 research.md §8). Los datos de diseño nuevos (`TreasureSetDefinition`, `TreasureSetCatalog`) viven en assets `.asset` bajo `Assets/ScriptableObjects/Battler/EmpireOfCats/`, junto a los assets que spec 013 ya planea ahí.

**Testing**: Unity Test Framework, mismo split que `001`/`013` — EditMode (NUnit puro, dobles vía `ScriptableObject.CreateInstance<T>()`) para `TreasureSetDefinition.IsValid`, `TreasureSetProgressEvaluator`; PlayMode para la resolución de `BattleLaunchContext.RequestedArc` en `SetupChapter()`, el posicionamiento de base enemiga vía `LevelWidth`, el escalado de `EnemyBaseMaxHealth`, y el flujo completo de tesoro→set→bono en `BattleStateManager.SetOutcome`, todo con dobles en memoria (ver quickstart.md).

**Target Platform**: El mismo definido por el proyecto (Unity 6000.3.20f1, URP 2D); sin restricciones de plataforma adicionales.

**Project Type**: Proyecto único de Unity (`the_battler_test`); se extiende la capa de asmdefs ya validada (`TheBattler.Core` → `TheBattler.Model` → `TheBattler.Gameplay` → `TheBattler.View`), sin ensamblados nuevos.

**Performance Goals**: Mismo objetivo que `001`/`013` — 60 fps estables con hasta ~10 unidades simultáneas en el carril. Ningún cambio de esta feature toca el camino caliente por frame de combate: el escalado de vida de base y el cálculo de `LevelWidth` ocurren una vez en `SetupChapter()` (no por frame); la evaluación de sets de tesoros ocurre una vez por victoria en `SetOutcome()` (no por frame).

**Constraints**:
- **Dependencia dura de spec 013**: esta feature modifica métodos (`BattleStateManager.SetupChapter()`, `SetOutcome()`) y tipos (`ChapterDefinition`, `PlayerProgressSaveData`, `BattleLaunchContext`) que spec 013 introduce o modifica primero. `/speckit-tasks` de esta feature DEBE ordenarse después de (o integrarse con) la implementación de spec 013 — no es una feature paralela independiente.
- **Divergencia de diseño respecto al Key Entity "Costo de Energía por Capítulo" de spec.md**: verificado contra `MissionEnergyController.cs`/`ChapterBannerDefinition.cs` reales, ese Key Entity se reinterpreta como "un banner por aparición de nivel en un capítulo" (ya soportado hoy por `ChapterBannerDefinition.EnergyCost`, campo existente) en vez de una tabla nueva sobre `ChapterDefinition` — ver research.md §2 para la justificación completa (Principio VI, evitar una segunda fuente de verdad para el mismo costo). FR-002/FR-003 de spec.md se satisfacen igualmente por este diseño.
- **Migración de datos requerida, no solo código nuevo**: `Chapter1.asset`/`Chapter2.asset` (ya autorados, spec 001/010) deben recibir un `LevelWidth` migrado desde el override de escena real de `Chapter1_Battle.unity`/`Chapter2_Battle.unity` para preservar el comportamiento observable actual — ver Nota de Migración en contracts/base-health-width-and-arc-resolution.md. Sin esta migración, ambas escenas existentes regresionarían (base enemiga en `LanePosition` incorrecta).
- **Orden de inicialización a decidir en `/speckit-tasks`**: `BattleResourceController.ApplyPassiveRegenBonus` debe aplicarse antes de que spec 013 capture `m_DesignRegenPerSecond` en `Awake()` — ver contracts/treasure-sets-and-passive-bonus.md para las dos alternativas evaluadas (se prefiere un `Initialize` explícito sobre depender de Script Execution Order).
- **Sin gacha ni economía de rareza**: igual que spec 013, ningún sistema de esta feature implementa obtención aleatoria, tasas, o moneda premium.
- Igual que `001`-`013`: toda la lógica funciona sin conexión a red; el guardado es local (`002`).

**Scale/Scope**: 1 campo nuevo en `ChapterDefinition` (`LevelWidth`), 1 campo nuevo en `BattleLaunchContext` (`RequestedArc`), 2 campos nuevos en `PlayerProgressSaveData` (`obtainedTreasureIds`, `grantedTreasureSetIds`), 2 `ScriptableObject` nuevos (`TreasureSetDefinition`, `TreasureSetCatalog`), 1 función pura nueva (`TreasureSetProgressEvaluator`), 1 método nuevo en `BattleResourceController` (`ApplyPassiveRegenBonus`), cambios de comportamiento en 2 métodos existentes (`BattleStateManager.SetupChapter()`/`SetOutcome()`) — orden de magnitud comparable a una sola historia de spec 013 (p. ej. `006`/`007`), no una reescritura.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación | Estado |
|---|---|---|
| I. Narrativa Integrada | Sin impacto — esta feature no añade ni modifica diálogos pre/post-batalla; reutiliza el mecanismo ya existente sin tocarlo. | PASS |
| II. Combate Automático por Despliegue | El núcleo no cambia. `ApplyPassiveRegenBonus` es un modificador adicional sobre `RegenPerSecond` (ya "mejorable durante la partida" según el principio, y ahora también antes de que empiece vía bonificación de cuenta) — no introduce control directo del jugador ni cambia el bucle de despliegue/autonomía. | PASS |
| III. Identidad Visual Animada | Sin impacto — esta feature no introduce ninguna unidad jugable nueva; los sets de tesoros y el escalado de vida de base no tienen representación visual de personaje. | PASS |
| IV. Progresión por Capítulos con Desbloqueo | Refuerza directamente este principio: el escalado de vida de base y la resolución de arco activo son parte de "capítulos/etapas secuenciales" con dificultad creciente; los sets de tesoros son una capa de progresión de cuenta adicional sobre el desbloqueo narrativo ya establecido, no un sistema de gacha. | PASS |
| V. Balance Dirigido por Datos | Todo valor nuevo (`LevelWidth`, `PassiveRegenBonus`, `TreasureIds`) vive en `ScriptableObject`/campos serializados de `ChapterDefinition`/`TreasureSetDefinition` — ningún valor se hardcodea en `BattleStateManager`/`BattleResourceController`. La única constante en código es la regla de redondeo (`Mathf.RoundToInt`, piso 1), consistente con spec 013. | PASS |
| VI. Simplicidad desde el MVP | La decisión más significativa de esta feature (research.md §2) es explícitamente **rechazar** una tabla de datos nueva en favor de reutilizar `ChapterBannerDefinition.EnergyCost` ya existente — ejemplo directo de este principio aplicado durante el diseño, no solo declarado. `TreasureSetDefinition`/`TreasureSetCatalog` son deliberadamente pequeños y de responsabilidad única (sin lógica de UI, sin gacha). | PASS |

No hay violaciones sin justificar. Ninguna entrada en Complexity Tracking — todos los cambios son aditivos o escalados en el punto de consumo, sin cambios de firma sobre interfaces públicas existentes (a diferencia del único caso de spec 013).

## Project Structure

### Documentation (this feature)

```text
specs/014-chapter-scaling-treasure-sets/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
│   ├── base-health-width-and-arc-resolution.md
│   └── treasure-sets-and-passive-bonus.md
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
Assets/Scripts/
├── Model/Battler/
│   ├── ChapterDefinition.cs                       # EXTENDIDO (m_LevelWidth, además de los campos que spec 013 ya añade)
│   ├── PlayerProgressSaveData.cs                  # EXTENDIDO (obtainedTreasureIds, grantedTreasureSetIds)
│   ├── TreasureSetDefinition.cs                   # nuevo SO
│   ├── TreasureSetCatalog.cs                      # nuevo SO
│   └── TreasureSetProgressEvaluator.cs            # nuevo static class (función pura)
│
└── Gameplay/Battler/
    ├── BattleLaunchContext.cs                     # EXTENDIDO (RequestedArc, sobre el tipo que spec 013 ya crea)
    ├── BattleResourceController.cs                # EXTENDIDO (ApplyPassiveRegenBonus)
    └── BattleStateManager.cs                      # EXTENDIDO (resolución de arco activo, escalado de vida/posición de base, flujo de tesoros/sets)

Assets/ScriptableObjects/Battler/EmpireOfCats/
├── TreasureSets/
│   └── EnergyDrink.asset                          # TreasureSetDefinition de ejemplo (Corea + Mongolia)
├── TreasureSetCatalog.asset
└── Levels/
    ├── Corea.asset                                # EXTENDIDO (LevelWidth, sobre el asset que spec 013 ya crea)
    └── Mongolia.asset                              # EXTENDIDO (LevelWidth)

Assets/Data/Battler/
└── (ChapterBannerDefinition adicionales para representar la misma "Corea"/"Mongolia" en Capítulo 2/3, si se autora contenido real más allá de Capítulo 1 — fuera del alcance de contenido de esta feature, ver Assumptions de spec.md)

Assets/Tests/
├── EditMode/Battler/
│   └── (nuevos casos: TreasureSetDefinitionValidationTests, TreasureSetProgressEvaluatorTests)
└── PlayMode/Battler/
    └── (nuevos casos: ArcResolutionFromBannerPlayModeTests, LevelWidthPositioningPlayModeTests, EnemyBaseHealthScalingPlayModeTests, TreasureSetPassiveBonusPlayModeTests, SaveDataNewFieldsRoundTripTests)
```

**Structure Decision**: Misma capa `Core → Model → Gameplay → View` que spec 013, sin ensamblados nuevos. `TreasureSetDefinition`/`TreasureSetCatalog`/`TreasureSetProgressEvaluator` viven en `TheBattler.Model` (datos + función pura, sin `MonoBehaviour`); los cambios de comportamiento en `BattleStateManager`/`BattleResourceController`/`BattleLaunchContext` viven en `TheBattler.Gameplay`. El contenido nuevo de datos (`TreasureSets/`) vive dentro de la misma carpeta `EmpireOfCats/` que spec 013 ya establece, no una carpeta hermana nueva — esta feature es una extensión de esa saga, no un sistema independiente.

## Complexity Tracking

> No hay violaciones de Constitution Check que requieran justificación en esta feature.

Ninguna entrada.

## Post-Design Constitution Re-check

Tras completar Phase 0 ([research.md](./research.md)) y Phase 1 ([data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)), se re-evalúan los seis principios contra el diseño concreto:

- Se confirmó contra el código real (`ChapterDefinition.cs`, `BattleStateManager.cs`, `BattleResourceController.cs`, `MissionEnergyController.cs`, `ChapterBannerDefinition.cs`, `LaneRegistry.cs`) que ningún dato compartido entre capítulos (`UnitDefinition`, `EnemyWaveDefinition`) se modifica — el escalado de vida de base ocurre en el punto de consumo (`SetupChapter()`), igual que spec 013 ya hace para unidades (Principio V).
- El hallazgo más significativo de la fase de research (research.md §2) — que el "costo de energía por capítulo" ya está resuelto por `ChapterBannerDefinition.EnergyCost` existente, y que construir una tabla nueva habría sido alcance no solicitado — es exactamente el tipo de verificación contra código real que Principio VI exige antes de añadir infraestructura nueva. El diseño final es más simple que la lectura literal del Key Entity original de spec.md, sin perder ninguna garantía de FR-002/FR-003.
- Se verificó que `BattleResourceController` (sin dependencias de `IPlayerProgressStore` hoy) puede recibir la bonificación pasiva vía un método explícito (`ApplyPassiveRegenBonus`) sin acoplar esa clase a la capa de guardado de cuenta — mismo criterio de responsabilidad única que ya rige `GatorretaController`/`TryUpgradeRegen` en el diseño de spec 013.
- La única infraestructura genuinamente nueva (persistencia de tesoros obtenidos) se limita a dos campos aditivos sobre `PlayerProgressSaveData`, sin bump de `formatVersion`, sin poner en riesgo guardados existentes — mismo patrón exacto que spec 013 ya usa para `unlockedBonusUnitIds`.
- El alcance de contenido real queda acotado a extender los dos niveles que spec 013 ya autora (`Corea`, `Mongolia`) con `LevelWidth` y un set de tesoros de ejemplo (`EnergyDrink`) que los agrupa — no se autora contenido de Capítulo 2/3 real de la saga (Principio VI, mismo criterio que spec.md Assumptions).

No se detectan violaciones nuevas introducidas por el diseño. **Constitution Check: PASS.**
