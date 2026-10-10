# Feature Specification: Catálogo de Habilidades de Combate — Dinero Extra e Inmunidad a Habilidades

**Feature Branch**: `040-dinero-extra-inmunidades`

**Created**: 2026-10-01

**Status**: Draft

**Input**: Tercera tanda del catálogo de habilidades de combate, cola explícita de `specs/038-catalogo-habilidades-avanzado` y `specs/039-habilidades-control-defensa` (ver README, "Qué falta"): **Dinero Extra** (derrotar a un enemigo con ciertas unidades concede energía extra de batalla) e **Inmunidad a habilidades** (una unidad — típicamente un jefe — ignora por completo Golpe Letal, Killer de rasgo y/o Retroceso). `specs/038` y `specs/039` dejaron la inmunidad explícitamente fuera de alcance ("común en jefes del juego de referencia") y esta spec la cierra, junto con la única habilidad de utilidad de economía del catálogo de referencia que no depende de ningún sistema nuevo. Sigue https://battlecats.miraheze.org/wiki/Special_Abilities.

**Relación con el proyecto existente**: Extiende `specs/009-clasificacion-habilidades` (`Ability`, bloqueo por `Curse`), `specs/015-catalogo-habilidades-combate` (`immuneEffects`, el patrón de inmunidad por tipo de efecto que esta spec generaliza a habilidades), `specs/038-catalogo-habilidades-avanzado` (`MassiveDamage`/`TraitKiller`) y `specs/039-habilidades-control-defensa` (`Knockback`, la tubería de un golpe individual `applyHit`). No redefine `AttackType`, `ClassificationType`, `SpecialClassificationType` ni `EffectType`. La energía de batalla — el recurso con el que se despliegan unidades (Constitución § I) — es lo que el juego de referencia llama "dinero": esta spec le añade una fuente nueva sin tocar la regeneración por tiempo.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Dinero Extra: derrotar enemigos financia más despliegues (Priority: P1)

Un jugador despliega una unidad con "Dinero Extra": cada vez que ella asesta el golpe que derrota a un enemigo, el jugador recibe de inmediato una cantidad extra de energía, además de la que ya regenera con el tiempo — una unidad que se paga sola si sobrevive y elimina enemigos, y que premia llevarla al frente.

**Why this priority**: Es la única habilidad de utilidad del catálogo que cambia la economía de la batalla (hoy la energía solo regenera por tiempo) y es independiente de las inmunidades, así que es un buen primer entregable por sí sola.

**Independent Test**: Hacer que una unidad con Dinero Extra derrote a un enemigo de poca vida y verificar que la energía del jugador sube exactamente el bono configurado en ese mismo paso de simulación (sin pasar del máximo), y que una unidad idéntica sin la habilidad no la altera.

**Acceptance Scenarios**:

1. **Given** una unidad del jugador con Dinero Extra (bono `energyBonus`) y un enemigo al que le queda menos vida que su daño, **When** su ataque lo derrota, **Then** la energía actual del jugador aumenta en `energyBonus` en ese mismo paso, sin superar el máximo de energía del nivel.
2. **Given** la misma unidad, **When** su ataque conecta pero el enemigo sobrevive (incluido sobrevivir con 1 de vida por `specs/039`), **Then** la energía no recibe ningún bono.
3. **Given** un enemigo derrotado por una unidad del jugador que NO declara Dinero Extra, **When** se resuelve el paso, **Then** la energía no recibe ningún bono.
4. **Given** una unidad con Dinero Extra de tipo Área, **When** su ataque derrota al objetivo primario y a dos objetivos de salpicadura en el mismo paso, **Then** el jugador recibe el bono tres veces (uno por enemigo derrotado).
5. **Given** una unidad con Dinero Extra bajo `Curse` (`specs/009`), **When** derrota a un enemigo, **Then** no hay bono mientras dure el efecto.
6. **Given** una unidad con Dinero Extra que derrota a un enemigo con una eliminación instantánea de Killer (`specs/038`), **When** se resuelve, **Then** cuenta como derrota igual que cualquier otra y concede el bono.
7. **Given** un enemigo derrotado por el cañón especial de la base (`specs/012`) y no por el golpe de una unidad, **When** se resuelve, **Then** ninguna unidad recibe crédito y no hay bono.

---

