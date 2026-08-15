# Quickstart: Validar la Saga "Imperio de los Gatos"

Guía para comprobar de punta a punta que las capacidades de esta feature cumplen los criterios de aceptación de [spec.md](./spec.md), una vez implementadas las tareas de `/speckit-tasks`. Cubre solo el contenido realmente autorado para esta feature (Corea, Mongolia — spec.md Assumptions); el resto de los 144 niveles queda fuera de esta guía.

## Prerrequisitos

- Unity 6000.3.20f1 (o superior) con el proyecto `the_battler_test` abierto.
- Un `SagaArcDefinition` para "Capítulo 1: Levantamiento Felino" (`UnitCostMultiplier ≈ 0.667`, `EnemyStrengthMultiplier = 1.0`) con `Levels` = [`Corea.asset`, `Mongolia.asset`] (`ChapterDefinition` existentes, nuevos assets bajo `Assets/ScriptableObjects/Battler/EmpireOfCats/Chapter1/`).
- Un segundo `SagaArcDefinition` mínimo de prueba (puede ser sintético, sin escena propia) con `UnitCostMultiplier = 1.0`/`1.333` y `EnemyStrengthMultiplier = 1.5`/`4.0` para validar Historia 1 Escenarios 2-3 sin necesitar contenido real de Capítulo 2/3 (ver [contracts/chapter-arc-multipliers.md](./contracts/chapter-arc-multipliers.md)).
- `Corea.asset`: `MaxSimultaneousEnemies = 3`, único enemigo "Chucho", `XpReward = 1000`, `TreasureRewardId = "kimchi"`, `FirstClearUnitUnlock` = `UnitDefinition` de "Gato Defensor", `ZombieOutbreakWave` con "Chucho Z.".
- `Mongolia.asset`: `MaxSimultaneousEnemies = 4`, enemigos "Chucho"/"Serpi", `HealthThresholdWaveTriggers = [{ 0.5, oleada de 4 Serpi }]`, `XpReward = 1300`, `TreasureRewardId = "tienda_de_campana"`, `ZombieOutbreakWave` con "Zerpi"/"Kodrizzz".
- Un `UnitUnlockCatalog` con al menos la entrada `{ "gato_defensor", <UnitDefinition de Gato Defensor> }`.
- Escena de batalla que referencia `BattleStateManager` con `m_ActiveArc` = el `SagaArcDefinition` de Capítulo 1, y un `GatorretaController` en la base del jugador.

## Validación manual — Historia 1: multiplicadores por capítulo (P1)

