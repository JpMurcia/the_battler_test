# Feature Specification: Cat Combos

**Feature Branch**: `025-cat-combos`

**Created**: 2026-08-23

**Status**: Draft

**Input**: User description: "Sistema de Cat Combos: bonificaciones pasivas que se activan automáticamente cuando el jugador lleva juntas a la batalla ciertas combinaciones predefinidas de unidades (por ejemplo, las diez unidades \"Normales\" iniciales), según la sección 9.3 del manual técnico The_Battle_Cats_Manual_Tecnico.docx. Es la spec 025, siguiente tras specs/024-sistema-gacha." — validado contra `docs/The_Battle_Cats_Manual_Tecnico.docx` § 9.3 ("Cat Combos: Bonificaciones pasivas que se activan automáticamente al llevar juntas al combate ciertas combinaciones predefinidas de unidades... Añaden una capa adicional de planificación de equipo más allá de la simple potencia individual de cada unidad").

**Nota de alcance**: el catálogo actual (`src/data/cats.ts`) solo tiene dos gatos con `rarity: 'Normal'` (`basic-cat`, `tank-cat`) — a diferencia de las diez unidades Normales que documenta el manual. Esta spec no exige ampliar el catálogo; el primer combo puede definirse sobre el conjunto de Normales ya existente, u otro grupo de catIds igual de pequeño, dejando la selección exacta de miembros y el valor numérico de cada bonificación a `plan.md`/balance. El mecanismo de bonificación pasiva ya tiene un precedente en el proyecto (`TreasureSetPassiveBonus`, `specs/013-escalado-capitulos-sets-tesoros`) que esta spec puede reutilizar o extender sin introducir un segundo sistema paralelo de bonificaciones.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Activar un combo llevando la combinación completa a la batalla (Priority: P1)

Un jugador arma su formación activa con todos los gatos que forman un Cat Combo predefinido y, al entrar en batalla, recibe automáticamente la bonificación pasiva de ese combo durante todo el combate, sin ninguna acción adicional de su parte.

**Why this priority**: Es el valor central de la feature — sin la activación automática del bonus, "Cat Combos" no existe como sistema, solo como idea.

**Independent Test**: Configurar la formación activa con exactamente los catIds de un combo definido, iniciar cualquier nivel, y confirmar que la bonificación pasiva de ese combo está activa durante la batalla (medible en el efecto concreto que otorgue: energía, daño, HP u otro).

**Acceptance Scenarios**:

1. **Given** la formación activa del jugador contiene todos los catIds de un Cat Combo definido, **When** el jugador inicia una batalla, **Then** la bonificación pasiva de ese combo se aplica automáticamente desde el inicio del combate, sin que el jugador deba activarla.
2. **Given** la formación activa NO contiene todos los catIds de ningún combo definido (falta al menos uno), **When** el jugador inicia una batalla, **Then** ninguna bonificación de combo se aplica — ni siquiera parcialmente.
3. **Given** un combo activo durante una batalla en curso, **When** la batalla termina (victoria o derrota), **Then** el estado de combo no persiste como progreso de cuenta — se vuelve a evaluar desde cero la próxima vez que el jugador entre a una batalla.

---

### User Story 2 - Consultar qué combos existen y cuáles están completos antes de entrar a la batalla (Priority: P1)

Un jugador que arma su formación activa (pantalla de Equipo) puede ver la lista de Cat Combos definidos, qué gatos requiere cada uno, y cuáles de ellos ya están completos con la formación seleccionada — antes de gastar energía entrando a una batalla.

**Why this priority**: Sin visibilidad previa, un jugador solo podría descubrir un combo por casualidad o por fuentes externas al juego — contradice el propósito del sistema según el manual ("añaden una capa adicional de planificación de equipo"). Comparte prioridad P1 con la Historia 1 porque el valor de un bonus automático es limitado si el jugador no puede planificarlo deliberadamente.

**Independent Test**: Abrir la pantalla de formación de equipo con una formación parcial (algunos gatos de un combo, no todos) y confirmar que se ve el combo, sus miembros requeridos, y un indicador claro de que está incompleto; luego completar la formación y confirmar que el mismo indicador pasa a "completo" sin recargar la pantalla.

**Acceptance Scenarios**:

