# Quickstart: Validar Escalado Avanzado por Capítulo y Sets de Tesoros

Guía para comprobar de punta a punta que las capacidades de esta feature cumplen los criterios de aceptación de [spec.md](./spec.md), una vez implementadas las tareas de `/speckit-tasks`. Depende de que spec 013 esté implementada primero (`SagaArcDefinition`, `BattleLaunchContext.ZombieOutbreakRequested`, `ChapterDefinition.TreasureRewardId`/`HealthThresholdWaveTriggers`/`MaxSimultaneousEnemies`) — esta feature no es ejecutable de forma aislada sin esa base.

## Prerrequisitos

- Unity 6000.3.20f1 (o superior) con el proyecto `the_battler_test` abierto, spec 013 ya implementada.
- Dos `SagaArcDefinition` de prueba con `EnemyStrengthMultiplier` distintos (p. ej. `1.0` y `4.0`), cada uno con `Corea.asset` en `Levels`.
- `Corea.asset` (`ChapterDefinition`) con `EnemyBaseMaxHealth = 500` y `LevelWidth` configurado (p. ej. `3600` para paridad con el juego original, o cualquier valor de prueba).
- Dos `ChapterBannerDefinition` distintos, ambos apuntando a `Corea.asset` pero a arcos distintos (`EnergyCost = 5` y `EnergyCost = 15` respectivamente) — simulan "Corea Capítulo 1" y "Corea Capítulo 2" en el mapa.
- Un `TreasureSetDefinition` de prueba (`SetId = "test_set"`, `TreasureIds = ["kimchi", "tienda_de_campana"]`, `PassiveRegenBonus = 2.0`) y un `TreasureSetCatalog` que lo contenga, referenciado desde `BattleStateManager.m_TreasureSetCatalog` en la escena de batalla.

## Validación manual — Historia 1: vida de base enemiga escala por capítulo (P1)

1. Iniciar batalla en `Corea.asset` bajo el arco con `EnemyStrengthMultiplier = 1.0`; confirmar que la vida máxima inicial de la base enemiga es 500 (sin escalar). (Acceptance Scenario 1)
2. Repetir bajo el arco con `EnemyStrengthMultiplier = 4.0`; confirmar que la vida máxima inicial de la base enemiga es 2000 (`500 × 4`, redondeado). (Acceptance Scenario 2)
3. Comparar el daño total necesario para destruir la base en ambos casos; confirmar que es proporcional al multiplicador. (Acceptance Scenario 3)

## Validación manual — Historia 2: costo de energía correcto según capítulo de acceso (P2)

4. Desde el mapa de aventuras, seleccionar el banner "Corea Capítulo 1" (`EnergyCost = 5`); confirmar que se descuentan 5 de energía y que la batalla carga con `enemyStrengthMultiplier`/`unitCostMultiplier` del arco Capítulo 1 (verificar costo de despliegue de una unidad conocida). (Acceptance Scenario 1)
5. Seleccionar el banner "Corea Capítulo 2" (`EnergyCost = 15`); confirmar que se descuentan 15 de energía y que la batalla carga con los multiplicadores del arco Capítulo 2 (no los del Capítulo 1). (Acceptance Scenario 2)
6. Con energía insuficiente para el costo del banner seleccionado, confirmar que el comportamiento de rechazo es idéntico al ya existente de spec 006 (sin cambios de este plan). (Acceptance Scenario 3)

## Validación manual — Historia 3: ancho de nivel configurable (P3)

7. Con `Corea.asset` en `LevelWidth = 3600`, desplegar una unidad y medir el tiempo hasta que alcanza la base enemiga; confirmar que la distancia recorrida corresponde a 3600. (Acceptance Scenario 1)
8. Repetir con un segundo `ChapterDefinition` de prueba en `LevelWidth = 5000` (misma unidad, mismo `Range`); confirmar que el tiempo de recorrido es mayor, proporcional a la diferencia de ancho. (Acceptance Scenario 2)
9. Confirmar que `Chapter1.asset`/`Chapter2.asset` (tras la migración de datos de `/speckit-tasks`, ver contracts/base-health-width-and-arc-resolution.md) producen exactamente la misma posición de base enemiga que antes de esta feature (regresión cero). (Acceptance Scenario 3)

## Validación manual — Historia 4: sets de tesoros con bonificación pasiva (P4)

10. Ganar el nivel que otorga el tesoro "kimchi" (ya obtenido "tienda_de_campana" previamente); confirmar que `PlayerProgressSaveData.obtainedTreasureIds` contiene ambos y que `grantedTreasureSetIds` pasa a incluir `"test_set"` inmediatamente. (Acceptance Scenario 1)
11. Iniciar una batalla nueva tras eso; confirmar que `BattleResourceController.RegenPerSecond` incluye el bono de `+2.0` desde el inicio de esa batalla. (Acceptance Scenario 2)
12. Con solo uno de los dos tesoros obtenido, confirmar que `TreasureSetProgressEvaluator.IsSetComplete` devuelve `false` y que no se aplica ningún bono. (Acceptance Scenario 3)
13. Obtener un tesoro que no pertenece a `"test_set"`; confirmar que se añade a `obtainedTreasureIds` sin alterar `grantedTreasureSetIds` ni `RegenPerSecond`. (Acceptance Scenario 4)

## Suite automatizada (referencia para `/speckit-tasks`)

- **EditMode** (`TheBattler.Tests.EditMode`, dobles vía `ScriptableObject.CreateInstance<T>()`): `TreasureSetDefinitionValidationTests`, `TreasureSetProgressEvaluatorTests` (set completo/incompleto, `HasRewardsGranted`), `EnemyBaseHealthScalingTests` (cálculo puro del redondeo, si se extrae a un helper) o cubierto vía integración si el cálculo queda inline en `BattleStateManager`.
- **PlayMode** (`TheBattler.Tests.PlayMode`): `ArcResolutionFromBannerPlayModeTests` (`BattleLaunchContext.RequestedArc` prevalece sobre `m_ActiveArc` serializado), `LevelWidthPositioningPlayModeTests` (posición de base enemiga derivada de `LevelWidth`), `TreasureSetPassiveBonusPlayModeTests` (bono aplicado de inmediato al completar un set en la victoria actual, y persistente en la siguiente batalla), `SaveDataNewFieldsRoundTripTests` (SC-005 — `obtainedTreasureIds`/`grantedTreasureSetIds` sobreviven guardar/cargar).
