# Implementation Plan: Saga "Imperio de los Gatos" — Multiplicadores por Capítulo, Gatorreta y Brotes Zombis

**Branch**: `013-empire-of-cats-saga` | **Date**: 2026-07-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/013-empire-of-cats-saga/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Esta feature añade a la arquitectura ya construida (`001`-`012`) exactamente las capacidades que la saga "Imperio de los Gatos" necesita y que hoy no existen, verificado contra el código real: agrupar niveles (`ChapterDefinition`, ya existente) bajo un nuevo `SagaArcDefinition` con multiplicadores de costo/fuerza enemiga (research.md §1); disparar oleadas de refuerzo por % de vida de base y limitar enemigos simultáneos extendiendo `EnemyWaveSpawner` (research.md §2-3); otorgar XP/tesoro/desbloqueo de unidad en victoria detectando "primera victoria" de forma atómica en `IChapterProgressStore.SaveChapterOutcome` (research.md §4); derivar la finalización de un arco y sus recompensas con un resolver puro nuevo, `SagaArcProgressEvaluator`, siguiendo el mismo patrón que `ChapterBannerUnlockEvaluator` de `004` (research.md §5); reutilizar sin cambios el desbloqueo secuencial de `004` para abrir la saga ya construida "Hacia el Futuro" (research.md §6, cero código); añadir un cañón especial de área (`GatorretaController`) y una mejora de regeneración de dinero (`BattleResourceController.TryUpgradeRegen`) reutilizando primitivos ya existentes (`LaneRegistry.FindAllTargetsInRange`, `TrySpend`, research.md §9-10); y un modificador "Brote Zombi" que sustituye la oleada de un nivel por una alternativa ya autorada sin el enemigo jefe, sin ninguna regla de motor nueva para "suprimir jefe" (research.md §11). Ningún dato base de `UnitDefinition`/`EnemyWaveDefinition` compartido entre capítulos se modifica — todo multiplicador se aplica en el punto de consumo. Todos los cambios de firma existentes (`IChapterProgressStore.SaveChapterOutcome`, `UnitDeploymentController.Initialize`, `EnemyWaveSpawner.Initialize`, `UnitRuntime.Initialize`) son aditivos vía parámetros opcionales con defaults que preservan el comportamiento de `Chapter1`/`Chapter2`, salvo un único cambio de tipo de retorno documentado y justificado (research.md §4, Complexity Tracking). El contenido autorado se limita a "Corea" y "Mongolia" (spec.md Assumptions, vertical slice sobre el nuevo sistema), validado además con dobles sintéticos en tests para las historias que no dependen de contenido real (multiplicadores de Capítulo 2/3).

## Technical Context

**Language/Version**: C# (Unity 6000.3.20f1 scripting runtime), mismo proyecto que `001`-`012`.

**Primary Dependencies**: Ninguna nueva de terceros. Se reutiliza en su totalidad la infraestructura ya implementada — `ChapterDefinition`, `UnitDefinition`, `EnemyWaveDefinition`, `UnitCombatProfile`, `BattleStateManager`, `EnemyWaveSpawner`, `UnitDeploymentController`, `UnitRuntime`, `UnitRuntimePool`, `BattleResourceController`, `BaseHealth`, `LaneRegistry`, `BattleOutcomeResolver`, `LocalChapterProgressStore`/`IChapterProgressStore`, `LocalPlayerProgressStore`/`IPlayerProgressStore`, `PlayerBaseFlowController`, `UnitLevelingController`/`UnitLevelingConfig`, `ChapterBannerDefinition`/`ChapterBannerUnlockEvaluator`/`AdventureMap` (`004`) — sin modificar su forma pública salvo las extensiones aditivas y el único cambio de firma documentados en data-model.md/contracts/. No se añade ningún paquete de Unity.

