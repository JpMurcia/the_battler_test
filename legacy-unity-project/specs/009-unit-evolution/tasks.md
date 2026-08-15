---

description: "Task list template for feature implementation"
---

# Tasks: Sistema de Evolución de Unidad

**Input**: Design documents from `/specs/009-unit-evolution/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/unit-definition-evolution-data.md](./contracts/unit-definition-evolution-data.md), [contracts/unit-evolution-controller.md](./contracts/unit-evolution-controller.md), [contracts/battle-evolution-integration.md](./contracts/battle-evolution-integration.md), [quickstart.md](./quickstart.md)

> ✅ **Bandera de gobernanza resuelta — `/speckit.implement` ya puede ejecutarse sobre este `tasks.md`**: esta feature llevaba heredada, desde `docs/roadmap-fases.md` (Fase 10), `spec.md` (Assumptions) y `plan.md` (Constitution Check/Complexity Tracking), una nota de gobernanza pendiente sobre variantes visuales adicionales por forma de evolución y cambios de estadísticas por forma. `/speckit.constitution` (v1.0.0 → v1.1.0, 2026-07-29) amplió el Principio III para cubrir explícitamente mecánicas de progresión con un número acotado de etapas por unidad, cada una con su propia animación/variante/stats, sin que eso constituya una violación — ver `plan.md` (Constitution Check actualizado). Las tareas de abajo pueden ejecutarse sin bloqueo pendiente.

**Tests**: Incluidos — mismo patrón de verificación real (EditMode/PlayMode) ya establecido en 001-008, y `research.md §5`/`plan.md` (Testing) definen explícitamente la estrategia de testing de esta feature con los nombres exactos de archivo ya decididos.

**Organization**: Tareas agrupadas por historia de usuario (US1-US4, según `spec.md`) para permitir implementación y prueba independientes de cada una. La capa de datos compartida (`UnitEvolutionStage`, `UnitEvolutionStageData`, `UnitCombatProfile`, extensiones de `UnitDefinition`/`UnitProgress`, `UnitEvolutionStageResolver`) es infraestructura común a las 4 historias y vive en Foundational (Fase 2), no en ninguna historia individual — ninguna historia puede implementarse sin ella.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: Historia de usuario a la que pertenece la tarea (US1-US4); las tareas de Setup/Foundational/Polish no llevan esta etiqueta
- Cada tarea incluye la ruta exacta del archivo

## Path Conventions

Proyecto único de Unity — capas `Assets/Scripts/{Core,Model,Gameplay,View}/Battler/`, tests en `Assets/Tests/{EditMode,PlayMode}/Battler/`, según [plan.md § Project Structure](./plan.md#project-structure).

---

## Phase 1: Setup

**Purpose**: Confirmar línea base antes de tocar código.

- [X] T001 Correr la suite EditMode + PlayMode existente (001-008) en modo batch de Unity sobre `C:\Users\Usuario\Documents\GitHub\IA GAME\the_battler_test` y confirmar que sigue en verde (0 errores de compilación, todos los tests en verde) antes de empezar, como línea base de referencia.

**Checkpoint**: Línea base verde confirmada antes de tocar código.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Capa de datos y resolución compartida por las 4 historias de usuario — el enum `UnitEvolutionStage`, los datos por forma de `UnitDefinition`, las dos extensiones de `UnitProgress`, y el resolver puro que traduce progreso guardado (posiblemente corrupto) a una forma válida. Ninguna historia puede implementarse ni probarse sin esto.

**⚠️ CRITICAL**: Ninguna tarea de Fase 3+ puede empezar hasta completar esta fase.

### Tests for Foundational ⚠️

> Estos tests deben escribirse primero y fallar antes de las tareas de implementación de esta fase.

- [X] T002 [P] EditMode tests en `Assets/Tests/EditMode/Battler/UnitEvolutionStageDefaultsTests.cs` (archivo nuevo): una `UnitDefinition` sin `m_EvolutionStages` asignado expone un array vacío; `TryGetStageData` devuelve `false` para las 3 formas del enum (FR-011) — ver [contracts/unit-definition-evolution-data.md](./contracts/unit-definition-evolution-data.md)
- [X] T003 [P] EditMode tests en `Assets/Tests/EditMode/Battler/UnitDefinitionEffectiveCombatProfileTests.cs` (archivo nuevo): las 6 filas de la tabla de comportamiento de [contracts/unit-definition-evolution-data.md](./contracts/unit-definition-evolution-data.md) — `FormaBase` siempre usa campos base; `SegundaForma`/`FormaVerdadera` con datos autorados usan esos datos; `SegundaForma`/`FormaVerdadera` sin datos autorados (longitud de array insuficiente) hacen fallback completo a campos base sin mezclar campos de dos formas (FR-011); valor de `stage` fuera de rango del enum también hace fallback a campos base (FR-013)
- [X] T004 [P] EditMode tests en `Assets/Tests/EditMode/Battler/UnitEvolutionStageResolverTests.cs` (archivo nuevo): `unitProgress` nulo o sin entrada para el `unitId` → `FormaBase`; entrada con `evolutionStage` fuera del rango `0`-`2` (corrupto/manipulado) → `FormaBase`; entrada con `evolutionStage` válido → se respeta tal cual (FR-013)

### Implementation for Foundational

- [X] T005 Crear el enum `UnitEvolutionStage` (`FormaBase = 0` por defecto, `SegundaForma = 1`, `FormaVerdadera = 2`) en `Assets/Scripts/Core/Battler/UnitEvolutionStage.cs`, según [data-model.md § UnitEvolutionStage](./data-model.md)
- [X] T006 [P] Crear la clase `[Serializable]` anidada `UnitEvolutionStageData` (`requiredLevel`, `requiresEvolutionItem`, `idleAnimation`, `attackAnimation`, `visualVariant`, `damage`, `maxHealth`) en `Assets/Scripts/Model/Battler/UnitEvolutionStageData.cs`, según [data-model.md § UnitEvolutionStageData](./data-model.md) — depende de T005
- [X] T007 [P] Crear la clase de solo lectura `UnitCombatProfile` (`IdleAnimation`, `AttackAnimation`, `VisualVariant`, `Damage`, `MaxHealth`) en `Assets/Scripts/Model/Battler/UnitCombatProfile.cs`, según [data-model.md § UnitCombatProfile](./data-model.md)
- [X] T008 Modificar `UnitDefinition` en `Assets/Scripts/Model/Battler/UnitDefinition.cs`: añadir `m_EvolutionStages: UnitEvolutionStageData[]` (longitud 0-2, default vacío, sin migración — FR-011) y los dos métodos puros `TryGetStageData(UnitEvolutionStage, out UnitEvolutionStageData)` / `GetEffectiveCombatProfile(UnitEvolutionStage) -> UnitCombatProfile`, exactamente según el algoritmo de [contracts/unit-definition-evolution-data.md](./contracts/unit-definition-evolution-data.md) (hace pasar T002, T003) — depende de T005, T006, T007
- [X] T009 Modificar `UnitProgress` en `Assets/Scripts/Model/Battler/UnitProgress.cs`: añadir `m_EvolutionStage: UnitEvolutionStage` (default `FormaBase`) y `m_EvolutionItemCount: int` (default `0`, `>= 0`), según [data-model.md § UnitProgress](./data-model.md) — depende de T005
- [X] T010 Crear `UnitEvolutionStageResolver` (clase estática pura, `Resolve(string unitId, UnitProgress[] unitProgress) -> UnitEvolutionStage`) en `Assets/Scripts/Gameplay/Battler/UnitEvolutionStageResolver.cs`, según [contracts/unit-evolution-controller.md § UnitEvolutionStageResolver](./contracts/unit-evolution-controller.md) (hace pasar T004) — depende de T005, T009

**Checkpoint**: Capa de datos y resolución de evolución lista — las 4 historias de usuario pueden empezar.

---

## Phase 3: User Story 1 - Evolucionar una unidad a su segunda forma al alcanzar el nivel requerido (Priority: P1) 🎯 MVP

**Goal**: Un jugador con una unidad que alcanzó el nivel necesario puede evolucionarla a su segunda forma desde la pantalla de mejora de unidades (005), obteniendo de inmediato una apariencia y estadísticas distintas; un intento sin cumplir el nivel es bloqueado.

**Independent Test**: Subir una unidad al nivel requerido para su segunda forma, evolucionarla desde la pantalla de mejora y confirmar que su apariencia, animaciones y estadísticas cambian de inmediato; repetir por debajo del nivel requerido y confirmar que el sistema no permite la evolución.

### Tests for User Story 1 ⚠️

> Estos tests deben escribirse primero y fallar antes de las tareas de implementación de esta fase.

- [X] T011 [P] [US1] EditMode tests en `Assets/Tests/EditMode/Battler/UnitEvolutionControllerTests.cs` (archivo nuevo), con un doble en memoria de `IPlayerProgressStore` (005) y `ScriptableObject.CreateInstance<UnitDefinition>()` + reflexión (mismo mecanismo que `UnitLevelingControllerTests`, 005): (a) `GetEvolutionStage` devuelve `FormaBase` para una unidad sin progreso guardado (Escenario 2 de Historia 1, unidad recién creada); (b) `TryGetNextStageRequirement`/`TryEvolve` hacia `SegundaForma` con nivel insuficiente → `false`/`false`, `UnitProgress` intacto (Historia 1 Escenario 2, FR-005, SC-002); (c) con nivel suficiente → `TryEvolve` devuelve `true`, `UnitProgress.evolutionStage` pasa a `SegundaForma`, se persiste vía `store.Save(...)`, y se dispara `EvolutionChanged` (Historia 1 Escenario 1, FR-002, FR-004, SC-001)

### Implementation for User Story 1

- [X] T012 [US1] Crear `UnitEvolutionController` (clase plana, no `MonoBehaviour`) en `Assets/Scripts/Gameplay/Battler/UnitEvolutionController.cs`: constructor `(IPlayerProgressStore store, IReadOnlyList<UnitDefinition> ownedUnits)`, `GetEvolutionStage(unitId)`, `TryGetNextStageRequirement(unitId, out EvolutionRequirementInfo)`, evento `EvolutionChanged`, y la parte de `TryEvolve(unitId)` que cubre la transición a `SegundaForma` (resolver requisito, verificar `MeetsLevelRequirement`, actualizar `evolutionStage` y persistir sin efectos parciales en rechazo), según [contracts/unit-evolution-controller.md](./contracts/unit-evolution-controller.md) (hace pasar T011) — depende de T008, T009, T010
- [X] T013 [US1] En `UnitUpgradeUIController` (005), añadir un botón "Evolucionar" por unidad en `Assets/Scripts/View/Battler/UnitUpgradeUIController.cs`: habilitado solo cuando `UnitEvolutionController.TryGetNextStageRequirement(unitId, out var req)` devuelve `true` y `req.CanEvolve == true`; su `OnClick` invoca `TryEvolve(unitId)` — acción explícita del jugador, nunca automática al subir de nivel (FR-004) — depende de T012

**Checkpoint**: US1 completa y verificable de forma independiente — una unidad puede evolucionar a Segunda Forma desde el dashboard cuando cumple el nivel, y es bloqueada limpiamente cuando no.

---

## Phase 4: User Story 2 - Evolucionar a la forma verdadera requiere nivel e ítem (Priority: P2)

**Goal**: Una unidad en segunda forma que alcanzó el nivel superior requerido y posee el ítem de evolución puede evolucionar a su forma verdadera, consumiendo el ítem; las evoluciones son estrictamente secuenciales (no se puede saltar de Forma Base directo a Forma Verdadera).

**Independent Test**: Con una unidad en segunda forma que alcanzó el nivel requerido y con el ítem de evolución disponible, evolucionarla a forma verdadera y confirmar el consumo del ítem junto con el cambio de forma y estadísticas; confirmar por separado que ni "ítem sin nivel" ni "nivel sin ítem" permiten la evolución, y que una unidad en Forma Base no puede saltar directo a Forma Verdadera aunque ya cumpla ambos niveles.

### Tests for User Story 2 ⚠️

> Estos tests deben escribirse primero y fallar antes de las tareas de implementación de esta fase.

- [X] T014 [US2] Añadir a `Assets/Tests/EditMode/Battler/UnitEvolutionControllerTests.cs` (mismo archivo que T011, secuencial): (a) `TryEvolve` hacia `FormaVerdadera` con nivel cumplido pero `evolutionItemCount == 0` → `false`, `UnitProgress` intacto (Historia 2 Escenario 2, FR-003, SC-002); (b) con ítem disponible pero nivel insuficiente → `false`, `UnitProgress` intacto (Historia 2 Escenario 3, SC-002); (c) con nivel e ítem cumplidos, unidad ya en `SegundaForma` → `TryEvolve` devuelve `true`, `evolutionStage` pasa a `FormaVerdadera`, `evolutionItemCount` decrementa en exactamente 1, se persiste (Historia 2 Escenario 1, FR-003, FR-006); (d) unidad en `FormaBase` con nivel de `SegundaForma` y de `FormaVerdadera` ya cumplidos y con el ítem disponible → `TryEvolve` hacia `FormaVerdadera` sigue evaluando solo `forma actual + 1` (`SegundaForma`), nunca ofrece ni aplica un salto directo a `FormaVerdadera` (Edge Case de spec.md, FR-007)

### Implementation for User Story 2

- [X] T015 [US2] Completar en `UnitEvolutionController` (mismo archivo que T012, secuencial) la rama de `TryEvolve` para `FormaVerdadera`: verificar `MeetsItemRequirement` (`!RequiresEvolutionItem || evolutionItemCount > 0`), decrementar `evolutionItemCount` en 1 solo cuando `requirement.RequiresEvolutionItem`, y confirmar que la secuencialidad (FR-007) queda garantizada estructuralmente porque `TryGetNextStageRequirement` solo evalúa `currentStage + 1` — sin tabla de transiciones adicional (research.md §4) — en `Assets/Scripts/Gameplay/Battler/UnitEvolutionController.cs` (hace pasar T014) — depende de T012, T014

**Checkpoint**: US1 y US2 funcionan juntas e independientemente — el flujo completo de evolución (Segunda Forma → Forma Verdadera) respeta nivel, ítem y secuencialidad, sin efectos parciales en ningún rechazo.

---

## Phase 5: User Story 3 - La forma verdadera mejora significativamente las estadísticas de combate (Priority: P2)

**Goal**: Tras evolucionar una unidad a su forma verdadera, sus estadísticas de combate (ataque y vida) muestran una mejora significativa respecto a su forma base, definida en los datos de esa unidad.

**Independent Test**: Comparar las estadísticas de combate de una unidad en forma base contra las mismas estadísticas ya evolucionada a forma verdadera, y confirmar una mejora significativa (por ejemplo, el doble de ataque y vida).

### Tests for User Story 3 ⚠️

> Este test debe escribirse primero y fallar antes de la tarea de implementación de esta fase (si corresponde).

- [X] T016 [US3] Añadir a `Assets/Tests/EditMode/Battler/UnitDefinitionEffectiveCombatProfileTests.cs` (mismo archivo que T003, secuencial) un caso con una `UnitEvolutionStageData` de `FormaVerdadera` autorada con `damage`/`maxHealth` al doble de los campos base de la misma `UnitDefinition`: `GetEffectiveCombatProfile(FormaVerdadera)` devuelve exactamente esos valores duplicados, sin mezclar con los de `FormaBase` (Historia 3 Escenario 1, SC-003)

### Implementation for User Story 3

**Nota**: no se requiere código de producción nuevo para esta historia — `UnitDefinition.GetEffectiveCombatProfile` (T008, Foundational) ya resuelve valores absolutos por forma tal como los autora el diseñador (research.md §3); T016 verifica que el mecanismo ya construido satisface SC-003 con un ejemplo concreto de "duplicar ataque y vida". Si T016 revela una discrepancia con el algoritmo de [contracts/unit-definition-evolution-data.md](./contracts/unit-definition-evolution-data.md), corregir `Assets/Scripts/Model/Battler/UnitDefinition.cs` (mismo archivo que T008) antes de continuar.

**Checkpoint**: Mejora significativa de estadísticas verificada para un ejemplo autorado — la Forma Verdadera de una unidad evolucionada muestra el doble de ataque/vida que su Forma Base.

---

## Phase 6: User Story 4 - Cada forma tiene su propia animación de idle y de ataque (Priority: P3)

**Goal**: Una unidad desplegada en batalla reproduce la animación de idle y de ataque específica de su forma de evolución vigente, distinta de las otras formas de la misma unidad; sus estadísticas de combate en batalla (daño, vida) también corresponden a esa forma, no siempre a la Forma Base.

**Independent Test**: Evolucionar una unidad a través de sus tres formas y confirmar, al desplegarla en el carril de batalla en cada una, que reproduce una animación de idle y de ataque distinta a las anteriores, con el daño/vida de esa forma.

### Tests for User Story 4 ⚠️

> Estos tests deben escribirse primero y fallar antes de las tareas de implementación de esta fase.

- [X] T017 [P] [US4] PlayMode tests en `Assets/Tests/PlayMode/Battler/UnitEvolutionBattleIntegrationPlayModeTests.cs` (archivo nuevo), inyectando un `IPlayerProgressStore` en memoria por reflexión sobre `BattleStateManager` (mismo mecanismo que `BattleLoopPlayModeTests`, 002) y `ScriptableObject.CreateInstance<UnitDefinition>()` sembrada por reflexión (mismo patrón que `ClassificationAbilityBattlePlayModeTests`, 008): (a) una unidad desplegada con `UnitProgress.evolutionStage = SegundaForma`/`FormaVerdadera` muestra en su `UnitRuntime` el `Animator.runtimeAnimatorController`/daño de esa forma, no de la Forma Base (FR-012, SC-005); (b) tres despliegues sucesivos de la misma `UnitDefinition` en sus tres formas muestran animaciones de idle/ataque distintas entre sí (Historia 4, SC-005); (c) un enemigo desplegado vía `EnemyWaveSpawner` sigue desplegándose en `FormaBase` sin cambio de comportamiento

### Implementation for User Story 4

- [X] T018 [US4] Modificar `UnitRuntime.Initialize` en `Assets/Scripts/Gameplay/Battler/UnitRuntime.cs`: nuevo parámetro opcional `UnitEvolutionStage stage = UnitEvolutionStage.FormaBase`; resolver `definition.GetEffectiveCombatProfile(stage)` una única vez al inicio de `Initialize` y usar ese perfil (no los campos base directos) para `m_CurrentHealth`/`MaxHealth`, `Animator.runtimeAnimatorController` inicial, la variante visual instanciada, y el daño aplicado en `Attack()`/comparación en `Move()`, según [contracts/battle-evolution-integration.md § UnitRuntime.Initialize](./contracts/battle-evolution-integration.md) (compatible con todos los call-sites existentes de 001/007/008; hace pasar parte de T017) — depende de T008
- [X] T019 [US4] Modificar `UnitDeploymentController` en `Assets/Scripts/Gameplay/Battler/UnitDeploymentController.cs`: `Initialize(IBattleResourceSource, IReadOnlyList<UnitDefinition>, Func<string, UnitEvolutionStage> resolveEvolutionStage = null)`; en `TryDeploy(int slotIndex)`, resolver `stage` vía `resolveEvolutionStage?.Invoke(slot.Unit.UnitId) ?? UnitEvolutionStage.FormaBase` antes de `instance.Initialize(slot.Unit, Team.Player, m_PlayerSpawnLanePosition, stage)`, según [contracts/battle-evolution-integration.md § UnitDeploymentController.TryDeploy](./contracts/battle-evolution-integration.md) — depende de T018
- [X] T020 [US4] Modificar `BattleStateManager.SetupChapter()` en `Assets/Scripts/Gameplay/Battler/BattleStateManager.cs`: resolver `IPlayerProgressStore` (005, mismo patrón que `IChapterProgressStore`), cargar `var playerProgress = m_PlayerProgressStore.Load()` una única vez, construir `UnitEvolutionStage ResolveStage(string unitId) => UnitEvolutionStageResolver.Resolve(unitId, playerProgress.unitProgress)`, y pasarlo a `m_DeploymentController.Initialize(m_ResourceController, roster, ResolveStage)`; `EnemyWaveSpawner` no se modifica (sigue sin pasar `resolveEvolutionStage`, FormaBase por defecto), según [contracts/battle-evolution-integration.md § BattleStateManager.SetupChapter](./contracts/battle-evolution-integration.md) (hace pasar el resto de T017) — depende de T010, T019

**Checkpoint**: Las 4 historias de usuario funcionan de forma independiente y en conjunto — evolución completa (nivel + ítem, secuencial), mejora de estadísticas y reflejo visual/animado distinto por forma en batalla.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T021 Revisar que la implementación final no se haya desviado de [contracts/unit-definition-evolution-data.md](./contracts/unit-definition-evolution-data.md) / [contracts/unit-evolution-controller.md](./contracts/unit-evolution-controller.md) / [contracts/battle-evolution-integration.md](./contracts/battle-evolution-integration.md) / [data-model.md](./data-model.md); actualizar esos documentos si hubo un cambio deliberado durante la implementación
- [X] T022 Correr la suite completa EditMode + PlayMode (001-009) en modo batch de Unity y confirmar 0 errores/0 warnings de compilación y 100% de tests en verde, incluida la suite heredada de 001-008 sin regresión (`AttackTypeBattlePlayModeTests`, `ClassificationAbilityBattlePlayModeTests`, `TeamFormationBattleIntegrationPlayModeTests`, según [quickstart.md](./quickstart.md))
- [X] T023 Ejecutar una aproximación automatizada de los 13 pasos de [quickstart.md](./quickstart.md) contra la escena real (mismo enfoque documentado en `specs/003-main-menu-config/tasks.md` § Notas de implementación si no hay acceso a la GUI del Editor) — no reemplaza un walkthrough humano, pero cubre el mismo comportamiento observable de forma reproducible; confirmar al final, vía `git status`, que ningún `.asset` de unidad existente ni `player-progress.json` de prueba quedó modificado de forma permanente (paso 13 de quickstart.md)

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Fase 1)**: sin dependencias — puede empezar de inmediato
- **Foundational (Fase 2)**: depende de Setup — bloquea las 4 historias de usuario
- **User Stories (Fase 3-6)**: todas dependen de Foundational; dentro de cada historia, los tests preceden a su implementación correspondiente
- **Polish (Fase 7)**: depende de que las 4 historias estén completas

### User Story Dependencies

- **US1 (P1)**: puede empezar tras Foundational — sin dependencia funcional de otras historias; es el mecanismo central de evolución (Segunda Forma)
- **US2 (P2)**: puede empezar tras Foundational, pero su implementación (T015) extiende el mismo archivo/clase que creó US1 (T012), por lo que en la práctica se implementa después; su Independent Test (forma verdadera + secuencialidad) no reutiliza pasos manuales de US1, solo su mismo mecanismo genérico
- **US3 (P2)**: independiente en su lógica de datos (estadísticas ya son responsabilidad de `GetEffectiveCombatProfile`, Foundational); su Independent Test no depende de haber completado US1/US2, pero su único archivo de test (T016) extiende el mismo creado por Foundational (T003)
- **US4 (P3)**: depende conceptualmente de que exista una forma de evolución vigente que reflejar (Foundational ya lo provee); su implementación (T018-T020) no depende de US1/US2/US3 en código, pero su Independent Test es más significativo una vez el jugador puede llegar a evolucionar unidades desde el dashboard (US1/US2)

### Parallel Opportunities

- T002, T003, T004 (tests de Foundational) son independientes entre sí — archivos distintos
- T006 (`UnitEvolutionStageData`) y T007 (`UnitCombatProfile`) pueden ejecutarse en paralelo entre sí — solo comparten T005 (`UnitEvolutionStage`) como prerrequisito común
- T011 (test de US1) puede ejecutarse en paralelo con T017 (test de US4) — archivos distintos, historias distintas
- T017 puede empezar en paralelo con el resto de Fase 6 aún no iniciado
- Las implementaciones de US1/US2 comparten `UnitEvolutionController.cs` (T012/T015), por lo que sus tareas de implementación son intrínsecamente secuenciales entre sí, aunque cada historia sea conceptualmente independiente
- Las implementaciones de US4 (T018→T019→T020) son secuenciales por diseño (cada una depende del parámetro añadido por la anterior en la cadena de integración de batalla)

---

## Implementation Strategy

### MVP First (User Story 1 solamente)

1. Completar Fase 1: Setup
2. Completar Fase 2: Foundational (bloqueante — capa de datos y resolver de evolución)
3. Completar Fase 3: US1 (evolución a Segunda Forma desde el dashboard, con nivel como único requisito)
4. **Detener y validar**: correr T011 en verde de forma aislada
5. Esto ya es útil por sí solo: una unidad puede progresar más allá de su Forma Base de manera jugable y persistente

### Incremental Delivery

1. Setup + Foundational → capa de datos de evolución lista
2. + US1 → evolución a Segunda Forma (mecánica central, MVP)
3. + US2 → evolución a Forma Verdadera (nivel + ítem, secuencialidad garantizada)
4. + US3 → mejora de estadísticas de combate verificada explícitamente (SC-003)
5. + US4 → reflejo visual/animado distinto por forma en batalla
6. Fase 7 → verificación final y quickstart manual

## Notes

- [P] = archivos distintos, sin dependencias pendientes
- Foundational (T002-T010) es intencionalmente la fase más grande de esta feature: research.md/data-model.md documentan que el diseño concentra toda la complejidad nueva en la capa de datos/resolución (`UnitDefinition`/`UnitProgress`/resolver), dejando cada historia de usuario como una capa delgada sobre esa base — mismo criterio de "superficie mínima por historia" que 003 aplicó a su propio Foundational
- US2 (T014-T015) y US3 (T016) no introducen ninguna clase ni archivo nuevo — extienden archivos ya creados por US1 (T012) y Foundational (T003) respectivamente, porque el contrato de `TryEvolve`/`GetEffectiveCombatProfile` ya es genérico por diseño (research.md §3/§4): esto es deliberado, no una omisión
- US4 (T018-T020) es la única historia que toca el ciclo de batalla en sí (`UnitRuntime`/`UnitDeploymentController`/`BattleStateManager`) — todas las demás historias operan enteramente desde el dashboard (005) y la capa de datos
- T023 probablemente requiera un humano en el Editor de Unity (GUI) para los pasos de inspección visual (animaciones distintas por forma en el carril de batalla), igual que quedó documentado para tareas equivalentes en `specs/002-local-save-progress/tasks.md` y `specs/003-main-menu-config/tasks.md`
- **Gobernanza (repetido del encabezado de este archivo)**: la bandera de Principio III documentada en `plan.md` quedó resuelta el 2026-07-29 vía `/speckit.constitution` (v1.1.0) — ya no bloquea `/speckit.implement` sobre esta feature.
