# Feature Specification: Gamatoto (Expediciones Asíncronas)

**Feature Branch**: `034-gamatoto`

**Created**: 2026-08-27

**Status**: Draft

**Input**: User description: "Gamatoto: panel accesible desde el Hub (icono de dock ya en el mockup, gamatotoReadyBadge sin funcionalidad) donde el jugador envía una expedición eligiendo entre duraciones fijas; el progreso se calcula por timestamp persistido, avanzando aunque la app esté cerrada; al completarse y reclamarse otorga materiales de Gamatoto, un recurso nuevo cuyo primer consumidor será specs/035-ototo-corps. Basado en manual técnico §9.1."

**Nota de origen**: segunda spec de Nivel C del backlog (subsistema nuevo completo) — ver `specs/029` para el origen completo. El icono de Gamatoto ya existe dibujado en el mockup (`docs/the-battle-cats-redesign/project/Battle Cats Modernizado.dc.html`, `openGamatoto`/`gamatotoReadyBadge`) pero no tiene ninguna pantalla ni dato detrás en `src/` — esta spec lo construye. Introduce el patrón técnico de "temporizador persistido que avanza con la app cerrada" que ninguna spec anterior necesitó (a diferencia de `specs/029` energía, que regenera mientras la app está abierta pero se recupera igual por extrapolación de tiempo real — el mismo principio de fondo, aplicado aquí a una acción de un solo disparo en vez de un recurso continuo).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Enviar una expedición de Gamatoto (Priority: P1)

Un jugador sin ninguna expedición activa abre el panel de Gamatoto, elige una duración entre las opciones disponibles, y la envía — quedando registrada con su hora de inicio.

**Why this priority**: Sin poder enviar una expedición, ninguna historia siguiente tiene nada que esperar ni reclamar.

**Independent Test**: Sin expedición activa, abrir el panel, elegir una duración, confirmar que queda registrada como en curso con el tiempo restante correcto, y que las opciones de enviar una nueva ya no están disponibles mientras haya una en curso.

**Acceptance Scenarios**:

1. **Given** el jugador no tiene ninguna expedición activa, **When** abre el panel de Gamatoto, **Then** ve las duraciones disponibles, cada una con los materiales que otorga.
2. **Given** el jugador elige una duración, **When** confirma el envío, **Then** la expedición queda registrada como en curso, con un tiempo restante que empieza en la duración elegida.
3. **Given** una expedición ya está en curso, **When** el jugador ve el panel, **Then** no puede enviar una segunda expedición hasta que la actual se reclame.

---

### User Story 2 - El progreso avanza aunque la aplicación esté cerrada (Priority: P1)

Un jugador que envió una expedición, cierra la aplicación, y la vuelve a abrir más tarde — el tiempo restante mostrado refleja el tiempo real transcurrido, no el tiempo que la aplicación estuvo efectivamente abierta.

**Why this priority**: Es la característica que define a Gamatoto como "asíncrono" — sin esto, sería indistinguible de cualquier otro temporizador de UI ya existente en el proyecto.

**Independent Test**: Enviar una expedición, simular el paso de tiempo real sin que la aplicación esté "abierta" (releer el estado persistido con un `nowMs` posterior), y confirmar que el tiempo restante calculado refleja ese tiempo real transcurrido.

**Acceptance Scenarios**:

1. **Given** una expedición en curso con tiempo restante X, **When** pasa tiempo real igual a X mientras la aplicación está cerrada, **Then** al reabrir la aplicación la expedición se muestra como completa, lista para reclamar.
2. **Given** una expedición en curso, **When** el jugador reabre la aplicación antes de que termine, **Then** el tiempo restante mostrado es exactamente la duración elegida menos el tiempo real ya transcurrido desde el envío.
3. **Given** una expedición ya completa pero sin reclamar, **When** el jugador reabre la aplicación, **Then** sigue mostrándose como completa y reclamable — no se pierde ni se re-consume tiempo.

---

### User Story 3 - Reclamar materiales al completarse (Priority: P1)

Un jugador con una expedición completa la reclama y recibe materiales de Gamatoto, quedando libre para enviar una nueva expedición.

**Why this priority**: Es el efecto jugable real detrás de la espera — sin esto, Gamatoto sería solo un cronómetro sin recompensa.

**Independent Test**: Con una expedición completa (mockeada), reclamarla y confirmar que los materiales de Gamatoto aumentan exactamente en la cantidad de la duración elegida, y que el panel vuelve a ofrecer el envío de una nueva expedición.

**Acceptance Scenarios**:

