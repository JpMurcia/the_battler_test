# Feature Specification: Sistema de Gacha Completo ("Cápsula de Gatos")

**Feature Branch**: `024-sistema-gacha`

**Created**: 2026-08-23

**Status**: Draft

**Input**: User description: "Sistema de gacha completo (\"Cápsula de Gatos\"): banners con tasas de rareza propias (incluye tiers Legendario y Colaboración, hoy definidos en RarityType pero sin ninguna unidad asignada), tirada simple y tirada x11, animación de revelado, economía de moneda de gacha separada de la moneda de mejora de nivel, y catálogo de gatos obtenibles por gacha (nombres/rareza) integrado a src/data/cats.ts. Referencia de diseño: docs/the-battle-cats-redesign/project/Battle Cats Modernizado.dc.html líneas 472-994 (sección isGacha, GACHA_BANNERS, GACHA_POOL, rollRarity/rollOne). Debe integrarse con useMetaStore (ownedCats, addOwnedCat ya existentes) sin romper los caminos de obtención ya implementados en specs/012 y specs/023 (recompensas de arco). GachaScreen.tsx es hoy un stub de navegación a reemplazar." — validado contra el mockup base ya usado en specs/021/023 (`docs/the-battle-cats-redesign/project/Battle Cats Modernizado.dc.html`, sección `isGacha`) y contra `docs/The_Battle_Cats_Manual_Tecnico.docx` (§ 9.10 "Almacén de Gatos (Cat Storage)", § 11 tabla de monedas, § 12.3 "Sistema de gacha (Cat Capsule)").

**Nota de alcance**: hoy `GachaScreen` es un stub sin lógica (ver README "Sin gacha real todavía") y los 16 gatos jugables solo se obtienen por gato inicial garantizado, primera victoria de Nivel 1/2, o recompensas de finalización de arco (`specs/012`, `specs/023`). Esta spec añade un camino de obtención adicional por azar — no reemplaza ninguno de los existentes. Las rarezas `Legendario` y `Colaboración` ya están definidas en `RarityType` (`src/data/cats.ts`) con su color/clase CSS, pero hoy ninguna unidad del catálogo las usa; esta spec es la primera en poblarlas. Siguiendo el manual técnico (§ 9.10), el resultado de una tirada **no se posee de inmediato**: cae primero en un Almacén de Gatos como cápsula sin activar, y el jugador decide después si la activa (unidad nueva → se suma al roster; unidad repetida → sube de nivel "+" la copia ya existente) o la intercambia por XP/NP.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tirar una vez y recibir una cápsula en el Almacén (Priority: P1)

Un jugador con moneda de gacha suficiente abre la Cápsula de Gatos, ve las tasas de probabilidad del banner activo desglosadas por rareza, confirma una tirada simple, y el gato resultante llega como una cápsula sin activar al Almacén de Gatos — con una revelación visual distinta según la rareza obtenida.

**Why this priority**: Es el punto de entrada de todo el sistema — sin esto, ningún otro elemento de esta spec (banners, activación, tirada múltiple, catálogo ampliado) tiene sentido por sí solo.

**Independent Test**: Con saldo suficiente, abrir la Cápsula, tirar una vez y confirmar que (a) se descontó el costo exacto de moneda de gacha, (b) aparece una nueva cápsula sin activar en el Almacén con el `catId`/rareza correctos, y (c) la pantalla de revelación muestra esa rareza de forma distinguible.

**Acceptance Scenarios**:

1. **Given** el jugador tiene saldo suficiente de moneda de gacha, **When** confirma una tirada simple, **Then** se descuenta el costo fijo, se determina un gato según las tasas del banner activo, y ese resultado se agrega al Almacén como cápsula sin activar (no a `ownedCats` directamente).
2. **Given** el jugador no tiene saldo suficiente, **When** intenta tirar, **Then** la tirada no se ejecuta, no se descuenta nada, no se agrega ninguna cápsula al Almacén, y el jugador recibe una indicación clara de que falta saldo.
3. **Given** el jugador acaba de recibir una cápsula por gacha, **When** cierra la pantalla de revelación, **Then** vuelve a la Cápsula de Gatos (no a otra pantalla), pudiendo tirar de nuevo si el saldo alcanza.
4. **Given** una cápsula recién depositada en el Almacén, **When** el jugador consulta `TeamScreen`/`BattleScreen` sin haberla activado, **Then** esa unidad no aparece como poseída ni es seleccionable/desplegable — coherente con § 9.10 del manual ("mientras permanece sin activar, no puede desplegarse en batalla").

