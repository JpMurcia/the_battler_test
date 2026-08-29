# Feature Specification: Catálogo de Habilidades de Combate — Golpe Letal, Killers, Escudo e Invocar

**Feature Branch**: `038-catalogo-habilidades-avanzado`

**Created**: 2026-08-28

**Status**: Draft

**Input**: Ampliación del catálogo de habilidades de combate: `specs/015-catalogo-habilidades-combate` dejó explícitamente fuera de alcance ("candidato a una iteración futura", ver `specs/015-catalogo-habilidades-combate/spec.md` línea 143) golpe letal, killers de rasgo, escudo e invocar. Esta spec los agrega como nuevos miembros aditivos de `Ability` en `src/engine/types.ts` (sin reordenar ni reinterpretar los existentes), siguiendo el catálogo de https://battlecats.miraheze.org/wiki/Special_Abilities. Prioriza 2-3 variantes de Killer con sentido inmediato en vez de las ~8 posibles del juego de referencia.

**Relación con el proyecto existente**: Extiende `specs/009-clasificacion-habilidades` (`Ability.TraitTargeting`/`Ability.Neutral`, mecanismo de selección de objetivo por `ClassificationType`/`SpecialClassificationType`) y `specs/015-catalogo-habilidades-combate` (`Ability.TraitResistance`, catálogo de efectos con comportamiento real). No redefine `AttackType`, `ClassificationType`, `SpecialClassificationType` ni el mecanismo de selección de objetivo — agrega cuatro miembros nuevos a `Ability` que resuelven en `src/engine/combat.ts` junto a los ya existentes.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Golpe Letal para acabar con enemigos de mucha vida (Priority: P1)

Un jugador despliega una unidad con "Golpe Letal": la mayoría de sus ataques hacen su daño normal, pero de vez en cuando conecta un golpe varias veces más fuerte, capaz de derribar de un solo impacto a un enemigo de alta vida que normalmente resistiría varios ataques.

**Why this priority**: Es la capacidad más simple de las cuatro (un solo roll de probabilidad sobre el daño ya calculado) y la que más impacto visible tiene en combate — buen primer paso, igual que Debilitar/Congelar lo fueron en `specs/015`.

**Independent Test**: Enfrentar muchas veces una unidad con Golpe Letal contra un enemigo de vida fija y verificar que, en una fracción de los golpes cercana a la probabilidad configurada, el daño infligido es varias veces el daño base; el resto de los golpes usa el daño normal.

**Acceptance Scenarios**:

1. **Given** una unidad con Golpe Letal (probabilidad `chance`, multiplicador `damageMultiplier`), **When** su ataque conecta, **Then** con probabilidad `chance` el daño infligido es `damage * damageMultiplier`, y el resto de las veces es el `damage` normal.
2. **Given** muchos ataques resueltos de la misma unidad, **When** se mide la fracción de golpes que aplicó Golpe Letal, **Then** esa fracción se acerca a `chance` (verificable estadísticamente, no exacta golpe a golpe).
3. **Given** una unidad con `attackType: 'MultiHit'` (`specs/016`) que además tiene Golpe Letal, **When** se resuelve cada golpe de la secuencia, **Then** cada golpe individual hace su propio roll independiente (ninguno reutiliza el resultado de otro golpe de la misma secuencia).
4. **Given** una unidad con Golpe Letal que ataca la base enemiga/del jugador en vez de a otra unidad, **When** su ataque conecta, **Then** el mismo roll de probabilidad aplica al daño contra la base — mismo criterio que `Critical` (`specs/016`), que ya se resuelve tanto contra unidades como contra bases.

---

### User Story 2 - Killers de rasgo para eliminar enemigos específicos al instante (Priority: P1)

Un jugador prepara unidades "Killer" contra un rasgo concreto (ej. Zombie Killer, Metálico Killer): al golpear a un enemigo de ese rasgo, existe una probabilidad de eliminarlo instantáneamente sin importar su vida restante.

**Why this priority**: Junto con Golpe Letal, es la capacidad más pedida del catálogo de referencia y reutiliza directamente el framework de targeting de `specs/009` — bajo riesgo de arquitectura nueva, alto valor de contenido.

