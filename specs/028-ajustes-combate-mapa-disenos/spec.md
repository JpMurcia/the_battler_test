# Feature Specification: Ajustes Post-Revisión — Combate por Refuerzo de Fila, Pestañas de Mapa y Diseños Procedurales

**Feature Branch**: `028-ajustes-combate-mapa-disenos`

**Created**: 2026-08-24

**Status**: Draft

**Input**: User description: "Ajustes tras primera revisión jugable: combate simultáneo por fila, mapa de etapas con pestañas de región + scroll, y diseños procedurales distintos para las 30 unidades de specs/027-capitulo-1-imperio-gatos."

**Nota de origen**: el usuario jugó la build resultante de `specs/027-capitulo-1-imperio-gatos` y reportó 3 problemas concretos, cada uno investigado y con su decisión de diseño ya validada en conversación antes de escribir esta spec (ver Assumptions para el detalle técnico de cada decisión). No se añade contenido nuevo (gatos/niveles/enemigos) — es puro ajuste de mecánica/presentación sobre lo ya construido en `specs/001` a `specs/027`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Varias unidades apiladas pelean a la vez, no solo la del frente (Priority: P1)

Un jugador despliega varias unidades que avanzan y se apilan detrás de la primera en tocar a un enemigo. En vez de que las de atrás se queden inmóviles esperando a que la del frente gane o muera, todas las que están bloqueadas en la fila (directamente o en cadena) atacan a ese mismo enemigo en el mismo instante.

**Why this priority**: Es el problema más señalado por el jugador — con equipos de hasta 6 unidades, ver a 5 quietas sin hacer nada mientras 1 pelea se siente roto; es el cambio de mayor impacto en la sensación de juego.

**Independent Test**: Desplegar 3 aliados en el mismo punto de entrada contra 1 enemigo fuerte; confirmar que, en el tick en que el segundo y tercer aliado quedan bloqueados detrás del primero (ya trabado en combate), ambos también infligen daño a ese enemigo ese mismo tick — no en un tick posterior.

**Acceptance Scenarios**:

1. **Given** un aliado A trabado en combate contra un enemigo X, **When** un aliado B queda bloqueado justo detrás de A (no puede avanzar más), **Then** B se suma al combate contra X ese mismo tick, infligiendo su propio daño según su propio cooldown.
2. **Given** una cadena de 3 aliados (A trabado contra X, B bloqueado detrás de A, C bloqueado detrás de B), **When** se resuelve el tick, **Then** los 3 (A, B y C) infligen daño a X ese mismo tick.
3. **Given** el enemigo X recibe daño de A, B y C en el mismo tick, **When** se evalúa su propio ataque de vuelta, **Then** X contraataca como máximo una vez ese tick (gobernado por su propio cooldown), nunca una vez por cada aliado que le pega.
4. **Given** A muere en medio de la resolución del tick (por el contraataque de X u otro efecto), **When** B y C ya tenían su ataque de ese tick en curso contra X, **Then** el daño de B y C hacia X se aplica igual — no se cancela porque A haya muerto ese mismo tick.
5. **Given** un aliado D que NO está bloqueado por ningún aliado trabado en combate (tiene su propio objetivo distinto, o está libre para avanzar), **When** se resuelve el tick, **Then** D se comporta exactamente igual que hoy (busca su propio objetivo o avanza) — el refuerzo de fila no lo afecta.

---

### User Story 2 - El mapa de etapas se organiza por pestañas de región, sin amontonar todos los nodos (Priority: P1)

Un jugador abre "Niveles" y ve pestañas para cambiar entre grupos de etapas (por ejemplo, las etapas originales y las 48 del Capítulo 1), en vez de los más de 50 nodos amontonados en un único lienzo. Cada pestaña muestra solo sus propios nodos, en un área que permite desplazamiento si no caben todos a la vez, sin que ningún nodo quede encimado con otro.

**Why this priority**: Es el segundo problema más señalado — el mapa actual es, en palabras del jugador, "horrendo" con el volumen de contenido actual; sin esto, el Capítulo 1 completo es visualmente inutilizable.

