---

description: "Task list template for feature implementation"
---

# Tasks: Clasificación de Unidades/Enemigos y Habilidades Avanzadas (Trait-Targeting, Neutral, Immunities)

**Input**: Design documents from `/specs/008-classification-trait-abilities/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/effect-receiver.md](./contracts/effect-receiver.md), [contracts/trait-targeting-matching.md](./contracts/trait-targeting-matching.md), [contracts/unit-runtime-ability-behavior.md](./contracts/unit-runtime-ability-behavior.md), [quickstart.md](./quickstart.md)

**Tests**: Incluidos — mismo patrón de verificación real (EditMode/PlayMode) ya establecido en 001-007, y research.md §8 define explícitamente la estrategia de testing de esta feature.

**Organization**: Tareas agrupadas por historia de usuario (US1-US5, según spec.md) para permitir implementación y prueba independientes de cada una.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: Historia de usuario a la que pertenece la tarea
- Cada tarea incluye la ruta exacta del archivo

## Path Conventions

Proyecto único de Unity — capas `Assets/Scripts/{Core,Model,Gameplay}/Battler/`, activos `.asset` en `Assets/ScriptableObjects/Battler/Chapter1/Units/`, y tests en `Assets/Tests/{EditMode,PlayMode}/Battler/`, según [plan.md § Project Structure](./plan.md#project-structure).

---

## Phase 1: Setup

**Purpose**: Confirmar línea base antes de tocar código.

- [X] T001 Correr la suite EditMode + PlayMode existente (001-007) en modo batch de Unity sobre `C:\Users\Usuario\Documents\GitHub\IA GAME\the_battler_test` y confirmar que sigue en verde (0 errores de compilación, todos los tests en verde) antes de empezar, como línea base de referencia.

**Checkpoint**: Línea base verde confirmada antes de tocar código.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Los tres enums nuevos y el contrato `IEffectReceiver`, compartidos por las 5 historias de usuario — ninguna historia puede autorar datos de clasificación (US1) ni evaluar/aplicar habilidades (US2-US5) sin ellos.

**⚠️ CRITICAL**: Ninguna tarea de Fase 3+ puede empezar hasta completar esta fase.

- [X] T002 [P] Crear el enum `ClassificationType` (`Traitless`=0, `Red`, `Floating`, `Black`, `Angel`, `Alien`, `Zombie`, `Relic`) en `Assets/Scripts/Core/Battler/ClassificationType.cs`, según [data-model.md § ClassificationType](./data-model.md)
- [X] T003 [P] Crear el enum `SpecialClassificationType` (`None`=0, `Typeless`, `Colossus`, `Behemoth`, `Sage`, `Metal`, `Witch`, `EvaAngel`) en `Assets/Scripts/Core/Battler/SpecialClassificationType.cs`, según [data-model.md § SpecialClassificationType](./data-model.md) — nota `None` ≠ `Typeless` (research.md §2)
- [X] T004 [P] Crear el enum `AbilityEffectType` (`Curse`, abierto a extensión futura) en `Assets/Scripts/Core/Battler/AbilityEffectType.cs`, según [data-model.md § AbilityEffectType](./data-model.md)
- [X] T005 Crear la interfaz `IEffectReceiver` (`ClassificationType`/`SpecialClassificationType` get; `IsImmuneTo(AbilityEffectType)`; `ApplyEffect(AbilityEffectType, float)`) en `Assets/Scripts/Core/Battler/IEffectReceiver.cs`, según [contracts/effect-receiver.md](./contracts/effect-receiver.md) — depende de T002, T003, T004

**Checkpoint**: Enums y contrato de `Core` listos — las 5 historias de usuario pueden empezar.

---

## Phase 3: User Story 1 - Clasificar unidades y enemigos con un tipo (Priority: P1) 🎯 MVP

**Goal**: Cada `UnitDefinition` declara un `ClassificationType` estándar obligatorio y, opcionalmente, un `SpecialClassificationType`, con default `Traitless`/`None` para no romper las unidades ya existentes de 001/007.

**Independent Test**: Revisar los datos de las unidades y enemigos existentes (incluidos los 5 de `001-chapter1-vertical-slice`) y confirmar que cada uno tiene un tipo estándar asignado y, si aplica, un tipo especial, sin que el combate existente deje de funcionar.

### Tests for User Story 1 ⚠️

> Estos tests deben escribirse primero y fallar antes de las tareas de implementación de esta fase.

- [X] T006 [P] [US1] EditMode test en `Assets/Tests/EditMode/Battler/UnitDefinitionClassificationDefaultsTests.cs` (archivo nuevo): una `UnitDefinition` creada vía `ScriptableObject.CreateInstance` sin asignar `m_ClassificationType`/`m_SpecialClassificationType` expone `ClassificationType.Traitless` y `SpecialClassificationType.None` (FR-001, FR-002, FR-010, Acceptance Scenario 2 de US1) — este archivo se extiende en T015/T022 con los defaults de arrays de habilidades/inmunidades

### Implementation for User Story 1

- [X] T007 [US1] Añadir el campo `m_ClassificationType` (`ClassificationType`, default `Traitless`) y la propiedad pública `ClassificationType` a `Assets/Scripts/Model/Battler/UnitDefinition.cs`, según [data-model.md § UnitDefinition](./data-model.md) (hace pasar la mitad de T006) — depende de T002
- [X] T008 [US1] Añadir el campo `m_SpecialClassificationType` (`SpecialClassificationType`, default `None`) y la propiedad pública `SpecialClassificationType` a `Assets/Scripts/Model/Battler/UnitDefinition.cs` (mismo archivo que T007, secuencial; hace pasar el resto de T006) — depende de T003, T007

**Checkpoint**: US1 completa y verificable de forma independiente — toda `UnitDefinition` nueva o ya serializada expone `Traitless`/`None` por defecto; las 5 unidades del jugador y el enemigo de 001/007 siguen funcionando sin reautorado (FR-010, SC-006).

---

## Phase 4: User Story 2 - Una habilidad de trait-targeting solo afecta a los tipos que declara (Priority: P1) 🎯 MVP

**Goal**: Una unidad con una `TraitTargetingAbility` configurada contra un tipo específico aplica su efecto (`Curse`) solo contra enemigos de ese tipo, y no contra enemigos de otro tipo.

**Independent Test**: Enfrentar una unidad con una habilidad de trait-targeting contra un enemigo del tipo objetivo y otro de un tipo distinto, y confirmar que el efecto solo se aplica contra el primero.

### Tests for User Story 2 ⚠️

- [X] T009 [P] [US2] EditMode test en `Assets/Tests/EditMode/Battler/TraitTargetingAbilityMatchingTests.cs` (archivo nuevo): filas 1-2 de la tabla de verdad de [contracts/trait-targeting-matching.md](./contracts/trait-targeting-matching.md) (objetivo sin tipo especial, coincide/no coincide con `m_TargetClassificationTypes`), más `m_TargetClassificationTypes` con un único valor (no los 8) coincide solo con ese valor — cubre SC-001; este archivo se extiende en T020 con las filas 3-4 (FR-004)
- [X] T010 [US2] PlayMode test en `Assets/Tests/PlayMode/Battler/ClassificationAbilityBattlePlayModeTests.cs` (archivo nuevo, mismo patrón que `AttackTypeBattlePlayModeTests` de 007 — `ScriptableObject.CreateInstance<UnitDefinition>()` + reflexión): US2 Escenario 1 (unidad con `TraitTargetingAbility` `Effect Type = Curse` contra tipo declarado → el objetivo queda `IsCursed`) y Escenario 2 (mismo ataque contra un tipo distinto → el objetivo NO queda `IsCursed`, solo recibe el daño base ya aplicado) — depende de T007, T008 para construir los `UnitDefinition` de prueba

### Implementation for User Story 2

- [X] T011 [P] [US2] Crear la clase `[Serializable]` `TraitTargetingAbility` (`m_EffectType`, `m_DurationSeconds`, `m_TargetClassificationTypes[]`, `m_IncludedSpecialTypes[]`, método `MatchesTarget(ClassificationType, SpecialClassificationType)`) en `Assets/Scripts/Model/Battler/TraitTargetingAbility.cs`, según [data-model.md § TraitTargetingAbility](./data-model.md) y el algoritmo completo de [contracts/trait-targeting-matching.md](./contracts/trait-targeting-matching.md) (hace pasar T009) — depende de T002, T003, T004
- [X] T012 [US2] Añadir el campo `m_TraitTargetingAbilities` (`TraitTargetingAbility[]`, default vacío) y la propiedad pública `TraitTargetingAbilities` a `Assets/Scripts/Model/Battler/UnitDefinition.cs` (mismo archivo que T007/T008, secuencial) — depende de T011, T008
- [X] T013 [US2] Implementar `IEffectReceiver` en `Assets/Scripts/Gameplay/Battler/UnitRuntime.cs`: propiedades passthrough `ClassificationType`/`SpecialClassificationType` (`m_Source.ClassificationType`/`m_Source.SpecialClassificationType`); campo privado `m_CurseRemainingSeconds` y propiedad derivada `IsCursed`; descuento del temporizador en `Update()` (`Mathf.Max(0f, m_CurseRemainingSeconds - Time.deltaTime)`); `ApplyEffect(AbilityEffectType, float)` con la rama `Curse` (`Mathf.Max(m_CurseRemainingSeconds, durationSeconds)`, no-op para cualquier otro valor); `IsImmuneTo(AbilityEffectType)` como stub que devuelve siempre `false` (sin `Immunity` todavía — se reemplaza en T027) — según [contracts/effect-receiver.md](./contracts/effect-receiver.md) — depende de T005, T007, T008
- [X] T014 [US2] Añadir el método privado `ApplyAbilitiesTo(ILaneOccupant target)` a `UnitRuntime.cs` (recorre `m_Source.TraitTargetingAbilities`, invoca `receiver.ApplyEffect(...)` cuando `MatchesTarget` coincide, con guard `target is IEffectReceiver receiver`) e invocarlo inmediatamente después de cada `ApplyDamage(...)` ya existente en `Attack()` (para uno o varios objetivos según `AttackType`, extendiendo el mismo punto de inserción que 007 documentó) en `Assets/Scripts/Gameplay/Battler/UnitRuntime.cs`, según [contracts/unit-runtime-ability-behavior.md](./contracts/unit-runtime-ability-behavior.md) (hace pasar T010) — depende de T012, T013

**Checkpoint**: US1 y US2 funcionan de forma independiente y en conjunto — el núcleo de trait-targeting (FR-003, FR-005) queda operativo end-to-end; esto ya es el valor central de la feature (SC-001).

---

## Phase 5: User Story 3 - Una neutral ability afecta a cualquier enemigo sin importar su tipo (Priority: P2)

**Goal**: Una unidad con una `NeutralAbility` aplica su efecto contra cualquier enemigo, incluidos los de tipo especial, sin restricción de clasificación.

**Independent Test**: Aplicar una unidad con habilidad neutral contra enemigos de distintos tipos (estándar y especial) y confirmar que el efecto se aplica en todos los casos.

### Tests for User Story 3 ⚠️

- [X] T015 [P] [US3] Extender `Assets/Tests/EditMode/Battler/UnitDefinitionClassificationDefaultsTests.cs` (mismo archivo que T006, secuencial): una `UnitDefinition` sin `m_NeutralAbilities` asignado expone un array vacío (FR-010)
- [X] T016 [US3] Extender `Assets/Tests/PlayMode/Battler/ClassificationAbilityBattlePlayModeTests.cs` (mismo archivo que T010, secuencial): US3 Escenario 1 — una `NeutralAbility` (`Effect Type = Curse`) aplicada contra un objetivo de tipo estándar cualquiera y otro con tipo especial declarado (p. ej. `Metal`) deja a ambos `IsCursed`, sin excepción por tipo especial (contraste explícito con US4) — depende de T010

### Implementation for User Story 3

- [X] T017 [P] [US3] Crear la clase `[Serializable]` `NeutralAbility` (`m_EffectType`, `m_DurationSeconds`, sin campos de targeting) en `Assets/Scripts/Model/Battler/NeutralAbility.cs`, según [data-model.md § NeutralAbility](./data-model.md) — depende de T004
- [X] T018 [US3] Añadir el campo `m_NeutralAbilities` (`NeutralAbility[]`, default vacío) y la propiedad pública `NeutralAbilities` a `Assets/Scripts/Model/Battler/UnitDefinition.cs` (mismo archivo que T007/T008/T012, secuencial; hace pasar T015) — depende de T017, T012
- [X] T019 [US3] Extender `ApplyAbilitiesTo` en `Assets/Scripts/Gameplay/Battler/UnitRuntime.cs` (mismo método que T014, secuencial) para recorrer también `m_Source.NeutralAbilities`, invocando `receiver.ApplyEffect(...)` incondicionalmente por cada una, sin condición de coincidencia (FR-006) (hace pasar T016) — depende de T014, T018

**Checkpoint**: US1, US2 y US3 funcionan de forma independiente y en conjunto — trait-targeting y neutral coexisten sin conflicto (FR-006, SC-002).

---

## Phase 6: User Story 4 - Un tipo especial queda fuera de habilidades "contra todos" salvo que se lo apunte explícitamente (Priority: P2)

**Goal**: Una habilidad de trait-targeting configurada como "contra todos los tipos estándar" (los 8 valores de `ClassificationType`) no afecta a un enemigo de tipo especial salvo que esa habilidad lo incluya explícitamente en `includedSpecialTypes`.

**Independent Test**: Enfrentar una habilidad "contra todos los enemigos estándar" contra un enemigo de tipo especial y confirmar que no recibe el efecto; luego enfrentarla contra una habilidad configurada para incluir explícitamente ese tipo especial y confirmar que sí lo recibe.

**Nota de implementación**: `MatchesTarget` (T011) ya implementa el algoritmo completo de FR-003/FR-004 como una única función pura sin ramas parciales (research.md §4, contracts/trait-targeting-matching.md) — esta historia no añade producción nueva, solo verifica de forma explícita y dedicada el comportamiento de exclusión que T011/T014 ya entregaron, confirmando que la decisión de diseño de una sola lista sin flag adicional (Complexity Tracking de plan.md) satisface FR-004/SC-003.

### Tests for User Story 4 ⚠️

- [X] T020 [P] [US4] Extender `Assets/Tests/EditMode/Battler/TraitTargetingAbilityMatchingTests.cs` (mismo archivo que T009, secuencial) con las filas 3-4 de la tabla de verdad de [contracts/trait-targeting-matching.md](./contracts/trait-targeting-matching.md) — **el contract test dirigido por tabla de verdad para el algoritmo de exclusión "contra todos" de FR-004**: (a) objetivo con `SpecialClassificationType` declarado (p. ej. `Metal`) + `m_TargetClassificationTypes` con los 8 valores de `ClassificationType` + `m_IncludedSpecialTypes` vacío → `MatchesTarget` devuelve `false` (FR-004, ignora por completo la lista estándar completa); (b) misma habilidad + `Metal` añadido a `m_IncludedSpecialTypes` → devuelve `true`; más `m_IncludedSpecialTypes` vacío + cualquier objetivo con tipo especial declarado → siempre `false` — depende de T011
- [X] T021 [US4] Extender `Assets/Tests/PlayMode/Battler/ClassificationAbilityBattlePlayModeTests.cs` (mismo archivo que T010/T016, secuencial): US4 Escenario 1 (unidad con `TraitTargetingAbility` autorada con los 8 `ClassificationType` como "contra todos" contra un enemigo con `SpecialClassificationType = Metal` → el enemigo NO queda `IsCursed`) y Escenario 2 (misma habilidad, con `Metal` añadido a `Included Special Types` → el enemigo SÍ queda `IsCursed`) — depende de T014

**Checkpoint**: US1-US4 funcionan de forma independiente y en conjunto — la exclusión de tipos especiales de "contra todos" queda verificada de extremo a extremo (FR-004, SC-003), razón de ser de los tipos especiales dentro de la clasificación.

---

## Phase 7: User Story 5 - Las inmunidades anulan efectos específicos, incluyendo Curse (Priority: P3)

**Goal**: Una unidad/enemigo con `Immunity` declarada a un efecto no sufre ese efecto al recibirlo; el efecto `Curse` deshabilita todas las habilidades especiales propias de la unidad afectada mientras dura, salvo inmunidad a Curse, y se recuperan al expirar.

**Independent Test**: Aplicar un efecto (por ejemplo, Curse) contra una unidad con inmunidad a ese efecto y otra sin ella, y confirmar que la inmune no sufre ningún cambio, mientras que la no inmune pierde el uso de sus habilidades especiales mientras dura el efecto.

### Tests for User Story 5 ⚠️

- [X] T022 [P] [US5] Extender `Assets/Tests/EditMode/Battler/UnitDefinitionClassificationDefaultsTests.cs` (mismo archivo que T006/T015, secuencial): una `UnitDefinition` sin `m_Immunities` asignado expone un array vacío (FR-010)
- [X] T023 [P] [US5] EditMode test en `Assets/Tests/EditMode/Battler/ImmunityTests.cs` (archivo nuevo): `Blocks(effectType)` devuelve `true` solo cuando `effectType` coincide exactamente con el `AbilityEffectType` declarado, `false` en cualquier otro caso
- [X] T024 [US5] Extender `Assets/Tests/PlayMode/Battler/ClassificationAbilityBattlePlayModeTests.cs` (mismo archivo que T010/T016/T021, secuencial): US5 Escenario 1 (objetivo con `Immunity` a `Curse` recibe una habilidad coincidente → no queda `IsCursed`, ningún cambio de comportamiento); Edge Case de spec.md (inmune a Curse y de todas formas lo recibe → el efecto no se aplica en absoluto); Escenario 2 (atacante con `IsCursed = true` y su propia `TraitTargetingAbility`/`NeutralAbility` de prueba → sus habilidades NO dejan efecto alguno en el objetivo que ataca, mientras el daño base sí se aplica); Escenario 3 (al llegar `m_CurseRemainingSeconds` a `0`, el atacante vuelve a aplicar sus habilidades con normalidad en el siguiente ataque); al menos un caso con `Team.Enemy` atacando una unidad del jugador para simetría — depende de T019, T013

### Implementation for User Story 5

- [X] T025 [P] [US5] Crear la clase `[Serializable]` `Immunity` (`m_EffectType`, método `Blocks(AbilityEffectType)`) en `Assets/Scripts/Model/Battler/Immunity.cs`, según [data-model.md § Immunity](./data-model.md) (hace pasar T023) — depende de T004
- [X] T026 [US5] Añadir el campo `m_Immunities` (`Immunity[]`, default vacío) y la propiedad pública `Immunities` a `Assets/Scripts/Model/Battler/UnitDefinition.cs` (mismo archivo que T007/T008/T012/T018, secuencial; hace pasar T022) — depende de T025, T018
- [X] T027 [US5] Reemplazar el stub de `IsImmuneTo` en `Assets/Scripts/Gameplay/Battler/UnitRuntime.cs` (introducido en T013) para recorrer `m_Source.Immunities` y devolver `true` si algún elemento `Blocks(effectType)`; añadir el guard de inmunidad al inicio de `ApplyEffect` (`if (IsImmuneTo(effectType)) return;`, antes de tocar `m_CurseRemainingSeconds`) según [contracts/effect-receiver.md](./contracts/effect-receiver.md) — depende de T013, T026
- [X] T028 [US5] Añadir el guard `if (IsCursed) return;` al inicio de `ApplyAbilitiesTo` en `Assets/Scripts/Gameplay/Battler/UnitRuntime.cs` (mismo método que T014/T019, secuencial), implementando FR-008 (mientras el atacante está bajo Curse, ninguna de sus propias habilidades trait-targeting/neutral se aplica; el daño base ya aplicado no se ve afectado) — depende de T019

**Checkpoint**: Las 5 historias de usuario funcionan de forma independiente y en conjunto — el sistema completo de clasificación + habilidades avanzadas (trait-targeting, neutral, immunities, Curse) queda operativo end-to-end (FR-001 a FR-011, SC-001 a SC-006).

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T029 Revisar que la implementación final no se haya desviado de [contracts/effect-receiver.md](./contracts/effect-receiver.md) / [contracts/trait-targeting-matching.md](./contracts/trait-targeting-matching.md) / [contracts/unit-runtime-ability-behavior.md](./contracts/unit-runtime-ability-behavior.md) / [data-model.md](./data-model.md); actualizar esos documentos si hubo un cambio deliberado durante la implementación
- [X] T030 Correr la suite completa EditMode + PlayMode (001-008) en modo batch de Unity y confirmar 0 errores/0 warnings de compilación y 100% de tests en verde
- [X] T031 Ejecutar los 10 pasos de validación manual de [quickstart.md](./quickstart.md) (o una aproximación automatizada equivalente si no hay acceso a la GUI del Editor) contra `Chapter1_Battle.unity`, confirmando que ningún `.asset` de unidad existente queda modificado en disco al finalizar (SC-006)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Fase 1)**: sin dependencias — puede empezar de inmediato
- **Foundational (Fase 2)**: depende de Setup — bloquea las 5 historias de usuario
- **User Stories (Fase 3-7)**: todas dependen de Foundational; dentro de cada historia, los tests preceden a su implementación correspondiente
- **Polish (Fase 8)**: depende de que las 5 historias estén completas

### User Story Dependencies

- **US1 (P1)**: puede empezar tras Foundational — sin dependencia de otras historias
- **US2 (P1)**: puede empezar tras Foundational; su Independent Test no depende de US1 en términos de comportamiento observable, pero su implementación (T012-T014) extiende `UnitDefinition.cs`/`UnitRuntime.cs` ya tocados por US1 (T007/T008), por lo que en la práctica se implementa después
- **US3 (P2)**: puede empezar tras Foundational; extiende los mismos archivos que US1/US2 (`UnitDefinition.cs`, y el método `ApplyAbilitiesTo` de `UnitRuntime.cs` creado en US2), por lo que se implementa después de US2 en la práctica, aunque su Independent Test es conceptualmente independiente
- **US4 (P2)**: puede empezar tras Foundational; no añade producción nueva — verifica de forma dedicada el algoritmo de exclusión que la implementación de US2 (T011/T014) ya entrega completo, por lo que depende de US2 en la práctica (no de US3)
- **US5 (P3)**: puede empezar tras Foundational; extiende `UnitDefinition.cs` (US1/US2/US3) y `ApplyAbilitiesTo`/`IsImmuneTo` de `UnitRuntime.cs` (US2/US3), por lo que se implementa al final en la práctica

### Parallel Opportunities

- T002, T003, T004 (Fase 2) son independientes entre sí — archivos distintos
- T006 (US1) puede ejecutarse en paralelo con el resto de Fase 3 aún no iniciado
- T009 (US2) y T011 (US2) son independientes entre sí al inicio de Fase 4 (test vs. clase nueva), aunque T011 es quien hace pasar T009
- T011 (`TraitTargetingAbility`), T017 (`NeutralAbility`) y T025 (`Immunity`) son independientes entre sí — archivos distintos, todos dependen solo de T004
- T015, T023 son independientes entre sí (archivos/secciones distintas) dentro de sus respectivas fases
- Las implementaciones de US1-US5 comparten `UnitDefinition.cs` y `UnitRuntime.cs` (`ApplyAbilitiesTo`), por lo que sus tareas de implementación son intrínsecamente secuenciales entre historias, aunque cada historia sea conceptualmente independiente y su Independent Test no dependa de las otras (mismo patrón documentado en `specs/003-main-menu-config/tasks.md`)

---

## Parallel Example: User Story 2

```bash
# Lanzar en paralelo el test EditMode y la clase de datos nueva de US2:
Task: "EditMode test en Assets/Tests/EditMode/Battler/TraitTargetingAbilityMatchingTests.cs"
Task: "Crear TraitTargetingAbility en Assets/Scripts/Model/Battler/TraitTargetingAbility.cs"
```

---

## Implementation Strategy

### MVP First (User Stories 1 y 2 solamente)

1. Completar Fase 1: Setup
2. Completar Fase 2: Foundational (bloqueante)
3. Completar Fase 3: US1 (clasificación con default `Traitless`/`None`)
4. Completar Fase 4: US2 (trait-targeting coincide/no coincide, end-to-end con `Curse`)
5. **Detener y validar**: correr T006, T009, T010 en verde de forma aislada
6. Esto ya es el valor central de la feature (spec.md: "Historia 2... es el valor central de esta feature")

### Incremental Delivery

1. Setup + Foundational → enums/`IEffectReceiver` listos
2. + US1 → clasificación declarada, sin romper 001/007 (MVP parcial)
3. + US2 → trait-targeting funcional end-to-end (MVP completo)
4. + US3 → neutral ability coexiste sin conflicto
5. + US4 → exclusión de tipos especiales de "contra todos" verificada
6. + US5 → inmunidades y Curse cierran el sistema de habilidades avanzadas
7. Fase 8 → verificación final y quickstart manual

## Notes

- [P] = archivos distintos, sin dependencias pendientes
- US1/US2/US3/US5 comparten `UnitDefinition.cs`/`UnitRuntime.cs` porque las 5 campos/comportamientos nuevos de esta feature son extensiones acumulativas del mismo `ScriptableObject`/la misma clase runtime ya existentes desde 001/007 (FR-011) — igual que 007 extendió las mismas clases con `AttackType` sin crear ensamblados nuevos
- US4 es deliberadamente una historia "solo de verificación": `MatchesTarget` (T011) es una única función pura que ya implementa FR-003 y FR-004 en la misma pasada (research.md §4, contracts/trait-targeting-matching.md) — separar su implementación entre US2 y US4 introduciría una rama condicional artificial que el propio diseño rechazó explícitamente (Complexity Tracking de plan.md); US4 aporta valor real como conjunto de tests dedicados a esa mitad del algoritmo, no como producción nueva
- `IsImmuneTo` se introduce como stub `false` en T013 (US2) y se reemplaza por su implementación real en T027 (US5) — es un comportamiento correcto en ambos puntos: sin `Immunity` autorada (default vacío, FR-010) el resultado es idénticamente `false` antes y después del reemplazo, por lo que US2/US3/US4 nunca dependen de un comportamiento incompleto
- T009/T020 (mismo archivo `TraitTargetingAbilityMatchingTests.cs`) y T010/T016/T021/T024 (mismo archivo `ClassificationAbilityBattlePlayModeTests.cs`) se extienden de forma secuencial entre historias, siguiendo el mismo patrón ya usado en `specs/003-main-menu-config/tasks.md` para `MainMenuFlowPlayModeTests.cs`
- T031 probablemente requiera un humano en el Editor de Unity (GUI) para los pasos de inspección visual del Inspector (`IsCursed`, clasificación asignada), igual que quedó documentado para pasos equivalentes en `specs/002-local-save-progress/tasks.md` y `specs/003-main-menu-config/tasks.md`