1. **Given** el jugador abre la pantalla de formación de equipo, **When** la pantalla carga, **Then** ve la lista de Cat Combos definidos, con el nombre de cada uno y los gatos que requiere.
2. **Given** la formación activa actual, **When** se muestra cada combo, **Then** el sistema indica con claridad si ese combo está completo (todos sus miembros están en la formación activa) o incompleto (falta al menos uno).
3. **Given** un combo incompleto porque le falta un gato que el jugador no posee todavía, **When** se muestra ese combo, **Then** el sistema distingue ese caso de un combo incompleto por un gato que el jugador sí posee pero no incluyó en la formación activa.
4. **Given** el jugador modifica la formación activa agregando el gato que le faltaba a un combo, **When** la formación se guarda, **Then** ese combo pasa a mostrarse como completo sin necesidad de salir y volver a entrar a la pantalla.

---

### User Story 3 - Varios combos activos al mismo tiempo (Priority: P2)

Un jugador cuya formación activa satisface los requisitos de dos o más Cat Combos a la vez recibe las bonificaciones de todos ellos simultáneamente durante la misma batalla.

**Why this priority**: Es una extensión natural de la Historia 1 (mismo mecanismo, evaluado varias veces) que enriquece la planificación de equipo, pero el sistema ya entrega su valor principal con un solo combo activo a la vez.

**Independent Test**: Definir un escenario con al menos dos combos cuyos miembros quepan simultáneamente en el tope de formación activa (`MAX_ACTIVE_TEAM_SIZE`), armar esa formación, iniciar batalla y confirmar que ambas bonificaciones están activas a la vez.

**Acceptance Scenarios**:

1. **Given** la formación activa satisface los requisitos completos de dos Cat Combos distintos, **When** el jugador inicia una batalla, **Then** ambas bonificaciones pasivas se aplican simultáneamente, sin que una anule o reemplace a la otra.
2. **Given** dos combos que comparten un mismo catId como miembro, **When** la formación activa completa a ambos, **Then** los dos se consideran activos de forma independiente — un mismo gato puede contar para más de un combo a la vez.

---

### Edge Cases

- ¿Qué pasa si un gato miembro de un combo completado está en la formación activa pero el jugador todavía no lo desplegó en esa batalla concreta? El combo se evalúa sobre la formación activa (quién puede ser desplegado), no sobre quién ya fue desplegado en pantalla — el bonus está activo desde el inicio de la batalla, independientemente de qué unidades haya invocado el jugador hasta ese momento.
- ¿Qué pasa si el jugador cambia la formación activa a mitad de una partida guardada (por ejemplo, entre una batalla y otra)? El estado de combo se recalcula por completo la próxima vez que se inicia una batalla — no hay combo "recordado" de una partida anterior.
- ¿Qué pasa si un combo bonus y una bonificación de set de tesoros (`specs/013`) del mismo tipo (por ejemplo, ambos multiplicadores de regeneración de energía) están activos a la vez? Deben combinarse (por ejemplo, multiplicarse entre sí), nunca excluirse mutuamente ni limitarse a aplicar solo la mayor.
- ¿Qué pasa si un gato miembro de un combo evoluciona (`specs/010`, `Base`→`Second`→`True`)? Sigue contando como el mismo miembro del combo — la evolución no rompe ni re-requiere el combo, porque el combo se define por `catId`, no por forma de evolución.
- ¿Qué pasa si un combo queda definido con un catId que no existe en el catálogo? Se trata como un defecto de contenido a corregir antes de shippear (mismo criterio que Edge Cases de `specs/024` para banners mal configurados), no un caso a manejar en runtime.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE definir al menos un Cat Combo, cada uno compuesto por un conjunto fijo de dos o más catIds del catálogo existente y una bonificación pasiva asociada.
- **FR-002**: Al iniciar una batalla, el sistema DEBE evaluar automáticamente, para cada Cat Combo definido, si la formación activa del jugador contiene todos sus catIds miembro.
- **FR-003**: Cuando un Cat Combo está completo (todos sus miembros están en la formación activa), su bonificación pasiva DEBE aplicarse automáticamente durante toda la batalla, sin ninguna acción del jugador.
- **FR-004**: Cuando un Cat Combo NO está completo (falta al menos un miembro en la formación activa), el sistema NO DEBE otorgar ningún efecto de ese combo, ni siquiera parcial o proporcional a los miembros presentes.
- **FR-005**: Si la formación activa satisface los requisitos de más de un Cat Combo a la vez, el sistema DEBE aplicar las bonificaciones de todos los combos completos simultáneamente, sin que una excluya o reemplace a otra.
- **FR-006**: El jugador DEBE poder consultar, desde la pantalla de formación de equipo existente, la lista completa de Cat Combos definidos: nombre, gatos requeridos, y si está completo o incompleto con la formación activa actual.
- **FR-007**: Esa consulta DEBE distinguir, para un combo incompleto, entre un miembro que el jugador no posee todavía y un miembro que sí posee pero no incluyó en la formación activa.
- **FR-008**: La bonificación de un Cat Combo activo DEBE combinarse con cualquier otra bonificación pasiva ya existente en el proyecto (sets de tesoros, `specs/013`) sin desactivarla ni ser desactivada por ella.
- **FR-009**: El estado de qué combos están completos NO DEBE persistir como progreso de cuenta — se recalcula automáticamente cada vez que el jugador inicia una batalla, a partir de la formación activa vigente en ese momento (misma garantía que el resto del estado efímero de partida, Constitución § V).
- **FR-010**: Todo catId miembro de un Cat Combo DEBE corresponder a un gato jugable real y existente en `src/data/cats.ts` — ningún combo puede definirse sobre una unidad inexistente.