**Independent Test**: Abrir "Niveles" con el Capítulo 1 desbloqueado, confirmar que existen al menos 2 pestañas, que cambiar de pestaña cambia qué nodos se ven, y que dentro de la pestaña del Capítulo 1 los 48 nodos son navegables (con desplazamiento) sin superponerse visualmente.

**Acceptance Scenarios**:

1. **Given** el jugador abre el mapa de etapas, **When** la pantalla carga, **Then** ve pestañas que agrupan los niveles por región, con la primera pestaña seleccionada por defecto.
2. **Given** el jugador toca una pestaña distinta, **When** cambia, **Then** el mapa muestra únicamente los nodos de los niveles de esa región, con sus líneas conectoras propias.
3. **Given** una pestaña con más nodos de los que caben en el área visible, **When** el jugador se desplaza (scroll), **Then** puede ver y tocar todos los nodos de esa pestaña sin que ninguno quede oculto o superpuesto con otro.
4. **Given** un nivel bloqueado en cualquier pestaña, **When** el jugador lo toca, **Then** se comporta exactamente igual que hoy (sin efecto) — cambiar de pestaña es puramente presentación, no altera qué está bloqueado/disponible/completado.
5. **Given** un banner de evento especial activo, **When** el jugador navega cualquier pestaña, **Then** el nodo del evento sigue visible fuera de la cadena de pestañas, igual que hoy.

---

### User Story 3 - Las unidades nuevas del Capítulo 1 se ven distintas entre sí (Priority: P2)

Un jugador que despliega o consulta distintas unidades del Capítulo 1 en batalla o en la Guía de Gatos/Enemigos las distingue a simple vista por su forma y un rasgo característico, en vez de ver el mismo cuerpo genérico repetido con solo el tamaño o el tono de color cambiando.

**Why this priority**: Tercer problema señalado; de menor urgencia que los dos anteriores porque no bloquea la jugabilidad, solo la claridad visual — pero afecta a las 30 unidades nuevas del capítulo, un volumen de contenido considerable.

**Independent Test**: Desplegar en batalla, en sesiones de prueba distintas, 3 unidades nuevas de roles claramente distintos (por ejemplo, una de área, una de alcance largo y el jefe final) y confirmar que sus siluetas/colores/rasgos son distinguibles entre sí a simple vista, sin dos compartiendo exactamente la misma combinación.

**Acceptance Scenarios**:

1. **Given** cualquiera de las 30 unidades nuevas de `specs/027`, **When** aparece en batalla o en las bibliotecas de consulta, **Then** se renderiza con una forma/color/rasgo derivados de un diseño propio, no del cuerpo genérico compartido que usa hoy.
2. **Given** dos unidades nuevas cualesquiera del capítulo, **When** se comparan sus diseños, **Then** no comparten la combinación exacta de forma base + rasgo distintivo + color.
3. **Given** una unidad que sí tiene `spriteKey` real (ninguna de las 30 nuevas lo tiene, pero una unidad fixture futura podría), **When** se renderiza, **Then** el sprite real sigue teniendo prioridad sobre cualquier diseño procedural — esta historia no cambia el orden de prioridad ya existente.
4. **Given** una unidad no cubierta por ningún diseño (fixture antiguo sin `ProceduralDesign` ni `spriteKey`), **When** se renderiza, **Then** sigue cayendo en el mismo cuerpo genérico de hoy — esta historia no le quita su comportamiento actual a nada que no sea las 30 unidades nuevas.

---

### Edge Cases

