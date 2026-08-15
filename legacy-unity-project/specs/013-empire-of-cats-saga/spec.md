# Feature Specification: Saga "Imperio de los Gatos" — Multiplicadores por Capítulo, Gatorreta y Brotes Zombis

**Feature Branch**: `013-empire-of-cats-saga`

**Created**: 2026-07-30

**Status**: Draft

**Input**: User description: "Sistema Base de Juego Tower Defense 2D (Estilo The Battle Cats)" — especificación completa de una arquitectura de datos (unidades, enemigos, niveles, capítulos), economía de partida, y guardado de progreso, aplicada a la saga "Imperio de los Gatos" (3 capítulos x 48 niveles).

**Relación con el proyecto existente**: El proyecto ya implementa la mayor parte de la maquinaria descrita en la entrada del usuario, bajo otros nombres: definición de unidad/enemigo (`UnitDefinition`, spec 001/007/008/009), definición de nivel (`ChapterDefinition` = un nivel jugable, con diálogo, unidades disponibles y oleadas), catálogo y desbloqueo secuencial de misiones (`ChapterBannerDefinition` + `ChapterBannerUnlockEvaluator`, spec 004/006), economía de partida (`BattleResourceController`, spec 001), energía de misión (`MissionEnergyController`, spec 006), evolución de unidad (spec 009) y guardado de progreso (`ProgressSaveData`, spec 002). Esta especificación **extiende** ese sistema en vez de reemplazarlo: no vuelve a definir "unidad", "enemigo" o "nivel" desde cero, solo añade las capacidades que aún no existen y que requiere la saga "Imperio de los Gatos": agrupación de niveles en capítulos con multiplicadores, oleadas disparadas por % de vida de base, límite de enemigos simultáneos, tesoro por victoria, el cañón especial "Gatorreta", el modificador "Brote Zombi", y los desbloqueos asociados a completar cada capítulo.

La saga "Imperio de los Gatos" (Empire of Cats) es narrativamente anterior a la saga ya construida "Hacia el Futuro" (spec 010); completar su primer capítulo es lo que abre la puerta a "Hacia el Futuro".

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Dificultad y costo escalan por capítulo (Priority: P1)

Un jugador avanza por los tres capítulos de la saga. El mismo tipo de enemigo y el mismo gato cuestan y golpean distinto según en qué capítulo se encuentre: más barato y los enemigos más débiles en el Capítulo 1, precio normal y enemigos más fuertes en el Capítulo 2, y ambos aún más marcados en el Capítulo 3.

**Why this priority**: Es la mecánica estructural que distingue a los tres capítulos entre sí; sin ella, "3 capítulos" es solo una etiqueta visual y el resto de historias de usuario no tiene un capítulo real sobre el cual apoyarse.

**Independent Test**: Configurar el mismo nivel (mismas unidades enemigas y el mismo gato desplegable) dentro de un capítulo con multiplicador de costo -33.3% y fuerza enemiga 100%, y de nuevo dentro de un capítulo con costo +33.3% y fuerza enemiga 400%; verificar que el costo de despliegue y las estadísticas de los enemigos en batalla difieren según el multiplicador del capítulo activo, sin cambiar los datos base de la unidad o el enemigo.

**Acceptance Scenarios**:

1. **Given** un gato con costo base $75 desplegado en un nivel perteneciente al Capítulo 1 (multiplicador de costo -33.3%), **When** el jugador lo despliega, **Then** el costo cobrado es el costo base con el multiplicador del Capítulo 1 aplicado (≈$50, redondeado según regla de redondeo definida).
2. **Given** el mismo gato desplegado en un nivel perteneciente al Capítulo 3 (multiplicador +33.3%), **When** el jugador lo despliega, **Then** el costo cobrado es mayor que en el Capítulo 1 (≈$100 si el costo "normal" de referencia es $75, o el equivalente configurado).
3. **Given** el mismo enemigo base desplegado en un nivel del Capítulo 1 (fuerza 100%) y en el nivel equivalente del Capítulo 3 (fuerza 400%), **When** ambos combates se ejecutan, **Then** la vida y el daño del enemigo en el Capítulo 3 son visiblemente mayores que en el Capítulo 1, en la proporción configurada por el multiplicador del capítulo.

