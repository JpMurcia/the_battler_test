# Specification Quality Checklist: Combate y Balance — Multi-Golpe y Crítico

**Purpose**: Validar la calidad de los requisitos de comportamiento de combate y consistencia del modelo de datos antes de `/speckit.plan`
**Created**: 2026-08-05
**Feature**: [spec.md](../spec.md)
**Focus**: Comportamiento de combate (Multi-Golpe/Crítico) + consistencia del modelo de datos (`AttackType`)
**Depth**: Standard
**Audience**: Autor (previo a `/speckit.plan`)

## Requirement Completeness

- [x] CHK001 - ¿Está especificado qué ocurre cuando el número de golpes de Multi-Golpe es 1 (caso degenerado)? [Completeness, Spec §Edge Cases]
- [x] CHK002 - ¿Está definido el comportamiento cuando una unidad Multi-Golpe/Crítico no tiene ningún objetivo en rango? [Completeness, Spec §US1 Acceptance Scenario 2]
- [x] CHK003 - ¿Están documentadas las unidades/enemigos ya existentes que no declaran estos nuevos tipos de ataque? [Completeness, Spec §FR-009]

## Requirement Clarity

- [x] CHK004 - ¿Está cuantificada la probabilidad de "Crítico" con un rango numérico explícito (0%-100%) en vez de un término vago como "ocasional"? [Clarity, Spec §FR-006]
- [x] CHK005 - ¿Está definido "el doble de daño" de forma objetivamente verificable (multiplicador ×2 sobre el daño ya calculado)? [Clarity, Spec §FR-007]
- [x] CHK006 - ¿Se distingue explícitamente "reiniciar la secuencia" (contador vuelve a cero) de "reanudar desde el punto de interrupción", evitando la ambigüedad del término "reinicio" del input original? [Clarity, Spec §Assumptions]

## Requirement Consistency

- [x] CHK007 - ¿Es consistente el uso de "impacto"/"golpe" a lo largo de toda la spec para referirse a una unidad de daño dentro de una secuencia de Multi-Golpe? [Consistency]
- [x] CHK008 - ¿Es coherente el requisito de compatibilidad hacia atrás de `AttackType` (FR-001) con el mismo patrón ya usado en `007-attack-types`/`016-combat-ability-catalog` para extender enums de forma aditiva? [Consistency, Spec §FR-001]

## Edge Case Coverage

- [x] CHK009 - ¿Se cubre el caso de que el objetivo de una secuencia de Multi-Golpe sea destruido antes del último golpe? [Edge Case, Spec §US2]
- [x] CHK010 - ¿Se cubre el caso de que el objetivo salga de rango (no solo que sea destruido) antes del último golpe? [Edge Case, Spec §US2 Acceptance Scenario 1]
- [x] CHK011 - ¿Se aclara si Multi-Golpe y Crítico pueden coexistir en la misma unidad, o son mutuamente excluyentes? [Edge Case, Spec §Edge Cases]

## Dependencies & Assumptions

- [x] CHK012 - ¿Está documentada la dependencia de esta feature sobre los multiplicadores de daño ya existentes de `016-combat-ability-catalog` (Debilitar, Fuerte Contra)? [Dependency, Spec §Edge Cases, §Assumptions]
- [x] CHK013 - ¿Está explícitamente fuera de alcance la reclasificación del rasgo "Metálico"? [Assumption, Spec §FR-010]
- [x] CHK014 - ¿Está documentado que el mecanismo exacto de temporización entre golpes se resuelve en `/speckit.plan` y no en esta spec? [Assumption, Spec §Assumptions]

## Notes

- Ningún ítem requirió marcarse como `[Gap]` — todos los aspectos de comportamiento de combate y consistencia de datos relevantes para `/speckit.plan` ya están cubiertos por la spec vigente.
- No se generaron preguntas de clarificación de alcance/profundidad/audiencia porque el foco y la profundidad por defecto (Standard, Autor) ya bastan para validar esta spec de tamaño acotado (2 tipos de ataque nuevos sobre un enum existente).
