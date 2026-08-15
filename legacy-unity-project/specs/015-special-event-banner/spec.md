# Feature Specification: Banner Especial de Eventos: "Etapas de Fantasía"

**Feature Branch**: `015-special-event-banner`

**Created**: 2026-07-31

**Status**: Draft

**Input**: User description: "Banner especial de eventos "Etapas de Fantasia" en "The Battler": un banner adicional en el mapa de aventuras, fuera del flujo de desbloqueo secuencial normal, que solo está activo en horarios programados. Durante su ventana activa incluye una fase especial temática (ej. un evento de "matanza de mastodontes") con su propia dificultad y recompensas. Definir en /speckit.clarify cómo se configuran los horarios (fijos en build vs. remotos) y qué pasa si el jugador entra justo cuando el evento termina."

**Relación con el proyecto existente**: Esta especificación **extiende** el mapa de aventuras (`004-adventure-map-banners`) con un tipo de banner adicional que no participa del desbloqueo secuencial (`ChapterBanner`/`AdventureMap` existentes), reutiliza el sistema de energía y dificultad (`006-mission-energy-system`) para el costo/dificultad de la fase especial, y reutiliza el sistema de recompensas/tesoros (`013-empire-of-cats-saga`, `014-chapter-scaling-treasure-sets`) para las recompensas del evento. No redefine "capítulo", "misión" ni "tesoro" desde cero — añade un nuevo tipo de contenido (evento programado) que coexiste con el mapa ya especificado.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver el banner de evento solo durante su ventana activa (Priority: P1)

Un jugador que entra al mapa de aventuras ve el banner "Etapas de Fantasía" únicamente cuando el evento está dentro de una de sus ventanas horarias programadas; fuera de esas ventanas, el banner no aparece como contenido jugable en el mapa.

**Why this priority**: Es la condición base del sistema — sin control de ventana horaria, no hay diferencia entre este banner y un capítulo normal, y el evento pierde su naturaleza de "programado".

**Independent Test**: Configurar una ventana horaria de prueba, comprobar que el banner es visible y seleccionable dentro de esa ventana, y que no lo es (o aparece claramente inactivo) fuera de ella, usando la hora del dispositivo.

**Acceptance Scenarios**:

1. **Given** la hora actual del dispositivo cae dentro de una ventana horaria programada del evento, **When** el jugador abre el mapa de aventuras, **Then** el banner "Etapas de Fantasía" aparece visible y seleccionable.
2. **Given** la hora actual del dispositivo está fuera de cualquier ventana horaria programada, **When** el jugador abre el mapa de aventuras, **Then** el banner aparece en estado inactivo (no seleccionable) o no se muestra, de forma consistente en cada apertura del mapa.
3. **Given** el jugador está viendo el mapa de aventuras con el banner de evento activo, **When** desplaza (scroll) el mapa, **Then** el banner de evento no interfiere con la navegación libre ya garantizada por `004-adventure-map-banners` para el resto de banners.

---

### User Story 2 - Jugar la fase especial temática dentro de la ventana activa (Priority: P1)

Un jugador selecciona el banner de evento durante su ventana activa y entra a la fase especial temática (ej. "matanza de mastodontes"), con su propia dificultad y recompensas, sin necesidad de haber desbloqueado ningún capítulo específico del flujo secuencial.

**Why this priority**: Es el valor jugable central del banner — conecta la visibilidad (Historia 1) con contenido de batalla real, independiente del progreso de capítulos.

**Independent Test**: Con el evento activo, seleccionar el banner y confirmar que el jugador entra a una batalla con la dificultad y el set de enemigos definidos para la fase especial, obteniendo las recompensas configuradas al completarla.

**Acceptance Scenarios**:

1. **Given** el banner de evento está activo y seleccionable, **When** el jugador lo selecciona, **Then** el juego lo lleva a la fase especial temática correspondiente, sin exigir que ningún otro capítulo esté desbloqueado o completado.
2. **Given** el jugador completa la fase especial con éxito, **When** vuelve al mapa, **Then** recibe las recompensas configuradas para ese evento (reutilizando el sistema de recompensas/tesoros existente).
3. **Given** el jugador no tiene energía suficiente para el costo configurado de la fase especial, **When** intenta entrar, **Then** el sistema aplica el mismo criterio de bloqueo sin penalización ya definido en `006-mission-energy-system`.

---

### User Story 3 - Una batalla en curso no se interrumpe cuando la ventana del evento cierra (Priority: P2)

Un jugador que ya entró a la fase especial mientras el evento estaba activo puede terminar esa batalla con normalidad aunque la ventana horaria expire mientras está jugando.

**Why this priority**: Resuelve el borde explícitamente señalado en el input de la feature ("qué pasa si el jugador entra justo cuando el evento termina"); sin esto, un jugador podría perder progreso de batalla por un corte de reloj a mitad de partida, lo cual es una mala experiencia y no está descrito en ningún otro sistema existente.

**Independent Test**: Entrar a la fase especial justo antes de que termine la ventana horaria, dejar que la ventana expire mientras la batalla está en curso, y confirmar que la batalla continúa hasta su resolución normal (victoria/derrota) sin ser abortada por el sistema.

