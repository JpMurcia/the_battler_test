# Feature Specification: Tienda

**Feature Branch**: `037-tienda`

**Created**: 2026-08-27

**Status**: Draft

**Input**: User description: "Tienda: sumidero de moneda ('currency') por objetos que hoy no tienen ninguna vía de compra directa. Elegido tras confirmar alcance con el jugador (AskUserQuestion) entre 3 opciones, dado que la 'Tienda' del juego real (manual técnico §12) es una tienda de Cat Food con dinero real, incompatible con la Constitución § V (sin backend, sin pagos). Dos secciones: (1) Objetos de Batalla (specs/017-objetos-de-batalla) comprables individualmente con currency, sumando a battleItemInventory ya existente. (2) Ítems de Evolución comprables con currency para un gato poseído específico (evolutionItems, Record por catId) — hallazgo de investigación: evolutionItems no tiene NINGÚN productor en todo el código actual (ni niveles, ni tesoros, ni rango); el mecanismo de verificación en evolveCat ya existe (specs/010) pero es inalcanzable en cuanto requiredItemCount sea mayor que 0 para cualquier gato (hoy el catálogo no lo exige para ninguno). Esta spec es la primera fuente real de ese recurso, cerrando el hueco por adelantado."

**Nota de origen**: quinta y última spec del backlog completo (Nivel A+B+C) acordado al inicio — ver `specs/029` para el origen. A diferencia de las specs anteriores, el alcance de esta se resolvió con el jugador antes de escribir el spec (ver AskUserQuestion registrada en la sesión), porque el concepto real de "Tienda" del manual técnico (§12, Cat Food Shop) depende de pagos reales, explícitamente fuera de alcance por Constitución § V.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Comprar Objetos de Batalla con moneda (Priority: P1)

Un jugador con moneda suficiente abre la Tienda, ve el catálogo de Objetos de Batalla (Aceleración de Velocidad, Energía Extra, Radar de Tesoro) cada uno con su precio, y compra una unidad de uno de ellos.

**Why this priority**: Da a la moneda principal ("currency") un sumidero directo para un sistema ya jugable (specs/017) que hoy solo se obtiene indirectamente (recompensas de nivel/rango) — valor inmediato sin depender de la Historia 2.

**Independent Test**: Con moneda suficiente, comprar un Objeto de Batalla y confirmar que `battleItemInventory` para ese ítem aumenta en 1 y la moneda se descuenta exactamente el precio mostrado; repetir con moneda insuficiente y confirmar que la compra no procede.

**Acceptance Scenarios**:

1. **Given** el jugador tiene moneda suficiente, **When** compra un Objeto de Batalla del catálogo, **Then** la moneda se descuenta según el precio de ese ítem y `battleItemInventory` para ese ítem aumenta en 1.
2. **Given** moneda insuficiente para el precio de un ítem, **When** el jugador ve la Tienda, **Then** el botón de compra de ese ítem aparece deshabilitado.
3. **Given** el jugador ya tiene unidades de un Objeto de Batalla en inventario (por ejemplo, de una recompensa de nivel previa), **When** compra una unidad adicional, **Then** el inventario se suma sobre la cantidad ya existente, sin reemplazarla.

---

### User Story 2 - Comprar Ítems de Evolución para un gato específico (Priority: P1)

Un jugador con un gato que todavía no alcanzó su Forma Verdadera (y que tiene una Forma Verdadera definida) ve, en la Tienda, la opción de comprar ítems de evolución para ese gato específico con moneda, hasta completar la cantidad requerida.

**Why this priority**: Misma prioridad que la Historia 1 — hallazgo de investigación: `evolutionItems` no tenía ningún productor en el código antes de esta spec, así que el mecanismo de `evolveCat` que ya verifica `evolutionItems[catId] >= requiredItemCount` (specs/010) sería inutilizable en cuanto una futura pasada de balance exigiera ítems de evolución para cualquier gato (hoy el catálogo no lo hace para ninguno — `requiredItemCount` ausente equivale a 0). Esta spec cierra ese hueco por adelantado y da a `currency` un segundo sumidero de valor inmediato.

**Independent Test**: Con moneda suficiente, comprar un ítem de evolución para un gato poseído con Forma Verdadera definida y sin alcanzarla todavía; confirmar que el contador de ítems de ese gato aumenta en 1 y que, al alcanzar la cantidad requerida, el botón de evolución en la ficha del gato (specs/030) queda habilitado si también cumple el nivel requerido. (Nota: el catálogo actual no exige ítems para ningún gato — `requiredItemCount` ausente equivale a 0 — por lo que esta prueba se ejercita con un gato de prueba dedicado que sí declara un requisito, mismo criterio que ya usan los tests de `specs/010`.)

**Acceptance Scenarios**:

1. **Given** un gato poseído con Forma Verdadera definida, en Forma Base o Evolucionada, **When** el jugador compra un ítem de evolución para ese gato con moneda suficiente, **Then** la moneda se descuenta según el precio, y el contador de ítems de evolución de ese gato específico aumenta en 1 (sin afectar el de otros gatos).
2. **Given** un gato ya alcanzó la cantidad de ítems requerida para su Forma Verdadera, **When** el jugador ve la Tienda, **Then** la opción de compra para ese gato aparece deshabilitada (no tiene sentido seguir comprando de más).
3. **Given** un gato sin Forma Verdadera definida en absoluto, o que ya está en Forma Verdadera, **When** el jugador ve la Tienda, **Then** ese gato no aparece en la lista de compra de ítems de evolución.
4. **Given** un gato acumuló suficientes ítems de evolución vía esta spec y cumple el nivel requerido, **When** el jugador abre su ficha de detalle, **Then** el botón "Evolucionar a Verdadera" (ya existente desde specs/010/030) queda habilitado.

