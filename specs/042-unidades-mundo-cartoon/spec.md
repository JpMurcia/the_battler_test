# Feature Specification: Unidades del Mundo Cartoon

**Feature Branch**: `042-unidades-mundo-cartoon`

**Created**: 2026-10-10

**Status**: Draft

**Input**: Reskin "mundo cartoon" de las unidades de combate: aplicar la Biblia de Arte (`docs/art/art-bible.md`, secciones 1, 3, 4 y 5) a cómo se dibujan en batalla las unidades que no usan sprites de fotogramas, y añadir la señal de equipo en el suelo, sin cambiar ninguna regla de combate, estadística ni balance. Todo aliado y enemigo sin sprite se ve como un dibujo de dibujos animados (contorno oscuro grueso, relleno plano, sin borde neón, visor, placas brillantes, propulsor ni degradados); todo aliado muestra orejas de gato en la silueta; el cuerpo "cyber" genérico deja de existir como apariencia (las 16 unidades que hoy lo usan reciben diseño propio); todas las unidades, incluidas las 12 con sprite, muestran un anillo de equipo bajo los pies (cian aliado, rojo enemigo); cuatro unidades con color de cuerpo idéntico a un color de información pasan a un tono más apagado; el eco de muerte conserva el mismo estilo, apagado.

**Relación con el proyecto existente**: La Biblia de Arte (`docs/art/art-bible.md`) fija la regla «el mundo se dibuja; la información brilla» y deja como deuda visual lo que esta spec resuelve; el inventario `docs/art/entity-inventory.md` clasifica las 65 unidades del catálogo en tres niveles de arte — **A** sprite de fotogramas (12), **B** diseño procedural (37) y **C** cuerpo "cyber" genérico (16). Extiende `specs/021-reskin-cyber-modern` (sprites y cuerpo "cyber"), `specs/022-datos-semilla-flujo-navegacion` y `specs/028-ajustes-combate-mapa-disenos` (diseños procedurales de las unidades semilla y del Capítulo 1) y `specs/003-identidad-visual-animada` (eco de muerte y animación por transformaciones). Respeta la Constitución § III (cada unidad con animación de reposo y de ataque) y § VI (nada se re-renderiza por el tick de combate). No cambia estadísticas, reglas de combate, costes ni balance, ni toca sprites, fondos de batalla, torres de base, mapa de etapas ni pantallas de UI.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Toda unidad se ve como un dibujo animado coherente (Priority: P1)

Un jugador entra a una batalla con aliados y enemigos de cualquier nivel de arte y ve un mundo visualmente unificado: las unidades que no usan sprites de fotogramas se dibujan con contorno oscuro grueso y color plano, sin ningún acabado neón, y ninguna unidad conserva el cuerpo "cyber" genérico. Las 16 unidades que hoy lo usan se ven por primera vez con una forma, un color y un rasgo propios.

**Why this priority**: Es el núcleo de la regla de la biblia ("el mundo se dibuja") y la mayor incoherencia visual del juego hoy: 53 de 65 unidades hablan un idioma neón que choca con el arte cartoon. Sin esto no hay reskin.

**Independent Test**: Lanzar una batalla con una unidad de cada nivel de arte (sprite, diseño procedural, y una de las 16 antes "cyber") y verificar que las dos últimas no tienen borde brillante, visor, placas, propulsor ni degradado, y que las 16 tienen diseño propio.

**Acceptance Scenarios**:

