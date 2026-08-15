# Feature Specification: Mapa de Aventuras (Banners) y Desbloqueo Secuencial

**Feature Branch**: `004-adventure-map-banners`

**Created**: 2026-07-28

**Status**: Draft

**Input**: User description: "Mapa de aventuras de \"The Battler\": pantalla con banners de capítulo navegable sin bloqueos (scroll libre), donde cada banner representa un capítulo/aventura. Solo los banners desbloqueados son seleccionables; el desbloqueo es secuencial (completar un capítulo desbloquea el siguiente), usando el progreso guardado de 002-local-save-progress. El primer banner es \"Imperio de los Test/Robot\" y enlaza a la batalla de 001-chapter1-vertical-slice; el segundo banner \"Hacia el Futuro\" existe visualmente pero permanece bloqueado hasta que su contenido se especifique aparte. No incluye banners de evento/especiales (eso es una spec separada)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navegar el mapa de banners libremente (Priority: P1)

Un jugador que entra al mapa de aventuras puede desplazarse (scroll) por todos los banners existentes, tanto los desbloqueados como los bloqueados, sin que el sistema le impida moverse por ninguno de ellos.

**Why this priority**: Es la base de la pantalla — sin navegación libre no hay forma de ver ni de llegar a ningún banner, desbloqueado o no.

**Independent Test**: Entrar al mapa de aventuras con cualquier estado de progreso (incluso sin progreso) y confirmar que se puede desplazar hasta ver todos los banners existentes, incluidos los bloqueados, sin ningún tope o bloqueo de scroll.

**Acceptance Scenarios**:

1. **Given** el jugador entra al mapa de aventuras, **When** desliza/desplaza la vista, **Then** puede recorrer todos los banners existentes (desbloqueados y bloqueados) sin que el desplazamiento se detenga o se bloquee al llegar a uno bloqueado.
2. **Given** el jugador está viendo un banner bloqueado, **When** continúa desplazándose, **Then** el mapa sigue respondiendo con normalidad, igual que sobre un banner desbloqueado.

---

### User Story 2 - Entrar a la batalla desde un banner desbloqueado (Priority: P1)

Un jugador selecciona un banner desbloqueado (por ejemplo, "Imperio de los Test/Robot") y el juego lo lleva a la batalla correspondiente a ese capítulo.

**Why this priority**: Es el valor central del mapa — conectar la navegación con el contenido jugable real (001-chapter1-vertical-slice). Sin esto, el mapa es solo una pantalla decorativa.

**Independent Test**: Con el primer banner desbloqueado (estado por defecto, sin progreso previo), seleccionarlo y confirmar que el juego entra a la batalla del Capítulo 1.

**Acceptance Scenarios**:

1. **Given** el jugador no tiene progreso guardado, **When** entra al mapa de aventuras, **Then** el banner "Imperio de los Test/Robot" aparece desbloqueado y seleccionable.
2. **Given** el banner "Imperio de los Test/Robot" está desbloqueado, **When** el jugador lo selecciona, **Then** el juego lo lleva a la batalla de `001-chapter1-vertical-slice`.

---

### User Story 3 - Desbloqueo secuencial automático al completar un capítulo (Priority: P2)

Un jugador que completa la batalla de un capítulo ve reflejado, la próxima vez que entra al mapa, que ese capítulo quedó marcado como completado, según el progreso guardado en `002-local-save-progress`.

**Why this priority**: Da continuidad y sentido de avance al mapa; depende de que las Historias 1 y 2 ya funcionen (navegar y entrar a una batalla) para tener algo que completar primero.

**Independent Test**: Completar la batalla del Capítulo 1, volver al mapa de aventuras y confirmar que el banner correspondiente refleja el estado de completado, usando el progreso persistido por 002-local-save-progress.

**Acceptance Scenarios**:

1. **Given** el jugador completa la batalla de un capítulo cuyo banner estaba desbloqueado, **When** vuelve al mapa de aventuras, **Then** el banner de ese capítulo refleja el estado de completado según `002-local-save-progress`.
2. **Given** el progreso guardado indica que un capítulo está completado, **When** el jugador abre el mapa de aventuras, **Then** el sistema evalúa el desbloqueo del siguiente banner con contenido jugable real en función de ese progreso.
3. **Given** el progreso guardado está corrupto o no es legible, **When** el jugador abre el mapa de aventuras, **Then** el sistema lo trata como ausencia de progreso (solo el primer banner desbloqueado), consistente con el comportamiento de fallback de `002-local-save-progress`.

---

### Edge Cases

