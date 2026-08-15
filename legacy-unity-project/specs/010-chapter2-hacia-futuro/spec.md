# Feature Specification: Capítulo 2 "Hacia el Futuro"

**Feature Branch**: `010-chapter2-hacia-futuro`

**Created**: 2026-07-28

**Status**: Draft

**Input**: User description: "Capítulo 2 \"Hacia el Futuro\" de \"The Battler\": siguiendo el mismo patrón que 001-chapter1-vertical-slice (diálogo pre-batalla y post-batalla específicos, combate automático por despliegue, base del jugador vs base enemiga), se desbloquea al completar el Capítulo 1 en el mapa de aventuras. [Completar aquí unidades nuevas, ambientación y beat de historia específico cuando se defina el guion.]"

## Clarifications

### Session 2026-07-28

- Q: ¿Cuál es la premisa narrativa concreta del Capítulo 2 "Hacia el Futuro"? → A: Nueva amenaza/antagonista, distinto del "Imperio de los Test/Robot" del Capítulo 1; expande el lore en vez de continuar directamente con el mismo antagonista. El guion/diálogo exacto (nombre del antagonista, texto de las escenas) queda como trabajo de contenido a autorar durante `/speckit.plan`/`/speckit.implement`, no como parte de esta spec.
- Q: ¿El Capítulo 2 introduce unidades jugables nuevas, o reutiliza las 5 de 001-chapter1-vertical-slice? → A: Introduce entre 1 y 2 unidades jugables nuevas, específicas de este capítulo, cada una cumpliendo el Principio III (animación de idle, animación de ataque, variante visual adicional). El número exacto (1 o 2) y su diseño concreto se definen en `/speckit.plan`.
- Q: ¿La configuración de enemigos de la batalla del Capítulo 2 reutiliza la plantilla del Capítulo 1, o necesita una composición distinta? → A: Reutiliza la misma plantilla de amenaza enemiga (oleadas y/o torre enemiga) que `001-chapter1-vertical-slice`, con su dificultad escalada usando el sistema de escalado de `006-mission-energy-system`, sin rediseñar la estructura de amenaza desde cero.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Jugar el Capítulo 2 completo tras desbloquearlo (Priority: P1)

Un jugador que completó el Capítulo 1 entra al Capítulo 2 desde el mapa de aventuras, ve el diálogo pre-batalla específico de "Hacia el Futuro", juega la batalla desplegando unidades, y al terminar ve el diálogo post-batalla correspondiente al resultado.

**Why this priority**: Es el recorrido central del capítulo — replica para el Capítulo 2 el mismo valor que `001-chapter1-vertical-slice` ya demostró para el Capítulo 1; sin esto no hay contenido jugable nuevo.

**Independent Test**: Con el Capítulo 1 completado (progreso guardado), entrar al Capítulo 2 desde el mapa de aventuras y confirmar el recorrido diálogo pre-batalla → batalla → diálogo post-batalla, terminando en victoria o derrota.

**Acceptance Scenarios**:

1. **Given** el jugador completó el Capítulo 1, **When** entra al Capítulo 2 desde el mapa de aventuras, **Then** se reproduce el diálogo pre-batalla específico de "Hacia el Futuro" antes de habilitar el despliegue de unidades.
2. **Given** el jugador está en la batalla del Capítulo 2, **When** despliega unidades pagando el recurso de batalla, **Then** estas actúan de forma autónoma en el carril, igual que en `001-chapter1-vertical-slice`.
3. **Given** la batalla del Capítulo 2 termina (victoria o derrota), **When** finaliza, **Then** se reproduce el diálogo post-batalla correspondiente a ese resultado, específico de "Hacia el Futuro".

---

### User Story 2 - El Capítulo 2 se desbloquea automáticamente al completar el Capítulo 1 (Priority: P2)

Un jugador que completa la batalla del Capítulo 1 ve, la próxima vez que abre el mapa de aventuras, que el banner "Hacia el Futuro" pasó de bloqueado a desbloqueado y seleccionable.

**Why this priority**: Conecta este capítulo con el mecanismo de desbloqueo secuencial ya definido en `004-adventure-map-banners`; sin esto, el Capítulo 2 existiría como contenido pero sería inalcanzable desde el flujo normal del juego.

**Independent Test**: Completar la batalla del Capítulo 1, volver al mapa de aventuras y confirmar que el banner "Hacia el Futuro" queda desbloqueado y lleva a la batalla del Capítulo 2 al seleccionarlo.

**Acceptance Scenarios**:

1. **Given** el progreso guardado indica que el Capítulo 1 está completado, **When** el jugador abre el mapa de aventuras, **Then** el banner "Hacia el Futuro" aparece desbloqueado.
2. **Given** el Capítulo 1 no está completado, **When** el jugador abre el mapa de aventuras, **Then** el banner "Hacia el Futuro" permanece bloqueado y no seleccionable.

---

### User Story 3 - El Capítulo 2 declara qué unidades introduce y qué beat de historia resuelve (Priority: P1)

Un jugador identifica, a través del diálogo y de las unidades disponibles en la batalla, de qué trata "Hacia el Futuro" y qué avance narrativo representa respecto al Capítulo 1.

**Why this priority**: Es un requisito explícito del Principio I (narrativa integrada, no genérica) y del Principio IV (cada capítulo declara qué unidades introduce y qué beat de historia resuelve) de la constitución; sin contenido narrativo y de unidades definido, este capítulo no puede considerarse completo según esos principios.

**Independent Test**: Jugar el recorrido completo del Capítulo 2 y confirmar que el diálogo pre/post-batalla y las unidades disponibles corresponden específicamente a la premisa "Hacia el Futuro", no a texto o unidades genéricas reutilizadas sin contexto.

**Acceptance Scenarios**:

1. **Given** el jugador completa el recorrido del Capítulo 2, **When** se le pregunta de qué trataba, **Then** puede identificar el beat de historia específico de "Hacia el Futuro" a partir del diálogo, sin necesidad de fuentes externas.

---

### Edge Cases

- ¿Qué pasa si el jugador intenta entrar al Capítulo 2 sin haber completado el Capítulo 1? El banner permanece bloqueado y no seleccionable, consistente con `004-adventure-map-banners`.
- ¿Qué pasa con la nota actual en `004-adventure-map-banners` de que el banner "Hacia el Futuro" permanece bloqueado *independientemente del progreso* porque su contenido no existía? Al completarse esta feature, esa nota queda obsoleta: el banner debe pasar a depender únicamente del mecanismo genérico de desbloqueo secuencial por progreso ya definido en `004-adventure-map-banners` (FR-007 de esa spec), sin requerir rediseño de ese mecanismo. Se recomienda una actualización menor de esa spec para retirar la excepción hardcodeada, fuera del alcance de esta feature.
- ¿Qué pasa si ambas bases (jugador y enemiga) llegan a 0 en el mismo tick? Se resuelve igual que en `001-chapter1-vertical-slice`: derrota del jugador, para evitar ambigüedad.
- ¿Qué pasa si el guardado de progreso está corrupto al momento de evaluar el desbloqueo? Se trata como ausencia de progreso (Capítulo 1 no completado), consistente con el fallback ya definido en `002-local-save-progress` y `004-adventure-map-banners`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE reproducir un diálogo pre-batalla específico del Capítulo 2 ("Hacia el Futuro") antes de habilitar el despliegue de unidades, con el mismo formato (retrato + texto + Timeline) exigido por el Principio I de la constitución.
- **FR-002**: El sistema DEBE reproducir un diálogo post-batalla específico del Capítulo 2 al finalizar la batalla, diferenciado según el resultado (victoria o derrota).
- **FR-003**: La batalla del Capítulo 2 DEBE usar el mismo núcleo de combate automático por despliegue definido en el Principio II: un recurso que se acumula con el tiempo, unidades desplegables con coste y cooldown, actuación autónoma tras el despliegue.
- **FR-004**: La batalla del Capítulo 2 DEBE tener como objetivo de victoria/derrota la base del jugador y una base enemiga, siguiendo el mismo patrón que `001-chapter1-vertical-slice`.
- **FR-005**: El Capítulo 2 DEBE declarar explícitamente qué unidades están disponibles para su batalla: las 5 unidades ya definidas en `001-chapter1-vertical-slice` más entre 1 y 2 unidades jugables nuevas específicas de este capítulo.
- **FR-005a**: Cada unidad nueva introducida en el Capítulo 2 DEBE cumplir el Principio III de la constitución (animación de idle, animación de ataque, y una variante visual adicional), igual que las unidades de `001-chapter1-vertical-slice`.
- **FR-006**: El Capítulo 2 DEBE declarar explícitamente su beat de historia y ambientación específicos, centrados en una amenaza/antagonista nueva y distinta del "Imperio de los Test/Robot" del Capítulo 1, reflejados en el contenido del diálogo pre/post-batalla. El guion concreto (nombre del antagonista, texto exacto de las escenas) se autora durante `/speckit.plan`/`/speckit.implement`.
- **FR-007**: La configuración de la base enemiga y su amenaza (oleadas de enemigos y/o torre enemiga) DEBE reutilizar la misma plantilla estructural que `001-chapter1-vertical-slice`, con su dificultad escalada mediante el sistema de escalado de dificultad de `006-mission-energy-system`, sin requerir una composición de enemigos diseñada desde cero.
- **FR-008**: El sistema DEBE desbloquear el banner "Hacia el Futuro" en el mapa de aventuras (`004-adventure-map-banners`) cuando el progreso guardado indique que el Capítulo 1 está completado, usando el mismo mecanismo de desbloqueo secuencial ya definido en esa spec.
- **FR-009**: El sistema NO DEBE permitir entrar a la batalla del Capítulo 2 mientras el Capítulo 1 no esté completado.

