# Feature Specification: Cabezas de Cañón (Ototo Corps)

**Feature Branch**: `041-cabezas-de-canon`

**Created**: 2026-10-01

**Status**: Draft

**Input**: Cabezas de Cañón del Cuerpo Ototo (manual técnico §9.2, https://battlecats.miraheze.org/wiki/Ototo_Development_Team): una tercera construcción — junto a la Base y el Estilo de `specs/035-ototo-corps` — que se paga con materiales de Gamatoto (`specs/034`), se construye de forma asíncrona por timestamp y, una vez completada, da al cañón especial de la base (`specs/012`/`specs/029`) un **efecto secundario** elegido por el jugador: **Retroceso** (empuja a los enemigos alcanzados hacia su base, reutilizando el desplazamiento que introdujo `specs/039`) o un debuff de estado — **Debilitar**, **Congelar**, **Ralentizar** o **Maldecir** (reutilizando los efectos de `specs/009`/`specs/015`). `specs/035` dejó esto explícitamente fuera de alcance ("el cañón especial hoy tiene un único efecto fijo (daño de área) sin ningún comportamiento secundario codificado en ningún lado") y la cola de "Qué falta" del README lo marcaba como pendiente hasta que existiera un efecto secundario base — `specs/039` lo introdujo.

**Relación con el proyecto existente**: Extiende `specs/035-ototo-corps` (catálogo de construcciones, construcción por timestamp, panel `OtotoCorpsPanel`, `useMetaStore.startOtotoConstruction`/`claimOtotoConstruction`, tabla `ototoCorps`), `specs/012`/`specs/029` (cañón especial: `useGameStore.activateSpecialCannon`, control de cañón del HUD de batalla), `specs/039-habilidades-control-defensa` (desplazamiento de Retroceso), `specs/015-catalogo-habilidades-combate` (efectos Debilitar/Congelar/Ralentizar, `immuneEffects`, `resistantTo`) y `specs/040-dinero-extra-inmunidades` (`immuneAbilities`: la inmunidad a Retroceso de un enemigo). No cambia el daño, el radio ni la recarga del cañón (`specs/031` los mejora aparte) ni las dos construcciones existentes.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Construir una Cabeza de Cañón (Priority: P1)

Un jugador con materiales de Gamatoto abre el panel del Cuerpo Ototo, elige la tercera construcción — "Cabeza de Cañón" —, elige el efecto secundario que quiere para su cañón (Retroceso, Debilitar, Congelar, Ralentizar o Maldecir) y confirma; la construcción queda en curso, avanza por tiempo real aunque la aplicación esté cerrada y, al completarse, se reclama.

**Why this priority**: Sin la construcción no hay ningún efecto jugable — es la puerta de entrada de todo el sistema, y reutiliza por completo el flujo ya validado de las dos construcciones existentes.

**Independent Test**: Con materiales suficientes, construir la Cabeza de Cañón eligiendo un efecto, simular que pasó el tiempo, reclamarla y confirmar que la elección queda guardada y sobrevive a recargar la aplicación.

**Acceptance Scenarios**:

1. **Given** el jugador tiene materiales suficientes y no hay otra construcción en curso, **When** abre el panel y elige construir la Cabeza de Cañón con un efecto, **Then** los materiales se descuentan, la construcción queda registrada como en curso y no puede iniciar otra hasta que esta termine.
2. **Given** materiales insuficientes, **When** el jugador mira la Cabeza de Cañón, **Then** la opción de construir aparece deshabilitada.
3. **Given** una Cabeza de Cañón en curso cuyo tiempo se cumplió, **When** el jugador la reclama, **Then** el efecto elegido queda activo y la construcción deja de estar en curso.
4. **Given** una Cabeza de Cañón ya construida con un efecto, **When** el jugador ve el panel, **Then** ve el efecto actual y puede iniciar una nueva construcción para reemplazarlo (mismo costo y tiempo que la primera vez).
5. **Given** una Cabeza de Cañón ya reclamada, **When** el jugador cierra y vuelve a abrir la aplicación, **Then** el efecto sigue activo (persistencia local-first, igual que Base y Estilo).
6. **Given** la Base o el Estilo en curso, **When** el jugador mira el panel, **Then** tampoco puede iniciar la Cabeza de Cañón — una sola construcción a la vez, como hoy.

---

### User Story 2 - El cañón especial aplica el efecto elegido (Priority: P1)

Un jugador con una Cabeza de Cañón construida dispara el cañón especial en batalla: además del daño de área de siempre, cada enemigo alcanzado que sobrevive al disparo sufre el efecto secundario elegido — es empujado hacia atrás, o queda debilitado, congelado, ralentizado o maldecido durante unos segundos — dándole al jugador una herramienta de control de campo, no solo de daño.

**Why this priority**: Es el efecto jugable de toda la feature — sin esto la construcción es decorativa — y es la razón de que `specs/039` introdujera el desplazamiento.

**Independent Test**: Con una Cabeza de Cañón de cada tipo construida, disparar el cañón contra enemigos dentro y fuera del radio y verificar que solo los alcanzados que sobreviven reciben el efecto (desplazados o con su estado activo), que el daño del cañón es el mismo de siempre y que sin Cabeza de Cañón el disparo se comporta exactamente como antes.

**Acceptance Scenarios**:

1. **Given** una Cabeza de Cañón de Retroceso, **When** se dispara el cañón, **Then** cada enemigo dentro del radio que sobrevive al daño se desplaza una distancia fija hacia su propia base, sin salir del carril.
2. **Given** una Cabeza de Cañón de Debilitar, Congelar, Ralentizar o Maldecir, **When** se dispara el cañón, **Then** cada enemigo alcanzado que sobrevive recibe ese efecto con una duración (y magnitud, para Debilitar/Ralentizar) fija, respetando sus inmunidades y resistencias a efectos.
3. **Given** un enemigo alcanzado cuya vida llega a 0 por el daño del cañón, **When** se resuelve el disparo, **Then** no recibe ningún efecto — se descarta como hoy.
4. **Given** un enemigo fuera del radio del cañón, **When** se dispara, **Then** no recibe daño ni efecto.
5. **Given** un enemigo inmune a Retroceso (`specs/040`) y una Cabeza de Cañón de Retroceso, **When** se dispara, **Then** ese enemigo recibe el daño pero no se desplaza.
6. **Given** un enemigo inmune al efecto elegido (`immuneEffects`, `specs/015`), **When** se dispara una Cabeza de Cañón de ese efecto, **Then** ese enemigo recibe el daño pero no el efecto; uno con resistencia (`resistantTo`) lo recibe con la duración reducida.
7. **Given** un enemigo que ya sufría el mismo efecto, **When** el cañón vuelve a alcanzarlo, **Then** la duración se refresca sin acumularse (regla ya vigente de los efectos de estado).
8. **Given** el jugador sin ninguna Cabeza de Cañón construida, **When** dispara el cañón, **Then** el comportamiento (daño, rango, recarga, enemigos eliminados) es exactamente el de hoy.

---

### User Story 3 - Ver el efecto del cañón antes de dispararlo (Priority: P3)

Un jugador con una Cabeza de Cañón construida ve, en el control de cañón del HUD de batalla, qué efecto secundario tiene — para saber qué esperar sin recordar qué construyó.

**Why this priority**: Es información de apoyo — el efecto funciona sin ella — pero evita que el jugador tenga que acordarse de su elección; con riesgo bajo, al ser solo lectura.

**Independent Test**: Entrar a una batalla con y sin Cabeza de Cañón construida y verificar que el control de cañón muestra el nombre del efecto solo en el primer caso.

**Acceptance Scenarios**:

1. **Given** una Cabeza de Cañón construida, **When** el jugador está en batalla, **Then** el control de cañón del HUD muestra el nombre del efecto elegido junto a su etiqueta.
2. **Given** ninguna Cabeza de Cañón construida, **When** el jugador está en batalla, **Then** el control de cañón se muestra exactamente como hoy.

---

### Edge Cases

- Una Cabeza de Cañón de Retroceso contra un enemigo ya en el borde de su carril (o más allá): no hay desplazamiento, pero el daño del cañón se resuelve igual (mismo comportamiento que `specs/039` FR-005).
- El cañón alcanza a un enemigo con escudo (`specs/038`): el daño directo del cañón no consume el escudo (comportamiento ya vigente, el cañón no es un golpe de unidad) y el efecto secundario se aplica igual al enemigo que sigue vivo.
- Cañón disparado sin ningún enemigo en rango: no hay efectos; la recarga se reinicia como siempre.
- Reemplazar una Cabeza de Cañón ya construida con otra: la anterior sigue activa hasta que la nueva se reclama (mismo criterio que la Base y el Estilo, `specs/035`).
- Una unidad del jugador (o cualquier unidad que no sea enemiga) dentro del radio: no recibe daño ni efecto — el cañón solo alcanza a enemigos, como hoy.
- Aplicar Maldición con el cañón a un enemigo con habilidades (`specs/009`): las suspende mientras dure — es el uso táctico de esa cabeza.
- Cabeza de Cañón construida en una sesión anterior con una elección que ya no existe en el catálogo de efectos: fuera de alcance — se asume que las elecciones persistidas son siempre válidas (mismo criterio que `specs/035`).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El catálogo de construcciones del Cuerpo Ototo (`OTOTO_BUILDINGS`) DEBE incluir una tercera construcción, "Cabeza de Cañón" (`cannonHead`), con costo en materiales de Gamatoto y duración de construcción propios (valores provisionales), reutilizando el mismo flujo de inicio, avance por timestamp persistido y reclamación que la Base y el Estilo (`specs/035` FR-001..FR-005); solo puede haber una construcción en curso a la vez, de cualquier tipo.
- **FR-002**: Las elecciones válidas de la Cabeza de Cañón DEBEN ser exactamente cinco: Retroceso, Debilitar, Congelar, Ralentizar y Maldecir. Al reclamarla, la elección DEBE quedar activa y persistida localmente de inmediato (Constitución § V), junto a las elecciones de Base y Estilo.
- **FR-003**: Con una Cabeza de Cañón activa, `activateSpecialCannon` DEBE aplicar el efecto elegido a cada enemigo dentro del radio del cañón cuya vida siga siendo mayor a 0 tras el daño del disparo. Los enemigos derrotados por el cañón y los enemigos fuera del radio NO DEBEN recibir ningún efecto; las unidades que no son enemigas NO DEBEN verse afectadas.
- **FR-004**: Retroceso DEBE desplazar a cada enemigo alcanzado una distancia fija hacia su propia base (hacia mayor `x`), sin superar el borde de aparición de su carril (`laneLength - width`, mismo criterio que `specs/039` FR-005); un enemigo inmune a Retroceso (`immuneAbilities`, `specs/040`) NO DEBE desplazarse.
- **FR-005**: Debilitar, Congelar, Ralentizar y Maldecir DEBEN aplicarse a cada enemigo alcanzado con la duración (y magnitud, para Debilitar y Ralentizar) fija del catálogo, respetando `immuneEffects` y reduciendo la duración con `resistantTo` — exactamente las mismas reglas que ya aplican los efectos de estado on-hit (`specs/015` FR-008/FR-009), incluido que se refrescan sin acumularse.
- **FR-006**: El daño, el radio de efecto y la recarga del cañón especial NO DEBEN cambiar por tener o no una Cabeza de Cañón; el efecto secundario es adicional.
- **FR-007**: Sin ninguna Cabeza de Cañón activa, `activateSpecialCannon` DEBE comportarse exactamente como hasta hoy.
- **FR-008**: El control de cañón del HUD de batalla DEBE mostrar el nombre del efecto elegido cuando hay una Cabeza de Cañón activa, y DEBE mostrarse exactamente como hoy cuando no la hay.
- **FR-009**: La Base y el Estilo (`specs/035`) DEBEN conservar exactamente su comportamiento, costos, tiempos y panel; la única diferencia visible en el panel es la nueva tercera fila.

### Key Entities *(include if feature involves data)*

- **Cabeza de Cañón** (nueva construcción del catálogo del Cuerpo Ototo): costo, duración y las cinco elecciones posibles de efecto secundario del cañón especial.
- **Elección activa de Cabeza de Cañón** (persistida junto a las elecciones de Base y Estilo): efecto que el cañón especial aplica a los enemigos alcanzados; ausente = el cañón no tiene efecto secundario.
- **Efecto secundario del cañón** (parámetros fijos del catálogo): distancia de Retroceso y duración/magnitud de cada debuff.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Con una Cabeza de Cañón construida, el 100% de los enemigos que sobreviven a un disparo y están dentro del radio reciben el efecto elegido (salvo inmunidad), y el 0% de los enemigos fuera del radio, derrotados por el disparo o ajenos al equipo enemigo lo reciben.
- **SC-002**: Un disparo con y sin Cabeza de Cañón produce exactamente el mismo daño y la misma recarga; sin ninguna Cabeza de Cañón el resultado completo del disparo es idéntico al de antes de esta spec.
- **SC-003**: Una Cabeza de Cañón reclamada sigue activa tras recargar la aplicación (persistencia local) y el tiempo de construcción avanza con la aplicación cerrada (mismo criterio de verificación que `specs/034`/`specs/035`).
- **SC-004**: Las construcciones de Base y Estilo conservan exactamente su comportamiento anterior (SC de `specs/035` sin regresión).
- **SC-005**: El jugador puede ver en el HUD de batalla qué efecto tiene su cañón sin abrir ningún menú.
- **SC-006**: `npx tsc -b` limpio y `npm test` en verde, sin regresión en la suite existente.

## Assumptions

- La Cabeza de Cañón se modela como una tercera entrada de `OTOTO_BUILDINGS`, con el mismo mecanismo de construcción por timestamp (`OtotoConstruction`) y la misma fila persistida (`ototoCorps`) que Base y Estilo; solo se amplían los tipos de la elección. Como la fila de IndexedDB gana solo una clave opcional no indexada, no hace falta una nueva versión de esquema.
- Los valores de referencia — costo en materiales, duración, distancia de Retroceso, duración y magnitud de cada debuff — son datos provisionales no balanceados en `src/data/ototoCorps.ts` (Constitución § IV), mismo estatus que los de `specs/035`. Retroceso empuja una distancia mayor que la del Retroceso de una unidad (el cañón es el recurso táctico de la base).
- El efecto secundario del cañón NO pasa por la tubería de golpes de unidad (`applyHit`): el cañón sigue sin ser un golpe de unidad (no activa Esquivar/Sobrevivir/Escudo ni concede Dinero Extra, `specs/039` Decisión 7), pero reutiliza el mismo desplazamiento de Retroceso y las mismas reglas de aplicación de efectos de estado, para que inmunidades y resistencias se comporten igual que en combate.
- Solo las cinco elecciones de arriba; otras cabezas del juego de referencia (Muro de Hierro, Rayo, Agua, Luz Sagrada, Rompe-escudos, etc.) quedan fuera de alcance (Constitución § VII) y pueden añadirse como nuevas elecciones sin cambiar el modelo.
- No se agrega ninguna animación, sonido ni indicador visual de impacto nuevo para el efecto — la identidad visual animada (Constitución § III) ya está cubierta a nivel de unidad; el desplazamiento es instantáneo, igual que el de `specs/039`.
- El cañón del lado enemigo no existe en el motor; esta spec solo afecta al cañón especial del jugador.
- El efecto secundario se lee del estado persistente del jugador en el momento de disparar (igual que `deployUnit` lee las construcciones de Base y Estilo en el momento de desplegar), nunca se persiste dentro del estado efímero de la batalla.
