# Feature Specification: Banner Especial de Eventos: "Etapas de Fantasía"

**Feature Branch**: `014-banner-evento-especial`

**Created**: 2026-08-15

**Status**: Draft

**Input**: Adaptación a battle-cats-web de `the_battler_test/specs/015-special-event-banner` (proyecto Unity origen): un banner adicional en la selección de niveles, fuera del flujo de desbloqueo secuencial normal, activo solo en ventanas horarias programadas embebidas en el contenido del build. Durante su ventana activa da acceso a una fase especial temática con su propia dificultad y recompensas.

**Relación con el proyecto existente**: Esta especificación **extiende** `specs/005-mapa-de-niveles` con un tipo de entrada adicional que no participa del desbloqueo secuencial, reutiliza `specs/007-energia-mision-dificultad` para el costo/energía de la fase especial, y reutiliza el mecanismo de recompensa de nivel de `specs/012-saga-imperio-de-los-gatos` (moneda, tesoro). No redefine "nivel" ni "energía de misión" — añade un tipo de contenido programado que coexiste con la lista de niveles ya especificada.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver el banner de evento solo durante su ventana activa (Priority: P1)

Un jugador que abre `LevelSelectScreen` ve el banner "Etapas de Fantasía" únicamente cuando la hora actual del dispositivo cae dentro de una de sus ventanas horarias programadas.

**Why this priority**: Condición base del sistema — sin control de ventana horaria no hay diferencia entre este banner y un nivel normal.

**Independent Test**: Configurar una ventana horaria de prueba; comprobar que el banner es seleccionable dentro de esa ventana y no lo es (o no aparece) fuera de ella, usando `Date.now()`.

**Acceptance Scenarios**:

1. **Given** la hora actual cae dentro de una ventana horaria programada del evento, **When** el jugador abre `LevelSelectScreen`, **Then** el banner "Etapas de Fantasía" aparece visible y seleccionable.
2. **Given** la hora actual está fuera de todas las ventanas programadas, **When** el jugador abre `LevelSelectScreen`, **Then** el banner aparece inactivo (no seleccionable) o no se muestra, de forma consistente en cada apertura.
3. **Given** el evento activo, **When** el jugador navega el resto de `LevelSelectScreen`, **Then** el banner no interfiere con el desbloqueo secuencial ya garantizado por `specs/005-mapa-de-niveles` para el resto de niveles.

---

### User Story 2 - Jugar la fase especial dentro de la ventana activa (Priority: P1)

Un jugador selecciona el banner de evento durante su ventana activa y entra a la fase especial, con su propia dificultad y recompensas, sin necesidad de haber desbloqueado ningún nivel del flujo secuencial.

**Why this priority**: Conecta la visibilidad (Historia 1) con contenido de batalla real, independiente del progreso de niveles.

**Independent Test**: Con el evento activo, seleccionar el banner y confirmar que el jugador entra a `BattleScreen` con la configuración de la fase especial, recibiendo las recompensas configuradas al completarla.

**Acceptance Scenarios**:

1. **Given** el banner activo y seleccionable, **When** el jugador lo selecciona, **Then** el juego llama `startLevel` con la fase especial, sin exigir que ningún otro nivel esté desbloqueado.
2. **Given** el jugador completa la fase especial con victoria, **When** vuelve a `LevelSelectScreen`, **Then** recibe las recompensas configuradas para el evento (moneda, tesoro), reutilizando `specs/012-saga-imperio-de-los-gatos`.
3. **Given** energía de misión insuficiente para el costo configurado, **When** el jugador intenta entrar, **Then** el sistema lo bloquea sin penalización, mismo criterio que `specs/007-energia-mision-dificultad`.

---

### User Story 3 - Una batalla en curso no se interrumpe cuando la ventana cierra (Priority: P2)

Un jugador que ya entró a la fase especial mientras el evento estaba activo puede terminar esa batalla con normalidad aunque la ventana horaria expire mientras juega.

**Why this priority**: Resuelve el borde explícito de "qué pasa si el jugador entra justo cuando el evento termina"; sin esto, un jugador podría perder progreso de batalla por un corte de reloj a mitad de partida.

**Independent Test**: Entrar a la fase especial justo antes de que expire la ventana, dejar que expire durante la batalla, y confirmar que continúa hasta su resolución normal.

**Acceptance Scenarios**:

1. **Given** el jugador entró mientras la ventana estaba activa, **When** la ventana expira durante la batalla, **Then** `useGameStore.tick`/`stepSimulation` siguen avanzando sin interrupción hasta victoria o derrota — la evaluación de ventana horaria ocurre solo al entrar, nunca dentro de `stepSimulation`.
2. **Given** el jugador terminó la fase especial justo después de que la ventana expiró, **When** vuelve a `LevelSelectScreen`, **Then** recibe las recompensas ganadas con normalidad.
3. **Given** la ventana ya expiró y el jugador no había entrado, **When** intenta seleccionar el banner, **Then** se trata igual que cualquier banner inactivo (Historia 1) — no inicia ninguna batalla nueva.

---

### User Story 4 - El evento se repite en ventanas futuras sin cambios de código (Priority: P3)

El mismo evento puede programarse para reaparecer en múltiples ventanas horarias (por ejemplo, cada fin de semana) sin requerir código nuevo por cada aparición.

**Why this priority**: Da valor de contenido recurrente; no es indispensable para que el evento funcione una primera vez (Historias 1-3).

