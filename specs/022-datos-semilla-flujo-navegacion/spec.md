# Feature Specification: Datos Semilla, Assets Procedimentales y Flujo de Navegación

**Feature Branch**: `022-datos-semilla-flujo-navegacion`

**Created**: 2026-08-15

**Status**: Draft

**Input**: User description: "Genera la especificación técnica completa y los datos semilla (seed data) para el juego estilo 'The Battle Cats', incluyendo la generación de assets procedimentales con PixiJS y la validación del flujo de navegación."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Catálogo semilla de unidades y enemigos (Priority: P1)

Como diseñador/a de contenido del juego, necesito un conjunto de datos semilla claramente clasificado (gatos por rareza, enemigos por rasgo) con estadísticas de combate consistentes, para poder equilibrar el juego, probar builds de equipo y demostrar el ciclo completo de batalla sin depender de arte final.

**Why this priority**: Sin datos semilla coherentes no existe contenido jugable que ejercitar en las demás historias (assets visuales y navegación dependen de que existan unidades y enemigos definidos).

**Independent Test**: Se puede verificar de forma independiente inspeccionando el catálogo semilla y confirmando que cada unidad/enemigo requerido (4 gatos por rareza + 3 enemigos) existe con todos los campos obligatorios completos y valores dentro de rangos coherentes con su rareza/rol.

**Acceptance Scenarios**:

1. **Given** el catálogo semilla cargado, **When** se listan las unidades gato, **Then** existen exactamente 4 unidades (una por cada rareza: Normal, Rara, Super Rara, Mega Rara) con estadísticas que reflejan su arquetipo (ej. el Mega Rara tiene el daño y costo más altos del catálogo, el Rara tiene el HP más alto con el rango más corto).
2. **Given** el catálogo semilla cargado, **When** se listan los enemigos, **Then** existen exactamente 3 enemigos (Perro Básico sin rasgo, Serpiente Roja con rasgo Red y alta velocidad, Hipopótamo Flotante con rasgo Floating y HP alto).
3. **Given** una unidad o enemigo del catálogo, **When** se inspecciona su definición, **Then** incluye identificador único, nombre, rareza/tipo, estadísticas completas de combate, tipo de objetivo (único o área) y los rasgos aplicables.

---

### User Story 2 - Representación visual generada proceduralmente (Priority: P2)

Como jugador, quiero que cada unidad y enemigo tenga una representación visual distinguible (forma, color y rasgos faciales propios) generada a partir de su definición de datos, para poder identificar unidades en el campo de batalla incluso antes de que exista arte final ilustrado.

**Why this priority**: Habilita que la Historia 1 sea jugable y visible en pantalla; depende del catálogo semilla pero es independiente del flujo de navegación.

**Independent Test**: Se puede verificar de forma independiente renderizando cada entrada del catálogo semilla y confirmando visualmente que cada unidad produce una imagen coherente con sus parámetros visuales (color primario, forma, tamaño, rasgos distintivos) y que unidades distintas son visualmente distinguibles entre sí.

**Acceptance Scenarios**:

1. **Given** una unidad o enemigo con parámetros visuales definidos, **When** se genera su representación, **Then** la imagen resultante refleja el color, la forma base y el tamaño configurados para esa entrada.
2. **Given** dos unidades con rarezas o roles distintos, **When** se generan ambas representaciones, **Then** son visualmente diferenciables a simple vista (color y/o silueta distintos).
3. **Given** una representación visual ya generada para una unidad, **When** esa misma unidad vuelve a aparecer en el campo de batalla (otra instancia), **Then** el sistema reutiliza la representación ya generada en lugar de recrearla, sin degradar el rendimiento percibido de la batalla.

---

### User Story 3 - Flujo de navegación de principio a fin (Priority: P3)

Como jugador, quiero moverme sin fricciones entre la pantalla de inicio, el menú principal, la selección de equipo, la mejora de unidades, la batalla y el resultado final, para poder completar un ciclo de juego completo (preparar equipo → luchar → ver resultado → volver a intentarlo) sin quedar atrapado en ninguna pantalla.

**Why this priority**: Confirma que el catálogo semilla y las representaciones visuales de las Historias 1 y 2 son alcanzables y usables dentro del juego real; es la historia de validación de extremo a extremo.

**Independent Test**: Se puede verificar de forma independiente recorriendo manualmente (o con un script de UI) la secuencia completa de pantallas desde el inicio hasta el resultado y de vuelta al menú, confirmando en cada paso que la navegación disponible corresponde a la esperada y que el progreso se guarda correctamente.

