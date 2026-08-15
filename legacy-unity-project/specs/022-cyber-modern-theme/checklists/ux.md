# UX Requirements Quality Checklist: Sistema Visual Cyber-Modern — Tema Compartido y Reskin de Menú Principal

**Purpose**: Validar la calidad (completitud, claridad, consistencia, medibilidad) de los requisitos visuales/UX antes de `/speckit-plan`
**Created**: 2026-08-06
**Feature**: [spec.md](../spec.md)
**Focus**: Requisitos visuales del reskin (Menú Principal + Ajustes) y del catálogo de tema compartido — ambigüedad perceptual y dependencias nuevas
**Depth**: Standard
**Audience**: Autor (previo a `/speckit-plan`) — proyecto de un solo desarrollador, sin equipo de revisión

## Requirement Completeness

- [x] CHK001 - ¿Está especificado qué elementos visuales concretos cambian en el Menú Principal (paneles, botones, tipografía) frente a lo que permanece igual (comportamiento de navegación)? [Completeness, Spec §FR-002]
- [x] CHK002 - ¿Está especificado el comportamiento del sistema si falta una referencia de fuente en el catálogo de tema? [Completeness, Spec §Edge Cases]
- [x] CHK003 - ¿Está documentado qué valores concretos vive en `UIThemeCatalog` (colores, gradiente, radios, fuentes) sin necesitar cambios de código para ajustarlos? [Completeness, Spec §FR-001, §Key Entities]

## Requirement Clarity

- [x] CHK004 - ¿Está acotado el criterio de "pantalla visualmente distinta" (SC-001) con un mecanismo de verificación concreto en vez de quedar a interpretación subjetiva? [Clarity, Spec §SC-001]
- [x] CHK005 - ¿Distingue la spec claramente entre el catálogo de tema (datos) y las pantallas que lo consumen (sin lógica propia de estilo)? [Clarity, Spec §Key Entities]

## Requirement Consistency

- [x] CHK006 - ¿Es coherente que FR-002/FR-003 preserven exactamente el contrato funcional ya cubierto por `003-main-menu-config` sin redefinirlo? [Consistency, Spec §FR-002, §FR-003]
- [x] CHK007 - ¿Es consistente el alcance "solo Menú Principal + Ajustes" entre el resumen de historias, FR-008 y las Assumptions? [Consistency, Spec §FR-008, §Assumptions]

## Acceptance Criteria Quality

- [x] CHK008 - ¿Puede verificarse SC-001 de forma objetiva y repetible (no solo por opinión) tras la aclaración de mecanismo de verificación? [Measurability, Spec §SC-001]
- [x] CHK009 - ¿Son medibles SC-002 a SC-004 sin ambigüedad (100% de valores desde el catálogo, suites existentes en verde, edición de un único asset)? [Measurability, Spec §SC-002, §SC-003, §SC-004]

## Edge Case Coverage

- [x] CHK010 - ¿Se cubre el caso de una referencia de fuente faltante en el catálogo? [Edge Case, Spec §Edge Cases]
- [x] CHK011 - ¿Se cubre el caso de rendimiento degradado en dispositivos de gama baja para las animaciones cosméticas? [Edge Case, Spec §Edge Cases, §FR-005]
- [x] CHK012 - ¿Se cubre explícitamente que el guardado local/progreso existente no se ve afectado por el reskin? [Edge Case, Spec §Edge Cases]

## Non-Functional Requirements

- [x] CHK013 - ¿Está acotado el coste de rendimiento aceptable para los efectos visuales (sin blur en tiempo real) en gama baja? [Non-Functional, Spec §FR-005]
- [x] CHK014 - ¿Está especificado que las animaciones cosméticas no deben bloquear la interacción del jugador con los botones? [Non-Functional, Spec §Edge Cases]

## Dependencies & Assumptions

- [x] CHK015 - ¿Está documentada la dependencia de una fuente nueva (Inter) y su licencia de uso? [Dependency, Spec §Assumptions]
- [x] CHK016 - ¿Está documentada la introducción de una librería de animación de terceros como primera dependencia de UI del proyecto? [Dependency, Spec §Assumptions]
- [x] CHK017 - ¿Está explícitamente excluida cualquier pantalla fuera de Menú Principal/Ajustes (Hub, Mapa, Batalla, Equipar, Mejorar, Biblioteca, Perfil, Cápsula/Gacha)? [Assumption, Spec §FR-008, §Assumptions]

## Notes

- CHK004/CHK008 motivaron un ajuste inline en `spec.md` (SC-001) durante esta validación: se ancló "visualmente distinta" a una verificación manual contra el mockup de referencia vía `quickstart.md`, mismo criterio ya usado en specs 013-021 para verificación perceptual/GUI.
- Ningún ítem quedó sin resolver — spec lista para `/speckit-plan`.