**Independent Test**: Enfrentar una unidad con un Killer dirigido a un rasgo específico contra un enemigo de ese rasgo con vida muy alta, y verificar que en una fracción de los golpes cercana a la probabilidad configurada el enemigo muere en un golpe pese a tener vida restante; contra un enemigo de otro rasgo, el Killer nunca elimina instantáneamente.

**Acceptance Scenarios**:

1. **Given** una unidad con un Killer dirigido a una lista de rasgos, **When** golpea a un enemigo que pertenece a alguno de esos rasgos, **Then** con probabilidad `chance` el `hp` del objetivo pasa a 0 inmediatamente, sin importar cuánta vida le quedaba.
2. **Given** la misma unidad, **When** golpea a un enemigo que no pertenece a ninguno de los rasgos listados, **Then** el Killer nunca se activa — el daño se resuelve de forma normal (mismo criterio de matching que `Ability.TraitTargeting`, incluida la exclusión de tipos especiales poco comunes salvo inclusión explícita, `specs/009` FR-004).
3. **Given** un enemigo con vida 1, **When** un Killer no se activa en ese golpe (falla el roll de probabilidad), **Then** el enemigo solo recibe el daño normal del ataque — el Killer no garantiza eliminación fuera de su probabilidad configurada.

---

### User Story 3 - Escudo para sobrevivir el primer impacto fuerte (Priority: P2)

Una unidad con "Escudo" empieza cada despliegue con una reserva adicional que absorbe daño antes de tocar su vida — útil para sobrevivir un golpe inicial que de otra forma la mataría.

**Why this priority**: Capacidad pasiva de una sola variable de estado (sin duración ni probabilidad), más simple de razonar que Golpe Letal/Killer, pero menos determinante en el resultado del combate — por eso P2.

**Independent Test**: Desplegar una unidad con Escudo configurado y hacer que reciba varios golpes, verificando que su `hp` no baja hasta que el daño acumulado supera el tamaño del escudo, y que a partir de ahí el daño restante sí afecta su `hp` normalmente.

**Acceptance Scenarios**:

1. **Given** una unidad recién desplegada con Escudo (`shieldHp`), **When** recibe daño, **Then** ese daño se descuenta primero de su escudo restante y su `hp` no cambia mientras el escudo cubra el golpe completo.
2. **Given** una unidad con escudo parcialmente consumido, **When** recibe un golpe mayor al escudo restante, **Then** el escudo se agota a 0 y el excedente de daño se aplica a su `hp` en el mismo golpe (sin perder ni duplicar daño).
3. **Given** una unidad con escudo ya agotado, **When** recibe más daño, **Then** se comporta exactamente como una unidad sin Escudo — todo el daño va directo a `hp`.
4. **Given** una unidad con Escudo que muere y se despliega de nuevo (nuevo `instanceId`), **When** aparece en el campo, **Then** su escudo se reinicia a `shieldHp` completo — no arrastra el consumo de su vida anterior.

---

### User Story 4 - Invocar un refuerzo al morir (Priority: P3)

Una unidad con "Invocar" deja tras de sí un aliado nuevo en el momento de morir, extendiendo su utilidad más allá de su propia vida útil.

**Why this priority**: La capacidad más compleja de las cuatro (crea una unidad nueva en tiempo de ejecución, algo que hoy solo hacen los spawns de oleada y el despliegue del jugador) y la de menor prioridad declarada en el input original — se entrega última sin bloquear a las tres anteriores.

**Independent Test**: Desplegar una unidad con Invocar configurado y dejar que muera en combate, verificando que aparece una nueva unidad aliada del tipo configurado en la misma posición, capaz de moverse y atacar con normalidad a partir de ese tick.

**Acceptance Scenarios**:

1. **Given** una unidad con Invocar (`summonCatId`, `count`), **When** su `hp` llega a 0, **Then** en el mismo tick se generan `count` unidades nuevas del `catId` indicado, del mismo `team`, en su posición `x`.
2. **Given** una invocación generada, **When** avanza la simulación, **Then** esa nueva unidad se comporta como cualquier otra `BattleUnit` de ese `catId` — sin marca especial que la distinga ni cooldown de despliegue asociado al jugador.
3. **Given** una unidad con Invocar configurado que muere fuera del campo de batalla activo (ej. al reiniciar/perder la partida), **When** el estado se resetea, **Then** no quedan invocaciones huérfanas — mismo criterio que el resto de `units[]` al llamar `reset()`.

