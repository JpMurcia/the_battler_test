# Feature Specification: Pulido de Batalla y HUD — Cañón Especial, Velocidad, HP por Unidad, Energía y Filas

**Feature Branch**: `029-pulido-batalla-hud`

**Created**: 2026-08-27

**Status**: Draft

**Input**: User description: "Pulido de Batalla y HUD del Hub: conectar a la interfaz mecánicas que ya existen en el motor/store pero no son accesibles al jugador. (1) Cañón especial (Gatorreta) con botón + anillo de carga en BattleScreen. (2) Control de velocidad x1/x2 y pausa en BattleScreen. (3) Barra de HP individual por unidad desplegada en batalla. (4) Temporizador de regeneración de energía visible en el HUD del Hub. (5) Toggle 1 fila / 2 filas en la barra de despliegue. Ninguna cambia reglas de combate, balance ni contenido — es exclusivamente UI/HUD sobre mecánica y datos ya existentes (specs/001 a specs/028)."

**Nota de origen**: primera spec de un backlog mayor derivado de comparar el mockup de referencia (`docs/the-battle-cats-redesign/project/Battle Cats Modernizado.dc.html`) y el manual técnico (`docs/The_Battle_Cats_Manual_Tecnico.docx`) contra el estado real de `src/` tras `specs/028`. De las brechas encontradas, este grupo es el de menor riesgo: ninguna requiere datos ni persistencia nueva, solo exponer en la interfaz mecánica que el motor/estado ya calcula.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Disparar el cañón especial de base (Priority: P1)

Un jugador en combate ve un botón de cañón con un anillo que se va llenando mientras se recarga. Cuando el anillo se completa, el botón se activa y, al pulsarlo, dispara un ataque de área que golpea a los enemigos en pantalla y reinicia la recarga.

**Why this priority**: Es la mecánica de mayor impacto ya construida pero completamente inaccesible — el jugador no tiene ninguna forma de usar el cañón especial hoy, pese a que existe una fuente de daño adicional ya balanceada en el motor.

**Independent Test**: Entrar a una batalla, esperar a que el cañón complete su recarga, confirmar que el botón pasa de deshabilitado a habilitado, pulsarlo y confirmar que se aplica el efecto de área y la recarga vuelve a empezar desde cero.

**Acceptance Scenarios**:

1. **Given** el cañón especial está recargando, **When** el jugador observa el HUD de batalla, **Then** ve un indicador de progreso (anillo u otro control visual) que refleja `specialCannon.rechargeRemaining` en tiempo real y el botón de disparo está deshabilitado.
2. **Given** el cañón especial terminó de recargar, **When** el jugador observa el HUD, **Then** el botón de disparo se habilita visualmente (deja de estar atenuado/bloqueado).
3. **Given** el botón está habilitado, **When** el jugador lo pulsa, **Then** se invoca el disparo del cañón (mismo efecto que ya aplica `activateSpecialCannon()`), el indicador de progreso vuelve a cero y el botón vuelve a deshabilitarse.
4. **Given** el botón está deshabilitado (en recarga), **When** el jugador lo pulsa, **Then** no ocurre ningún efecto — no se puede disparar antes de tiempo.
5. **Given** la partida termina (victoria/derrota) mientras el cañón estaba recargando, **When** se llega a la pantalla de resultado, **Then** el estado del cañón no afecta el resultado ni queda visible fuera de la pantalla de batalla.

---

### User Story 2 - Controlar la velocidad y pausar la batalla (Priority: P1)

Un jugador en combate puede acelerar la simulación a x2 para no esperar tiempos muertos, volver a x1, y pausar/reanudar en cualquier momento sin perder el estado de la partida.

**Why this priority**: Es uno de los controles de batalla más usados en el juego de referencia y hoy no existe ninguna forma de ajustar el ritmo del combate — afecta a cada partida jugada, no a un caso puntual.

**Independent Test**: Entrar a una batalla, activar x2 y confirmar que las unidades avanzan/atacan visiblemente más rápido que a x1; pulsar pausa y confirmar que nada se mueve ni cambia hasta reanudar.

**Acceptance Scenarios**:

1. **Given** una batalla en curso a velocidad x1, **When** el jugador selecciona x2, **Then** el tiempo simulado avanza el doble por segundo real (el `deltaSeconds` efectivo pasado a la simulación se duplica), sin alterar ninguna regla de daño/costo/cooldown.
2. **Given** una batalla en curso, **When** el jugador pulsa pausa, **Then** la simulación deja de avanzar (energía, cooldowns, movimiento y combate quedan congelados) hasta que se reanude.
3. **Given** la batalla está en pausa, **When** el jugador pulsa reanudar, **Then** la simulación continúa exactamente desde el estado en que quedó, sin saltos ni pérdida de progreso.
4. **Given** el jugador cambia entre x1 y x2 repetidamente, **When** se observa el resultado final de la batalla, **Then** el resultado (victoria/derrota, HP finales) es idéntico al que se obtendría jugando toda la batalla a x1 — la velocidad solo afecta el ritmo percibido, nunca el balance.
5. **Given** la batalla termina en victoria o derrota, **When** aparece la pantalla de resultado, **Then** los controles de velocidad/pausa dejan de tener efecto (no hay nada que acelerar o pausar).

---

### User Story 3 - Ver el HP de cada unidad en batalla (Priority: P2)

Un jugador observando el combate puede ver, sobre cada unidad propia y enemiga desplegada, cuánta vida le queda respecto a su máximo, sin tener que adivinarlo por la animación.

**Why this priority**: Mejora directa de legibilidad del combate — hoy solo se ve el HP agregado de las bases, no el de las unidades individuales que están peleando.

**Independent Test**: Desplegar una unidad, dejar que reciba daño de un enemigo sin morir, y confirmar que su indicador de HP se reduce proporcionalmente en tiempo real.

**Acceptance Scenarios**:

1. **Given** una unidad aliada o enemiga activa en el campo de batalla, **When** el jugador la observa, **Then** ve un indicador visual de su HP actual sobre su HP máximo, posicionado junto a su sprite.
2. **Given** una unidad recibe daño, **When** su HP cambia, **Then** el indicador se actualiza para reflejar el nuevo valor en el mismo tick en que ocurre el cambio (sin desfase perceptible).
3. **Given** una unidad llega a 0 HP y muere, **When** sale del campo de batalla, **Then** su indicador de HP desaparece junto con ella (no queda un indicador huérfano).
4. **Given** múltiples unidades desplegadas simultáneamente (hasta el límite del nivel), **When** el jugador observa el campo, **Then** cada una mantiene su propio indicador independiente, sin que el rendimiento visual (fps) se degrade de forma perceptible.

---

### User Story 4 - Ver cuánto falta para la próxima energía en el Hub (Priority: P2)

Un jugador en el Hub, con la energía de misión por debajo del máximo, ve cuánto tiempo falta para recuperar la próxima unidad de energía (o para llenarse por completo), en vez de solo ver el número actual sin contexto de cuándo cambiará.

**Why this priority**: Reduce la incertidumbre de "¿cuánto espero para poder jugar otra etapa?" — es información que el motor de regeneración ya calcula pero hoy el jugador no puede ver.

**Independent Test**: Con energía por debajo del máximo, abrir el Hub y confirmar que se muestra un temporizador; esperar (o simular el paso del tiempo) y confirmar que el temporizador cuenta regresivamente y se actualiza cuando la energía sube.

**Acceptance Scenarios**:

1. **Given** la energía de misión del jugador está por debajo de su máximo, **When** abre el Hub, **Then** ve un temporizador que indica el tiempo estimado hasta la próxima unidad de energía recuperada.
2. **Given** el temporizador está visible, **When** pasa el tiempo real, **Then** la cuenta regresiva avanza de forma consistente con la tasa de regeneración ya calculada por `missionEnergy.ts`.
3. **Given** la energía alcanza su máximo, **When** el jugador observa el HUD, **Then** el temporizador deja de mostrarse (no hay nada que esperar).
4. **Given** el jugador navega fuera del Hub y regresa más tarde, **When** vuelve a verlo, **Then** el temporizador refleja el tiempo transcurrido realmente, no se reinicia de forma incorrecta.

---

### User Story 5 - Elegir cuántas filas de unidades ver en la barra de despliegue (Priority: P3)

Un jugador en batalla puede alternar la disposición de la barra de despliegue entre una fila y dos filas, según su preferencia visual, sin que eso cambie qué unidades tiene disponibles ni su orden.

**Why this priority**: Es una preferencia de comodidad visual, de menor urgencia que las anteriores porque con el tope actual de 6 unidades activas la fila única ya es utilizable — el mockup y el manual lo documentan como opción estándar del juego de referencia.

