# Phase 0 Research: Sets de Tesoros y Objetos de Batalla en la Versión Web

**Input**: [spec.md](./spec.md) · Código fuente de `014-chapter-scaling-treasure-sets` y `018-battle-items` en Unity: `Assets/Scripts/Model/Battler/TreasureSet*.cs`, `Assets/Scripts/Model/Battler/BattleItem*.cs`, `Assets/Scripts/Core/Battler/BattleItemCategory.cs`, `Assets/Scripts/Gameplay/Battler/BattleItemSelectionController.cs` · Contexto ya fijado por `specs/024-react-web-migration/research.md` y `data-model.md`.

## Decisión 1: Sin dominio de guardado nuevo — extiende `PlayerProgressSaveData` ya definido en `024`

**Decisión**: Ni los sets de tesoros ni los objetos de batalla necesitan una clave nueva de `localStorage`. Los tres campos que ya usan (`obtainedTreasureIds`, `grantedTreasureSetIds`, `battleItemInventory: { itemId, count }[]`) ya están declarados en `specs/024-react-web-migration/data-model.md` § `PlayerProgressSaveData`, porque el DTO original de Unity ya los incluye (se añadieron ahí de forma aditiva por las specs 014/018 sin subir `formatVersion`, siguiendo el patrón general documentado en `024`).

**Razón**: Confirmado leyendo `TreasureSetProgressEvaluator.cs` y `BattleItemSelectionController.cs` — ambos operan directamente sobre `PlayerProgressSaveData`, no sobre un store propio. Portar un store nuevo sería una desviación innecesaria del propio código fuente.

## Decisión 2: Selección de objetos de batalla es efímera, no un dominio de guardado

**Decisión**: La selección de hasta 3 objetos para la próxima batalla vive solo en memoria del lado del cliente (estado de React/router, análogo a `BattleLaunchContext.SelectedBattleItemIds` de Unity — ya documentado como patrón "consumido y reseteado en el mismo frame" en `024` `data-model.md`), no en `localStorage`. Se resuelve (consume del inventario) recién al montar la pantalla de batalla, nunca en la pantalla de preparación.

**Razón**: `BattleItemSelectionController.TryConfirmSelection` (Unity) valida en memoria contra el inventario ya cargado y **no llama a `Save`** — el comentario del propio archivo lo dice explícitamente: "el descuento ocurre en `BattleStateManager.SetupChapter()`, al entrar efectivamente a la batalla". Esto ya resuelve el Edge Case de `spec.md` ("si vuelve atrás sin entrar a la batalla, el objeto sigue disponible sin descontar") sin ningún manejo especial — es simplemente que la selección nunca se persistió.

## Decisión 3: Reevaluación de sets de tesoros — función pura reutilizando `obtainedTreasureIds`

**Decisión**: Portar `TreasureSetProgressEvaluator` (Unity: `TheBattler.Model`, ya sin `MonoBehaviour`) 1:1 a `src/engine/treasureSetProgress.ts` con dos funciones puras: `isSetComplete(set, playerProgress)` (todo `treasureIds` ⊆ `obtainedTreasureIds`) y `hasRewardsGranted(setId, playerProgress)` (`setId` ∈ `grantedTreasureSetIds`). Deliberadamente **no** hacer que `hasRewardsGranted` dependa de `isSetComplete` — un set reconfigurado con un tesoro nuevo puede volver a estar "incompleto" sin que eso retire una bonificación ya concedida (spec.md US1 Acceptance Scenario 3).

**Razón**: Es exactamente el comportamiento ya implementado y comentado en el C# original (`grantedTreasureSetIds es monotono ... esta consulta no depende de IsSetComplete`) — cualquier otra implementación cambiaría comportamiento observable para el jugador.

## Decisión 4: La bonificación pasiva se reaplica al entrar a CADA batalla, no solo al otorgarse

