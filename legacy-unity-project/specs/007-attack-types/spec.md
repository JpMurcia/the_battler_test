# Feature Specification: Sistema de Tipos de Ataque ("Attack Types")

**Feature Branch**: `007-attack-types`

**Created**: 2026-07-28

**Status**: Draft

**Input**: User description: "Sistema de tipos de ataque (\"Attack Types\") para las unidades de \"The Battler\": cada unidad y cada enemigo declara un tipo de ataque en su ScriptableObject de datos (extendiendo el definido en 001-chapter1-vertical-slice), que determina qué puede recibir daño de esa unidad, siguiendo la referencia de https://battlecats.miraheze.org/wiki/Special_Abilities (sección Attack Types). No incluye habilidades de trait-targeting, neutral abilities ni inmunidades en esta fase."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Un ataque de área daña a varios enemigos a la vez (Priority: P1)

Un jugador observa que una unidad con tipo de ataque "Ataque de Área" inflige daño simultáneamente a todos los enemigos agrupados dentro de su alcance, no solo al más cercano.

**Why this priority**: Es el comportamiento más distintivo y visible del sistema — sin él, los tipos de ataque no aportan ninguna diferencia táctica observable en batalla.

**Independent Test**: En una batalla con varios enemigos agrupados dentro del alcance de una unidad con "Ataque de Área", desplegarla y confirmar que todos los enemigos en rango reciben daño en el mismo ataque, no solo uno.

**Acceptance Scenarios**:

1. **Given** varios enemigos están agrupados dentro del alcance de una unidad con "Ataque de Área", **When** la unidad ataca, **Then** todos esos enemigos reciben daño en el mismo ataque.
2. **Given** solo un enemigo está dentro del alcance de una unidad con "Ataque de Área", **When** la unidad ataca, **Then** ese único enemigo recibe daño con normalidad.

---

### User Story 2 - Un ataque único solo golpea a un enemigo a la vez (Priority: P1)

Un jugador observa que una unidad con tipo de ataque "Ataque Único" solo daña a un enemigo por ataque, incluso si hay más de uno dentro de su alcance.

**Why this priority**: Es el contraste directo de la Historia 1; ambos comportamientos deben coexistir para que el sistema de tipos de ataque tenga sentido como elección táctica.

**Independent Test**: En una batalla con varios enemigos agrupados dentro del alcance de una unidad con "Ataque Único", desplegarla y confirmar que solo un enemigo recibe daño por ataque.

**Acceptance Scenarios**:

1. **Given** varios enemigos están dentro del alcance de una unidad con "Ataque Único", **When** la unidad ataca, **Then** solo uno de esos enemigos recibe daño en ese ataque.
2. **Given** el enemigo objetivo de una unidad con "Ataque Único" es destruido, **When** la unidad vuelve a atacar, **Then** el daño se dirige a otro enemigo dentro de su alcance (si existe), sin afectar a más de uno por ataque.

---

### User Story 3 - Un ataque de larga distancia alcanza objetivos más allá del más cercano (Priority: P2)

Un jugador observa que una unidad con tipo de ataque "Larga Distancia" puede dañar enemigos ubicados más lejos en el carril, no limitada únicamente al enemigo inmediatamente adyacente.

**Why this priority**: Añade una tercera dimensión táctica (alcance) sobre las dos anteriores (único vs. área); depende de que ya exista el sistema base de tipos de ataque (Historias 1 y 2) para tener sentido como una variante adicional.

**Independent Test**: En una batalla con varios enemigos escalonados en el carril, desplegar una unidad con "Larga Distancia" y confirmar que puede dañar a un enemigo más allá del más cercano dentro de su rango.

**Acceptance Scenarios**:

1. **Given** hay más de un enemigo dentro del rango de una unidad con "Larga Distancia", **When** la unidad ataca, **Then** el daño puede alcanzar a un enemigo más allá del inmediatamente más cercano.

---

### User Story 4 - Los enemigos también declaran su propio tipo de ataque (Priority: P2)

Un jugador enfrenta enemigos cuyo tipo de ataque (único, área o larga distancia) afecta de la misma forma a las unidades del jugador y a su base, igual que ocurre con sus propias unidades.

**Why this priority**: El sistema debe ser simétrico para que el desafío de combate sea coherente; depende de que el comportamiento base (Historias 1-3) ya esté definido para las unidades del jugador.

**Independent Test**: En una batalla donde un enemigo con "Ataque de Área" enfrenta a varias unidades del jugador agrupadas, confirmar que todas reciben daño en el mismo ataque, igual que ocurriría con una unidad del jugador equivalente.

**Acceptance Scenarios**:

1. **Given** un enemigo declara un tipo de ataque en sus datos, **When** ataca a las unidades del jugador o a la base del jugador, **Then** su comportamiento de daño sigue las mismas reglas de ese tipo de ataque que aplican a las unidades del jugador.

---

### Edge Cases

