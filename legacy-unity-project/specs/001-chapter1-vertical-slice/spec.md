# Feature Specification: Capítulo 1 — Vertical Slice Jugable

**Feature Branch**: `001-chapter1-vertical-slice`

**Created**: 2026-07-27

**Status**: Draft

**Input**: User description: "Capítulo 1 de "The Battler": la vertical slice inicial definida en la constitución — un capítulo completo jugable con diálogos pre-batalla y post-batalla ligados a esa batalla, combate automático por despliegue (recurso que se acumula con el tiempo, unidades desplegadas con coste/cooldown que actúan solas en el carril), 5 unidades jugables (cada una con animación de idle y ataque, más una variante visual), base del jugador vs base enemiga como condición de victoria/derrota, sin economía de gacha completa ni monetización."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Jugar y ganar la batalla del Capítulo 1 (Priority: P1)

Un jugador entra al Capítulo 1, despliega unidades pagando un recurso que se acumula con el tiempo, observa cómo actúan de forma autónoma en el carril, y gana la batalla al destruir la base enemiga antes de que la suya sea destruida.

**Why this priority**: Es el círculo de juego completo (core loop). Sin esto no existe producto jugable; todo lo demás (narrativa, arte, variantes) es contexto alrededor de este loop.

**Independent Test**: Puede probarse cargando directamente la escena de batalla del Capítulo 1, desplegando las 5 unidades disponibles en distintas combinaciones, y verificando que la partida termina en victoria (base enemiga a 0) o derrota (base del jugador a 0).

**Acceptance Scenarios**:

1. **Given** el jugador está en la escena de batalla con el recurso en 0, **When** pasa el tiempo, **Then** el recurso se incrementa automáticamente hasta alcanzar el coste de al menos una unidad.
2. **Given** el jugador tiene recurso suficiente para una unidad y esa unidad no está en cooldown, **When** el jugador la despliega, **Then** el recurso se descuenta, la unidad aparece en el carril y comienza a moverse/atacar sin más input del jugador.
3. **Given** una unidad fue desplegada, **When** transcurre su tiempo de cooldown, **Then** esa unidad vuelve a estar disponible para desplegar de nuevo (sujeta a tener recurso suficiente).
4. **Given** la base enemiga llega a 0 de salud antes que la del jugador, **When** esto ocurre, **Then** la batalla termina en victoria.
5. **Given** la base del jugador llega a 0 de salud antes que la enemiga, **When** esto ocurre, **Then** la batalla termina en derrota.

---

### User Story 2 - Vivir la narrativa ligada a la batalla (Priority: P2)

Antes de empezar la batalla del Capítulo 1, el jugador ve una escena de diálogo (retrato + texto) que contextualiza por qué se está peleando esa batalla específica. Al terminar la batalla en victoria, ve una escena de diálogo post-batalla que cierra ese fragmento de historia.

**Why this priority**: Es un principio no negociable de la constitución (Narrativa Integrada) — sin esto el Capítulo 1 no es una unidad de contenido válida, aunque el combate funcione. Se prioriza después del loop de combate porque depende de que exista una batalla que contextualizar.

**Independent Test**: Puede probarse iniciando el Capítulo 1 y verificando que la escena de diálogo pre-batalla se reproduce antes de que el jugador pueda desplegar unidades, y que la escena post-batalla se reproduce automáticamente tras una victoria, ambas con texto y retratos específicos del Capítulo 1 (no genéricos).

**Acceptance Scenarios**:

1. **Given** el jugador selecciona/entra al Capítulo 1, **When** la escena carga, **Then** se reproduce el diálogo pre-batalla (retrato + texto) antes de habilitar el despliegue de unidades.
2. **Given** el jugador termina la batalla en victoria, **When** la batalla concluye, **Then** se reproduce el diálogo post-batalla específico del Capítulo 1 antes de volver al menú/resumen.
3. **Given** el jugador pierde la batalla, **When** la batalla concluye en derrota, **Then** el jugador puede reintentar la batalla sin tener que volver a ver el diálogo pre-batalla completo.