- Más de 2 unidades apiladas contra un mismo objetivo cuyo `hp` no alcanza para todas: el objetivo muere en cuanto su `hp` llega a 0 durante la resolución secuencial del tick; los ataques restantes de esa cadena sobre ese objetivo ya muerto no aplican daño adicional (comportamiento ya garantizado por `applyDamageSequence`, sin cambio necesario).
- Un aliado bloqueado en cadena cuyo aliado bloqueador es, a su vez, un atacante de tipo Área con objetivos de salpicadura: el aliado en cadena se suma solo al objetivo primario del bloqueador, nunca a los objetivos de salpicadura (Historia 1, regla explícita).
- Una pestaña de región sin ningún nivel disponible/desbloqueado todavía (todos bloqueados): se muestra igual, con todos sus nodos en estado bloqueado — no se oculta la pestaña.
- Dos regiones con el mismo nombre visible pero `Level.region` distinto (no debería ocurrir con el contenido actual): cada valor distinto de `region` es su propia pestaña, sin fusión automática por nombre.
- Una unidad nueva del capítulo cuyo rol no tiene un rasgo distintivo evidente que representar: usa una combinación de forma base + color ya distinguible de las demás, sin necesitar un rasgo nuevo si no aporta claridad adicional (ver Assumptions sobre el catálogo de rasgos).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE permitir que, dentro de un mismo paso de simulación, más de una unidad del mismo equipo inflija daño al mismo objetivo enemigo cuando esas unidades están bloqueadas en fila (directa o transitivamente) detrás de una unidad ya trabada en combate contra ese objetivo.
- **FR-002**: Una unidad que se suma por bloqueo en fila DEBE atacar únicamente al objetivo primario de la unidad que la bloquea — nunca a los objetivos de salpicadura de un atacante de tipo Área, y nunca buscando un objetivo propio distinto.
- **FR-003**: El objetivo enemigo que recibe daño de varias unidades en el mismo paso de simulación NO DEBE poder contraatacar más de una vez en ese mismo paso, sin importar cuántas unidades le hayan infligido daño.
- **FR-004**: El sistema DEBE resolver cadenas de cualquier longitud (una unidad bloqueada por otra que a su vez está bloqueada por la trabada en combate original), sin límite máximo de unidades acumulables sobre un mismo objetivo.
- **FR-005**: Una unidad que no está bloqueada por ninguna unidad trabada en combate DEBE comportarse exactamente igual que hoy (búsqueda de objetivo propio, ataque a base, o avance libre) — el refuerzo de fila no debe alterar ningún otro camino de decisión existente.
- **FR-006**: El sistema DEBE agrupar la selección de niveles en pestañas según `Level.region`, mostrando en cada momento únicamente los nodos de la región seleccionada.
- **FR-007**: El sistema DEBE permitir desplazamiento (scroll) dentro del área de nodos de una pestaña cuando su contenido no cabe en el espacio visible, sin que ningún nodo quede superpuesto con otro de forma que impida distinguirlos o tocarlos.
- **FR-008**: Cambiar de pestaña NO DEBE alterar ningún estado de progreso (bloqueado/disponible/completado) de ningún nivel — es una decisión puramente de presentación/filtrado.
- **FR-009**: El nodo de la fase especial de un banner de evento activo DEBE seguir visible fuera de la cadena de pestañas, en cualquier pestaña que el jugador tenga seleccionada — mismo criterio ya vigente (`specs/023` FR-008).
- **FR-010**: El sistema DEBE definir un diseño visual procedural propio (forma base, color, rasgo distintivo) para cada una de las 30 unidades nuevas de `specs/027-capitulo-1-imperio-gatos`, reutilizando el mecanismo ya existente para el catálogo semilla — sin requerir ningún sprite/arte importado.
- **FR-011**: El sistema DEBE resolver el diseño visual de una unidad respetando el orden de prioridad ya existente: sprite real (`spriteKey`) primero, luego diseño procedural propio, luego el cuerpo genérico de respaldo — sin alterar ese orden para ninguna unidad ya existente antes de esta spec.
- **FR-012**: Dos unidades cualesquiera de las 30 nuevas NO DEBEN compartir exactamente la misma combinación de forma base + rasgo distintivo + color primario.

### Key Entities *(include if feature involves data)*

