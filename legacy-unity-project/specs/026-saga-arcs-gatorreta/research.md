# Phase 0 Research: Arcos de Saga y Gatorreta en la Versión Web

**Input**: [spec.md](./spec.md) · Código fuente de `013-empire-of-cats-saga` en Unity: `Assets/Scripts/Model/Battler/SagaArc*.cs`, `Assets/Scripts/Gameplay/Battler/SagaArcProgressEvaluator.cs`, `Assets/Scripts/Gameplay/Battler/GatorretaController.cs`, `Assets/Scripts/Gameplay/Battler/BattleResourceController.cs` (`TryUpgradeRegen`/`ApplyPassiveRegenBonus`) · Contexto ya fijado por `024/research.md`+`data-model.md` y `025/research.md`+`data-model.md`.

## Decisión 1: Multiplicadores de arco — ya plumbed en `024`, esta spec solo añade selección y contenido

**Decisión**: No hay lógica de escalado nueva que portar. `specs/024-react-web-migration/plan.md` ya reserva `unitCostMultiplier` como parámetro de `UnitDeploymentController`/`unitDeployment.ts` (T017) y `enemyStrengthMultiplier` como parámetro de `EnemyWaveSpawner`/`enemyWaveSpawner.ts` (T018) y del escalado de salud de base enemiga en `setupChapter` (T024) — exactamente los mismos dos multiplicadores que `SagaArcDefinition` expone. Lo que esta spec añade es (a) el **catálogo** `SagaArcCatalog` como contenido estático (aún no exportado por `024`), y (b) **cómo se resuelve qué arco está activo** para una entrada a batalla dada.

**Razón**: Confirmado leyendo `SagaArcDefinition.cs` — sus dos multiplicadores (`UnitCostMultiplier`, `EnemyStrengthMultiplier`) son los mismos nombres que `024/data-model.md` ya documentó como parámetros de `battleSession.setupChapter`. Duplicar esa lógica sería una desviación del propio port ya planificado.

## Decisión 2: Resolución del arco activo — selección de nivel, con fallback fijo por capítulo

**Decisión**: Portar el patrón exacto de `BattleStateManager.SetupChapter` (línea 150, ya documentado en `024/data-model.md` § BattleSession): el arco solicitado por la pantalla de selección de nivel (equivalente web: `state` de navegación de `react-router` al entrar a `/battle/:chapterId`) tiene prioridad sobre un arco fijo asociado al capítulo en el contenido estático; se resuelve y se descarta en el mismo montaje de `battleSession.setupChapter` (mismo patrón "consumido y reseteado en el mismo frame" ya usado por `BattleLaunchContext` en `024`/`025`) — no queda como estado persistente entre batallas.

**Razón**: Preserva el mismo comportamiento que Unity: un capítulo puede jugarse "suelto" (sin arco, multiplicadores neutros — spec.md FR-003) o "dentro de un arco" según desde dónde se accedió, sin que el capítulo en sí necesite dos definiciones distintas.

## Decisión 3: Finalización de arco — función pura derivada, nunca un booleano guardado

**Decisión**: Portar `SagaArcProgressEvaluator` (Unity: clase estática, ya sin `MonoBehaviour`) 1:1 a `src/engine/sagaArcProgress.ts` — **esta función ya estaba planificada en `024`** (`research.md` Decisión 6 y `tasks.md` T011 la listan explícitamente). Esta spec no la vuelve a crear, solo la **usa**: `isArcCompleted(arc, progress)` recorre `arc.levels[]` y exige que cada uno tenga un `ChapterProgressRecord.isCompleted === true` en `progress.chapters[]` (nunca se cachea un booleano de "arco completo" en el guardado); `hasRewardsGranted(arcId, progress)` consulta `progress.arcs[]` (`SagaArcProgressRecord`, ya declarado como parte de `ProgressSaveData` en `024/data-model.md`).

**Razón**: Es exactamente el mismo patrón "derivado, no cacheado" que `025/research.md` Decisión 3 ya estableció para sets de tesoros — consistente entre ambas spec de extensión, y ya validado en el C# original con el comentario explícito "isCompleted del arco NO se persiste... solo 'recompensas ya otorgadas' exige persistencia propia".

## Decisión 4: Otorgamiento de recompensas de arco — mismo punto del flujo de victoria que `025` ya extendió

