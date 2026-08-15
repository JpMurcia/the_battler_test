# Feature Specification: Migración de The Battler a React Web

**Feature Branch**: `024-react-web-migration`

**Created**: 2026-08-14

**Status**: Draft

**Input**: User description: "Migrar el juego The Battler (actualmente Unity/C#) a una aplicación web nueva construida con React, Three.js/React Three Fiber (para render 3D si aplica), Pixi.js (para render 2D/UI compleja) y Zustand (estado), preservando toda la lógica de juego (combate automático por despliegue, progresión de capítulos, energía de misión, nivelado/evolución de unidades, formación de equipo, diálogos), el catálogo de contenido (capítulos, unidades, banners) y los assets necesarios, sin depender de ningún backend existente (el proyecto Unity no tiene uno)."

**Note**: Esta spec documenta el traslado de The Battler a un repositorio/código base nuevo fuera de Unity. Las Restricciones Técnicas de `.specify/memory/constitution.md` fijan el motor Unity para *este* proyecto — no aplican al código nuevo que resulte de esta migración (ver Constitution Check en `plan.md`). Esta spec.md cubre el QUÉ/POR QUÉ; el CÓMO (stack, arquitectura, mapeo Unity→React) vive en `plan.md`, y el desglose de tareas en `tasks.md`, siguiendo el mismo pipeline Spec Kit que el resto del proyecto.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Jugar el bucle central de combate en el navegador (Priority: P1)

Un jugador abre la versión web de The Battler, entra a una batalla ya desbloqueada, ve el recurso de energía acumularse automáticamente, despliega unidades predefinidas en un carril pagando ese recurso (sujeto a coste y cooldown por unidad), observa que cada unidad actúa de forma autónoma tras desplegarse, y la batalla termina en victoria o derrota según cuál base (jugador o enemiga) es destruida primero.

**Why this priority**: Es el núcleo jugable de The Battler (Principio II de la constitución del proyecto Unity: Combate Automático por Despliegue). Sin esto no hay producto — es el MVP mínimo demostrable de la migración.

**Independent Test**: Cargar la versión web, entrar a la primera batalla del Capítulo 1, desplegar al menos dos unidades distintas y confirmar que el combate se resuelve automáticamente hasta un resultado de victoria o derrota, sin intervención directa del jugador sobre la unidad ya desplegada.

**Acceptance Scenarios**:

1. **Given** el jugador está en una pantalla de batalla con energía inicial en cero, **When** pasa el tiempo, **Then** la energía se acumula automáticamente hasta permitir desplegar la primera unidad disponible.
2. **Given** el jugador tiene energía suficiente, **When** despliega una unidad en un carril, **Then** la unidad aparece en ese carril y avanza/actúa de forma autónoma sin más input del jugador, y la energía se descuenta según el coste de esa unidad.
3. **Given** una unidad fue desplegada, **When** su cooldown individual no ha expirado, **Then** el jugador no puede volver a desplegar esa misma unidad hasta que el cooldown termine.
4. **Given** la base enemiga o la base del jugador llega a cero de salud, **When** eso ocurre, **Then** la batalla termina inmediatamente mostrando el resultado (victoria o derrota) correspondiente al bando cuya base sigue en pie.

---

### User Story 2 - Progresar por capítulos con las mismas reglas de desbloqueo (Priority: P1)

Un jugador que completa una batalla ve su progreso guardado, la siguiente etapa del capítulo se desbloquea, y no puede saltarse etapas todavía bloqueadas — igual que en la versión Unity.

**Why this priority**: La progresión por capítulos es el hilo conductor de todo el contenido (Principio IV) — sin ella, "jugar una batalla" no se conecta con "avanzar en el juego".

**Independent Test**: Completar la primera batalla de un capítulo, recargar la página, y confirmar que la siguiente etapa aparece desbloqueada mientras que etapas posteriores siguen bloqueadas.

**Acceptance Scenarios**:

1. **Given** el jugador completa una batalla con victoria, **When** vuelve al mapa del capítulo, **Then** la siguiente etapa aparece desbloqueada y la etapa completada queda marcada como tal.
2. **Given** una etapa todavía no fue desbloqueada, **When** el jugador intenta entrar a ella, **Then** el sistema lo impide y comunica que sigue bloqueada.
3. **Given** el jugador cierra y vuelve a abrir la aplicación, **When** revisa su progreso de capítulos, **Then** ve exactamente el mismo estado de desbloqueo que tenía antes de cerrar.