### User Story 2 - Inmunidad: los jefes ignoran Golpe Letal, Killer y Retroceso (Priority: P2)

Una unidad (típicamente un jefe) declara ser inmune a una o más habilidades ofensivas — Golpe Letal, Killer de rasgo y/o Retroceso — y las ignora por completo: los golpes que la alcanzan hacen su daño normal, sin multiplicarse, sin eliminarla de golpe y sin empujarla. Evita que un jefe con mucha vida caiga en un solo golpe o quede fuera de combate por un empuje.

**Why this priority**: Es el contrapeso explícitamente pendiente de `specs/038`/`specs/039` y sigue el mismo patrón ya validado por `immuneEffects` (`specs/015`) — pero por sí sola solo tiene efecto observable en combinación con las habilidades ofensivas de esas specs, por lo que se entrega después de Dinero Extra.

**Independent Test**: Hacer que un atacante con una habilidad ofensiva de probabilidad 1 golpee a un defensor inmune a ella y a otro no inmune, y verificar que el inmune recibe solo el daño normal (sin multiplicar / sin eliminación / sin desplazamiento) mientras el otro sufre el efecto completo.

**Acceptance Scenarios**:

1. **Given** un atacante con Golpe Letal (probabilidad 1) y un defensor inmune a Golpe Letal, **When** el golpe conecta, **Then** el daño es el normal, sin multiplicador.
2. **Given** un atacante con un Killer dirigido al rasgo del defensor (probabilidad 1) y un defensor inmune a Killer, **When** el golpe conecta, **Then** el defensor no es eliminado instantáneamente — recibe el daño normal.
3. **Given** un atacante con Retroceso (probabilidad 1) y un defensor inmune a Retroceso que sobrevive al golpe, **When** el golpe conecta, **Then** el defensor no se desplaza.
4. **Given** un defensor inmune solo a Retroceso, **When** lo golpea un atacante con Golpe Letal y Retroceso (ambos probabilidad 1), **Then** el Golpe Letal se aplica y el Retroceso no — cada inmunidad es independiente.
5. **Given** un ataque de Área contra un objetivo primario inmune y un objetivo de salpicadura no inmune, **When** conecta, **Then** la inmunidad se evalúa por objetivo: el primario la ignora y la salpicadura sufre el efecto completo.
6. **Given** un defensor inmune bajo `Curse`, **When** lo golpea una habilidad a la que es inmune, **Then** sigue siendo inmune — la inmunidad es una propiedad pasiva, igual que `immuneEffects`.
7. **Given** un atacante con habilidad a la que el defensor es inmune, **When** el golpe se resuelve, **Then** esa habilidad no consume su tirada de probabilidad (no hay roll para algo que no puede aplicarse).

---

### User Story 3 - Ver las inmunidades y el bono de un vistazo (Priority: P3)

Un jugador consulta una unidad propia o un enemigo en las pantallas de información y ve, sin tener que adivinarlo en combate, qué habilidades ignora y cuánta energía concede una unidad con Dinero Extra.

**Why this priority**: Es información de apoyo — el comportamiento de combate funciona sin ella — pero evita que las inmunidades de un jefe sean una sorpresa opaca y completa la presentación de las dos habilidades anteriores.

**Independent Test**: Abrir el detalle de una unidad con Dinero Extra y/o inmunidad, y la Guía de Enemigos con un jefe inmune ya enfrentado, y verificar que cada habilidad aparece descrita con su nombre y valores.

**Acceptance Scenarios**:

1. **Given** una unidad poseída con Dinero Extra, **When** el jugador abre su detalle, **Then** la fila de habilidades la describe con el bono de energía.
2. **Given** una unidad poseída inmune a alguna habilidad, **When** abre su detalle, **Then** se muestra una fila "Inmune a" con los nombres de esas habilidades.
3. **Given** un enemigo con inmunidades que el jugador ya enfrentó, **When** abre la Guía de Enemigos, **Then** la entrada de ese enemigo lista sus inmunidades; los enemigos sin inmunidades se muestran exactamente como hoy.

---

### Edge Cases

