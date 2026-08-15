# Feature Specification: Arcos de Saga y Gatorreta en la Versión Web

**Feature Branch**: `026-saga-arcs-gatorreta`

**Created**: 2026-08-14

**Status**: Draft

**Input**: User description: "Spec out 026 for saga arcs and Gatorreta" — ampliación de `024-react-web-migration` para cubrir dos sistemas ya construidos en la versión Unity (`013-empire-of-cats-saga`) que `BattleStateManager.cs` reveló como fuera del alcance original de `024` (ver `specs/024-react-web-migration/tasks.md` T033 y `data-model.md` § Nota de alcance)."

**Relación con el proyecto existente**: Esta spec **extiende** `024-react-web-migration` (y da por asumido, sin repetirlo, todo lo ya cubierto por `025-treasure-sets-battle-items`) sin redefinir ninguna de sus capacidades: reutiliza el bucle de combate y `battleSession` (`024` FR-002/003/004), la progresión de capítulos y su guardado (`024` FR-006/012), y el recurso de despliegue en batalla ya especificado (`024` FR-002, `battleResource`). No vuelve a definir "capítulo", "batalla" ni "recurso de despliegue" desde cero — solo añade la capa de "arco de saga" que agrupa capítulos existentes, y el arma especial de la base del jugador que la constitución del proyecto Unity (Principio II) ya menciona como parte del núcleo de combate pero que `024` no había cubierto.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Jugar un capítulo con la dificultad de su arco de saga (Priority: P1)

Un jugador entra a una batalla que pertenece a un arco de saga (una agrupación de capítulos existentes, p. ej. "Imperio de los Gatos") y percibe que el costo de desplegar unidades y la fuerza de los enemigos son proporcionalmente mayores o menores que en un arco distinto — el mismo capítulo jugado dentro de dos arcos distintos se siente en una dificultad diferente, sin que el contenido base del capítulo (enemigos, oleadas, diálogo) cambie.

**Why this priority**: Es la razón de ser de un arco de saga — sin el escalado aplicado en batalla, "arco" sería solo una etiqueta decorativa sobre capítulos que de otro modo se juegan exactamente igual.

**Independent Test**: Configurar el mismo capítulo perteneciente primero a un arco con multiplicadores 100% y luego a otro con multiplicadores más altos; confirmar que el costo de desplegar una unidad y la fuerza (salud/daño) de los enemigos son proporcionalmente mayores en el segundo, sin alterar los valores base almacenados en el capítulo.

**Acceptance Scenarios**:

1. **Given** un capítulo pertenece a un arco con multiplicador de costo de unidades y de fuerza enemiga en 100%, **When** el jugador entra a la batalla, **Then** los costos y la fuerza enemiga corresponden exactamente a los valores base del capítulo.
2. **Given** el mismo capítulo pertenece a un arco con multiplicadores más altos (p. ej. ×3), **When** el jugador entra a la batalla, **Then** el costo de desplegar unidades y la fuerza (salud/daño) de los enemigos son proporcionalmente mayores, en la misma proporción que el multiplicador del arco.
3. **Given** un capítulo no pertenece a ningún arco de saga, **When** el jugador entra a la batalla, **Then** se comporta exactamente igual que hoy en `024` (multiplicadores 100%, sin cambio de comportamiento).

---

### User Story 2 - Completar todos los capítulos de un arco otorga sus recompensas de finalización (Priority: P2)

Un jugador que completa el último capítulo pendiente de un arco de saga recibe, en ese mismo momento, las recompensas de finalización configuradas para ese arco (unidades nuevas desbloqueadas y/o funciones nuevas habilitadas) — una única vez, sin importar cuántas veces rejuegue capítulos de ese arco después.

**Why this priority**: Es el cierre narrativo/de progresión del arco — sin esto, terminar todos los capítulos de un arco no se distingue de terminar cualquier capítulo suelto.

**Independent Test**: Completar todos los capítulos de un arco salvo el último, ganar ese último, y confirmar que las recompensas de finalización del arco se otorgan exactamente en esa victoria y nunca más en victorias posteriores de capítulos del mismo arco.

**Acceptance Scenarios**:

1. **Given** un jugador tiene todos los capítulos de un arco completados salvo uno, **When** gana la batalla de ese capítulo restante, **Then** el arco queda completo y sus recompensas de finalización (unidades desbloqueadas, funciones habilitadas) se otorgan de inmediato.
2. **Given** un arco ya otorgó sus recompensas de finalización, **When** el jugador rejuega y vuelve a ganar cualquier capítulo de ese arco, **Then** las recompensas de finalización no se vuelven a otorgar.
3. **Given** un arco tiene un capítulo de jefe final designado, **When** se evalúa si el arco está completo, **Then** ese capítulo de jefe cuenta como cualquier otro capítulo del arco — no hay una condición de finalización distinta para él.

---

### User Story 3 - Activar el arma especial de área de la base ("Gatorreta") (Priority: P2)

