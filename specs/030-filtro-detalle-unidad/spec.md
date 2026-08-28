# Feature Specification: Filtro de Gatos y Panel de Detalle de Unidad

**Feature Branch**: `030-filtro-detalle-unidad`

**Created**: 2026-08-27

**Status**: Draft

**Input**: User description: "Filtro de Gatos y Detalle de Unidad: (1) Cat Filter en Equipar y Biblioteca de Gatos — filtro por rareza, por rasgo objetivo (según Ability.TraitTargeting), por habilidad (efectos aplicados/attackType Crítico-Multigolpe), interruptor Y/O entre rasgo+habilidad, y orden por nivel. (2) Panel de detalle de unidad en Equipar y Biblioteca de Gatos — stats completos (HP, Daño, DPS derivado, Alcance, Velocidad, Coste, Tiempo de recarga, Tipo de ataque, Rasgo, Habilidades) con tabs por forma de evolución (Base/Evolucionada/Verdadera), y conecta evolveCat() (useMetaStore, ya implementado desde specs/010-evolucion-de-gatos) con un botón de evolución cuando la unidad cumple los requisitos — hoy esa acción no tiene ningún punto de entrada en la UI."

**Nota de origen**: segunda spec del backlog derivado de comparar el mockup y el manual técnico contra `src/` (ver `specs/029-pulido-batalla-hud` para el mismo origen). Nivel B del backlog: profundiza pantallas ya existentes (Equipar, Biblioteca de Gatos) sin introducir ningún subsistema nuevo.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Filtrar el roster de gatos por rareza, rasgo objetivo y habilidad (Priority: P1)

Un jugador con muchos gatos poseídos, en Equipar o en la Guía de Gatos, abre un filtro y marca criterios (rareza, rasgo enemigo al que apunta alguna habilidad, tipo de habilidad) para ver solo los gatos que le interesan, en vez de desplazarse por la lista completa.

**Why this priority**: Es el problema de usabilidad más señalado en el manual (sección 4.5) y crece en importancia con cada spec de contenido nuevo — hoy el roster ya supera las 30 unidades y sigue creciendo.

**Independent Test**: Con al menos 2 gatos de rarezas distintas poseídos, abrir el filtro en Equipar, marcar una sola rareza, y confirmar que la lista visible se reduce a exactamente los gatos de esa rareza — el resto de la pantalla (selección, Cat Combos, Objetos de Batalla) sigue funcionando igual.

**Acceptance Scenarios**:

1. **Given** el jugador abre el filtro en Equipar o en la Guía de Gatos, **When** marca una o más casillas de rareza, **Then** la lista visible muestra solo los gatos poseídos de esas rarezas.
2. **Given** el jugador marca un rasgo objetivo (p. ej. "Flotante"), **When** se aplica el filtro, **Then** la lista muestra solo gatos con al menos una habilidad `TraitTargeting` dirigida a ese rasgo.
3. **Given** el jugador marca una habilidad (p. ej. "Congelar" o "Crítico"), **When** se aplica el filtro, **Then** la lista muestra solo gatos cuyo efecto aplicado o tipo de ataque corresponde a esa habilidad.
4. **Given** el jugador marca un rasgo objetivo Y una habilidad con el interruptor en "Y", **When** se aplica el filtro, **Then** solo se muestran gatos que cumplen ambos criterios a la vez.
5. **Given** el mismo caso anterior con el interruptor en "O", **When** se aplica el filtro, **Then** se muestran gatos que cumplen cualquiera de los dos criterios.
6. **Given** ningún criterio marcado, **When** el jugador observa la lista, **Then** se muestran todos los gatos poseídos, igual que hoy sin filtro.
7. **Given** un filtro activo, **When** el jugador activa "Ordenar por nivel", **Then** la lista visible se reordena de menor a mayor nivel sin cambiar qué gatos están incluidos.
8. **Given** un filtro aplicado en Equipar, **When** el jugador selecciona/deselecciona un gato de la lista filtrada, **Then** la selección para la batalla se comporta exactamente igual que sin filtro (el filtro es solo de presentación, nunca oculta una selección ya hecha si un gato deja de cumplir el filtro).

---

### User Story 2 - Ver el detalle completo de una unidad y evolucionarla (Priority: P1)

Un jugador toca un gato en Equipar o en la Guía de Gatos y ve un panel con todas sus estadísticas de combate, puede cambiar entre pestañas de forma (Base/Evolucionada/Verdadera, según cuáles existan para ese gato) para comparar stats, y si la forma actual cumple los requisitos para evolucionar, puede hacerlo desde ahí mismo.

**Why this priority**: `evolveCat()` está completamente implementado desde `specs/010-evolucion-de-gatos` (requisitos de nivel e ítems, actualización de forma) pero no tiene ningún botón en ninguna pantalla — es la mecánica más "cerca de estar resuelta" de este grupo, igual que el cañón especial lo fue en `specs/029`.