- Dos enemigos derrotados por la misma unidad (o por dos unidades con Dinero Extra distintas) en el mismo paso: cada derrota concede su bono, sumados; el resultado nunca supera el máximo de energía.
- Una unidad con Dinero Extra que muere en el mismo paso en que derrota a un enemigo (el intercambio es simultáneo): el bono se concede igualmente — la derrota es suya aunque ella también caiga.
- El enemigo derrotado es de refuerzo de fila (`specs/028`): varios atacantes pueden golpear al mismo objetivo en un mismo paso; el crédito (y el bono) es del atacante cuyo golpe dejó la vida del objetivo en 0 — los golpes posteriores sobre un objetivo ya caído no se resuelven.
- Dinero Extra declarado por una unidad enemiga: sin efecto — el bono solo existe para la energía del jugador.
- Dinero Extra con el jugador ya al máximo de energía: el bono se pierde (no hay acumulación por encima del máximo ni "reserva").
- Una unidad derrotada por la eliminación de un Killer contra la que Sobrevivir (`specs/039`) acierta: no se derrota, no hay bono.
- Inmunidad contra una habilidad que el atacante no tiene: sin efecto observable (la lista de inmunidades de un defensor es solo un dato).
- Un atacante con `Curse` cuya habilidad ofensiva ya no se aplica por `specs/009`: la inmunidad del defensor es irrelevante en ese golpe.
- Un golpe contra una base (la del jugador o la enemiga): las inmunidades no aplican — una base no es una unidad; Golpe Letal contra una base sigue funcionando como hoy.
- El cañón especial de la base no es un golpe de unidad y no se ve afectado por ninguna inmunidad ni concede Dinero Extra.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `Ability` (`src/engine/types.ts`) DEBE ganar un miembro `ExtraMoney` (`{ kind: 'ExtraMoney'; energyBonus: number }`): cuando una unidad del jugador que lo declara asesta el golpe que derrota a una unidad enemiga (su `hp` queda en 0 tras resolver Sobrevivir), la energía actual del jugador DEBE aumentar en `energyBonus` en el mismo paso de simulación, sin superar `energy.max`.
- **FR-002**: El bono DEBE concederse por cada enemigo derrotado por el golpe — objetivo primario, objetivos de salpicadura y secuencias `MultiHit` incluidos — y DEBE incluir las derrotas por eliminación instantánea de `TraitKiller`.
- **FR-003**: NO DEBE concederse bono cuando: la unidad con Dinero Extra está bajo `Curse` (mismo criterio que el resto de habilidades que "se aplican", `specs/009` FR-009); el golpe no derrota al objetivo; el derrotado no es una unidad enemiga; o la derrota no proviene del golpe de una unidad (cañón especial).
- **FR-004**: Una unidad enemiga con Dinero Extra NO DEBE tener ningún efecto sobre la energía del jugador.
- **FR-005**: `Cat` y `BattleUnit` DEBEN ganar `immuneAbilities?: ('MassiveDamage' | 'TraitKiller' | 'Knockback')[]` (ausente = sin inmunidades). Un defensor que lista una habilidad ignora por completo su efecto cuando lo golpea una unidad que la declara: Golpe Letal no multiplica el daño, Killer no elimina al objetivo y Retroceso no lo desplaza — el golpe se resuelve por lo demás como cualquier otro.
- **FR-006**: Cada inmunidad DEBE evaluarse de forma independiente por golpe y por objetivo (primario y salpicadura, cada golpe de una secuencia `MultiHit`), y la habilidad ignorada NO DEBE consumir su tirada de probabilidad.
- **FR-007**: La inmunidad NO DEBE verse afectada por `Curse` — es una propiedad pasiva del defensor, igual que `immuneEffects` (`specs/015`).
- **FR-008**: El jefe vinculado del Capítulo 1 (`enemy-la-mascara`, `specs/027`) DEBE declarar inmunidad a las tres habilidades como datos semilla — el único cambio observable es el pretendido: contra ese jefe, las unidades que declaren Golpe Letal/Killer/Retroceso (hoy solo los gatos de demostración de `specs/038`/`specs/039`) ya no los aplican; ninguna otra unidad ni ningún otro enemigo cambia.
- **FR-009**: Ninguna unidad existente que no declare Dinero Extra ni inmunidades DEBE cambiar su comportamiento observable, incluidas las que sí usan las habilidades de `specs/038`/`specs/039` contra defensores sin inmunidades.
- **FR-010**: El panel de detalle de unidad (`UnitDetailPanel`, `specs/030`) DEBE describir Dinero Extra con su bono y DEBE mostrar una fila "Inmune a" cuando la unidad declara inmunidades; la Guía de Enemigos (`specs/018`) DEBE listar las inmunidades de cada enemigo enfrentado que las tenga, sin cambiar la entrada de los que no.

