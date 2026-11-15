# Feature Specification: Animaciones de Evento

**Feature Branch**: `044-animaciones-de-evento`

**Created**: 2026-11-15

**Status**: Draft

**Input**: Spec 044 de `docs/art/investigacion-pipeline-arte-ia.md` (§5.2, filas 3–6, y tabla de specs propuestas). Cuatro animaciones de cuerpo completo, sin arte nuevo, para todas las unidades (con sprite o con diseño cartoon): **Golpeado** (destello y sacudida breves al recibir daño), **Muerte** (salto, giro y desvanecimiento que reemplaza al encogimiento actual del eco), **Aparición** (salto desde el suelo con aplastamiento al desplegarse o aparecer) y **Retroceso** (deslizamiento hacia atrás con inclinación cuando un empujón desplaza a la unidad). Sin re-render por tick, respetando «reducir movimiento» y la biblia de arte.

**Relación con el proyecto existente**: completa 4 de las 6 animaciones por unidad que recomienda la investigación (§5.3); Marcha y Ataque por esqueleto quedan para la spec 043 (rig de recortes), cuyo número queda reservado. Estas cuatro no dependen del rig: actúan sobre el cuerpo completo, así que valen hoy para sprites y diseños cartoon, y seguirán valiendo cuando el rig llegue. Extiende `specs/003-identidad-visual-animada` (animación por transformaciones y eco de muerte), `specs/021-reskin-cyber-modern` (efecto de impacto), `specs/039-habilidades-control-defensa` y `specs/041-cabezas-de-canon` (empujón) y `specs/042-unidades-mundo-cartoon` (dibujo cartoon, anillo de equipo, eco apagado). Respeta la Constitución § III y § VI y la biblia de arte §1 (ningún estado parpadea más de 3 veces por segundo; con «reducir movimiento» no hay pulsos). No cambia ninguna regla de combate, estadística ni balance.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver qué unidad recibe cada golpe (Priority: P1)

Un jugador mira una pelea en la que varias unidades se golpean a la vez y distingue al instante cuál acaba de recibir daño: su cuerpo destella y tiembla durante un instante, sin dejar de verse como es.

**Why this priority**: es la reacción más frecuente del combate y hoy no existe: solo aparecen chispas doradas y un número flotante, que no dicen qué cuerpo encajó el golpe cuando varias unidades se solapan. Es lo que más mejora la sensación de impacto.

**Independent Test**: enfrentar dos unidades cualesquiera y comprobar que cada golpe que les quita vida (o escudo) produce un destello y una sacudida breves en el cuerpo golpeado, y que un golpe esquivado no produce nada.

**Acceptance Scenarios**:

1. **Given** una unidad viva, **When** recibe un golpe que le quita vida, **Then** su cuerpo destella hacia el blanco y tiembla horizontalmente durante 0,15 s como máximo, y después vuelve exactamente a su aspecto normal.
2. **Given** una unidad con escudo activo, **When** un golpe solo le quita escudo, **Then** reacciona igual que si perdiera vida.
3. **Given** una unidad que esquiva un golpe, **When** el golpe se anula, **Then** no reacciona.
4. **Given** una unidad que recibe muchos golpes seguidos (varios atacantes), **When** se observa durante un segundo, **Then** no destella más de 3 veces en ese segundo.
5. **Given** una unidad golpeada, **When** reacciona, **Then** su anillo de equipo no tiembla ni destella, y las chispas y el número de daño siguen apareciendo como hoy.
6. **Given** un golpe letal, **When** la unidad muere, **Then** no se reproduce la reacción de golpe: se reproduce la muerte (Historia 2).

---

### User Story 2 - Una muerte que se siente como derrota (Priority: P1)

Un jugador ve morir a una unidad y, en lugar de encogerse en su sitio, la unidad sale despedida con un pequeño salto hacia atrás, gira y se desvanece.

**Why this priority**: la muerte es el momento de recompensa del combate; hoy el encogimiento es plano y casi invisible a 14–44 px. Va junto a la Historia 1 como la mejora de sensación más visible.

**Independent Test**: derrotar unidades aliadas y enemigas, con sprite y con diseño, y comprobar que cada eco salta hacia su propia base, gira, se desvanece en menos de medio segundo y no deja nada en pantalla.

