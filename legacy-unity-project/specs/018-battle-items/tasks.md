---

description: "Task list template for feature implementation"
---

# Tasks: Sistema de Objetos de Batalla

**Input**: Design documents from `/specs/018-battle-items/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/battle-item-selection.md](./contracts/battle-item-selection.md), [contracts/battle-item-effects.md](./contracts/battle-item-effects.md), [quickstart.md](./quickstart.md)

**Tests**: Incluidos — mismo patrón de verificación real (EditMode/PlayMode) ya establecido en 001-017.

**Organization**: Tareas agrupadas por historia de usuario (US1-US3, según spec.md) para permitir implementación y prueba independientes de cada una.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: Historia de usuario a la que pertenece la tarea
- Cada tarea incluye la ruta exacta del archivo

## Path Conventions

Proyecto único de Unity — capas `Assets/Scripts/{Core,Model,Gameplay,View}/Battler/`, herramientas de contenido en `Assets/Editor/Battler/`, tests en `Assets/Tests/{EditMode,PlayMode}/Battler/`, según [plan.md § Project Structure](./plan.md#project-structure).

---

## Phase 1: Setup

**Purpose**: Confirmar línea base antes de tocar código.

- [ ] T001 Correr la suite EditMode + PlayMode existente (001-017) en modo batch de Unity sobre `C:\Users\Usuario\Documents\GitHub\IA GAME\the_battler_test` y confirmar que sigue en verde antes de empezar, como línea base de referencia.

**Checkpoint**: Línea base verde confirmada antes de tocar código.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Los tipos de datos compartidos por las 3 historias de usuario — categoría, definición/catálogo de objetos, inventario y el puente de cruce de escena. Ninguna historia puede implementarse ni probarse sin esto.

**⚠️ CRITICAL**: Ninguna tarea de Fase 3+ puede empezar hasta completar esta fase.

- [X] T002 [P] Crear el enum `BattleItemCategory` (`SpeedBoost`, `ExtraResource`, `BonusTreasure`) en `Assets/Scripts/Core/Battler/BattleItemCategory.cs`, según [data-model.md § BattleItemCategory](./data-model.md#battleitemcategory-nuevo-enum-assetsscriptscorebattlerbattleitemcategorycs)
- [X] T003 [P] Crear `BattleItemDefinition` (`ScriptableObject`: `m_ItemId`, `m_DisplayNameKey`, `m_Category`, `m_Magnitude`; `IsValid`) en `Assets/Scripts/Model/Battler/BattleItemDefinition.cs`, según [data-model.md § BattleItemDefinition](./data-model.md#battleitemdefinition-nuevo-scriptableobject-assetsscriptsmodelbattlerbattleitemdefinitioncs) — depende de T002
- [X] T004 [P] Crear `BattleItemStack` (clase `[Serializable]` plana: `itemId`, `count`) en `Assets/Scripts/Model/Battler/BattleItemStack.cs`, según [data-model.md § BattleItemStack](./data-model.md#battleitemstack-nuevo-serializable-plano-assetsscriptsmodelbattlerbattleitemstackcs)
- [X] T005 Crear `BattleItemCatalog` (`ScriptableObject`: `m_Items: BattleItemDefinition[]`; método `TryGetItem(string, out BattleItemDefinition)`) en `Assets/Scripts/Model/Battler/BattleItemCatalog.cs`, mismo patrón que `TreasureSetCatalog`/`UnitUnlockCatalog` — depende de T003
- [X] T006 [P] Añadir `battleItemInventory: BattleItemStack[]` (default vacío) a `Assets/Scripts/Model/Battler/PlayerProgressSaveData.cs`, sin bump de `formatVersion` — depende de T004
- [X] T007 [P] Añadir `SelectedBattleItemIds: string[]` (propiedad estática) a `Assets/Scripts/Gameplay/Battler/BattleLaunchContext.cs`, mismo patrón que `RequestedArc`/`ZombieOutbreakRequested`

**Checkpoint**: Tipos de datos y puente de escena listos — las 3 historias de usuario pueden empezar.

---

## Phase 3: User Story 1 - Seleccionar objetos de batalla antes de entrar a un nivel (Priority: P1) 🎯 MVP

**Goal**: El jugador selecciona, hasta un límite máximo, objetos de batalla de su inventario desde el flujo de preparación pre-batalla, con la selección quedando lista para la siguiente batalla.

**Independent Test**: Con al menos un objeto de batalla en inventario, entrar al flujo de preparación pre-batalla, seleccionarlo y confirmar que queda marcado como elegido (spec.md US1).

### Tests for User Story 1 ⚠️

- [X] T008 [P] [US1] EditMode test en `Assets/Tests/EditMode/Battler/BattleItemSelectionControllerTests.cs` (archivo nuevo): `TryConfirmSelection` acepta una lista vacía (FR-004); rechaza una lista que excede `c_MaxSelectableItems` (FR-007); rechaza seleccionar más unidades de un `itemId` que las disponibles en `battleItemInventory` (FR-007); acepta seleccionar dos unidades del mismo `itemId` si el inventario tiene al menos esa cantidad (Edge Case); tras una confirmación válida, `BattleLaunchContext.SelectedBattleItemIds` refleja exactamente la selección — depende de T006, T007

### Implementation for User Story 1

- [X] T009 [US1] Crear `BattleItemSelectionController` (clase plana, no `MonoBehaviour`, mismo patrón que `TeamFormationController`: constructor `(IPlayerProgressStore)` — sin `BattleItemCatalog`, no lo necesita para validar cantidades —, propiedad `Inventory`, método `TryConfirmSelection(IReadOnlyList<string>) : bool`) en `Assets/Scripts/Gameplay/Battler/BattleItemSelectionController.cs`, según [contracts/battle-item-selection.md](./contracts/battle-item-selection.md) (hace pasar T008) — depende de T006, T007

**Checkpoint**: US1 completa y verificable de forma independiente — la selección se valida y cruza a `BattleLaunchContext` correctamente.

---

## Phase 4: User Story 2 - Un objeto de batalla seleccionado surte su efecto desde el inicio de la batalla (Priority: P1) 🎯 MVP

**Goal**: Los objetos de combate/recurso surten efecto desde el inicio de la batalla; "Radar de Tesoro" otorga un tesoro adicional aleatorio al ganar.

**Independent Test**: Seleccionar un objeto de efecto observable y confirmar su efecto activo desde el primer instante de la batalla (o al ganar, para "Radar de Tesoro") (spec.md US2).

### Tests for User Story 2 ⚠️

- [X] T010 [P] [US2] PlayMode test en `Assets/Tests/PlayMode/Battler/BattleItemEffectsBattlePlayModeTests.cs` (archivo nuevo): Escenario Velocidad ("Aceleración de Velocidad" seleccionada ⇒ `BattleSessionModifiers.MoveSpeedMultiplier` aplicado y unidades desplegadas se mueven más rápido desde el primer despliegue), Escenario Recurso ("Dinero Extra" seleccionada ⇒ `BattleResourceController.CurrentAmount` mayor que 0 en el primer frame de la batalla), Escenario Radar-con-pendientes ("Radar de Tesoro" seleccionada, `UnityEngine.Random.InitState` sembrado, al menos un tesoro pendiente ⇒ se añade un tesoro adicional a `obtainedTreasureIds` al ganar, distinto del `TreasureRewardId` normal del nivel), Escenario Radar-sin-pendientes (jugador ya posee todos los tesoros del catálogo ⇒ ninguna excepción, ningún tesoro adicional, FR-010) — depende de T005, T007

### Implementation for User Story 2

- [X] T011 [P] [US2] Crear la clase estática `BattleSessionModifiers` (`MoveSpeedMultiplier: float`, default `1f`) en `Assets/Scripts/Gameplay/Battler/BattleSessionModifiers.cs`, según [data-model.md § BattleSessionModifiers](./data-model.md#battlesessionmodifiers-nuevo-estático-assetsscriptsgameplaybattlerbattlesessionmodifierscs)
- [X] T012 [US2] En `Assets/Scripts/Gameplay/Battler/UnitRuntime.cs`: `Move()` multiplica `c_MoveSpeed` por `BattleSessionModifiers.MoveSpeedMultiplier` — depende de T011 (hace pasar la mitad de T010, Escenario Velocidad)
- [X] T013 [P] [US2] En `Assets/Scripts/Gameplay/Battler/BattleResourceController.cs`: añadir `AddInstantResource(float amount)` (suma directa a `m_CurrentAmount`, mismo criterio que `ApplyPassiveRegenBonus` pero sobre el monto en vez de la tasa)
- [X] T014 [US2] En `Assets/Scripts/Gameplay/Battler/BattleStateManager.cs`: añadir el campo opcional `m_BattleItemCatalog` (`[SerializeField]`) y los campos runtime `m_BonusTreasureRequested`/`m_GrantedInstantResourceAmount`; extender `SetupChapter()` para resetear ambos y `BattleSessionModifiers.MoveSpeedMultiplier` al inicio, consumir `BattleLaunchContext.SelectedBattleItemIds`, descontar cada `itemId` válido de `playerProgress.battleItemInventory`, y aplicar el efecto según `BattleItemDefinition.Category` (`SpeedBoost`/`ExtraResource`/`BonusTreasure`), según [contracts/battle-item-effects.md § SetupChapter()](./contracts/battle-item-effects.md) — depende de T005, T007, T011, T012, T013 (hace pasar la mitad de T010, Escenarios Velocidad/Recurso)
- [X] T015 [US2] En `Assets/Scripts/Gameplay/Battler/BattleStateManager.cs` (mismo archivo que T014, secuencial): extender `GrantLevelRewards()` con la resolución de "Radar de Tesoro" (si `m_BonusTreasureRequested`, calcular el pool de tesoros pendientes de `m_TreasureSetCatalog` y otorgar uno al azar; no-op si no queda ninguno pendiente o `m_TreasureSetCatalog == null`), según [contracts/battle-item-effects.md § GrantLevelRewards()](./contracts/battle-item-effects.md) — depende de T014 (hace pasar el resto de T010, Escenarios Radar)

**Checkpoint**: US1 y US2 funcionan juntas — seleccionar un objeto produce su efecto real en una batalla.

---

## Phase 5: User Story 3 - Los objetos de batalla se obtienen jugando, no con moneda premium (Priority: P2)

**Goal**: Un nivel puede declarar una recompensa de objeto de batalla, otorgada al inventario del jugador en cada victoria.

**Independent Test**: Completar con victoria un nivel configurado con recompensa de objeto de batalla y confirmar que aparece en el inventario (spec.md US3).

### Tests for User Story 3 ⚠️

- [X] T016 [P] [US3] EditMode test en `Assets/Tests/EditMode/Battler/ChapterDefinitionBattleItemRewardDefaultsTests.cs` (archivo nuevo): una `ChapterDefinition` sin `m_BattleItemReward` asignado expone `BattleItemReward == null` y `BattleItemRewardCount == 0` (FR-011) — depende de T003
- [X] T017 [US3] Extender `Assets/Tests/PlayMode/Battler/BattleItemEffectsBattlePlayModeTests.cs` (mismo archivo que T010, secuencial): Escenario recompensa (un nivel con `BattleItemReward`/`BattleItemRewardCount` configurados otorga esa cantidad al inventario del jugador en cada victoria, sumándose a una entrada ya existente del mismo `itemId` si aplica), Escenario sin recompensa (un nivel sin `BattleItemReward` no modifica el inventario) — depende de T010

### Implementation for User Story 3

- [X] T018 [US3] Añadir `m_BattleItemReward` (`BattleItemDefinition`, default `null`) y `m_BattleItemRewardCount` (`int`, `[Min(0)]`, default `0`) con sus propiedades públicas a `Assets/Scripts/Model/Battler/ChapterDefinition.cs` (hace pasar T016) — depende de T003
- [X] T019 [US3] En `Assets/Scripts/Gameplay/Battler/BattleStateManager.cs` (mismo archivo que T014/T015, secuencial): extender `GrantLevelRewards()` para otorgar `BattleItemReward`/`BattleItemRewardCount` al `battleItemInventory` del jugador en cada victoria (mismo criterio que `XpReward`, no solo la primera), según [contracts/battle-item-effects.md § GrantLevelRewards()](./contracts/battle-item-effects.md) (hace pasar T017) — depende de T015, T018

**Checkpoint**: Las 3 historias de usuario quedan completas e independientemente funcionales — el ciclo completo (obtención → selección → efecto) es jugable de punta a punta.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T020 [US2] En `Assets/Scripts/Gameplay/Battler/BattleStateManager.cs` (mismo archivo, secuencial): extender `RetryBattle()` para reaplicar `m_GrantedInstantResourceAmount` inmediatamente después de `m_ResourceController.ResetResource()` (research.md §6, FR-013) — depende de T014
- [X] T021 Extender `Assets/Tests/PlayMode/Battler/BattleItemEffectsBattlePlayModeTests.cs` (mismo archivo, secuencial): FR-013 — tras perder y usar `RetryBattle()`, el efecto de "Aceleración de Velocidad"/"Dinero Extra" sigue activo sin descontarse una segunda vez del inventario — depende de T020
- [X] T022 [P] [US1] Crear `BattleItemSelectionRowView` (componente View: `m_NameLabel`, `m_CountLabel`, `m_SelectToggle`; `Initialize(BattleItemDefinition, int ownedCount, bool isSelected, Action<string,bool> onToggled)` — sin `BattleItemSelectionController` como parámetro, ver plan.md § Project Structure para la justificación; callback agregado en un `BattleItemSelectionUIController` nuevo, no anticipado en el plan original, mismo patrón que `TeamFormationUIController`) en `Assets/Scripts/View/Battler/BattleItemSelectionRowView.cs`, mismo patrón que `TeamFormationRowView` (005) — depende de T009
- [X] T023 Extender `Assets/Editor/Battler/PlayerBaseContentBuilder.cs`: instanciar el template de `BattleItemSelectionRowView` (vía un panel + `BattleItemSelectionUIController` nuevos, con su propio botón de navegación en el dashboard) en `PlayerBase.unity`, crear un `BattleItemCatalog` de ejemplo con los 3 objetos mínimos de FR-002 (`Assets/ScriptableObjects/Battler/BattleItems/`), y cablear `PlayerBaseFlowController.BattleItemCatalog`/`PlayerBaseFlowController.BattleItems` (`BattleItemSelectionController`, construido en `PlayerBaseFlowController.Awake()` mismo patrón que `TeamFormation`) con ese catálogo — depende de T022
- [X] T024 [P] Revisar que la implementación final no se haya desviado de [contracts/battle-item-selection.md](./contracts/battle-item-selection.md) / [contracts/battle-item-effects.md](./contracts/battle-item-effects.md) / [data-model.md](./data-model.md); actualizar esos documentos si hubo un cambio deliberado durante la implementación — único cambio deliberado: la firma de `BattleItemSelectionRowView.Initialize` y la introducción de `BattleItemSelectionUIController` (no anticipado por el plan original), reconciliados en [plan.md § Project Structure](./plan.md#project-structure). El resto de la implementación (`BattleItemSelectionController`, `BattleStateManager.SetupChapter()`/`GrantLevelRewards()`/`RetryBattle()`) sigue los contratos sin desviación.
- [X] T025 Correr la suite completa EditMode + PlayMode (001-018) en modo batch de Unity y confirmar 0 errores/0 warnings de compilación y 100% de tests en verde — 246/246 EditMode + 122/122 PlayMode en verde (nota: usar `-runTests` sin `-quit`; combinarlos hace que Unity cierre antes de que el test runner arranque)
- [ ] T026 Ejecutar los 11 pasos de validación manual de [quickstart.md](./quickstart.md) contra `PlayerBase.unity`/una batalla real — **probablemente requiera el Editor con GUI**, mismo criterio documentado para pasos equivalentes en specs anteriores. Pendiente: `PlayerBaseContentBuilder.Build()`/`ValidateScene()` ya se corrieron en modo batch (escena y catálogo generados, 0 referencias faltantes) — falta la inspección visual humana en el Editor.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Fase 1)**: sin dependencias
- **Foundational (Fase 2)**: depende de Setup — bloquea las 3 historias de usuario
- **US1/US2 (Fases 3-4)**: dependen de Foundational, son independientes entre sí en su lógica (T009 no depende de T011-T015), aunque ambas contribuyen a un mismo flujo end-to-end
- **US3 (Fase 5)**: depende de Foundational en su lógica de datos (T018 no depende de US1/US2), pero su implementación en `BattleStateManager.cs` (T019) se secuencia tras T014/T015 por compartir archivo
- **Polish (Fase 6)**: depende de que las 3 historias estén completas

### User Story Dependencies

- **US1 (P1)**: tras Foundational — sin dependencia de otras historias; entrega una selección válida aunque todavía sin conectar a ningún efecto real
- **US2 (P1)**: tras Foundational — conceptualmente independiente de US1 (su lógica de efectos no depende de cómo se validó la selección), pero en la práctica consume `BattleLaunchContext.SelectedBattleItemIds`, que US1 ya sabe poblar correctamente
- **US3 (P2)**: tras Foundational — independiente en términos conceptuales (la obtención no depende de la selección ni del efecto); en la práctica se implementa después porque comparte `BattleStateManager.cs`/`GrantLevelRewards()` con US2 (T014/T015), no por una dependencia conceptual real

### Parallel Opportunities

- T002, T004, T007 (Fase 2) son independientes entre sí — archivos distintos
- T003 depende de T002 pero es paralelizable respecto a T004/T007
- T008 (test de US1) y T010 (test de US2) son independientes entre sí — archivos distintos, ambos dependen solo de la Fase 2
- T011, T013 (US2) son independientes entre sí — archivos distintos
- T016 (test de defaults de US3) puede prepararse en paralelo con T008/T010

---

## Parallel Example: Foundational (Fase 2)

```bash
# Lanzar juntos los tipos de datos independientes entre si (archivos distintos):
Task: "Crear BattleItemCategory en Assets/Scripts/Core/Battler/BattleItemCategory.cs"
Task: "Crear BattleItemStack en Assets/Scripts/Model/Battler/BattleItemStack.cs"
Task: "Extender BattleLaunchContext en Assets/Scripts/Gameplay/Battler/BattleLaunchContext.cs"
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 2)

