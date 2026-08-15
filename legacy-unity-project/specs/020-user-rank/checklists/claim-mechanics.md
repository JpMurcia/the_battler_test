# Specification Quality Checklist: Mecánica de Reclamo — Rango de Usuario

**Purpose**: Validar la calidad de los requisitos de la mecánica de reclamo de recompensas por umbral antes de `/speckit.plan`
**Created**: 2026-08-05
**Feature**: [spec.md](../spec.md)
**Focus**: Idempotencia del reclamo + reutilización correcta del contador ya existente (evitar un segundo cálculo duplicado)
**Depth**: Standard
**Audience**: Autor (previo a `/speckit.plan`)

## Requirement Completeness

- [x] CHK001 - ¿Está especificado que el Rango de Usuario reutiliza el cálculo ya existente de `005-player-dashboard`, sin un contador paralelo? [Completeness, Spec §Assumptions]
- [x] CHK002 - ¿Está especificado qué ocurre al intentar reclamar un umbral no alcanzado? [Completeness, Spec §FR-005, US2 Acceptance Scenario 3]
- [x] CHK003 - ¿Está especificado qué ocurre al intentar reclamar un umbral ya reclamado? [Completeness, Spec §FR-006, US2 Acceptance Scenario 2]

## Requirement Clarity

- [x] CHK004 - ¿Es claro que el reclamo es una acción explícita del jugador, no automática al cruzar el umbral? [Clarity, Spec §Assumptions]
- [x] CHK005 - ¿Distingue la spec claramente "alcanzar un umbral" (pasivo, por nivel de unidades) de "reclamarlo" (acción activa)? [Clarity, Spec §US1, §US2]

## Requirement Consistency

- [x] CHK006 - ¿Es consistente el criterio monótono de "umbral reclamado nunca se revoca" con el mismo criterio ya usado por `grantedTreasureSetIds` (014)? [Consistency, Spec §FR-007, Edge Cases]
- [x] CHK007 - ¿Es coherente que las recompensas de umbral reutilicen el sistema de objetos de batalla (018) en vez de introducir un tipo de recompensa nuevo? [Consistency, Spec §FR-009, Assumptions]

## Edge Case Coverage

- [x] CHK008 - ¿Se cubre el caso de reclamar umbrales en cualquier orden? [Edge Case, Spec §US2 Acceptance Scenario 4]
- [x] CHK009 - ¿Se cubre el caso de que el Rango de Usuario baje tras reclamar un umbral? [Edge Case, Spec §Edge Cases]
- [x] CHK010 - ¿Se cubre el caso de un jugador sin ningún umbral alcanzado? [Edge Case, Spec §FR-010, US1 Acceptance Scenario 2]
- [x] CHK011 - ¿Se cubre el caso de dos umbrales que otorgan el mismo objeto de batalla? [Edge Case, Spec §Edge Cases]

## Dependencies & Assumptions

- [x] CHK012 - ¿Está documentada la dependencia de `PlayerCharacterLevelCalculator`/`PlayerBaseFlowController` (005) para el valor del contador? [Dependency, Spec §FR-001, Assumptions]
- [x] CHK013 - ¿Está documentada la dependencia de `018-battle-items` para el tipo de recompensa otorgada? [Dependency, Spec §FR-009, Assumptions]
- [x] CHK014 - ¿Está explícitamente excluido cualquier vínculo con gacha o moneda premium? [Assumption, Spec §FR-009]

## Notes

- Ningún ítem requirió marcarse como `[Gap]`.
- El foco de este checklist (evitar un contador duplicado + idempotencia del reclamo) cubre el riesgo de diseño más relevante de esta spec: que `/speckit.plan` reimplemente por accidente un segundo `PlayerCharacterLevelCalculator`.