**Storage**: Ninguna nueva. Se extiende `progress.json` (vía `IChapterProgressStore`, `002`) con `ProgressSaveData.arcs: SagaArcProgressRecord[]`, y `playerprogress.json`-equivalente (vía `IPlayerProgressStore`) con `PlayerProgressSaveData.unlockedBonusUnitIds: string[]` — ambos campos aditivos, sin bump de `formatVersion` (research.md §8, riesgo de borrado de progreso existente evitado explícitamente). Los datos de diseño nuevos (`SagaArcDefinition`, `UnitUnlockCatalog`, `ExpandedUnitLevelingConfig`, y los `ChapterDefinition`/`EnemyWaveDefinition` de "Corea"/"Mongolia") viven en assets `.asset` bajo `Assets/ScriptableObjects/Battler/EmpireOfCats/`, mismo patrón que `Chapter1/`/`Chapter2/`.

**Testing**: Unity Test Framework, mismo split que `001`/`010` — EditMode (NUnit puro, dobles vía `ScriptableObject.CreateInstance<T>()`) para `SagaArcDefinition.IsValid`, `SagaArcProgressEvaluator`, `UnitCombatProfile.Scaled`, validación de rango de `HealthThresholdWaveTrigger`; PlayMode para `EnemyWaveSpawner` (cap simultáneo + trigger de umbral), `GatorretaController`, `BattleResourceController.TryUpgradeRegen`, y el flujo completo de recompensas de `BattleStateManager.SetOutcome`, todo con dobles en memoria, sin depender de escenas/assets reales del proyecto (ver quickstart.md).

**Target Platform**: El mismo definido por el proyecto (Unity 6000.3.20f1, URP 2D); sin restricciones de plataforma adicionales.

**Project Type**: Proyecto único de Unity (`the_battler_test`); se extiende la capa de asmdefs ya validada (`TheBattler.Core` → `TheBattler.Model` → `TheBattler.Gameplay` → `TheBattler.View`), sin ensamblados nuevos.

**Performance Goals**: Mismo objetivo que `001`/`010` — 60 fps estables con hasta ~10 unidades simultáneas en el carril. `LaneRegistry.CountAlive`/`FindAllTargetsInRange` son recorridos lineales sobre la misma lista en memoria ya usada por el motor de combate (sin física nueva, sin allocaciones nuevas por frame en el camino caliente: `GatorretaController` reutiliza un buffer de lista igual que `UnitRuntime.m_AreaTargetsBuffer`, `007`).