---

### User Story 2 - Oleada de refuerzo al cruzar un umbral de vida de la base enemiga (Priority: P2)

En el nivel "Mongolia", al reducir la vida de la base enemiga al 50%, se dispara automáticamente una oleada rápida de 4 "Serpi" adicionales, sin que el jugador tenga que hacer nada para activarla.

**Why this priority**: Es la mecánica de dificultad dinámica que distingue a los niveles con eventos de este tipo de una simple lista de oleadas por tiempo; ya usada como ejemplo canónico ("Mongolia") en la entrada del usuario.

**Independent Test**: Configurar un nivel con un umbral de disparo al 50% de vida de base y una oleada de refuerzo de N enemigos; llevar la vida de la base enemiga exactamente a ese porcentaje en una prueba controlada y verificar que la oleada de refuerzo se genera una única vez.

**Acceptance Scenarios**:

1. **Given** un nivel con un trigger configurado al 50% de vida de la base enemiga y una oleada de refuerzo de 4 unidades de un enemigo dado, **When** la vida de la base enemiga cae a 50% o menos por primera vez, **Then** el sistema genera esa oleada de refuerzo exactamente una vez.
2. **Given** el mismo nivel, **When** la vida de la base enemiga continúa bajando del 50% al 10%, **Then** el trigger del 50% no se vuelve a disparar una segunda vez.
3. **Given** un nivel con varios triggers en distintos porcentajes (p. ej. 50% y 20%), **When** un solo golpe hace que la vida de la base pase de 60% a 15% en un mismo instante, **Then** ambos triggers (50% y 20%) se disparan, cada uno una única vez.

---

### User Story 3 - Límite de enemigos simultáneos por nivel (Priority: P3)

En "Corea" nunca hay más de 3 "Chucho" en el campo de batalla al mismo tiempo; en "Mongolia" nunca hay más de 4 enemigos (de cualquier tipo del nivel) simultáneamente. Nuevos enemigos programados esperan a que el número de enemigos vivos baje del límite antes de aparecer.

**Why this priority**: Acota el ritmo de la batalla tal como lo describe la especificación de niveles; es una restricción de generación de enemigos, no una mecánica nueva de combate, por lo que tiene menor impacto que las dos anteriores.

**Independent Test**: Configurar un nivel con límite simultáneo de 3 y una lista de oleadas que intentaría generar un cuarto enemigo antes de que muera alguno de los tres primeros; verificar que el cuarto enemigo no aparece hasta que el conteo de enemigos vivos baje de 3.

**Acceptance Scenarios**:

1. **Given** un nivel con límite simultáneo de 3 enemigos, **When** ya hay 3 enemigos vivos en el campo y toca generar un cuarto según su horario de oleada, **Then** la generación de ese cuarto enemigo se retiene hasta que el conteo de enemigos vivos baje de 3.
2. **Given** el mismo nivel, **When** uno de los 3 enemigos vivos muere, **Then** el enemigo retenido se genera en la siguiente oportunidad disponible.

---

### User Story 4 - Recompensas de victoria y desbloqueo de unidad (Priority: P4)

Al ganar "Corea" por primera vez, el jugador recibe 1000 XP, el tesoro "Kimchi", y desbloquea la unidad "Gato Defensor". Al ganar "Mongolia", recibe 1300 XP y el tesoro "Tienda de campaña".

**Why this priority**: Es la recompensa que motiva el avance nivel a nivel; depende de que existan niveles y capítulos (historia 1) pero no de las mecánicas de dificultad dinámica (historias 2-3), por lo que puede probarse de forma independiente sobre el sistema de guardado ya existente.