**Independent Test**: En batalla, alternar el control de filas y confirmar que la misma barra de unidades se redistribuye en 1 o 2 filas sin cambiar cuáles están disponibles, sus costos o su orden.

**Acceptance Scenarios**:

1. **Given** la barra de despliegue en su disposición por defecto, **When** el jugador activa el toggle de 2 filas, **Then** las mismas unidades se redistribuyen en 2 filas en vez de 1, sin cambiar su orden relativo.
2. **Given** la disposición de 2 filas activa, **When** el jugador vuelve a alternar, **Then** regresa a la disposición de 1 fila.
3. **Given** cualquier disposición seleccionada, **When** el jugador despliega una unidad, **Then** el comportamiento (costo, cooldown, invocación) es idéntico sin importar cuántas filas se estén mostrando.
4. **Given** el jugador cambia de disposición durante una batalla en curso, **When** continúa jugando, **Then** no se interrumpe ni se resetea el estado de la partida.

---

### Edge Cases

- El jugador pulsa el botón del cañón especial repetidas veces mientras está deshabilitado (spam de clics): no debe disparar más de una vez ni acumular disparos en cola.
- La batalla se pausa justo en el instante en que el cañón especial termina de recargar: al reanudar, el botón debe reflejar correctamente que ya está disponible.
- La velocidad x2 está activa cuando una unidad muere o la base llega a 0 HP: la resolución de victoria/derrota debe ocurrir de forma consistente, sin condiciones de carrera por el multiplicador de tiempo.
- Una unidad con HP muy alto (por ejemplo, un jefe) frente a una con HP bajo: el indicador de HP debe representar la proporción correctamente en ambos casos, no un valor absoluto de ancho fijo que distorsione la lectura.
- El jugador abre el Hub con la energía ya al máximo: no debe mostrarse ningún temporizador ni un valor negativo/erróneo.
- El jugador cierra y reabre la aplicación mientras hay energía regenerándose: el temporizador mostrado al volver debe ser consistente con el tiempo real transcurrido, reutilizando el mismo mecanismo de hidratación que ya usa `missionEnergy.ts` (esta spec no cambia cómo se calcula la regeneración, solo cómo se muestra).
- Un nivel/evento cuyo límite de despliegue simultáneo sea menor a 6: el toggle de filas debe seguir funcionando sin asumir que siempre hay exactamente 6 unidades equipadas.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE mostrar en `BattleScreen` un control de disparo del cañón especial que refleje en tiempo real el progreso de recarga ya calculado por `useGameStore` (`specialCannon.rechargeRemaining` / duración total de recarga).
- **FR-002**: El control de disparo DEBE estar deshabilitado mientras el cañón especial esté recargando y habilitado en cuanto la recarga se complete.
- **FR-003**: Pulsar el control habilitado DEBE invocar el mismo efecto que ya ejecuta `activateSpecialCannon()` — esta spec no modifica el daño, alcance ni efecto de área del cañón, solo lo hace accesible.
- **FR-004**: El sistema DEBE ofrecer en `BattleScreen` un control para alternar la velocidad de simulación entre x1 y x2, afectando el `deltaSeconds` efectivo pasado a `tick()` en cada frame sin alterar ninguna regla de costo, daño o cooldown.
- **FR-005**: El sistema DEBE ofrecer un control de pausa/reanudar en `BattleScreen` que detenga por completo el avance de la simulación (energía, cooldowns, movimiento, combate) mientras esté pausada, y la reanude exactamente desde el mismo estado.
- **FR-006**: El sistema DEBE mostrar, para cada unidad aliada y enemiga activa en el campo de batalla, un indicador visual de su HP actual sobre su HP máximo, actualizado en el mismo tick en que cambia.
- **FR-007**: El indicador de HP por unidad DEBE dejar de mostrarse cuando la unidad correspondiente sale del campo de batalla (muerte u otro motivo de remoción).
- **FR-008**: El sistema DEBE mostrar en el HUD del Hub un temporizador estimado hasta la próxima unidad de energía recuperada (o hasta el máximo), basado en el cálculo ya existente de `missionEnergy.ts`, visible únicamente mientras la energía esté por debajo del máximo.
- **FR-009**: El sistema DEBE ofrecer en `BattleScreen` un control que alterne la disposición de la barra de despliegue entre 1 fila y 2 filas, sin cambiar qué unidades están disponibles, su orden, costo o cooldown.
- **FR-010**: Ninguno de los controles anteriores DEBE alterar el resultado determinista de una batalla (mismo estado inicial + mismas decisiones de despliegue + mismo tiempo total simulado deben producir el mismo resultado, sin importar la velocidad o disposición de filas elegida).
- **FR-011**: Todos los controles nuevos DEBEN respetar la separación Motor/UI ya establecida (Constitución Principio VI) — la simulación sigue viviendo en `src/engine/` y `useGameStore`, y estos controles solo la leen/invocan desde componentes de React, sin introducir lógica de combate en la capa de presentación.

