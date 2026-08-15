# Feature Specification: Sistema de Objetos de Batalla

**Feature Branch**: `018-battle-items`

**Created**: 2026-08-05

**Status**: Draft

**Input**: User description: "Sistema de Objetos de Batalla de \"The Battler\": el jugador selecciona hasta un número limitado de consumibles antes de entrar a un nivel (por ejemplo, aceleración de velocidad, dinero extra, radar de tesoro), obtenidos como recompensa de misión o tesoro (no gacha), siguiendo https://battlecats.miraheze.org/wiki/Special_Abilities y la sección \"Objetos de batalla\" del manual técnico del proyecto. Se integra en el flujo pre-batalla ya existente en 005-player-dashboard."

## Clarifications

### Session 2026-08-05

- Q: `ChapterDefinition.TreasureRewardId` ya se otorga de forma determinista al ganar (sin sistema de probabilidad de drop) — un "Radar de Tesoro" que "garantiza" ese tesoro no tendría ningún efecto observable. ¿Cómo se redefine el objeto de la categoría "recompensa"? → A: Redefinir como "Bono de Experiencia" (duplica `XpReward`) | B: Mantener "Radar de Tesoro" pero que otorgue un tesoro *adicional* aleatorio, más allá del `TreasureRewardId` normal del nivel | C: Mantener "Radar de Tesoro" desbloqueando el bono pasivo de un set sin completarlo. **Elegida: B** — "Radar de Tesoro" otorga, al ganar, un tesoro adicional elegido al azar entre los que el jugador aún no posee de todo el catálogo de `014-chapter-scaling-treasure-sets`, independiente del `TreasureRewardId` propio del nivel.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Seleccionar objetos de batalla antes de entrar a un nivel (Priority: P1)

Un jugador con objetos de batalla en su inventario los selecciona, hasta un límite máximo, antes de entrar a una batalla, desde el mismo flujo de preparación pre-batalla donde ya organiza su equipo.

**Why this priority**: Es el punto de entrada de todo el sistema — sin la selección, ningún objeto puede llegar a usarse en batalla.

**Independent Test**: Con al menos un objeto de batalla disponible en el inventario, entrar al flujo de preparación pre-batalla, seleccionarlo y confirmar que queda marcado como elegido para la siguiente batalla.

**Acceptance Scenarios**:

1. **Given** el jugador tiene al menos un objeto de batalla disponible en su inventario, **When** entra al flujo de preparación pre-batalla, **Then** puede seleccionarlo para la batalla siguiente.
2. **Given** el jugador ya seleccionó el número máximo permitido de objetos de batalla, **When** intenta seleccionar uno adicional, **Then** el sistema no lo permite hasta que deseleccione otro.
3. **Given** el jugador no tiene ningún objeto de batalla en su inventario, **When** entra al flujo de preparación pre-batalla, **Then** puede continuar y entrar a la batalla sin seleccionar ninguno.

---

### User Story 2 - Un objeto de batalla seleccionado surte su efecto desde el inicio de la batalla (Priority: P1)

Un jugador que entró a una batalla con un objeto de batalla seleccionado observa su efecto activo desde el primer instante de esa batalla.

**Why this priority**: Es el valor central del sistema — sin un efecto observable, seleccionar un objeto no tendría ninguna consecuencia real en el juego.

**Independent Test**: Seleccionar un objeto de batalla de efecto observable (por ejemplo, Aceleración de Velocidad) y confirmar que ese efecto está activo desde el primer despliegue de unidades en la batalla resultante.

**Acceptance Scenarios**:

1. **Given** el jugador seleccionó "Aceleración de Velocidad" antes de entrar a una batalla, **When** la batalla comienza, **Then** las unidades desplegadas se mueven más rápido que sin ese objeto, desde el primer despliegue.
2. **Given** el jugador seleccionó "Dinero Extra" antes de entrar a una batalla, **When** la batalla comienza, **Then** el recurso inicial disponible para desplegar unidades es mayor que sin ese objeto.
3. **Given** el jugador seleccionó "Radar de Tesoro" antes de entrar a una batalla y aún le falta al menos un tesoro del catálogo completo por poseer, **When** completa esa batalla con victoria, **Then** recibe un tesoro adicional elegido al azar entre los que todavía no posee, independiente y además de la recompensa de tesoro normal del nivel (si la tiene).
4. **Given** el jugador seleccionó "Radar de Tesoro" pero ya posee todos los tesoros existentes en el catálogo, **When** completa esa batalla con victoria, **Then** no recibe ningún tesoro adicional (no hay ninguno pendiente que otorgar) y no se produce ningún error.

---

### User Story 3 - Los objetos de batalla se obtienen jugando, no con moneda premium (Priority: P2)

Un jugador que completa una misión o cumple un set de tesoros recibe objetos de batalla como parte de su recompensa, igual que ya recibe experiencia o tesoros.

**Why this priority**: Sin una vía de obtención, el inventario de objetos de batalla nunca se llenaría y las Historias 1-2 no tendrían nada que seleccionar; depende de que el mecanismo de recompensa de nivel ya exista (`013-empire-of-cats-saga`).

**Independent Test**: Completar con victoria un nivel configurado con una recompensa de objeto de batalla y confirmar que ese objeto aparece en el inventario del jugador tras la batalla.

**Acceptance Scenarios**:

1. **Given** un nivel declara una recompensa de objeto de batalla, **When** el jugador lo completa con victoria, **Then** ese objeto se añade a su inventario, sumándose a la cantidad ya poseída de ese mismo tipo si aplica.
2. **Given** un nivel no declara ninguna recompensa de objeto de batalla, **When** el jugador lo completa, **Then** su inventario de objetos de batalla no cambia por esa batalla.

---

### Edge Cases