**Constraints**:
- **Cambio de firma deliberado**: `IChapterProgressStore.SaveChapterOutcome` cambia de `void` a `bool` (research.md §4) — única forma de detectar "primera victoria" de forma atómica sin una segunda lectura de disco. Impacto: los 8 dobles de test que implementan `IChapterProgressStore` en `Assets/Tests/PlayMode/Battler/` (verificado por búsqueda real tras `/speckit-analyze`, hallazgo C1 — lista exacta en [contracts/save-data-extensions.md](./contracts/save-data-extensions.md); no solo `002`/`009`/`010` como se estimó originalmente, también `003`/`004`/`005`/`006`) deben actualizarse para seguir compilando (documentado en Complexity Tracking, no bloquea esta feature pero es trabajo real de `/speckit-tasks`).
- **FR-019/FR-020 (añadidos/ajustados tras `/speckit-analyze`)**: FR-019 exige un evento para "disparo de oleada de refuerzo por umbral" que el diseño original de `EnemyWaveSpawner` omitía — se añadió `event Action<int> ThresholdWaveTriggered` (contracts/wave-triggers-and-enemy-cap.md). FR-020/SC-008 (nuevos) exigen que la disponibilidad de Brote Zombi (FR-015) sea consultable en código, no solo un criterio de UI — se añadió `ZombieOutbreakEligibility.IsOfferable` (contracts/zombie-outbreak-mode.md).
- **Sin nuevo concepto de "enemigo jefe" en runtime**: FR-004 (nivel de jefe de arco) y FR-014 (sin jefe en Brote Zombi) se resuelven en `SagaArcDefinition.BossLevel` (documentación de diseño) y en la autoría de `ChapterDefinition.ZombieOutbreakWave` (omitiendo la entrada del jefe), respectivamente — cero lectura de "es jefe" desde ningún componente de combate (research.md §11).
- **Sin gacha ni economía de rareza**: FR-017 añade `UnitDefinition.Rarity` como metadata pura; ningún sistema de este plan implementa obtención aleatoria, tasas, o moneda premium (Principio VI, spec.md Assumptions).
- **Contenido acotado**: solo "Corea" y "Mongolia" se autoran como assets reales; el resto de los 144 niveles de la saga es trabajo de contenido posterior (spec.md Assumptions) — las historias que dependen de multiplicadores de Capítulo 2/3 (Historia 1, Escenarios 2-3) se validan con un `SagaArcDefinition` sintético de prueba, no con contenido narrativo completo de esos capítulos.
- **FR-018 sin arco real de "segundo capítulo" en este vertical slice** (hallazgo E4 de `/speckit-analyze`): como esta feature solo autora el Capítulo 1 de la saga, no existe todavía un `SagaArcDefinition` real de "Capítulo 2" al que apuntar la referencia de `PlayerBaseFlowController` que eleva el tope de mejora a 20. `/speckit-tasks` DEBE dejar esa referencia asignada explícitamente a `Chapter1.asset` como placeholder documentado (con nota `TODO` de reapuntar cuando exista contenido real), no sin asignar — así FR-018 se demuestra con contenido real (aunque sea el arco "equivocado" temporalmente) además de con el doble sintético de test.
- **Ningún enemigo jefe distinguible en el contenido real de esta feature** (hallazgo E5 de `/speckit-analyze`): ni "Corea" ni "Mongolia" autoran un enemigo jefe propio, así que la garantía de FR-014 ("sin jefe en Brote Zombi") es vacuamente cierta sobre ese contenido. `/speckit-tasks` DEBE añadir un caso de prueba sintético (oleada estándar con una entrada de "jefe" + oleada zombi sin ella) para demostrar FR-014 de forma genuina, no solo estructural.
- Igual que `001`-`010`: toda la lógica funciona sin conexión a red; el guardado es local (`002`).

