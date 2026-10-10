# Feature Specification: Catálogo de Habilidades de Combate — Fortalecer, Esquivar, Sobrevivir y Retroceso

**Feature Branch**: `039-habilidades-control-defensa`

**Created**: 2026-10-01

**Status**: Draft

**Input**: Segunda ampliación del catálogo de habilidades de combate, cola explícita de `specs/038-catalogo-habilidades-avanzado` (que cerró Golpe Letal, Killers, Escudo e Invocar y dejó el resto del catálogo de https://battlecats.miraheze.org/wiki/Special_Abilities pendiente — ver README, "Qué falta"). Esta spec agrega cuatro habilidades de control y defensa como miembros aditivos de `Ability` en `src/engine/types.ts`: **Fortalecer** (más daño al quedar herida), **Esquivar** (probabilidad de anular un golpe recibido), **Sobrevivir** (probabilidad de resistir un golpe letal con 1 de vida) y **Retroceso** (probabilidad de empujar hacia atrás al objetivo golpeado). La economía de batalla ("Dinero Extra") y la inmunidad de jefes a estas habilidades quedan para la spec siguiente (`040`).

**Relación con el proyecto existente**: Extiende `specs/009-clasificacion-habilidades` (`Ability`, bloqueo por `Curse`), `specs/015-catalogo-habilidades-combate` (efectos on-hit, `resistantTo`) y `specs/038-catalogo-habilidades-avanzado` (`MassiveDamage`/`TraitKiller`/`Shield`, `random` inyectado en `combat.ts`). No redefine `AttackType`, `ClassificationType`, `SpecialClassificationType`, `EffectType` ni el mecanismo de selección de objetivo — agrega cuatro miembros nuevos a `Ability` que se resuelven en `src/engine/combat.ts`/`src/engine/simulation.ts` junto a los ya existentes, sin campos nuevos en `BattleUnit` (las cuatro se derivan por completo de `abilities`, `hp` y `maxHp`).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Fortalecer: una unidad herida golpea más fuerte (Priority: P1)

Un jugador despliega una unidad con "Fortalecer": mientras está sana pega con su daño normal, pero cuando su vida cae a cierto porcentaje o menos su daño se multiplica — premia mantenerla con vida en combate y la vuelve peligrosa justo cuando parecía a punto de caer.

**Why this priority**: Es la capacidad más simple de las cuatro — sin probabilidad ni estado nuevo, solo un multiplicador derivado de `hp`/`maxHp` en el instante del ataque — y la única totalmente determinista, buen punto de partida igual que Golpe Letal lo fue en `specs/038`.

**Independent Test**: Hacer atacar a una unidad con Fortalecer contra un objetivo de vida fija con distintas vidas propias (sobre y bajo el umbral) y verificar que el daño infligido es el normal sobre el umbral y el multiplicado en o bajo él.

**Acceptance Scenarios**:

1. **Given** una unidad con Fortalecer (umbral `hpThresholdFraction`, multiplicador `damageMultiplier`) y vida por encima del umbral, **When** su ataque conecta, **Then** inflige su daño normal.
2. **Given** la misma unidad con vida igual o por debajo del umbral (`hp <= maxHp * hpThresholdFraction`), **When** su ataque conecta, **Then** inflige `damage * damageMultiplier`.
3. **Given** una unidad fortalecida que ataca la base enemiga/del jugador en vez de a otra unidad, **When** su ataque conecta, **Then** el multiplicador aplica igual — mismo alcance que Golpe Letal/Crítico, que ya se resuelven contra bases.
4. **Given** una unidad fortalecida que además está bajo Debilitar (`specs/015`), **When** ataca, **Then** ambos modificadores se aplican de forma multiplicativa sobre su daño base.
5. **Given** una unidad con Fortalecer bajo `Curse` (`specs/009`), **When** su vida está bajo el umbral y ataca, **Then** el multiplicador no se aplica mientras dure el efecto.

---

### User Story 2 - Esquivar: anular un golpe recibido (Priority: P1)

Un jugador despliega una unidad con "Esquivar": cada golpe enemigo que recibe tiene una probabilidad de fallar por completo — sin daño y sin ninguno de sus efectos secundarios — haciéndola muy difícil de eliminar para enemigos de golpe único y grande.

**Why this priority**: Es la contramedida natural a las capacidades ofensivas de `specs/038` (Golpe Letal/Killer) y comparte con ellas el mismo patrón "roll de probabilidad por golpe", así que aporta alto valor táctico con bajo riesgo de arquitectura.

**Independent Test**: Hacer que muchos golpes de un atacante alcancen a una unidad con Esquivar y verificar que, en una fracción cercana a la probabilidad configurada, el defensor no pierde vida ni recibe ningún efecto, y que en el resto de los golpes el daño se resuelve de forma normal.

**Acceptance Scenarios**:

1. **Given** un defensor con Esquivar (probabilidad `chance`), **When** le conecta un golpe, **Then** con probabilidad `chance` el golpe se anula por completo: su `hp` y su escudo no cambian, y no se le aplica ningún efecto on-hit (Maldición/Debilitar/Congelar/Ralentizar), eliminación de Killer ni Retroceso.
2. **Given** muchos golpes resueltos contra el mismo defensor, **When** se mide la fracción esquivada, **Then** esa fracción se acerca a `chance` (verificable estadísticamente, no exacta golpe a golpe).
3. **Given** un atacante `MultiHit` (`specs/016`) contra un defensor con Esquivar, **When** se resuelve la secuencia, **Then** cada golpe de la secuencia hace su propio roll independiente — algunos pueden esquivarse y otros no.
4. **Given** un atacante de tipo Área con un objetivo primario y objetivos de salpicadura, **When** conecta, **Then** cada objetivo con Esquivar hace su propio roll — esquivar el golpe primario no protege a la salpicadura ni viceversa.
5. **Given** una unidad con Esquivar bajo `Curse`, **When** recibe un golpe, **Then** nunca lo esquiva mientras dure el efecto.

---

### User Story 3 - Sobrevivir: resistir un golpe letal (Priority: P2)

Un jugador despliega una unidad con "Sobrevivir": cuando recibe un golpe que la mataría, tiene una probabilidad de aguantar con 1 de vida y seguir combatiendo — convierte una derrota segura en una segunda oportunidad.

**Why this priority**: Igual de valiosa que Esquivar para la defensa, pero con una interacción más fina (con Escudo, con Killer, con golpes repetidos) y de efecto menos frecuente por partida — por eso P2.

**Independent Test**: Hacer que una unidad con Sobrevivir reciba un golpe cuyo daño excede su vida y verificar que, cuando el roll acierta, queda con exactamente 1 de vida y activa, y que cuando falla muere como cualquier otra unidad; un golpe que no la mataría nunca consume ni altera el roll.

**Acceptance Scenarios**:

1. **Given** una unidad con Sobrevivir (probabilidad `chance`) y un golpe que dejaría su `hp` en 0 o menos, **When** el roll acierta, **Then** su `hp` queda en 1 y la unidad sigue viva (no pasa a `Dead`).
2. **Given** el mismo golpe letal, **When** el roll falla, **Then** la unidad muere normalmente.
3. **Given** un golpe que no deja su `hp` en 0 o menos, **When** se resuelve, **Then** Sobrevivir no interviene — el resultado es idéntico al de una unidad sin la habilidad.
4. **Given** una unidad con Sobrevivir y Escudo (`specs/038`), **When** recibe un golpe, **Then** primero se descuenta el escudo y Sobrevivir solo interviene si el excedente que llega a `hp` es letal; un golpe completamente absorbido por el escudo no es letal.
5. **Given** un Killer de rasgo (`specs/038`) que acierta contra una unidad con Sobrevivir del rasgo objetivo, **When** se resuelve la eliminación, **Then** Sobrevivir puede evitarla con su propio roll — la eliminación instantánea cuenta como un golpe letal más.
6. **Given** una unidad que sobrevivió con 1 de vida, **When** recibe otro golpe letal, **Then** hace un nuevo roll independiente (la habilidad no se agota).
7. **Given** una unidad con Sobrevivir bajo `Curse`, **When** recibe un golpe letal, **Then** muere sin hacer roll mientras dure el efecto.

---

### User Story 4 - Retroceso: empujar al objetivo golpeado (Priority: P3)

Un jugador despliega una unidad con "Retroceso": cada golpe que conecta tiene una probabilidad de empujar al objetivo hacia atrás por el carril, rompiendo el contacto y ganando tiempo para el resto del equipo o alejando a un enemigo de la base.

**Why this priority**: Es la capacidad más compleja de las cuatro — la única que altera la posición de otra unidad en lugar de su vida — y la que más impacto tiene en el flujo de combate; se entrega última sin bloquear a las tres anteriores.

**Independent Test**: Hacer que una unidad con Retroceso golpee a un objetivo que sobrevive al golpe y verificar que, cuando el roll acierta, el objetivo queda desplazado la distancia configurada hacia su propia base sin salirse del carril; en el siguiente paso de simulación, las unidades vuelven a evaluarse con normalidad (la separación puede romper el contacto).

**Acceptance Scenarios**:

1. **Given** un atacante con Retroceso (probabilidad `chance`, distancia `distance`) y un objetivo que sobrevive al golpe, **When** el roll acierta, **Then** el objetivo se desplaza `distance` unidades hacia su propia base: a menor `x` si es del jugador, a mayor `x` si es enemigo.
2. **Given** un objetivo cuyo desplazamiento lo llevaría más allá del borde de su propio carril, **When** se aplica el retroceso, **Then** queda en ese borde — nunca fuera del carril (el origen de despliegue para el jugador, el borde de aparición para el enemigo).
3. **Given** un golpe que mata al objetivo (o lo deja en 0 de vida), **When** el roll acierta, **Then** no hay desplazamiento — una unidad muerta se descarta igual que hoy.
4. **Given** un golpe esquivado (Historia 2), **When** se resuelve, **Then** no hay desplazamiento — el golpe se anuló por completo.
5. **Given** un atacante de tipo Área con Retroceso, **When** conecta contra un objetivo primario y objetivos de salpicadura, **Then** cada objetivo golpeado hace su propio roll de Retroceso de forma independiente.
6. **Given** un objetivo desplazado por Retroceso, **When** avanza la simulación, **Then** no existe ningún estado especial de "retrocedido": ambas unidades se re-evalúan por las reglas normales de detección (si la separación rompió el contacto, vuelven a moverse y a trabarse al reencontrarse; su cooldown de ataque no se modifica).
7. **Given** un atacante con Retroceso bajo `Curse`, **When** conecta un golpe, **Then** no hay Retroceso mientras dure el efecto.

---

### Edge Cases

- Dodge y Killer/Retroceso/efectos on-hit en el mismo golpe: Esquivar se resuelve primero — si anula el golpe, ninguno de los demás se resuelve (ni consume su roll).
- Sobrevivir contra daño de unidad vs. cañón especial de la base (`specs/012`): el cañón no es un "golpe" de unidad — aplica su daño directo a `hp` sin pasar por Esquivar, Sobrevivir ni Escudo (mismo criterio que ya aplica `specs/038` a Escudo).
- Daño a una base (la del jugador o la enemiga): Esquivar, Sobrevivir y Retroceso nunca aplican — una base no es una `BattleUnit`; solo Fortalecer influye (en el daño que una unidad le inflige).
- Un golpe que baja la vida de una unidad con Fortalecer por debajo del umbral en el mismo paso en que ella ataca: ya ataca fortalecida en ese paso — mismo orden de resolución que Debilitar/Congelar (`specs/015`), que también surten efecto sobre un defensor antes de que ataque en el mismo paso. Una unidad que muere en ese mismo paso (el intercambio es simultáneo) ataca igualmente con el multiplicador de umbral.
- Varias entradas del mismo tipo en `abilities` de una unidad (p. ej. dos `Dodge`): se aplica solo la primera, igual que `MassiveDamage` en `specs/038`.
- Retroceso contra un objetivo sin espacio de retroceso (ya en el borde de su carril): no hay desplazamiento, pero el roll se consume igual y el resto del golpe se resuelve de forma normal.
- Retroceso en una secuencia `MultiHit`: cada golpe hace su propio roll y los desplazamientos se acumulan, siempre respetando el borde del carril.
- Esquivar/Sobrevivir/Retroceso/Fortalecer declarados en un enemigo: funcionan igual que en una unidad del jugador (mismo `Ability`, mismo motor) — los datos semilla de esta spec solo los asignan a gatos de demostración del jugador.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `Ability` (`src/engine/types.ts`) DEBE ganar un miembro `Strengthen` (`{ kind: 'Strengthen'; hpThresholdFraction: number; damageMultiplier: number }`): mientras `hp <= maxHp * hpThresholdFraction` (umbral inclusivo, `hpThresholdFraction` entre 0 y 1), el daño base de toda unidad que declare la habilidad se multiplica por `damageMultiplier` — tanto contra otra unidad (incluida la salpicadura) como contra una base.
- **FR-002**: `Ability` DEBE ganar un miembro `Dodge` (`{ kind: 'Dodge'; chance: number }`): cada golpe de una unidad que alcanza a un defensor que declara la habilidad se anula por completo con probabilidad `chance` (0-1) — sin daño a `hp`, sin consumo de `shieldRemainingHp`, sin eliminación de Killer, sin Retroceso y sin ningún efecto on-hit (`Curse`/`Weaken`/`Freeze`/`Slow`).
- **FR-003**: `Ability` DEBE ganar un miembro `Survive` (`{ kind: 'Survive'; chance: number }`): cuando un golpe dejaría el `hp` del defensor que lo declara en 0 o menos (incluida una eliminación instantánea de `TraitKiller`, y evaluado tras descontar `shieldRemainingHp`), con probabilidad `chance` (0-1) el `hp` queda en 1 y la unidad no pasa a `Dead`.
- **FR-004**: `Ability` DEBE ganar un miembro `Knockback` (`{ kind: 'Knockback'; chance: number; distance: number }`): con probabilidad `chance` (0-1), cada golpe del atacante que conecta contra una unidad que sigue viva tras el golpe la desplaza `distance` unidades en el eje X hacia su propia base — hacia menor `x` si el objetivo es del jugador, hacia mayor `x` si es enemigo.
- **FR-005**: El desplazamiento de Retroceso NUNCA DEBE dejar a la unidad fuera del carril: el jugador no baja de `x = 0` (origen de despliegue) y el enemigo no supera `laneLength - width` (borde de aparición). Un objetivo ya en ese borde no se desplaza.
- **FR-006**: El orden de resolución de cada golpe DEBE ser: Esquivar del defensor → daño base (con Fortalecer, `TraitTargeting`, `TraitResistance` y Debilitar) → Golpe Letal → Crítico → Killer o, si no, descuento de escudo y de `hp` → Sobrevivir del defensor → Retroceso del atacante → efectos on-hit. Un golpe esquivado interrumpe la resolución en el primer paso, sin consumir ningún roll posterior.
- **FR-007**: Cada roll de Esquivar, Sobrevivir y Retroceso DEBE ser independiente por golpe individual y por objetivo — sin persistir estado entre ticks ni entre golpes de una misma secuencia `MultiHit` (`specs/016`) o de un ataque de Área.
- **FR-008**: Una unidad bajo `Curse` (`specs/009` FR-009) NO DEBE beneficiarse de ninguna de las cuatro habilidades que declara mientras dure el efecto (ni aplicar Fortalecer ni Retroceso al atacar, ni esquivar ni sobrevivir al ser golpeada) — mismo criterio que el resto de habilidades que "se aplican" en combate. `Shield` y `TraitResistance`, pasivas, siguen sin verse afectadas por `Curse` como hasta hoy.
- **FR-009**: Ninguna unidad existente que no declare las cuatro habilidades nuevas DEBE cambiar su comportamiento observable — `TraitTargeting`, `Neutral`, `TraitResistance`, `MassiveDamage`, `TraitKiller`, `Shield` y `SummonOnDeath` deben seguir funcionando exactamente igual que hoy, incluido el orden relativo de sus rolls.
- **FR-010**: El panel de detalle de unidad (`UnitDetailPanel`, `specs/030`) DEBE describir cada habilidad nueva con su nombre y sus valores configurados cuando la unidad la declara.

### Key Entities *(include if feature involves data)*

- **`Ability.Strengthen`** (nuevo): umbral de vida (fracción de `maxHp`) y multiplicador de daño mientras la unidad esté en o bajo ese umbral.
- **`Ability.Dodge`** (nuevo): probabilidad de anular por completo un golpe recibido de otra unidad.
- **`Ability.Survive`** (nuevo): probabilidad de dejar a la unidad con 1 de vida ante un golpe letal.
- **`Ability.Knockback`** (nuevo): probabilidad y distancia de desplazamiento del objetivo golpeado hacia su propia base.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Una unidad con Fortalecer inflige exactamente el multiplicador configurado de su daño normal en cualquier ataque realizado en o bajo el umbral de vida, y exactamente su daño normal por encima de él — sin ninguna aleatoriedad.
- **SC-002**: En una muestra grande de golpes contra una unidad con Esquivar, la fracción de golpes sin daño ni efectos se acerca a la probabilidad configurada; un golpe esquivado nunca deja rastro (ni vida perdida, ni escudo consumido, ni efecto de estado, ni desplazamiento).
- **SC-003**: Una unidad con Sobrevivir de probabilidad 1 nunca muere por un único golpe y queda con exactamente 1 de vida; con probabilidad 0 se comporta idéntica a una unidad sin la habilidad.
- **SC-004**: En una muestra grande de golpes con Retroceso contra objetivos que sobreviven, la fracción de golpes que desplazan al objetivo se acerca a la probabilidad configurada, y ningún desplazamiento deja a una unidad fuera de su carril.
- **SC-005**: Ninguna unidad existente antes de esta spec cambia su comportamiento observable si no declara ninguna de las cuatro habilidades nuevas.
- **SC-006**: `npx tsc -b` limpio y `npm test` en verde, sin regresión en la suite existente de `src/engine/`.

## Assumptions

- Las cuatro habilidades se resuelven en el mismo punto del motor que ya resuelve `MassiveDamage`/`TraitKiller`/`Shield` (`src/engine/combat.ts`) con el `random: () => number` ya inyectado desde `specs/016` — esta spec define **qué hacen**, no una fuente nueva de aleatoriedad.
- No se agregan campos a `BattleUnit`: Fortalecer se deriva de `hp`/`maxHp`, Esquivar/Sobrevivir/Retroceso son rolls sin estado persistente entre golpes, y la posición desplazada es simplemente el `x` ya existente de la unidad. Por eso ningún punto de creación de unidad (`deployUnit`, `spawnUnitFromCat`) cambia.
- Los valores de referencia (umbral, multiplicador, probabilidades, distancia) se definen como datos semilla ajustables en `src/data/cats.ts`, sin tocar código (Constitución § IV) — se agrega un gato de demostración nuevo por habilidad, sin modificar los gatos existentes, mismo criterio que `specs/038`.
- Esquivar aquí es una probabilidad por golpe. El juego de referencia además concede una ventana de tiempo de evasión total tras activarse; esa duración queda fuera de alcance (Constitución § VII, simplicidad desde el MVP) y puede añadirse como extensión aditiva sobre el mismo miembro.
- Retroceso aquí es una habilidad probabilística del atacante. El retroceso "estándar" del juego de referencia (todo golpe empuja al cruzar umbrales de vida) y la inmunidad a retroceso quedan fuera de alcance — la inmunidad de jefes a Golpe Letal/Killer/Retroceso se aborda en la spec siguiente (`040`), y el efecto secundario de retroceso del cañón especial (cabezas de cañón de Ototo Corps, pendiente desde `specs/035`) podrá reutilizar el desplazamiento que introduce esta spec.
- El retroceso es un desplazamiento instantáneo de posición — no se agrega ninguna animación o variante visual nueva por habilidad; la identidad visual animada (Constitución § III) ya está cubierta a nivel de unidad, independientemente de qué habilidades declare.
- El filtro de gatos por habilidad (`specs/030`, `catFilter.ts`) conserva su lista actual de habilidades filtrables; extenderla a las nuevas queda fuera de alcance.
- Esta spec no modifica `AttackType`, `ClassificationType`, `SpecialClassificationType` ni `EffectType` — solo agrega miembros a `Ability`, mismo patrón de extensión aditiva que `specs/009`/`specs/015`/`specs/016`/`specs/038`.