1. Desplegar el mismo gato en `Corea.asset` (Capítulo 1) y anotar el costo cobrado; confirmar que es `Cost × 0.667` (redondeado). (Acceptance Scenario 1)
2. Repetir el despliegue bajo el `SagaArcDefinition` de prueba con `UnitCostMultiplier = 1.333`; confirmar que el costo cobrado es mayor que en el paso 1. (Acceptance Scenario 2)
3. Generar el mismo enemigo base bajo `EnemyStrengthMultiplier = 1.0` y bajo `4.0`; confirmar que la vida/daño en el segundo caso son ~4× el primero (ver `UnitCombatProfile.Scaled`, [data-model.md](./data-model.md#unitcombatprofile-existente--método-nuevo)). (Acceptance Scenario 3)

## Validación manual — Historia 2: oleada por % de vida de base (P2)

4. En `Mongolia.asset`, reducir la vida de la base enemiga exactamente a 50% (o menos de un solo golpe) y confirmar que aparecen 4 "Serpi" adicionales una única vez, y que el evento `EnemyWaveSpawner.ThresholdWaveTriggered` se invoca exactamente una vez con el índice correspondiente (FR-019, añadido tras `/speckit-analyze`). (Acceptance Scenario 1)
5. Confirmar que seguir bajando la vida del 50% al 10% no vuelve a disparar esa misma oleada. (Acceptance Scenario 2)
6. Con un segundo umbral de prueba (p. ej. 20%) además del de 50%, aplicar daño que cruce ambos en el mismo golpe (70%→15%) y confirmar que ambas oleadas se generan en el mismo instante. (Acceptance Scenario 3)

## Validación manual — Historia 3: límite de enemigos simultáneos (P3)

7. En `Corea.asset` (límite 3), mantener 3 "Chucho" vivos y confirmar que un cuarto programado no aparece hasta que muera uno de los tres. (Acceptance Scenario 1)
8. Confirmar que, al morir uno de los tres, el enemigo retenido aparece en la siguiente oportunidad. (Acceptance Scenario 2)

## Validación manual — Historia 4: recompensas y desbloqueo de unidad (P4)

9. Ganar `Corea.asset` por primera vez; confirmar 1000 XP, tesoro "kimchi" notificado, y "Gato Defensor" disponible en Formación de Equipo tras esto. (Acceptance Scenario 1)
10. Ganar `Corea.asset` de nuevo; confirmar que XP y tesoro se otorgan otra vez pero no hay un segundo evento de desbloqueo de unidad. (Acceptance Scenario 2)

## Validación manual — Historia 5: Gatorreta (P5)

11. Iniciar batalla, esperar el tiempo de recarga configurado, confirmar el evento/indicador de disponibilidad. (Acceptance Scenario 1)
12. Activarla manualmente con 3 enemigos dentro de rango y 1 fuera; confirmar daño de área solo a los 3 dentro de rango, y que vuelve a recargar desde cero. (Acceptance Scenario 2)
13. Intentar activarla mientras recarga; confirmar que no tiene efecto ni reinicia el temporizador. (Acceptance Scenario 3)

## Validación manual — Historia 6: mejora de regeneración de dinero (P6)

14. Con dinero suficiente, activar la mejora de regeneración y confirmar el aumento inmediato de la tasa por el resto de la batalla. (Acceptance Scenario 1)
15. Con dinero insuficiente, confirmar que la activación no tiene efecto. (Acceptance Scenario 2)

## Validación manual — Historia 7: Brote Zombi (P7)

16. Con `Corea.asset` ya ganado, seleccionar el modo Brote Zombi y confirmar que solo aparecen variantes zombi ("Chucho Z."), nunca "Chucho" estándar. (Acceptance Scenario 1)
17. Confirmar que ningún enemigo jefe estándar aparece en esa partida. **Nota (tras `/speckit-analyze`, hallazgo E5)**: ni "Corea" ni "Mongolia" autoran un enemigo jefe distinguible, así que este paso sobre contenido real es vacuamente cierto — la demostración genuina de FR-014 vive en el caso de prueba sintético de `ZombieOutbreakModeTests.cs` (oleada estándar con una entrada de "jefe" + oleada zombi sin ella), no en este paso manual. (Acceptance Scenario 2)
18. Con un nivel aún no superado, confirmar que el modo Brote Zombi no aparece como opción seleccionable — respaldado en código por `ZombieOutbreakEligibility.IsOfferable(chapterDefinition, progressStore.Load())` (FR-015/FR-020/SC-008). (Acceptance Scenario 3)

## Validación manual — Historia 8: desbloqueos de capítulo/arco (P8)

19. Marcar todos los niveles del `SagaArcDefinition` de Capítulo 1 como superados salvo uno; ganar ese último y confirmar que el guardado marca el arco completado y sus recompensas (unidades + feature-flags) quedan otorgadas. (Acceptance Scenario 1)
20. Con el arco de Capítulo 2 marcado como completado, abrir la pantalla de mejora de unidades y confirmar que el nivel máximo disponible es 20 (`ExpandedUnitLevelingConfig`, ver [data-model.md](./data-model.md#unitlevelingconfig-existente--nuevo-asset-de-datos-sin-cambio-de-clase)). (Acceptance Scenario 2)
21. Con un arco incompleto, confirmar que sus recompensas aparecen como no obtenidas. (Acceptance Scenario 3)

## Validación automatizada

- `Assets/Tests/EditMode/Battler/`: nuevos casos para `SagaArcDefinition.IsValid`, `SagaArcProgressEvaluator.IsArcCompleted`/`HasRewardsGranted` (dobles en memoria vía `ScriptableObject.CreateInstance<T>()`, sin depender de assets reales), `UnitCombatProfile.Scaled` (redondeo y piso de 1), validación de rango de `HealthThresholdWaveTrigger.ThresholdPercent` (0-1), y round-trip de serialización JSON de los campos nuevos de guardado (`ProgressSaveData.arcs`, `PlayerProgressSaveData.unlockedBonusUnitIds`) confirmando que sobreviven sin pérdida ni duplicación (SC-007, añadido tras `/speckit-analyze`).
- `Assets/Tests/PlayMode/Battler/`: extensión del patrón `BattleLoopPlayModeTests` de `001` cubriendo: (a) `EnemyWaveSpawner` con `MaxSimultaneousEnemies` y `HealthThresholdWaveTriggers` sobre una `BaseHealth`/`EnemyWaveDefinition` sintéticas, incluyendo que `ThresholdWaveTriggered` se invoque exactamente una vez por umbral cruzado; (b) `GatorretaController.TryActivate` aplicando daño de área vía `LaneRegistry`; (c) `BattleResourceController.TryUpgradeRegen`; (d) el flujo completo de `BattleStateManager.SetOutcome` en victoria (XP, tesoro notificado, desbloqueo de unidad en primera victoria vía el `bool` de `SaveChapterOutcome`, recompensas de arco al completarse); (e) `ZombieOutbreakEligibility.IsOfferable` y un caso sintético de supresión de jefe (oleada estándar con una entrada de "jefe" + oleada zombi sin ella) que demuestre FR-014 de forma genuina, no solo vacuamente sobre "Corea"/"Mongolia" (añadido tras `/speckit-analyze`, hallazgos E2/E5).
- `Assets/Tests/PlayMode/Battler/`: los 8 dobles existentes de `IChapterProgressStore` (lista verificada tras `/speckit-analyze` en [contracts/save-data-extensions.md](./contracts/save-data-extensions.md) — no solo `002`/`009`/`010`, también `003`/`004`/`005`/`006`) actualizados a la nueva firma `bool SaveChapterOutcome(...)` + `SaveArcRewardsGranted(...)` — deben seguir compilando y pasando sin cambio de comportamiento observable para esas features.

## Resultado esperado

Los pasos 1–21 y su suite automatizada en verde confirman que las 8 historias de usuario de spec.md quedan implementadas sobre `Corea`/`Mongolia` como vertical slice de la saga "Imperio de los Gatos", reutilizando el 100% del motor de combate/economía/guardado ya validado por `001`-`010` (Constitution Check de plan.md). La población completa de los 144 niveles y la mecánica interna de los feature-flags de fin de capítulo (Cat Combos, Dojo, Ototo, Sistema de Frutas) quedan fuera de esta guía — ver spec.md Assumptions.