### Key Entities *(include if feature involves data)*

- **`Ability.ExtraMoney`** (nuevo): bono fijo de energía de batalla por enemigo derrotado por el golpe de la unidad que la declara.
- **`immuneAbilities`** (nuevo, en `Cat`/`BattleUnit`): lista de habilidades ofensivas (Golpe Letal, Killer, Retroceso) que la unidad ignora — complementa a `immuneEffects` (efectos de estado) del mismo modo que `TraitResistance` complementa a `TraitTargeting`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Tras derrotar a N enemigos con golpes de una unidad con Dinero Extra, la energía del jugador ha subido exactamente N veces el bono configurado (hasta el máximo del nivel), y no sube con derrotas hechas por unidades sin la habilidad ni por el cañón especial.
- **SC-002**: En una muestra grande de golpes con la habilidad ofensiva a probabilidad 1 contra un defensor inmune a ella, ninguno aplica su efecto (0 multiplicaciones, 0 eliminaciones, 0 desplazamientos), mientras que los mismos golpes contra un defensor no inmune lo aplican todas las veces.
- **SC-003**: La inmunidad a una habilidad nunca altera el efecto de las demás habilidades del mismo atacante.
- **SC-004**: Un jugador puede ver, sin entrar en combate, el bono de Dinero Extra y las inmunidades de cualquier unidad suya y de cualquier enemigo ya enfrentado.
- **SC-005**: Ninguna unidad existente antes de esta spec cambia su comportamiento observable si no declara Dinero Extra ni inmunidades.
- **SC-006**: `npx tsc -b` limpio y `npm test` en verde, sin regresión en la suite existente.

## Assumptions

- Dinero Extra concede una cantidad **fija** de energía por enemigo derrotado (`energyBonus`). El juego de referencia lo expresa como un múltiplo del dinero que suelta cada enemigo; hoy los enemigos de este proyecto no tienen un "valor de dinero" propio, así que modelar un valor base por enemigo (y su multiplicador) queda fuera de alcance (Constitución § VII) y puede añadirse como extensión aditiva sobre el mismo miembro.
- La energía es el recurso de batalla que el jugador gasta en desplegar unidades (Constitución § I) — equivalente al "dinero" del juego de referencia; no se toca la moneda persistente (`currency`) ni la recompensa de fin de nivel.
- El crédito de una derrota lo lleva la unidad cuyo golpe deja el `hp` del enemigo en 0 (tras Sobrevivir). Se guarda como estado efímero de batalla en la unidad derrotada, que se descarta con ella al final del paso — nunca se persiste (Constitución § V).
- Las inmunidades nuevas se limitan a las tres habilidades ofensivas que "golpean" a un objetivo concreto; las inmunidades a efectos de estado ya existen (`immuneEffects`) y Esquivar/Sobrevivir/Fortalecer/Escudo no tienen sentido como habilidades a ignorar por un defensor. Inmunidad a otras habilidades futuras se añade ampliando la lista permitida.
- Los valores de referencia (bono de energía, lista de inmunidades de `enemy-la-mascara`) se definen como datos semilla ajustables en `src/data/cats.ts` (Constitución § IV) — se agregan dos gatos de demostración nuevos (uno con Dinero Extra, uno inmune a Retroceso), sin modificar los gatos existentes, mismo criterio que `specs/038`/`specs/039`; como aquellos, son de rareza `Raro` y por tanto ya pueden salir de la Cápsula (el pool de gacha filtra el catálogo por rareza, `specs/024`).
- No se agrega ninguna animación, sonido ni indicador visual nuevo para el bono de energía (la barra de energía del HUD ya refleja el valor) — la identidad visual animada (Constitución § III) ya está cubierta a nivel de unidad.
- Esta spec no modifica `AttackType`, `ClassificationType`, `SpecialClassificationType` ni `EffectType` — solo agrega un miembro a `Ability` y dos campos opcionales a `Cat`/`BattleUnit`, mismo patrón de extensión aditiva que `specs/009`/`specs/015`/`specs/016`/`specs/038`/`specs/039`.
