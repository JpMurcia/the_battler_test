# Feature Specification: Escalado Avanzado por Capítulo y Sets de Tesoros

**Feature Branch**: `014-chapter-scaling-treasure-sets`

**Created**: 2026-07-30

**Status**: Draft

**Input**: User description: "Extender la saga 'Imperio de los Gatos' (spec 013) con capacidades identificadas al comparar el spec.md del proyecto contra la wiki oficial de The Battle Cats vía NotebookLM: escalado de vida de la base enemiga por capítulo, costo de energía de misión escalado por capítulo, ancho de nivel como dato de configuración, y agrupación de tesoros en sets con bonificación pasiva de cuenta al completarlos."

**Relación con el proyecto existente**: Esta especificación **extiende** la spec 013 ("Imperio de los Gatos") sin redefinir ninguna de sus capacidades: reutiliza el Capítulo de Saga y su multiplicador de fuerza enemiga (FR-001/FR-003 de spec 013), la definición de nivel existente (`ChapterDefinition`), el `MissionEnergyController` (spec 006) para el costo de energía por misión, y la Recompensa de Nivel con su tesoro individual (FR-008 de spec 013). No vuelve a definir "capítulo", "nivel", "energía" ni "tesoro" desde cero — solo añade los parámetros y agrupaciones que la comparación contra el juego original detectó como ausentes: la base enemiga (no solo sus unidades) también escala vida por capítulo, la energía por nivel también escala por capítulo, cada nivel expone un ancho configurable, y los tesoros individuales se agrupan opcionalmente en sets que otorgan una bonificación pasiva permanente al completarse.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - La vida de la base enemiga también escala por capítulo (Priority: P1)

Un jugador se enfrenta al mismo nivel ("Corea") en distintos capítulos de la saga. La base enemiga no solo tiene enemigos más fuertes según el capítulo (ya cubierto por spec 013): su propia vida máxima también es mayor cuanto más avanzado es el capítulo, obligando a una estrategia de daño sostenido distinta en cada uno.

**Why this priority**: Sin esto, la "dificultad por capítulo" de spec 013 queda incompleta: un jugador podría destruir la base enemiga del Capítulo 3 con la misma facilidad que en el Capítulo 1 simplemente ignorando a los enemigos, porque el único elemento que escalaba eran las unidades enemigas, no el objetivo de victoria en sí.

**Independent Test**: Configurar el mismo nivel dentro de un capítulo con multiplicador de fuerza enemiga 100% y de nuevo dentro de un capítulo con multiplicador 400%; verificar que la vida máxima de la base enemiga al iniciar la batalla es proporcional al multiplicador del capítulo activo, sin cambiar el valor base de vida de base almacenado en la definición del nivel.

**Acceptance Scenarios**:

1. **Given** un nivel con vida de base enemiga configurada en 500 y perteneciente a un capítulo con multiplicador de fuerza enemiga 100%, **When** la batalla inicia, **Then** la vida máxima de la base enemiga en batalla es 500.
2. **Given** el mismo nivel perteneciente a un capítulo con multiplicador de fuerza enemiga 300% (ej. "×3"), **When** la batalla inicia, **Then** la vida máxima de la base enemiga en batalla es proporcional a ese multiplicador (1500), sin alterar el valor base de 500 almacenado en la definición del nivel.
3. **Given** el mismo nivel jugado en dos capítulos distintos, **When** se comparan ambas partidas, **Then** el daño necesario para destruir la base enemiga es mayor en el capítulo con multiplicador más alto, en proporción exacta al multiplicador configurado.

---

### User Story 2 - El costo de energía de un nivel también escala por capítulo (Priority: P2)

Un jugador que ya superó "Corea" en el Capítulo 1 decide rejugarlo en el Capítulo 2 (versión más difícil del mismo nivel). Acceder a esa versión del nivel cuesta más energía que la versión del Capítulo 1, reflejando que es un desafío mayor.

**Why this priority**: Es una extensión directa del sistema de energía ya existente (spec 006); no bloquea ninguna mecánica de combate, pero sin ella el costo de energía es un valor plano que ignora la dificultad real del capítulo activo, inconsistente con el resto del escalado por capítulo ya especificado.

