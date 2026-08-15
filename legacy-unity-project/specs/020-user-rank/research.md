# Research: Sistema de Rango de Usuario

## §1. ¿El Rango de Usuario necesita un cálculo nuevo?

**Decisión**: no. `UserRankController.CurrentRank` delega íntegramente en `PlayerCharacterLevelCalculator.Calculate(ownedUnits, unitProgress)`, la misma función estática pura que `UnitLevelingController.CharacterLevel` ya usa desde `005-player-dashboard`.

**Rationale**: confirmado contra el código antes de diseñar esta feature (spec.md Assumptions) — la fórmula que el input de esta feature describe ("suma de los niveles de todas las unidades que el jugador posee") es exactamente la que `PlayerCharacterLevelCalculator.Calculate` ya implementa, línea por línea. Introducir un segundo cálculo (aunque fuera idéntico) duplicaría lógica ya probada y arriesgaría una divergencia futura si uno de los dos cambiara sin el otro. Esta es la razón por la que esta feature, pese a su nombre, no tiene ningún "Fase Foundational" de cálculo — su único trabajo de datos nuevo es la capa de umbrales/reclamos (§2-§4).

**Alternativas consideradas**:
- Un `UserRankCalculator` nuevo, potencialmente con lógica ligeramente distinta (por ejemplo, excluyendo unidades bonus desbloqueadas): rechazada — spec.md FR-001 exige explícitamente reutilizar el mismo cálculo; no hay ningún requisito que distinga "nivel de personaje" de "Rango de Usuario" en este proyecto, son el mismo concepto con dos nombres en dos puntos de la interfaz.

## §2. ¿Dónde vive la identidad de un umbral — el rango requerido o un id estable?

**Decisión**: un `m_ThresholdId: string` estable, distinto de `m_RequiredRank: int` — mismo patrón que `TreasureSetDefinition.SetId`/`ChapterDefinition.ChapterId`. `PlayerProgressSaveData.claimedThresholdIds: string[]` persiste por id, no por rango.

**Rationale**: si el registro de reclamos usara `m_RequiredRank` como clave y un diseñador reajustara ese valor más adelante (rebalance), un umbral ya reclamado con el rango antiguo dejaría de coincidir con el nuevo valor — permitiendo reclamar la misma recompensa dos veces bajo un nombre distinto. Un id estable, independiente del valor numérico que pueda rebalancearse, evita esta clase de bug por construcción (mismo motivo por el que `ChapterDefinition.ChapterId` es un string separado del contenido del capítulo, no derivado de sus stats).

## §3. ¿Por qué `UserRankController` es una clase instanciada con estado (como `TeamFormationController`), no una función estática pura (como los builders de `019-library-screens`)?

**Decisión**: clase instanciada, mismo patrón que `TeamFormationController`/`BattleItemSelectionController`, no una función estática como `CatGuideBuilder`/`TreasureMenuBuilder` (019).

**Rationale**: a diferencia de las bibliotecas de `019` (estrictamente de solo lectura, FR-007 de esa spec), esta feature tiene una operación de escritura real (`TryClaim`, FR-004/FR-006) que debe validar contra el estado cargado y persistir el resultado — exactamente el mismo motivo por el que `TeamFormationController.TryConfirmFormation`/`BattleItemSelectionController.TryConfirmSelection` (018) son clases con estado en vez de funciones puras (research.md §6 de `018`).

## §4. ¿Cómo se otorga la recompensa de objetos de batalla al reclamar un umbral?

**Decisión**: `UserRankController.TryClaim` añade `Reward.ItemId`/`RewardCount` a `PlayerProgressSaveData.battleItemInventory` con el mismo patrón idempotente de "buscar stack existente o añadir uno nuevo" que `BattleStateManager.GrantLevelRewards()` (`018-battle-items`) ya usa para `ChapterDefinition.BattleItemReward`.

**Rationale**: reutiliza el mismo tipo de dato (`BattleItemStack`) y la misma regla de negocio ("sumar a un stack existente del mismo `itemId`, o crear uno nuevo") ya establecida por `018` — no se introduce ningún concepto de inventario nuevo.

**Nota sobre duplicación aceptada**: el patrón de 4 líneas ("buscar stack, sumar o crear") queda duplicado entre `BattleStateManager.GrantLevelRewards()` (018) y `UserRankController.TryClaim()` (020) en vez de extraerse a un helper compartido. Mismo criterio que `016-combat-ability-catalog/research.md` §2 ya aplicó: con solo dos consumidores, extraer una abstracción compartida es la generalización especulativa que el Principio VI pide evitar — se revisita si aparece un tercer consumidor real.

## §5. ¿Dónde vive el catálogo de umbrales, y quién lo consulta?

**Decisión**: `UserRankRewardCatalog` (`ScriptableObject`, lista de `UserRankThreshold`), mismo patrón que `TreasureSetCatalog`. `PlayerBaseFlowController` lo referencia (`[SerializeField]`, opcional — `null` preserva el comportamiento sin umbrales, ningún reclamo posible, FR-010) e instancia `UserRankController` con él, mismo patrón que ya hace con `UnitUnlockCatalog`/`m_LevelingConfig`.

**Rationale**: mismo criterio de "catálogo pequeño y dedicado" que `UnitUnlockCatalog`/`TreasureSetCatalog`/`EnemyCatalog` (019) ya establecieron — evita mezclar la configuración de umbrales dentro de `ChapterDefinition` (que no tiene relación conceptual con el Rango de Usuario, un valor de cuenta, no de capítulo).

## §6. Riesgo conocido (heredado, no introducido por esta feature): actualizaciones perdidas entre controllers de `PlayerBaseFlowController`

**Observación** (`/speckit.analyze`, hallazgo A1): `UnitLevelingController`/`TeamFormationController`/`UnitEvolutionController` (005/009/013) ya cargan su propia copia de `PlayerProgressSaveData` en el constructor y la guardan de forma independiente al mutar — si dos de ellos mutan y guardan en la misma sesión de Base del Jugador sin recargar entre medias, el segundo `Save()` puede sobrescribir el cambio del primero con su copia desactualizada del resto de campos. `UserRankController` (esta feature) se suma al mismo patrón de instanciación (`PlayerBaseFlowController.Awake()`), no lo introduce.

**Decisión**: no se corrige aquí. Arreglarlo exigiría rediseñar el ciclo de vida de instanciación de los 4 controllers ya estables (005/009/013), fuera del alcance de esta feature. Se documenta como riesgo conocido para quien implemente `/speckit.tasks`: evitar, en la UI de la Base del Jugador, permitir una mutación de un controller mientras otro tiene una operación pendiente sin recargar — mismo cuidado que ya debería observarse hoy entre `Leveling`/`TeamFormation`/`Evolution`.
