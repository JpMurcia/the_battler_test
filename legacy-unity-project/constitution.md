<!--
Sync Impact Report
Version change: 1.0.0 → 1.1.0 (MINOR — materially expanded guidance on existing principles, no principle added/removed/redefined)
Modified principles:
  - III. Identidad Visual Animada — añadido párrafo que resuelve explícitamente la bandera de gobernanza heredada de docs/roadmap-fases.md (Fase 10)/specs/009-unit-evolution: variantes visuales + stats por etapa de una mecánica de progresión acotada (p. ej. evolución de unidad) SÍ cumplen este principio por etapa, no son una violación.
  - VI. Simplicidad desde el MVP — aclarado que la restricción a "múltiples vestimentas por personaje" se refiere a un sistema de cosméticos/wardrobe de elección libre del jugador, no a variantes ligadas a una mecánica de progresión acotada ya cubierta por el Principio III.
Added sections: ninguna (aclaración dentro de secciones existentes)
Removed sections: ninguna
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ sin cambios necesarios (Constitution Check es genérico, "Gates determined based on constitution file")
  - .specify/templates/spec-template.md ✅ sin cambios necesarios (no referencia principios por nombre)
  - .specify/templates/tasks-template.md ✅ sin cambios necesarios (no referencia principios por nombre)
Follow-up TODOs: ninguno — la bandera de gobernanza de specs/009-unit-evolution/{spec,plan,tasks}.md y docs/roadmap-fases.md (Fase 10) queda resuelta por esta enmienda; esos documentos deben actualizarse para reflejar que el bloqueo ya no aplica (ver Next Actions de esta ejecución de /speckit.constitution).
-->
# The Battler Constitution
<!-- Título de trabajo: "The Battler" (the_battler_test). Título, tono y sinopsis definitivos quedan pendientes de un spec de narrativa (/speckit.specify) — este documento fija las reglas de diseño que no cambian mientras eso se define. -->

## Core Principles

### I. Narrativa Integrada (Story-First)
Cada capítulo/mapa debe tener diálogos pre-batalla y post-batalla ligados a esa batalla específica, no genéricos. Las cinemáticas usan formato estilo novela visual (retrato + texto + Timeline), no solo texto plano. Ninguna batalla se lanza sin al menos un fragmento de historia que la contextualice; la narrativa no es un añadido opcional sobre el gameplay, es un requisito de cada unidad de contenido (capítulo/etapa).

### II. Combate Automático por Despliegue (Deployment-Driven Combat)
El núcleo de juego es: un recurso (Energía/Dinero) se acumula automáticamente con el tiempo y su tasa de regeneración es mejorable durante la partida; el jugador despliega unidades predefinidas pagando ese recurso, sujetas a coste y cooldown individuales; una vez desplegada, la unidad actúa de forma autónoma en el carril — no hay control directo del jugador durante el combate. La base del jugador (con torre/cañón especial de recarga lenta) y la base enemiga son los objetivos de victoria/derrota.

### III. Identidad Visual Animada (Beyond Static Sprites) — diferenciador clave frente a The Battle Cats
A diferencia del sprite estático/simple de Battle Cats, cada personaje jugable requiere como mínimo: animación de idle y animación de ataque (frame-by-frame o rigged, no una sola imagen fija), y una variante visual adicional (vestimenta, accesorio u objeto equipable) que altere su apariencia en el carril. Se permiten elementos interactivos (el personaje reacciona a golpes, sostiene/usa un objeto en su animación de ataque). Ninguna unidad se considera "completa" en su spec si solo tiene un sprite estático — esto es una condición de aceptación, no un nice-to-have.