1. **Given** una expedición completa, **When** el jugador la reclama, **Then** sus materiales de Gamatoto aumentan exactamente en la cantidad definida para la duración que eligió.
2. **Given** la expedición fue reclamada, **When** el jugador ve el panel, **Then** puede enviar una nueva expedición de inmediato.
3. **Given** una expedición todavía no completa, **When** el jugador intenta reclamarla, **Then** no ocurre ningún efecto (sin materiales otorgados, sin liberar el slot).
4. **Given** el botón "Gamatoto" del Hub, **When** hay una expedición completa sin reclamar, **Then** muestra un indicador (badge) — ausente en cualquier otro estado (sin expedición, o expedición todavía en curso).

---

### Edge Cases

- El reloj del dispositivo retrocede después de enviar una expedición: mismo criterio ya aceptado en `specs/033` (no se detecta ni bloquea manipulación de reloj) — el tiempo restante calculado podría mostrar un valor mayor al original, sin protección especial.
- El jugador cierra la aplicación mucho después de que la expedición ya estaba completa (varios días): se muestra igual como completa y reclamable, sin acumular ni otorgar más de una recompensa por esa expedición.
- El jugador intenta enviar una expedición sin ninguna duración seleccionada: el envío no procede hasta elegir una opción válida.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE ofrecer, desde el Hub, un panel de Gamatoto con un catálogo fijo de duraciones de expedición, cada una con los materiales que otorga.
- **FR-002**: El sistema DEBE permitir enviar una expedición solo cuando no haya ninguna ya en curso o completa sin reclamar, registrando la hora real de inicio.
- **FR-003**: El sistema DEBE calcular el tiempo restante de una expedición en curso a partir de la hora real transcurrida desde su inicio, sin depender de que la aplicación haya permanecido abierta durante ese tiempo.
- **FR-004**: El sistema DEBE permitir reclamar una expedición únicamente cuando su tiempo restante calculado sea 0, otorgando los materiales de Gamatoto definidos para la duración elegida y liberando el slot para una nueva expedición.
- **FR-005**: El sistema DEBE mostrar, en el botón "Gamatoto" del Hub, un indicador cuando haya una expedición completa sin reclamar — ausente en cualquier otro estado.
- **FR-006**: El estado de la expedición (en curso/completa, hora de inicio, duración) y los materiales acumulados DEBEN persistir entre sesiones (Constitución § V).

### Key Entities *(include if feature involves data)*

- **Duración de expedición** (dato estático, `src/data/`): id, nombre, duración en milisegundos, cantidad de materiales otorgados.
- **Expedición activa** (persistida): duración elegida, hora real de inicio — ausente cuando no hay ninguna en curso.
- **Materiales de Gamatoto** (persistidos): contador acumulado de cuenta, sin usarse todavía dentro de esta spec — primer consumidor previsto: `specs/035-ototo-corps`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El jugador puede enviar una expedición desde el panel, con las opciones de duración visibles y su recompensa de materiales.
- **SC-002**: Con una expedición en curso, el tiempo restante mostrado disminuye de forma consistente con el tiempo real, incluso tras simular un cierre y reapertura de la aplicación (releer el estado sin que haya transcurrido tiempo de "app abierta").
- **SC-003**: Reclamar una expedición completa aumenta los materiales de Gamatoto exactamente en la cantidad correcta y libera el slot para una nueva expedición.
- **SC-004**: El botón "Gamatoto" del Hub muestra un indicador únicamente cuando hay una expedición completa sin reclamar.
- **SC-005**: `npx tsc -b` limpio y `npm test` en verde, sin regresión en ninguna suite existente.

## Assumptions

- **Un solo slot de expedición**: el manual no especifica un límite de expediciones simultáneas para el jugador básico (el juego real amplía slots con progreso); esta spec implementa un único slot fijo — ampliar a múltiples slots es una extensión futura, no bloqueada por este diseño (el catálogo de duraciones y el cálculo de tiempo restante no cambian, solo la cantidad de expediciones registradas a la vez).
- **Catálogo de duraciones**: 3 opciones de ejemplo (corta/media/larga), valores de diseño provisionales no balanceados — mismo criterio que el resto del contenido del proyecto.
- **Ingenieros (manual §9.1/9.2, hasta 5 obtenidos en expediciones)**: no se implementan en esta spec — los "materiales de Gamatoto" son el único resultado; los ingenieros son un mecanismo de `specs/035-ototo-corps` (que ya los documenta como fuera de su propio alcance también, evitando inventar un sistema de personal no pedido explícitamente).
- Sin cambios a `src/engine/` ni a ninguna mecánica de combate — es un sistema de meta-progresión aislado, mismo patrón de persistencia singleton que el resto de specs de Nivel B/C.
- Los materiales de Gamatoto quedan sin ningún uso dentro de esta spec (deliberado, ver Key Entities) — es esperable y correcto que, al completar solo `specs/034`, el jugador acumule un recurso todavía sin gastar; `specs/035-ototo-corps` es quien lo consume.