**Acceptance Scenarios**:

1. **Given** el jugador entró a la fase especial mientras la ventana estaba activa, **When** la ventana horaria expira durante la batalla, **Then** la batalla en curso continúa sin interrupciones hasta que el jugador la termina (victoria o derrota).
2. **Given** el jugador terminó la fase especial justo después de que la ventana expiró, **When** vuelve al mapa de aventuras, **Then** recibe las recompensas ganadas con normalidad (el resultado ya obtenido no se invalida por la expiración de la ventana).
3. **Given** la ventana horaria ya expiró y el jugador no había entrado a la fase especial, **When** intenta seleccionar el banner, **Then** el sistema lo trata igual que cualquier banner inactivo (Historia 1) — no permite iniciar una nueva batalla.

---

### User Story 4 - El evento se repite en ventanas horarias futuras sin reconfiguración manual (Priority: P3)

El diseño del juego puede programar el mismo evento para reaparecer en múltiples ventanas horarias (por ejemplo, cada fin de semana) sin requerir una feature o código nuevo por cada aparición.

**Why this priority**: Da valor de contenido recurrente al sistema; no es indispensable para que el evento funcione una primera vez (Historias 1-3), pero evita que cada reaparición del evento requiera trabajo de desarrollo adicional.

**Independent Test**: Configurar más de una ventana horaria para el mismo evento y confirmar que el banner se activa/desactiva correctamente en cada una de ellas de forma independiente.

**Acceptance Scenarios**:

1. **Given** el evento tiene configuradas dos o más ventanas horarias no solapadas, **When** la hora del dispositivo entra en cualquiera de ellas, **Then** el banner se activa de la misma forma en cada ventana.
2. **Given** el jugador ya completó el evento en una ventana horaria anterior, **When** el evento vuelve a activarse en una ventana horaria posterior, **Then** el banner vuelve a ser seleccionable y el jugador puede volver a jugar la fase especial y recibir recompensas nuevamente (salvo que una recompensa específica se marque como "una sola vez por cuenta", lo cual queda fuera de alcance de esta feature).

---

### Edge Cases

- ¿Qué pasa si el reloj del dispositivo del jugador está mal configurado (adelantado, atrasado o en otra zona horaria)? El sistema evalúa la ventana horaria contra la hora local del dispositivo tal como la reporta el sistema operativo; no hay validación contra una fuente de hora externa en el alcance de esta feature (ver Asunciones).
- ¿Qué pasa si dos ventanas horarias configuradas se solapan? Se tratan como una sola ventana activa continua (el banner permanece activo mientras al menos una ventana lo cubra); no es un caso de error.
- ¿Qué pasa si el jugador entra justo cuando el evento termina? Ver Historia 3 — si ya inició la batalla dentro de la ventana activa, la termina con normalidad; si todavía no había entrado, el banner deja de ser seleccionable apenas la ventana cierra.
- ¿Qué pasa con el progreso de capítulos normales (`002-local-save-progress`, `004-adventure-map-banners`) mientras el evento está activo? No se ve afectado; el banner de evento es un elemento adicional del mapa, no reemplaza ni reordena los banners de capítulo existentes.
- ¿Qué pasa si no hay ninguna ventana horaria configurada (build sin datos de evento)? El banner no se muestra en el mapa; el mapa se comporta exactamente como en `004-adventure-map-banners` sin esta feature.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE definir una o más ventanas horarias programadas (fecha/hora de inicio y fin) para el evento "Etapas de Fantasía", embebidas en los datos del build (sin dependencia de un servicio remoto — ver Asunciones).
- **FR-002**: El sistema DEBE mostrar el banner de evento en el mapa de aventuras como seleccionable únicamente cuando la hora actual del dispositivo esté dentro de alguna de sus ventanas horarias programadas.
- **FR-003**: El sistema DEBE mostrar el banner de evento en estado inactivo (no seleccionable) cuando la hora actual esté fuera de todas sus ventanas horarias programadas, o DEBE ocultarlo, de forma consistente en cada apertura del mapa.
- **FR-004**: El banner de evento NO DEBE participar del flujo de desbloqueo secuencial de `004-adventure-map-banners`; su selección no depende de completar ningún capítulo previo, y completarlo no desbloquea ningún capítulo posterior.
- **FR-005**: Al seleccionar el banner de evento activo, el sistema DEBE llevar al jugador a una fase especial temática ("matanza de mastodontes") con su propio conjunto de enemigos y valor de dificultad, independiente del multiplicador de dificultad por capítulo de `013-empire-of-cats-saga`/`014-chapter-scaling-treasure-sets`.
- **FR-006**: La fase especial DEBE tener asignado un costo de energía propio, evaluado con el mismo `MissionEnergyPool` de `006-mission-energy-system` (bloqueo sin penalización si no hay energía suficiente).
- **FR-007**: Completar la fase especial con éxito DEBE otorgar las recompensas configuradas para el evento, reutilizando el mismo mecanismo de recompensa/tesoro de nivel ya definido en `013-empire-of-cats-saga`.
- **FR-008**: Una batalla de la fase especial iniciada mientras la ventana horaria estaba activa NO DEBE ser interrumpida ni abortada si la ventana expira mientras la batalla está en curso; el resultado (victoria/derrota) y sus recompensas se resuelven con normalidad.
- **FR-009**: El sistema DEBE soportar múltiples ventanas horarias programadas para el mismo evento, activando/desactivando el banner de forma independiente en cada una sin requerir cambios de código entre apariciones.
- **FR-010**: Si dos o más ventanas horarias configuradas se solapan en el tiempo, el sistema DEBE tratarlas como una única ventana activa continua para efectos de mostrar el banner.
- **FR-011**: El sistema DEBE evaluar las ventanas horarias contra la hora local reportada por el dispositivo del jugador, sin requerir conectividad de red.

