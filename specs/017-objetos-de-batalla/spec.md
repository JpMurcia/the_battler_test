# Feature Specification: Sistema de Objetos de Batalla

**Feature Branch**: `017-objetos-de-batalla`

**Created**: 2026-08-15

**Status**: Draft

**Input**: Adaptación a battle-cats-web de `the_battler_test/specs/018-battle-items` (proyecto Unity origen): el jugador selecciona hasta un número limitado de consumibles antes de entrar a un nivel (aceleración de velocidad, energía extra, radar de tesoro), obtenidos como recompensa de nivel (no gacha), integrados en el flujo de preparación pre-batalla ya existente (`specs/006-dashboard-base-jugador`/`TeamScreen`).

## Clarifications

### Adaptación del objeto "recompensa"

El origen usa "Radar de Tesoro" para *garantizar* el tesoro ya determinista del nivel — en battle-cats-web `Level.treasureId` (`specs/012-saga-imperio-de-los-gatos`) ya se otorga de forma determinista al ganar, sin sistema de probabilidad de drop, así que un objeto que "garantice" ese mismo tesoro no tendría efecto observable. Igual que el origen resolvió esta misma ambigüedad (`the_battler_test/specs/018-battle-items` § Clarifications, Opción B elegida): "Radar de Tesoro" otorga, al ganar, un tesoro **adicional** elegido al azar entre los que el jugador aún no posee de todo el catálogo (`specs/012` `obtainedTreasureIds`), independiente del `treasureId` propio del nivel.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Seleccionar objetos de batalla antes de entrar a un nivel (Priority: P1)

Un jugador con objetos de batalla en su inventario los selecciona, hasta un límite máximo, desde el mismo flujo de preparación pre-batalla donde ya organiza su equipo (`TeamScreen`).

**Why this priority**: Punto de entrada de todo el sistema — sin selección, ningún objeto llega a usarse en batalla.

**Independent Test**: Con al menos un objeto disponible en inventario, entrar a `TeamScreen`, seleccionarlo y confirmar que queda marcado como elegido para la siguiente batalla.

**Acceptance Scenarios**:

1. **Given** el jugador tiene al menos un objeto de batalla disponible, **When** entra a `TeamScreen`, **Then** puede seleccionarlo para la próxima batalla.
2. **Given** el jugador ya seleccionó el número máximo permitido, **When** intenta seleccionar uno adicional, **Then** el sistema no lo permite hasta que deseleccione otro.
3. **Given** el jugador no tiene ningún objeto en inventario, **When** entra a `TeamScreen`, **Then** puede continuar y entrar a la batalla sin seleccionar ninguno.

---

### User Story 2 - Un objeto seleccionado surte su efecto desde el inicio de la batalla (Priority: P1)

Un jugador que entró a una batalla con un objeto seleccionado observa su efecto activo desde el primer instante.

**Why this priority**: Valor central del sistema — sin efecto observable, seleccionar un objeto no tendría ninguna consecuencia real.

**Independent Test**: Seleccionar un objeto de efecto observable (Aceleración de Velocidad) y confirmar que está activo desde el primer despliegue de unidades.

**Acceptance Scenarios**:

1. **Given** el jugador seleccionó "Aceleración de Velocidad" antes de entrar, **When** la batalla comienza, **Then** las unidades desplegadas se mueven más rápido que sin ese objeto, desde el primer despliegue.
2. **Given** el jugador seleccionó "Energía Extra", **When** la batalla comienza, **Then** `energy.current` inicial es mayor que sin ese objeto.
3. **Given** el jugador seleccionó "Radar de Tesoro" y aún le falta al menos un tesoro del catálogo completo, **When** completa la batalla con victoria, **Then** recibe un tesoro adicional elegido al azar entre los que todavía no posee, independiente y además del `treasureId` normal del nivel (si lo tiene).
4. **Given** el jugador seleccionó "Radar de Tesoro" pero ya posee todos los tesoros existentes, **When** gana la batalla, **Then** no recibe ningún tesoro adicional y no se produce ningún error.

---

### User Story 3 - Los objetos se obtienen jugando, no con moneda premium (Priority: P2)

Un jugador que completa un nivel configurado con recompensa de objeto de batalla lo recibe en su inventario, igual que ya recibe moneda o tesoro.

