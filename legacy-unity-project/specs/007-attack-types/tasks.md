---

description: "Task list template for feature implementation"
---

# Tasks: Sistema de Tipos de Ataque ("Attack Types")

**Input**: Design documents from `/specs/007-attack-types/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/lane-registry-targeting.md](./contracts/lane-registry-targeting.md), [contracts/unit-attack-type-behavior.md](./contracts/unit-attack-type-behavior.md), [quickstart.md](./quickstart.md)

**Tests**: Incluidos — mismo patrón de verificación real (EditMode/PlayMode) ya establecido en 001-003, y research.md §7 define explícitamente la estrategia de testing de esta feature.

**Organization**: Tareas agrupadas por historia de usuario (US1-US4, según spec.md) para permitir implementación y prueba independientes de cada una.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: Historia de usuario a la que pertenece la tarea
- Cada tarea incluye la ruta exacta del archivo

## Path Conventions

Proyecto único de Unity — capas `Assets/Scripts/{Core,Model,Gameplay}/Battler/` (esta feature no toca `TheBattler.View`), y tests en `Assets/Tests/{EditMode,PlayMode}/Battler/`, según [plan.md § Project Structure](./plan.md#project-structure).

---

## Phase 1: Setup

**Purpose**: Confirmar línea base antes de tocar código.

- [X] T001 Correr la suite EditMode + PlayMode existente (001-003) en modo batch de Unity sobre `C:\Users\Usuario\Documents\GitHub\IA GAME\the_battler_test` y confirmar que sigue en verde (0 errores de compilación, todos los tests en verde) antes de empezar, como línea base de referencia.

**Checkpoint**: Línea base verde confirmada antes de tocar código.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: El tipo de dato `AttackType` y su exposición en `UnitDefinition` son prerrequisito de las 4 historias de usuario — ninguna rama de `UnitRuntime`/`LaneRegistry` puede ramificar por un tipo de ataque que todavía no existe.

**⚠️ CRITICAL**: Ninguna tarea de Fase 3+ puede empezar hasta completar esta fase.

- [X] T002 [P] Crear el enum `AttackType` (`SingleTarget = 0` primer miembro/default, `Area`, `LongDistance`) en `Assets/Scripts/Core/Battler/AttackType.cs`, mismo nivel/namespace `TheBattler.Core` que `Team`/`BattleOutcome`, según [data-model.md § AttackType](./data-model.md#attacktype-enum)
- [X] T003 EditMode test en `Assets/Tests/EditMode/Battler/UnitDefinitionAttackTypeTests.cs` (archivo nuevo): una instancia de `UnitDefinition` creada vía `ScriptableObject.CreateInstance<UnitDefinition>()` sin `m_AttackType` asignado expone `AttackType == AttackType.SingleTarget` (FR-008), mismo patrón de reflexión que `UnitDefinitionValidationTests.cs` — depende de T002
- [X] T004 Añadir el campo `[SerializeField] private AttackType m_AttackType` (sin `[FormerlySerializedAs]`, campo nuevo) y la propiedad pública `AttackType AttackType => m_AttackType` a `Assets/Scripts/Model/Battler/UnitDefinition.cs` (modificar — no crear), junto a los campos/propiedades existentes (`m_Team`/`Team`), según [data-model.md § UnitDefinition](./data-model.md#unitdefinition-so-extensión-de-001) (hace pasar T003) — depende de T002

**Checkpoint**: `AttackType` existe, `UnitDefinition` lo expone con default `SingleTarget` verificado — las 4 historias de usuario pueden empezar.

---

## Phase 3: User Story 1 - Un ataque de área daña a varios enemigos a la vez (Priority: P1) 🎯 MVP

**Goal**: Una unidad con `AttackType.Area` inflige daño simultáneamente a todos los enemigos agrupados dentro de su rango (`UnitDefinition.Range`), no solo al más cercano.

**Independent Test**: En una batalla con varios enemigos agrupados dentro del alcance de una unidad con `AttackType.Area`, desplegarla y confirmar que todos los enemigos en rango reciben daño en el mismo ataque, no solo uno.

### Tests for User Story 1 ⚠️

> Estos tests deben escribirse primero y fallar antes de las tareas de implementación de esta fase.

- [X] T005 [P] [US1] EditMode tests en `Assets/Tests/EditMode/Battler/LaneRegistryTargetingTests.cs` (archivo nuevo, compartido con US3 — ver T012) para `FindAllTargetsInRange`: sin ocupantes enemigos en rango ⇒ `results` queda vacío tras `Clear()`; un único ocupante en rango ⇒ `results` lo contiene; varios ocupantes en rango ⇒ `results` contiene exactamente todos ellos; un ocupante justo en el límite de `maxRange` ⇒ incluido; un ocupante del mismo equipo ⇒ excluido; un ocupante destruido (`IsDestroyed == true`) ⇒ excluido — dobles en memoria de `ILaneOccupant` registrados vía `LaneRegistry.Register`, sin `MonoBehaviour` ni escena, según [contracts/lane-registry-targeting.md § Doble de test](./contracts/lane-registry-targeting.md#doble-de-test)
- [X] T006 [P] [US1] PlayMode test en `Assets/Tests/PlayMode/Battler/AttackTypeBattlePlayModeTests.cs` (archivo nuevo, compartido con US2/US3/US4): US1 Escenario 1 — una unidad `Team.Player` con `AttackType.Area` y varios `UnitRuntime` `Team.Enemy` agrupados dentro de `Range`, tras uno o más ciclos de `Attack()`, todos pierden `CurrentHealth` en el mismo ciclo; US1 Escenario 2 — con un único enemigo en rango, ese único enemigo recibe daño con normalidad; enemigos fuera del radio no pierden vida en ese ataque (Edge Case de spec.md) — mismo patrón `ScriptableObject.CreateInstance<UnitDefinition>()` + reflexión sobre campos privados que `BattleLoopPlayModeTests.CreateUnit`, escena mínima construida en runtime, sin cargar `Chapter1_Battle.unity`, según [contracts/unit-attack-type-behavior.md § Doble de test](./contracts/unit-attack-type-behavior.md#doble-de-test)

### Implementation for User Story 1

- [X] T007 [US1] Añadir `public static void FindAllTargetsInRange(Team seekerTeam, float seekerLanePosition, float maxRange, List<ILaneOccupant> results)` a `Assets/Scripts/Gameplay/Battler/LaneRegistry.cs` (modificar — no crear; `FindNearestTarget` sin cambios): `results.Clear()` seguido de un recorrido de `s_Occupants` con el mismo filtro (`null`/destruido/mismo equipo excluidos) que añade a `results` cada ocupante con `distance <= maxRange`, sin asignar ninguna colección nueva, según [contracts/lane-registry-targeting.md § FindAllTargetsInRange](./contracts/lane-registry-targeting.md#nuevo-findalltargetsinrange) (hace pasar la mitad de T005) — depende de T002
- [X] T008 [US1] En `Assets/Scripts/Gameplay/Battler/UnitRuntime.cs` (modificar): añadir un campo `List<ILaneOccupant>` reutilizable (buffer de resultados de área, asignado una vez, no por ataque — research.md §5); en `Update()`, cuando `m_Source.AttackType == AttackType.Area`, no persistir `m_CurrentTarget` — usar `LaneRegistry.FindNearestTarget(m_Team, m_LanePosition, m_Source.Range) != null` solo como comprobación de presencia para decidir `Move()` vs `Attack()`, según [contracts/unit-attack-type-behavior.md § AttackType.Area — Adquisición](./contracts/unit-attack-type-behavior.md#attacktypearea-fr-005-us1) — depende de T004, T007
- [X] T009 [US1] En `Attack()` de `Assets/Scripts/Gameplay/Battler/UnitRuntime.cs` (mismo archivo que T008, secuencial): cuando `m_Source.AttackType == AttackType.Area`, sustituir la única llamada `m_CurrentTarget.ApplyDamage(...)` por `LaneRegistry.FindAllTargetsInRange(m_Team, m_LanePosition, m_Source.Range, <buffer de T008>)` seguido de `ApplyDamage(m_Source.Damage)` sobre cada elemento devuelto, según [contracts/unit-attack-type-behavior.md § AttackType.Area — Aplicación de daño](./contracts/unit-attack-type-behavior.md#attacktypearea-fr-005-us1) (hace pasar T006) — depende de T008

**Checkpoint**: US1 completa y verificable de forma independiente — una unidad de Área daña a todos los enemigos agrupados en rango en el mismo ataque, sin afectar a los que están fuera del radio.

---

## Phase 4: User Story 2 - Un ataque único solo golpea a un enemigo a la vez (Priority: P1)

**Goal**: Una unidad con `AttackType.SingleTarget` solo daña a un enemigo por ataque, incluso si hay más de uno dentro de su rango, y reasigna objetivo cuando el actual es destruido.

**Independent Test**: En una batalla con varios enemigos agrupados dentro del alcance de una unidad con `AttackType.SingleTarget`, desplegarla y confirmar que solo un enemigo recibe daño por ataque; al destruir ese objetivo, confirmar que el siguiente ataque se dirige a otro sin afectar a más de uno.

**Nota**: `SingleTarget` es el comportamiento ya implementado en 001 (`FindNearestTarget` + `m_CurrentTarget.ApplyDamage`) — esta historia no cambia lógica existente, solo la cubre explícitamente con la rama `AttackType.SingleTarget` y con tests dedicados que hoy no existen.

### Tests for User Story 2 ⚠️

- [X] T010 [P] [US2] PlayMode test en `Assets/Tests/PlayMode/Battler/AttackTypeBattlePlayModeTests.cs` (mismo archivo que T006, secuencial): US2 Escenario 1 — una unidad `Team.Player` con `AttackType.SingleTarget` y varios `UnitRuntime` `Team.Enemy` en rango, tras un ciclo de `Attack()`, exactamente uno pierde `CurrentHealth`, el resto queda intacto; US2 Escenario 2 — destruir el objetivo actual (llevar su `CurrentHealth` a 0) y confirmar que el siguiente ciclo de `Attack()` dirige el daño a otro enemigo en rango, sin afectar a más de uno en ese ciclo — según [contracts/unit-attack-type-behavior.md § AttackType.SingleTarget](./contracts/unit-attack-type-behavior.md#attacktypesingletarget-fr-004-us2) — depende de T006

### Implementation for User Story 2

- [X] T011 [US2] En `Assets/Scripts/Gameplay/Battler/UnitRuntime.cs` (modificar, mismo archivo que T008/T009, secuencial): confirmar/dejar explícita la rama `m_Source.AttackType == AttackType.SingleTarget` en `Update()` (adquisición vía `FindNearestTarget`, reasignación si `m_CurrentTarget` es `null` o está destruido — sin cambio de comportamiento respecto a 001) y en `Attack()` (única llamada `m_CurrentTarget.ApplyDamage(m_Source.Damage)`), según [contracts/unit-attack-type-behavior.md § AttackType.SingleTarget](./contracts/unit-attack-type-behavior.md#attacktypesingletarget-fr-004-us2) (hace pasar T010) — depende de T008, T009

**Checkpoint**: US1 y US2 funcionan juntas e independientemente — Área daña a todos en rango, Único daña exactamente a uno y reasigna correctamente tras destruir su objetivo.

---

## Phase 5: User Story 3 - Un ataque de larga distancia alcanza objetivos más allá del más cercano (Priority: P2)

**Goal**: Una unidad con `AttackType.LongDistance` puede dañar al enemigo más lejano dentro de su rango, no limitada al inmediatamente adyacente.

**Independent Test**: En una batalla con varios enemigos escalonados en el carril, desplegar una unidad con `AttackType.LongDistance` y confirmar que puede dañar a un enemigo más allá del más cercano dentro de su rango.

### Tests for User Story 3 ⚠️

- [X] T012 [P] [US3] EditMode tests en `Assets/Tests/EditMode/Battler/LaneRegistryTargetingTests.cs` (mismo archivo que T005, secuencial) para `FindFarthestTarget`: sin ocupantes enemigos en rango ⇒ `null`; un único ocupante en rango ⇒ lo devuelve (coincide con `FindNearestTarget` en ese caso); varios ocupantes en rango con distancias distintas ⇒ devuelve el de mayor distancia; un ocupante justo en el límite de `maxRange` ⇒ incluido como candidato; un ocupante del mismo equipo ⇒ excluido; un ocupante destruido ⇒ excluido — según [contracts/lane-registry-targeting.md § FindFarthestTarget](./contracts/lane-registry-targeting.md#nuevo-findfarthesttarget) — depende de T002
- [X] T013 [P] [US3] PlayMode test en `Assets/Tests/PlayMode/Battler/AttackTypeBattlePlayModeTests.cs` (mismo archivo que T006/T010, secuencial): US3 Escenario 1 — una unidad `Team.Player` con `AttackType.LongDistance` y enemigos `Team.Enemy` escalonados (distintas `LanePosition`) dentro de rango, tras un ciclo de `Attack()`, el enemigo más lejano dentro de `Range` pierde `CurrentHealth`, no el más cercano; con un único enemigo en rango, coincide con el resultado de `SingleTarget` — según [contracts/unit-attack-type-behavior.md § AttackType.LongDistance](./contracts/unit-attack-type-behavior.md#attacktypelongdistance-fr-006-us3) — depende de T006

### Implementation for User Story 3

- [X] T014 [US3] Añadir `public static ILaneOccupant FindFarthestTarget(Team seekerTeam, float seekerLanePosition, float maxRange)` a `Assets/Scripts/Gameplay/Battler/LaneRegistry.cs` (modificar, mismo archivo que T007, secuencial): mismo recorrido/filtro que `FindNearestTarget`, pero se queda con el ocupante de **mayor** `distance` dentro de `maxRange` en vez de menor, según [contracts/lane-registry-targeting.md § FindFarthestTarget](./contracts/lane-registry-targeting.md#nuevo-findfarthesttarget) (hace pasar T012) — depende de T002, T007
- [X] T015 [US3] En `Update()` de `Assets/Scripts/Gameplay/Battler/UnitRuntime.cs` (modificar, mismo archivo que T008/T009/T011, secuencial): añadir la rama `m_Source.AttackType == AttackType.LongDistance` que adquiere/reasigna `m_CurrentTarget` vía `LaneRegistry.FindFarthestTarget(m_Team, m_LanePosition, m_Source.Range)` en vez de `FindNearestTarget` (misma condición de reasignación — `null` o destruido); `Attack()` reutiliza la misma única llamada `m_CurrentTarget.ApplyDamage(m_Source.Damage)` que `SingleTarget` (la diferencia está solo en qué objetivo se adquirió), según [contracts/unit-attack-type-behavior.md § AttackType.LongDistance](./contracts/unit-attack-type-behavior.md#attacktypelongdistance-fr-006-us3) (hace pasar T013) — depende de T011, T014

**Checkpoint**: US1, US2 y US3 funcionan juntas e independientemente — las tres ramas de `AttackType` (Área/Único/Larga Distancia) están implementadas para `Team.Player`.

---

## Phase 6: User Story 4 - Los enemigos también declaran su propio tipo de ataque (Priority: P2)

**Goal**: El mismo comportamiento por `AttackType` (Área/Único/Larga Distancia) se aplica de forma simétrica cuando quien ataca es `Team.Enemy` contra unidades del jugador o su base.

**Independent Test**: En una batalla donde un enemigo con `AttackType.Area` enfrenta a varias unidades del jugador agrupadas, confirmar que todas reciben daño en el mismo ataque, igual que ocurriría con una unidad del jugador equivalente.

**Nota**: Por diseño (research.md §1, plan.md Summary), ninguna de las tres ramas implementadas en US1-US3 consulta `Team`/`m_Team` para decidir *qué hacer* — el único filtro por equipo ya vive dentro de `LaneRegistry` (`occupant.Team != seekerTeam`), idéntico para `FindNearestTarget`/`FindFarthestTarget`/`FindAllTargetsInRange`. Esta historia no requiere código nuevo en `UnitRuntime`/`LaneRegistry`; su trabajo es la verificación explícita de esa simetría (FR-007), incluyendo el caso de la base del jugador como `ILaneOccupant` válido.

### Tests for User Story 4 ⚠️

- [X] T016 [US4] PlayMode tests en `Assets/Tests/PlayMode/Battler/AttackTypeBattlePlayModeTests.cs` (mismo archivo que T006/T010/T013, secuencial): repetir los tres escenarios de US1/US2/US3 (Área daña a todos, Único daña a uno y reasigna, Larga Distancia alcanza al más lejano) con los equipos invertidos — una `UnitRuntime` `Team.Enemy` con cada `AttackType` atacando `UnitRuntime` `Team.Player` agrupadas/escalonadas, y un caso adicional con `BaseHealth` (`Team.Player`) como único objetivo en rango de un enemigo con `AttackType.Area`/`AttackType.SingleTarget` — mismo resultado que el escenario equivalente de US1-US3 sin duplicar aserciones específicas de equipo, según [contracts/unit-attack-type-behavior.md § Simetría jugador/enemigo](./contracts/unit-attack-type-behavior.md#simetría-jugadorenemigo-fr-007-us4) — depende de T009, T011, T015

### Implementation for User Story 4

- [X] T017 [US4] Revisar `Assets/Scripts/Gameplay/Battler/UnitRuntime.cs` y `Assets/Scripts/Gameplay/Battler/LaneRegistry.cs` tras T016: confirmar que ninguna rama de `AttackType` introducida en T007-T015 quedó condicionada por `m_Team`/`seekerTeam` más allá del filtro de equipo ya existente en `LaneRegistry` (FR-007); si T016 revela una asimetría, corregirla aquí — se espera que no requiera cambios de código dado el diseño de research.md §1 (hace pasar T016) — depende de T016

**Checkpoint**: Las 4 historias de usuario funcionan de forma independiente y en conjunto — Área/Único/Larga Distancia se comportan igual para `Team.Player` y `Team.Enemy`, incluida la base como objetivo válido.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T018 Revisar que la implementación final no se haya desviado de [contracts/lane-registry-targeting.md](./contracts/lane-registry-targeting.md) / [contracts/unit-attack-type-behavior.md](./contracts/unit-attack-type-behavior.md) / [data-model.md](./data-model.md); actualizar esos documentos si hubo un cambio deliberado durante la implementación
- [X] T019 Correr la suite completa EditMode + PlayMode (001-003 + Attack Types) en modo batch de Unity y confirmar 0 errores/0 warnings de compilación y 100% de tests en verde, incluyendo las 5 `UnitDefinition` de jugador y `Unit_EnemyGrunt.asset` de 001 sin modificar (SC-004)
- [X] T020 Ejecutar una aproximación automatizada de los 10 pasos de [quickstart.md](./quickstart.md) — cambio temporal de `AttackType` vía Inspector/script sobre `Unit_Mago.asset`/`Unit_EnemyGrunt.asset` en Play Mode, confirmación de comportamiento por historia, y verificación final de que ningún `.asset` de unidad existente queda modificado en disco (`git status` limpio sobre `Assets/ScriptableObjects/Battler/Chapter1/Units/`)

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Fase 1)**: sin dependencias — puede empezar de inmediato
- **Foundational (Fase 2)**: depende de Setup — bloquea las 4 historias de usuario
- **User Stories (Fase 3-6)**: todas dependen de Foundational; dentro de cada historia, los tests preceden a su implementación correspondiente
- **Polish (Fase 7)**: depende de que las 4 historias estén completas

### User Story Dependencies

- **US1 (P1)**: puede empezar tras Foundational — sin dependencia de otras historias de usuario (introduce `FindAllTargetsInRange` y la rama `Area`)
- **US2 (P1)**: puede empezar tras Foundational; su Independent Test no depende de US1, pero comparte `UnitRuntime.cs` (T008/T009), por lo que en la práctica se implementa después
- **US3 (P2)**: puede empezar tras Foundational; su Independent Test no depende de US1/US2, pero comparte `LaneRegistry.cs` y `UnitRuntime.cs` con ambas, por lo que en la práctica se implementa después
- **US4 (P2)**: depende funcionalmente de que US1-US3 ya tengan sus tres ramas implementadas — su Independent Test verifica la simetría de un comportamiento que debe existir primero para `Team.Player`

### Within Each User Story

- Tests (PlayMode/EditMode) preceden a la implementación correspondiente dentro de cada fase
- `LaneRegistry` (consultas) antes que `UnitRuntime` (consumidor) dentro de cada historia que introduce una consulta nueva
- Historia completa antes de pasar a la siguiente en orden de prioridad

### Parallel Opportunities

- T002 (enum `AttackType`) no tiene dependencias — bloquea T003/T004 pero puede completarse de inmediato en Fase 2
- T005 (test `FindAllTargetsInRange`) y T006 (test PlayMode US1) son archivos distintos — paralelizables entre sí
- T012 (test `FindFarthestTarget`, mismo archivo que T005 pero sección distinta) y T013 (test PlayMode US3) son paralelizables entre sí; T012 con T005 requiere coordinación de archivo compartido (secuencial en la práctica)
- T007 (`FindAllTargetsInRange`) y T014 (`FindFarthestTarget`) tocan el mismo archivo (`LaneRegistry.cs`) — secuenciales en la práctica aunque pertenezcan a historias distintas
- Las implementaciones de US1/US2/US3 comparten `UnitRuntime.cs` (T008/T009/T011/T015), por lo que sus tareas de implementación son intrínsecamente secuenciales entre historias, aunque cada historia sea conceptualmente independiente y su Independent Test no dependa de las otras
- US4 (T016/T017) es mayormente verificación — puede empezar tan pronto T009, T011 y T015 estén completas, en paralelo con el resto de Fase 7 aún no iniciado

---

## Parallel Example: Foundational + User Story 1

```bash
# Fase 2 (Foundational) — un único archivo nuevo sin dependencias:
Task: "Crear el enum AttackType en Assets/Scripts/Core/Battler/AttackType.cs"