1. **Given** una unidad con diseño procedural (p. ej. Gato Yunque), **When** aparece en batalla, **Then** muestra contorno oscuro continuo alrededor de todo el cuerpo y un relleno plano de un solo color, sin borde brillante, visor, placas, propulsor ni degradado.
2. **Given** una de las 16 unidades que hoy usan el cuerpo "cyber" (p. ej. Gato Golpe Certero), **When** aparece en batalla, **Then** se dibuja con su propio diseño (forma base, color, tamaño y rasgo) igual que el resto de unidades con diseño.
3. **Given** las unidades con diseño, **When** se comparan sus colores principales, **Then** no hay dos unidades con el mismo color y ninguna coincide con un color de información de la paleta.
4. **Given** una unidad con sprite cuya carga falla en tiempo de ejecución, **When** aparece en batalla, **Then** se dibuja con su diseño cartoon de respaldo, nunca con el cuerpo "cyber".
5. **Given** una unidad con sprite que todavía está cargando sus fotogramas, **When** aparece en batalla, **Then** mientras tanto se muestra su diseño cartoon de respaldo, nunca el cuerpo "cyber".
6. **Given** una unidad con sprite cuya carga funciona, **When** aparece en batalla, **Then** se ve exactamente como hoy.
7. **Given** las cuatro unidades cuyo color de cuerpo coincide hoy con un color de información (Gato Deidad, Gato a Distancia (Semilla), Gato Titán (Semilla), Saltarín Alado), **When** aparecen en batalla, **Then** su color de cuerpo es un tono más apagado, distinto de cualquier color de información y de cualquier otra unidad.

---

### User Story 2 - Reconocer el bando de cualquier unidad por su anillo de equipo (Priority: P1)

Un jugador ve, bajo los pies de cada unidad en batalla, un anillo fino del color de su bando — cian para aliados, rojo para enemigos — con un resplandor de paleta, de modo que distingue aliados de enemigos a primera vista aunque los cuerpos ya no lleven brillo de equipo.

**Why this priority**: Retirar el neón de los cuerpos elimina hoy la principal señal de bando de 53 unidades; el anillo la repone y, al aplicarse también a las 12 con sprite, unifica la lectura de todo el campo. Va unido a la Historia 1.

**Independent Test**: Desplegar aliados y generar enemigos de los tres niveles de arte y comprobar que todos muestran su anillo con el color correcto, que acompaña a la unidad al moverse y al combatir, y que la barra de vida con color de equipo sigue igual.

**Acceptance Scenarios**:

1. **Given** cualquier aliado vivo (con sprite o con diseño), **When** está en batalla, **Then** muestra un anillo cian bajo los pies con un resplandor del mismo color.
2. **Given** cualquier enemigo vivo, **When** está en batalla, **Then** muestra un anillo rojo bajo los pies con un resplandor del mismo color.
3. **Given** una unidad que avanza, combate o está detenida, **When** se mueve, **Then** el anillo la acompaña sin desfasarse y no parpadea ni pulsa.
4. **Given** una unidad de 14 px de ancho, **When** se ve su anillo, **Then** no oculta su silueta ni su rasgo distintivo.
5. **Given** cualquier unidad, **When** está en batalla, **Then** su barra de vida conserva el color de equipo y la forma que tiene hoy.
6. **Given** la batalla en pausa, **When** el jugador mira el campo, **Then** los anillos siguen visibles en su sitio.

---

### User Story 3 - Los aliados se leen como gatos (Priority: P2)

Un jugador reconoce a sus aliados como gatos porque todos muestran orejas de gato asomando en la silueta, además de su rasgo distintivo de arquetipo; los enemigos, en cambio, nunca las llevan.

**Why this priority**: Fija la identidad "nosotros = gatos" de la sección 5 de la biblia con una señal de silueta que funciona a 14–44 px. Es menos urgente que la unificación y el bando, pero completa la lectura.

**Independent Test**: Revisar un aliado con rasgo en la cabeza, uno con rasgo en el cuerpo, un aliado semilla que ya declara orejas y un enemigo, y confirmar la presencia o ausencia de orejas según corresponda.

**Acceptance Scenarios**:

1. **Given** un aliado con diseño cartoon, **When** aparece en batalla, **Then** se ven orejas de gato en su silueta además de su rasgo distintivo (el rasgo no las sustituye).
2. **Given** un aliado cuyo rasgo ocupa la cabeza (cuernos o cresta), **When** aparece en batalla, **Then** las orejas asoman a ambos lados del rasgo.
3. **Given** un aliado semilla cuyo rasgo declarado ya es "orejas de gato", **When** aparece en batalla, **Then** se ven las orejas una sola vez, sin duplicarse.
4. **Given** cualquier enemigo, **When** aparece en batalla, **Then** no lleva orejas de gato.
5. **Given** un aliado con sprite que carga bien, **When** aparece en batalla, **Then** no se le añade nada al sprite.

