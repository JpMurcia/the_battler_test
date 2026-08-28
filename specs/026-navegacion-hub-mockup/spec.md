# Feature Specification: Navegación Hub + Modales (acercamiento al Mockup)

**Feature Branch**: `026-navegacion-hub-mockup`

**Created**: 2026-08-23

**Status**: Draft

**Input**: User description: "Acercar la navegación y el shell de UI de battle-cats-web al Mockup \"Battle Cats Modernizado\" (docs/the-battle-cats-redesign/project/Battle Cats Modernizado.dc.html): reestructurar el Menú Principal como un Hub persistente con dock inferior de iconos y abrir Equipar/Mejorar/Cápsula/Guías/Ajustes/Menú de Tesoros como modales superpuestos en vez de pantallas completas separadas, más las pantallas de Hub que hoy no existen (Perfil de Jugador, Buzón de Noticias) como shells navegables."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Un Hub persistente en vez de un menú de botones (Priority: P1)

Un jugador abre el juego y llega a una "Base de Gatos" (Hub) que siempre muestra su rango, su energía de misión y su moneda, además de accesos directos a Batalla, Equipar y Mejorar, y un dock inferior con Biblioteca, Cápsula de Gatos y Almacén — en vez del menú de botones apilados actual.

**Why this priority**: Es el punto de entrada a todo lo demás y la base visual/estructural de la que dependen las demás historias. Sin el Hub no hay superficie sobre la que abrir los paneles superpuestos de la Historia 2.

**Independent Test**: Abrir el juego, llegar al Hub y confirmar que se ven el rango, la energía, la moneda y los cinco accesos (Batalla, Equipar, Mejorar, dock inferior) sin necesidad de navegar a otra pantalla.

**Acceptance Scenarios**:

1. **Given** el jugador completa la pantalla de Título, **When** llega al Hub, **Then** ve su rango, su energía de misión (actual/máximo) y su moneda visibles al mismo tiempo, sin desplazamiento de página.
2. **Given** el jugador está en el Hub, **When** mira el dock inferior, **Then** ve accesos a Biblioteca, Cápsula de Gatos y Almacén, cada uno con su propio ícono reconocible.
3. **Given** el jugador está en el Hub, **When** pulsa "¡Batalla!", **Then** llega al Mapa de Etapas exactamente igual que hoy pulsando "Niveles".

---

### User Story 2 - Equipar, Mejorar, Cápsula, Guías, Ajustes y Menú de Tesoros como paneles superpuestos (Priority: P1)

Un jugador que abre Equipar, Mejorar, Cápsula de Gatos, Biblioteca (Guía de Gatos/Enemigos), Ajustes o Menú de Tesoros desde el Hub ve esa función como un panel que se superpone al Hub (que queda visible de fondo, oscurecido), en vez de saltar a una pantalla nueva que reemplaza todo. Cerrar el panel lo devuelve al Hub tal como lo dejó.

**Why this priority**: Es el cambio de navegación central que pide la validación contra el Mockup — sin esto, el Hub de la Historia 1 seguiría comportándose como un menú de botones que simplemente navega a otras pantallas.

**Independent Test**: Desde el Hub, abrir cada uno de los seis paneles uno por uno, confirmar que el Hub permanece visible de fondo, realizar una acción representativa de cada panel (p. ej. mejorar una unidad) y cerrar el panel; confirmar que el resultado de la acción y el estado del Hub son correctos.

**Acceptance Scenarios**:

1. **Given** el jugador está en el Hub, **When** pulsa "Equipar", **Then** ve el panel de Equipar superpuesto al Hub (que sigue visible de fondo) y puede seleccionar su equipo exactamente igual que hoy.
2. **Given** el jugador tiene un panel superpuesto abierto (cualquiera de los seis), **When** pulsa su control de cierre, **Then** vuelve al Hub sin recargar la pantalla y sin perder energía, moneda, equipo ni progreso.
3. **Given** el jugador reclama una recompensa de rango dentro del panel de Mejorar, **When** cierra el panel y vuelve a abrirlo, **Then** la recompensa sigue marcada como reclamada, igual que con la pantalla completa actual.
4. **Given** el jugador cambia el idioma dentro del panel de Ajustes y confirma, **When** cierra el panel, **Then** el resto del Hub y de los demás paneles reflejan el nuevo idioma, igual que hoy.

---

### User Story 3 - Perfil de Jugador (Priority: P2)

Un jugador abre desde el Hub un nuevo panel "Perfil de Jugador" donde ve su rango, cuántos gatos posee sobre el total del catálogo, y un acceso directo a Ajustes.

**Why this priority**: Es una superficie nueva del Mockup sin equivalente actual; tiene valor propio pero no bloquea a las Historias 1 y 2.

**Independent Test**: Desde el Hub, abrir el Perfil de Jugador y confirmar que el rango y el conteo de colección mostrados coinciden con los que ya se ven en el panel de Mejorar.

**Acceptance Scenarios**:

1. **Given** el jugador posee algunos gatos, **When** abre el Perfil de Jugador, **Then** ve su rango actual y su colección como "X/Y gatos poseídos", con Y igual al total de gatos del catálogo.
2. **Given** el jugador está en el Perfil de Jugador, **When** pulsa el acceso a Ajustes, **Then** ve el panel de Ajustes y, al cerrarlo, vuelve al Perfil de Jugador (no directamente al Hub).

---

### User Story 4 - Buzón de Noticias (Priority: P2)

Un jugador abre desde el Hub un nuevo panel "Buzón de Noticias" con una lista de novedades del juego (título, fecha, descripción). Un indicador en el Hub le avisa cuando hay novedades no leídas, y desaparece al abrir el Buzón.

**Why this priority**: Es otra superficie nueva del Mockup, independiente del resto; da al Hub un lugar reconocible para comunicar cambios del juego.

**Independent Test**: Con novedades marcadas como no leídas, confirmar que el Hub muestra el indicador; abrir el Buzón, confirmar que se listan las novedades y que el indicador desaparece; volver al Hub y confirmar que ya no se muestra.

**Acceptance Scenarios**:

1. **Given** existen novedades no leídas, **When** el jugador ve el Hub, **Then** el acceso al Buzón de Noticias muestra un indicador visible.
2. **Given** el jugador abre el Buzón de Noticias, **When** la lista se muestra, **Then** cada novedad muestra título, fecha y descripción, ordenadas de la más reciente a la más antigua.
3. **Given** el jugador cierra el Buzón de Noticias tras abrirlo, **When** vuelve a ver el Hub, **Then** el indicador de no leídas ya no aparece.

---

### User Story 5 - Menú de Tesoros también accesible desde el Mapa de Etapas (Priority: P3)

Un jugador que está en el Mapa de Etapas puede abrir el Menú de Tesoros directamente desde ahí (como en el Mockup), sin tener que volver al Hub y entrar a Mejorar.

**Why this priority**: Es una mejora de acceso puntual sobre una función que ya existe; no bloquea ninguna otra historia.

**Independent Test**: Desde el Mapa de Etapas, abrir el Menú de Tesoros usando el nuevo acceso, confirmar que muestra el mismo progreso que el acceso existente desde Mejorar, y cerrarlo para volver al Mapa de Etapas.

**Acceptance Scenarios**:

1. **Given** el jugador está en el Mapa de Etapas, **When** pulsa el nuevo acceso a Tesoros, **Then** ve el Menú de Tesoros con el mismo progreso que muestra el acceso ya existente desde Mejorar.
2. **Given** el jugador abrió el Menú de Tesoros desde el Mapa de Etapas, **When** lo cierra, **Then** vuelve al Mapa de Etapas (no al Hub).

---

### Edge Cases