Durante una batalla, un arma especial de área en la base del jugador se va cargando con el tiempo. Cuando termina de cargar, el jugador ve que está disponible y puede activarla manualmente para infligir daño de área a todos los enemigos dentro de su rango en ese instante, tras lo cual el arma vuelve a recargarse desde cero.

**Why this priority**: Es un mecanismo de combate opcional (no todo capítulo lo tiene configurado) que le da al jugador una herramienta activa adicional dentro del bucle, por lo demás, de despliegue automático — valioso pero no bloqueante para que una batalla sea jugable.

**Independent Test**: Iniciar una batalla con el arma configurada, esperar a que termine su tiempo de recarga, activarla manualmente con enemigos dentro y fuera de rango, y confirmar que solo los enemigos dentro de rango reciben el daño de área y que el arma vuelve a "recargando".

**Acceptance Scenarios**:

1. **Given** una batalla en curso con el arma en recarga, **When** el tiempo de recarga configurado transcurre, **Then** el arma queda disponible para activación manual y el jugador lo percibe (indicador visual).
2. **Given** el arma disponible con varios enemigos dentro de su rango de área y al menos uno fuera de rango, **When** el jugador la activa manualmente, **Then** solo los enemigos dentro de rango reciben el daño de área configurado, y el arma vuelve a iniciar su recarga desde cero.
3. **Given** el arma todavía en recarga, **When** el jugador intenta activarla, **Then** la activación no tiene efecto y el temporizador de recarga no se reinicia.
4. **Given** el jugador reintenta la batalla tras una derrota, **When** el reintento comienza, **Then** el arma arranca de nuevo en estado "recargando" (no conserva la carga acumulada del intento anterior).

---

### User Story 4 - Mejorar la regeneración del recurso de despliegue durante la batalla (Priority: P3)

Un jugador con suficiente recurso de despliegue acumulado en una batalla en curso decide gastar parte de él para aumentar permanentemente (por el resto de esa batalla) la velocidad a la que ese recurso se regenera — una decisión táctica de "invertir para crecer más rápido" en vez de desplegar de inmediato.

**Why this priority**: Es una decisión táctica opcional dentro del bucle de combate ya cubierto por `024` — añade profundidad, pero ninguna de las historias anteriores depende de ella.

**Independent Test**: Con recurso suficiente acumulado, mejorar la tasa de regeneración, confirmar que el recurso se descuenta y la tasa aumenta de inmediato; con recurso insuficiente, confirmar que el intento no tiene efecto.

**Acceptance Scenarios**:

1. **Given** el jugador tiene recurso acumulado suficiente para el costo de la mejora, **When** la activa, **Then** el recurso se descuenta por completo y la tasa de regeneración aumenta de inmediato para el resto de la batalla.
2. **Given** el jugador no tiene recurso suficiente, **When** intenta activar la mejora, **Then** el intento no tiene efecto — ni se descuenta recurso ni cambia la tasa.
3. **Given** el jugador ya mejoró la tasa de regeneración durante una batalla, **When** reintenta esa batalla tras una derrota, **Then** la mejora no se conserva — la tasa de regeneración vuelve a su valor base de diseño (más cualquier bonificación permanente de sets de tesoros ya otorgada, ver `025`).

---

### Edge Cases

