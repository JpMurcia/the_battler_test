# Feature Specification: Motor de Combate Real

**Feature Branch**: `002-motor-de-combate`

**Created**: 2026-08-14

**Status**: Draft

**Input**: "Conectar el motor de combate real (colisión AABB 1D, resolución de combate, regeneración de energía, condición de victoria/derrota) al bucle de partida y al render de la batalla — reemplazando el sprite de prueba por unidades reales del roster del jugador. Ver specs/001-nucleo-del-juego/plan.md Fase 4."

**Nota de alcance**: Esta spec completa el bucle central (User Story 1) ya descrito conceptualmente en `specs/001-nucleo-del-juego/spec.md` — esa spec fundacional fijó el contrato (arquitectura de las 4 capas, reglas de colisión/combate) pero el bootstrap (`specs/001-nucleo-del-juego/tasks.md`) entregó solo el andamiaje ejecutable, con un sprite de prueba sin reglas de combate reales. Gacha/Mejora funcionales y contenido balanceado de niveles/gatos quedan fuera de esta spec (siguiente spec futura, ver `plan.md` Fase 4).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Jugar una batalla completa de principio a fin (Priority: P1)

Un jugador entra a un nivel, ve su energía acumularse con el tiempo, despliega gatos de su roster pagando esa energía, y observa que cada unidad avanza sola, combate automáticamente contra las unidades enemigas y bases que encuentra en su camino, hasta que la batalla termina en victoria o derrota.

**Why this priority**: Es el bucle jugable completo — sin esto el "juego" es solo una demo visual sin ninguna regla real. Es el único requisito verdaderamente bloqueante de todo lo demás en el proyecto.

**Independent Test**: Entrar a un nivel, esperar a que la energía alcance el costo de un gato del roster, desplegarlo, y confirmar que avanza solo, combate automáticamente al chocar con una unidad enemiga o con la base enemiga, y que la batalla resuelve a victoria o derrota sin ninguna otra acción del jugador sobre la unidad ya desplegada.

**Acceptance Scenarios**:

1. **Given** el jugador está en un nivel con energía en cero, **When** pasa el tiempo, **Then** la energía se acumula automáticamente hasta permitir desplegar el primer gato de su roster.
2. **Given** el jugador tiene energía suficiente, **When** despliega un gato de su roster, **Then** el gato aparece en la posición de la base del jugador, avanza solo hacia la base enemiga, y la energía se descuenta según el costo de ese gato.
3. **Given** un gato fue desplegado, **When** su cooldown individual no expiró, **Then** el jugador no puede volver a desplegar ese mismo gato hasta que termine.
4. **Given** un gato del jugador avanza y se superpone en el eje de avance con una unidad enemiga, **When** eso ocurre, **Then** ambos dejan de avanzar y combaten automáticamente (intercambio de daño a intervalos regulares) hasta que uno muere.
5. **Given** ninguna unidad enemiga bloquea el camino, **When** un gato del jugador llega a superponerse con la base enemiga, **Then** inflige daño directo a la base enemiga a intervalos regulares.
6. **Given** la base del jugador o la base enemiga llega a cero de salud, **When** eso ocurre, **Then** la batalla termina de inmediato mostrando victoria o derrota según qué base sigue en pie, y ninguna unidad sigue moviéndose ni combatiendo después de ese momento.
7. **Given** un nivel tiene una composición de enemigos definida, **When** la batalla progresa, **Then** las unidades enemigas de esa composición aparecen y avanzan hacia la base del jugador siguiendo las mismas reglas de movimiento y combate que las unidades del jugador.

---

### User Story 2 - Ver el resultado y que las recompensas queden guardadas (Priority: P2)

Un jugador que termina una batalla ve una pantalla de resultado que le confirma si ganó o perdió, y si ganó, comprueba que la moneda obtenida y el desbloqueo del siguiente nivel ya están disponibles al volver a la selección de niveles — sin recargar la página ni ninguna acción manual de "guardar".

**Why this priority**: Conecta el resultado de jugar (US1) con la progresión ya construida (`useMetaStore`, spec 001) — sin esto, ganar una batalla no tiene ninguna consecuencia visible ni persistente.