---

### User Story 3 - Elegir entre 5 unidades con identidad visual propia (Priority: P3)

El jugador dispone de 5 unidades distintas para desplegar, cada una reconocible por su animación de idle, su animación de ataque y una variante visual (accesorio/vestimenta/objeto) que la diferencia de un sprite estático.

**Why this priority**: Es el diferenciador de producto frente a referentes del género (sprite estático), pero el juego es funcional y verificable primero sin esto (P1/P2 ya dan una batalla jugable con narrativa); esto pule la identidad pero no bloquea validar el loop.

**Independent Test**: Puede probarse desplegando cada una de las 5 unidades por separado y verificando visualmente que cada una tiene animación de idle propia, animación de ataque propia (distinta de una imagen fija) y al menos un elemento visual adicional visible en el carril.

**Acceptance Scenarios**:

1. **Given** una unidad está desplegada y no está atacando, **When** se observa en el carril, **Then** reproduce una animación de idle (no una imagen fija).
2. **Given** una unidad desplegada entra en rango de un objetivo, **When** ataca, **Then** reproduce una animación de ataque distinta de su animación de idle.
3. **Given** cualquiera de las 5 unidades, **When** se la compara con las otras 4, **Then** cada una es distinguible por su variante visual (vestimenta/accesorio/objeto) además de su silueta base.

---

### Edge Cases

- ¿Qué ocurre si el jugador intenta desplegar una unidad sin recurso suficiente? El despliegue debe rechazarse sin penalización y sin descontar recurso parcial.
- ¿Qué ocurre si el jugador intenta desplegar una unidad que está en cooldown? El despliegue debe rechazarse y comunicar visualmente que la unidad no está disponible todavía.
- ¿Qué ocurre si el jugador cierra la aplicación o la batalla se interrumpe a mitad de partida? La batalla en curso no se guarda; al reentrar al Capítulo 1 se reinicia desde el diálogo pre-batalla.
- ¿Qué ocurre si el jugador gana la batalla la primera vez y vuelve a jugar el Capítulo 1 después? El diálogo pre/post-batalla puede volver a reproducirse (no hay lógica de "ya visto" en esta slice) — ver Assumptions.
- ¿Qué ocurre si ambas bases llegan a 0 en el mismo tick/frame? Se resuelve como derrota del jugador (el enemigo tiene prioridad de resolución) para evitar ambigüedad en la condición de fin de partida.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE reproducir un diálogo pre-batalla (retrato + texto, en formato tipo novela visual) específico del Capítulo 1 antes de permitir el despliegue de unidades.
- **FR-002**: El sistema DEBE reproducir un diálogo post-batalla específico del Capítulo 1 al alcanzar la condición de victoria.
- **FR-003**: El sistema DEBE acumular automáticamente un recurso (Energía/Dinero) a lo largo del tiempo durante la batalla, sin requerir acción del jugador.
- **FR-004**: El jugador DEBE poder desplegar cualquiera de las 5 unidades predefinidas pagando el coste en recurso de esa unidad, siempre que tenga recurso suficiente y la unidad no esté en cooldown.
- **FR-005**: Cada unidad desplegada DEBE actuar de forma autónoma (movimiento y ataque) en el carril sin control directo adicional del jugador tras el despliegue.
- **FR-006**: El sistema DEBE rastrear la salud de la base del jugador y la salud de la base enemiga como estado central de la partida.
- **FR-007**: El sistema DEBE declarar victoria cuando la salud de la base enemiga llega a 0, y derrota cuando la salud de la base del jugador llega a 0.
- **FR-008**: Cada una de las 5 unidades DEBE tener una animación de idle y una animación de ataque distintas entre sí (no un único sprite estático).
- **FR-009**: Cada una de las 5 unidades DEBE tener al menos una variante visual adicional (vestimenta, accesorio u objeto equipable) visible durante el combate en el carril.
- **FR-010**: Las estadísticas de cada unidad (Coste, Cooldown, Salud, Daño, Rango) DEBEN vivir en assets de datos (ScriptableObjects), editables sin recompilar código.
- **FR-011**: El sistema DEBE proveer defensa/amenaza del lado enemigo (base enemiga con capacidad de generar amenaza hacia la base del jugador) para que la batalla sea un desafío real y no un despliegue sin oposición.
- **FR-012**: El Capítulo 1 DEBE estar disponible completo desde el inicio (las 5 unidades utilizables desde el primer intento), sin requerir gacha ni sistema de monetización para acceder a ellas.
- **FR-013**: El jugador DEBE poder reintentar la batalla tras una derrota sin bloqueos ni penalización que impida seguir jugando.