---

### Edge Cases

- El jugador no posee ningún gato con Forma Verdadera pendiente: la sección de Ítems de Evolución de la Tienda se muestra vacía (o con un mensaje de "nada disponible"), sin romper el resto de la pantalla.
- El precio de un Objeto de Batalla o de un ítem de evolución excede la moneda actual exactamente en el límite: el botón se deshabilita solo si la moneda es insuficiente, no en el límite exacto (moneda == precio permite comprar).
- Comprar repetidamente el mismo Objeto de Batalla no tiene límite superior de inventario (a diferencia de los ítems de evolución, que sí se topan en `requiredItemCount`).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE ofrecer, desde el Hub, una Tienda con 2 secciones: Objetos de Batalla e Ítems de Evolución.
- **FR-002**: Cada Objeto de Batalla del catálogo existente (`specs/017`) DEBE mostrarse con un precio en moneda y un botón de compra, deshabilitado si la moneda disponible es menor al precio.
- **FR-003**: Comprar un Objeto de Batalla DEBE descontar la moneda exacta de su precio y sumar 1 unidad al inventario existente de ese ítem (`battleItemInventory`), sin límite superior.
- **FR-004**: La sección de Ítems de Evolución DEBE listar únicamente gatos poseídos que tengan una Forma Verdadera definida y que todavía no la hayan alcanzado.
- **FR-005**: Para cada gato listado, el sistema DEBE mostrar su progreso actual de ítems de evolución sobre el total requerido, y un botón de compra deshabilitado si la moneda es insuficiente o si el gato ya alcanzó la cantidad requerida.
- **FR-006**: Comprar un ítem de evolución para un gato DEBE descontar la moneda exacta de su precio y sumar 1 al contador de ítems de evolución de ese gato específico, sin afectar el de ningún otro gato.
- **FR-007**: El estado de moneda, inventario de Objetos de Batalla e ítems de evolución por gato DEBE persistir entre sesiones (Constitución § V) — reutilizando el almacenamiento ya existente de cada uno (sin tabla nueva).

### Key Entities *(include if feature involves data)*

- **Precio de Objeto de Batalla** (dato estático, `src/data/`): por `BattleItem.id`, costo en moneda.
- **Precio de ítem de evolución**: costo fijo en moneda por unidad, igual para cualquier gato.
- **Inventario de Objetos de Batalla** (`battleItemInventory`) e **ítems de evolución por gato** (`evolutionItems`): entidades ya existentes desde `specs/017`/`specs/010` — esta spec añade un segundo productor (compra) a las ya existentes (recompensas de nivel/rango), sin cambiar su forma.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un jugador puede comprar un Objeto de Batalla y ver su inventario reflejado inmediatamente, con la moneda descontada exactamente en el precio mostrado.
- **SC-002**: Un jugador puede comprar suficientes ítems de evolución para un gato específico hasta alcanzar la cantidad requerida, momento en el que la opción de compra para ese gato se deshabilita.
- **SC-003**: Un gato con nivel suficiente y con la cantidad requerida de ítems de evolución ya comprados puede evolucionar a Forma Verdadera usando el flujo ya existente (`specs/010`/`specs/030`), sin ningún cambio en ese flujo.
- **SC-004**: `npx tsc -b` limpio y `npm test` en verde, sin regresión en ninguna suite existente.

## Assumptions

- **Alcance confirmado con el jugador**: dado que el "Cat Food Shop" del manual técnico (§12) es una tienda de moneda premium con dinero real, incompatible con Constitución § V (sin backend, sin pagos), se presentaron 3 alcances alternativos vía pregunta directa al jugador antes de escribir esta spec; se eligió "sumidero de moneda por objetos ya existentes" (Objetos de Batalla + Ítems de Evolución) sobre las otras 2 opciones (solo recarga de energía, u omitir la spec por completo).
- **Sin rotación ni stock limitado**: a diferencia del "Cat Food Shop" real (ofertas rotativas, "Rank Up Sale"), esta Tienda ofrece su catálogo completo de forma permanente — mismo criterio de simplificación que el resto del backlog (por ejemplo, `specs/031` con un único nivel por mejora).
- **Precio fijo, sin escalado**: cada Objeto de Batalla y cada ítem de evolución tiene un precio fijo (no creciente con la cantidad ya comprada, a diferencia de `specs/031`/`specs/036`) — un Objeto de Batalla no tiene un tope natural que justifique un costo creciente, y un ítem de evolución ya está topado por `requiredItemCount`, por lo que un costo fijo es la opción más simple sin perder claridad.
- **Ítems de evolución sin selector de "para qué gato" ambiguo**: dado que `evolutionItems` ya está modelado como `Record<catId, number>` desde `specs/010` (ítem específico por gato, no un ítem genérico canjeable), esta spec respeta ese modelo existente — la Tienda vende directamente "un ítem de evolución para el Gato X", no un ítem genérico transferible.
- Esta spec no cambia ningún archivo de `src/engine/` — la compra solo escribe sobre entidades de progreso del jugador (`currency`, `battleItemInventory`, `evolutionItems`) ya soportadas por `useMetaStore`, sin ningún efecto sobre la simulación de combate en sí.