---

### User Story 4 - El eco de muerte conserva el estilo (Priority: P3)

Un jugador ve morir a una unidad y el eco que queda conserva el mismo estilo cartoon, apagado y sin brillo, en lugar de volver a un cuerpo neón.

**Why this priority**: Es coherencia de acabado — el eco dura menos de medio segundo — y no afecta a la lectura del combate.

**Independent Test**: Derrotar una unidad de cada nivel de arte y verificar que el eco se ve en el mismo estilo que la unidad viva, desaturado y sin anillo.

**Acceptance Scenarios**:

1. **Given** una unidad con diseño cartoon que muere, **When** se muestra su eco, **Then** conserva su forma y estilo cartoon en tonos apagados, sin brillo ni degradado, y se encoge y desvanece como hoy.
2. **Given** el eco de una unidad que muere, **When** se muestra, **Then** no aparece su anillo de equipo.
3. **Given** el eco de una unidad con sprite, **When** se muestra, **Then** se comporta exactamente como hoy.

---

### Edge Cases

- **Unidad de 14 px de ancho**: el contorno sigue siendo visible en todo el perímetro y el anillo es proporcional, sin ocultar silueta ni rasgo.
- **Unidad enemiga espejada**: el espejo no cambia las reglas — sin orejas, anillo rojo simétrico, rasgos espejados como hoy.
- **Unidad nueva añadida al catálogo sin sprite ni diseño**: la comprobación automática falla; nunca se dibuja en silencio con un cuerpo genérico.
- **Muchas unidades simultáneas**: no hay una degradación perceptible respecto a hoy; unidades repetidas del mismo tipo reutilizan el mismo dibujo.
- **Unidad con rasgo que ocupa la cabeza y orejas obligatorias**: las orejas asoman a los lados del rasgo (Historia 3, escenario 2); no se superponen ni lo tapan.
- **Cambio de bando visual con la unidad ya en pantalla**: no existe (el bando es fijo desde que aparece); el anillo se decide al aparecer.
- **Pausa y reanudación**: los anillos y dibujos no cambian ni se redibujan al pausar o reanudar.
- **Preferencia "reducir movimiento"**: el anillo es estático, así que no requiere ningún comportamiento adicional; la animación de las unidades sigue igual que hoy.
- **Un color de unidad cercano a cian o rojo pero no idéntico**: queda fuera de esta spec (solo las cuatro coincidencias exactas se corrigen); se anota como deuda en el inventario.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Toda unidad que no se dibuje con su sprite de fotogramas DEBE dibujarse como cartoon: contorno oscuro continuo alrededor de todo el cuerpo y relleno plano de un solo color, SIN borde neón, visor, placas brillantes, propulsor ni degradado de color.
- **FR-002**: El cuerpo "cyber" genérico NO DEBE usarse como apariencia de ninguna de las 65 unidades del catálogo, tampoco como respaldo mientras cargan los fotogramas de un sprite ni cuando esa carga falla.
- **FR-003**: Las 16 unidades que hoy usan el cuerpo "cyber" (Gato Golpe Certero, Cazazombis, Cazametal, Escudo, Invocador, Enfurecido, Escurridizo, Superviviente, Empujón, Cobrador, Ancla, Cavernícola Garrochista, y los 4 de gacha: Gato Eclipse, Gato Supremo, Gato Errante del Vacío, Gato Ídolo Estelar) DEBEN recibir un diseño propio con: forma base (círculo, rectángulo o triángulo), color principal único en todo el catálogo, tamaño igual a su ancho de colisión y exactamente un rasgo distintivo elegido según su arquetipo con las reglas de la sección 3 de la biblia.
- **FR-004**: Las 12 unidades con sprite DEBEN recibir también un diseño propio de respaldo, con las mismas propiedades que FR-003, que se muestra solo mientras su sprite carga o si su carga falla; mientras el sprite se muestra, la unidad se ve exactamente como hoy.
- **FR-005**: El color principal de cada unidad con diseño DEBE ser único en todo el catálogo y NO DEBE coincidir con ninguno de los siete colores de información de la paleta (cian, naranja, púrpura, dorado, rojo, verde, rosa). Las cuatro unidades que hoy coinciden exactamente con uno (Gato Deidad: dorado; Gato a Distancia (Semilla): cian; Gato Titán (Semilla): rojo; Saltarín Alado: rosa) DEBEN pasar a un tono más apagado, y los colores de los diseños nuevos DEBEN ser menos saturados y menos luminosos que el color de información de su matiz.
- **FR-006**: Todo aliado con diseño cartoon DEBE mostrar orejas de gato asomando en su silueta, además de su rasgo distintivo (el rasgo no las sustituye); cuando el rasgo ocupa la cabeza, las orejas DEBEN asomar a ambos lados. Un aliado cuyo rasgo declarado sea "orejas de gato" DEBE mostrar las orejas una sola vez.
- **FR-007**: Ningún enemigo DEBE llevar orejas de gato; ningún sprite de fotogramas DEBE recibir orejas añadidas.
- **FR-008**: Toda unidad viva en batalla, con sprite o con diseño, DEBE mostrar bajo los pies un anillo de equipo — cian para aliados, rojo para enemigos — con un resplandor del mismo color, que la acompaña en todo momento, es estático (sin parpadeo ni pulso) y es proporcional a su tamaño sin ocultar su silueta ni su rasgo.
- **FR-009**: La barra de vida individual con color de equipo DEBE conservar exactamente su apariencia y comportamiento actuales.
- **FR-010**: El eco de muerte de una unidad con diseño DEBE conservar su forma y estilo cartoon en tonos apagados, sin brillo ni degradado y sin anillo de equipo, con la misma duración y desvanecimiento de hoy; el eco de una unidad con sprite DEBE comportarse exactamente como hoy.
- **FR-011**: Ninguna estadística, regla de combate, coste, tiempo de recarga, caja de colisión ni valor de balance DEBE cambiar, y el tamaño de cada unidad en pantalla DEBE ser el mismo que hoy; toda unidad DEBE conservar su animación de reposo y de ataque con el mismo comportamiento.
- **FR-012**: DEBE existir una comprobación automática que falle si alguna unidad del catálogo no tiene sprite ni diseño, o si dos unidades con diseño comparten el mismo color principal, o si el color principal de una unidad coincide con un color de información.
- **FR-013**: Los dibujos cartoon y los anillos NO DEBEN provocar re-renderizados de la interfaz por cada tick de combate (Constitución § VI) ni dibujarse de nuevo por fotograma; unidades repetidas del mismo tipo DEBEN reutilizar el mismo dibujo.

