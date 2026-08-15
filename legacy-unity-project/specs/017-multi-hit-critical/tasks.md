---

description: "Task list template for feature implementation"
---

# Tasks: Extensión de Tipos de Ataque — Multi-Golpe y Crítico

**Input**: Design documents from `/specs/017-multi-hit-critical/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/multi-hit-sequence.md](./contracts/multi-hit-sequence.md), [contracts/critical-damage.md](./contracts/critical-damage.md), [quickstart.md](./quickstart.md)

**Tests**: Incluidos — mismo patrón de verificación real (EditMode/PlayMode) ya establecido en 001-016.

**Organization**: Tareas agrupadas por historia de usuario (US1-US3, según spec.md) para permitir implementación y prueba independientes de cada una.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: Historia de usuario a la que pertenece la tarea
- Cada tarea incluye la ruta exacta del archivo

## Path Conventions

Proyecto único de Unity — capas `Assets/Scripts/{Core,Model,Gameplay}/Battler/`, tests en `Assets/Tests/{EditMode,PlayMode}/Battler/`, según [plan.md § Project Structure](./plan.md#project-structure).

---

## Phase 1: Setup

**Purpose**: Confirmar línea base antes de tocar código.

- [X] T001 Correr la suite EditMode + PlayMode existente (001-016) en modo batch de Unity sobre `C:\Users\Usuario\Documents\GitHub\IA GAME\the_battler_test` y confirmar que sigue en verde antes de empezar, como línea base de referencia.

**Checkpoint**: Línea base verde confirmada antes de tocar código.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: El enum extendido y los campos de datos nuevos que las 3 historias de usuario necesitan. Ninguna historia puede implementarse ni probarse sin esto.

**⚠️ CRITICAL**: Ninguna tarea de Fase 3+ puede empezar hasta completar esta fase.

- [X] T002 [P] Extender el enum `AttackType` en `Assets/Scripts/Core/Battler/AttackType.cs` con `MultiHit` (3) y `Critical` (4) al final (`SingleTarget`/`Area`/`LongDistance` conservan 0/1/2, sin reordenar), según [data-model.md § AttackType enum](./data-model.md#attacktype-enum-extendido-assetsscriptscorebattlerattacktypecs) y FR-001
- [X] T003 [P] Añadir `m_MultiHitCount` (`int`, `[Min(1)]`, default `1`) y `m_CriticalChance` (`float`, `[Range(0f,1f)]`, default `0f`) con sus propiedades públicas `MultiHitCount`/`CriticalChance` a `Assets/Scripts/Model/Battler/UnitDefinition.cs`, más el clamp correspondiente de `m_MultiHitCount` en `OnValidate()`, según [data-model.md § UnitDefinition](./data-model.md#unitdefinition-extendido-assetsscriptsmodelbattlerunitdefinitioncs)
- [X] T004 [P] EditMode test en `Assets/Tests/EditMode/Battler/UnitDefinitionAttackTypeDefaultsTests.cs` (archivo nuevo): una `UnitDefinition` creada sin asignar `m_MultiHitCount`/`m_CriticalChance` expone `MultiHitCount == 1` y `CriticalChance == 0f` (FR-009) — depende de T003

**Checkpoint**: Enum y campos de datos listos — las 3 historias de usuario pueden empezar.

---

## Phase 3: User Story 1 - Un ataque de Multi-Golpe inflige varios impactos en una sola secuencia (Priority: P1) 🎯 MVP

**Goal**: Una unidad con `AttackType.MultiHit` inflige N impactos de daño independientes durante una secuencia de ataque sin interrupción.

**Independent Test**: Desplegar una unidad con "Multi-Golpe" configurada con N golpes contra un enemigo de prueba y contar los impactos de daño independientes registrados durante una secuencia completa (spec.md US1).

### Tests for User Story 1 ⚠️

- [X] T005 [P] [US1] PlayMode test en `Assets/Tests/PlayMode/Battler/MultiHitCriticalAttackBattlePlayModeTests.cs` (archivo nuevo): US1 Escenario 1 (una unidad Multi-Golpe configurada con N golpes inflige exactamente N impactos de daño independientes contra un enemigo en rango durante una secuencia sin interrupción), Escenario 2 (sin ningún enemigo en rango, el cooldown se cumple sin infligir ningún impacto) — este archivo se extiende en T008 (US2) y T010 (US3) — depende de T002, T003

### Implementation for User Story 1

- [X] T006 [US1] En `Assets/Scripts/Gameplay/Battler/UnitRuntime.cs`: añadir los campos `m_MultiHitRemainingHits`/`m_MultiHitTarget`/`m_MultiHitIntervalRemaining` y la constante `c_MultiHitIntervalSeconds`; implementar la rama completa de `Attack()` para `AttackType.MultiHit` según [contracts/multi-hit-sequence.md](./contracts/multi-hit-sequence.md) — incluye desde el inicio el chequeo de invalidación de objetivo (destruido/fuera de rango) porque es parte inherente del mismo método atómico, mismo criterio que `specs/015-special-event-banner/tasks.md` documentó para `TrySelectEventBanner` (no se separa artificialmente en dos tareas de implementación) — depende de T002, T003 (hace pasar T005)
- [X] T007 [US1] En `Assets/Scripts/Gameplay/Battler/UnitRuntime.cs` (mismo archivo que T006, secuencial): resetear `m_MultiHitRemainingHits`/`m_MultiHitTarget`/`m_MultiHitIntervalRemaining` a sus valores neutros (`0`/`null`/`0f`) en `Initialize()`, mismo criterio F2 ya aplicado por `016-combat-ability-catalog` a sus propios temporizadores — depende de T006

**Checkpoint**: US1 completa y verificable de forma independiente — Multi-Golpe funciona en el caso feliz (sin interrupción).

---

## Phase 4: User Story 2 - Una secuencia de Multi-Golpe interrumpida se descarta sin dejar golpes pendientes (Priority: P2)

**Goal**: Si el objetivo de una secuencia de Multi-Golpe se invalida (destruido o fuera de rango) antes del último golpe, los golpes restantes no se aplican a ningún otro objetivo, y la siguiente secuencia empieza desde cero.

**Independent Test**: Iniciar una secuencia de Multi-Golpe, invalidar el objetivo a mitad de camino, y confirmar que no se aplican golpes adicionales a otro objetivo; confirmar que la siguiente secuencia arranca completa (spec.md US2).

### Tests for User Story 2 ⚠️

- [X] T008 [US2] Extender `Assets/Tests/PlayMode/Battler/MultiHitCriticalAttackBattlePlayModeTests.cs` (mismo archivo que T005, secuencial): US2 Escenario 1 (destruir o sacar de rango al objetivo a mitad de una secuencia de Multi-Golpe descarta los golpes restantes sin aplicarlos a ningún otro objetivo), Escenario 2 (tras esa interrupción, la siguiente secuencia contra un nuevo objetivo arranca con `MultiHitCount` completo, no continúa desde el punto de interrupción) — depende de T006

### Implementation for User Story 2

- [X] T009 [US2] Verificación de diseño (no se espera código nuevo — mismo criterio que `specs/015-special-event-banner/tasks.md` US3, T024): confirmar que el guard de invalidación ya implementado en T006 (`contracts/multi-hit-sequence.md`) cubre ambos escenarios de T008; si T008 revela un caso no cubierto, la corrección se aplica dentro de la misma rama de `Attack()` ya creada en T006, nunca como una rama nueva paralela — depende de T008

**Checkpoint**: US1 y US2 funcionan juntas — Multi-Golpe es resiliente a la interrupción de su objetivo.

---

## Phase 5: User Story 3 - Un ataque Crítico inflige el doble de daño con probabilidad configurable (Priority: P1) 🎯 MVP

**Goal**: Una unidad con `AttackType.Critical` tiene una probabilidad configurable de infligir el doble de daño en un ataque dado.

**Independent Test**: Con la probabilidad de crítico fijada a un valor conocido (0%/100%), desplegar la unidad y confirmar que el daño observado corresponde de forma consistente al valor esperado (spec.md US3).

### Tests for User Story 3 ⚠️

- [X] T010 [P] [US3] Extender `Assets/Tests/PlayMode/Battler/MultiHitCriticalAttackBattlePlayModeTests.cs` (mismo archivo que T005/T008, secuencial): US3 Escenario 1 (`CriticalChance = 1f` ⇒ el 100% de los ataques observados infligen el doble de daño base), Escenario 2 (`CriticalChance = 0f` ⇒ el 0% lo hace), Escenario 3 (`UnityEngine.Random.InitState(<seed fijo>)` + `CriticalChance = 0.5f` + 100 ataques observados ⇒ entre 35 y 65 golpes críticos, SC-004) — depende de T002, T003

### Implementation for User Story 3

- [X] T011 [US3] En `Assets/Scripts/Gameplay/Battler/UnitRuntime.cs` (mismo archivo que T006/T007, secuencial): extender `ComputeOutgoingDamage()` con el multiplicador de Crítico según [contracts/critical-damage.md](./contracts/critical-damage.md) (`criticalMultiplier = 2f` cuando `AttackType == Critical` y el roll de `UnityEngine.Random.value` cae por debajo de `CriticalChance`, compuesto con `dealtMultiplier`/`weakenMultiplier` ya existentes antes del `Mathf.Max(1, ...)` final) — depende de T002, T003, T006 (comparte archivo, hace pasar T010)

**Checkpoint**: Las 3 historias de usuario quedan completas e independientemente funcionales — Multi-Golpe y Crítico operativos de punta a punta.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T012 [P] Extender `Assets/Tests/PlayMode/Battler/MultiHitCriticalAttackBattlePlayModeTests.cs` (mismo archivo, secuencial): repetir los escenarios clave de US1/US3 con `Team.Enemy` para confirmar la simetría jugador/enemigo (FR-008) — depende de T006, T011
- [X] T013 [P] Revisar que la implementación final no se haya desviado de [contracts/multi-hit-sequence.md](./contracts/multi-hit-sequence.md) / [contracts/critical-damage.md](./contracts/critical-damage.md) / [data-model.md](./data-model.md); actualizar esos documentos si hubo un cambio deliberado durante la implementación
- [X] T014 Correr la suite completa EditMode + PlayMode (001-017) en modo batch de Unity y confirmar 0 errores/0 warnings de compilación y 100% de tests en verde
- [ ] T015 Ejecutar los 9 pasos de validación manual de [quickstart.md](./quickstart.md) contra `Chapter1_Battle.unity`, confirmando que ningún `.asset` de unidad existente queda modificado en disco al finalizar (mismo criterio que `007-attack-types`/`016-combat-ability-catalog`) — **probablemente requiera el Editor con GUI**, mismo criterio documentado para pasos equivalentes en specs anteriores

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Fase 1)**: sin dependencias — puede empezar de inmediato
- **Foundational (Fase 2)**: depende de Setup — bloquea las 3 historias de usuario
- **User Stories (Fase 3-5)**: todas dependen de Foundational; dentro de cada historia, los tests preceden a su implementación correspondiente
- **Polish (Fase 6)**: depende de que las 3 historias estén completas

### User Story Dependencies

- **US1 (P1)**: puede empezar tras Foundational — sin dependencia de otras historias; entrega Multi-Golpe funcional en el caso feliz
- **US2 (P2)**: depende de que exista la implementación base de Multi-Golpe (US1, T006) para tener algo que interrumpir — conceptualmente es una propiedad del mismo método atómico que US1 ya construyó, no una rama de código separada (mismo criterio que spec 015 documentó para US3/`TrySelectEventBanner`)
- **US3 (P1)**: puede empezar tras Foundational en paralelo con US1/US2 — su implementación (T011) comparte archivo con T006/T007 (`UnitRuntime.cs`), por lo que en la práctica se secuencia con ellas, pero no depende conceptualmente de Multi-Golpe

### Parallel Opportunities

- T002, T003 (Fase 2) son independientes entre sí — archivos distintos
- T004 (test de defaults) puede prepararse en paralelo con T002, aunque dependa de T003 para pasar en verde
- T005 (test de US1) y T010 (test de US3) son independientes en su redacción — ambos dependen solo de T002/T003, aunque compartan el mismo archivo de test (secuencial al escribirse, no al diseñarse)
- T012 (simetría FR-008) puede prepararse en paralelo con la redacción de otros tests, aunque dependa de T006/T011 para pasar en verde

---

## Parallel Example: Foundational (Fase 2)

```bash
# Lanzar juntos el enum y el campo de datos nuevo (archivos distintos, sin dependencias entre sí):
Task: "Extender AttackType en Assets/Scripts/Core/Battler/AttackType.cs"
Task: "Extender UnitDefinition en Assets/Scripts/Model/Battler/UnitDefinition.cs"
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 3)