**Why this priority**: Sin una vía de obtención, el inventario nunca se llenaría y las Historias 1-2 no tendrían nada que seleccionar; depende de que exista el mecanismo de recompensa de nivel (`specs/012`).

**Independent Test**: Completar con victoria un nivel configurado con una recompensa de objeto de batalla y confirmar que aparece en el inventario tras la batalla.

**Acceptance Scenarios**:

1. **Given** un nivel declara una recompensa de objeto de batalla, **When** el jugador lo completa con victoria, **Then** ese objeto se añade al inventario, sumándose a la cantidad ya poseída del mismo tipo.
2. **Given** un nivel no declara ninguna recompensa de objeto, **When** el jugador lo completa, **Then** su inventario no cambia por esa batalla.

---

### Edge Cases

- El jugador selecciona un objeto en `TeamScreen` y navega a otras pantallas (`Upgrade`, `LevelSelect`) antes de entrar a una batalla: la selección se mantiene pendiente (no se descarta por navegar) hasta que efectivamente entra a jugar o la cambia explícitamente — nada se descuenta del inventario hasta `startLevel` (FR-006).
- El jugador entra a una batalla con un objeto seleccionado y la abandona (botón "Salir") antes de completarla: el objeto ya se descontó al entrar (mismo criterio que la energía de misión de `specs/007`, que tampoco se reembolsa al abandonar) — sin mecanismo de reembolso.
- El jugador selecciona varias unidades del mismo objeto: permitido si tiene más de una en inventario, respetando siempre el límite máximo total por batalla.
- Niveles existentes (`level-1`, `level-2`, y los de `specs/012`) que no declaran recompensa de objeto de batalla: siguen funcionando exactamente igual.
- Dos objetos seleccionados con efectos que se solapan (ej. dos fuentes de energía extra): cada efecto se aplica de forma independiente y aditiva.
- El jugador ya posee todos los tesoros y gana con "Radar de Tesoro" seleccionado: no recibe tesoro adicional, sin error ni compensación alternativa.
- El jugador reintenta la misma batalla tras una derrota sin volver a pasar por `TeamScreen`: el efecto del objeto sigue activo — ya se descontó una única vez al entrar, y esa misma entrada cubre todos sus reintentos.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE permitir seleccionar objetos de batalla del inventario, hasta un máximo configurable por batalla, integrado en `TeamScreen` (mismo flujo donde el jugador ya organiza `activeTeamCatIds`) como una selección pendiente que se mantiene hasta la siguiente entrada real a una batalla (`LevelSelectScreen` → "Jugar"), momento en el que se consume (FR-006) — battle-cats-web no tiene un paso de "preparación" separado por nivel entre elegir equipo y entrar a jugar.
- **FR-002**: El sistema DEBE ofrecer al menos tres objetos de batalla, cada uno de una categoría de efecto distinta: uno que modifica el combate ("Aceleración de Velocidad"), uno que modifica el recurso inicial de la batalla ("Energía Extra"), y uno que otorga un tesoro adicional al ganar ("Radar de Tesoro", ver Clarifications).
- **FR-003**: Los objetos de batalla DEBEN obtenerse únicamente como recompensa de nivel (`Level.battleItemRewards`, reutilizando el mecanismo de `specs/012-saga-imperio-de-los-gatos`) — nunca mediante gacha ni moneda premium.
- **FR-004**: El jugador DEBE poder entrar a cualquier batalla sin seleccionar ningún objeto — la selección es opcional.
- **FR-005**: El sistema DEBE mantener un inventario persistente por tipo de objeto, sobreviviendo cerrar y reabrir la aplicación.
- **FR-006**: El sistema DEBE descontar del inventario cada objeto seleccionado en el momento de entrar efectivamente a la batalla (`startLevel`), no antes ni después.
- **FR-007**: El sistema NO DEBE permitir seleccionar más objetos que el límite máximo por batalla, ni más unidades de un objeto que las disponibles en inventario.
- **FR-008**: Cada objeto seleccionado DEBE surtir su efecto en el momento correspondiente a su categoría: combate/recurso inicial desde el inicio de la batalla; recompensa ("Radar de Tesoro") al resolverse la victoria.
- **FR-009**: "Radar de Tesoro" DEBE otorgar, al resolverse una victoria, un tesoro elegido al azar entre los que el jugador aún no posea de todo el catálogo (`specs/012` `obtainedTreasureIds`/catálogo de tesoros), independiente y adicional al `treasureId` propio del nivel.
- **FR-010**: Si el jugador ya posee todos los tesoros al ganar con "Radar de Tesoro" seleccionado, el sistema NO DEBE producir ningún error ni efecto adicional — el objeto igual se consumió al entrar (FR-006).
- **FR-011**: Niveles existentes que no declaren recompensa de objeto de batalla DEBEN seguir funcionando exactamente igual que antes de esta feature.
- **FR-012**: Esta feature NO DEBE requerir gacha ni moneda premium, ni para obtener objetos ni para seleccionarlos (Constitución § VII).
- **FR-013**: El efecto de un objeto seleccionado DEBE seguir activo durante cualquier reintento de esa misma entrada a la batalla (tras derrota, sin volver a `TeamScreen`) — no se vuelve a descontar del inventario ni pierde su efecto al reintentar.