---

### User Story 2 - Elegir entre banners con tasas distintas (Priority: P1)

Un jugador que abre la Cápsula de Gatos ve al menos dos banners seleccionables, cada uno con su propio desglose de probabilidades por rareza, y puede cambiar de banner activo antes de tirar.

**Why this priority**: Sin banners diferenciados, "tasas de rareza propias" (parte explícita del pedido) queda incumplido — es indisociable de la Historia 1 para que el sistema tenga la forma pedida, aunque es una historia propia porque puede probarse sin ejecutar ninguna tirada real.

**Independent Test**: Abrir la Cápsula, cambiar entre banners disponibles y confirmar que el desglose de tasas mostrado cambia de forma consistente con cada banner, sin necesidad de tirar.

**Acceptance Scenarios**:

1. **Given** el jugador abre la Cápsula de Gatos, **When** la pantalla carga, **Then** ve al menos dos banners distintos, cada uno con nombre y desglose de tasas por rareza que suman 100%.
2. **Given** el jugador selecciona un banner distinto al activo, **When** confirma la selección, **Then** el desglose de tasas mostrado y el banner usado en la siguiente tirada corresponden al nuevo banner seleccionado.

---

### User Story 3 - Activar una cápsula nueva desde el Almacén (Priority: P1)

Un jugador con una cápsula sin activar en el Almacén, correspondiente a un gato que todavía no posee, la activa y el gato pasa a estar disponible de inmediato en `CatGuideScreen`, `UpgradeScreen`, `TeamScreen` y como opción de despliegue en batalla — igual que cualquier gato obtenido por otro camino.

**Why this priority**: Sin un paso de activación, una tirada nunca se convierte en valor jugable — es tan esencial como la tirada misma (Historia 1), por lo que comparte prioridad P1.

**Independent Test**: Con una cápsula sin activar de un gato no poseído, activarla desde el Almacén y confirmar que el gato aparece de inmediato en `ownedCats` con su forma base y se comporta igual que cualquier otro gato poseído en las pantallas ya existentes.

**Acceptance Scenarios**:

1. **Given** una cápsula sin activar de un gato no poseído, **When** el jugador la activa desde el Almacén, **Then** el gato se agrega a `ownedCats` en su forma base (nivel natural inicial, sin niveles "+"), y la cápsula deja de aparecer como pendiente en el Almacén.
2. **Given** un gato activado por esta vía, **When** el jugador lo consulta en `CatGuideScreen`/`UpgradeScreen`/`TeamScreen`, **Then** se comporta exactamente igual que cualquier otro gato poseído (mejorable, equipable, desplegable) — sin lógica especial nueva para gatos de origen gacha.

---

### User Story 4 - Tirada múltiple (x11) (Priority: P2)

Un jugador con saldo suficiente realiza una tirada múltiple de 11 gatos de una sola vez, pagando un costo menor que 11 tiradas simples sueltas, y ve los 11 resultados juntos en una sola pantalla de revelación antes de que las 11 cápsulas se agreguen al Almacén.

**Why this priority**: Es una optimización de la Historia 1 (mismo mecanismo de tirada y depósito en Almacén, ejecutado 11 veces) — aporta valor real (eficiencia, previsibilidad de rareza) pero el sistema ya es utilizable sin ella.

**Independent Test**: Con saldo suficiente para una tirada x11, ejecutarla y confirmar que se obtienen exactamente 11 cápsulas nuevas en el Almacén, cada una determinada independientemente por las tasas del banner activo, todas visibles en la misma pantalla de revelación.

**Acceptance Scenarios**:

1. **Given** el jugador tiene saldo suficiente para una tirada x11, **When** la confirma, **Then** se descuenta el costo fijo de la tirada múltiple (no 11 veces el costo de la tirada simple) y se agregan exactamente 11 cápsulas al Almacén.
2. **Given** una tirada x11 completada, **When** se muestra la revelación, **Then** los 11 resultados son visibles en una sola pantalla, cada uno con su rareza distinguible, sin requerir 11 confirmaciones separadas.
3. **Given** el jugador no tiene saldo suficiente para la tirada x11 pero sí para una simple, **When** abre la Cápsula, **Then** la opción de tirada x11 se muestra deshabilitada mientras la tirada simple permanece disponible.