1. Completar Fase 1: Setup
2. Completar Fase 2: Foundational (bloqueante — enum y campos de datos)
3. Completar Fase 3: US1 (Multi-Golpe, caso feliz)
4. Completar Fase 5: US3 (Crítico) — ambas P1, spec.md las trata como el núcleo funcional de esta feature
5. **Detener y validar**: correr T005/T010 en verde de forma aislada, luego el quickstart.md pasos 1-3, 5-6 con GUI
6. Esto ya es útil por sí solo: Multi-Golpe y Crítico funcionan de punta a punta en el caso feliz

### Incremental Delivery

1. Setup + Foundational → enum y campos de datos listos
2. + US1 + US3 → Multi-Golpe (caso feliz) y Crítico funcionales (MVP)
3. + US2 → resiliencia de Multi-Golpe ante interrupción de objetivo
4. Fase 6 → simetría jugador/enemigo, verificación final y quickstart manual con GUI

## Notes

- [P] = archivos distintos, sin dependencias pendientes
- US1 incluye desde el principio el chequeo de invalidación de objetivo dentro de la rama de `Attack()` para `MultiHit`, porque es un único método atómico — mismo criterio que `015-special-event-banner` aplicó a `TrySelectEventBanner` y que `006-mission-energy-system` aplicó a `TrySelectBanner`; US2 solo añade la cobertura de test de ese comportamiento ya presente, no una rama de código nueva
- T006/T007/T011/T012 viven todos en el mismo archivo `UnitRuntime.cs`, siguiendo el mismo patrón de edición secuencial de un archivo compartido ya documentado en `specs/008-classification-trait-abilities/tasks.md` y `specs/016-combat-ability-catalog/tasks.md`
- T005/T008/T010/T012 (mismo archivo `MultiHitCriticalAttackBattlePlayModeTests.cs`) se extienden de forma secuencial entre historias, siguiendo el mismo patrón ya usado en specs anteriores
- El roll de `UnityEngine.Random` para Crítico se siembra (`InitState`) únicamente dentro del test de T010 Escenario 3 — no se introduce ninguna interfaz de aleatoriedad nueva en el código de producción (research.md §4)
- T015 probablemente requiera un humano en el Editor de Unity (GUI) para la inspección visual de la secuencia de golpes y el daño crítico, igual que quedó documentado para pasos equivalentes en specs anteriores
