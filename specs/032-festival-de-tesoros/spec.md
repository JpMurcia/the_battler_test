# Feature Specification: Festival de Tesoros

**Feature Branch**: `032-festival-de-tesoros`

**Created**: 2026-08-27

**Status**: Draft

**Input**: User description: "Festival de Tesoros: banner con multiplicador y cuenta regresiva en el mapa de etapas, mostrado durante ventanas de tiempo programadas (mismo patrón que EVENT_BANNERS de specs/014), que duplica la moneda de victoria mientras está activo. Basado en manual técnico §9.8, adaptado porque este proyecto no tiene un sistema de tesoro probabilístico (el tesoro de un nivel se otorga garantizado una sola vez, specs/012) — el multiplicador del festival se aplica a la moneda de victoria en vez de a una probabilidad de tesoro."

**Nota de origen**: cuarta spec del backlog derivado de comparar el mockup y el manual técnico contra `src/` (ver `specs/029`). Última spec de Nivel B — reutiliza el patrón de ventanas de tiempo ya validado por `specs/014-banner-evento-especial`/`specs/015`, sin subsistema nuevo.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver el Festival de Tesoros activo en el mapa de etapas (Priority: P1)

Un jugador abre el mapa de etapas durante una ventana de Festival de Tesoros programada y ve un banner con el multiplicador activo y una cuenta regresiva hasta que termine; fuera de esa ventana, no ve ningún banner.

**Why this priority**: Es el elemento visible que da sentido a la Historia 2 — sin el banner, el jugador no tiene forma de saber que está recibiendo el bono.

**Independent Test**: Con una ventana de festival activa (mockeada a `nowMs`), abrir el mapa de etapas y confirmar que el banner muestra el multiplicador y una cuenta regresiva que decrece con el tiempo real; fuera de la ventana, confirmar que el banner no aparece.

**Acceptance Scenarios**:

1. **Given** el momento actual cae dentro de una ventana de Festival de Tesoros programada, **When** el jugador abre el mapa de etapas, **Then** ve un banner con el nombre del festival, su multiplicador de moneda, y un tiempo restante hasta que la ventana termine.
2. **Given** el banner está visible, **When** pasa el tiempo real, **Then** la cuenta regresiva mostrada decrece de forma consistente.
3. **Given** el momento actual no cae dentro de ninguna ventana programada, **When** el jugador abre el mapa de etapas, **Then** no se muestra ningún banner de festival.
4. **Given** dos ventanas de festival distintas no solapadas, **When** el jugador abre el mapa dentro de la segunda ventana, **Then** el banner refleja esa ventana (nombre/multiplicador/tiempo restante correctos para ella, no para la primera).

---

### User Story 2 - La moneda de victoria se duplica mientras el festival está activo (Priority: P1)

Un jugador completa un nivel con victoria mientras el Festival de Tesoros está activo y recibe más moneda que si lo completara fuera de esa ventana.

**Why this priority**: Es el efecto jugable real detrás del banner — sin esto, el festival sería solo un elemento decorativo sin impacto en el juego.

**Independent Test**: Completar un nivel con victoria dentro y fuera de una ventana de festival (mismo nivel, mismas condiciones) y confirmar que la moneda otorgada dentro de la ventana es mayor, en la proporción del multiplicador del festival.

**Acceptance Scenarios**:

1. **Given** una batalla termina en victoria mientras el Festival de Tesoros está activo, **When** se otorga la recompensa, **Then** la moneda incluye el multiplicador del festival, combinado multiplicativamente con los bonos ya existentes (sets de tesoros, Cat Combos, Mejoras de Base).
2. **Given** una batalla termina en victoria fuera de cualquier ventana de festival, **When** se otorga la recompensa, **Then** la moneda no incluye ningún multiplicador de festival — comportamiento idéntico al de antes de esta spec.
3. **Given** el festival termina mientras una batalla ya está en curso, **When** la batalla termina en victoria después de ese momento, **Then** el multiplicador aplicado corresponde al estado del festival en el momento exacto de otorgar la recompensa (no al momento en que empezó la batalla).

---