---

### User Story 3 - Gestionar el roster: nivelado, evolución y formación de equipo (Priority: P2)

Un jugador entra a su Base/Hub, sube de nivel a un personaje con experiencia acumulada, hace evolucionar una unidad que cumple los requisitos de su siguiente etapa, y arma su equipo eligiendo qué unidades desplegadas llevará a la próxima batalla.

**Why this priority**: Es la capa de meta-progresión que le da sentido a jugar más de una batalla — necesaria para el ciclo de retención del juego, pero el juego sigue siendo jugable (P1/P2 arriba) sin ella durante una demo mínima.

**Independent Test**: Con una unidad que ya cumple los requisitos de evolución, confirmar que evolucionar la unidad cambia su etapa, su animación/apariencia y sus estadísticas de combate; y que el equipo formado en la pantalla de formación es el que efectivamente aparece disponible para desplegar en la siguiente batalla.

**Acceptance Scenarios**:

1. **Given** un personaje tiene experiencia suficiente para subir de nivel, **When** el jugador aplica esa experiencia, **Then** el nivel del personaje sube y sus estadísticas de combate se recalculan según la misma curva que la versión Unity.
2. **Given** una unidad cumple los requisitos de su siguiente etapa de evolución, **When** el jugador la evoluciona, **Then** la unidad pasa a esa etapa con su propia apariencia y estadísticas, y no puede evolucionar de nuevo hasta cumplir los requisitos de la etapa siguiente (si existe).
3. **Given** el jugador arma un equipo de unidades desbloqueadas, **When** entra a una batalla, **Then** solo las unidades incluidas en ese equipo están disponibles para desplegar.

---

### User Story 4 - Energía de misión (stamina) que limita cuántas batallas se pueden iniciar (Priority: P2)

Un jugador ve un recurso de energía de misión que se regenera con el tiempo, gasta energía al entrar a una batalla, y no puede iniciar una nueva batalla si no le alcanza.

**Why this priority**: Es un sistema de retención ya construido en la versión Unity (`006-mission-energy-system`); mantiene el ritmo de sesión esperado, pero no bloquea que el bucle de combate (P1) funcione en una demo.

**Independent Test**: Gastar energía de misión hasta quedar por debajo del costo de la siguiente batalla y confirmar que el sistema impide entrar a esa batalla hasta que la energía se regenere lo suficiente.

**Acceptance Scenarios**:

1. **Given** el jugador tiene energía de misión suficiente, **When** entra a una batalla, **Then** la energía se descuenta según el costo de esa batalla/región.
2. **Given** el jugador no tiene energía suficiente, **When** intenta entrar a una batalla, **Then** el sistema se lo impide y comunica cuánta energía falta.
3. **Given** pasa tiempo sin jugar, **When** el jugador vuelve, **Then** su energía de misión aumentó según la tasa de regeneración, sin superar el máximo permitido.

---

### User Story 5 - Ver la narrativa de cada batalla (Priority: P3)

Antes y después de cada batalla, el jugador ve una secuencia de diálogo (retrato + texto) que contextualiza esa batalla específica, igual que en la versión Unity.

**Why this priority**: Es un diferenciador de producto (Principio I: Narrativa Integrada) pero no bloquea la validación del bucle jugable central — puede llegar después del MVP de combate.

**Independent Test**: Entrar a una batalla que tiene diálogo pre-batalla asignado y confirmar que la secuencia se reproduce completa (todas las líneas, en orden) antes de que el combate comience, y que el diálogo post-batalla correspondiente al resultado obtenido se reproduce al terminar.

**Acceptance Scenarios**:

1. **Given** una batalla tiene diálogo pre-batalla configurado, **When** el jugador entra a ella, **Then** ve la secuencia completa de líneas (retrato + texto) antes de poder desplegar la primera unidad.
2. **Given** la batalla termina en victoria o derrota, **When** eso ocurre, **Then** se reproduce la secuencia de diálogo post-batalla correspondiente a ese resultado específico.