**Independent Test**: Configurar el mismo nivel con un costo de energía distinto por capítulo; iniciar ese nivel desde cada capítulo y verificar que el costo de energía descontado al jugador corresponde al capítulo desde el que se accedió, no un valor único fijo por nivel.

**Acceptance Scenarios**:

1. **Given** un nivel con costo de energía de 5 en el Capítulo 1 y 15 en el Capítulo 2, **When** el jugador inicia ese nivel desde el Capítulo 1, **Then** se descuentan 5 de energía.
2. **Given** el mismo nivel, **When** el jugador lo inicia desde el Capítulo 2, **Then** se descuentan 15 de energía en vez de 5.
3. **Given** energía insuficiente para el costo del capítulo activo, **When** el jugador intenta iniciar el nivel, **Then** el sistema rechaza el inicio de batalla exactamente igual que el comportamiento ya definido en spec 006 para energía insuficiente.

---

### User Story 3 - Ancho de nivel configurable (Priority: P3)

Un diseñador de niveles configura "Corea" con un ancho de campo de batalla distinto al de "Mongolia", de modo que el tiempo que tardan las unidades en cruzar el campo y el alcance efectivo de los ataques a distancia varían nivel a nivel según ese ancho.

**Why this priority**: Es un dato de configuración puro (no una mecánica de runtime nueva) que ya es consumido implícitamente por el movimiento de unidades y el rango de ataque a distancia; formalizarlo como campo explícito de la definición de nivel es de menor impacto que el escalado de dificultad (historias 1-2), pero necesario para que el contenido de niveles futuros pueda diferenciarse en ritmo de combate.

**Independent Test**: Configurar dos niveles con anchos distintos y el mismo par unidad/enemigo; verificar que el tiempo que tarda una unidad en llegar de una base a la otra, y el punto en el que un atacante a distancia entra en rango del objetivo, difieren entre ambos niveles en proporción al ancho configurado.

**Acceptance Scenarios**:

1. **Given** un nivel con ancho configurado en 3600 unidades, **When** una unidad se despliega en la base del jugador, **Then** la distancia que debe recorrer hasta la base enemiga corresponde a ese ancho.
2. **Given** dos niveles con anchos distintos (ej. 3600 y 5000) y la misma unidad con la misma velocidad de movimiento, **When** se despliega en ambos niveles, **Then** el tiempo de recorrido hasta la base enemiga es mayor en el nivel de mayor ancho, en proporción a la diferencia de ancho.
3. **Given** un nivel sin ancho configurado explícitamente, **When** el nivel se carga, **Then** el sistema usa un ancho por defecto documentado, sin fallar ni dejar el campo de batalla sin dimensión definida.

---

### User Story 4 - Sets de tesoros con bonificación pasiva de cuenta (Priority: P4)

Un jugador ha ganado por primera vez todos los niveles que pertenecen al set de tesoros "Bebida Energética" (por ejemplo, los tesoros de "Corea" y "Mongolia"). Al obtener el último tesoro pendiente de ese set, la cuenta del jugador recibe automáticamente una bonificación pasiva permanente (por ejemplo, +regeneración de dinero en batalla), visible y activa en todas las partidas futuras sin que el jugador tenga que hacer nada adicional.

**Why this priority**: Depende de que ya existan tesoros individuales por nivel (spec 013, historia 4); es la capacidad de menor prioridad porque agrega una capa de meta-progresión sobre un sistema que ya funciona de forma independiente sin ella.

**Independent Test**: Configurar un set de prueba con 2 tesoros de 2 niveles distintos y una bonificación pasiva asociada; ganar ambos niveles por primera vez en cualquier orden y verificar que la bonificación pasiva se otorga exactamente al completarse el segundo tesoro del set, permaneciendo activa en batallas posteriores.

**Acceptance Scenarios**:

1. **Given** un set de tesoros con 2 tesoros configurados y el jugador ya tiene 1 de los 2, **When** el jugador gana el nivel que otorga el tesoro restante del set por primera vez, **Then** la bonificación pasiva del set se otorga inmediatamente a la cuenta del jugador.
2. **Given** la bonificación pasiva de un set ya otorgada, **When** el jugador inicia cualquier batalla posterior, **Then** el efecto de la bonificación está activo desde el inicio de esa batalla sin acción adicional del jugador.
3. **Given** un set de tesoros con tesoros aún pendientes, **When** el jugador consulta su progreso de colección, **Then** el set aparece como incompleto y su bonificación pasiva aparece como no obtenida todavía.
4. **Given** un tesoro que no pertenece a ningún set configurado, **When** el jugador lo obtiene, **Then** se comporta exactamente igual que hoy (spec 013, historia 4): se añade a la colección sin disparar ninguna bonificación pasiva.