- ¿Qué pasa si un capítulo pertenece a más de un arco de saga a la vez? Fuera de alcance — un capítulo pertenece a lo sumo a un arco (ver Assumptions).
- ¿Qué pasa si el arma especial de área no está configurada para una batalla determinada? No aparece ningún indicador ni control para ella — comportamiento nulo-seguro, la batalla es jugable exactamente igual que sin el sistema (mismo criterio que otros paneles opcionales ya documentado en `023`/`024`).
- ¿Qué pasa si el jugador mejora la regeneración y luego también completa un set de tesoros en la misma batalla (integración con `025`)? Ambos efectos se acumulan sobre la tasa de regeneración; solo la mejora manual (no la bonificación de sets) se pierde en un reintento.
- ¿Qué pasa si las recompensas de finalización de un arco incluyen una función que el sistema no sabe interpretar (p. ej. un sistema de juego que no existe todavía)? Se persiste como una bandera de desbloqueo opaca — esta spec no define qué hace esa función, solo que la bandera queda registrada y disponible para que una spec futura la consuma (mismo criterio que ya asumía `013-empire-of-cats-saga` en Unity).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE permitir agrupar capítulos ya existentes (ver `024` Key Entities) en un arco de saga, cada uno con un multiplicador de costo de despliegue de unidades y un multiplicador de fuerza enemiga propios.
- **FR-002**: El sistema DEBE aplicar el multiplicador de costo de unidades del arco activo al costo de despliegue de cada unidad, y el multiplicador de fuerza enemiga a la salud/daño de los enemigos y de la base enemiga, sin alterar los valores base almacenados en la definición del capítulo.
- **FR-003**: Un capítulo que no pertenece a ningún arco DEBE comportarse exactamente como hoy en `024` (multiplicadores neutros).
- **FR-004**: El sistema DEBE permitir designar, opcionalmente, uno de los capítulos de un arco como su capítulo de jefe final, sin que eso cambie cómo se evalúa la finalización del arco.
- **FR-005**: El sistema DEBE considerar un arco completo cuando todos sus capítulos están marcados como superados en el guardado del jugador, y DEBE derivar este estado del progreso de capítulos ya guardado (`024` FR-012) en vez de mantener un indicador de "arco completo" propio.
- **FR-006**: El sistema DEBE otorgar las recompensas de finalización de un arco (unidades a desbloquear, funciones a habilitar) exactamente una vez, en el momento en que el arco queda completo por primera vez, y DEBE recordar permanentemente que ya se otorgaron para no volver a otorgarlas.
- **FR-007**: El sistema DEBE proveer, de forma opcional por batalla, un arma especial de área en la base del jugador que se recarga automáticamente con el tiempo.
- **FR-008**: Los jugadores DEBEN poder activar manualmente el arma especial únicamente cuando terminó de recargarse, aplicando daño de área a todos los enemigos dentro de su rango en el momento de la activación.
- **FR-009**: Tras activarse, el arma especial DEBE reiniciar su temporizador de recarga desde cero; mientras recarga, los intentos de activación NO DEBEN tener efecto ni reiniciar el temporizador.
- **FR-010**: Al reintentar una batalla tras una derrota, el arma especial DEBE reiniciarse al estado "recargando" (no conservar la carga acumulada del intento anterior).
- **FR-011**: El sistema DEBE permitir al jugador gastar recurso de despliegue acumulado durante una batalla para aumentar la tasa de regeneración de ese recurso por el resto de esa batalla, rechazando la operación sin efecto alguno si el recurso acumulado es insuficiente para el costo.
- **FR-012**: Al reintentar una batalla tras una derrota, cualquier mejora de tasa de regeneración comprada durante el intento anterior NO DEBE conservarse — la tasa vuelve a su línea base de diseño (más cualquier bonificación permanente ya otorgada por sets de tesoros, ver `025`).

### Key Entities *(include if feature involves data)*

- **SagaArc**: agrupación nombrada y ordenada de capítulos ya existentes, con sus propios multiplicadores de costo de unidades y de fuerza enemiga, un capítulo de jefe final opcional, y una lista de recompensas de finalización (unidades + funciones a habilitar).
- **SagaArcProgress**: si las recompensas de finalización de un arco ya fueron otorgadas — la finalización en sí (todos los capítulos superados) nunca se guarda como tal, siempre se deriva del progreso de capítulos ya existente.
- **SpecialAreaWeapon (Gatorreta)**: arma opcional de la base del jugador — duración de recarga, rango de área, daño de área, y su estado actual (recargando/disponible).
- **RegenUpgrade**: la acción táctica (no una entidad persistida) de gastar recurso de despliegue acumulado para aumentar su tasa de regeneración por el resto de la batalla en curso.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El mismo capítulo jugado dentro de dos arcos con multiplicadores distintos produce un costo de despliegue y una fuerza enemiga proporcionalmente distintos, en el 100% de las entradas a batalla.
- **SC-002**: Las recompensas de finalización de un arco se otorgan exactamente una vez por arco y por jugador, nunca más ni nunca menos, verificable rejugando capítulos del arco después de completado.
- **SC-003**: El arma especial de área puede activarse manualmente en cuanto termina su recarga y aplica daño a todos los enemigos dentro de rango en el 100% de las activaciones válidas, sin ningún efecto en el 100% de los intentos mientras recarga.
- **SC-004**: Ninguna mejora de regeneración comprada durante una batalla sobrevive a un reintento de esa misma batalla, verificable en el 100% de los reintentos tras derrota.

## Assumptions

- Esta spec asume que `024-react-web-migration` (en particular `battleSession`, `battleResource`, y el guardado de progreso de capítulos) y `025-treasure-sets-battle-items` ya están implementadas o en implementación — los sistemas de esta spec se integran ahí, no los reemplazan.
- Un capítulo pertenece a lo sumo a un arco de saga a la vez; el caso de pertenecer a varios arcos simultáneamente está fuera de alcance (no existe en el contenido actual de Unity).
- Las "funciones a habilitar" de una recompensa de finalización de arco se persisten como banderas de desbloqueo opacas — esta spec no diseña la mecánica interna de los sistemas que esas banderas puedan activar en el futuro (mismo criterio ya asumido por `013-empire-of-cats-saga` en Unity); cualquier sistema nombrado como recompensa que no sea "unidad desbloqueada" requeriría su propia spec futura antes de implementarse.
- El arma especial de área y la mejora de regeneración son mecánicas ya validadas en la versión Unity (`013-empire-of-cats-saga`) — esta spec no cambia su balance (recarga, rango, daño, costo de mejora), solo lo migra.
- Fuera de alcance de esta spec (queda para una spec futura si se decide ampliarla): el registro de enemigos encontrados (`encounteredEnemyIds`), el único sistema restante que `specs/024-react-web-migration/tasks.md` T033 había identificado y que ni `025` ni esta spec cubren todavía.