---

### Edge Cases

- ¿Qué pasa si el jugador recarga la página a mitad de una batalla en curso? (No existe guardado de estado de batalla en la versión Unity — se asume que la batalla se reinicia o se pierde el progreso de esa batalla puntual, no el progreso de capítulo ya guardado antes de entrar.)
- ¿Qué pasa si el jugador no tiene ninguna unidad desbloqueada todavía (primera sesión)? El sistema debe entregar un roster inicial jugable sin requerir ninguna acción previa.
- ¿Qué pasa con el progreso guardado en la versión Unity cuando el jugador usa por primera vez la versión web? Ver Assumptions — no hay migración de guardado entre plataformas en el alcance de esta feature.
- ¿Qué pasa si dos pestañas del navegador abren la misma sesión de juego a la vez? Fuera de alcance definir sincronización multi-pestaña; comportamiento por defecto del almacenamiento local del navegador.
- ¿Qué pasa si un panel opcional (p. ej. un acceso del Hub) no tiene contenido asignado? Debe comportarse igual que hoy en Unity: el acceso no aparece, sin romper el layout del resto (mismo patrón nulo-seguro documentado en `023-player-base-reskin`).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE mostrar un mapa de capítulo con las etapas/batallas disponibles, reflejando el mismo catálogo de contenido (capítulos, etapas, banners) que la versión Unity.
- **FR-002**: El sistema DEBE acumular automáticamente un recurso de energía de batalla con el tiempo, con tasa de regeneración mejorable, igual que la versión Unity.
- **FR-003**: Los jugadores DEBEN poder desplegar unidades predefinidas en un carril pagando el recurso de energía de batalla, sujeto a coste y cooldown individual por unidad.
- **FR-004**: El sistema DEBE resolver el combate de forma automática (sin control directo del jugador sobre una unidad ya desplegada) usando las mismas fórmulas de daño, salud, críticos/multi-golpe, clasificación e inmunidades que la versión Unity.
- **FR-005**: El sistema DEBE determinar el fin de una batalla (victoria/derrota) cuando la base del jugador o la base enemiga llega a cero de salud.
- **FR-006**: El sistema DEBE desbloquear la siguiente etapa de un capítulo al completar la etapa anterior con victoria, y DEBE impedir el acceso a etapas todavía no desbloqueadas.
- **FR-007**: Los jugadores DEBEN poder subir de nivel a un personaje consumiendo experiencia acumulada, recalculando sus estadísticas de combate según la misma curva de nivelado que la versión Unity.
- **FR-008**: Los jugadores DEBEN poder evolucionar una unidad a su siguiente etapa cuando cumple los requisitos definidos para esa etapa, cambiando su apariencia y estadísticas de combate.
- **FR-009**: Los jugadores DEBEN poder formar un equipo de unidades desbloqueadas, y solo las unidades incluidas en ese equipo DEBEN estar disponibles para desplegar en la siguiente batalla.
- **FR-010**: El sistema DEBE gestionar un recurso de energía de misión (stamina) separado de la energía de batalla, que se regenera con el tiempo, se descuenta al entrar a una batalla, y DEBE impedir iniciar una batalla si no hay energía de misión suficiente.
- **FR-011**: El sistema DEBE reproducir la secuencia de diálogo (retrato + texto, en orden) asociada a cada batalla, antes del combate (pre-batalla) y después según el resultado obtenido (post-batalla), para toda batalla que tenga diálogo configurado.
- **FR-012**: El sistema DEBE persistir el progreso del jugador (capítulos desbloqueados/completados, nivel y evolución de cada unidad, energía de misión, equipo formado) entre sesiones, de forma que cerrar y volver a abrir la aplicación conserve exactamente el mismo estado.
- **FR-013**: El sistema DEBE mostrar todo el texto de interfaz y diálogo en los idiomas actualmente soportados por la versión Unity, seleccionables por el jugador.
- **FR-014**: Cada unidad jugable/enemiga DEBE mostrarse con al menos animación de reposo (idle) y animación de ataque distintas, no un sprite estático único, preservando la identidad visual animada de la versión Unity.
- **FR-015**: El catálogo de contenido migrado DEBE cubrir el 100% de los capítulos, unidades, banners y textos localizados ya construidos en la versión Unity (Capítulos 1 y 2 según el estado actual del repositorio Unity) — ninguna unidad o etapa jugable en Unity hoy puede faltar en la versión web.