**Acceptance Scenarios**:

1. **Given** una unidad que muere, **When** se muestra su eco, **Then** salta hacia atrás (hacia su propia base), gira en ese mismo sentido y se desvanece por completo en 0,45 s, sin encogerse hasta desaparecer.
2. **Given** un aliado y un enemigo que mueren, **When** se comparan sus ecos, **Then** cada uno sale despedido hacia su propia base (el aliado hacia la izquierda, el enemigo hacia la derecha).
3. **Given** el eco de una unidad con diseño cartoon, **When** se muestra, **Then** conserva el tono apagado y la ausencia de anillo de la spec 042.
4. **Given** el eco de una unidad con sprite, **When** se muestra, **Then** usa su primer fotograma de reposo, como hoy, con la nueva animación.
5. **Given** la batalla termina mientras hay ecos, **When** cambia el estado de la batalla, **Then** los ecos desaparecen como hoy.

---

### User Story 3 - Ver llegar a cada unidad (Priority: P2)

Un jugador despliega una unidad, o aparece una oleada, un refuerzo o una invocación, y la ve entrar al campo con un pequeño salto: aparece aplastada contra el suelo, se estira en el aire y aterriza con su forma normal.

**Why this priority**: da presencia al despliegue (la acción principal del jugador) y señala las apariciones enemigas, pero no aporta información de combate nueva.

**Independent Test**: desplegar un aliado, esperar una oleada enemiga y provocar una invocación al morir, y comprobar que cada nueva unidad hace la animación de aparición una sola vez, en 0,3 s, sin retrasar su avance.

**Acceptance Scenarios**:

1. **Given** el jugador despliega una unidad, **When** aparece en el campo, **Then** surge aplastada, se estira con un pequeño salto y aterriza con su forma y tamaño normales en 0,3 s.
2. **Given** aparece un enemigo de oleada, un refuerzo o una unidad invocada, **When** entra al campo, **Then** hace la misma animación de aparición.
3. **Given** una unidad que aparece, **When** se reproduce la animación, **Then** la unidad avanza y combate desde el primer instante como hoy (la animación no retrasa nada del combate).
4. **Given** una unidad que aparece, **When** se reproduce la animación, **Then** su anillo de equipo surge a la vez que el cuerpo, quieto en el suelo.
5. **Given** una unidad golpeada durante su aparición, **When** reacciona, **Then** ambas animaciones se combinan sin saltos bruscos.

---

### User Story 4 - Ver el empujón en vez de un salto instantáneo (Priority: P2)

Un jugador ve a una unidad empujada (por la habilidad de empujón o por el cañón) deslizarse hacia atrás con una ligera inclinación, en lugar de teletransportarse.

**Why this priority**: hoy el empujón mueve a la unidad de golpe, que se percibe como un fallo gráfico. Afecta solo a algunas unidades y al cañón, por eso va después.

**Independent Test**: enfrentar al Gato Empujón contra un enemigo (o disparar el cañón con cabeza de empujón) y comprobar que el enemigo empujado se desliza hasta su nueva posición en 0,25 s, inclinado hacia atrás, sin saltar de golpe.

**Acceptance Scenarios**:

1. **Given** una unidad empujada, **When** el combate la desplaza hacia su base, **Then** se desliza visualmente desde donde estaba hasta su nueva posición en 0,25 s, con un pequeño salto y una inclinación hacia atrás de 10° como máximo, y termina exactamente en la posición del combate.
2. **Given** una unidad empujada de nuevo mientras aún se desliza, **When** recibe el segundo empujón, **Then** el deslizamiento continúa desde donde se ve en ese momento, sin saltos.
3. **Given** una unidad empujada, **When** se desliza, **Then** su anillo de equipo la acompaña por el suelo, sin inclinarse ni saltar.
4. **Given** una unidad inmune al empujón, **When** el combate no la desplaza, **Then** no hay animación de retroceso.

---

### Edge Cases