**Decisión**: `battleSession.setupChapter()` (definido en `024` `plan.md`/`tasks.md` T024) debe sumar `passiveRegenBonus` de cada set con `hasRewardsGranted() === true` y llamar `battleResource.applyPassiveRegenBonus(total)` — **antes** de que el jugador pueda desplegar la primera unidad, en cada entrada a batalla (incluida cada partida nueva, no solo la primera vez que se otorgó).

**Razón**: `BattleStateManager.SetupChapter` (líneas 198-209 del archivo Unity) hace exactamente esto en cada llamada — es una decisión de diseño explícita (el bono no queda "grabado" en el recurso entre sesiones, se reconstruye cada vez desde `grantedTreasureSetIds`), no un efecto secundario incidental.

## Decisión 5: Otorgamiento de sets ocurre dentro del mismo flujo de recompensas de victoria que `024` ya reservó

**Decisión**: La evaluación de sets recién completados vive dentro de `battleSession`'s equivalente a `GrantLevelRewards` (ya identificado como paso 5 del flujo en `specs/024-react-web-migration/data-model.md` § BattleSession, marcado ahí como "subconjunto sin sets de tesoro" pendiente de esta spec). Al ganar: por cada set en el catálogo, si `isSetComplete()` y no `hasRewardsGranted()`, añadir su `setId` a `grantedTreasureSetIds` (monótono) y aplicar su bono de inmediato a la sesión activa (no solo a la próxima) — mismo orden que el C# original (líneas 409-428: evalúa todos los sets, guarda una sola vez al final si se otorgó alguno).

**Razón**: Preserva el comportamiento de spec.md US1 Acceptance Scenario 1 ("activo desde esa misma batalla, incluido un reintento posterior") — si solo se aplicara en el próximo `setupChapter`, un reintento inmediato tras la victoria no reflejaría el bono nuevo.

## Decisión 6: "Radar de Tesoro" — selección aleatoria entre pendientes de TODOS los sets, solo en victoria

**Decisión**: Portar la lógica de `GrantLevelRewards` (líneas 462-489 del C# original) 1:1: si el objeto `BonusTreasure` fue seleccionado para esta entrada y la batalla termina en victoria, construir el conjunto de todos los `treasureIds` de todos los sets del catálogo, filtrar los que el jugador aún no tiene en `obtainedTreasureIds`, y si la lista de pendientes no está vacía, elegir uno al azar (`Math.random()` en el port — sin requisito de determinismo, igual que el `Random.Range` de Unity) y añadirlo a `obtainedTreasureIds`. Si la lista de pendientes está vacía, no-op sin error (spec.md Edge Case ya lo cubre).

**Razón**: Es el comportamiento ya clarificado explícitamente en `018-battle-items` (`Clarifications` § Session 2026-08-05, opción B elegida) — un tesoro *adicional* a lo que el nivel ya otorga, no un duplicado del `TreasureRewardId` normal.

## Decisión 7: Consumo de inventario — un solo punto, al entrar a la batalla

**Decisión**: El descuento de cantidad (`stack.count -= 1` por cada `itemId` seleccionado) ocurre en un único punto del port: al inicio de `battleSession.setupChapter()`, antes de aplicar cualquier efecto — igual que el C# original resuelve el catálogo (`BattleItemCatalog.tryGetItem`), descuenta si hay stock real (defensivo: `stack == null || stack.count <= 0` → se ignora sin error), y solo entonces aplica el efecto según categoría (`SpeedBoost`/`ExtraResource`/`BonusTreasure`). En un reintento (`retryBattle`), este paso **no se repite** — los efectos ya aplicados (`moveSpeedMultiplier`, `grantedInstantResourceAmount`) se conservan/reaplican desde el estado de sesión ya calculado, sin volver a tocar el inventario.

**Razón**: Confirmado por el propio flujo de `BattleStateManager.RetryBattle` (ya documentado en `024` `data-model.md`: "reaplica el bono de 'Dinero Extra' ya otorgado — `ResetResource()` lo habría borrado"), preservando spec.md US3 Acceptance Scenario 5.