---

### User Story 5 - Todas las categorías de rareza tienen unidades reales (Priority: P2)

Un jugador que tira lo suficiente en cualquier banner puede eventualmente obtener una unidad de cada rareza que ese banner ofrece, incluidas `Legendario` y `Colaboración` — rarezas que hoy existen en el sistema de etiquetas pero no tienen ningún gato asignado. Esta spec crea un pequeño conjunto de gatos jugables nuevos, exclusivos de gacha, para poblarlas.

**Why this priority**: Sin esto, el pedido explícito de "categorías de raro, super raro, etc." queda incompleto — dos de las siete rarezas definidas nunca podrían aparecer en ninguna tirada. Es P2 porque el sistema de gacha (Historias 1-4) es funcional y demostrable incluso con un subconjunto de rarezas, pero la spec no está completa sin esto.

**Independent Test**: Revisar el pool de gacha configurado y confirmar que cada rareza ofrecida por al menos un banner tiene uno o más `catId` asignados con stats y habilidades completas (mismos requisitos que cualquier gato existente, Constitución § III/IV).

**Acceptance Scenarios**:

1. **Given** el catálogo de gacha configurado, **When** se audita por rareza, **Then** `Raro`, `Superraro`, `Megarraro`, `Legendario` y (si algún banner la ofrece) `Colaboración` tienen al menos un `catId` jugable nuevo, gacha-exclusivo, cada una.
2. **Given** un gato de rareza `Legendario` o `Colaboración` recién definido, **When** se le audita como a cualquier otro gato del catálogo, **Then** cumple los mismos requisitos de Constitución § III (animación idle + ataque) y § IV (stats en `src/data/`, no hardcodeadas).

---

### User Story 6 - Gestionar una cápsula duplicada desde el Almacén (Priority: P2)

Un jugador con una cápsula sin activar correspondiente a un gato que ya posee elige entre dos resultados: activarla, sumando un nivel "+" a la copia que ya tiene (progresión de estadísticas más allá del tope de nivel natural), o intercambiarla por XP — o, si la cápsula es de rareza Uber Raro/Megarraro o Legendario, por NP, una moneda secundaria de progresión distinta de XP y de la moneda de gacha.

**Why this priority**: Es necesario para que el sistema no quede "atascado" cuando el jugador ya posee unidades del pool, pero no bloquea el valor central (Historias 1-4) — un jugador nuevo tarda en agotar el pool disponible.

**Independent Test**: Con una cápsula sin activar de un gato ya poseído, (a) activarla y confirmar que el nivel "+" de ese gato sube en uno sin crear una entrada duplicada en `ownedCats`; (b) en un caso separado, intercambiar una cápsula equivalente por XP (cualquier rareza) o por NP (solo Uber Raro/Megarraro/Legendario) y confirmar que el saldo correspondiente aumenta y la cápsula se retira del Almacén sin afectar el nivel del gato.

**Acceptance Scenarios**:

1. **Given** una cápsula sin activar de un gato ya poseído, **When** el jugador la activa, **Then** el gato ya poseído gana un nivel "+" adicional (progresión separada del nivel natural, según la fórmula de crecimiento ya usada para subir de nivel), y no se crea ninguna entrada nueva en `ownedCats`.
2. **Given** cualquier cápsula sin activar del Almacén, **When** el jugador la intercambia en vez de activarla, **Then** la cápsula se retira del Almacén y el jugador recibe XP.
3. **Given** una cápsula sin activar de rareza `Megarraro` o `Legendario`, **When** el jugador elige intercambiarla, **Then** puede elegir recibir XP o NP en su lugar (ambas opciones disponibles solo para esas dos rarezas).
4. **Given** el Almacén con una o más cápsulas pendientes, **When** el jugador recarga la aplicación, **Then** todas las cápsulas pendientes de activar/intercambiar siguen ahí (persistencia local, igual que el resto del progreso).

---

### Edge Cases

