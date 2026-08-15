# Feature Specification: Guardado Local de Progreso

**Feature Branch**: `002-local-save-progress`

**Created**: 2026-07-27

**Status**: Draft

**Input**: User description: "Guardado local de progreso del jugador para \"The Battler\": persistir en el dispositivo, sin sistema de cuentas ni backend, qué capítulos ha completado el jugador (empezando por el Capítulo 1) y si el resultado fue victoria, para poder retomar el juego entre sesiones sabiendo qué contenido ya se completó. No incluye sincronización en la nube, multi-dispositivo, ni desbloqueo de unidades (eso queda para más adelante si se decide)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Guardar el resultado de una batalla completada (Priority: P1)

Cuando el jugador termina una batalla de capítulo (Victoria o Derrota), el resultado se guarda automáticamente en el dispositivo, sin que el jugador tenga que realizar ninguna acción manual de guardado.

**Why this priority**: Es el fundamento de toda la feature — sin un registro persistido de lo que pasó en la batalla, no hay nada que cargar ni de qué progreso hablar. Todo lo demás depende de esto.

**Independent Test**: Completar una batalla del Capítulo 1 hasta Victoria o Derrota, cerrar completamente el juego, e inspeccionar el almacenamiento local del dispositivo para confirmar que el resultado quedó registrado correctamente sin intervención manual.

**Acceptance Scenarios**:

1. **Given** el jugador está jugando la batalla del Capítulo 1, **When** la batalla se resuelve en Victoria, **Then** el sistema guarda automáticamente que el Capítulo 1 fue completado con resultado Victoria.
2. **Given** el jugador está jugando la batalla del Capítulo 1, **When** la batalla se resuelve en Derrota, **Then** el sistema guarda automáticamente el intento con resultado Derrota, sin marcar el capítulo como completado.
3. **Given** el jugador ya había completado el Capítulo 1 con Victoria previamente, **When** vuelve a jugarlo y lo gana de nuevo, **Then** el registro guardado se actualiza (no se duplica) reflejando el resultado más reciente.

---

### User Story 2 - Retomar el juego con el progreso previo cargado (Priority: P2)

Al reabrir el juego, el sistema carga el progreso guardado previamente y lo deja disponible antes de que el jugador pueda interactuar, para que el juego sepa qué capítulos ya se completaron.

**Why this priority**: Guardar sin cargar no tiene ningún efecto observable para el jugador; esta historia es la que le da valor real al guardado de la Historia 1.

**Independent Test**: Con un guardado previo ya existente en el dispositivo, lanzar el juego desde cero y verificar (por inspección directa del estado cargado) que coincide con lo que se había guardado. Repetir sin ningún guardado previo (primer lanzamiento) y verificar que el juego arranca sin errores tratando al jugador como sin progreso.

**Acceptance Scenarios**:

1. **Given** existe un guardado previo con el Capítulo 1 completado en Victoria, **When** el jugador abre el juego, **Then** el sistema carga ese estado antes de que el jugador pueda iniciar cualquier acción.
2. **Given** no existe ningún guardado previo (instalación nueva o primera vez), **When** el jugador abre el juego, **Then** el sistema continúa con normalidad tratando al jugador como si no hubiera completado ningún capítulo, sin errores ni bloqueos.
3. **Given** el archivo de guardado local existe pero está corrupto o en un formato inesperado, **When** el jugador abre el juego, **Then** el sistema lo trata como si no hubiera progreso guardado, en vez de fallar o bloquear el arranque.

---

### User Story 3 - Reiniciar el progreso guardado (Priority: P3)

Es posible borrar el progreso guardado localmente para volver al estado de una instalación nueva, sin ningún capítulo completado.

**Why this priority**: Tiene valor (control de QA / opción de reinicio), pero no bloquea el valor central de guardar y cargar progreso; puede añadirse después de que las Historias 1 y 2 funcionen.

**Independent Test**: Con un guardado existente en el dispositivo, ejecutar la acción de borrado de progreso y verificar que una carga posterior no encuentra ningún capítulo completado.

**Acceptance Scenarios**:

1. **Given** existe progreso guardado en el dispositivo, **When** se ejecuta la acción de borrar el progreso, **Then** el guardado local se elimina y una carga posterior no encuentra capítulos completados.

---

### Edge Cases