- **Refuerzo de fila** (no es una entidad nueva de datos — es una regla de resolución dentro de `stepSimulation`): extiende `engagements` con entradas adicionales cuyo `attackerId` es una unidad bloqueada y cuyo `targetIds` reutiliza el objetivo primario de la unidad que la bloquea.
- **Pestaña de región** (derivada, no persistida): agrupación de `Level`/`StageNode` por `Level.region` para la presentación del mapa de etapas.
- **Diseño procedural de unidad** (extiende el mecanismo ya existente de `ProceduralDesign`, `specs/022`): un registro nuevo que asocia cada una de las 30 unidades nuevas con su propia forma base, color y rasgo distintivo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En una batalla de prueba con 3 aliados apilados contra 1 enemigo, al menos 2 de los 3 aliados infligen daño visible a ese enemigo en el mismo paso de simulación, y el enemigo nunca contraataca más de una vez en ese paso.
- **SC-002**: El mapa de etapas muestra al menos 2 pestañas de región, y navegar cualquiera de ellas permite ver y tocar el 100% de sus nodos sin superposición visual, con o sin desplazamiento según haga falta.
- **SC-003**: Ninguna acción de esta spec cambia qué niveles están bloqueados/disponibles/completados respecto al comportamiento anterior — 0 regresiones sobre `specs/005`/`specs/023`.
- **SC-004**: Las 30 unidades nuevas de `specs/027` se distinguen visualmente entre sí (ninguna combinación de forma+rasgo+color repetida) en una revisión manual en navegador.
- **SC-005**: `npx tsc -b` limpio y `npm test` en verde, sin regresión en ninguna suite existente.

## Assumptions

- **Combate (Historia 1)**: el diseño técnico ya fue validado durante el análisis previo a esta spec — `resolveEngagement(attacker, defender, deltaSeconds)` puede invocarse varias veces sobre el mismo defensor dentro del mismo `stepSimulation`, cada vez leyendo el estado ya actualizado del defensor; el defensor solo llega a contraatacar en la primera invocación en que su cooldown esté listo (se resetea tras disparar), y el corte por `defender.hp <= 0` ya existe en `applyDamageSequence` — no se requiere ningún cambio en `src/engine/combat.ts`, solo en la fase de detección de `src/engine/simulation.ts` que arma `engagements`/`freeMovers`.
- Esta spec redefine el Core Principle I de la Constitución del proyecto ("Combate Automático por Despliegue"), que hoy se interpreta como exactamente un atacante activo por objetivo — se documentará la nueva regla de "refuerzo de fila" ahí, con el incremento de versión MAJOR que exige la Governance de la propia Constitución.
- No hay tope máximo de unidades que pueden apilarse sobre un mismo objetivo (FR-004) — decisión consciente para no introducir una regla de negocio no pedida; si en la práctica esto resulta desbalanceado, es ajuste de valores futuro, no de esta spec.
- **Mapa (Historia 2)**: las pestañas se derivan de `Level.region` tal cual existe hoy (sin nuevo campo de agrupación) — con el contenido actual esto produce al menos una pestaña para los niveles fixture y otra para el Capítulo 1 de `specs/027`. La disposición exacta de columnas/filas dentro de cada pestaña (Decisión de `specs/027` research.md) puede ajustarse si hace falta para que quepa bien en el nuevo contenedor con scroll — el jugador autorizó explícitamente mover `mapPosition` si es necesario.
- **Diseños (Historia 3)**: el catálogo de valores posibles para el rasgo distintivo puede ampliarse más allá de los 5 actuales (`'cat-ears' | 'fangs' | 'fin' | 'crest' | 'none'`) si hace falta variedad suficiente para 30 unidades con roles muy distintos — la decisión exacta (ampliar el enum vs. combinar los 5 existentes con más variación de forma/color) se toma en `plan.md`, no es un requisito bloqueante de esta spec.
- Esta spec no toca ninguna mecánica de `specs/001` a `specs/026` más allá de lo descrito arriba, no añade contenido nuevo (gatos/niveles/enemigos), no implementa un selector de saga completo como el mockup original (solo pestañas de región simples), y no introduce ningún arte importado — sigue siendo 100% procedural.