### Key Entities *(include if feature involves data)*

- **Diseño de unidad**: descripción visual de una unidad sin sprite — forma base (círculo, rectángulo o triángulo), color principal, tamaño (igual a su ancho de colisión) y un rasgo distintivo del vocabulario existente (colmillos, aleta, cresta, cuernos, alas, escudo, púas, cola o ninguno). Las orejas de gato son una propiedad del bando aliado, no un rasgo.
- **Anillo de equipo**: marca visual bajo los pies de cada unidad viva; color según bando (aliado cian, enemigo rojo) y tamaño proporcional a la unidad.
- **Catálogo de unidades (65)**: las unidades jugables y enemigas del juego, clasificadas por nivel de arte (sprite, diseño o —antes de esta spec— cuerpo genérico); tras la spec, todas tienen sprite o diseño y las 12 con sprite tienen además un diseño de respaldo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Ninguna de las 65 unidades del catálogo se dibuja con el cuerpo "cyber" genérico en ningún estado (cargando, cargado, fallo de carga, eco de muerte): 0 de 65.
- **SC-002**: El 100 % de los aliados con diseño cartoon muestra orejas de gato y el 0 % de los enemigos y de los sprites las muestra.
- **SC-003**: El 100 % de las unidades vivas en batalla muestra su anillo de equipo con el color de su bando (cian aliado, rojo enemigo).
- **SC-004**: Entre todas las unidades con diseño hay 0 pares con el mismo color principal y 0 unidades cuyo color coincida con un color de información.
- **SC-005**: En una revisión visual de las 65 unidades a su tamaño real de batalla (14–44 px de ancho) sobre el fondo actual, un revisor identifica el bando de cada una por su anillo y su arquetipo por su silueta, sin confundir ninguna con una de bando contrario.
- **SC-006**: Un jugador que compara una batalla antes y después no percibe ningún cambio en las estadísticas ni en el ritmo del combate: la suite de pruebas de combate, motor y balance existente pasa sin modificar.
- **SC-007**: Una batalla con muchas unidades simultáneas se comporta igual de fluida que antes de esta spec, sin degradación perceptible.
- **SC-008**: La comprobación de tipos y toda la suite de pruebas pasan sin errores, sin regresión en las pruebas existentes.