**Independent Test**: Configurar un nivel con una recompensa de XP, un tesoro, y un desbloqueo de unidad en su primera victoria; jugar y ganar ese nivel dos veces seguidas, y verificar que el XP y el tesoro se otorgan en ambas victorias mientras que el desbloqueo de unidad ocurre solo en la primera.

**Acceptance Scenarios**:

1. **Given** un nivel configurado con recompensa de XP, tesoro y una unidad de desbloqueo en primera victoria, **When** el jugador gana ese nivel por primera vez, **Then** el jugador recibe el XP y el tesoro configurados, y la unidad de desbloqueo pasa a estar disponible para formación de equipo.
2. **Given** el mismo nivel ya ganado antes, **When** el jugador lo vuelve a jugar y a ganar, **Then** recibe nuevamente el XP y el tesoro configurados, pero no se repite ningún efecto de "primera victoria" (la unidad ya estaba desbloqueada).

---

### User Story 5 - Cañón especial "Gatorreta" (Priority: P5)

Durante la batalla, un cañón de recarga lenta en la base del jugador se va cargando con el tiempo. Cuando termina de cargar, un indicador lo señala como disponible; el jugador puede activarlo manualmente para infligir daño de área a todos los enemigos dentro de su rango, tras lo cual vuelve a recargarse desde cero.

**Why this priority**: Es un sistema de combate independiente y opcional (el jugador puede ignorarlo y seguir jugando); no bloquea ninguna de las historias anteriores.

**Independent Test**: Iniciar una batalla, esperar a que el cañón termine su tiempo de recarga configurado, activarlo manualmente y verificar que aplica daño de área a los enemigos dentro de su rango y que vuelve a quedar en estado "recargando".

**Acceptance Scenarios**:

1. **Given** una batalla en curso con el cañón en recarga, **When** el tiempo de recarga configurado transcurre, **Then** el cañón queda disponible para activación manual y el sistema lo notifica (evento de UI).
2. **Given** el cañón disponible con 3 enemigos dentro de su rango de área y 1 enemigo fuera de rango, **When** el jugador lo activa manualmente, **Then** los 3 enemigos dentro de rango reciben el daño de área configurado, el enemigo fuera de rango no recibe daño, y el cañón vuelve a iniciar su recarga desde cero.
3. **Given** el cañón todavía en recarga (no disponible), **When** el jugador intenta activarlo, **Then** la activación no tiene efecto y el cañón sigue recargando sin reiniciarse.

---

### User Story 6 - Mejora de velocidad de regeneración de dinero durante la batalla (Priority: P6)

Durante una batalla, el jugador puede gastar dinero acumulado para aumentar la velocidad a la que se genera dinero por el resto de esa batalla.

**Why this priority**: Es una decisión económica adicional dentro de una batalla ya jugable con el sistema de economía existente; mejora la profundidad estratégica pero ninguna otra historia depende de ella.

**Independent Test**: Iniciar una batalla, acumular dinero suficiente para pagar la mejora de regeneración, activarla, y verificar que la tasa de generación de dinero por segundo aumenta de inmediato y se mantiene así por el resto de esa batalla.

**Acceptance Scenarios**:

1. **Given** una batalla en curso con dinero acumulado suficiente para pagar la mejora de regeneración, **When** el jugador la activa, **Then** el dinero requerido se descuenta una sola vez y la tasa de regeneración de dinero aumenta para el resto de la batalla.
2. **Given** dinero acumulado insuficiente para la mejora, **When** el jugador intenta activarla, **Then** la activación no tiene efecto y la tasa de regeneración no cambia.

---

### User Story 7 - Brote Zombi en niveles ya superados (Priority: P7)

El jugador puede volver a jugar un nivel ya superado ("Corea", "Mongolia") con el modificador "Brote Zombi" activo. En ese modo, los enemigos estándar del nivel se reemplazan por sus variantes zombi (Chucho → Chucho Z.; Serpi → Zerpi y Kodrizzz), no aparece el jefe del nivel, y la victoria se centra en destruir la base enemiga lo antes posible.