**Independent Test**: Ganar una batalla, confirmar que la pantalla de resultado muestra victoria y la recompensa de moneda del nivel, volver a la selección de niveles, y confirmar que la moneda aumentó y el siguiente nivel aparece desbloqueado.

**Acceptance Scenarios**:

1. **Given** la batalla resuelve en victoria, **When** la pantalla de resultado se muestra, **Then** indica victoria y la cantidad de moneda ganada.
2. **Given** la batalla resuelve en victoria, **When** eso ocurre, **Then** la moneda del nivel se suma de inmediato al progreso persistente y el siguiente nivel queda desbloqueado, sin acción manual del jugador.
3. **Given** la batalla resuelve en derrota, **When** la pantalla de resultado se muestra, **Then** indica derrota, sin otorgar moneda ni desbloquear ningún nivel.
4. **Given** el jugador está en la pantalla de resultado, **When** confirma, **Then** vuelve a la selección de niveles.

---

### User Story 3 - Salir de una batalla sin perder progreso guardado (Priority: P3)

Un jugador que abandona una batalla en curso (botón de salida o recarga de página) antes de que termine, vuelve al menú principal o recarga la aplicación y confirma que su progreso ya guardado (moneda, niveles desbloqueados, roster) no se vio afectado por la batalla abandonada.

**Why this priority**: Evita que una batalla incompleta corrompa el progreso persistente — importante para la confianza del jugador en el sistema de guardado, pero no bloquea jugar (US1) ni ver resultados (US2).

**Independent Test**: Entrar a una batalla, desplegar una unidad, salir antes de que termine, y confirmar que la moneda y los niveles desbloqueados quedaron exactamente como estaban antes de entrar a esa batalla.

**Acceptance Scenarios**:

1. **Given** una batalla está en curso, **When** el jugador usa el botón de salida, **Then** vuelve al menú principal y ningún cambio de esa batalla (moneda, desbloqueos) se persiste.
2. **Given** una batalla está en curso, **When** el jugador recarga la página, **Then** al volver a abrir la aplicación su progreso persistente refleja el estado de antes de entrar a esa batalla, sin ninguna unidad ni batalla en curso.

---

### Edge Cases

- ¿Qué pasa si dos unidades enemigas llegan a la misma posición casi simultáneamente frente a una unidad del jugador? La unidad del jugador combate contra la primera con la que se superpone; el resto queda bloqueado en fila detrás, sin superponerse entre sí mientras la de adelante sigue "ocupada".
- ¿Qué pasa si el jugador despliega una unidad sin energía suficiente? El sistema lo impide sin ningún efecto (sin descuento de energía, sin unidad nueva).
- ¿Qué pasa si el jugador no tiene ningún gato en su roster en su primera batalla? Nunca ocurre — el estado inicial por defecto de un jugador nuevo siempre incluye al menos un gato disponible para desplegar.
- ¿Qué pasa si ambas bases llegan a cero de salud en el mismo instante? Se resuelve como derrota (la base del jugador tiene prioridad de verificación) — evita ambigüedad sobre victorias simultáneas.
- ¿Qué pasa si el jugador cierra o recarga la página a mitad de una batalla? El estado de esa batalla se pierde por completo; el progreso ya guardado antes de entrar no se ve afectado (ver User Story 3).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE acumular energía automáticamente con el tiempo durante una batalla, a la tasa de regeneración configurada por el nivel.
- **FR-002**: El sistema DEBE permitir desplegar solo gatos que el jugador posee en su roster, sujeto al costo y cooldown individual de cada gato.
- **FR-003**: El sistema DEBE mover automáticamente cada unidad desplegada (del jugador o enemiga) hacia la base contraria, hasta que se superponga con una unidad enemiga o con la base contraria.
- **FR-004**: El sistema DEBE resolver el combate entre dos unidades superpuestas mediante intercambio de daño a intervalos regulares, hasta que una muere, y DEBE liberar a la unidad sobreviviente para seguir avanzando.
- **FR-005**: El sistema DEBE aplicar daño directo a una base cuando una unidad enemiga a esa base logra superponerse con ella, sin requerir ninguna otra unidad presente.
- **FR-006**: El sistema DEBE hacer aparecer unidades enemigas durante la batalla según la composición configurada del nivel, siguiendo las mismas reglas de movimiento y combate que las unidades del jugador.
- **FR-007**: El sistema DEBE terminar la batalla en victoria o derrota exactamente cuando la salud de la base enemiga o la base del jugador, respectivamente, llega a cero, y DEBE detener todo movimiento y combate de unidades en ese momento.
- **FR-008**: El sistema DEBE, al resolver una batalla en victoria, sumar de inmediato la recompensa de moneda del nivel y desbloquear el siguiente nivel al progreso persistente del jugador, sin acción manual.
- **FR-009**: El sistema NO DEBE otorgar moneda ni desbloquear ningún nivel cuando la batalla resuelve en derrota.
- **FR-010**: El sistema DEBE mostrar una pantalla de resultado que indique victoria o derrota al terminar la batalla, con navegación de vuelta a la selección de niveles.
- **FR-011**: El sistema DEBE garantizar que un jugador nuevo (sin datos previos) siempre tiene al menos un gato en su roster, disponible para desplegar desde su primera batalla.
- **FR-012**: El sistema NO DEBE persistir el estado de una batalla en curso — al salir o recargar antes de que termine, ese estado se descarta sin afectar el progreso ya guardado.
- **FR-013**: El sistema DEBE mantener actualizados en tiempo real los indicadores visibles de energía actual y salud de ambas bases durante la batalla, sin degradar la fluidez del resto de la interfaz.