**Independent Test**: Tocar un gato con evoluciones definidas y nivel suficiente para la siguiente forma; confirmar que el panel muestra un botón de evolución habilitado, pulsarlo, y confirmar que la forma del gato cambia y persiste.

**Acceptance Scenarios**:

1. **Given** el jugador toca un gato en la lista (Equipar o Guía de Gatos), **When** se abre el panel de detalle, **Then** ve HP, Daño, DPS (derivado de Daño/Frecuencia de ataque), Alcance, Velocidad, Coste de despliegue, Tiempo de recarga, Tipo de ataque, Rasgo (y rasgo especial si tiene) y sus Habilidades, todos correspondientes a la forma de evolución actual del gato.
2. **Given** un gato con `evolutions` definido, **When** el jugador abre su panel de detalle, **Then** ve pestañas para cada forma que el gato puede alcanzar (Base siempre, Evolucionada y/o Verdadera según existan), y cambiar de pestaña muestra los stats de esa forma sin cambiar la forma real del gato en el juego.
3. **Given** un gato sin `evolutions` definido, **When** el jugador abre su panel, **Then** no se muestra ninguna pestaña de forma — solo sus stats actuales.
4. **Given** la forma actual del gato es `Base` y su nivel ya alcanza el requisito de la forma `Second`, **When** el jugador ve el panel, **Then** aparece un botón de evolución habilitado; pulsarlo cambia la forma del gato a `Second` de inmediato y el cambio persiste tras recargar.
5. **Given** la forma actual es `Base` pero el nivel todavía no alcanza el requisito, **When** el jugador ve el panel, **Then** el botón de evolución aparece deshabilitado, mostrando el nivel requerido.
6. **Given** la forma actual es `Second` y la forma `True` requiere ítems de evolución que el jugador no tiene suficientes, **When** el jugador ve el panel, **Then** el botón de evolución aparece deshabilitado, mostrando cuántos ítems le faltan.
7. **Given** la forma actual ya es `True` (forma máxima del gato), **When** el jugador ve el panel, **Then** no se muestra ningún botón de evolución — no hay forma siguiente.
8. **Given** el panel de detalle está abierto, **When** el jugador lo cierra, **Then** vuelve exactamente a la lista (con cualquier filtro de la Historia 1 todavía aplicado, si lo había).

---

### Edge Cases

- Un gato sin `rarity` asignado (campo opcional, FR-016 de `specs/012`): al marcar filtros de rareza, ese gato queda excluido de cualquier selección de rareza (no hay rareza que lo incluya) — comportamiento consistente, no un error.
- Un gato sin ninguna `Ability` (`abilities` ausente/vacío): nunca aparece al marcar un filtro de rasgo objetivo o de habilidad basada en `TraitTargeting`, pero sigue apareciendo sin filtro o con solo el filtro de rareza activo.
- Dos gatos con el mismo `attackType: 'Critical'` pero ninguna habilidad de rasgo: ambos aparecen al marcar el chip "Crítico", sin necesitar `abilities`.
- El panel de detalle se abre para un gato con `evolutions.second` definido pero sin `evolutions.true`: solo se muestran pestañas Base y Evolucionada, sin pestaña Verdadera y sin implicar que el gato tiene tope en `Second` como límite de diseño distinto (edge conocido y aceptado por `specs/010`).
- El jugador evoluciona un gato mientras tiene un filtro de rasgo/habilidad activo cuyo resultado depende de una `Ability` que no cambia entre formas (las `Ability` de un `Cat` no varían por forma en el modelo actual): el filtro no necesita recalcularse por la evolución, solo el detalle de stats mostrado.
- Evolucionar un gato mientras está en la formación activa seleccionada (Equipar, aún sin guardar): la selección (`selectedIds`) no cambia — sigue siendo el mismo `catId`, solo cambia su forma.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE ofrecer, en Equipar y en la Guía de Gatos, un control de filtro con casillas independientes por `RarityType` que, al marcarse, limita la lista visible a los gatos poseídos de esas rarezas.
- **FR-002**: El sistema DEBE ofrecer un filtro por rasgo objetivo (`ClassificationType`) que incluye un gato si alguna de sus `Ability` es `TraitTargeting` con ese rasgo en `targetClassifications`.
- **FR-003**: El sistema DEBE ofrecer un filtro por habilidad, con al menos: Debilitar, Congelar, Ralentizar, Maldecir (según `appliesEffect`/`immuneEffects` no aplica — es `appliesEffect.type` del gato), Crítico y Multigolpe (según `attackType`).
- **FR-004**: Cuando el jugador marca criterios de rasgo objetivo Y de habilidad simultáneamente, un interruptor Y/O DEBE decidir si un gato debe cumplir ambos (Y) o cualquiera (O) para aparecer — el filtro de rareza siempre es independiente (Y implícito con cualquier combinación de rasgo/habilidad).
- **FR-005**: El sistema DEBE ofrecer un control para ordenar la lista visible de menor a mayor nivel, combinable con cualquier filtro activo.
- **FR-006**: Sin ningún criterio marcado, el sistema DEBE mostrar exactamente los mismos gatos que se mostraban antes de esta spec (sin regresión).
- **FR-007**: El sistema DEBE permitir abrir un panel de detalle para cualquier gato poseído desde Equipar o la Guía de Gatos, mostrando HP, Daño, DPS derivado, Alcance (y alcance mínimo si aplica), Velocidad, Coste de despliegue, Tiempo de recarga, Tipo de ataque, Rasgo/rasgo especial y Habilidades, todos correspondientes a la forma de evolución vigente del gato.
- **FR-008**: Si el gato tiene `evolutions` definido, el panel DEBE ofrecer una pestaña por cada forma alcanzable (Base siempre; Evolucionada si existe `evolutions.second`; Verdadera si existe `evolutions.true`), mostrando los stats de esa forma al seleccionarla sin cambiar la forma real del gato.
- **FR-009**: El panel DEBE mostrar un botón de evolución habilitado únicamente cuando la forma actual del gato tiene una forma siguiente y se cumplen sus requisitos (nivel, e ítems de evolución si aplica) — deshabilitado con el requisito faltante visible en cualquier otro caso, y ausente si la forma actual ya es la máxima del gato.
- **FR-010**: Pulsar el botón de evolución habilitado DEBE invocar `evolveCat(catId)` (ya existente) y reflejar la nueva forma de inmediato en el panel.
- **FR-011**: Ningún cambio de esta spec DEBE alterar el comportamiento de selección de equipo en Equipar (FR de `specs/006`/`specs/022`) ni ningún stat efectivo ya calculado por `getEffectiveCatStats`.