---

### Edge Cases

- Una unidad bajo `Curse` (`specs/009`) que debería aplicar Golpe Letal/Killer/Invocar al morir: ninguna de sus habilidades se aplica mientras dure `Curse` (misma regla ya vigente, FR-009 de `specs/009`) — Escudo es la excepción, por ser pasivo y no una habilidad que "se aplica" al golpear.
- Golpe Letal y Killer en la misma unidad y el mismo golpe: ambos hacen su propio roll independiente; si el Killer se activa, el resultado es el mismo (`hp` a 0) sin importar si Golpe Letal también se activó ese golpe — no hay daño "doble letal".
- Un Killer dirigido a un rasgo que el objetivo no tiene: nunca se activa, igual que `Ability.TraitTargeting` no bonifica daño contra un rasgo no declarado.
- Invocar configurado con un `summonCatId` que no existe en el catálogo: fuera de alcance de esta spec — se asume que el dato semilla siempre referencia un `catId` válido (mismo criterio de integridad de datos que el resto del proyecto, sin validación en runtime).
- Una unidad con Escudo activo que recibe daño de más de una fuente en el mismo tick (ej. Refuerzo de fila, `specs/028`): el escudo absorbe en el orden en que se resuelven los golpes de ese tick, sin cambiar el total de daño mitigado.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `Ability` (`src/engine/types.ts`) DEBE ganar un miembro `MassiveDamage` (`{ kind: 'MassiveDamage'; chance: number; damageMultiplier: number }`): con probabilidad `chance` (0-1), el daño de ese ataque se calcula como `damage * damageMultiplier` en vez del daño base — tanto contra otra unidad como contra la base enemiga/del jugador (mismo alcance que `Critical`, que ya se resuelve en ambos casos).
- **FR-002**: `Ability` DEBE ganar un miembro `TraitKiller` (`{ kind: 'TraitKiller'; targetClassifications: (ClassificationType | SpecialClassificationType)[]; chance: number }`): con probabilidad `chance`, si el objetivo del golpe pertenece a alguno de `targetClassifications` (mismo algoritmo de matching que `Ability.TraitTargeting`, incluida la exclusión de tipos especiales salvo inclusión explícita), su `hp` pasa a 0 en ese golpe.
- **FR-003**: `Ability` DEBE ganar un miembro `Shield` (`{ kind: 'Shield'; shieldHp: number }`): al desplegar/generar la unidad, `BattleUnit.shieldRemainingHp` se inicializa en `shieldHp`.
- **FR-004**: `BattleUnit` DEBE ganar `shieldRemainingHp?: number` (opcional). Mientras sea mayor a 0, el daño entrante DEBE descontarse primero de `shieldRemainingHp` (sin bajar de 0) y solo el excedente, si lo hay, DEBE aplicarse a `hp` en el mismo golpe.
- **FR-005**: `Ability` DEBE ganar un miembro `SummonOnDeath` (`{ kind: 'SummonOnDeath'; summonCatId: string; count: number }`): cuando el `hp` de la unidad que lo declara llega a 0, el mismo tick DEBE generar `count` nuevas `BattleUnit` del `catId` indicado, mismo `team` y misma posición `x` que la unidad que murió.
- **FR-006**: Cada resolución de `MassiveDamage`/`TraitKiller` DEBE usar un roll de probabilidad independiente por golpe individual — sin persistir estado entre ticks ni entre golpes de una misma secuencia `MultiHit` (`specs/016`).
- **FR-007**: Una unidad bajo `Curse` (`specs/009` FR-009) NO DEBE aplicar `MassiveDamage`, `TraitKiller` ni `SummonOnDeath` mientras dure el efecto — mismo criterio que el resto de habilidades ofensivas existentes. `Shield` (pasivo, sin roll) NO se ve afectado por `Curse`.
- **FR-008**: Ninguna unidad existente que no declare los cuatro miembros nuevos DEBE cambiar su comportamiento observable — `TraitTargeting`, `Neutral` y `TraitResistance` deben seguir funcionando exactamente igual que hoy.
- **FR-009**: Al reiniciar el estado de la partida (`reset()`) o al desplegar/generar una unidad con un nuevo `instanceId`, `shieldRemainingHp` DEBE inicializarse desde `Ability.Shield.shieldHp` sin arrastrar el consumo de una instancia anterior.