- **«Reducir movimiento» activado**: ninguna de las cuatro animaciones desplaza, inclina, gira ni escala el cuerpo. La aparición y la muerte pasan a un simple fundido (aparece / se desvanece en el sitio, misma duración); el empujón coloca a la unidad en su nueva posición sin deslizarse, como hoy; el golpe no destella ni tiembla (las chispas y el número de daño, que son información, se mantienen).
- **Golpes más frecuentes que 3 por segundo** (refuerzo de fila, golpes múltiples, área): la reacción se omite hasta que pasa 1/3 s desde la anterior; el daño no cambia.
- **Unidad que muere mientras se desliza por un empujón**: el eco parte de la posición de combate de la unidad (el final del deslizamiento).
- **Empujón y golpe en el mismo instante** (el empujón siempre llega con un golpe): ambas animaciones se combinan.
- **Batalla en pausa**: las animaciones ya iniciadas terminan (como hoy el eco de muerte y el reposo siguen en pausa); no se inicia ninguna nueva porque el combate no avanza.
- **Velocidad de batalla ×2 o ×3**: las animaciones mantienen su duración en tiempo real; el combate no se ve afectado.
- **Unidad con sprite que aún carga o cuyo sprite falló**: las animaciones se aplican igual al cuerpo que se muestre.
- **Unidades de 14 px y de 44 px**: los desplazamientos son pequeños (pocos píxeles) y la unidad nunca sale de su carril ni tapa a otra más que hoy.
- **Muchas unidades simultáneas**: sin degradación perceptible de fluidez respecto a antes de esta spec.
- **Torres de base**: fuera de alcance; su reacción al daño no cambia.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Toda unidad viva que pierda vida o escudo por un golpe y siga viva DEBE reproducir la reacción **Golpeado**: un destello del cuerpo hacia el blanco y una sacudida horizontal de pocos píxeles que terminan en 0,15 s como máximo, tras lo cual el cuerpo vuelve exactamente a su aspecto normal.
- **FR-002**: Una unidad NO DEBE iniciar más de 3 reacciones Golpeado por segundo; un golpe que llega antes de 1/3 s desde el inicio de la anterior no inicia otra. Un golpe esquivado o un golpe letal NO DEBEN iniciar la reacción.
- **FR-003**: El eco de una unidad que muere DEBE reproducir la animación **Muerte**: un salto corto hacia su propia base, un giro en ese mismo sentido y un desvanecimiento total en 0,45 s, sustituyendo al encogimiento actual. DEBE conservar el tono apagado y la ausencia de anillo de la spec 042, y el primer fotograma de reposo en las unidades con sprite.
- **FR-004**: Toda unidad que entre al campo (despliegue del jugador, oleada, refuerzo o invocación) DEBE reproducir una vez la animación **Aparición**: surge aplastada y semitransparente, se estira con un pequeño salto y aterriza opaca con su forma y tamaño normales en 0,3 s. Su anillo de equipo DEBE surgir a la vez, sin moverse del suelo.
- **FR-005**: Toda unidad desplazada hacia su propia base por el combate (empujón por habilidad o por el cañón) DEBE reproducir la animación **Retroceso**: deslizarse desde la posición en que se veía hasta su nueva posición de combate en 0,25 s, con un pequeño salto y una inclinación hacia atrás de 10° como máximo. Un nuevo empujón durante el deslizamiento DEBE continuar desde la posición visible. El anillo DEBE seguir la posición horizontal del cuerpo sin saltar ni inclinarse.
- **FR-006**: Las animaciones DEBEN combinarse con el reposo y el ataque actuales y entre sí sin saltos bruscos; al terminar todas, la unidad DEBE verse exactamente como hoy en la misma situación. La inclinación total del cuerpo NO DEBE superar ~11,5° (0,2 rad).
- **FR-007**: Con la preferencia del sistema «reducir movimiento», ninguna animación de evento DEBE desplazar, inclinar, girar, escalar ni hacer destellar el cuerpo: Aparición y Muerte se reducen a un fundido de opacidad de la misma duración, Retroceso coloca la unidad directamente en su nueva posición y Golpeado no se reproduce.
- **FR-008**: Las animaciones NO DEBEN cambiar ninguna regla de combate, estadística, posición de combate, tiempo, coste ni balance; el motor de combate NO DEBE modificarse para producirlas (se deducen de los cambios de vida, escudo, posición y presencia de las unidades entre fotogramas).
- **FR-009**: Las animaciones NO DEBEN provocar re-renderizados de la interfaz por cada tick de combate ni redibujar los cuerpos por fotograma (Constitución § VI); solo cambian transformaciones, opacidad y, durante el destello, un efecto de color compartido.
- **FR-010**: Las chispas, el número de daño, la barra de vida y el anillo de equipo DEBEN conservar su comportamiento actual, salvo lo que FR-004 y FR-005 dicen del anillo.
- **FR-011**: Los tiempos y amplitudes de las cuatro animaciones DEBEN definirse en un único lugar y estar cubiertos por pruebas automáticas que verifiquen duración, inicio, final en la pose normal, sentido según el bando, límite de 3 reacciones por segundo y comportamiento con «reducir movimiento».