### Key Entities *(include if feature involves data)*

- **Velocidad de simulación** (estado efímero de UI, no persistido): multiplicador (x1/x2) aplicado al `deltaSeconds` de cada tick durante la batalla en curso; se resetea a x1 al iniciar una nueva batalla.
- **Estado de pausa** (estado efímero de UI, no persistido): booleano que, mientras esté activo, evita que `BattleStage`/`useGameStore.tick()` avance la simulación.
- **Disposición de filas** (estado efímero de UI, no persistido salvo que se decida en `plan.md` guardarlo como preferencia — ver Assumptions): número de filas (1 o 2) en que se distribuye la barra de despliegue durante la batalla en curso.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En una batalla de prueba, el jugador puede disparar el cañón especial al menos una vez usando únicamente controles visibles en pantalla, sin necesitar ninguna acción fuera de la UI.
- **SC-002**: Activar velocidad x2 reduce a la mitad el tiempo real necesario para completar una batalla de prueba idéntica jugada a x1, con el mismo resultado final (HP de bases, unidades sobrevivientes).
- **SC-003**: Pausar la batalla detiene el 100% de los cambios de estado observables (posición de unidades, HP, energía, cooldowns) hasta reanudar.
- **SC-004**: El 100% de las unidades activas en una batalla de prueba (aliadas y enemigas) muestran su HP individual actualizado, verificable visualmente en cada momento del combate.
- **SC-005**: Con energía por debajo del máximo, el temporizador del Hub muestra un valor que llega a cero (o desaparece) en el mismo momento en que la energía mostrada efectivamente sube, sin desfase mayor a unos segundos.
- **SC-006**: El jugador puede alternar entre 1 y 2 filas de despliegue en cualquier momento de la batalla sin perder progreso ni ver unidades duplicadas/faltantes.
- **SC-007**: `npx tsc -b` limpio y `npm test` en verde, sin regresión en ninguna suite existente (`src/engine/`, stores, componentes).

## Assumptions

- Esta spec no introduce ningún dato nuevo en `src/data/` ni ninguna tabla nueva en Dexie — toda la información que expone (recarga del cañón, HP de unidad, regeneración de energía) ya existe en `useGameStore`/`missionEnergy.ts`; el trabajo es exclusivamente de presentación (React + lectura de selectores acotados de Zustand), consistente con el Principio VI de la constitución.
- La disposición de filas (US5) se trata como preferencia de sesión (como la velocidad y la pausa), no como progreso persistente — si en `plan.md` se decide que tiene más sentido guardarla en `useMetaStore`/Dexie (similar a un ajuste de `SettingsScreen`), es una decisión de implementación que no cambia ningún requisito funcional de esta spec.
- El multiplicador x2 se implementa escalando `deltaSeconds` antes de pasarlo a `stepSimulation`, no ejecutando el tick dos veces por frame — cualquiera de las dos técnicas satisface FR-004/FR-010, la elección exacta se resuelve en `plan.md`.
- El indicador de HP por unidad (US3) se puede resolver tanto en la capa Pixi (`UnitSprite.tsx`) como en un overlay de React posicionado por tick — la elección concreta, y si compromete el principio de "ningún componente de React vuelve a renderizar en el tick de combate" (Principio VI), se decide y justifica en `plan.md`.
- Esta spec no añade ningún nuevo tipo de daño, habilidad, unidad, nivel ni ajuste de balance — es puramente de interfaz sobre mecánica ya validada por `specs/001` a `specs/028`.
- Las siguientes specs del mismo backlog (filtros, detalle de unidad, mejoras de base, festival de tesoros, misiones, Gamatoto, Ototo Corps, talentos) quedan explícitamente fuera de alcance — no se anticipa ni se bloquea ningún trabajo de esta spec por ellas.
