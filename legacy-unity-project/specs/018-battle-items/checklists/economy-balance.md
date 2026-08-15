# Specification Quality Checklist: Economía e Inventario — Objetos de Batalla

**Purpose**: Validar la calidad de los requisitos de inventario, obtención y consumo de objetos de batalla antes de `/speckit.plan`
**Created**: 2026-08-05
**Feature**: [spec.md](../spec.md)
**Focus**: Ciclo de vida del inventario (obtención → selección → consumo) + el mecanismo de aleatoriedad de "Radar de Tesoro"
**Depth**: Standard
**Audience**: Autor (previo a `/speckit.plan`)

## Requirement Completeness

- [x] CHK001 - ¿Está especificado el momento exacto en que se descuenta un objeto del inventario (al entrar a la batalla, no al seleccionarlo ni al completarla)? [Completeness, Spec §FR-006]
- [x] CHK002 - ¿Está definido qué pasa si el jugador abandona una batalla sin completarla tras haber consumido un objeto? [Completeness, Spec §Edge Cases]
- [x] CHK003 - ¿Está especificado el comportamiento cuando no queda ningún tesoro pendiente por otorgar a "Radar de Tesoro"? [Completeness, Spec §FR-010]

## Requirement Clarity

- [x] CHK004 - ¿Es "número máximo configurable" (FR-001/FR-007) lo suficientemente concreto para no bloquear `/speckit.plan`, incluso sin un valor numérico fijo en la spec? [Clarity, Spec §Assumptions]
- [x] CHK005 - ¿Distingue la spec claramente el momento de efecto de los objetos de combate/recurso (inicio de batalla) del de recompensa (resolución de victoria)? [Clarity, Spec §FR-008]

## Requirement Consistency

- [x] CHK006 - ¿Es consistente el nuevo mecanismo de "Radar de Tesoro" con el hecho ya confirmado en el código de que `TreasureRewardId` es determinista, no probabilístico? [Consistency, Spec §Clarifications]
- [x] CHK007 - ¿Reutiliza "Radar de Tesoro" el mismo catálogo de tesoros (`014-chapter-scaling-treasure-sets`) sin introducir una segunda fuente de datos de tesoros? [Consistency, Spec §Key Entities]

## Edge Case Coverage

- [x] CHK008 - ¿Se cubre el caso de que el jugador no tenga ningún objeto de batalla en inventario? [Edge Case, Spec §US1 Acceptance Scenario 3]
- [x] CHK009 - ¿Se cubre el caso de seleccionar más objetos que el límite máximo? [Edge Case, Spec §US1 Acceptance Scenario 2]
- [x] CHK010 - ¿Se cubre el caso de que el jugador ya posea todos los tesoros del catálogo? [Edge Case, Spec §Edge Cases, FR-010]
- [x] CHK011 - ¿Se cubre el caso de niveles ya existentes que no declaran recompensa de objeto de batalla? [Edge Case, Spec §Edge Cases, FR-011]

## Dependencies & Assumptions

- [x] CHK012 - ¿Está documentada la dependencia del mecanismo de recompensa de nivel ya existente de `013-empire-of-cats-saga`? [Dependency, Spec §US3, Assumptions]
- [x] CHK013 - ¿Está documentada la dependencia del catálogo de tesoros de `014-chapter-scaling-treasure-sets` para el roll de "Radar de Tesoro"? [Dependency, Spec §Key Entities, Assumptions]
- [x] CHK014 - ¿Está acotado explícitamente que el único punto de aleatoriedad de esta feature es el roll de "Radar de Tesoro" (sin generalizar a una probabilidad de drop configurable)? [Assumption, Spec §Assumptions]

## Notes

- Ningún ítem requirió marcarse como `[Gap]` tras integrar la clarificación de `/speckit.clarify` (sesión 2026-08-05).
- No se generaron preguntas adicionales de alcance/profundidad/audiencia — el foco (ciclo de vida de inventario + aleatoriedad acotada) ya cubre los dos riesgos de diseño más relevantes de esta spec.
