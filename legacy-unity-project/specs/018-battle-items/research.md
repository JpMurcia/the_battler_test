# Research: Sistema de Objetos de Batalla

## §1. ¿Dónde vive el inventario de objetos de batalla del jugador?

**Decisión**: campo nuevo `battleItemInventory: BattleItemStack[]` en `PlayerProgressSaveData`, aditivo, sin bump de `formatVersion`.

**Rationale**: mismo criterio que `unlockedBonusUnitIds` (013) y `obtainedTreasureIds`/`grantedTreasureSetIds` (014) — un array nuevo con default vacío no rompe ningún save ya persistido de `001`-`017`. `BattleItemStack` (par `itemId`/`count`, clase `[Serializable]` plana) sigue el mismo patrón que `UnitProgress` en vez de un `Dictionary<string,int>` (Unity serializa mal diccionarios genéricos sin envoltura adicional — mismo motivo ya documentado en `016-combat-ability-catalog/research.md` §1).

**Alternativas consideradas**:
- Un contador por tipo de objeto como campo individual (`int m_SpeedBoostCount`, `int m_ExtraResourceCount`, ...): rechazada — no escala a "al menos 3 objetos distintos, ampliable después" (FR-002/Assumptions); cada objeto nuevo futuro requeriría un campo de guardado nuevo en vez de una entrada más en un array ya genérico.

## §2. ¿Cómo cruza la selección de objetos la frontera entre la pantalla de preparación y la escena de batalla?

**Decisión**: reutilizar `BattleLaunchContext` (puente estático ya existente, `014-chapter-scaling-treasure-sets`), con un campo nuevo `SelectedBattleItemIds: string[]`.

**Rationale**: el proyecto no tiene un framework de inyección de parámetros de escena — `BattleLaunchContext.RequestedArc`/`ZombieOutbreakRequested` ya resuelven exactamente este mismo problema (puente entre la pantalla de selección de nivel y `BattleStateManager.SetupChapter()`, consumido y reseteado en el mismo frame). Un campo adicional en la misma clase estática es la extensión mínima de un patrón ya validado, en vez de introducir un segundo mecanismo de paso de datos entre escenas.

**Alternativas consideradas**:
- `PlayerPrefs`/persistencia intermedia para pasar la selección: rechazada — la selección no debe sobrevivir más que el frame de transición (si el jugador nunca llega a `SetupChapter()`, no debe quedar una selección fantasma para la próxima batalla); un campo estático en memoria, reseteado al consumirse, ya se comporta así sin persistencia adicional.

## §3. ¿En qué momento se descuenta el inventario — al confirmar la selección o al entrar a la batalla?

**Decisión**: al entrar a la batalla, dentro de `BattleStateManager.SetupChapter()` — no en el controller de selección de la pantalla de preparación.

**Rationale**: FR-006 lo exige explícitamente, y es el mismo criterio que `006-mission-energy-system` ya estableció para el costo de energía (`TrySelectBanner` descuenta al entrar a la misión, no al seleccionar el banner en el mapa). Confirmar una selección en la pantalla de preparación es reversible (el jugador puede cambiar de opinión antes de entrar a la batalla); entrar efectivamente a la batalla no lo es.

## §4. ¿Cómo se aplica el efecto de cada categoría de objeto?

**Decisión**: tres mecanismos distintos, uno por categoría, todos resueltos dentro de `BattleStateManager`:

- **Combate ("Aceleración de Velocidad")**: un multiplicador de velocidad de sesión nuevo, expuesto por una clase estática nueva `BattleSessionModifiers` (mismo patrón estático que `LaneRegistry`, ya usado para estado compartido dentro de una batalla en curso) — `UnitRuntime.Move()` multiplica `c_MoveSpeed` por `BattleSessionModifiers.MoveSpeedMultiplier` (default `1f`). `SetupChapter()` lo fija una vez, antes de que se instancie ninguna unidad.
- **Recurso inicial ("Dinero Extra")**: un método nuevo `BattleResourceController.AddInstantResource(float amount)` (mismo criterio que `ApplyPassiveRegenBonus` ya existente, pero suma directamente a `m_CurrentAmount` en vez de a `m_RegenPerSecond`), invocado una única vez en `SetupChapter()`.
- **Recompensa ("Radar de Tesoro")**: un campo privado nuevo en `BattleStateManager` (`m_BonusTreasureRequested`), fijado en `SetupChapter()` y consumido en `GrantLevelRewards()` al resolver la victoria (ver §5).