Cuando una mecánica de progresión de diseño define un número acotado y explícito de etapas por unidad (p. ej. evolución de unidad: forma base → segunda forma → forma verdadera), cada etapa PUEDE declarar su propia animación de idle, animación de ataque, variante visual y estadísticas de combate propias. Esto satisface este principio de forma independiente por etapa — no es una violación ni requiere una cláusula constitucional separada — siempre que: (a) el número de etapas esté fijado y acotado por la spec de esa mecánica (no una personalización cosmética arbitraria), y (b) la Forma Base de la unidad ya cumpla, por sí sola, el mínimo de este principio (idle + ataque + una variante visual). Esta lectura resuelve explícitamente la bandera de gobernanza heredada de `docs/roadmap-fases.md` (Fase 10) y `specs/009-unit-evolution`.

### IV. Progresión por Capítulos con Desbloqueo (Chapter-Based Unlock Progression)
El contenido se organiza en capítulos/etapas secuenciales; cada etapa se desbloquea al completar la anterior. Los personajes nuevos se obtienen vía gacha o desbloqueo narrativo ligado a la historia (no ambos sistemas a la vez sin definirlo explícitamente en un spec). Cada capítulo debe declarar qué unidades introduce y qué beat de historia resuelve.

### V. Balance Dirigido por Datos (Data-Driven Balance)
Las estadísticas de unidad (Coste, Cooldown, Salud, Daño, Rango) viven en assets de datos (ScriptableObjects en Unity), nunca hardcodeadas en lógica de comportamiento. Esto permite iterar balance sin recompilar y es prerrequisito para que `/speckit.plan` y `/speckit.tasks` puedan generar trabajo verificable.

### VI. Simplicidad desde el MVP (Simplicity First / YAGNI)
Se construye primero una vertical slice: 1 capítulo completo, 5 unidades, base vs. base, sin economía de gacha completa ni monetización. Sistemas como gacha real, múltiples vestimentas por personaje, o multijugador no se implementan hasta que la vertical slice esté jugable y validada. La complejidad añadida fuera de esa slice debe justificarse explícitamente en el `/speckit.plan` correspondiente.

"Múltiples vestimentas por personaje" en este principio se refiere a un sistema general de cosméticos/wardrobe de elección libre del jugador (fuera de alcance hasta nueva decisión) — no a las variantes visuales ligadas a una mecánica de progresión acotada (p. ej. etapas de evolución de unidad) ya cubiertas explícitamente por el Principio III.

## Restricciones Técnicas

Motor: Unity 6000.3.20f1 (LTS) o superior, pipeline URP 2D. Lenguaje: C#. UI y diálogos: TextMeshPro. Cinemáticas: Unity Timeline + Cinemachine. Datos de unidades y enemigos: ScriptableObjects. Input: Input System (paquete `com.unity.inputsystem`). El proyecto vive en `the_battler_test/` dentro del repositorio; toda nueva feature relevante para el motor pasa por `/speckit.plan` antes de escribirse en C#.

## Flujo de Trabajo (Spec-Driven Development)

Todo trabajo no trivial sigue el pipeline de Spec Kit: `/speckit.constitution` (este documento) → `/speckit.specify` (una spec por feature: un sistema, un capítulo de historia, o una unidad) → `/speckit.clarify` → `/speckit.checklist` → `/speckit.plan` → `/speckit.tasks` → `/speckit.analyze` → `/speckit.implement`, ejecutado desde Claude Code en este repositorio. Las specs de narrativa y las specs de sistemas de gameplay se mantienen como documentos separados aunque se implementen en el mismo capítulo.

## Governance

Esta constitución tiene prioridad sobre decisiones ad-hoc de diseño o código. Cualquier cambio a un Core Principle requiere justificación escrita, incrementa la versión (MAJOR si redefine o elimina un principio, MINOR si añade uno nuevo, PATCH si es aclaración de redacción) y actualiza `Last Amended`. Cualquier `/speckit.plan` que se aparte de un principio (por ejemplo, una unidad sin animación de ataque) debe declarar explícitamente la excepción y su motivo.

**Version**: 1.1.0 | **Ratified**: 2026-07-27 | **Last Amended**: 2026-07-29