- ¿Qué pasa si el jugador intenta abrir un segundo panel superpuesto mientras ya tiene uno abierto (p. ej. pulsa Ajustes desde dentro del Perfil de Jugador)? El nuevo panel se apila sobre el anterior y cerrarlo debe volver al panel previo, no directamente al Hub (ver Historia 3, Escenario 2).
- ¿Qué pasa si el jugador no posee ningún gato todavía? Equipar, Guías y Perfil de Jugador deben mostrar el mismo estado vacío que ya muestran sus pantallas actuales.
- ¿Qué pasa si el jugador sale de una Batalla (victoria, derrota o abandono)? Debe volver al Hub, no a una pantalla intermedia distinta, preservando el flujo de recompensas ya existente.
- ¿Qué pasa si no hay novedades cargadas en el Buzón de Noticias? El panel debe mostrar un estado vacío en vez de una lista en blanco, y el indicador de no leídas no debe aparecer.
- ¿Qué pasa con el foco de teclado y el lector de pantalla al abrir o cerrar un panel superpuesto? El foco debe quedar dentro del panel mientras está abierto y debe volver al control que lo abrió al cerrarse.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE reemplazar la pantalla "Menú Principal" por un Hub persistente que muestre en todo momento el rango del jugador, la energía de misión (actual/máximo) y la moneda del jugador.
- **FR-002**: El Hub DEBE ofrecer un dock inferior con accesos directos a Biblioteca (Guías), Cápsula de Gatos y Almacén, visibles en todo momento mientras el jugador está en el Hub.
- **FR-003**: Desde el Hub, el jugador DEBE poder acceder a ¡Batalla! (Mapa de Etapas), Equipar y Mejorar como acciones destacadas, con el mismo efecto que sus equivalentes actuales del Menú Principal.
- **FR-004**: Equipar, Mejorar, Cápsula de Gatos, Biblioteca (Guía de Gatos y Guía de Enemigos), Ajustes y Menú de Tesoros DEBEN abrirse como paneles superpuestos sobre el Hub (con el Hub visible y oscurecido de fondo) en lugar de reemplazar la pantalla completa.
- **FR-005**: Cerrar cualquiera de los paneles superpuestos del FR-004 DEBE devolver al jugador a la vista desde la que lo abrió (Hub u otro panel, ver FR-013), exactamente en el mismo estado en que la dejó (energía, moneda, equipo, progreso), sin recargar ni perder selección.
- **FR-006**: Todas las acciones existentes dentro de Equipar, Mejorar, Cápsula, Guías, Ajustes y Menú de Tesoros (seleccionar equipo, mejorar unidad, tirar gacha, reclamar rango, cambiar volumen/idioma, activar/intercambiar cápsulas, etc.) DEBEN seguir produciendo exactamente el mismo resultado que antes de esta reestructuración de navegación.
- **FR-007**: El sistema DEBE añadir un nuevo panel "Perfil de Jugador" accesible desde el Hub, que muestre el rango actual del jugador, su progreso de colección (gatos poseídos / total del catálogo) y un acceso directo a Ajustes.
- **FR-008**: El sistema DEBE añadir un nuevo panel "Buzón de Noticias" accesible desde el Hub, que liste novedades del juego (título, fecha y descripción) ordenadas de la más reciente a la más antigua.
- **FR-009**: El Hub DEBE mostrar un indicador visual cuando el Buzón de Noticias tiene novedades no leídas, y ese indicador DEBE dejar de mostrarse inmediatamente después de que el jugador abra el Buzón.
- **FR-010**: El Mapa de Etapas DEBE ofrecer un acceso directo al Menú de Tesoros del capítulo activo, adicional al acceso ya existente desde Mejorar, mostrando el mismo progreso en ambos casos.
- **FR-011**: Salir de una Batalla (por victoria, derrota o abandono) DEBE devolver al jugador al Hub, preservando el flujo de recompensas ya existente.
- **FR-012**: El sistema DEBE permitir cerrar cualquier panel superpuesto mediante un control de cierre explícito visible en el propio panel.
- **FR-013**: Cuando un panel superpuesto abre a otro panel superpuesto encima (p. ej. Ajustes desde el Perfil de Jugador), cerrar el panel superior DEBE volver al panel inferior, no directamente al Hub.
- **FR-014**: Los paneles superpuestos DEBEN atrapar el foco de teclado mientras están abiertos y devolverlo al control que los abrió al cerrarse.
- **FR-015**: Ningún dato, texto visible ni nombre accesible verificado por las pruebas automatizadas existentes DEBE cambiar como resultado de esta reestructuración de navegación (mismo criterio de no regresión que specs/021-reskin-cyber-modern).
- **FR-016**: El dock inferior del Hub NO DEBE incluir accesos a Gamatoto, Tienda ni Misiones/Catnip Challenges, dado que ninguno tiene todavía una especificación funcional propia (mismo alcance excluido que specs/021-reskin-cyber-modern).
- **FR-017**: El Perfil de Jugador DEBE limitarse a mostrar rango y colección; NO DEBE introducir los indicadores "Leadership" ni "Meow Medals" del Mockup, dado que ninguno tiene todavía una mecánica ni un dato de origen especificados.
- **FR-018**: La resolución de una Batalla (Victoria/Derrota) DEBE seguir mostrándose en la pantalla "Resultado" ya existente, y no como un panel superpuesto sobre la Batalla; esta spec no cambia ese flujo.

