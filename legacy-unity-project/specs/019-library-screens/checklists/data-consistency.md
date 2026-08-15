# Specification Quality Checklist: Consistencia de Datos — Bibliotecas de Consulta

**Purpose**: Validar la calidad de los requisitos de origen de datos y consistencia de solo-lectura antes de `/speckit.plan`
**Created**: 2026-08-05
**Feature**: [spec.md](../spec.md)
**Focus**: De dónde sale cada dato mostrado + garantía de que ninguna biblioteca muta el progreso del jugador
**Depth**: Standard
**Audience**: Autor (previo a `/speckit.plan`)

## Requirement Completeness

- [x] CHK001 - ¿Está especificado qué stats muestra Cat Guide (efectivas vs. base) para unidades con evolución/nivel? [Completeness, Spec §Assumptions]
- [x] CHK002 - ¿Está especificado qué stats muestra Enemy Guide para un enemigo reutilizado en varios capítulos con distinto escalado? [Completeness, Spec §Assumptions]
- [x] CHK003 - ¿Está definido el momento exacto en que un enemigo se registra como "enfrentado" (aparición en el carril, no derrota ni planificación de oleada)? [Completeness, Spec §FR-004]

## Requirement Clarity

- [x] CHK004 - ¿Distingue la spec claramente "enfrentado" de "derrotado" y de "planeado en la oleada"? [Clarity, Spec §Edge Cases]
- [x] CHK005 - ¿Es medible "refleja el estado más reciente... sin requerir reiniciar el juego" (FR-008)? [Clarity/Measurability, Spec §SC-004]

## Requirement Consistency

- [x] CHK006 - ¿Es consistente el registro nuevo de enemigos enfrentados con el patrón aditivo ya usado por `obtainedTreasureIds`/`unlockedBonusUnitIds`? [Consistency, Spec §Assumptions]
- [x] CHK007 - ¿Es coherente FR-010 (no modifica datos existentes) con la excepción explícita del registro nuevo de enemigos enfrentados? [Consistency, Spec §FR-010]

## Edge Case Coverage

- [x] CHK008 - ¿Se cubre el caso de un jugador sin ninguna unidad bonus? [Edge Case, Spec §US1 Acceptance Scenario 2]
- [x] CHK009 - ¿Se cubre el caso de un jugador que nunca jugó ninguna batalla (Enemy Guide vacío)? [Edge Case, Spec §US2 Acceptance Scenario 2]
- [x] CHK010 - ¿Se cubre el caso de un enemigo planeado en la oleada que nunca llegó a aparecer? [Edge Case, Spec §US2 Acceptance Scenario 3]
- [x] CHK011 - ¿Se cubre el caso de un set de tesoros sin ningún tesoro obtenido todavía? [Edge Case, Spec §US3 Acceptance Scenario 3]

## Dependencies & Assumptions

- [x] CHK012 - ¿Está documentada la dependencia de `UnitUnlockCatalog`/`PlayerBaseFlowController.OwnedUnits` (Cat Guide) ya existente? [Dependency, Spec §Assumptions]
- [x] CHK013 - ¿Está documentada la necesidad de un catálogo nuevo de enemigos (Enemy Guide) para resolver id → stats? [Dependency, Spec §Assumptions]
- [x] CHK014 - ¿Está documentada la dependencia de `TreasureSetDefinition`/`TreasureSetProgressEvaluator` (Treasure Menu) ya existente? [Dependency, Spec §US3, Key Entities]
- [x] CHK015 - ¿Está garantizado explícitamente que ninguna biblioteca puede mutar el progreso del jugador? [Assumption, Spec §FR-007, SC-005]

## Notes

- Ningún ítem requirió marcarse como `[Gap]`.
- No se generaron preguntas adicionales de alcance/profundidad/audiencia — el foco (origen de datos + garantía de solo-lectura) ya cubre los dos riesgos de diseño más relevantes de esta spec.