## Assumptions

- **Reglas de dibujo cartoon** (biblia §1, §3, §4): contorno de color casi negro (`#0a0c14`), de grosor proporcional al tamaño de la unidad con un mínimo visible a 14 px (el valor exacto se fija en el plan y se afina en `/speckit-clarify`); relleno plano de un solo color; sombra de contacto plana y oscura bajo el cuerpo.
- **Reglas de rasgo por arquetipo** (biblia §3): tanque → cuernos; anti-aéreo o aéreo → alas; defensivo → escudo; agresivo o de área → púas; rápido → cola; el plan asigna a cada una de las 16 y de las 12 su arquetipo a partir de sus estadísticas y habilidades. El vocabulario de rasgos NO crece en esta spec.
- **Las 12 unidades con sprite también reciben diseño de respaldo** (FR-004): decisión informada, no explícita en la entrada, necesaria para cumplir «ninguna de las 65 se dibuja con el cuerpo "cyber"» — hoy un sprite que falla o que aún carga se dibuja con ese cuerpo. Esto añade 12 diseños a los 16 pedidos (28 en total). Los 12 sprites actuales (guerreros humanos) NO se tocan y se reemplazarán por gatos en una spec posterior.
- **Anillo de equipo**: elipse fina estática bajo los pies, con los colores numéricos equivalentes a los tokens de paleta cian y rojo (el código del mundo no lee variables CSS; biblia §4); no aparece en el eco de muerte; su ancho es proporcional al de la unidad. Es información (neón) sobre un mundo cartoon.
- **Colores**: solo las cuatro coincidencias exactas con un token de información son deuda corregida aquí; otras unidades con colores cercanos a un token (p. ej. un celeste) quedan como deuda anotada, no corregida. La comprobación de FR-012 cubre únicamente coincidencia exacta y unicidad, no la regla general de saturación y luminosidad para los diseños existentes.
- **Registro de diseños**: la prueba existente del Capítulo 1 exige exactamente 30 entradas en su registro, así que los 28 diseños nuevos no pueden añadirse a él sin romperla; el plan decide dónde viven.
- **Sin cambios de modelo de datos persistente**: nada de esto se guarda en el progreso del jugador (Constitución § V); los diseños y el anillo son datos y dibujo estáticos.
- **Sin presupuesto de rendimiento documentado** en el repositorio: el criterio es no empeorar el comportamiento observable actual (SC-007); no se introducen filtros ni efectos por fotograma.
- **Fuera de alcance**: sprites nuevos o reemplazo de los 12 sprites actuales, fondos de batalla, torres de base, mapa de etapas, iconos de nodos, pantallas de UI, retratos, cambios de estadísticas o balance, y nuevos rasgos distintivos. Las entradas para esas piezas están en `docs/art/speckit-inputs-reskin-mundo.md` (specs B y C).
- **Dependencias**: `docs/art/art-bible.md` (secciones 1, 3, 4 y 5), `docs/art/entity-inventory.md` (clasificación A/B/C de las 65 unidades) y las specs 003, 021, 022 y 028.
