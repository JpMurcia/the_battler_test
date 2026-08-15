# Research: Bibliotecas de Consulta (Cat Guide / Enemy Guide / Treasure Menu)

## §1. ¿Cómo se detecta que un enemigo "apareció en el carril" (Enemy Guide, FR-004)?

**Decisión**: un evento nuevo `EnemyWaveSpawner.EnemyEncountered: Action<UnitDefinition>`, disparado dentro del método privado ya existente `SpawnEnemy(UnitDefinition unit, float lanePosition)` — mismo punto para oleada normal y para oleada de refuerzo por umbral de vida (013), porque ambas ya pasan por ese único método.

**Rationale**: `SpawnEnemy` es el único lugar del código donde un enemigo pasa a existir en el carril (`UnitRuntimePool.Get` + `Initialize`) — es exactamente la definición de "enfrentado" que spec.md fija (Edge Cases: ni "planeado en la oleada" ni "derrotado"). Un evento (mismo patrón que `ThresholdWaveTriggered`, ya existente en la misma clase) evita acoplar `EnemyWaveSpawner` a `IPlayerProgressStore` — la persistencia la resuelve quien escuche el evento (`BattleStateManager`, que ya tiene esa dependencia), no el spawner.

**Alternativas consideradas**:
- Marcar "enfrentado" cuando el enemigo es derrotado (`ApplyDamage` reduce su vida a 0): rechazada — spec.md Edge Cases exige explícitamente que aparecer baste, independientemente de si la batalla se gana o se pierde.
- Marcar "enfrentado" al leer `EnemyWaveDefinition.WaveEntries` al iniciar la batalla (antes de que ocurra el spawn real): rechazada — spec.md US2 Escenario 3 exige explícitamente que un enemigo planeado pero nunca generado (batalla terminada antes de su `spawnTimeSeconds`) no cuente.

## §2. ¿Dónde se persiste el registro de enemigos enfrentados?

**Decisión**: campo nuevo `encounteredEnemyIds: string[]` en `PlayerProgressSaveData`, aditivo, sin bump de `formatVersion` — mismo patrón que `obtainedTreasureIds`/`unlockedBonusUnitIds`. `BattleStateManager` se suscribe a `EnemyWaveSpawner.EnemyEncountered` (misma clase que ya orquesta `ThresholdWaveTriggered` hoy, research.md de `013`) y añade `unit.UnitId` de forma idempotente (mismo guard `Array.IndexOf(...) < 0` ya usado para tesoros).

**Rationale**: mismo criterio de "un array nuevo con default vacío no rompe ningún save existente" ya aplicado en `013`/`014`/`018`.

## §3. ¿Cómo resuelve Enemy Guide un `enemyId` a su `UnitDefinition` para mostrar sus stats?

**Decisión**: catálogo nuevo `EnemyCatalog` (`ScriptableObject`, `UnitDefinition[] m_Enemies`, método `Resolve(string enemyId) : UnitDefinition`), mismo patrón que `UnitUnlockCatalog` pero sin la envoltura `UnitUnlockEntry` (`UnitDefinition.UnitId` ya es la clave — no hace falta duplicarla en una entrada intermedia, research.md de `018-battle-items` ya aplicó el mismo criterio de simplificación al no envolver `BattleItemDefinition`).

**Rationale**: `PlayerProgressSaveData.encounteredEnemyIds` solo guarda strings (mismo criterio que el resto de registros de progreso) — hace falta un catálogo de solo lectura para poder mostrar los stats reales de cada id. Poblarlo con los `UnitDefinition` ya usados como enemigos en `001`-`014` es responsabilidad de contenido (`/speckit.tasks`), no de diseño nuevo — ningún enemigo nuevo se crea en esta feature.

## §4. ¿Cat Guide muestra stats base o efectivas (nivel/evolución actual)?

**Decisión**: efectivas — `UnitDefinition.GetEffectiveCombatProfile(evolutionStage)` (009), con `evolutionStage` resuelto vía `UnitEvolutionController.GetEvolutionStage(unitId)` (ya existente, expuesto por `PlayerBaseFlowController.Evolution`), más el nivel actual vía `UnitLevelingController.GetUnitLevel(unitId)` (ya existente, `PlayerBaseFlowController.Leveling`).

**Rationale**: es la información que realmente ayuda a decidir formación de equipo (spec.md US1 Why-priority) — mostrar solo stats base sería menos útil y además ya calculable indirectamente por el jugador desde el propio dashboard; reutiliza controllers ya construidos por `005`/`009` sin ninguna lógica de cálculo nueva.

## §5. ¿Por qué Enemy Guide muestra stats *base*, sin escalar por arco, a diferencia de Cat Guide?

**Decisión**: `EnemyGuideEntry` expone `UnitDefinition.Damage`/`MaxHealth` sin aplicar `SagaArcDefinition.EnemyStrengthMultiplier` (013).

**Rationale**: un mismo enemigo (`UnitDefinition`) puede reaparecer en capítulos distintos con multiplicadores de arco distintos (`UnitCombatProfile.Scaled`, 013) — Enemy Guide identifica al enemigo por su `UnitId` una única vez (FR-003, "cada enemigo" no "cada combinación enemigo+arco"), así que no hay un único "multiplicador vigente" que mostrar de forma consistente sin más contexto que esta feature no pide (ver spec.md Assumptions). Mostrar los stats base evita tener que decidir arbitrariamente "cuál" de los varios escalados posibles mostrar.

## §6. ¿Por qué `CatGuideBuilder`/`EnemyGuideBuilder`/`TreasureMenuBuilder` son clases estáticas puras, no controllers instanciados?

**Decisión**: tres clases estáticas con un único método `Build(...)` cada una, sin estado propio — mismo patrón que `TreasureSetProgressEvaluator`/`EventBannerActivationEvaluator` (evaluadores puros ya existentes en el proyecto), no el patrón de `TeamFormationController`/`BattleItemSelectionController` (clases instanciadas con estado cargado en el constructor).

**Rationale**: las tres bibliotecas son estrictamente de solo lectura (FR-007) y no necesitan mutar ni recordar nada entre llamadas — recalculan su lista completa cada vez que la pantalla se abre (FR-008), que es exactamente el contrato de una función pura sobre los datos ya cargados (`IReadOnlyList<UnitDefinition>`, `PlayerProgressSaveData`, catálogos). Instanciar un controller con estado propio para un caso de uso sin estado sería la complejidad innecesaria que el Principio VI pide evitar.

**Alternativas consideradas**: un controller por biblioteca, instanciado por `PlayerBaseFlowController` (mismo patrón que `TeamFormationController`): rechazada — ninguna de las tres bibliotecas necesita persistir nada ni exponer un método de mutación (`TryConfirmFormation`/`TryConfirmSelection`); la única razón de esos controllers para existir como clases con estado es que envuelven una operación de escritura, que aquí no existe.