**Why this priority**: Es contenido rejugable que depende de que un nivel ya tenga historial de victoria (historia 4) y de la infraestructura de niveles (historia 1); es la historia de mayor alcance y la que más se apoya en las demás.

**Independent Test**: Marcar un nivel ya superado como disponible para Brote Zombi con un elenco de enemigos zombi definido; iniciar el nivel en modo Brote Zombi y verificar que únicamente aparecen enemigos zombi (nunca los estándar ni el jefe) y que la victoria se logra destruyendo la base enemiga.

**Acceptance Scenarios**:

1. **Given** un nivel superado con un elenco de enemigos zombi configurado, **When** el jugador selecciona jugarlo en modo Brote Zombi, **Then** todos los enemigos generados en esa partida son variantes zombi del elenco configurado, nunca las variantes estándar.
2. **Given** el mismo nivel en modo Brote Zombi, **When** la batalla progresa, **Then** ningún enemigo jefe del nivel estándar aparece en la partida.
3. **Given** un nivel que **no** ha sido superado todavía, **When** el jugador intenta seleccionar el modo Brote Zombi para ese nivel, **Then** la opción no está disponible.

---

### User Story 8 - Desbloqueos al completar un capítulo (Priority: P8)

Al completar todos los niveles del Capítulo 1, el jugador desbloquea la entrada a "Hacia el Futuro" (saga ya existente), Etapas de Leyenda, Cat Combos, Dojo Afilagarras, Equipo de Ototo, y la unidad "Moneko". Al completar el Capítulo 2, desbloquea la unidad "Gata Valquiria" y el nivel máximo de mejora de unidades sube a 20. Al completar el Capítulo 3, desbloquea la unidad "Gato Bégimo" y la entrada al Sistema de Frutas.

**Why this priority**: Es la recompensa de mayor alcance (fin de capítulo) y depende de que los tres capítulos existan como agrupación (historia 1) y de que el guardado de progreso registre victorias por nivel (historia 4); es la de menor prioridad porque desbloquea *acceso* a otros sistemas, no implementa esos sistemas en sí.

**Independent Test**: Marcar como superados todos los niveles configurados de un capítulo de prueba con una lista de desbloqueos definida (unidades y feature-flags), y verificar que, al superar el último nivel pendiente, esos desbloqueos pasan a estar disponibles/marcados en el guardado.

**Acceptance Scenarios**:

1. **Given** todos los niveles del Capítulo 1 superados menos uno, **When** el jugador supera ese último nivel, **Then** el guardado registra el Capítulo 1 como completado y desbloquea su lista de recompensas de capítulo (unidades y feature-flags configurados).
2. **Given** el Capítulo 2 recién completado, **When** el jugador abre la pantalla de mejora de unidades, **Then** el nivel máximo de mejora disponible es 20 en vez del límite anterior.
3. **Given** un capítulo con niveles pendientes, **When** el jugador consulta su progreso, **Then** las recompensas de ese capítulo aparecen como bloqueadas/no obtenidas todavía.

---

### Edge Cases