---

### Edge Cases

- ¿Qué ocurre si un nivel no tiene un valor de vida de base enemiga base configurado? El sistema debe usar el mismo valor por defecto que ya aplica hoy sin esta especificación (comportamiento inalterado si no se configura el campo nuevo).
- ¿Qué ocurre si el multiplicador de fuerza enemiga produce una vida de base con decimales (p. ej. 500 × 1.5)? Debe redondearse con la misma regla de redondeo ya definida en spec 013 (Assumptions) para mantener consistencia entre vida de unidades enemigas y vida de base enemiga.
- ¿Qué ocurre si un nivel no tiene un costo de energía configurado para el capítulo activo (p. ej. se añadió un capítulo nuevo sin actualizar la tabla de costos)? El sistema debe usar el costo de energía base del nivel (el ya definido por spec 006) como valor por defecto, sin bloquear el acceso al nivel.
- ¿Qué ocurre si dos niveles del mismo set de tesoros se ganan simultáneamente (p. ej. en pruebas automatizadas)? La bonificación pasiva del set debe otorgarse exactamente una vez, nunca duplicarse, sin importar el orden o simultaneidad de las victorias.
- ¿Qué ocurre si un set de tesoros se reconfigura para incluir un tesoro adicional después de que el jugador ya había completado la versión anterior del set? El set pasa a estar incompleto hasta obtener el tesoro añadido; la bonificación pasiva ya otorgada anteriormente no se retira (evita penalizar retroactivamente al jugador por cambios de contenido).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE aplicar el multiplicador de fuerza enemiga del capítulo activo (ya definido en spec 013, FR-001) a la vida máxima de la base enemiga de un nivel de ese capítulo, sin modificar el valor base de vida de base almacenado en la definición del nivel.
- **FR-002**: El sistema DEBE permitir configurar, por nivel y por capítulo en el que ese nivel es accesible, un costo de energía específico, y DEBE descontar el costo correspondiente al capítulo desde el que el jugador accede al nivel al iniciar la batalla (reutilizando la validación de energía insuficiente ya definida en spec 006).
- **FR-003**: Si un nivel no tiene un costo de energía configurado para el capítulo activo, el sistema DEBE usar el costo de energía base del nivel ya definido por spec 006 como valor por defecto.
- **FR-004**: El sistema DEBE permitir configurar, por nivel, un ancho de nivel (distancia entre la base del jugador y la base enemiga) que el movimiento de unidades y el cálculo de rango de ataque a distancia existentes DEBEN consultar en vez de asumir una distancia fija.
- **FR-005**: Si un nivel no tiene un ancho de nivel configurado explícitamente, el sistema DEBE usar un ancho por defecto documentado, sin fallar la carga del nivel.
- **FR-006**: El sistema DEBE permitir agrupar tesoros de nivel existentes (spec 013, FR-008) en sets nombrados, donde cada set referencia una lista de tesoros que lo componen.
- **FR-007**: El sistema DEBE otorgar una bonificación pasiva de cuenta asociada a un set de tesoros exactamente una vez, en el momento en que el jugador obtiene el último tesoro pendiente de ese set, y DEBE mantener esa bonificación activa de forma permanente en todas las batallas posteriores.
- **FR-008**: El sistema DEBE ser capaz de determinar, sobreviviendo reinicios de la aplicación, qué sets de tesoros están completos y qué bonificaciones pasivas de set ya fueron otorgadas, reutilizando el guardado de progreso existente (spec 002).
- **FR-009**: Un tesoro que no pertenece a ningún set configurado DEBE comportarse exactamente igual que hoy (spec 013, FR-008/historia 4), sin disparar ninguna bonificación pasiva.
- **FR-010**: El sistema NO DEBE retirar una bonificación pasiva de set ya otorgada si el set se reconfigura posteriormente para incluir tesoros adicionales; el set pasa a estar incompleto hasta obtener el tesoro añadido, pero el efecto ya otorgado permanece activo.