**Scale/Scope**: 1 `SagaArcDefinition` real (Capítulo 1) + 1 sintético de prueba, 2 niveles nuevos reales ("Corea", "Mongolia") sobre el `ChapterDefinition` ya existente, 1 unidad de recompensa nueva ("Gato Defensor", sujeta al Principio III), 8 historias de usuario cubiertas por extensiones aditivas sobre 7 clases existentes + 9 clases/tipos nuevos pequeños (`SagaArcDefinition`, `SagaArcProgressRecord`, `SagaArcProgressEvaluator`, `UnitUnlockCatalog`+`UnitUnlockEntry`, `GatorretaController`, `BattleLaunchContext`, `ZombieOutbreakEligibility`, `HealthThresholdWaveTrigger`, `UnitRarity`) — mismo orden de magnitud de complejidad nueva que `004`/`006`/`007` individualmente, no una reescritura. (Conteo corregido tras `/speckit-analyze`, hallazgo F2 — la cifra original, "6", no coincidía con la propia enumeración.)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación | Estado |
|---|---|---|
| I. Narrativa Integrada | `ChapterDefinition.PreBattleDialogue`/`PostBattleDialogue` (ya existentes, obligatorios por diseño desde `001`) se autoran para "Corea" y "Mongolia" igual que para `Chapter1`/`Chapter2` — esta feature no toca ese mecanismo, solo añade contenido narrativo nuevo sobre él. El guion literal se autora en `/speckit-tasks`/`/speckit-implement` (mismo patrón que `010`). | PASS |
| II. Combate Automático por Despliegue | El núcleo (recurso acumulado con regen mejorable, despliegue por costo/cooldown, autonomía total tras desplegar, bases como objetivo) no cambia — `TryUpgradeRegen` es exactamente "mejorar la tasa de regeneración durante la partida" que el propio principio ya exige (`Assets/Scripts/Gameplay/Battler/BattleResourceController.cs`), y la Gatorreta es literalmente "torre/cañón especial de recarga lenta" que el principio ya menciona explícitamente, implementada por primera vez en esta feature. | PASS |
| III. Identidad Visual Animada | Solo se introduce 1 unidad jugable nueva de contenido real ("Gato Defensor", desbloqueo de primera victoria de "Corea") — DEBE cumplir idle + ataque + variante visual como cualquier `UnitDefinition` existente, vía `HasValidVisualIdentity` ya implementado, sin excepción. El principio, igual que en `010`, se aplica textualmente solo a "personaje jugable" — las unidades enemigas (Chucho, Serpi) y sus variantes zombi (Chucho Z., Zerpi, Kodrizzz) no están obligadas por este principio (mismo precedente que `010`, que no lo exigió para su enemigo nuevo); su calidad visual es una decisión de contenido, no un gate de constitución. (Aclarado tras `/speckit-analyze`, hallazgo D1 — la redacción original de este plan extendía el principio a enemigos sin ese respaldo.) | PASS |
| IV. Progresión por Capítulos con Desbloqueo | Alineación central de esta feature: `SagaArcDefinition` es exactamente "capítulos/etapas secuenciales" a una escala nueva (arco de 48 niveles) sobre el desbloqueo secuencial ya construido por `004`; los "Gatos nuevos" se obtienen por desbloqueo narrativo ligado a la historia (primera victoria de nivel / finalización de arco), nunca por gacha — consistente con la cláusula del principio que exige declarar explícitamente cuál de los dos sistemas aplica. | PASS |
| V. Balance Dirigido por Datos | Todos los multiplicadores, umbrales, límites, recompensas y elencos de Brote Zombi viven en `SagaArcDefinition`/`ChapterDefinition`/`EnemyWaveDefinition` (ScriptableObjects) — ningún valor se hardcodea en `BattleStateManager`/`EnemyWaveSpawner`/`GatorretaController`. La única constante en código es el criterio de redondeo (`Mathf.RoundToInt`, piso 1), que es una regla de cálculo, no un valor de balance. | PASS |
| VI. Simplicidad desde el MVP | Se autora contenido real solo para 2 niveles ("Corea"/"Mongolia"), no los 144 de la saga completa (spec.md Assumptions); ningún sistema nombrado como recompensa de capítulo (Cat Combos, Dojo, Ototo, Sistema de Frutas) se implementa en este plan, solo se persiste el hecho de que fueron "desbloqueados" (feature-flags planos); la rareza de unidad es metadata sin mecánica de gacha. Cada pieza nueva de código es deliberadamente pequeña y de una sola responsabilidad (`GatorretaController` no hereda de `BattleResourceController`; la mejora de regen es un método, no una clase nueva — research.md §9-10). | PASS |

No hay violaciones sin justificar; la única desviación (cambio de firma de `IChapterProgressStore.SaveChapterOutcome`) está documentada y justificada en **Complexity Tracking**.

## Project Structure

### Documentation (this feature)