- ¿Qué pasa si el jugador cierra la Cápsula de Gatos (navega a otra pantalla) en medio de la animación de revelación? El resultado ya determinado y descontado debe conservarse en el Almacén — no debe perderse ni revertirse el costo.
- ¿Qué pasa si el saldo alcanza para una tirada simple pero no para completar visualmente la animación (p. ej. el jugador tira repetidamente muy rápido)? Cada tirada debe resolverse de forma atómica: se descuenta, se genera la cápsula y se deposita en el Almacén como una unidad, sin tiradas parcialmente aplicadas.
- ¿Qué pasa si un banner queda sin rarezas configuradas que sumen 100% (error de contenido)? El sistema no debe permitir tiradas contra un banner mal configurado — se trata como un defecto de datos a corregir antes de shippear, no un caso a manejar en runtime.
- ¿Qué pasa con un gato obtenido por gacha respecto al primer gato garantizado del jugador (`ensureDefaultProfile`, specs/001) o los gatos ya otorgados por completar arcos (specs/023)? Deben coexistir sin conflicto — un mismo `catId` puede tener múltiples caminos de obtención posibles; si ya está poseído por otro camino, cualquier cápsula posterior de ese mismo `catId` se resuelve siempre como duplicado (Historia 6: nivel "+" o intercambio), nunca como una segunda entrada de `ownedCats`.
- ¿Qué pasa si el Almacén acumula muchas cápsulas sin que el jugador las gestione? No hay límite de cápsulas pendientes en esta spec — el Almacén crece sin tope; un límite de capacidad queda fuera de alcance salvo que el balance en `plan.md` lo requiera.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE permitir al jugador ejecutar una tirada simple que cuesta una cantidad fija de la moneda de gacha y produce exactamente una cápsula sin activar, determinada por las tasas de rareza del banner activo.
- **FR-002**: El sistema DEBE permitir al jugador ejecutar una tirada múltiple (x11) que cuesta una cantidad fija distinta a 11 veces el costo de la tirada simple, y produce exactamente 11 cápsulas sin activar, cada una determinada independientemente por las mismas tasas.
- **FR-003**: El sistema DEBE ofrecer al menos dos banners seleccionables, cada uno con un desglose de tasas de probabilidad propio por rareza, visible antes de tirar.
- **FR-004**: El sistema DEBE impedir una tirada (simple o múltiple) cuando el saldo de moneda de gacha del jugador es menor al costo correspondiente, sin descontar saldo ni generar ninguna cápsula en ese caso.
- **FR-005**: Cada cápsula obtenida por una tirada DEBE depositarse en un Almacén de Gatos persistente, en estado "sin activar" — el gato correspondiente NO se agrega a `ownedCats` en el momento de la tirada.
- **FR-006**: El jugador DEBE poder activar una cápsula sin activar del Almacén. Si el `catId` de la cápsula no está en `ownedCats`, activarla lo agrega en su forma base, siguiendo las mismas reglas ya usadas por las recompensas de arco (specs/023) — mismo esquema de datos, mismo estado inicial.
- **FR-007**: Si el `catId` de una cápsula activada ya está en `ownedCats` (por cualquier camino de obtención), activarla NO DEBE crear una segunda entrada — en su lugar, DEBE incrementar en uno el nivel "+" de la copia ya poseída.
- **FR-008**: El jugador DEBE poder, como alternativa a activar, intercambiar cualquier cápsula sin activar del Almacén por XP, retirándola del Almacén sin afectar el nivel "+" ni la posesión de ningún gato.
- **FR-009**: Para cápsulas de rareza `Megarraro` o `Legendario` específicamente, el sistema DEBE ofrecer además la opción de intercambiarlas por NP (una moneda de progresión distinta de XP y de la moneda de gacha) en lugar de XP — a elección del jugador.
- **FR-010**: Una cápsula mientras permanezca sin activar en el Almacén NO DEBE ser deployable en batalla, ni seleccionable en `TeamScreen`, ni contar como "poseída" en ninguna pantalla existente (`CatGuideScreen` incluido).
- **FR-011**: Al resolver una tirada, el sistema DEBE mostrar el resultado con un tratamiento visual distinto según la rareza obtenida (color/énfasis creciente con la rareza), antes de volver a la pantalla de la Cápsula de Gatos.
- **FR-012**: Para una tirada múltiple, el sistema DEBE mostrar los 11 resultados juntos en una sola pantalla de revelación, sin requerir confirmaciones separadas por resultado.
- **FR-013**: Cada rareza ofrecida por al menos un banner (incluidas `Legendario` y `Colaboración` si algún banner las incluye) DEBE tener al menos un `catId` jugable nuevo, gacha-exclusivo, elegible en el pool de esa rareza — ninguna rareza anunciada en las tasas de un banner puede tener un pool vacío.
- **FR-014**: El sistema NO DEBE alterar ni remover ninguno de los caminos de obtención de gatos ya existentes (gato inicial garantizado, victoria de Nivel 1/2, recompensas de arco de specs/012/023) — el gacha es un camino adicional.
- **FR-015**: El sistema DEBE persistir de inmediato, en la capa de persistencia local ya existente (Dexie/IndexedDB): el saldo de moneda de gacha, el saldo de NP, el contenido del Almacén (cápsulas pendientes) y el nivel "+" de cada gato — con la misma garantía de escritura inmediata que el resto del progreso (Constitución § V), sin paso de "guardar" separado.
- **FR-016**: `GachaScreen` DEBE reemplazar el stub de navegación actual, permaneciendo alcanzable desde el mismo punto de entrada (`MainMenu`) sin alterar el flujo de navegación de las demás pantallas (`App.tsx`, `types/screen.ts`).
- **FR-017**: El jugador DEBE poder cerrar la Cápsula de Gatos sin tirar (cancelar) sin ningún efecto secundario — sin descuento de saldo ni cápsula generada — mientras no haya una tirada en curso.
- **FR-018**: La moneda de gacha DEBE obtenerse exclusivamente jugando (recompensas de victoria, misiones u otras fuentes ya usadas por el proyecto) — el sistema NO DEBE ofrecer ninguna vía de compra con dinero real, coherente con que el proyecto no tiene backend de pagos ni monetización (Constitución, Restricciones Técnicas).