**Acceptance Scenarios**:

1. **Given** el jugador abre el juego por primera vez, **When** pulsa el botón de inicio, **Then** los datos guardados se cargan y el jugador llega al Menú Principal.
2. **Given** el jugador está en el Menú Principal, **When** accede a Selección de Equipo, **Then** puede ver el catálogo de unidades disponibles y equipar entre 5 y 10 unidades en su alineación activa, y esa alineación queda guardada.
3. **Given** el jugador está en el Menú Principal, **When** accede a Mejoras, **Then** puede invertir experiencia/recursos disponibles para subir de nivel una unidad de su colección.
4. **Given** el jugador tiene una alineación activa válida, **When** inicia una batalla, **Then** ve el HUD superior (dinero del jugador, HP de base aliada y HP de base enemiga), el HUD inferior (botones de invocación con costo y cooldown por unidad) y el campo de batalla renderizado.
5. **Given** una batalla en curso, **When** la base enemiga llega a 0 HP, **Then** se muestra el modal de Victoria.
6. **Given** una batalla en curso, **When** la base aliada llega a 0 HP, **Then** se muestra el modal de Derrota.
7. **Given** un modal de resultado (Victoria o Derrota) visible, **When** el jugador confirma para continuar, **Then** vuelve al Menú Principal y el progreso (recursos ganados, experiencia, desbloqueos) queda reflejado en el estado guardado.

---

### Edge Cases

- ¿Qué ocurre si el jugador intenta iniciar una batalla sin ninguna unidad equipada en su alineación activa? El sistema debe impedir el inicio y explicar por qué.
- ¿Qué ocurre si el jugador no tiene dinero suficiente para invocar ninguna unidad disponible? Los botones de invocación deben reflejar el estado "no disponible" sin bloquear el resto de la interacción.
- ¿Qué ocurre si dos unidades comparten los mismos parámetros visuales (mismo color/forma)? El sistema debe seguir funcionando, aunque la distinción visual entre ellas sea menor.
- ¿Qué ocurre si la carga de datos guardados (Dexie.js) falla o está vacía en el primer arranque? El jugador debe recibir un estado inicial válido por defecto en lugar de una pantalla rota.
- ¿Qué ocurre si el jugador cierra o recarga la aplicación durante una batalla en curso? Al volver, debe aterrizar en el Menú Principal con el último progreso guardado antes del inicio de esa batalla (la batalla en curso no se persiste a mitad de partida).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE proveer un catálogo semilla de unidades jugables que incluya exactamente una unidad por cada nivel de rareza (Normal, Rara, Super Rara, Mega Rara), cada una con un arquetipo de combate diferenciado (equilibrado, tanque de rango corto, ataque a distancia de HP bajo, y daño masivo de costo/recarga altos, respectivamente).
- **FR-002**: El sistema DEBE proveer un catálogo semilla de enemigos que incluya exactamente tres tipos: uno sin rasgo especial, uno con rasgo "Red" y velocidad alta, y uno con rasgo "Floating" y HP alto.
- **FR-003**: Cada entrada del catálogo (unidad o enemigo) DEBE incluir, como mínimo: identificador único, nombre visible, clasificación de rareza o tipo, estadísticas completas de combate (vida, poder de ataque, rango de ataque, velocidad de movimiento, tiempo de recarga de ataque, costo de invocación y tiempo de reaparición/spawn), tipo de objetivo (único o en área) y la lista de rasgos aplicables.
- **FR-004**: Cada entrada del catálogo DEBE incluir parámetros visuales suficientes (color principal, forma base, tamaño y rasgos distintivos) para generar una representación gráfica reconocible sin depender de un archivo de imagen externo.
- **FR-005**: El sistema DEBE generar una representación visual reutilizable por cada entrada del catálogo a partir de sus parámetros visuales, de modo que instancias repetidas de la misma unidad en batalla no requieran regenerar la representación cada vez.
- **FR-006**: Las representaciones visuales generadas DEBEN distinguir visualmente entre unidades aliadas (con rasgos tipo "orejas de gato") y enemigos (con rasgos propios de su especie/rol), y reflejar una expresión facial simple coherente con la unidad.
- **FR-007**: El sistema DEBE ofrecer una pantalla de inicio que cargue el progreso guardado del jugador antes de permitir avanzar al menú principal.
- **FR-008**: El sistema DEBE ofrecer un punto de acceso desde el menú principal a la Selección de Equipo, donde el jugador pueda equipar entre 5 y 10 unidades de su colección en la alineación activa, y esa selección DEBE persistir entre sesiones.
- **FR-009**: El sistema DEBE ofrecer un punto de acceso desde el menú principal a Mejoras, donde el jugador pueda invertir experiencia para subir de nivel unidades de su colección.
- **FR-010**: La pantalla de Batalla DEBE mostrar en todo momento: dinero disponible del jugador, HP de la base aliada, HP de la base enemiga, y el listado de unidades invocables con su costo y estado de cooldown (disponible, en espera, o sin fondos suficientes).
- **FR-011**: El sistema DEBE bloquear el inicio de una batalla si la alineación activa no tiene ninguna unidad equipada, informando al jugador del motivo.
- **FR-012**: Al finalizar una batalla (victoria o derrota), el sistema DEBE mostrar un modal de resultado correspondiente y, al confirmarlo, devolver al jugador al Menú Principal con el progreso (recursos, experiencia, desbloqueos obtenidos) ya reflejado en el estado guardado.
- **FR-013**: El sistema DEBE mantener un estado inicial válido por defecto cuando no existen datos guardados previos (primer arranque o almacenamiento vacío), sin bloquear el acceso a ninguna pantalla.