### Edge Cases

- Dos ventanas de festival que se solapan en el tiempo (no debería ocurrir con el catálogo actual, pero el sistema debe tolerarlo): se usa el multiplicador de la primera ventana activa encontrada, mismo criterio ya aceptado por `isEventActive` (specs/014, sin fusión de intervalos).
- El jugador abre el mapa de etapas justo en el instante en que una ventana termina: el banner desaparece en la siguiente actualización del countdown local (máximo 1 segundo de desfase, mismo criterio que el temporizador de energía de `specs/029`).
- Ninguna ventana de festival está programada en el catálogo actual (`TREASURE_FESTIVALS` vacío): el sistema no muestra banner ni aplica multiplicador en ningún momento, sin error.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE definir un catálogo de festivales, cada uno con nombre, multiplicador de moneda, y una o más ventanas de tiempo (mismo formato `EventTimeWindow` ya usado por `EVENT_BANNERS`, specs/014).
- **FR-002**: El sistema DEBE mostrar, en el mapa de etapas, un banner con el festival activo (si lo hay) — nombre, multiplicador y tiempo restante hasta que su ventana actual termine.
- **FR-003**: El tiempo restante mostrado DEBE actualizarse en tiempo real mientras el mapa de etapas está abierto.
- **FR-004**: Sin ningún festival activo, el sistema NO DEBE mostrar ningún banner.
- **FR-005**: La moneda otorgada al completar un nivel con victoria DEBE incluir el multiplicador del festival activo en el momento de otorgar la recompensa, combinado multiplicativamente con los multiplicadores ya existentes (sets de tesoros, Cat Combos, Mejoras de Base — specs/013/025/031).
- **FR-006**: Sin ningún festival activo al momento de la victoria, la moneda otorgada NO DEBE incluir ningún multiplicador de festival (factor 1, sin regresión).

### Key Entities *(include if feature involves data)*

- **Festival de Tesoros** (dato estático, `src/data/`): id, nombre, multiplicador de moneda, ventanas de tiempo — mismo patrón que `EventBanner` (specs/014), sin `specialStage` propia (este festival no añade ningún nivel nuevo, a diferencia del banner de evento existente).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Dentro de una ventana de festival de prueba, el mapa de etapas muestra el banner con el multiplicador y un countdown que decrece con el tiempo real.
- **SC-002**: Fuera de cualquier ventana de festival, el mapa de etapas no muestra ningún banner.
- **SC-003**: La moneda otorgada por una victoria de prueba dentro de una ventana de festival es exactamente el multiplicador del festival veces la moneda que se otorgaría sin él (manteniendo los demás multiplicadores existentes iguales).
- **SC-004**: `npx tsc -b` limpio y `npm test` en verde, sin regresión en ninguna suite existente.

## Assumptions

- **Adaptación del efecto (manual §9.8)**: el manual describe el Festival de Tesoros como una duplicación de la *probabilidad* de obtener tesoro. Este proyecto no tiene ese mecanismo — el tesoro de cada nivel se otorga garantizado en su primera victoria (`specs/012-saga-imperio-de-los-gatos`, `grantLevelRewards`), sin ninguna tirada de probabilidad que duplicar. Se adapta el efecto a duplicar la moneda de victoria durante la ventana activa, manteniendo el nombre/presentación del mockup ("Festival de Tesoros ×2") pero con un efecto jugable real y coherente con el modelo de recompensas ya existente en el proyecto (mismo patrón multiplicativo que specs/013/025/031).
- **Recurrencia (manual: "al menos una vez al día")**: no se implementa un programador recurrente genérico — el catálogo `TREASURE_FESTIVALS` es una lista de ventanas de tiempo fijas (mismo patrón ya usado por `EVENT_BANNERS.timeWindows`, que hoy lista una ventana "actual" amplia y una futura como ejemplo). Añadir más ventanas al catálogo es una tarea de contenido, no de código.
- Esta spec no introduce ninguna pantalla ni panel nuevo — el banner vive dentro de `LevelSelectScreen` ya existente, mismo patrón que el nodo de evento especial (`specs/014`).