```text
specs/013-empire-of-cats-saga/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
│   ├── chapter-arc-multipliers.md
│   ├── wave-triggers-and-enemy-cap.md
│   ├── level-rewards-and-unit-unlocks.md
│   ├── gatorreta-and-resource-upgrade.md
│   ├── zombie-outbreak-mode.md
│   └── save-data-extensions.md
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
Assets/Scripts/
├── Core/Battler/
│   └── UnitRarity.cs                              # nuevo enum (Normal = 0)
│
├── Model/Battler/
│   ├── SagaArcDefinition.cs                       # nuevo SO
│   ├── HealthThresholdWaveTrigger.cs              # nuevo struct [Serializable]
│   ├── UnitUnlockCatalog.cs                       # nuevo SO
│   ├── UnitUnlockEntry.cs                         # nuevo struct/clase [Serializable]
│   ├── ChapterDefinition.cs                        # EXTENDIDO (6 campos nuevos, ver data-model.md)
│   ├── UnitDefinition.cs                           # EXTENDIDO (m_Rarity)
│   ├── UnitCombatProfile.cs                        # EXTENDIDO (método estático Scaled)
│   ├── ProgressSaveData.cs                         # EXTENDIDO (campo arcs)
│   ├── SagaArcProgressRecord.cs                    # nueva clase [Serializable]
│   ├── PlayerProgressSaveData.cs                   # EXTENDIDO (campo unlockedBonusUnitIds)
│   └── IChapterProgressStore.cs                    # CAMBIO DE FIRMA (ver Complexity Tracking)
│
└── Gameplay/Battler/
    ├── SagaArcProgressEvaluator.cs                 # nuevo static class (función pura)
    ├── GatorretaController.cs                      # nuevo MonoBehaviour
    ├── BattleLaunchContext.cs                       # nuevo static class (puente entre escenas)
    ├── ZombieOutbreakEligibility.cs                 # nuevo static class (función pura, FR-015/FR-020/SC-008 — añadido tras /speckit-analyze)
    ├── LocalChapterProgressStore.cs                 # EXTENDIDO (nueva firma + SaveArcRewardsGranted)
    ├── EnemyWaveSpawner.cs                          # EXTENDIDO (cap simultáneo + triggers de umbral)
    ├── UnitDeploymentController.cs                  # EXTENDIDO (unitCostMultiplier)
    ├── UnitRuntime.cs                               # EXTENDIDO (overload con statMultiplier)
    ├── BattleResourceController.cs                  # EXTENDIDO (TryUpgradeRegen, reset de RegenPerSecond)
    ├── BattleStateManager.cs                        # EXTENDIDO (m_ActiveArc, flujo de recompensas, LevelRewardsGranted)
    └── PlayerBaseFlowController.cs                   # EXTENDIDO (m_UnlockCatalog, config de nivel expandida, OwnedUnits)

Assets/Scripts/LaneRegistry.cs                       # EXTENDIDO (CountAlive)

Assets/ScriptableObjects/Battler/EmpireOfCats/
├── Chapter1.asset                                  # nuevo SagaArcDefinition (Levantamiento Felino)
├── Levels/
│   ├── Corea.asset                                 # ChapterDefinition (reutiliza el tipo existente)
│   ├── Corea_EnemyWave.asset
│   ├── Corea_ZombieWave.asset
│   ├── Mongolia.asset
│   ├── Mongolia_EnemyWave.asset
│   ├── Mongolia_ReinforcementWave.asset            # oleada de 4 Serpi al 50% de vida de base
│   └── Mongolia_ZombieWave.asset
├── Units/
│   ├── Enemy/ (Chucho, Serpi, ChuchoZ, Zerpi, Kodrizzz)
│   └── Player/GatoDefensor.asset
├── UnitUnlockCatalog.asset
└── ExpandedUnitLevelingConfig.asset                 # MaxLevel = 20 (FR-018)

Assets/Tests/
├── EditMode/Battler/
│   └── (nuevos casos: SagaArcDefinitionValidationTests, SagaArcProgressEvaluatorTests, UnitCombatProfileScaledTests, SaveDataNewFieldsRoundTripTests [SC-007, añadido tras /speckit-analyze])
└── PlayMode/Battler/
    └── (nuevos casos: EnemyWaveSpawnerCapAndTriggerTests, GatorretaControllerTests, ResourceRegenUpgradeTests, LevelRewardFlowTests, ZombieOutbreakModeTests [incluye caso sintético de supresión de jefe y ZombieOutbreakEligibility, añadido tras /speckit-analyze])
```

**Structure Decision**: Se extiende la capa `Core → Model → Gameplay → View` ya existente con clases pequeñas y de responsabilidad única, sin ensamblados nuevos. El contenido nuevo vive en una carpeta hermana (`Assets/ScriptableObjects/Battler/EmpireOfCats/`) al mismo nivel que `Chapter1/`/`Chapter2/`, manteniendo el patrón "una carpeta de datos por arco/capítulo narrativo" ya establecido por `010`. La integración con el mapa de aventuras (`004`) para desbloquear "Hacia el Futuro" es puramente de datos (research.md §6) — insertar los banners de "Imperio de los Gatos" antes del banner ya existente de "Hacia el Futuro" en `MainAdventureMap.asset` — y se documenta como tarea de integración explícita en `/speckit-tasks`, no como modificación de código de `004`.