**Rationale**: cada categoría ya tiene un punto de inserción natural en el código existente (`Move()` para velocidad, `BattleResourceController` para recurso, `GrantLevelRewards()` para recompensa) — no se introduce ninguna capa de "sistema de efectos de objeto" genérica, mismo criterio de Principio VI que `016-combat-ability-catalog/research.md` §4 ya aplicó a los efectos de habilidad.

**Alternativas consideradas**:
- Un `IBattleItemEffect` con un método `Apply(BattleStateManager)` implementado por cada categoría (patrón Strategy): rechazada — con solo 3 categorías y un mecanismo de aplicación distinto y ya simple para cada una, la abstracción no ahorra código real, solo indirección; mismo criterio de generalización especulativa rechazada en `research.md` de `015`/`016`.

## §5. ¿De dónde sale el tesoro adicional de "Radar de Tesoro", y qué pasa si no queda ninguno pendiente?

**Decisión**: la unión de `TreasureSetDefinition.TreasureIds` de todos los `m_TreasureSetCatalog.Sets` (mismo catálogo opcional que `014-chapter-scaling-treasure-sets` ya usa), filtrando los que el jugador aún no tiene en `obtainedTreasureIds`. Si la lista resultante está vacía (o `m_TreasureSetCatalog` es `null`), no se otorga nada — no es un error (FR-010).

**Rationale**: reutiliza el catálogo de tesoros ya existente sin introducir una segunda fuente de datos de tesoros; el mismo criterio de "no-op silencioso cuando no hay nada pendiente" que `014` ya aplicó a la evaluación de sets completos (`TreasureSetProgressEvaluator.IsSetComplete` devuelve `false` sin lanzar cuando no hay datos).

## §6. ¿Qué pasa con el efecto de un objeto de batalla si el jugador reintenta la batalla tras una derrota?

**Decisión**: tanto "Aceleración de Velocidad" como "Dinero Extra" siguen activos en un reintento (`RetryBattle()`) de la misma entrada a la batalla — ninguno de los dos se pierde ni se vuelve a cobrar del inventario.

**Rationale**: `RetryBattle()` (FR-013 de `001-chapter1-vertical-slice`) llama a `m_ResourceController.ResetResource()`, que borra incondicionalmente `m_CurrentAmount` — sin corrección, esto eliminaría el efecto de "Dinero Extra" en cualquier reintento, mientras que `BattleSessionModifiers.MoveSpeedMultiplier` (estático, no tocado por `RetryBattle()`) seguiría activo — una inconsistencia observable entre dos objetos de la misma feature detectada al diseñar este plan, antes de llegar a `/speckit.tasks`. Dado que el objeto ya se descontó del inventario una única vez al entrar a la batalla (FR-006, sin reembolso ya documentado en spec.md), el criterio más consistente es que su efecto cubra "esta entrada a la batalla", incluidos sus reintentos — no solo el primer intento.

**Solución de diseño**: `BattleStateManager` cachea `m_GrantedInstantResourceAmount` (float, runtime, no serializado) al procesar los objetos seleccionados en `SetupChapter()` — mismo patrón ya usado por `m_DesignRegenPerSecond` en `BattleResourceController` para sobrevivir a `ResetResource()`. `RetryBattle()` gana una línea nueva que reaplica ese monto cacheado inmediatamente después de `m_ResourceController.ResetResource()` (ver `contracts/battle-item-effects.md`).

## §7. ¿Por qué un `BattleItemSelectionController` nuevo en vez de extender `TeamFormationController`?

**Decisión**: clase nueva, mismo patrón que `TeamFormationController` (clase plana, no `MonoBehaviour`, instanciada por `PlayerBaseFlowController`), pero independiente.

**Rationale**: `TeamFormationController` ya está testeado y estable, y su dominio (qué unidades del roster entran al equipo) es conceptualmente distinto del de esta feature (qué consumibles del inventario se llevan a la próxima batalla) — mismo criterio de "no tocar un archivo ya probado sin necesidad real" que `016-combat-ability-catalog` aplicó al no generalizar `Immunity` para cubrir `Resistance`.
