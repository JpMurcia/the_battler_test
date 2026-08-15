# Feature Specification: Mapa de Niveles y Desbloqueo Secuencial

**Feature Branch**: `005-mapa-de-niveles`

**Created**: 2026-08-15

**Status**: Draft

**Input**: Adaptación a battle-cats-web de `the_battler_test/specs/004-adventure-map-banners` (proyecto Unity origen): pantalla de selección de nivel navegable libremente, donde solo los niveles desbloqueados son seleccionables, siguiendo el desbloqueo secuencial ya definido en Constitución § II.

**Nota de adaptación**: battle-cats-web ya tiene el estado necesario (`useMetaStore.highestUnlockedLevelIndex`, `unlockNextLevel()`, `completedLevelIds`) y ya declara el desbloqueo secuencial como Core Principle (Constitución § II) — lo que falta es que `LevelSelectScreen.tsx` **lo use**: hoy lista los `LEVELS` sin ningún chequeo de bloqueo, así que cualquier nivel es jugable sin importar el progreso. Esto no es visible con un solo nivel (`level-1`), pero se vuelve un bug real en cuanto exista un segundo nivel (spec `011-nivel-2-hacia-el-futuro`). A diferencia del origen (banners con arte único por capítulo), no hay pipeline de arte todavía (mismo criterio que `specs/003-identidad-visual-animada`) — la selección se resuelve con tarjetas de nivel, no banners ilustrados.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Solo los niveles desbloqueados son jugables (Priority: P1)

Un jugador ve todos los niveles existentes en la pantalla de selección, pero solo puede iniciar batalla en los que ya están desbloqueados según su progreso.

**Why this priority**: Es el bug/gap real que motiva esta spec — sin esto, el desbloqueo secuencial de Constitución § II no tiene ningún efecto en la pantalla que el jugador realmente usa.

**Independent Test**: Con `highestUnlockedLevelIndex = 0` (estado por defecto), entrar a selección de nivel y confirmar que solo `LEVELS[0]` tiene el botón "Jugar" habilitado; los niveles posteriores se muestran deshabilitados/bloqueados.

**Acceptance Scenarios**:

1. **Given** `highestUnlockedLevelIndex` es 0, **When** el jugador entra a selección de nivel, **Then** ve `LEVELS[0]` como jugable y cualquier nivel posterior como bloqueado (no seleccionable).
2. **Given** el jugador intenta interactuar con un nivel bloqueado, **When** lo hace, **Then** el sistema no llama a `startLevel` ni navega a `Battle`.
3. **Given** el jugador completa un nivel y `unlockNextLevel()` incrementa `highestUnlockedLevelIndex`, **When** vuelve a selección de nivel, **Then** el siguiente nivel del array `LEVELS` aparece desbloqueado.

---

### User Story 2 - Navegar libremente por todos los niveles, bloqueados o no (Priority: P2)

Un jugador puede desplazarse por la lista completa de niveles (desbloqueados y bloqueados) sin que el sistema le impida el scroll al llegar a uno bloqueado.

**Why this priority**: Asegura que niveles futuros bloqueados sigan siendo visibles (dan sentido de progresión) aunque no jugables; es una mejora de UX sobre la Historia 1, no bloqueante para que el desbloqueo funcione.

**Independent Test**: Con al menos dos niveles definidos en `LEVELS` (uno bloqueado), confirmar que la pantalla permite desplazarse hasta verlos todos sin restricción de scroll.

**Acceptance Scenarios**:

1. **Given** existen niveles bloqueados en `LEVELS`, **When** el jugador se desplaza por la pantalla, **Then** puede ver todos los niveles, bloqueados o no, sin que el desplazamiento se detenga.

---

### Edge Cases

- ¿Qué pasa si `highestUnlockedLevelIndex` supera el largo de `LEVELS` (no hay más niveles nuevos que desbloquear todavía)? No debe producir errores ni índices fuera de rango; simplemente no hay niveles adicionales que mostrar como recién desbloqueados.
- ¿Qué pasa con un nivel ya completado (`completedLevelIds`)? Sigue siendo jugable (rejugable), y además se muestra visualmente como completado — no se vuelve a bloquear.
- ¿Qué pasa si `useMetaStore` todavía no hidrató? No aplica — `App.tsx` ya bloquea el render de cualquier pantalla hasta `isHydrated`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE mostrar todos los niveles de `LEVELS` en la pantalla de selección, tanto desbloqueados como bloqueados.
- **FR-002**: El sistema DEBE derivar el estado de bloqueo de cada nivel de forma genérica por posición: el nivel en el índice `i` de `LEVELS` está desbloqueado si y solo si `i <= useMetaStore.highestUnlockedLevelIndex`.
- **FR-003**: El sistema DEBE deshabilitar la interacción de "Jugar" sobre un nivel bloqueado — no debe invocar `startLevel` ni navegar a `Battle`.
- **FR-004**: El sistema DEBE permitir al jugador desplazarse libremente por todos los niveles sin restricción de scroll al llegar a uno bloqueado.
- **FR-005**: El sistema DEBE indicar visualmente, para cada nivel, si está: bloqueado, desbloqueado y pendiente, o desbloqueado y completado (`completedLevelIds`).
- **FR-006**: El mecanismo de desbloqueo NO DEBE quedar hardcodeado para un número fijo de niveles — debe funcionar igual si `LEVELS` tiene 1, 2 o N elementos.

### Key Entities

- **Estado de nivel** (derivado, no persistido): `'locked' | 'unlocked' | 'completed'`, calculado en la pantalla a partir de `Level.id`/posición en `LEVELS`, `useMetaStore.highestUnlockedLevelIndex` y `useMetaStore.completedLevelIds`. No es una entidad nueva de datos — es una función pura de estado ya existente.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un intento de jugar un nivel bloqueado nunca inicia una batalla, verificado en el 100% de los casos de prueba.
- **SC-002**: Tras completar un nivel, el siguiente aparece desbloqueado la próxima vez que se abre la pantalla, el 100% de las veces.
- **SC-003**: El 100% de los niveles definidos en `LEVELS` (bloqueados o no) son visibles desplazándose por la pantalla.

## Assumptions

- No hay banners ilustrados por nivel (a diferencia del origen) — se resuelve con tarjetas de nivel basadas en datos ya existentes (`Level.name`, estado derivado), consistente con la ausencia de pipeline de arte ya asumida en `specs/003-identidad-visual-animada`.
- Un nivel completado sigue siendo rejugable indefinidamente (no se re-bloquea); esta spec no introduce límites de intentos ni de energía — eso es alcance de `specs/007-energia-mision-dificultad`.
- Esta spec no agrega el segundo nivel en sí (`specs/011-nivel-2-hacia-el-futuro` lo hace) — solo garantiza que el mecanismo de desbloqueo funcione correctamente en cuanto exista.