### Key Entities *(include if feature involves data)*

- **Vida de Base Enemiga (nuevo atributo)**: Valor base de vida máxima de la base enemiga de un nivel, almacenado en la definición de nivel existente; se le aplica en tiempo de batalla el mismo multiplicador de fuerza enemiga del Capítulo de Saga (spec 013) que ya se aplica a las unidades enemigas.
- **Costo de Energía por Capítulo**: Tabla asociada a un nivel que mapea cada capítulo desde el que ese nivel es accesible a un costo de energía específico; si un capítulo no tiene entrada, se usa el costo de energía base del nivel (spec 006).
- **Ancho de Nivel (nuevo atributo)**: Valor numérico en la definición de nivel existente que representa la distancia entre la base del jugador y la base enemiga; consumido por el movimiento de unidades y el cálculo de rango de ataque a distancia.
- **Set de Tesoros**: Agrupación nombrada de tesoros de nivel existentes (spec 013). Atributos: lista de identificadores de tesoro que lo componen, bonificación pasiva de cuenta asociada, estado de "bonificación ya otorgada" persistido.
- **Bonificación Pasiva de Cuenta**: Efecto permanente aplicado a la cuenta del jugador al completar un set de tesoros (p. ej. modificador de tasa de regeneración de dinero, modificador de XP ganado); se acumula con otras bonificaciones de sets distintos ya otorgadas.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Para un mismo nivel, la vida máxima de la base enemiga difiere de forma medible y consistente entre capítulos, siguiendo exactamente el multiplicador de fuerza enemiga configurado, en el 100% de los niveles de prueba.
- **SC-002**: Para un mismo nivel accesible desde múltiples capítulos, el costo de energía descontado al iniciar la batalla corresponde exactamente al costo configurado para el capítulo de acceso, en el 100% de los casos de prueba.
- **SC-003**: El tiempo de recorrido de una unidad entre bases y el punto de entrada en rango de un ataque a distancia son proporcionales al ancho de nivel configurado, verificable en el 100% de los niveles de prueba con anchos distintos.
- **SC-004**: La bonificación pasiva de un set de tesoros se otorga exactamente una vez por set, en el 100% de las combinaciones de orden de obtención de tesoros probadas, sin duplicarse ni otorgarse antes de completar el set.
- **SC-005**: El estado de sets completos y bonificaciones otorgadas sobrevive un reinicio completo de la aplicación en el 100% de las pruebas, sin pérdida ni duplicación de bonificaciones.

## Assumptions

- Esta especificación asume que spec 013 ("Imperio de los Gatos") ya está aprobada como base: reutiliza su Capítulo de Saga, multiplicador de fuerza enemiga, y Recompensa de Nivel con tesoro individual sin modificarlos.
- El redondeo de la vida de base enemiga tras aplicar el multiplicador de capítulo usa la misma regla de redondeo al entero más cercano ya definida en spec 013 (Assumptions), por consistencia con el redondeo de vida/daño de unidades enemigas.
- La tabla de costo de energía por capítulo (FR-002) es configuración de contenido por nivel, no una fórmula automática derivada del multiplicador de fuerza enemiga del capítulo; distintos niveles pueden tener progresiones de costo distintas según decisión de diseño.
- El ancho de nivel por defecto (FR-005, para niveles sin configuración explícita) usa el valor que el sistema de movimiento/rango ya asume implícitamente hoy, preservando el comportamiento actual de los niveles ya construidos (Capítulo 1 y Capítulo 2 existentes) sin requerir migración de datos.
- Las bonificaciones pasivas de sets de tesoros (FR-007) son modificadores acumulativos sobre sistemas económicos ya existentes (p. ej. tasa de regeneración de dinero de spec 001, XP de spec 013); esta especificación no diseña nuevos tipos de efecto, solo el mecanismo de otorgamiento al completar un set.
- La población completa de sets de tesoros y su asignación de niveles específicos (equivalente a los "Energy Drink", "Giant Safe", etc. del juego original) es trabajo de autoría de contenido posterior a esta especificación, igual que spec 013 dejó la población de los 144 niveles como trabajo posterior.