### Key Entities *(include if feature involves data)*

- **EventBanner**: banner especial dentro del `AdventureMap` existente (`004-adventure-map-banners`), no sujeto a desbloqueo secuencial. Atributos: nombre visible ("Etapas de Fantasía"), lista de `EventTimeWindow`, referencia a la fase especial jugable (dificultad, enemigos, costo de energía), lista de recompensas asociadas.
- **EventTimeWindow**: ventana horaria programada (inicio, fin) embebida en los datos del build; una o varias por `EventBanner`. Determina cuándo el `EventBanner` es seleccionable.
- **SpecialStage**: fase especial temática vinculada a un `EventBanner` — reutiliza la estructura de nivel/dificultad ya existente (`Mission` de `006-mission-energy-system`, escalado de `013`/`014`), pero con dificultad y recompensas propias del evento, no ligadas a un capítulo de saga.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El banner de evento aparece como seleccionable el 100% de las veces que el jugador abre el mapa dentro de una ventana horaria programada, y como no seleccionable el 100% de las veces que lo abre fuera de todas las ventanas.
- **SC-002**: Un jugador con energía suficiente pasa del banner de evento activo a la fase especial en una sola selección, el 100% de las veces.
- **SC-003**: Ninguna batalla de la fase especial iniciada dentro de la ventana activa es interrumpida por la expiración de esa ventana; el 100% de las batallas iniciadas se resuelven hasta victoria o derrota.
- **SC-004**: Las recompensas configuradas del evento se entregan correctamente el 100% de las veces que se completa la fase especial con éxito, en cualquiera de las ventanas horarias programadas.
- **SC-005**: Configurar una ventana horaria adicional para el mismo evento no requiere cambios de código, solo datos, verificable agregando una segunda ventana de prueba y confirmando que el banner se activa en ella sin nueva implementación.

## Assumptions

- **Configuración de horarios — fijos en build, sin backend remoto**: siguiendo el Principio VI de la constitución (simplicidad desde el MVP) y que ningún otro sistema del proyecto depende de un servicio remoto o cuentas (`003-main-menu-config` excluye explícitamente login/backend), las ventanas horarias del evento se definen como datos embebidos en el build (ScriptableObject o equivalente), evaluadas contra el reloj local del dispositivo. Una fuente de horarios remota (para poder reprogramar el evento sin publicar una nueva build) queda fuera de alcance de esta feature y puede añadirse en una spec futura si se decide introducir backend.
- **Batalla en curso al expirar la ventana**: se resuelve dejando que la batalla ya iniciada continúe con normalidad hasta su resultado (Historia 3), en vez de abortarla o descontar la recompensa; es el comportamiento menos sorpresivo para el jugador y consistente con que ningún otro sistema del proyecto interrumpe una batalla en curso por una condición externa.
- **Recurrencia del evento**: el evento soporta múltiples ventanas horarias (no una única aparición), ya que el docx base describe "eventos especiales... programados por horario" en plural y el roadmap lo agrupa como banner de eventos general, no como evento de una sola vez.
- **Reloj del dispositivo como fuente de verdad**: no se valida ni corrige contra una hora de servidor; un jugador que altere manualmente el reloj de su dispositivo puede activar el evento fuera de su ventana "real". Se acepta este riesgo por ser un juego sin componente competitivo/backend en el alcance actual (mismo criterio de simplicidad que el resto del proyecto).
- **Recompensas repetibles por ventana**: por defecto, completar el evento en cada ventana horaria en la que reaparece otorga recompensas nuevamente (Historia 4); una recompensa exclusiva de "una sola vez por cuenta" no está cubierta por esta feature y se dejaría para una spec de recompensas más granular si se necesita.
- Esta feature no incluye la definición de contenido narrativo (diálogos) para la fase especial; según el Principio I de la constitución, cualquier batalla requiere contextualización narrativa, pero el guion específico del evento "matanza de mastodontes" se completa en `/speckit.plan` o en iteración de contenido posterior, no bloquea esta especificación de sistema.
- No se define aquí el mecanismo exacto de persistencia de "evento ya completado en esta ventana" — se persiste localmente siguiendo el mismo patrón de `002-local-save-progress`, y el detalle de formato se deja para `/speckit.plan`.