### Key Entities *(include if feature involves data)*

- **Criterio de filtro** (estado efímero de UI, no persistido): conjunto de rarezas marcadas, rasgo objetivo marcado, habilidad marcada, modo Y/O, orden por nivel — vive en el componente de cada pantalla (Equipar/Guía de Gatos tienen su propio estado, no compartido entre sí).
- **Panel de detalle de unidad** (estado efímero de UI): `catId` actualmente abierto + forma de evolución seleccionada en las pestañas (por defecto, la forma real vigente del gato).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Con un roster de prueba de gatos de al menos 3 rarezas distintas, marcar una rareza en el filtro reduce la lista visible al 100% correcto (ni de más ni de menos) en Equipar y en la Guía de Gatos.
- **SC-002**: Combinar un filtro de rasgo objetivo y uno de habilidad con Y/O produce el resultado esperado en ambos modos, verificable con al menos un gato que cumple solo uno de los dos criterios.
- **SC-003**: El panel de detalle muestra las 8 estadísticas de FR-007 para el 100% de los gatos poseídos, sin ninguno mostrando `undefined`/`NaN`.
- **SC-004**: Un gato elegible para evolucionar puede evolucionarse desde el panel de detalle en un solo clic, y el cambio persiste tras recargar la aplicación (verificable vía Dexie).
- **SC-005**: `npx tsc -b` limpio y `npm test` en verde, sin regresión en ninguna suite existente.

## Assumptions

- **Alcance de pantallas**: el filtro y el panel de detalle se implementan en Equipar (`TeamScreen`) y Guía de Gatos (`CatGuideScreen`) — el manual también menciona el Upgrade Menu como tercera ubicación del Cat Filter, pero esta spec no lo incluye (mismo criterio de `roadmap-rediseno-visual.md`, que ya excluyó "Mejoras de Base" de `UpgradeScreen` como fuera de alcance); puede añadirse en una spec de seguimiento si se pide explícitamente.
- **"Solo Formas Máximas" (manual § 4.5)**: excluida de esta spec — en el modelo de datos actual cada gato poseído es una única fila con una sola `evolutionStage` (nunca aparecen formas duplicadas de un mismo gato en la lista), así que esa casilla del mockup no tendría ningún efecto que filtrar; no se implementa un control que no hace nada.
- **Retroceso/Knockback (manual § 5.2)**: no existe como estadística en `BattleUnit`/`Cat` en este proyecto (confirmado por búsqueda en `src/`) — el panel de detalle no lo muestra, siguiendo el mismo criterio que excluyó "Leadership"/"Meow Medals" en `specs/026` por falta de dato de origen.
- **Inclusión de Talentos en el filtro (manual § 4.5)**: no aplica — el sistema de Talentos no existe todavía en este proyecto (candidato futuro del backlog, fuera de esta spec).
- El botón de evolución de esta spec reutiliza `evolveCat()` tal cual existe hoy — no cambia sus reglas de requisito ni introduce ninguna UI para gastar ítems de evolución por otra vía (eso seguiría siendo obtención pasiva, sin cambios).
- El filtro de habilidad (FR-003) se ancla a los campos ya existentes (`appliesEffect`, `attackType`) en vez de al catálogo completo de +40 habilidades del manual (`AbilityEffectType` del proyecto solo implementa un subconjunto, ver `docs/plan-tecnico-manual-completo.md` § 1.2) — cubre lo que el roster actual realmente tiene, sin inventar categorías vacías.