### Key Entities *(include if feature involves data)*

- **Cat Combo**: agrupación fija y predefinida de dos o más catIds del catálogo, con un nombre descriptivo y una bonificación pasiva asociada. Vive como contenido en `src/data/` (Constitución § IV), no como progreso del jugador.
- **Bonificación de Combo**: efecto pasivo que un Cat Combo completo otorga durante toda la batalla (por ejemplo, un multiplicador sobre energía, daño o algún otro recurso ya modelado por el proyecto) — mismo tipo de esquema que `TreasureSetPassiveBonus` (`specs/013`), para no duplicar mecanismos de bonificación ya existentes.
- **Estado de Combo (derivado)**: resultado, calculado en el momento de iniciar una batalla, de si la formación activa contiene todos los miembros de un Cat Combo dado — no es un dato persistido, se deriva de `activeTeamCatIds` y del catálogo de combos.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un jugador que arma una formación con todos los gatos de un Cat Combo definido percibe el efecto de ese combo activo desde el primer segundo de la batalla siguiente, sin ninguna acción adicional.
- **SC-002**: El 100% de los Cat Combos definidos son visibles en la pantalla de formación de equipo, junto a su estado (completo/incompleto), sin necesidad de iniciar ninguna batalla para comprobarlo.
- **SC-003**: Un jugador que rompe un combo completo (retira uno de sus miembros de la formación activa) deja de recibir su bonificación en la siguiente batalla que inicie, sin ninguna acción manual adicional de "desactivar" el combo.
- **SC-004**: En un escenario con al menos dos Cat Combos completos a la vez, ambas bonificaciones están activas simultáneamente durante la misma batalla, verificable de forma independiente.
- **SC-005**: Las 24 specs previas (`001`-`024`) y sus suites de Vitest existentes permanecen en verde tras integrar Cat Combos — cero regresiones.

## Assumptions

- El primer Cat Combo que se envíe puede construirse sobre los gatos ya etiquetados `rarity: 'Normal'` en el catálogo actual (`basic-cat`, `tank-cat`) u otro grupo reducido de catIds ya existentes, en vez de exigir diez unidades Normales como en el manual — el conteo exacto de miembros y cuántos combos se definen en total quedan a criterio de `plan.md`/balance.
- La bonificación pasiva de un Cat Combo reutiliza el mismo esquema de tipo/valor ya introducido por `TreasureSetPassiveBonus` (`specs/013`) en vez de crear un segundo sistema de bonificaciones paralelo — los tipos concretos de efecto disponibles (energía, daño u otros) se resuelven en `plan.md` sin volver a esta spec.
- La consulta de combos (Historia 2) se integra en la pantalla de formación de equipo ya existente (`TeamScreen`, `specs/006`) en vez de crear una pantalla dedicada nueva, siguiendo la Constitución § VII (simplicidad, reutilizar antes que expandir superficie de UI).
- Los Cat Combos son contenido estático definido por el proyecto (no combinaciones creadas o nombradas por el jugador), consistente con que el resto del contenido de juego vive en `src/data/` como fixtures de diseño (Constitución § IV).
- Un mismo catId puede pertenecer a más de un Cat Combo a la vez — no hay restricción de exclusividad entre combos en esta spec.
- No se introduce ninguna recompensa de desbloqueo ni requisito de progreso para que un Cat Combo esté disponible — todo combo definido está activo desde que el jugador posee y forma a sus miembros, sin gating adicional (a menos que `plan.md` lo justifique explícitamente, Constitución § Governance).