### Key Entities *(include if feature involves data)*

- **`BattleItem`** (nuevo, `src/data/battleItems.ts`): `id`, `name`, `category: 'Combat' | 'InitialResource' | 'TreasureBonus'`, parámetros de efecto (ej. `speedMultiplier`/`energyBonus`).
- **`battleItemInventory`** (nuevo, persistido en `useMetaStore`): `Record<itemId, number>`.
- **Selección Pre-Batalla** (nuevo, efímero en `useGameStore`/`TeamScreen`): hasta el límite máximo de `BattleItem` elegidos, descontados del inventario al entrar a la batalla.
- **`Level.battleItemRewards`** (nuevo, opcional, extiende `Level` de `specs/012`): objetos de batalla otorgados al completar el nivel con victoria.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Con al menos un objeto disponible, el jugador lo selecciona y entra a la batalla siguiente sin salir de `TeamScreen`, en el 100% de los casos de prueba.
- **SC-002**: Un objeto de combate/recurso inicial produce su efecto observable desde el primer instante de la batalla en el 100% de las partidas de prueba; "Radar de Tesoro" produce su tesoro adicional al resolverse la victoria en el 100% de las partidas donde quede al menos un tesoro pendiente.
- **SC-003**: El inventario refleja el descuento inmediatamente al entrar a la batalla, y ese descuento persiste tras cerrar y reabrir la aplicación.
- **SC-004**: El jugador puede completar una batalla sin objetos seleccionados sin ningún cambio de comportamiento observable respecto al flujo actual.
- **SC-005**: El sistema impide seleccionar más objetos que el límite máximo, o más unidades de un tipo que las disponibles, en el 100% de los intentos de prueba.
- **SC-006**: `npx tsc -b` limpio y `npm test` en verde.

## Assumptions

- El límite máximo de objetos seleccionables por batalla es un valor configurable a nivel de proyecto (no por nivel); se asume un valor por defecto razonable (3) para el MVP, ajustable sin cambiar el alcance funcional.
- Los tres objetos de ejemplo priorizados (FR-002) se basan en el catálogo público del juego de referencia; el resto del catálogo completo queda como contenido posterior, mismo patrón aditivo que `specs/012`/`specs/015`.
- El mecanismo de obtención reutiliza el mismo patrón de recompensa de nivel ya construido por `specs/012-saga-imperio-de-los-gatos` — se extiende de forma aditiva, sin modificar cómo se otorgan moneda/tesoro ya existentes.
- "Radar de Tesoro" introduce el único punto de aleatoriedad de esta feature: elegir un tesoro al azar entre los no poseídos, de todo el catálogo (no limitado al del nivel en curso). Reutiliza el mismo patrón de RNG inyectable de `specs/016-multigolpe-critico` para mantener el resultado determinista en tests.
- La combinación de efectos de múltiples objetos seleccionados en la misma batalla es independiente y aditiva por defecto — sin interacciones especiales definidas en esta spec.
- Esta feature no introduce moneda premium, tickets, ni ningún flujo de obtención directa con dinero real (Constitución § VII); ningún objeto depende de un sistema de gacha.