- ¿Qué ocurre si el multiplicador de costo de un capítulo produce un costo con decimales (p. ej. $50 × 0.667)? El sistema debe redondear a un entero de moneda de forma consistente y documentada (ver Assumptions).
- ¿Qué ocurre si dos triggers de oleada por % de vida de base se cruzan en el mismo instante (un golpe grande salta de 70% a 10% de vida)? Todos los triggers aún no disparados cuyo umbral quedó por encima del nuevo porcentaje deben dispararse, cada uno una única vez (ver historia 2, escenario 3).
- ¿Qué ocurre si se alcanza el límite de enemigos simultáneos justo cuando un enemigo programado por horario debería aparecer? La aparición se retiene hasta que el conteo baje del límite (ver historia 3).
- ¿Qué ocurre si el jugador intenta activar la Gatorreta mientras todavía está recargando? La activación no tiene efecto (ver historia 5, escenario 3).
- ¿Qué ocurre si el jugador intenta activar la mejora de regeneración de dinero sin fondos suficientes? La activación no tiene efecto y no se descuenta nada (ver historia 6, escenario 2).
- ¿Qué ocurre si un nivel no tiene un elenco de enemigos zombi configurado? El modo Brote Zombi no debe ofrecerse como opción para ese nivel.
- ¿Qué ocurre si el jugador reinicia la aplicación a mitad de un capítulo? El progreso de niveles individuales ya superados, capítulos completados, y desbloqueos obtenidos deben sobrevivir el reinicio (reutilizando el sistema de guardado existente, spec 002).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE permitir agrupar definiciones de nivel existentes en capítulos (arcos de saga), cada uno con un multiplicador de costo de unidades y un multiplicador de fuerza enemiga propios, aplicados a todos los niveles que pertenecen a ese capítulo.
- **FR-002**: El sistema DEBE aplicar el multiplicador de costo del capítulo activo al calcular el costo cobrado al desplegar una unidad en batalla, sin modificar el costo base almacenado en la definición de la unidad.
- **FR-003**: El sistema DEBE aplicar el multiplicador de fuerza enemiga del capítulo activo a la vida máxima y al daño de los enemigos generados en un nivel de ese capítulo, sin modificar los valores base almacenados en la definición del enemigo.
- **FR-004**: El sistema DEBE permitir marcar un nivel dentro de un capítulo como el nivel de jefe final de ese capítulo.
- **FR-005**: El sistema DEBE permitir asociar a un capítulo una lista de recompensas de finalización (unidades a desbloquear y feature-flags a activar), otorgadas cuando todos los niveles del capítulo quedan marcados como superados en el guardado.
- **FR-006**: El sistema DEBE permitir definir, por nivel, uno o más umbrales de porcentaje de vida de la base enemiga que disparan una oleada de refuerzo adicional, y DEBE disparar cada umbral exactamente una vez por partida, la primera vez que la vida de la base enemiga cruza ese umbral hacia abajo.
- **FR-007**: El sistema DEBE permitir definir, por nivel, un número máximo de enemigos simultáneamente vivos en el campo de batalla, y DEBE retener la generación de nuevos enemigos programados mientras ese máximo esté alcanzado.
- **FR-008**: El sistema DEBE otorgar al jugador la recompensa de experiencia (XP) y el tesoro configurados para un nivel cada vez que ese nivel se supera.
- **FR-009**: El sistema DEBE permitir configurar, por nivel, una unidad que se desbloquea específicamente la primera vez que el jugador supera ese nivel, sin repetir ese desbloqueo en victorias posteriores.
- **FR-010**: El sistema DEBE proveer un arma especial de área en la base del jugador que se recarga automáticamente con el tiempo y que el jugador DEBE poder activar manualmente solo cuando terminó de recargarse, aplicando daño de área a todos los enemigos dentro de su rango en el momento de la activación.
- **FR-011**: Tras activarse, el arma especial de área DEBE reiniciar su temporizador de recarga desde cero; mientras está recargando, los intentos de activación NO DEBEN tener efecto ni reiniciar el temporizador.
- **FR-012**: El sistema DEBE permitir al jugador gastar dinero acumulado durante una batalla para aumentar la tasa de regeneración de dinero por el resto de esa batalla, rechazando la operación sin efecto si el dinero acumulado es insuficiente.
- **FR-013**: El sistema DEBE permitir marcar un nivel ya superado como disponible para el modificador "Brote Zombi", asociándole un elenco alternativo de enemigos con clasificación Zombi que reemplaza por completo al elenco estándar del nivel cuando ese modificador está activo.
- **FR-014**: Cuando el modificador "Brote Zombi" está activo en un nivel, el sistema NO DEBE generar el enemigo jefe estándar de ese nivel (si existiera), priorizando la destrucción directa de la base enemiga como condición de victoria.
- **FR-015**: El sistema NO DEBE ofrecer el modificador "Brote Zombi" como opción jugable en niveles que el jugador todavía no ha superado.
- **FR-016**: El sistema DEBE ser capaz de determinar en todo momento, sobreviviendo reinicios de la aplicación: por nivel, si fue superado y si el desbloqueo de primera victoria ya se otorgó; y por capítulo, si fue completado y si sus recompensas de finalización ya fueron otorgadas. La disponibilidad del modificador "Brote Zombi" para un nivel (FR-015) se deriva de si ese nivel fue superado, no requiere un dato persistido propio. No todos estos hechos requieren un campo de guardado dedicado: el sistema PUEDE derivar cualquiera de ellos en tiempo de lectura a partir de datos ya persistidos (p. ej. "primera victoria" se detecta comparando el estado antes/después de una misma escritura; "capítulo completado" se deriva de que todos sus niveles ya estén marcados como superados) — solo "recompensas de capítulo ya otorgadas" exige necesariamente un campo persistido propio, para no volver a otorgarlas.
- **FR-017**: El sistema DEBE permitir etiquetar cada unidad con una clasificación de rareza (Normal, Especial, Raro, Superraro, Megarraro, Legendario, Colaboración) con fines de presentación en UI, sin implicar por sí sola ningún mecanismo de obtención aleatoria (gacha).
- **FR-018**: Al completarse el capítulo configurado como segundo capítulo de la saga, el sistema DEBE elevar el nivel máximo de mejora de unidades permitido a 20.
- **FR-019**: El sistema de comunicación con la interfaz DEBE notificar mediante eventos de suscripción (`System.Action` o `UnityEvent`) al menos: disponibilidad del arma especial de área, disparo de una oleada de refuerzo por umbral de vida, victoria de nivel con sus recompensas, y desbloqueo de recompensas de capítulo.
- **FR-020**: El sistema DEBE poder determinar, de forma consultable en código (no únicamente como criterio narrativo de UI), si el modificador "Brote Zombi" es ofrecible para un nivel dado, aplicando exactamente la regla de FR-015 (nivel superado y con elenco de Brote Zombi configurado).