- ¿Qué pasa con las 5 unidades y los enemigos ya definidos en `001-chapter1-vertical-slice`, que hoy no declaran ningún tipo de ataque? Se les asigna "Ataque Único" por defecto, de forma que la vertical slice existente siga funcionando sin requerir que se reautoren manualmente antes de continuar.
- ¿Qué pasa si una unidad con "Ataque de Área" tiene enemigos tanto dentro como fuera de su radio de efecto? Solo los enemigos dentro del radio reciben daño en ese ataque; los que están fuera no se ven afectados.
- ¿Qué pasa si una unidad con "Ataque Único" no tiene ningún enemigo dentro de su alcance? No inflige daño en ese ataque, igual que el comportamiento ya definido en `001-chapter1-vertical-slice` para el ciclo de ataque.
- ¿Qué pasa si dos unidades con distinto tipo de ataque atacan al mismo enemigo al mismo tiempo? Cada una aplica su daño según su propio tipo de ataque; esta feature no define interacciones combinadas especiales entre tipos de ataque distintos.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE extender el contrato de datos de unidad y enemigo (ScriptableObject) ya definido en `001-chapter1-vertical-slice` con un campo de tipo de ataque.
- **FR-002**: El tipo de ataque DEBE tener exactamente uno de estos tres valores: Ataque Único, Ataque de Área, Larga Distancia.
- **FR-003**: Toda unidad y todo enemigo DEBEN declarar un tipo de ataque en sus datos.
- **FR-004**: Una unidad o enemigo con "Ataque Único" DEBE dañar únicamente a un enemigo por ataque, incluso si hay más de uno dentro de su alcance.
- **FR-005**: Una unidad o enemigo con "Ataque de Área" DEBE dañar simultáneamente a todos los enemigos dentro de su radio de efecto en un mismo ataque.
- **FR-006**: Una unidad o enemigo con "Larga Distancia" DEBE ser capaz de dañar a un enemigo más allá del más cercano dentro de su rango, no limitado únicamente al objetivo adyacente.
- **FR-007**: El comportamiento de cada tipo de ataque DEBE aplicarse de forma simétrica, tanto para unidades del jugador como para enemigos.
- **FR-008**: Las unidades y enemigos ya existentes de `001-chapter1-vertical-slice` que no declaren un tipo de ataque DEBEN tratarse por defecto como "Ataque Único", para no romper el funcionamiento actual de la vertical slice.
- **FR-009**: Esta feature NO DEBE incluir habilidades de trait-targeting, neutral abilities ni inmunidades (alcance de la Fase 8 del roadmap), ni el sistema de clasificación de tipos de unidad/enemigo (Fase 9).

### Key Entities *(include if feature involves data)*

- **AttackType**: valor de datos con tres opciones posibles — Ataque Único, Ataque de Área, Larga Distancia — que determina cuántos enemigos (y a qué distancia) recibe daño de un ataque.
- **Unidad / Enemigo** (existentes, de `001-chapter1-vertical-slice`): extendidos con un campo `AttackType` adicional, sin modificar sus atributos existentes (coste, cooldown, salud, daño, rango).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Una unidad o enemigo con "Ataque de Área" daña al 100% de los enemigos agrupados dentro de su radio de efecto en un mismo ataque.
- **SC-002**: Una unidad o enemigo con "Ataque Único" daña exactamente a un enemigo por ataque el 100% de las veces, sin importar cuántos estén dentro de su alcance.
- **SC-003**: Una unidad o enemigo con "Larga Distancia" puede dañar a un objetivo más allá del más cercano en al menos un escenario de prueba con enemigos escalonados.
- **SC-004**: Las 5 unidades y los enemigos existentes de `001-chapter1-vertical-slice` siguen funcionando en batalla sin errores tras esta extensión, cada uno con un tipo de ataque definido (por defecto o reautorado).
- **SC-005**: Cambiar el tipo de ataque de una unidad o enemigo en sus datos se refleja en la siguiente partida de prueba sin necesidad de recompilar el proyecto.

## Assumptions

- Los tres tipos de ataque se derivan de la sección "Attack Types" de la referencia indicada (`https://battlecats.miraheze.org/wiki/Special_Abilities`): Ataque Único, Ataque de Área y Larga Distancia. No fue posible acceder directamente a esa página durante la redacción de esta spec (la solicitud fue rechazada por el servidor); el contenido se basa en el conocimiento público ya conocido de esa mecánica en el juego de referencia. Si la terminología o el comportamiento exacto difieren de lo publicado en la wiki, se ajusta en `/speckit.clarify` sin cambiar el alcance general.
- "Qué puede recibir daño de esa unidad" (frase del input de la feature) se interpreta como cuántos enemigos y a qué distancia recibe daño un ataque (único/área/larga distancia), no como inmunidad o restricción por tipo de enemigo — eso corresponde explícitamente a trait-targeting/neutral abilities/immunities (Fase 8) y a clasificación (Fase 9), ambas fuera de alcance aquí.
- Las unidades y enemigos ya definidos en `001-chapter1-vertical-slice` reciben "Ataque Único" por defecto al no tener el campo definido previamente, evitando que la vertical slice se rompa; su tipo de ataque real puede reautorarse después sin requerir cambios a esta spec.
- La regla exacta de selección de objetivo para "Larga Distancia" (por ejemplo, siempre el más lejano vs. cualquiera más allá del más cercano) queda para `/speckit.plan`; esta spec solo exige que sea capaz de alcanzar más allá del enemigo más cercano.
- Esta feature no añade nuevas animaciones o efectos visuales por tipo de ataque más allá de lo ya exigido por el Principio III de la constitución (animación de idle y de ataque); solo afecta la lógica de aplicación de daño y los datos correspondientes.