- ¿Qué pasa si el jugador selecciona un objeto de batalla y luego sale de la preparación pre-batalla sin entrar a la batalla? La selección se descarta sin descontar nada del inventario — el descuento ocurre únicamente al entrar efectivamente a la batalla (ver FR-006).
- ¿Qué pasa si el jugador entra a una batalla con un objeto seleccionado y la abandona antes de completarla? El objeto ya se descontó del inventario al entrar (mismo criterio que el coste de energía de `006-mission-energy-system`, que tampoco se reembolsa si la batalla se abandona) — esta feature no introduce un mecanismo de reembolso.
- ¿Puede el jugador seleccionar dos unidades del mismo objeto de batalla para la misma batalla? Sí, si tiene más de una unidad disponible en inventario, siempre respetando el límite máximo total de objetos seleccionados por batalla.
- ¿Qué pasa con los niveles ya existentes (`001`-`017`) que no declaran ninguna recompensa de objeto de batalla? Siguen funcionando exactamente igual que hoy — ningún nivel existente otorga objetos de batalla salvo que se reautore explícitamente para hacerlo.
- ¿Qué pasa si dos objetos de batalla seleccionados para la misma batalla tienen efectos que se solapan (por ejemplo, dos fuentes de dinero extra)? Esta feature no define reglas de combinación entre objetos distintos — cada efecto se aplica de forma independiente y aditiva salvo que un `/speckit.clarify` posterior decida lo contrario.
- ¿Qué pasa si el jugador ya posee todos los tesoros del catálogo y gana una batalla con "Radar de Tesoro" seleccionado? No recibe ningún tesoro adicional — el objeto se consumió igualmente al entrar a la batalla, sin error ni compensación alternativa (ver FR-010).
- ¿Qué pasa con el efecto de un objeto de batalla si el jugador reintenta la misma batalla tras una derrota, sin volver a pasar por la preparación pre-batalla? El efecto sigue activo durante el reintento — el objeto ya se descontó una única vez del inventario al entrar a la batalla (FR-006), y esa misma entrada cubre todos sus reintentos, no solo el primero.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE permitir al jugador seleccionar objetos de batalla de su inventario, hasta un número máximo configurable por batalla, integrado en el flujo de preparación pre-batalla ya existente de `005-player-dashboard` (mismo punto donde hoy organiza su equipo).
- **FR-002**: El sistema DEBE ofrecer al menos tres objetos de batalla distintos, cada uno de una categoría de efecto diferente: uno que modifica el combate (ej. "Aceleración de Velocidad"), uno que modifica el recurso inicial de la batalla (ej. "Dinero Extra"), y uno que otorga una recompensa de tesoro adicional al ganar, más allá de la ya garantizada por el nivel (ej. "Radar de Tesoro").
- **FR-003**: Los objetos de batalla DEBEN obtenerse únicamente como recompensa de misión o de tesoro (mismo mecanismo de recompensa de nivel que `013-empire-of-cats-saga` ya usa para experiencia y tesoros) — nunca mediante un sistema de gacha ni moneda premium.
- **FR-004**: El jugador DEBE poder entrar a cualquier batalla sin seleccionar ningún objeto de batalla — la selección es opcional, nunca obligatoria.
- **FR-005**: El sistema DEBE mantener un inventario persistente de objetos de batalla del jugador, con una cantidad disponible por tipo, que sobrevive a cerrar y reabrir el juego.
- **FR-006**: El sistema DEBE descontar del inventario del jugador cada objeto de batalla seleccionado en el momento de entrar efectivamente a la batalla correspondiente, no antes (al confirmar la selección) ni después (al completarla).
- **FR-007**: El sistema NO DEBE permitir seleccionar más objetos de batalla que el límite máximo configurado por batalla, ni seleccionar más unidades de un objeto que las disponibles en el inventario del jugador.
- **FR-008**: Cada objeto de batalla seleccionado DEBE surtir su efecto declarado en el momento correspondiente a su categoría: los de combate y de recurso inicial desde el inicio de la batalla; el de recompensa ("Radar de Tesoro") al resolverse la victoria de esa batalla.
- **FR-009**: "Radar de Tesoro" DEBE otorgar, al resolverse una victoria, un tesoro adicional elegido al azar entre los tesoros del catálogo de `014-chapter-scaling-treasure-sets` que el jugador aún no posea, de forma independiente y adicional al `TreasureRewardId` propio del nivel (si lo tiene).
- **FR-010**: Si el jugador ya posee todos los tesoros existentes en el catálogo al ganar una batalla con "Radar de Tesoro" seleccionado, el sistema NO DEBE producir ningún error ni efecto adicional — el objeto igual se consumió al entrar a la batalla (FR-006), sin garantía de recompensa cuando no queda ningún tesoro pendiente por otorgar.
- **FR-011**: Los niveles ya existentes de `001`-`017` que no declaren ninguna recompensa de objeto de batalla DEBEN seguir funcionando exactamente igual que antes de esta feature.
- **FR-012**: Esta feature NO DEBE requerir ningún sistema de gacha ni moneda premium, ni para obtener objetos de batalla ni para seleccionarlos (Principio VI de la constitución).
- **FR-013**: El efecto de un objeto de batalla seleccionado DEBE seguir activo durante cualquier reintento de esa misma entrada a la batalla (tras una derrota, sin volver a pasar por la preparación pre-batalla) — el objeto no se vuelve a descontar del inventario ni pierde su efecto al reintentar.

### Key Entities *(include if feature involves data)*