### Key Entities *(include if feature involves data)*

- **Banner de Gacha**: agrupación seleccionable de tasas de probabilidad por rareza (`Raro`/`Superraro`/`Megarraro`/`Legendario`, sumando 100%), con nombre y descripción corta. Determina qué pool de `catId` es elegible en una tirada mientras está activo.
- **Pool de Gacha por Rareza**: conjunto de `catId` del catálogo (`src/data/cats.ts`) elegibles para aparecer como resultado de una rareza dada, dentro de un banner.
- **Cápsula en el Almacén (Stored Capsule)**: resultado de una tirada individual antes de ser gestionado — `catId`, rareza con la que se resolvió, estado "sin activar". Vive en el Almacén de Gatos hasta que el jugador la activa o la intercambia; mientras tanto no es una unidad poseída.
- **Nivel "+" (Plus Level)**: contador adicional por gato poseído, separado del nivel natural (el que se sube con XP en `UpgradeScreen`), que aumenta en uno cada vez que se activa una cápsula duplicada de esa unidad.
- **Moneda de Gacha**: saldo del jugador, separado de la moneda de mejora de nivel (`currency` en `useMetaStore`) y de NP, usado exclusivamente para pagar tiradas; se gana jugando, nunca se compra.
- **NP**: moneda de progresión secundaria, separada de XP y de la moneda de gacha, obtenida únicamente al intercambiar cápsulas `Megarraro`/`Legendario` del Almacén; se usa para ampliar el nivel de una unidad más allá de lo que XP permite (mecanismo exacto de gasto: alcance de `plan.md`).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un jugador con saldo suficiente completa una tirada simple de principio a fin (ver tasas del banner, confirmar tirada, ver resultado revelado, volver a la Cápsula) sin recargar la página ni salir de la pantalla de gacha.
- **SC-002**: Un jugador completa una tirada x11 y ve los 11 resultados simultáneamente en una sola pantalla, sin necesidad de navegar entre resultados uno por uno.
- **SC-003**: Sobre una simulación de 1.000 tiradas contra un banner dado, la proporción observada de cada rareza cae dentro de ±2 puntos porcentuales de la tasa publicada para esa rareza en ese banner.
- **SC-004**: El 100% de los gatos activados desde el Almacén aparecen de inmediato en `CatGuideScreen`, son seleccionables en `TeamScreen` y mejorables en `UpgradeScreen`, sin ningún paso adicional respecto a un gato obtenido por cualquier otro camino.
- **SC-005**: Una cápsula recién obtenida por gacha permanece no desplegable en batalla y no seleccionable en `TeamScreen` hasta que el jugador la activa explícitamente desde el Almacén.
- **SC-006**: Un duplicado gestionado desde el Almacén se resuelve siempre en uno de los resultados definidos (nivel "+" agregado a la unidad existente, o conversión a XP/NP) — nunca en una entrada inválida o duplicada de `ownedCats`.
- **SC-007**: El saldo de moneda de gacha, el saldo de NP, el contenido del Almacén y el nivel "+" de cada gato sobreviven a un recargo completo de la página (persistencia local), igual que el resto del progreso del jugador.
- **SC-008**: Las 23 specs previas (`001`-`023`) y sus suites de Vitest existentes permanecen en verde tras integrar el sistema de gacha — cero regresiones.
- **SC-009**: Cada una de las rarezas ofrecidas por al menos un banner tiene una probabilidad de aparecer mayor a 0% en ese banner (ninguna rareza anunciada es inalcanzable en la práctica).