**Decisión**: Portar `BattleStateManager.TryGrantArcRewardsIfCompleted` (líneas 504-527 del original, ya referenciado como pendiente en `024/data-model.md` § BattleSession) dentro del mismo flujo de recompensas de victoria que `025/plan.md` ya extiende para sets de tesoros — un paso más en la misma función, no una función paralela: si hay un arco activo, `isArcCompleted()` es verdadero, y `hasRewardsGranted()` es falso, entonces registrar el arco como recompensado (monótono) y añadir cada unidad de `arcCompletionUnitUnlocks` a `unlockedBonusUnitIds` (deduplicado) — las `arcCompletionFeatureFlags` se guardan como lista de banderas opacas (ver Decisión 6).

**Razón**: Evita crear un segundo punto de guardado paralelo al que `025` ya definió para el otorgamiento de sets — ambos ocurren "tras cada victoria, antes de notificar a los listeners", mismo momento exacto que el C# original.

## Decisión 5: Gatorreta — bucle de tick propio, independiente del bucle de combate de unidades

**Decisión**: Portar `GatorretaController` a `src/engine/specialAreaWeapon.ts` como una pequeña máquina de estado con tick propio (`tick(deltaSeconds)`, análogo al patrón ya fijado en `024/research.md` Decisión 4 para el resto del motor): `rechargeRemaining` decrece cada tick hasta 0, momento en que emite `available`; `tryActivate()` es no-op si `rechargeRemaining > 0`, de lo contrario aplica `areaDamage` a todo objetivo enemigo dentro de `range` de la posición de la base del jugador y reinicia `rechargeRemaining = rechargeSeconds`. La búsqueda de objetivos en rango (`LaneRegistry.FindAllTargetsInRange` en Unity) reutiliza cualquier estructura de "unidades activas en el carril" que ya exponga `battleSession` para el combate normal (`024` `UnitRuntime`/`UnitSprite`), sin una segunda fuente de verdad de posiciones.

**Razón**: `GatorretaController` en Unity ya es independiente de `UnitRuntime` (comentario explícito: "Sin relación de herencia con `BattleResourceController` — dominios distintos: arma vs. economía") — el port respeta esa misma separación, evitando acoplarlo al pipeline de daño de unidad a unidad ya portado en `024` T020 (`combat/damage.ts`), que tiene sus propias reglas de crítico/clasificación que no aplican aquí (el daño de área de la Gatorreta es un valor fijo configurado, sin multiplicadores de clasificación).

## Decisión 6: Banderas de finalización de arco — opacas, sin intérprete

**Decisión**: `arcCompletionFeatureFlags: string[]` se persiste tal cual en el guardado (extiende `PlayerProgressSaveData` o vive junto a `SagaArcProgress` — a definir en `data-model.md`) sin ningún código que las lea para modificar comportamiento. En particular, se **verificó en el código fuente** (`UnitLevelingController.cs`) que no existe ningún mecanismo ya implementado que use estas banderas para, por ejemplo, elevar `UnitLevelingConfig.MaxLevel` — a pesar de que `013-empire-of-cats-saga` spec.md FR-018 describe esa intención de diseño en prosa, no hay código que la ejecute hoy.

**Razón**: Portar únicamente lo que el código realmente hace, no lo que la spec de diseño narra sin implementación verificable — evita que el port web "invente" un comportamiento que ni siquiera la versión Unity actual ejecuta. Si se necesita esa función a futuro, requiere su propia spec (mismo criterio que `spec.md` Assumptions ya declara).

## Decisión 7: Mejora de regeneración — extiende `battleResource.ts` ya creado en `024`, sin store nuevo

**Decisión**: Añadir `tryUpgradeRegen(cost, regenIncrease)` a `src/engine/battleResource.ts` (ya creado por `024` T016): atómico — o gasta `cost` del recurso actual y suma `regenIncrease` a la tasa de regeneración, o no hace nada si el recurso es insuficiente (mismo criterio atómico que `trySpend`, ya documentado en `024`). El reset de recurso al reintentar (`retryBattle`, `024` T024) ya restaura la tasa de regeneración a su línea base de diseño — este comportamiento **no cambia**, solo se confirma que la mejora comprada no forma parte de esa línea base (a diferencia de la bonificación pasiva de sets de tesoros de `025`, que sí se reincorpora a la línea base restaurada).

**Razón**: `BattleResourceController.TryUpgradeRegen`/`ResetResource` en Unity ya distinguen explícitamente estos dos casos con un comentario dedicado: la mejora de regen es "efímera, solo dura la partida en curso" mientras que el bono de sets de tesoros "es permanente y debe sobrevivir `ResetResource()`". El port debe preservar esa distinción exacta — invertirla rompería spec.md US4 Acceptance Scenario 3.
