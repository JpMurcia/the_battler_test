---

description: "Task list template for feature implementation"
---

# Tasks: Ampliación del Catálogo de Habilidades de Combate

**Input**: Design documents from `/specs/016-combat-ability-catalog/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/ability-effect-catalog.md](./contracts/ability-effect-catalog.md), [contracts/strong-against-combat.md](./contracts/strong-against-combat.md), [contracts/unit-runtime-ability-behavior-extension.md](./contracts/unit-runtime-ability-behavior-extension.md), [quickstart.md](./quickstart.md)

**Tests**: Incluidos — mismo patrón de verificación real (EditMode/PlayMode) ya establecido en 001-008/013/014.

**Organization**: Tareas agrupadas por historia de usuario (US1-US5, según spec.md) para permitir implementación y prueba independientes de cada una.

**Nota**: esta versión incorpora las 4 correcciones de `/speckit.analyze` (F1-F4) directamente en las tareas — no quedan como parches aparte. Ver `research.md` §7 y `plan.md` § Post-Design Constitution Re-check para el detalle de cada una.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: Historia de usuario a la que pertenece la tarea
- Cada tarea incluye la ruta exacta del archivo

## Path Conventions

Proyecto único de Unity — capas `Assets/Scripts/{Core,Model,Gameplay}/Battler/`, tests en `Assets/Tests/{EditMode,PlayMode}/Battler/`, según [plan.md § Project Structure](./plan.md#project-structure).

---

## Phase 1: Setup

**Purpose**: Confirmar línea base antes de tocar código.

- [X] T001 Correr la suite EditMode + PlayMode existente (001-014) en modo batch de Unity sobre `C:\Users\Usuario\Documents\GitHub\IA GAME\the_battler_test` y confirmar que sigue en verde antes de empezar, como línea base de referencia.

**Checkpoint**: Línea base verde confirmada antes de tocar código.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Los dos prerrequisitos compartidos por US1/US2/US3 (Debilitar/Congelar/Ralentizar): el enum extendido y la firma extendida de `IEffectReceiver.ApplyEffect`. US4 (Fuerte Contra) y US5 (Resistente) **no** dependen de esta fase — solo de Setup y de lo ya entregado por 008 (ver Dependencies abajo).

**⚠️ CRITICAL**: Ninguna tarea de US1/US2/US3 puede empezar hasta completar esta fase.

- [X] T002 [P] Extender el enum `AbilityEffectType` en `Assets/Scripts/Core/Battler/AbilityEffectType.cs` con `Weaken`, `Freeze`, `Slow` (`Curse` permanece en valor `0`, sin cambios), según [data-model.md § AbilityEffectType](./data-model.md)
- [X] T003 Añadir el tercer parámetro `float magnitude = 0f` a `IEffectReceiver.ApplyEffect` en `Assets/Scripts/Core/Battler/IEffectReceiver.cs` (extensión aditiva de la interfaz de 008 — el único call site existente, `ApplyAbilitiesTo`, se actualiza en T008), según [data-model.md § IEffectReceiver](./data-model.md) y [contracts/ability-effect-catalog.md](./contracts/ability-effect-catalog.md) — **corrige el hallazgo F1 de `/speckit.analyze`** (evita el diseño original de un método `ApplyMagnitudeIfApplicable` separado, que permitía desincronizar magnitud y duración cuando una reaplicación era bloqueada por inmunidad/resistencia)

**Checkpoint**: Enum e interfaz listos — US1, US2 y US3 pueden empezar. US4 y US5 ya podían empezar desde Setup.

---

## Phase 3: User Story 1 - Debilitar a un enemigo para sobrevivir su ataque (Priority: P1) 🎯 MVP

**Goal**: Una unidad con habilidad `Weaken` dirigida a un rasgo reduce el daño infligido por el objetivo afectado durante una duración configurable, sin acumularse por debajo del mínimo si se reaplica.

**Independent Test**: Enfrentar una unidad con `Weaken` contra un enemigo de prueba y confirmar que el daño que ese enemigo inflige baja mientras el efecto está activo y vuelve a su valor normal al expirar.

### Tests for User Story 1 ⚠️

- [X] T004 [P] [US1] EditMode test en `Assets/Tests/EditMode/Battler/UnitDefinitionAbilityCatalogDefaultsTests.cs` (archivo nuevo): una `TraitTargetingAbility`/`NeutralAbility` creada sin asignar `m_Magnitude` expone `0f` (FR-010) — este archivo se extiende en T014 (US4, incluye la corrección de F3) y T021 (US5) con los defaults de `m_StrongAgainstModifiers`/`m_Resistances`
- [X] T005 [US1] PlayMode test en `Assets/Tests/PlayMode/Battler/CombatAbilityCatalogBattlePlayModeTests.cs` (archivo nuevo, mismo patrón que `ClassificationAbilityBattlePlayModeTests` de 008): US1 Escenario 1 (Debilitar reduce el daño del objetivo), Escenario 2 (expira y el daño vuelve a su valor normal), Escenario 3 (reaplicar antes de expirar no deja el daño por debajo del mínimo ya activo — `Mathf.Max` en duración y magnitud, ambas fijadas en la misma rama del `switch` de `ApplyEffect` tras la corrección de F1) — este archivo se extiende en T009 (US2), T011 (US3), T015 (US4) y T022 (US5)

### Implementation for User Story 1

- [X] T006 [P] [US1] Añadir el campo `m_Magnitude` (`float`, default `0f`) y la propiedad pública `Magnitude` a `Assets/Scripts/Model/Battler/TraitTargetingAbility.cs`, según [data-model.md § TraitTargetingAbility](./data-model.md) (hace pasar la mitad de T004)
- [X] T007 [P] [US1] Añadir el campo `m_Magnitude` (`float`, default `0f`) y la propiedad pública `Magnitude` a `Assets/Scripts/Model/Battler/NeutralAbility.cs`, mismo criterio que T006 (hace pasar el resto de T004)
- [X] T008 [US1] En `Assets/Scripts/Gameplay/Battler/UnitRuntime.cs`: añadir `m_WeakenRemainingSeconds`/`m_WeakenMagnitude`/`IsWeakened`; descontar el temporizador en `Update()` (mismo patrón que `m_CurseRemainingSeconds`, 008); implementar la nueva firma `ApplyEffect(AbilityEffectType, float, float magnitude = 0f)` (T003) con la rama `Weaken` fijando `m_WeakenRemainingSeconds` **y** `m_WeakenMagnitude` juntas vía `Mathf.Max`, dentro del mismo guard de inmunidad/resistencia (FR-008, corrección F1 — ver [contracts/ability-effect-catalog.md](./contracts/ability-effect-catalog.md)); actualizar `ApplyAbilitiesTo` para pasar `ability.Magnitude` como tercer argumento en sus dos llamadas a `ApplyEffect`; multiplicar el daño en `Attack()` por `(1f - m_WeakenMagnitude)` cuando `IsWeakened`, con piso `Mathf.Max(1, ...)`, antes de `ApplyDamage`; **resetear `m_WeakenRemainingSeconds`/`m_WeakenMagnitude` a `0f` en `Initialize()`** junto al reset ya existente de `m_CurseRemainingSeconds` (corrección F2 — instancia reciclada del pool no debe heredar Debilitar de un uso anterior) — según [contracts/ability-effect-catalog.md](./contracts/ability-effect-catalog.md) (hace pasar T005 Escenarios 1-3) — depende de T002, T003, T006, T007

**Checkpoint**: US1 completa y verificable de forma independiente — Debilitar funciona end-to-end (FR-001, FR-008, FR-009, SC-001), sin los bugs F1/F2 detectados en el diseño original.

---

## Phase 4: User Story 2 - Congelar a un enemigo para ganar tiempo (Priority: P1) 🎯 MVP

**Goal**: Una unidad con habilidad `Freeze` dirigida a un rasgo detiene por completo el movimiento y el ataque del objetivo afectado durante una duración configurable.

**Independent Test**: Enfrentar una unidad con `Freeze` contra un enemigo de prueba y confirmar que no avanza ni ataca durante la duración configurada, retomando su comportamiento normal al expirar.

### Tests for User Story 2 ⚠️

- [X] T009 [US2] Extender `Assets/Tests/PlayMode/Battler/CombatAbilityCatalogBattlePlayModeTests.cs` (mismo archivo que T005, secuencial): US2 Escenario 1 (Congelar detiene movimiento y ataque), Escenario 2 (expira y retoma comportamiento normal sin quedar bloqueada), Escenario 3 (inmunidad a `Freeze` bloquea el efecto, mismo mecanismo de 008), **Escenario 4 (reaplicar Congelar antes de que expire no reduce la duración restante — `Mathf.Max`, cubre FR-008 para este efecto, gap identificado como hallazgo F4)** — depende de T005

### Implementation for User Story 2

- [X] T010 [US2] En `Assets/Scripts/Gameplay/Battler/UnitRuntime.cs` (mismo archivo que T008, secuencial): añadir `m_FreezeRemainingSeconds`/`IsFrozen`; descontar el temporizador en `Update()` (junto a los ya existentes); extender la rama `Freeze` de `ApplyEffect` (`Mathf.Max` en duración, sin magnitud — efecto binario); añadir el guard `if (IsFrozen) return;` en `Update()`, **después** de descontar todos los temporizadores de efecto y **antes** de la adquisición de objetivo/`Move()`/`Attack()`; **resetear `m_FreezeRemainingSeconds` a `0f` en `Initialize()`** (corrección F2) — según [contracts/unit-runtime-ability-behavior-extension.md](./contracts/unit-runtime-ability-behavior-extension.md) y [contracts/ability-effect-catalog.md](./contracts/ability-effect-catalog.md) (hace pasar T009) — depende de T002, T003, T008

**Checkpoint**: US1 y US2 (ambas P1) funcionan de forma independiente y en conjunto — esto ya es el MVP de la feature (Debilitar + Congelar, los dos efectos priorizados explícitamente en el input original), sin los bugs F1/F2.

---

## Phase 5: User Story 3 - Ralentizar para ganar distancia (Priority: P2)

**Goal**: Una unidad con habilidad `Slow` dirigida a un rasgo reduce la velocidad de movimiento del objetivo afectado durante una duración configurable, sin impedir que ataque.

**Independent Test**: Enfrentar una unidad con `Slow` contra un enemigo de prueba y confirmar que tarda más en recorrer una distancia fija que uno sin el efecto.

### Tests for User Story 3 ⚠️

- [X] T011 [US3] Extender `Assets/Tests/PlayMode/Battler/CombatAbilityCatalogBattlePlayModeTests.cs` (mismo archivo que T005/T009, secuencial): US3 Escenario 1 (Ralentizar reduce la velocidad observable), Escenario 2 (Congelar + Ralentizar simultáneos → Congelar prevalece, sin comportamiento indefinido), **Escenario 3 (reaplicar Ralentizar antes de que expire no deja duración ni magnitud por debajo de las ya activas, mismo criterio que US1 Escenario 3 — hallazgo F4)** — depende de T009

### Implementation for User Story 3

- [X] T012 [US3] En `Assets/Scripts/Gameplay/Battler/UnitRuntime.cs` (mismo archivo que T008/T010, secuencial): añadir `m_SlowRemainingSeconds`/`m_SlowMagnitude`/`IsSlowed`; descontar el temporizador en `Update()`; extender la rama `Slow` de `ApplyEffect` fijando `m_SlowRemainingSeconds` **y** `m_SlowMagnitude` juntas vía `Mathf.Max`, mismo criterio de F1 que `Weaken` (T008); multiplicar `c_MoveSpeed` por `(1f - m_SlowMagnitude)` en `Move()` cuando `IsSlowed`; **resetear `m_SlowRemainingSeconds`/`m_SlowMagnitude` a `0f` en `Initialize()`** (corrección F2) — según [contracts/unit-runtime-ability-behavior-extension.md](./contracts/unit-runtime-ability-behavior-extension.md) (hace pasar T011) — depende de T002, T003, T006/T007 (campo `magnitude` ya existe desde US1), T010

**Checkpoint**: US1-US3 funcionan de forma independiente y en conjunto — los tres efectos de duración (Debilitar/Congelar/Ralentizar) quedan operativos, con reaplicación consistente verificada en los tres (FR-008 completo, hallazgo F4 cerrado).

---

## Phase 6: User Story 4 - Preparar el equipo con "Fuerte Contra" (Priority: P2)

**Goal**: Una unidad con `StrongAgainstModifier` declarado contra un rasgo inflige más daño y recibe menos daño al combatir contra unidades de ese rasgo, sin cambio de comportamiento contra cualquier otro rasgo.

**Independent Test**: Enfrentar la misma unidad primero contra un enemigo del rasgo objetivo y luego contra uno de rasgo distinto, y confirmar que el daño infligido/recibido difiere de forma consistente con la ventaja declarada.

### Tests for User Story 4 ⚠️

- [X] T013 [P] [US4] EditMode test en `Assets/Tests/EditMode/Battler/StrongAgainstModifierMatchingTests.cs` (archivo nuevo): misma tabla de verdad que `TraitTargetingAbilityMatchingTests` (008) aplicada a `StrongAgainstModifier.MatchesTarget` — cubre SC-004
- [X] T014 [US4] Extender `Assets/Tests/EditMode/Battler/UnitDefinitionAbilityCatalogDefaultsTests.cs` (mismo archivo que T004, secuencial): (a) una `UnitDefinition` sin `m_StrongAgainstModifiers` asignado expone un array vacío (FR-010); (b) **un `StrongAgainstModifier` recién creado sin tocar sus campos expone `DamageDealtMultiplier = 1f` y `DamageReceivedMultiplier = 1f`, no `0f` — corrección del hallazgo F3 de `/speckit.analyze`** — depende de T004
- [X] T015 [US4] Extender `Assets/Tests/PlayMode/Battler/CombatAbilityCatalogBattlePlayModeTests.cs` (mismo archivo que T005/T009/T011, secuencial): US4 Escenario 1 (más daño contra el rasgo declarado), Escenario 2 (sin bonificación contra otro rasgo), Escenario 3 (menos daño recibido del rasgo declarado, con ambas unidades declarando `StrongAgainstModifier` entre sí para confirmar independencia de ambas mitades) — depende de T011

### Implementation for User Story 4

- [X] T016 [P] [US4] Crear la clase `[Serializable]` `StrongAgainstModifier` (`m_TargetClassificationTypes[]`, `m_IncludedSpecialTypes[]`, `m_DamageDealtMultiplier`, `m_DamageReceivedMultiplier`, método `MatchesTarget`) en `Assets/Scripts/Model/Battler/StrongAgainstModifier.cs`, según [data-model.md § StrongAgainstModifier](./data-model.md) — **`m_DamageDealtMultiplier` y `m_DamageReceivedMultiplier` DEBEN declararse con inicializador explícito `= 1f` (no depender del default `0f` de C#/Unity) — corrección del hallazgo F3** (hace pasar T013 y la mitad (b) de T014)
- [X] T017 [US4] Añadir el campo `m_StrongAgainstModifiers` (`StrongAgainstModifier[]`, default vacío) y la propiedad pública `StrongAgainstModifiers` a `Assets/Scripts/Model/Battler/UnitDefinition.cs` (hace pasar la mitad (a) de T014) — depende de T016
- [X] T018 [P] [US4] Crear la interfaz `IAttackerAwareDamageable` (`ApplyDamage(int, ClassificationType, SpecialClassificationType)`) en `Assets/Scripts/Core/Battler/IAttackerAwareDamageable.cs`, según [data-model.md § IAttackerAwareDamageable](./data-model.md)
- [X] T019 [US4] En `Assets/Scripts/Gameplay/Battler/UnitRuntime.cs` (mismo archivo que T008/T010/T012, secuencial): extraer el cálculo de daño de `Attack()` a un método privado `ComputeOutgoingDamage(ILaneOccupant target)` que incorpore, además del multiplicador de Debilitar ya existente (T008), el `DamageDealtMultiplier` de los `StrongAgainstModifiers` propios que coincidan con el objetivo (omitido si `IsCursed`, FR-007); implementar `IAttackerAwareDamageable.ApplyDamage(int, ClassificationType, SpecialClassificationType)` aplicando el `DamageReceivedMultiplier` propio que coincida con el atacante recibido (también omitido si `IsCursed`) antes de delegar en `ApplyDamage(int)`; en `Attack()`, usar el overload nuevo cuando el objetivo implemente `IAttackerAwareDamageable`, con `target.ApplyDamage(damage)` como fallback (`BaseHealth`) — según [contracts/strong-against-combat.md](./contracts/strong-against-combat.md) (hace pasar T015) — depende de T008, T012, T017, T018

**Checkpoint**: US1-US4 funcionan de forma independiente y en conjunto — Fuerte Contra queda operativo en ambas direcciones (infligido/recibido), con multiplicadores por defecto correctos (`1f`, hallazgo F3 cerrado).

---

## Phase 7: User Story 5 - Resistir un debuff sin ser inmune (Priority: P3)

**Goal**: Una unidad con `Resistance` declarada contra un efecto específico sufre ese efecto por menos tiempo del configurado en el origen, sin llegar a ser inmune; distinta e independiente de `Immunity` (008).

**Independent Test**: Aplicar el mismo efecto a dos unidades idénticas salvo por tener o no declarada la Resistencia, y confirmar que la resistente lo sufre menos tiempo.

### Tests for User Story 5 ⚠️

- [X] T020 [P] [US5] EditMode test en `Assets/Tests/EditMode/Battler/ResistanceTests.cs` (archivo nuevo): `Reduce(effectType, duration)` reduce la duración por `reductionFactor` solo cuando `effectType` coincide, devuelve la duración sin cambios en caso contrario, y hace clamp a `0` cuando el resultado sería negativo
- [X] T021 [US5] Extender `Assets/Tests/EditMode/Battler/UnitDefinitionAbilityCatalogDefaultsTests.cs` (mismo archivo que T004/T014, secuencial): una `UnitDefinition` sin `m_Resistances` asignado expone un array vacío (FR-010) — depende de T014
- [X] T022 [US5] Extender `Assets/Tests/PlayMode/Battler/CombatAbilityCatalogBattlePlayModeTests.cs` (mismo archivo que T005/T009/T011/T015, secuencial): US5 Escenario 1 (Resistencia reduce la duración sufrida), Escenario 2 (Inmunidad total sigue bloqueando por completo, independiente y coexistente con Resistencia) — depende de T015

### Implementation for User Story 5

- [X] T023 [P] [US5] Crear la clase `[Serializable]` `Resistance` (`m_EffectType`, `m_ReductionFactor`, método `Reduce(AbilityEffectType, float) -> float`) en `Assets/Scripts/Model/Battler/Resistance.cs`, según [data-model.md § Resistance](./data-model.md) (hace pasar T020)
- [X] T024 [US5] Añadir el campo `m_Resistances` (`Resistance[]`, default vacío) y la propiedad pública `Resistances` a `Assets/Scripts/Model/Battler/UnitDefinition.cs` (mismo archivo que T017, secuencial; hace pasar T021) — depende de T023, T017
- [X] T025 [US5] En `Assets/Scripts/Gameplay/Battler/UnitRuntime.cs` (mismo archivo que T008/T010/T012/T019, secuencial): añadir el método privado `ReduceByResistance(AbilityEffectType, float)` (recorre `m_Source.Resistances`) e invocarlo dentro de `ApplyEffect`, después del guard de `IsImmuneTo` (008, sin cambios) y antes de fijar cualquier temporizador o magnitud; si la duración resultante es `<= 0f`, tratar el efecto como no aplicado (ni duración ni magnitud se tocan, mismo criterio de F1 aplicado aquí) — según [contracts/ability-effect-catalog.md](./contracts/ability-effect-catalog.md) (hace pasar T022) — depende de T019, T024

**Checkpoint**: Las 5 historias funcionan de forma independiente y en conjunto — el catálogo completo (FR-001 a FR-010, SC-001 a SC-006) queda operativo end-to-end, con los 4 hallazgos de `/speckit.analyze` (F1-F4) incorporados al diseño antes de escribir código.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T026 Revisar que la implementación final no se haya desviado de los 3 contratos ni de [data-model.md](./data-model.md); actualizar esos documentos si hubo un cambio deliberado durante la implementación
- [X] T027 Correr la suite completa EditMode + PlayMode (001-016) en modo batch de Unity y confirmar 0 errores/0 warnings de compilación y 100% de tests en verde
- [ ] T028 Ejecutar los 11 pasos de validación manual de [quickstart.md](./quickstart.md) contra `Chapter1_Battle.unity`, confirmando que ningún `.asset` de unidad existente queda modificado en disco al finalizar (SC-006) y que el paso 10 (reciclaje de pool, F2) pasa correctamente

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Fase 1)**: sin dependencias
- **Foundational (Fase 2)**: depende de Setup — bloquea US1/US2/US3 únicamente (ver nota de Fase 2; US4/US5 no dependen de ella)
- **US1/US2/US3 (Fases 3-5)**: dependen de Foundational
- **US4 (Fase 6)**: depende solo de Setup — en la práctica se implementa después de US1-US3 porque comparte `UnitRuntime.cs` (T008/T010/T012) de forma secuencial, no por una dependencia conceptual real
- **US5 (Fase 7)**: depende solo de Setup — misma nota que US4, se implementa al final por compartir archivo, no por dependencia conceptual
- **Polish (Fase 8)**: depende de que las 5 historias estén completas

### User Story Dependencies

- **US1 (P1)**: tras Foundational — sin dependencia de otras historias
- **US2 (P1)**: tras Foundational — su Independent Test no depende de US1; su implementación (T010) extiende `UnitRuntime.cs` ya tocado por T008, por lo que en la práctica va después
- **US3 (P2)**: tras Foundational — reutiliza el campo `magnitude` (T006/T007) ya creado por US1 y extiende `UnitRuntime.cs` (T010), por lo que en la práctica va después de US1/US2
- **US4 (P2)**: independiente en términos conceptuales (StrongAgainst es un concepto nuevo, no un `AbilityEffectType`); en la práctica se implementa después de US1-US3 porque T019 extiende el mismo `Attack()` que T008 ya modificó
- **US5 (P3)**: independiente en términos conceptuales; en la práctica va al final porque T025 extiende `ApplyEffect` (ya tocado por T008/T010/T012) y `UnitDefinition.cs` (ya tocado por T017)

### Parallel Opportunities

- T006, T007 (US1) son independientes entre sí — archivos distintos, ambos dependen solo de T004
- T013, T016, T018 (US4) son independientes entre sí al inicio de la fase — archivos distintos
- T020, T023 (US5) son independientes entre sí — mismo criterio
- Las implementaciones de las 5 historias comparten `UnitRuntime.cs` y (US4/US5) `UnitDefinition.cs`, por lo que sus tareas de implementación son intrínsecamente secuenciales entre historias, aunque cada historia sea conceptualmente independiente y su Independent Test no dependa de las otras (mismo patrón documentado en `specs/008-classification-trait-abilities/tasks.md`)

---

## Parallel Example: User Story 4

```bash
# Lanzar en paralelo el test EditMode, la clase de datos nueva y la interfaz nueva de US4:
Task: "EditMode test en Assets/Tests/EditMode/Battler/StrongAgainstModifierMatchingTests.cs"
Task: "Crear StrongAgainstModifier en Assets/Scripts/Model/Battler/StrongAgainstModifier.cs"
Task: "Crear IAttackerAwareDamageable en Assets/Scripts/Core/Battler/IAttackerAwareDamageable.cs"
```

---

## Implementation Strategy

### MVP First (User Stories 1 y 2 solamente)

1. Completar Fase 1: Setup
2. Completar Fase 2: Foundational
3. Completar Fase 3: US1 (Debilitar)
4. Completar Fase 4: US2 (Congelar)
5. **Detener y validar**: correr T004, T005, T009 en verde de forma aislada
6. Esto ya cubre los dos efectos priorizados explícitamente en el input original de esta feature

### Incremental Delivery

1. Setup + Foundational → enum + interfaz listos
2. + US1 → Debilitar funcional end-to-end (MVP parcial)
3. + US2 → Congelar funcional end-to-end (MVP completo, los dos P1)
4. + US3 → Ralentizar, y se resuelve el edge case Congelar+Ralentizar
5. + US4 → Fuerte Contra, ambas mitades (infligido/recibido)
6. + US5 → Resistencia cierra el catálogo de esta feature
7. Fase 8 → verificación final y quickstart manual (incluido el paso de reciclaje de pool, F2)

### Parallel Team Strategy

Con varios desarrolladores, tras completar Foundational: como US4 y US5 no dependen de Foundational ni conceptualmente de US1-US3, un segundo desarrollador podría adelantar T013/T016/T018 (US4) y T020/T023 (US5) en paralelo — pero **no** T017/T019 (US4) ni T024/T025 (US5), que sí requieren coordinar la edición secuencial de `UnitDefinition.cs`/`UnitRuntime.cs` con quien esté en US1-US3.

## Notes

- [P] = archivos distintos, sin dependencias pendientes
- US1/US2/US3/US4/US5 comparten `UnitRuntime.cs` (y US4/US5 además `UnitDefinition.cs`) porque los efectos/modificadores nuevos son extensiones acumulativas de las mismas clases ya existentes desde 001/007/008 — igual que 008 documentó para su propia implementación
- `magnitude` (T006/T007, US1) es reutilizado sin cambios por US3 — no se repite la tarea, solo se referencia
- El refactor de `Attack()` a `ComputeOutgoingDamage` (T019, US4) es un cambio deliberado sobre código que T008 (US1) ya introdujo — comportamiento idéntico para cualquier unidad sin `StrongAgainstModifiers` (multiplicador `1f`), documentado explícitamente para que quien implemente no lo confunda con una regresión
- T005/T009/T011/T015/T022 (mismo archivo `CombatAbilityCatalogBattlePlayModeTests.cs`) y T004/T014/T021 (mismo archivo `UnitDefinitionAbilityCatalogDefaultsTests.cs`) se extienden de forma secuencial entre historias, siguiendo el mismo patrón ya usado en `specs/008-classification-trait-abilities/tasks.md`
- T028 probablemente requiera un humano en el Editor de Unity (GUI) para los pasos de inspección visual del Inspector, igual que quedó documentado para pasos equivalentes en specs anteriores
- **Correcciones de `/speckit.analyze` incorporadas en esta versión**: F1 (T003 nuevo, `IEffectReceiver.ApplyEffect` gana `magnitude` como parámetro en vez de método separado; T008/T010/T012/T025 fijan duración y magnitud en el mismo guard), F2 (T008/T010/T012 resetean su estado en `Initialize()`; T028 valida reciclaje de pool), F3 (T016 declara `= 1f` explícito en ambos multiplicadores; T014 lo testea), F4 (T009 Escenario 4, T011 Escenario 3 — reaplicación consistente verificada también para Congelar y Ralentizar, no solo Debilitar)