# Fase 3 (US1) — tests en archivos distintos, lanzables juntos tras Foundational:
Task: "EditMode tests FindAllTargetsInRange en Assets/Tests/EditMode/Battler/LaneRegistryTargetingTests.cs"
Task: "PlayMode test US1 en Assets/Tests/PlayMode/Battler/AttackTypeBattlePlayModeTests.cs"
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 2)

1. Completar Fase 1: Setup
2. Completar Fase 2: Foundational (bloqueante)
3. Completar Fase 3: US1 (Área daña a todos en rango)
4. Completar Fase 4: US2 (Único daña a uno y reasigna) — contraste directo de US1, ambas P1
5. **Detener y validar**: correr T006/T010 en verde de forma aislada
6. Esto ya es útil por sí solo: las dos historias P1 dan sentido táctico al sistema de tipos de ataque (Área vs. Único) sin depender aún de Larga Distancia ni de la simetría con enemigos

### Incremental Delivery

1. Setup + Foundational → `AttackType` existe y `UnitDefinition` lo expone con default correcto
2. + US1 → Área daña a todos en rango (MVP parcial)
3. + US2 → Único daña a uno y reasigna (MVP completo — ambas P1)
4. + US3 → Larga Distancia alcanza más allá del más cercano
5. + US4 → simetría verificada con `Team.Enemy` y con la base como objetivo
6. Fase 7 → verificación final y quickstart manual