### Key Entities *(include if feature involves data)*

- **BattleUnit**: instancia en tiempo real de un gato o enemigo desplegado en la batalla — posición, salud actual, estado (avanzando/combatiendo/muerto). Ya descrita en `specs/001-nucleo-del-juego/spec.md`.
- **EnemyWave**: composición de enemigos de un nivel — qué unidades enemigas aparecen y en qué momento de la batalla, usada para poblar el carril del lado enemigo.
- **Roster del jugador**: el subconjunto de gatos que el jugador posee (`useMetaStore.ownedCats`, ya existente) — determina qué gatos están disponibles para desplegar en una batalla, a diferencia del catálogo completo de gatos definidos como contenido.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un jugador puede completar una batalla de principio a fin (desplegar, ver combate automático, llegar a un resultado) sin instrucciones externas ni quedar bloqueado en ningún estado intermedio.
- **SC-002**: El 100% de las victorias reflejan la moneda ganada y el desbloqueo del siguiente nivel de inmediato al volver a la selección de niveles, sin recargar la página.
- **SC-003**: El bucle de combate corre de forma fluida y perceptible como fluida (sin tirones) con al menos 10 unidades activas simultáneas en pantalla.
- **SC-004**: El 100% de los jugadores nuevos pueden desplegar al menos un gato desde su primera batalla, sin ningún estado de "roster vacío".
- **SC-005**: El 100% de las batallas abandonadas o interrumpidas por recarga dejan el progreso persistente exactamente igual a como estaba antes de entrar a esa batalla.

## Assumptions

- La composición de enemigos por nivel (`EnemyWave`) es contenido configurable (vive en los mismos archivos de datos que gatos/niveles, ver `specs/001-nucleo-del-juego/spec.md` § Persistencia y Constitución § Balance Dirigido por Datos), no lógica hardcodeada — sus valores concretos para esta ronda son provisionales, no balanceados, igual que el resto del contenido de bootstrap.
- El gato inicial garantizado para un jugador nuevo (FR-011) es una decisión de contenido, no de esta spec — se resuelve como parte del trabajo de implementación tomando el primer gato del catálogo existente como default razonable.
- Las animaciones reales por gato (Constitución § Identidad Visual Animada) quedan fuera de esta spec — esta ronda usa representación visual mínima (no arte final) para validar las reglas de combate; una spec futura de contenido/arte cubre las animaciones antes de considerar cualquier gato "completo" según la Constitución.
- Gacha y Mejora funcionales, y el balance final de contenido, quedan fuera de esta spec — es trabajo de una spec futura según `plan.md` Fase 4.
- El MVP sigue cubriendo un único carril de combate por nivel, sin múltiples carriles simultáneos (heredado de `specs/001-nucleo-del-juego/spec.md`).