1. Completar Fase 1: Setup
2. Completar Fase 2: Foundational (bloqueante — tipos de datos y puente de escena)
3. Completar Fase 3: US1 (selección validada)
4. Completar Fase 4: US2 (efecto real de las 3 categorías) — ambas P1, spec.md las trata como el núcleo funcional del sistema
5. **Detener y validar**: correr T008/T010 en verde de forma aislada, luego el quickstart.md pasos 1-9 con GUI (usando inventario otorgado manualmente, sin esperar a US3)
6. Esto ya es útil por sí solo: seleccionar y usar un objeto de batalla funciona de punta a punta, aunque todavía no haya una vía de obtención jugando

### Incremental Delivery

1. Setup + Foundational → tipos de datos y puente de escena listos
2. + US1 + US2 → ciclo de selección + efecto funcional (MVP)
3. + US3 → obtención por recompensa de nivel, cerrando el ciclo completo
4. Fase 6 → resiliencia a `RetryBattle()`, UI de selección real, verificación final y quickstart manual con GUI

## Notes

- [P] = archivos distintos, sin dependencias pendientes
- T014/T015/T019/T020 comparten `BattleStateManager.cs`, siguiendo el mismo patrón de edición secuencial de un archivo compartido ya documentado en `specs/008-classification-trait-abilities/tasks.md`, `specs/016-combat-ability-catalog/tasks.md` y `specs/017-multi-hit-critical/tasks.md`
- T010/T017/T021 (mismo archivo `BattleItemEffectsBattlePlayModeTests.cs`) se extienden de forma secuencial entre historias, siguiendo el mismo patrón ya usado en specs anteriores
- El roll de `UnityEngine.Random` para "Radar de Tesoro" se siembra (`InitState`) únicamente dentro del test de T010 — no se introduce ninguna interfaz de aleatoriedad nueva en el código de producción (research.md §5, mismo criterio que `017-multi-hit-critical/research.md` §4)
- T020/T021 (Fase 6) corrigen el hallazgo de diseño documentado en research.md §6 (detectado durante `/speckit.plan`, antes de escribir ningún código) — no son un parche posterior, se incluyen desde el primer plan de tareas
- T026 probablemente requiera un humano en el Editor de Unity (GUI) para la inspección visual de la pantalla de selección y el efecto de velocidad/recurso, igual que quedó documentado para pasos equivalentes en specs anteriores