- ¿Qué pasa si el jugador cierra el juego a mitad de una batalla, sin llegar a Victoria o Derrota? El sistema no debe guardar el capítulo como completado ni como intentado; el último guardado sigue siendo el de la última batalla efectivamente resuelta.
- ¿Qué pasa si el archivo de guardado está corrupto, incompleto, o de una versión de formato anterior no reconocida? El sistema lo trata como "sin progreso" en lugar de fallar o bloquear el arranque del juego (ver Historia 2, Escenario 3).
- ¿Qué pasa si se intenta guardar y el almacenamiento local no está disponible o falla la escritura (por ejemplo, sin espacio en disco)? El juego debe seguir siendo jugable en esa sesión; el progreso de esa batalla puede no quedar persistido, pero el fallo no debe interrumpir ni bloquear el gameplay.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE persistir en almacenamiento local del dispositivo, por capítulo, si el jugador lo completó y el resultado (Victoria/Derrota) del intento más reciente.
- **FR-002**: El sistema DEBE guardar automáticamente al resolverse una batalla (Victoria o Derrota), sin requerir ninguna acción manual de guardado por parte del jugador.
- **FR-003**: El sistema DEBE cargar el progreso guardado automáticamente al iniciar el juego, antes de que cualquier decisión que dependa del progreso (p. ej. qué capítulos están completados) se tome.
- **FR-004**: El sistema DEBE tratar la ausencia de guardado (primer lanzamiento) como "ningún capítulo completado", sin generar errores.
- **FR-005**: El sistema DEBE tratar un archivo de guardado corrupto o ilegible como "ningún capítulo completado", en lugar de fallar o bloquear el arranque.
- **FR-006**: El sistema DEBE actualizar (sobreescribir) el registro de un capítulo al repetirse un intento, sin crear registros duplicados o en conflicto para el mismo capítulo.
- **FR-007**: El sistema DEBE ofrecer una forma de borrar todo el progreso guardado, dejando el estado equivalente al de una instalación nueva.
- **FR-008**: El progreso guardado NO DEBE depender de ninguna cuenta de usuario ni de conectividad de red, ni para guardar ni para cargar.
- **FR-009**: El sistema DEBE registrar, como mínimo para el Capítulo 1, el estado de completado (sí/no) y el resultado (Victoria/Derrota) del intento más reciente; el diseño no debe impedir añadir más capítulos más adelante, aunque hoy solo exista el Capítulo 1.
- **FR-010**: Si la escritura del guardado falla a nivel de sistema operativo (p. ej. sin espacio en disco, permisos), el sistema DEBE capturar el error internamente y continuar el gameplay con normalidad; el intento de guardado puede no persistir, pero el fallo NO DEBE propagarse como una excepción no controlada ni interrumpir la sesión (ver Edge Cases).

### Key Entities *(include if feature involves data)*

- **ChapterProgressRecord**: registro de progreso de un capítulo — identificador del capítulo, si está completado, y el resultado (Victoria/Derrota) del intento más reciente.
- **ProgressSaveData**: el conjunto agregado de todos los `ChapterProgressRecord` guardados en el dispositivo, junto con un marcador de versión de formato que permita reconocer guardados antiguos o incompatibles (ver Edge Cases).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un jugador que completa el Capítulo 1, cierra el juego por completo y lo reabre, encuentra su estado de completado intacto el 100% de las veces en un cierre normal de la aplicación.
- **SC-002**: Cargar el progreso guardado al iniciar el juego no introduce una demora perceptible para el jugador (bajo 1 segundo en el hardware objetivo).
- **SC-003**: Un jugador que abre el juego por primera vez (sin guardado previo) puede completar una sesión entera sin encontrar ningún error o bloqueo relacionado con el progreso.
- **SC-004**: Borrar el progreso guardado y reabrir el juego produce, el 100% de las veces, la misma experiencia inicial que una instalación nueva, sin rastros del estado anterior.

## Assumptions

- Hay un único slot de guardado local por instalación; no se requiere una interfaz de selección de múltiples partidas guardadas, dado que no hay cuentas ni multi-dispositivo en este alcance.
- "Almacenamiento local del dispositivo" significa datos que persisten entre reinicios de la aplicación en la misma instalación; esta spec no exige ninguna tecnología de persistencia concreta.
- El guardado ocurre automáticamente al resolverse una batalla; no se requiere una acción explícita de "guardar" por parte del jugador en esta etapa.
- Esta feature cubre únicamente el estado de completado y el resultado más reciente por capítulo. Desbloqueo de unidades, moneda, u otros datos de progresión quedan explícitamente fuera de alcance (por decisión del usuario) y podrían añadirse en una feature futura.
- No hay sincronización en la nube ni soporte multi-dispositivo; el progreso es local a la instalación.
- El mecanismo para borrar el progreso (Historia 3) puede ser un control orientado a QA/desarrollo en esta etapa de vertical slice; no se requiere un botón de "reiniciar progreso" visible para el jugador final a menos que se especifique más adelante.