### Key Entities *(include if feature involves data)*

- **Animación de evento**: reacción visual de cuerpo completo, de duración fija, que se superpone al reposo o al ataque; tiene un disparador (golpe, muerte, aparición o empujón), una duración y una pose que varía de su inicio a su final. No es estado de combate ni se guarda.
- **Pose de evento**: desplazamiento horizontal y vertical, escala, inclinación, opacidad y destello aplicados al cuerpo en un instante dado de una animación.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100 % de los golpes no letales que quitan vida o escudo a una unidad producen una reacción visible, salvo los omitidos por el límite de 3 por segundo; 0 golpes esquivados producen reacción.
- **SC-002**: Ninguna unidad destella más de 3 veces en ningún segundo de batalla.
- **SC-003**: El 100 % de las unidades que entran al campo (despliegue, oleada, refuerzo, invocación) hacen la aparición una sola vez, y su avance empieza en el mismo instante que antes de esta spec.
- **SC-004**: El 100 % de los ecos de muerte salen hacia la base de su bando y desaparecen en 0,45 s o menos.
- **SC-005**: Ninguna unidad empujada cambia de posición de golpe: el desplazamiento visible se reparte en 0,25 s y termina en la posición exacta de combate.
- **SC-006**: Con «reducir movimiento», 0 animaciones de evento producen desplazamiento, giro, inclinación, escala o destello.
- **SC-007**: El motor de combate no cambia (0 archivos modificados en él) y la suite de motor, combate y balance pasa sin modificaciones.
- **SC-008**: Una batalla con 40 unidades simultáneas en combate se percibe igual de fluida que antes de esta spec.
- **SC-009**: La comprobación de tipos, el linter y toda la suite de pruebas pasan sin errores.

## Assumptions

- **Duraciones elegidas**: Golpeado 0,15 s, Muerte 0,45 s (dentro del rango 0,35–0,5 s de la investigación), Aparición 0,3 s y Retroceso 0,25 s. Se afinan en el plan sin cambiar el comportamiento descrito.
- **El destello no es un estado**: la biblia (§1) prohíbe teñir u oscurecer a las unidades para mostrar *estados*; el destello es una reacción de 0,15 s a un *evento*, aclara (no oscurece), y está limitado a 3 por segundo, en línea con la regla de parpadeo de la biblia.
- **Tiempo real**: las animaciones avanzan con el tiempo de pantalla (como el reposo y el eco actuales), no con la velocidad de la batalla.
- **Detección sin motor**: golpe = bajada de vida o escudo entre dos fotogramas; empujón = desplazamiento hacia la propia base (las unidades nunca caminan hacia atrás); aparición = la unidad entra en la lista de vivas; muerte = sale de ella. Es el mismo patrón con el que hoy se disparan el eco y las chispas.
- **«Reducir movimiento»**: se lee de la preferencia del sistema operativo/navegador; no hay ajuste propio en el juego.
- **Numeración**: la investigación reserva la 043 para el rig de recortes; esta spec usa la 044 a petición del usuario, aunque la 043 aún no exista.
- **Fuera de alcance**: Marcha y Ataque por esqueleto (spec 043), estados alterados (congelado, lento, débil, maldito), efectos de habilidad (rotura de escudo, invocación, esquiva), animación de victoria, reacciones de las torres de base, sonido y cualquier arte nuevo.
- **Dependencias**: `docs/art/investigacion-pipeline-arte-ia.md` §5, `docs/art/art-bible.md` §1, y las specs 003, 021, 039, 041 y 042.