## Complexity Tracking

> Única desviación que requiere justificación: un cambio de firma sobre una interfaz existente (no puramente aditivo).

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|---------------------------------------|
| `IChapterProgressStore.SaveChapterOutcome` cambia de `void` a `bool` | Detectar "primera victoria de este nivel" (necesario para FR-009, desbloqueo de unidad exactamente una vez) exige conocer el valor de `isCompleted` **antes** de la escritura que lo pone a `true`. `LocalChapterProgressStore.SaveChapterOutcome` ya carga ese valor internamente (research.md §4) — exponerlo como retorno es el cambio más pequeño posible. | Alternativa considerada: que `BattleStateManager` llame a `Load()` antes de `SaveChapterOutcome(...)` para comparar el estado previo. Rechazada: introduce una ventana de lectura-luego-escritura no atómica (si algo more escribe el archivo entre medias — p. ej. otro guardado en curso — la comparación podría ser incorrecta) y duplica una lectura de disco que el propio store ya hace internamente. El costo real del cambio elegido es acotado: una única implementación de producción (`LocalChapterProgressStore`) y los dobles de test de 6 specs anteriores, todos ellos triviales de actualizar (mecánicos, sin lógica nueva) — ver save-data-extensions.md. |

## Post-Design Constitution Re-check

Tras completar Phase 0 ([research.md](./research.md)) y Phase 1 ([data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)), se re-evalúan los seis principios contra el diseño concreto:

- Se confirmó contra el código real (`BattleStateManager.cs`, `UnitDeploymentController.cs`, `EnemyWaveSpawner.cs`, `UnitRuntime.cs`, `LaneRegistry.cs`, `BattleResourceController.cs`, `LocalChapterProgressStore.cs`, `PlayerBaseFlowController.cs`, `UnitLevelingController.cs`) que **ningún** multiplicador, umbral, límite o recompensa de esta feature requiere mutar un `UnitDefinition`/`EnemyWaveDefinition`/`UnitLevelingConfig` compartido — todos los cambios aplican en el punto de consumo runtime, confirmando el diseño de research.md §1 no solo asumiéndolo (Principio V).
- Se confirmó que la Gatorreta (Principio II, "torre/cañón especial de recarga lenta") y la mejora de regeneración de dinero (Principio II, "tasa de regeneración mejorable durante la partida") son, ambas, mecánicas que el propio Principio II ya exigía como parte del núcleo de juego y que hasta esta feature no tenían ninguna clase implementándolas — esta feature es su primera materialización real, no una desviación del principio.
- El único desbloqueo de contenido narrativamente distinto ("Hacia el Futuro") se resolvió sin ningún código nuevo, reutilizando `ChapterBannerUnlockEvaluator` de `004` tal cual (research.md §6) — confirma que el diseño de `004` ya generalizaba a "cualquier secuencia de banners", no solo a la de su propia feature, igual que `010` ya había confirmado una vez para su propio caso.
- Se verificó que `UnitCombatProfile` (inmutable, sin setters) y `BattleResourceController`/`LaneRegistry` (sin dependencias de física de escena, solo estado en memoria) admiten las extensiones propuestas mediante nuevos métodos/overloads, sin requerir romper su inmutabilidad ni introducir una dependencia de física nueva.
- El alcance de contenido real autorado sigue acotado a "Corea"/"Mongolia" + 1 unidad de recompensa (Principio VI) — ningún artefacto de diseño de esta fase amplía ese alcance; los feature-flags de fin de capítulo (Cat Combos, Dojo, Ototo, Sistema de Frutas) se modelan como strings opacos persistidos, no como sistemas implementados.
- La única violación identificada (cambio de firma de `IChapterProgressStore.SaveChapterOutcome`) sigue siendo la única, está acotada a una interfaz con una sola implementación de producción, y su justificación no cambió tras el diseño detallado.

No se detectan violaciones nuevas introducidas por el diseño. **Constitution Check: PASS.**