- ¿Qué pasa si el jugador intenta seleccionar un banner bloqueado? El sistema no debe iniciar ninguna navegación ni batalla; el banner simplemente no responde como seleccionable.
- ¿Qué pasa si el progreso guardado está corrupto o en un formato no reconocido? Se trata como ausencia de progreso: solo el primer banner ("Imperio de los Test/Robot") aparece desbloqueado, igual que el criterio ya definido en `002-local-save-progress` y `003-main-menu-config`.
- ¿Qué pasa con el banner "Hacia el Futuro" cuando el jugador completa el Capítulo 1? Permanece visible pero no seleccionable en esta feature, independientemente del progreso, porque su contenido de batalla todavía no existe (se especifica en una fase posterior). No debe confundirse con un banner "bloqueado por progreso": aquí el bloqueo es porque el destino aún no existe.
- ¿Qué pasa si en el futuro se agregan más capítulos después de "Hacia el Futuro"? El mecanismo de desbloqueo secuencial por progreso debe funcionar de forma genérica (capítulo N completado desbloquea el banner N+1 con contenido real), no debe quedar hardcodeado únicamente para estos dos banners.
- ¿Qué pasa si el jugador entra al mapa por primera vez, sin haber pasado nunca por el menú principal? Fuera de alcance de esta feature: el punto de entrada al mapa se define en `003-main-menu-config`; esta spec asume que ya se llegó al mapa por ese camino.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE mostrar todos los banners de capítulo existentes en el mapa de aventuras, tanto los desbloqueados como los bloqueados.
- **FR-002**: El sistema DEBE permitir al jugador desplazarse (scroll) libremente por todos los banners del mapa, sin restringir el movimiento por la presencia de banners bloqueados.
- **FR-003**: El sistema DEBE permitir seleccionar únicamente los banners marcados como desbloqueados; seleccionar un banner bloqueado NO DEBE iniciar ninguna navegación ni batalla.
- **FR-004**: El sistema DEBE mostrar el banner "Imperio de los Test/Robot" como desbloqueado por defecto (incluyendo cuando no existe progreso guardado), y al seleccionarlo DEBE llevar al jugador a la batalla de `001-chapter1-vertical-slice`.
- **FR-005**: El sistema DEBE mostrar el banner "Hacia el Futuro" de forma visible en el mapa mientras permanece no seleccionable, ya que su contenido de batalla aún no está especificado (ver Fase 11 del roadmap).
- **FR-006**: El sistema DEBE derivar el estado de completado de cada capítulo (y por tanto el desbloqueo de banners con contenido real) a partir del progreso guardado leído de `002-local-save-progress`, sin modificarlo.
- **FR-007**: El sistema DEBE implementar el desbloqueo secuencial de forma genérica por progreso (completar el capítulo del banner N desbloquea el banner N+1 con contenido real), de modo que futuros capítulos puedan agregarse sin rediseñar el mecanismo.
- **FR-008**: El sistema DEBE tratar un progreso guardado corrupto o ilegible como ausencia de progreso a efectos del mapa (solo el primer banner desbloqueado), sin bloquear la carga del mapa.
- **FR-009**: El sistema NO DEBE incluir banners de eventos o especiales (por ejemplo, banners con ventana horaria activa) en este mapa; esos quedan fuera de alcance de esta feature.
- **FR-010**: El sistema DEBE reflejar el estado de completado de un capítulo en su banner correspondiente la próxima vez que el jugador entra al mapa tras completar esa batalla.

### Key Entities *(include if feature involves data)*

- **ChapterBanner**: representa un capítulo/aventura dentro del mapa — identificador de capítulo (ligado al `ChapterProgressRecord` de `002-local-save-progress`), nombre visible (ej. "Imperio de los Test/Robot", "Hacia el Futuro"), estado de desbloqueo (bloqueado / desbloqueado), estado de completado, y si tiene o no un destino de batalla jugable real.
- **AdventureMap**: colección ordenada de `ChapterBanner` que se muestra y recorre en esta pantalla; el orden determina la secuencia de desbloqueo.
- **ProgressSaveData** (existente, de `002-local-save-progress`): se lee desde esta feature únicamente para derivar el estado de desbloqueo/completado de cada `ChapterBanner`, sin modificarse.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un jugador puede recorrer (scroll) el 100% de los banners existentes del mapa, bloqueados o no, sin encontrar ningún punto donde el desplazamiento quede impedido.
- **SC-002**: Un jugador sin progreso previo pasa del mapa de aventuras a la batalla del Capítulo 1 en una sola selección.
- **SC-003**: Intentar seleccionar un banner bloqueado no produce navegación ni error el 100% de las veces.
- **SC-004**: Tras completar el Capítulo 1, el jugador ve el estado de completado reflejado en el banner correspondiente el 100% de las veces que vuelve a abrir el mapa, siempre que el progreso guardado sea legible.
- **SC-005**: El mapa de aventuras se muestra y queda interactivo en menos de 2 segundos desde que se entra a él, en un dispositivo móvil de gama media (misma referencia de hardware objetivo usada en `003-main-menu-config`).

## Assumptions

- El punto de entrada al mapa de aventuras (desde el menú principal, botones "Empezar"/"Continuar") ya está cubierto por `003-main-menu-config`; esta spec cubre únicamente la pantalla del mapa en sí, no cómo se llega a ella.
- "Hacia el Futuro" se especifica en esta feature solo como banner visible y no seleccionable, sin contenido de batalla real; su contenido jugable (diálogos, unidades, batalla) se define en una spec separada (Fase 11 del roadmap), y esta feature no debe requerir cambios cuando esa spec exista — solo debería empezar a tener un destino de batalla asignado.
- El mecanismo de desbloqueo secuencial se implementa de forma genérica (por posición/orden de capítulo y estado de completado), no hardcodeado exclusivamente para los dos banners descritos hoy, para no requerir rediseño cuando se agreguen más capítulos (Fase 11 en adelante).
- Los banners de eventos/especiales (ej. "Etapas de Fantasia", Fase 12 del roadmap) están explícitamente fuera de alcance de esta feature, tal como indica el input de la feature.
- Un progreso guardado corrupto o ilegible se trata igual que en `002-local-save-progress` y `003-main-menu-config`: como ausencia de progreso, sin bloquear el uso del mapa.
- "Hardware objetivo" (SC-005) sigue la misma asunción de dispositivo móvil de gama media usada en `003-main-menu-config`, derivada de la descripción del proyecto en `docs/roadmap-fases.md`.
- Esta feature no incluye la representación visual del banner especial de eventos (Fase 12) ni ningún banner adicional más allá de los dos capítulos descritos en el input.