### Key Entities *(include if feature involves data)*

- **Capítulo de Saga (arco)**: Agrupa un conjunto ordenado de niveles existentes (`ChapterDefinition`/`ChapterBannerDefinition`). Atributos nuevos: multiplicador de costo de unidades, multiplicador de fuerza enemiga, referencia al nivel de jefe final, lista de recompensas de finalización de capítulo.
- **Trigger de Oleada por Vida de Base**: Asociado a un nivel. Atributos: porcentaje umbral de vida de base enemiga, oleada de refuerzo a generar (reutiliza la definición de oleada existente), estado de "ya disparado" durante la partida en curso.
- **Límite de Enemigos Simultáneos**: Atributo numérico de un nivel que acota cuántos enemigos pueden estar vivos a la vez; el generador de enemigos existente lo consulta antes de instanciar cada entrada de oleada.
- **Recompensa de Nivel**: XP, tesoro (nombre/identificador), y unidad de desbloqueo de primera victoria, asociados a un nivel.
- **Elenco de Brote Zombi**: Asociado a un nivel ya superado. Lista de enemigos con clasificación Zombi que reemplazan al elenco estándar; bandera de "jefe presente" forzada a ausente mientras el modificador está activo.
- **Arma Especial de Área (Gatorreta)**: Asociada a la base del jugador. Atributos: duración de recarga, rango de área, daño de área, estado (recargando/disponible).
- **Rareza de Unidad**: Etiqueta de clasificación (Normal, Especial, Raro, Superraro, Megarraro, Legendario, Colaboración) añadida a la definición de unidad existente, sin lógica de obtención asociada en esta especificación.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Para un mismo par unidad/enemigo, el costo de despliegue y las estadísticas de combate del enemigo difieren de forma medible y consistente entre los tres capítulos, siguiendo exactamente los multiplicadores configurados, en el 100% de los niveles de prueba.
- **SC-002**: En un nivel con un trigger de oleada por % de vida de base configurado, la oleada de refuerzo se genera exactamente una vez por partida, en el 100% de las partidas de prueba en las que la base cruza el umbral.
- **SC-003**: En un nivel con límite de enemigos simultáneos configurado, el conteo de enemigos vivos nunca supera ese límite durante toda la partida, en el 100% de las partidas de prueba.
- **SC-004**: Los jugadores reciben el XP y el tesoro configurados en el 100% de las victorias de nivel, y el desbloqueo de unidad de primera victoria ocurre exactamente en la primera victoria de cada nivel configurado con ese desbloqueo.
- **SC-005**: El arma especial de área puede activarse manualmente en cuanto termina su recarga y aplica daño a todos los enemigos dentro de rango en el 100% de las activaciones válidas, sin efecto alguno en el 100% de los intentos mientras recarga.
- **SC-006**: Ningún enemigo jefe estándar aparece en una partida con el modificador "Brote Zombi" activo, en el 100% de las partidas de prueba sobre niveles habilitados para ese modificador.
- **SC-007**: El progreso por nivel, por capítulo y las recompensas otorgadas sobreviven un reinicio completo de la aplicación en el 100% de las pruebas, sin pérdida ni duplicación de desbloqueos.
- **SC-008**: El modificador "Brote Zombi" nunca aparece como opción seleccionable para un nivel que el jugador todavía no ha superado, verificable en código (FR-020) en el 100% de las comprobaciones de prueba.