## Notes

- [P] = archivos distintos, sin dependencias pendientes
- US1/US2/US3 comparten `Assets/Scripts/Gameplay/Battler/UnitRuntime.cs` y, parcialmente, `Assets/Scripts/Gameplay/Battler/LaneRegistry.cs`, porque las tres son ramas del mismo `switch`/`if` sobre `AttackType` en los dos mismos puntos de inserción ya identificados en research.md §1 — no se introduce una capa de resolución de ataque nueva (Principio VI)
- `AttackTypeBattlePlayModeTests.cs` y `LaneRegistryTargetingTests.cs` son archivos únicos compartidos por varias historias (US1-US4 y US1/US3 respectivamente) porque agrupan aserciones sobre el mismo comportamiento ya cubierto por sección, siguiendo el mismo criterio de agrupación por servicio pequeño que 003 aplicó a `MainMenuFlowPlayModeTests.cs`
- US4 no introduce ningún método/campo nuevo — es intencionalmente una fase de verificación (T016) más una revisión de guarda (T017), reflejando que FR-007 se cumple por construcción del diseño de US1-US3 (research.md §1, contracts/unit-attack-type-behavior.md § Simetría jugador/enemigo)
- Las 5 `UnitDefinition` de jugador y `Unit_EnemyGrunt.asset` de 001 no se editan en ninguna tarea de este archivo — su `AttackType` por defecto (`SingleTarget`) cubre FR-008/SC-004 sin migración (research.md §6); solo se tocan temporalmente durante la validación manual de T020 (quickstart.md), sin dejar cambios en disco