**Independent Test**: Configurar más de una ventana horaria para el mismo evento y confirmar que el banner se activa/desactiva correctamente en cada una de forma independiente.

**Acceptance Scenarios**:

1. **Given** el evento tiene dos o más ventanas no solapadas, **When** la hora actual entra en cualquiera, **Then** el banner se activa igual en cada una.
2. **Given** el jugador ya completó el evento en una ventana anterior, **When** el evento vuelve a activarse en una ventana posterior, **Then** el banner vuelve a ser seleccionable y el jugador puede jugarlo y recibir recompensas de nuevo.

---

### Edge Cases

- Reloj del dispositivo mal configurado: el sistema evalúa contra `Date.now()` local, sin validación contra una fuente de hora externa (ver Assumptions).
- Dos ventanas configuradas se solapan: se tratan como una única ventana continua.
- Build sin ninguna ventana horaria configurada: el banner no se muestra; `LevelSelectScreen` se comporta exactamente como hoy.
- Progreso de niveles normales mientras el evento está activo: no se ve afectado — el banner es una entrada adicional, no reemplaza ni reordena los niveles ya existentes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE definir una o más ventanas horarias (inicio/fin en epoch milliseconds) para el evento "Etapas de Fantasía", embebidas en `src/data/` (sin servicio remoto).
- **FR-002**: `LevelSelectScreen` DEBE mostrar el banner de evento como seleccionable únicamente cuando `Date.now()` esté dentro de alguna de sus ventanas horarias.
- **FR-003**: `LevelSelectScreen` DEBE mostrar el banner inactivo o DEBE ocultarlo fuera de todas sus ventanas, de forma consistente en cada apertura.
- **FR-004**: El banner de evento NO DEBE participar del desbloqueo secuencial de `specs/005-mapa-de-niveles`; su selección no depende de `highestUnlockedLevelIndex`, y completarlo no lo modifica.
- **FR-005**: Al seleccionar el banner activo, el sistema DEBE llamar `useGameStore.startLevel` con la configuración de la fase especial (enemigos, dificultad propios), independiente del `SagaArc` activo de `specs/012`.
- **FR-006**: La fase especial DEBE tener un costo de energía de misión propio, evaluado con `useMetaStore.spendMissionEnergy` (bloqueo sin penalización si es insuficiente).
- **FR-007**: Completar la fase especial con victoria DEBE otorgar las recompensas configuradas del evento, reutilizando `useMetaStore.grantLevelRewards`/`addCurrency` de `specs/012`.
- **FR-008**: Una batalla de la fase especial iniciada dentro de la ventana activa NO DEBE ser interrumpida si la ventana expira mientras está en curso — la evaluación de ventana ocurre solo al entrar (`LevelSelectScreen`), nunca dentro de `stepSimulation`/`tick`.
- **FR-009**: El sistema DEBE soportar múltiples ventanas horarias para el mismo evento, activando/desactivando el banner en cada una sin cambios de código.
- **FR-010**: Si dos o más ventanas configuradas se solapan, el sistema DEBE tratarlas como una única ventana continua.
- **FR-011**: El sistema DEBE evaluar las ventanas horarias contra `Date.now()`, sin requerir conectividad de red.

### Key Entities *(include if feature involves data)*

- **`EventBanner`** (nuevo, `src/data/events.ts`): `id`, `name`, `timeWindows: EventTimeWindow[]`, `specialStage: Level` (reutiliza la forma de `Level` existente, `specs/001`), `energyCost`.
- **`EventTimeWindow`** (nuevo): `{ startMs: number; endMs: number }`, uno o varios por `EventBanner`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El banner aparece seleccionable el 100% de las veces que se abre `LevelSelectScreen` dentro de una ventana programada, y no seleccionable el 100% de las veces fuera de todas las ventanas.
- **SC-002**: Con energía suficiente, el jugador pasa del banner activo a la fase especial en una sola selección, el 100% de las veces.
- **SC-003**: Ninguna batalla de la fase especial iniciada dentro de la ventana activa es interrumpida por la expiración de esa ventana — el 100% se resuelve hasta victoria o derrota.
- **SC-004**: Las recompensas del evento se entregan correctamente el 100% de las veces que se completa con éxito, en cualquiera de sus ventanas.
- **SC-005**: Configurar una ventana horaria adicional no requiere cambios de código, solo datos.
- **SC-006**: `npx tsc -b` limpio y `npm test` en verde.

## Assumptions

- **Horarios fijos en datos, sin backend remoto**: siguiendo Constitución § V/VII, las ventanas se definen como datos embebidos en `src/data/events.ts`, evaluadas contra `Date.now()` local. Una fuente de horarios remota queda fuera de alcance.
- **Batalla en curso al expirar la ventana**: continúa con normalidad hasta su resultado (Historia 3), nunca se aborta ni descuenta la recompensa.
- **Reloj del dispositivo como fuente de verdad**: no se valida contra un servidor; se acepta ese riesgo, coherente con que el proyecto no tiene backend (Constitución § V).
- **Recompensas repetibles por ventana**: completar el evento en cada ventana en la que reaparece otorga recompensas de nuevo (Historia 4); una recompensa de "una sola vez por cuenta" queda fuera de esta spec.
- No se requiere ninguna pantalla nueva más allá de una entrada adicional dentro de `LevelSelectScreen` — el banner reutiliza el mismo patrón de tarjeta/botón "Jugar" ya usado por los niveles regulares.