- **Objeto de Batalla**: tipo de consumible con una categoría de efecto declarada (combate, recurso inicial, o recompensa de tesoro adicional) y una descripción de ese efecto.
- **Inventario de Objetos de Batalla**: colección persistente por jugador que registra cuántas unidades posee de cada tipo de objeto de batalla.
- **Selección Pre-Batalla**: conjunto de objetos de batalla (hasta el límite máximo) elegidos por el jugador para la próxima batalla, descontados del inventario al entrar a ella.
- **Recompensa de Nivel** (existente, extendida): un nivel puede declarar, además de la experiencia y el tesoro ya existentes (`013-empire-of-cats-saga`), uno o más objetos de batalla otorgados al completarlo con victoria.
- **Catálogo de Tesoros** (existente, `014-chapter-scaling-treasure-sets`): fuente de la que "Radar de Tesoro" elige al azar el tesoro adicional entre los que el jugador aún no posee.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Con al menos un objeto de batalla disponible, el jugador puede seleccionarlo y entrar a la batalla siguiente sin salir del flujo de preparación pre-batalla ya existente, en el 100% de los casos de prueba.
- **SC-002**: Un objeto de batalla de combate o de recurso inicial produce su efecto observable desde el primer instante de la batalla correspondiente, en el 100% de las partidas de prueba; "Radar de Tesoro" produce su tesoro adicional al resolverse la victoria, en el 100% de las partidas de prueba donde quede al menos un tesoro pendiente por otorgar.
- **SC-003**: El inventario del jugador refleja el descuento del objeto usado inmediatamente al entrar a la batalla, y ese descuento persiste tras cerrar y reabrir el juego.
- **SC-004**: El jugador puede completar una batalla sin haber seleccionado ningún objeto de batalla, sin ningún cambio de comportamiento observable respecto al flujo de batalla actual (sin regresión).
- **SC-005**: El sistema impide seleccionar más objetos de batalla que el límite máximo configurado, o más unidades de un tipo que las disponibles en inventario, en el 100% de los intentos de prueba.

## Assumptions

- El límite máximo de objetos de batalla seleccionables por batalla es un valor configurable a nivel de proyecto (no por nivel individual); se asume un valor por defecto razonable (ej. 3) para el MVP de esta feature, ajustable en `/speckit.plan` sin cambiar el alcance.
- Los tres objetos de ejemplo priorizados en FR-002 ("Aceleración de Velocidad", "Dinero Extra", "Radar de Tesoro") se basan en el catálogo público ya conocido del juego de referencia y en la sección "Objetos de batalla" del manual técnico del proyecto (`docs/plan-tecnico-manual-completo.md` Fase 17); no se implementa el catálogo completo de objetos del juego de referencia en esta feature — el resto queda como contenido posterior siguiendo el mismo patrón aditivo.
- El mecanismo de obtención (recompensa de misión/tesoro) reutiliza el mismo patrón de recompensa de nivel ya construido por `013-empire-of-cats-saga` (experiencia, tesoro) — se extiende de forma aditiva, sin modificar cómo se otorgan las recompensas ya existentes.
- "Radar de Tesoro" (Clarifications, Opción B) introduce el único mecanismo de aleatoriedad de esta feature: elegir un tesoro al azar entre los que el jugador aún no posee, de todo el catálogo de `014-chapter-scaling-treasure-sets` (no limitado al set del nivel en curso). No se generaliza a una "probabilidad de drop" configurable por nivel — es un único punto de aleatoriedad acotado, resuelto en `/speckit.plan` con la misma técnica de determinismo en tests ya documentada por `017-multi-hit-critical/research.md` §4 (`UnityEngine.Random.InitState` sembrado en el test, sin interfaz de aleatoriedad nueva en producción).
- La combinación de efectos cuando se seleccionan múltiples objetos de batalla distintos para la misma batalla se resuelve de forma independiente y aditiva por defecto; no se definen interacciones especiales entre objetos en esta spec (ver Edge Cases).
- Esta feature no introduce moneda premium, tickets, ni ningún flujo de obtención directa con dinero real — coherente con el Principio VI (Simplicidad desde el MVP) y con que ningún objeto de batalla depende de la Fase 13 (Gacha), bloqueada.