### Key Entities

- **Unidad Jugable (Gato)**: Representa una unidad invocable por el jugador. Atributos clave: identificador, nombre, rareza, estadísticas de combate, tipo de objetivo, rasgos, parámetros visuales para su representación gráfica.
- **Enemigo**: Representa una unidad controlada por el sistema durante la batalla. Mismos atributos estructurales que la Unidad Jugable, sin costo de invocación asociado al jugador; añade los rasgos especiales (Red, Floating, Black, Angel, Alien) que activan interacciones de combate específicas.
- **Alineación Activa**: El subconjunto ordenado (5 a 10) de Unidades Jugables que el jugador ha equipado para su próxima batalla; pertenece al progreso guardado del jugador.
- **Progreso del Jugador**: Estado persistente que incluye colección de unidades desbloqueadas, nivel/experiencia por unidad, recursos (dinero/moneda de progreso) y la Alineación Activa actual.
- **Representación Visual**: La imagen generada a partir de los parámetros visuales de una Unidad Jugable o Enemigo, reutilizada por cada instancia de esa entrada en el campo de batalla.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de las unidades y enemigos requeridos (4 gatos + 3 enemigos) están definidos con todos los campos obligatorios completos y estadísticas coherentes con su arquetipo declarado.
- **SC-002**: Cada unidad y enemigo del catálogo produce una representación visual distinguible; un observador puede identificar correctamente el arquetipo de una unidad (tanque, distancia, básico, jefe) por su apariencia en al menos el 90% de los casos en una prueba informal de reconocimiento visual.
- **SC-003**: Un jugador nuevo puede completar el ciclo completo — inicio → menú → selección de equipo → batalla → resultado → menú — sin quedar bloqueado en ninguna pantalla, en el 100% de los recorridos de prueba.
- **SC-004**: El progreso del jugador (recursos, experiencia, alineación) se conserva correctamente después de cerrar y volver a abrir el juego, verificado en el 100% de los recorridos de prueba.
- **SC-005**: Generar y mostrar la representación visual de una unidad nueva en pantalla toma menos de 100 ms percibidos por el jugador, sin introducir pausas visibles durante la batalla al invocar unidades repetidas.

## Assumptions

- El catálogo semilla descrito en esta especificación es un conjunto de contenido de referencia/prueba (4 gatos + 3 enemigos) para validar el flujo completo de datos → visualización → navegación; no sustituye ni modifica el catálogo de contenido de producción ya existente en el juego (unidades, rarezas, habilidades y evoluciones acumuladas de las funcionalidades 001–021).
- Las representaciones visuales generadas proceduralmente se usan como base común para todas las unidades de este catálogo semilla; el proyecto puede seguir usando arte ilustrado real para el catálogo de producción por separado, sin que ambos sistemas entren en conflicto.
- El almacenamiento persistente del progreso del jugador (colección, experiencia, recursos, alineación activa) reutiliza el mecanismo de guardado local ya existente en el proyecto.
- Las pantallas de Inicio, Menú Principal, Selección de Equipo, Mejoras, Batalla y Resultado ya existen como pantallas navegables en el proyecto; esta funcionalidad valida y, si es necesario, ajusta su flujo y contenido en lugar de construirlas desde cero.
- El rango de 5 a 10 unidades equipables en la alineación activa es un límite configurable, no una constante fija de un único valor.
- "Menos de 100 ms percibidos" en SC-005 es un objetivo de fluidez visual, no una medición de bajo nivel del motor de renderizado.