### Key Entities *(include if feature involves data)*

- **Unit / UnitProgress**: una unidad jugable o enemiga; combina un perfil de combate (coste, cooldown, salud, daño, rango, clasificación) con el progreso propio del jugador sobre ella (nivel, etapa de evolución, si está desbloqueada).
- **Chapter / Stage (Etapa de Batalla)**: unidad de contenido secuencial; agrupa una batalla, su configuración de carriles/oleadas, su diálogo pre/post batalla, y su estado de desbloqueo/completado por jugador.
- **PlayerProgress**: el estado guardado del jugador — capítulos/etapas desbloqueados y completados, energía de misión actual, equipo formado, progreso de cada unidad.
- **Team / Roster (Formación de Equipo)**: el subconjunto de unidades desbloqueadas que el jugador eligió llevar a la próxima batalla.
- **MissionEnergy (Energía de Misión)**: recurso de sesión que limita cuántas batallas puede iniciar un jugador en un periodo de tiempo, con capacidad máxima y tasa de regeneración.
- **DialogueSequence**: secuencia ordenada de líneas (retrato + texto) asociada a una batalla específica, para el momento pre-batalla o post-batalla.
- **LocalizedText**: texto de interfaz o diálogo disponible en más de un idioma, seleccionado según el idioma activo del jugador.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un jugador nuevo puede entrar a la primera batalla del Capítulo 1 y completarla (victoria o derrota) sin instrucciones externas, en menos de 5 minutos desde que carga la página por primera vez.
- **SC-002**: El 100% de los capítulos, etapas, unidades y banners presentes en la versión Unity actual (Capítulos 1 y 2) están disponibles y son jugables en la versión web, sin ninguna unidad o etapa faltante.
- **SC-003**: El progreso del jugador (capítulos, nivel/evolución de unidades, energía de misión, equipo) sobrevive al cierre y reapertura del navegador el 100% de las veces, sin pérdida de datos.
- **SC-004**: Las animaciones de combate y del Hub se perciben fluidas y sin tirones perceptibles en un dispositivo de gama media (sin definir aquí el detalle técnico de rendimiento, que vive en `plan.md`).
- **SC-005**: Un jugador que ya conoce la versión Unity puede completar las mismas acciones (desplegar, evolucionar, formar equipo, navegar el mapa de capítulos) en la versión web sin necesitar explicación adicional — mismos nombres y ubicaciones de función que en Unity.

## Assumptions

- La versión Unity de The Battler no tiene backend ni base de datos remota — todo el progreso se guarda localmente en el dispositivo (confirmado por ausencia de llamadas HTTP/`UnityWebRequest` en `Assets/Scripts`). Esta spec por lo tanto no incluye migración de un backend existente porque no existe uno; la estrategia de persistencia de la versión web (almacenamiento del navegador u otra) es una decisión técnica que se documenta en `plan.md`, no un requisito de negocio de esta spec.
- No hay migración de guardados entre la versión Unity (dispositivo/build actual) y la versión web — un jugador que ya jugó en Unity empieza con progreso nuevo en la web, salvo que una feature futura defina explícitamente una herramienta de migración de guardado.
- El alcance de "catálogo de contenido completo" se limita a lo ya construido en el repositorio Unity al momento de esta spec (Capítulos 1 y 2, según `specs/001-023`), no a contenido planeado a futuro.
- Sistemas explícitamente fuera del alcance actual de la versión Unity (economía de gacha real, monetización, multijugador — Principio VI de la constitución) siguen fuera de alcance en la versión web migrada.
- Esta feature vive documentalmente en este repositorio (bajo `specs/024-react-web-migration/`) pero su implementación ocurre en un código base nuevo separado del proyecto Unity; no se modifica ningún script de `Assets/Scripts` como parte de esta feature.
- "Dispositivo de gama media" y los umbrales de rendimiento concretos (FPS objetivo, tamaño de descarga inicial) se definen con precisión técnica en `plan.md`; esta spec solo fija la expectativa de producto de fluidez percibida.
