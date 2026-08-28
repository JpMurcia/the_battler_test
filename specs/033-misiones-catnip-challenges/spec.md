# Feature Specification: Misiones (Catnip Challenges)

**Feature Branch**: `033-misiones-catnip-challenges`

**Created**: 2026-08-27

**Status**: Draft

**Input**: User description: "Misiones (Catnip Challenges): panel accesible desde el Hub (botón 'Misiones' con badge de pendientes, ya en el mockup pero sin funcionalidad) con una lista fija de objetivos diarios (completar etapas, desplegar unidades, derrotar enemigos), cada uno con progreso visible y una recompensa de moneda reclamable al completarse. Se reinician al cambiar el día calendario del dispositivo (sin servidor, local-first). Basado en manual técnico §9.6."

**Nota de origen**: primera spec de Nivel C del backlog (subsistema nuevo completo, a diferencia de Nivel A/B que conectaban o profundizaban mecánica ya existente) — ver `specs/029` para el origen completo del backlog. El botón "Misiones" con badge ya existe dibujado en el mockup (`docs/the-battle-cats-redesign/project/Battle Cats Modernizado.dc.html`, `openMissions`/`pendingMissions`) pero no tiene ninguna pantalla ni dato detrás en `src/` — esta spec lo construye.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver el progreso de las misiones diarias y reclamar recompensas (Priority: P1)

Un jugador abre el panel de Misiones desde el Hub y ve una lista fija de objetivos diarios con su progreso actual sobre el objetivo, y puede reclamar la recompensa de moneda de cualquier misión ya completada.

**Why this priority**: Es el núcleo de la feature — sin esto, ninguna misión es visible ni reclamable.

**Independent Test**: Con progreso suficiente en una misión (mockeado), abrir el panel de Misiones, confirmar que se muestra como completada, reclamar su recompensa, y confirmar que la moneda aumenta exactamente en el monto de la recompensa.

**Acceptance Scenarios**:

1. **Given** el jugador abre el panel de Misiones desde el Hub, **When** la pantalla carga, **Then** ve una lista fija de misiones diarias, cada una con su descripción, progreso actual/objetivo, y recompensa de moneda.
2. **Given** una misión cuyo progreso alcanza o supera su objetivo, **When** el jugador la observa, **Then** ve un botón "Reclamar" habilitado en vez del progreso.
3. **Given** el jugador pulsa "Reclamar" en una misión completada, **When** se procesa, **Then** la moneda del jugador aumenta exactamente en la recompensa de esa misión, y la misión pasa a mostrarse como "Reclamada" (sin poder reclamarse de nuevo el mismo día).
4. **Given** una misión cuyo progreso todavía no alcanza su objetivo, **When** el jugador la observa, **Then** ve el progreso actual (p. ej. "3/10") sin ningún botón de reclamo habilitado.
5. **Given** al menos una misión completada y sin reclamar, **When** el jugador ve el Hub sin abrir el panel, **Then** el botón "Misiones" muestra un indicador (badge) con la cantidad de misiones reclamables.
6. **Given** ninguna misión completada sin reclamar, **When** el jugador ve el Hub, **Then** el botón "Misiones" no muestra ningún indicador.

---

### User Story 2 - Las misiones avanzan jugando, sin acción manual (Priority: P1)

Un jugador completa una etapa, despliega unidades, o derrota enemigos durante una batalla, y el progreso de las misiones correspondientes avanza automáticamente sin que tenga que hacer nada aparte de jugar.

**Why this priority**: Sin esto, el panel de la Historia 1 mostraría siempre progreso en cero — es el mecanismo que le da sentido de "logro pasivo mientras juegas".

**Independent Test**: Con las 3 misiones en progreso 0, completar una etapa con victoria y confirmar que la misión de "completar etapas" avanza en 1; desplegar unidades y confirmar que la misión de despliegue avanza; derrotar enemigos en batalla y confirmar que la misión de derrotas avanza.

**Acceptance Scenarios**:

1. **Given** una misión de "completar N etapas", **When** el jugador gana una batalla, **Then** su progreso avanza en 1.
2. **Given** una misión de "desplegar N unidades", **When** el jugador despliega una unidad en batalla (cualquier batalla), **Then** su progreso avanza en 1 por cada despliegue.
3. **Given** una misión de "derrotar N enemigos", **When** una unidad enemiga muere en batalla, **Then** su progreso avanza en 1 por cada enemigo derrotado.
4. **Given** una misión ya reclamada hoy, **When** el jugador sigue jugando y su condición se vuelve a cumplir, **Then** el progreso no se vuelve a contar para esa misión hasta el siguiente reinicio diario (no hay recompensa doble el mismo día).
5. **Given** el progreso de una misión ya alcanzó su objetivo pero el jugador sigue jugando sin reclamarla, **When** su condición se cumple de nuevo, **Then** el progreso mostrado no supera el objetivo (se limita visualmente, sin acumular de más).

---

### User Story 3 - Las misiones se reinician al cambiar de día (Priority: P2)

Un jugador que vuelve a abrir la aplicación en un día calendario distinto ve el progreso de todas las misiones reiniciado a cero y ninguna marcada como reclamada, sin importar el estado del día anterior.

**Why this priority**: Es lo que hace que las misiones sean "diarias" en vez de un logro de una sola vez — de menor prioridad que la mecánica base porque el jugador puede usar y valorar la Historia 1/2 dentro de un mismo día sin necesitar esto todavía.

**Independent Test**: Reclamar una misión, simular el avance del reloj del dispositivo a un día calendario distinto, reabrir la aplicación (o el panel), y confirmar que esa misión vuelve a mostrarse con progreso 0 y sin reclamar.

**Acceptance Scenarios**:

1. **Given** el jugador reclamó una o más misiones el día calendario actual, **When** el dispositivo cambia a un nuevo día calendario y el jugador abre la aplicación, **Then** todas las misiones muestran progreso 0 y ninguna aparece como reclamada.
2. **Given** el jugador tenía progreso parcial sin reclamar en una misión, **When** cambia el día calendario, **Then** ese progreso también se reinicia a 0 (no se traslada al día siguiente).
3. **Given** el jugador abre la aplicación varias veces dentro del mismo día calendario, **When** cada vez que la abre, **Then** el progreso y las misiones reclamadas se mantienen sin reiniciarse (el reinicio solo ocurre al cruzar la fecha, no por reabrir la app).

---

### Edge Cases

- El reloj del dispositivo retrocede a un día anterior (edge case de sistemas reales): se trata como "fecha distinta a la última registrada" y se reinicia igual — no se intenta detectar ni bloquear retrocesos de reloj (fuera de alcance, consistente con el resto del proyecto que no valida manipulación de reloj del dispositivo).
- El jugador despliega una unidad, pierde la batalla, y la unidad "muere" como parte de la derrota: el progreso de "desplegar N unidades" ya contado no se revierte (se cuenta el despliegue, no el resultado de la batalla).
- Dos o más misiones comparten la misma métrica subyacente (p. ej. si el catálogo llegara a tener 2 misiones de "derrotar enemigos" con objetivos distintos): cada una lleva su propio progreso independiente hacia su propio objetivo, no un contador compartido.
- El jugador cierra la aplicación a mitad de una batalla con progreso de despliegue/derrotas ya contado ese tick: el progreso ya registrado persiste (mismo patrón de escritura inmediata que el resto de `useMetaStore`, Constitución § V) — no se pierde por cerrar sin terminar la batalla.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE ofrecer, desde el Hub, un panel de Misiones con una lista fija de misiones diarias (completar etapas, desplegar unidades, derrotar enemigos), cada una con descripción, progreso actual/objetivo y recompensa de moneda.
- **FR-002**: El sistema DEBE registrar automáticamente el progreso de cada misión según su métrica: completar una etapa con victoria, desplegar una unidad en batalla, o que una unidad enemiga muera en batalla — sin ninguna acción manual del jugador más allá de jugar.
- **FR-003**: El sistema DEBE permitir reclamar la recompensa de moneda de cualquier misión cuyo progreso alcance o supere su objetivo, exactamente una vez por misión por día.
- **FR-004**: El progreso mostrado de una misión NUNCA DEBE superar visualmente su objetivo, incluso si la condición subyacente se cumple más veces de las necesarias.
- **FR-005**: El sistema DEBE mostrar, en el botón "Misiones" del Hub, un indicador con la cantidad de misiones completadas y sin reclamar — ausente cuando no hay ninguna.
- **FR-006**: El progreso y el estado de reclamo de todas las misiones DEBEN reiniciarse a su estado inicial (progreso 0, ninguna reclamada) la primera vez que el jugador interactúa con el sistema en un día calendario distinto al del último progreso registrado.
- **FR-007**: Todo el progreso y estado de reclamo DEBE persistir entre sesiones dentro del mismo día calendario (Constitución § V).

### Key Entities *(include if feature involves data)*

- **Misión** (dato estático, `src/data/`): id, descripción, métrica (`levelsCompleted` | `unitsDeployed` | `enemiesDefeated`), objetivo (cantidad), recompensa de moneda.
- **Progreso de misiones** (persistido): cantidad acumulada hoy por métrica, lista de ids de misión ya reclamados hoy, y la fecha calendario (`YYYY-MM-DD`) del último registro — usada para detectar el cambio de día (FR-006).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El panel de Misiones muestra las 3 misiones del catálogo con su progreso correcto en todo momento.
- **SC-002**: Completar la condición de una misión (jugando, sin acción manual adicional) la deja reclamable en el mismo panel, verificable en una sesión de prueba para cada una de las 3 misiones.
- **SC-003**: Reclamar una misión completada aumenta la moneda exactamente en su recompensa, una sola vez por día.
- **SC-004**: Tras simular un cambio de día calendario, las 3 misiones vuelven a progreso 0 y ninguna aparece reclamada.
- **SC-005**: `npx tsc -b` limpio y `npm test` en verde, sin regresión en ninguna suite existente.

## Assumptions

- **Catálogo inicial**: 3 misiones (completar 1 etapa, desplegar 10 unidades, derrotar 20 enemigos), valores de diseño provisionales no balanceados — mismo criterio que el resto del contenido del proyecto. Ampliar el catálogo es una tarea de datos, no de arquitectura.
- **Reinicio "diario" sin servidor**: se implementa comparando la fecha calendario local del dispositivo (`YYYY-MM-DD` derivado de `Date.now()`) contra la última fecha registrada — no existe un servidor que imponga una medianoche global única; esto es consistente con el resto del proyecto (100% local-first, Constitución § V) y con la limitación ya aceptada en `specs/032` para las ventanas de festival.
- **Meow Medals (manual §9.6)**: excluidos de esta spec — son logros de largo plazo que condicionan contenido oculto (Enigma Stages) que no existe en este proyecto; quedan como candidato futuro si se decide construir ese contenido.
- Esta spec no introduce ninguna pantalla base nueva — el panel de Misiones se integra al stack de paneles ya existente del Hub (`specs/026-navegacion-hub-mockup`), como un `PanelId` más.
- El progreso de "derrotar N enemigos" se detecta en la misma capa donde `BattleStage.tsx` ya detecta muertes de unidades para los efectos visuales de "death echo" (`specs/003`/`specs/021`) — reutiliza esa detección existente, no introduce un contador nuevo en `src/engine/` (Constitución § VI).