### Key Entities *(include if feature involves data)*

- **Entrada de Noticias**: un ítem del Buzón de Noticias — título, fecha y descripción de una novedad del juego, con un estado de lectura (leída/no leída) asociado a la sesión del jugador.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un jugador puede abrir y cerrar Equipar, Mejorar, Cápsula, Biblioteca, Ajustes, Menú de Tesoros y Perfil de Jugador desde el Hub sin que el Hub deje de ser visible de fondo, en el 100% de una recorrida manual de las siete funciones.
- **SC-002**: El número de pantallas de nivel superior (que reemplazan toda la vista) necesarias para llegar a cualquier función principal del juego se reduce de las 9 actuales a un máximo de 3 (Hub, Mapa de Etapas, Batalla/Resultado).
- **SC-003**: El 100% de las acciones jugables cubiertas por las pruebas automatizadas existentes siguen produciendo el mismo resultado después de este cambio de navegación.
- **SC-004**: Un jugador puede localizar y abrir el Buzón de Noticias y el Perfil de Jugador desde el Hub sin instrucciones adicionales, guiándose solo por sus íconos.
- **SC-005**: El indicador de "no leído" del Buzón de Noticias desaparece en la misma interacción en la que el jugador lo abre, en el 100% de los casos.

## Assumptions

- El contenido del Buzón de Noticias es estático (definido junto con los datos del juego), sin backend ni sistema de mensajería en vivo — no existe ni se introduce aquí una spec de servidor para esto.
- "Colección" en el Perfil de Jugador se calcula sobre el catálogo de gatos ya existente (`CATS` / `ownedCats`), sin introducir un catálogo nuevo.
- Gamatoto, Tienda y Misiones/Catnip Challenges permanecen fuera de alcance de esta spec y siguen sin spec funcional propia, igual que los dejó specs/021-reskin-cyber-modern.
- El acceso del dock a "Almacén" abre Cápsula de Gatos directamente en su pestaña "Almacén" ya existente — no se crea una pantalla de Almacén separada.
- Mapa de Etapas y Batalla continúan siendo vistas de nivel superior independientes del Hub (no paneles superpuestos), igual que en el Mockup.
- El estado de lectura de una Entrada de Noticias es local al dispositivo/jugador (mismo mecanismo de persistencia que el resto del progreso guardado), sin sincronización entre dispositivos.