### Key Entities *(include if feature involves data)*

- **Unidad (Unit)**: Personaje jugable desplegable. Atributos: coste, cooldown, salud, daño, rango, animación de idle, animación de ataque, variante visual. Vive como ScriptableObject.
- **Base del Jugador / Base Enemiga**: Objetivo de victoria/derrota. Atributos: salud actual, salud máxima (la base del jugador incluye torre/cañón de recarga lenta según la constitución).
- **Recurso de Batalla (Energía/Dinero)**: Valor numérico que se acumula con el tiempo y se gasta al desplegar unidades; su tasa de regeneración es mejorable durante la partida.
- **Diálogo Pre-Batalla / Post-Batalla**: Secuencia narrativa (retratos + texto + Timeline) ligada específicamente al Capítulo 1, no reutilizable genéricamente entre capítulos.
- **Capítulo 1 (Chapter)**: Unidad de contenido que agrupa la narrativa pre/post, la configuración de la batalla (unidades disponibles, configuración de la base enemiga) y la condición de victoria/derrota.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un jugador nuevo puede completar el recorrido completo del Capítulo 1 (diálogo pre-batalla → batalla → diálogo post-batalla) en una sola sesión sin ayuda externa.
- **SC-002**: En una batalla de duración media, el jugador realiza al menos 10 despliegues de unidades en total, evidenciando que el ciclo recurso-despliegue-cooldown mantiene al jugador tomando decisiones de forma continua (no una única acción y esperar).
- **SC-003**: Al menos el 90% de los jugadores que terminan una batalla (victoria o derrota) identifican correctamente, sin instrucciones adicionales, que el objetivo era destruir la base enemiga antes de que destruyeran la suya.
- **SC-004**: Un jugador puede distinguir visualmente las 5 unidades entre sí (por animación y variante visual) sin necesidad de leer un nombre o tooltip, en una prueba de reconocimiento visual.
- **SC-005**: El balance de las 5 unidades (coste, cooldown, salud, daño, rango) puede ajustarse y probarse en una nueva partida sin recompilar el proyecto.

## Assumptions

- El Capítulo 1 de esta vertical slice es una única batalla/mapa (no una secuencia de múltiples combates encadenados); "capítulo completo" se interpreta como una batalla con narrativa pre y post, consistente con el alcance de MVP definido en la constitución (Principio VI).
- La base enemiga genera amenaza mediante un sistema de oleadas de unidades enemigas predefinidas y/o ataques de una torre enemiga (datos también en ScriptableObjects), en paralelo al sistema de despliegue del jugador, para que exista un desafío real sin necesitar una IA compleja de "jugador enemigo".
- Las 5 unidades están disponibles desde el inicio del Capítulo 1 (no hay desbloqueo progresivo dentro del propio capítulo); el sistema de desbloqueo por capítulos (Principio IV) aplica entre capítulos futuros, no dentro de esta slice de un solo capítulo.
- No existe sistema de guardado de progreso a mitad de batalla en esta slice; reintentar significa reiniciar la batalla desde su estado inicial.
- No se implementa gacha real ni monetización en esta slice (Principio VI); las 5 unidades no se "obtienen", ya están disponibles como parte del contenido base del Capítulo 1.
- El idioma de los diálogos y la UI de esta primera slice es español, consistente con el idioma de la constitución y de esta spec.