### Key Entities *(include if feature involves data)*

- **Capítulo 2 "Hacia el Futuro" (Chapter)**: unidad de contenido que agrupa la narrativa pre/post específica, la configuración de la batalla (unidades disponibles, configuración de la base enemiga) y la condición de victoria/derrota, siguiendo el mismo patrón que el `Capítulo 1 (Chapter)` de `001-chapter1-vertical-slice`.
- **Diálogo Pre-Batalla / Post-Batalla del Capítulo 2**: secuencia narrativa (retratos + texto + Timeline) ligada específicamente a esta batalla, no reutilizable genéricamente de otros capítulos.
- **Unidades del Capítulo 2**: las 5 unidades ya definidas en `001-chapter1-vertical-slice`, más entre 1 y 2 unidades jugables nuevas específicas de este capítulo (diseño exacto pendiente de `/speckit.plan`), cada una con su propio ScriptableObject de datos, animación de idle/ataque y variante visual.
- **Antagonista del Capítulo 2**: amenaza narrativa nueva y distinta del "Imperio de los Test/Robot" (Capítulo 1); su identidad y guion concretos se autoran durante `/speckit.plan`/`/speckit.implement`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un jugador que completó el Capítulo 1 puede completar el recorrido íntegro del Capítulo 2 (diálogo pre-batalla → batalla → diálogo post-batalla) en una sola sesión sin ayuda externa.
- **SC-002**: El banner "Hacia el Futuro" pasa de bloqueado a desbloqueado el 100% de las veces que el jugador completa el Capítulo 1 y vuelve al mapa de aventuras.
- **SC-003**: Al menos el 90% de los jugadores que terminan el Capítulo 2 pueden describir, sin instrucciones adicionales, en qué se diferencia narrativamente de lo visto en el Capítulo 1.
- **SC-004**: Un jugador sin el Capítulo 1 completado no puede acceder a la batalla del Capítulo 2 en el 100% de los intentos.

## Assumptions

- Las tres decisiones de contenido que el propio roadmap (`docs/roadmap-fases.md`) señalaba como no resueltas ("[Completar aquí unidades nuevas, ambientación y beat de historia específico cuando se defina el guion]") se resolvieron en la sesión de clarificación de esta spec (ver "Clarifications" arriba): nueva amenaza/antagonista, 1-2 unidades nuevas, y reutilización de la plantilla de enemigos de `001` escalada en dificultad. El guion exacto (nombre del antagonista, texto de diálogo, diseño concreto de las unidades nuevas) queda como trabajo de autoría de contenido para `/speckit.plan`/`/speckit.implement`, consistente con cómo `001-chapter1-vertical-slice` tampoco fijó el texto literal del diálogo a nivel de spec.
- El resto de la estructura (patrón de diálogo pre/post, núcleo de combate, condición de victoria/derrota, mecanismo de desbloqueo) se deriva directamente de `001-chapter1-vertical-slice` y `004-adventure-map-banners`, ya validados, y no requiere clarificación adicional.
- Una vez implementado el contenido de esta feature, `004-adventure-map-banners` necesitará un ajuste menor (retirar la excepción hardcodeada que mantenía "Hacia el Futuro" bloqueado sin importar el progreso) para que el banner empiece a depender únicamente de su mecanismo genérico de desbloqueo secuencial; ese ajuste queda fuera del alcance de esta spec.
- Las 1-2 unidades nuevas de este capítulo, al requerir su propio ScriptableObject de datos, heredan también los contratos ya extendidos por `007-attack-types` y `008-classification-trait-abilities` (tipo de ataque y clasificación); esta spec no repite esos requisitos, solo asume que se aplican igual que a cualquier unidad nueva del proyecto.