## Assumptions

- Esta especificación cubre las **capacidades** de capítulo/arco, oleada por umbral de vida, límite de enemigos simultáneos, recompensas de nivel, Gatorreta, mejora de regeneración de dinero, y Brote Zombi. La **población de datos** completa de los 3 capítulos x 48 niveles (144 niveles) es trabajo de autoría de contenido posterior a esta especificación; aquí solo se detallan como ejemplo concreto los niveles "Corea" y "Mongolia" (y la mención de "Grecia" como referencia de desbloqueo regional), igual que la especificación 001 cubrió un "vertical slice" en vez de contenido completo.
- Los sistemas nombrados como recompensas de fin de capítulo que no son puramente "unidad desbloqueada" (Etapas de Leyenda, Cat Combos, Dojo Afilagarras, Equipo de Ototo, Sistema de Frutas) se tratan en esta especificación como **feature-flags de desbloqueo** persistidos en el guardado (FR-005, FR-016). Esta especificación no diseña la mecánica interna de esos sistemas; cada uno requeriría su propia especificación futura antes de implementarse.
- El tesoro y el XP se otorgan en cada victoria de nivel (no solo la primera), mientras que el desbloqueo de unidad de primera victoria ocurre una única vez; esto sigue el patrón estándar de juegos de este género y evita ambigüedad sobre "victorias repetidas".
- El redondeo de costos tras aplicar el multiplicador de capítulo usa redondeo al entero más cercano de la moneda del juego (sin fracciones de moneda), de forma consistente para todos los capítulos.
- El modificador "Brote Zombi" está disponible para el jugador en cualquier momento sobre un nivel ya superado con elenco zombi configurado (no requiere una rotación temporal ni un servidor en vivo), consistente con que el guardado de progreso es local (spec 002).
- El trigger de oleada por % de vida de base respeta el límite de enemigos simultáneos del nivel (historia 2 e historia 3 no son mutuamente excluyentes): si el límite ya está alcanzado cuando el trigger dispara, la oleada de refuerzo también queda retenida hasta que haya cupo.
- La rareza de unidad (FR-017) es metadata de presentación; ningún mecanismo de obtención aleatoria (gacha), tasas de invocación, o moneda premium se especifica ni se implementa aquí.
- Completar el primer capítulo de esta saga desbloquea el punto de entrada a la saga "Hacia el Futuro" ya construida (spec 010), reutilizando su mecanismo de desbloqueo secuencial existente (`ChapterBannerUnlockEvaluator`) en vez de crear uno nuevo.
- El nivel máximo de mejora de unidades antes de completar el segundo capítulo de esta saga es el que ya define el sistema de mejora existente (spec 009); esta especificación solo añade la regla de que sube a 20 al completar ese capítulo.