## Assumptions

- La Constitución § VII excluye explícitamente "una economía de gacha balanceada" del alcance del MVP inicial (`specs/001`) — esta spec supera deliberadamente esa exclusión a pedido explícito del usuario; el `plan.md` correspondiente debe declarar esta excepción según la sección Governance de la Constitución, incluyendo que se introducen tres monedas persistentes en total (moneda de mejora ya existente, moneda de gacha, y NP).
- La moneda de gacha se obtiene solo jugando (recompensas de victoria, misiones u otras fuentes ya usadas por el proyecto) — no hay compra con dinero real ni publicidad con recompensa, a diferencia del modelo free-to-play que describe el manual técnico (§ 11-12), porque el proyecto no tiene backend de pagos ni cuenta de jugador (Constitución, Restricciones Técnicas) y las compras reales están fuera del alcance de cualquier feature de este proyecto.
- Cat Tickets / Rare Cat Tickets (tiradas gratuitas diarias que documenta el manual § 11) quedan fuera de alcance de esta spec — toda tirada se paga con la moneda de gacha; un sistema de tickets gratuitos puede ser una spec de seguimiento.
- La fórmula de crecimiento del nivel "+" reutiliza la misma curva de estadísticas por nivel ya implementada para el nivel natural (mismo mecanismo que usa `UpgradeScreen`/`useMetaStore` hoy) en vez de introducir una curva separada — los topes numéricos exactos de nivel natural/nivel "+" se resuelven en `plan.md`/balance sin volver a esta spec.
- El gasto concreto de NP (qué compra, con qué límite) se resuelve en `plan.md` — esta spec solo fija que existe, que se obtiene por intercambio de cápsulas Megarraro/Legendario, y que es una moneda distinta de XP y de la moneda de gacha.
- Los banners no tienen fecha de expiración ni rotación temporal real en esta spec — son opciones seleccionables de forma permanente, dado que el proyecto no tiene backend ni reloj de servidor (Constitución, Restricciones Técnicas). Un futuro banner "de evento" con vigencia limitada, o una cápsula de Colaboración ligada a un evento temporal real (como describe el manual § 5.5), quedan fuera de alcance.
- La animación y paleta de revelación reutilizan la identidad visual Cyber-Modern ya aplicada al resto del juego (`specs/021`) en vez de replicar literalmente los colores púrpura/cian del mockup base, para mantener consistencia visual con las pantallas ya existentes.
- Los costos de referencia del mockup y del manual técnico (150 por tirada simple, 1.500 por tirada x11) se usan como punto de partida numérico; el balance fino de costos y tasas se resuelve en `plan.md`/`tasks.md` sin requerir volver a esta spec.
- El desglose de tasas por banner replica como mínimo la estructura de dos-tres banners que documentan el mockup y el manual (equivalentes a `UBERFEST`/`EPICFEST`/Estándar), pudiendo ajustarse el número exacto durante la planificación.
- El Almacén de Gatos no tiene límite de capacidad en esta spec — un tope de cápsulas pendientes queda fuera de alcance salvo que el balance en `plan.md` lo requiera explícitamente.
