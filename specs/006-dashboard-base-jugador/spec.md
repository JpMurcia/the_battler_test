# Feature Specification: Dashboard de Base del Jugador

**Feature Branch**: `006-dashboard-base-jugador`

**Created**: 2026-08-15

**Status**: Draft

**Input**: Adaptación a battle-cats-web de `the_battler_test/specs/005-player-dashboard` (proyecto Unity origen): pantalla que muestra el nivel de personaje agregado, permite mejorar gatos gastando el recurso de progresión, y permite elegir qué gatos llevar a la próxima batalla.

**Nota de adaptación**: battle-cats-web ya tiene casi toda la capa de datos — `useMetaStore.ownedCats` (nivel + XP invertida por gato) y `useMetaStore.upgradeCat(catId)` (ya gasta `currency` con `upgradeCost = nivel * 100`) — pero **ninguna pantalla real la usa**: `UpgradeScreen.tsx` es un stub vacío. A diferencia del origen, que separa "experiencia" de "moneda de gacha", battle-cats-web ya unificó ambas en una sola `currency` (Constitución § VII, simplicidad) — esta spec no introduce un segundo recurso, reutiliza `currency` tal como ya está implementada. Tampoco existe hoy el concepto de "equipo activo": `BattleScreen`/`DeployBar` despliega todos los `ownedCats` sin ningún filtro — esta spec lo introduce.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver nivel de personaje y moneda disponible (Priority: P1)

Un jugador entra a la pantalla de Base y ve su nivel de personaje agregado (suma de niveles de sus gatos) y su moneda disponible para mejoras.

**Why this priority**: Es la vista fundamental — sin contexto de progreso, mejorar o formar equipo no tiene referencia.

**Independent Test**: Entrar a la pantalla de Base con al menos un gato poseído y confirmar que se muestra el nivel de personaje (suma de niveles de `ownedCats`) y la `currency` disponible.

**Acceptance Scenarios**:

1. **Given** el jugador tiene gatos poseídos con distintos niveles, **When** entra a la Base, **Then** ve la suma de esos niveles como "nivel de personaje" y su `currency` actual.
2. **Given** el jugador solo tiene el gato inicial en nivel 1 (primera sesión), **When** entra a la Base, **Then** el nivel de personaje muestra 1, sin errores ni valores indefinidos.

---

### User Story 2 - Mejorar un gato gastando moneda (Priority: P1)

Un jugador con moneda suficiente mejora uno de sus gatos desde la Base, y ve reflejado el nuevo nivel y el descuento de moneda de inmediato.

**Why this priority**: Es el valor central de la Base — ya existe como lógica de store (`upgradeCat`), solo falta la UI que lo dispare.

**Independent Test**: Con `currency` suficiente para `upgradeCost(level)`, mejorar un gato desde la Base y confirmar que su nivel sube, la moneda se descuenta, y el nivel de personaje agregado se actualiza.

**Acceptance Scenarios**:

1. **Given** el jugador tiene `currency >= upgradeCost(nivel actual)`, **When** mejora un gato, **Then** su nivel sube en 1, la moneda gastada se descuenta, y el nivel de personaje agregado aumenta en 1.
2. **Given** el jugador no tiene moneda suficiente, **When** intenta mejorar, **Then** `useMetaStore.upgradeCat` devuelve `false` y la UI no permite confirmar la acción (botón deshabilitado o sin efecto).
3. **Given** el jugador mejora un gato, **When** recarga la aplicación, **Then** el nivel y la moneda restante se mantienen (ya garantizado por `db.ownedCats`/`db.playerProfile`, sin cambios de esquema).

---

### User Story 3 - Elegir el equipo antes de la batalla (Priority: P2)

Un jugador entra a una pantalla de Equipo, elige qué gatos poseídos llevará a la próxima batalla, y `DeployBar` solo ofrece esos gatos al entrar en combate.

**Why this priority**: Da control táctico; depende de que ya existan gatos mejorables (Historia 2) para que formar equipo tenga sentido más allá del comportamiento actual (todos disponibles siempre).

**Independent Test**: Con 2+ gatos poseídos, entrar a Equipo, deseleccionar uno, entrar a una batalla y confirmar que `DeployBar` no lo ofrece.

**Acceptance Scenarios**:

1. **Given** el jugador está en la pantalla de Equipo, **When** selecciona un subconjunto de sus gatos poseídos, **Then** el sistema guarda esa selección como equipo activo (persistido localmente).
2. **Given** existe un equipo activo guardado, **When** el jugador entra a una batalla, **Then** `DeployBar` solo muestra los gatos del equipo activo, no todos los `ownedCats`.
3. **Given** el jugador intenta guardar un equipo vacío, **When** confirma, **Then** el sistema no lo permite y mantiene el último equipo activo válido.
4. **Given** el jugador nunca definió un equipo activo (nueva partida), **When** entra a batalla, **Then** el comportamiento por defecto es el actual: todos los `ownedCats` disponibles.

---

### Edge Cases

- ¿Qué pasa si el jugador no tiene `currency` suficiente al entrar a la Base? Las opciones de mejora se muestran deshabilitadas por gato, sin bloquear el resto de la pantalla.
- ¿Qué pasa si el jugador obtiene un gato nuevo (futura spec de gacha) después de guardar un equipo activo? El gato nuevo no se agrega automáticamente al equipo activo — el jugador debe agregarlo manualmente desde Equipo. No es responsabilidad de esta spec el origen de gatos nuevos.
- ¿Qué pasa si el equipo activo guardado contiene un `catId` que ya no está en `ownedCats` (dato inconsistente)? Se filtra silenciosamente al leer — `DeployBar` nunca ofrece un gato que el jugador no posee.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE mostrar una pantalla `Base` con el nivel de personaje agregado (suma de `ownedCats[*].level`) y la `currency` disponible.
- **FR-002**: La pantalla `Base` DEBE listar cada gato poseído con su nivel actual, costo de la siguiente mejora (`upgradeCost`), y una acción "Mejorar" que invoca `useMetaStore.upgradeCat(catId)`.
- **FR-003**: El botón "Mejorar" DEBE deshabilitarse cuando `currency < upgradeCost(nivel actual)`.
- **FR-004**: El sistema DEBE ofrecer una pantalla `Team` donde el jugador selecciona un subconjunto no vacío de `ownedCats` como equipo activo.
- **FR-005**: El sistema NO DEBE permitir guardar un equipo activo vacío — la acción de confirmar queda deshabilitada mientras la selección esté vacía.
- **FR-006**: El sistema DEBE persistir localmente el equipo activo (nueva tabla o campo en Dexie), de forma que se mantenga entre sesiones.
- **FR-007**: `DeployBar` (`BattleScreen.tsx`) DEBE filtrar los gatos ofrecidos por el equipo activo cuando exista uno guardado; si no existe (partida sin equipo definido todavía), DEBE mantener el comportamiento actual (todos los `ownedCats`).
- **FR-008**: El sistema NO DEBE introducir un segundo recurso de progresión (experiencia separada) — reutiliza `currency` tal como ya la gasta `upgradeCat`.
- **FR-009**: Esta feature NO DEBE incluir gacha (fuente de gatos nuevos queda fuera de alcance).

### Key Entities

- **`TeamFormation`** (nuevo): conjunto de `catId` seleccionados como equipo activo. Persistido en una tabla Dexie nueva (`teamFormation`, fila singleton `{ id: 1, catIds: string[] }`), leída/escrita desde `useMetaStore`.
- **Nivel de personaje** (derivado, no persistido): `Object.values(ownedCats).reduce((sum, c) => sum + c.level, 0)`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un jugador con moneda suficiente mejora un gato en 2 acciones o menos (entrar a Base, confirmar mejora).
- **SC-002**: Un intento de mejora sin moneda suficiente es rechazado el 100% de las veces sin descontar `currency`.
- **SC-003**: El equipo activo elegido se respeta el 100% de las veces en la siguiente batalla.
- **SC-004**: Nivel/XP de cada gato y el equipo activo se mantienen intactos el 100% de las veces tras recargar la aplicación.
- **SC-005**: `npx tsc -b` limpio y suite de Vitest sin regresiones.

## Assumptions

- No se introduce una "experiencia" separada de `currency` — divergencia deliberada del origen, ya resuelta de facto por la implementación actual de `useMetaStore.upgradeCat`.
- El equipo activo por defecto (sin selección previa) es "todos los `ownedCats`", igual que el comportamiento actual de `DeployBar` — no rompe partidas ya en curso.
- El tamaño mínimo del equipo activo es 1 gato; no se define un máximo distinto al total de gatos poseídos.
- Esta spec no modifica `src/engine/`; solo determina qué gatos están disponibles para desplegar, igual que el origen.
- La variación visual de fondo "por aventura" del origen (Historia 4) se difiere a cuando exista un segundo nivel real (`specs/011-nivel-2-hacia-el-futuro`) — sin efecto observable con un solo nivel hoy, se omite como requisito bloqueante de esta spec.