### Key Entities *(include if feature involves data)*

- **`Ability.MassiveDamage`** (nuevo): probabilidad de multiplicar el daño de un golpe.
- **`Ability.TraitKiller`** (nuevo): probabilidad de eliminación instantánea contra rasgos específicos — complementa a `TraitTargeting` (daño bonificado) y `TraitResistance` (daño recibido reducido).
- **`Ability.Shield`** (nuevo) / **`BattleUnit.shieldRemainingHp`** (nuevo, opcional): reserva de absorción de daño previa al `hp` normal.
- **`Ability.SummonOnDeath`** (nuevo): genera unidades aliadas nuevas al morir la unidad que lo declara.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En una muestra grande de golpes de una unidad con Golpe Letal, la fracción que aplica el multiplicador de daño se acerca a la probabilidad configurada.
- **SC-002**: Un enemigo del rasgo objetivo de un Killer, con vida alta, muere en un solo golpe en una fracción de los intentos cercana a la probabilidad configurada; nunca muere instantáneamente por ese Killer si no pertenece al rasgo objetivo.
- **SC-003**: Una unidad con Escudo no pierde `hp` hasta que el daño acumulado recibido supera el tamaño de su escudo; a partir de ahí, pierde exactamente el excedente.
- **SC-004**: Al morir una unidad con Invocar configurado, aparece(n) la o las unidades aliadas configuradas en su posición, capaces de actuar con normalidad desde el siguiente tick.
- **SC-005**: Ninguna unidad existente antes de esta spec cambia su comportamiento observable si no declara ninguna de las cuatro capacidades nuevas.
- **SC-006**: `npx tsc -b` limpio y `npm test` en verde, sin regresión en la suite existente de `src/engine/`.

## Assumptions

- Reutiliza el mecanismo de selección de objetivo ya existente (`Ability.TraitTargeting`, `specs/009`) para `TraitKiller` — esta spec define **qué hace** la nueva capacidad, no **cómo se decide** a quién se aplica.
- Los valores de referencia (probabilidad, multiplicador, tamaño de escudo, `catId`/cantidad a invocar) se definen como datos semilla ajustables en `src/data/cats.ts`, sin tocar código (Constitución § IV) — se asigna al menos una demostración de cada capacidad nueva a una unidad ya existente, mismo criterio que `specs/015`.
- De las variantes de Killer del catálogo de referencia (Roja/Flotante/Negra/Ángel/Alienígena/Zombie/Reliquia/Metálico), esta spec prioriza **2-3** con sentido inmediato (ej. Zombie Killer y Metálico Killer) — el resto queda como catálogo de datos disponible pero sin obligación de asignarse a ninguna unidad todavía, mismo criterio de priorización parcial que `specs/015` (5 de ~40 posibles).
- Inmunidad específica a estas capacidades nuevas (ej. "inmune a Golpe Letal/Killer", común en jefes del juego de referencia) queda fuera de alcance — candidato a una iteración futura, igual que `specs/015` dejó fuera el resto del catálogo (Constitución § VII, simplicidad desde el MVP).
- No se requiere ninguna animación o variante visual nueva por capacidad — la identidad visual animada (Constitución § III) ya está cubierta a nivel de unidad, independientemente de qué habilidades declare.
- Esta spec no modifica `AttackType`, `ClassificationType` ni `SpecialClassificationType` — solo agrega miembros nuevos a `Ability` y un campo opcional a `BattleUnit`, mismo patrón de extensión aditiva que `specs/009`/`specs/015`/`specs/016`.
- `SummonOnDeath` reutiliza la misma construcción de `BattleUnit` que ya usa el spawn de oleada/despliegue (`src/game/graphics/unitFactory.ts` o equivalente) — no introduce un segundo mecanismo de creación de unidades.
