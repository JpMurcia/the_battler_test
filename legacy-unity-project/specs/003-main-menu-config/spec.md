# Feature Specification: Menú Principal y Configuración

**Feature Branch**: `003-main-menu-config`

**Created**: 2026-07-28

**Status**: Draft

**Input**: User description: "Menú principal de \"The Battler\": pantalla de inicio que el jugador ve al abrir el juego, con configuración básica por defecto (audio, idioma) y dos accesos: continuar progreso guardado (si existe, usando el guardado local de 002-local-save-progress) o empezar/ir al mapa de aventuras. No incluye cuentas, login ni backend."

## Clarifications

### Session 2026-07-28

- Q: ¿El ajuste de audio es un único volumen general, o canales separados? → A: Tres canales separados: música, efectos (SFX) y voces/diálogo.
- Q: ¿Cuántos idiomas deben quedar realmente funcionales al lanzar esta feature? → A: Español, Inglés, Chino y Francés, cubriendo únicamente los textos del menú y de la UI ya existente (no la narrativa/diálogos de capítulos).
- Q: ¿Los cambios de audio/idioma se aplican en vivo o requieren confirmación explícita? → A: Requieren una acción explícita "Aplicar/Guardar"; los ajustes solo son accesibles desde la pantalla de menú principal, no dentro de una aventura/batalla en curso.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Empezar una partida nueva desde el menú principal (Priority: P1)

Un jugador que abre el juego por primera vez (sin progreso guardado) ve la pantalla de menú principal y puede elegir "Empezar" para entrar al contenido del juego.

**Why this priority**: Es el punto de entrada fundamental — sin esto, el juego no tiene ninguna pantalla previa a la batalla y no hay nada más en esta feature que tenga sentido.

**Independent Test**: Lanzar el juego sin ningún guardado previo, confirmar que se muestra el menú principal con una opción de "Empezar" (y sin opción de "Continuar"), seleccionarla y verificar que el jugador entra al contenido jugable.

**Acceptance Scenarios**:

1. **Given** el jugador no tiene progreso guardado, **When** abre el juego, **Then** ve el menú principal con una única opción de acceso: "Empezar".
2. **Given** el jugador está en el menú principal sin progreso guardado, **When** selecciona "Empezar", **Then** el juego lo lleva al punto de entrada del contenido jugable actual (la batalla del Capítulo 1 de `001-chapter1-vertical-slice`).

---

### User Story 2 - Continuar el progreso guardado desde el menú principal (Priority: P2)

Un jugador que ya tiene progreso guardado (según `002-local-save-progress`) ve la opción de "Continuar" en el menú principal y, al seleccionarla, retoma el juego desde su progreso.

**Why this priority**: Le da valor real a lo guardado en 002 — sin esto, el guardado existe pero el jugador no tiene forma de aprovecharlo desde el menú.

**Independent Test**: Con un guardado previo válido en el dispositivo, lanzar el juego, confirmar que el menú muestra "Continuar" además de "Empezar", seleccionar "Continuar" y verificar que el jugador retoma el juego reflejando su progreso guardado.

**Acceptance Scenarios**:

1. **Given** existe progreso guardado válido (al menos un capítulo con intento registrado), **When** el jugador abre el juego, **Then** el menú principal muestra la opción "Continuar" junto con "Empezar".
2. **Given** el jugador está en el menú principal con progreso guardado disponible, **When** selecciona "Continuar", **Then** el juego lo lleva al contenido correspondiente a su progreso guardado, sin pasar de nuevo por contenido ya completado como si fuera nuevo.
3. **Given** el archivo de guardado existe pero está corrupto o ilegible, **When** el jugador abre el juego, **Then** el menú lo trata como si no hubiera progreso guardado (solo "Empezar" visible), consistente con el comportamiento de fallback de `002-local-save-progress`.

---

### User Story 3 - Ajustar configuración básica antes de jugar (Priority: P3)

Un jugador puede ajustar audio e idioma desde el menú principal, y esos ajustes se mantienen aunque cierre y reabra el juego.

**Why this priority**: Tiene valor (accesibilidad y preferencia del jugador), pero el menú ya es funcional y jugable sin esto vía las Historias 1 y 2; puede añadirse una vez que el punto de entrada funciona.

**Independent Test**: Desde el menú principal, cambiar el volumen de audio y el idioma, confirmar con "Aplicar/Guardar", cerrar completamente el juego, reabrirlo y verificar que ambos ajustes se mantienen tal como se dejaron.

**Acceptance Scenarios**:

1. **Given** el jugador está en el menú principal, **When** abre la configuración por primera vez sin haber cambiado nada antes, **Then** ve los valores por defecto de audio e idioma ya aplicados, sin que el jugador tenga que configurarlos manualmente.
2. **Given** el jugador cambia el volumen de audio y/o el idioma desde el menú y confirma con "Aplicar/Guardar", **When** cierra completamente el juego y lo vuelve a abrir, **Then** el menú refleja los valores elegidos, no los de fábrica.
3. **Given** el jugador cambia el volumen de audio y/o el idioma desde el menú pero sale de la pantalla de configuración sin presionar "Aplicar/Guardar", **When** vuelve a entrar a la configuración, **Then** ve los últimos valores confirmados anteriormente, no los cambios descartados.

---

### Edge Cases

- ¿Qué pasa si el jugador no tiene progreso guardado? Solo se muestra "Empezar" (ver Historia 1); "Continuar" no aparece como opción seleccionable.
- ¿Qué pasa si el guardado local está corrupto o en un formato no reconocido? El menú lo trata como "sin progreso", igual que define `002-local-save-progress` para la carga del juego (ver Historia 2, Escenario 3).
- ¿Qué pasa si falla la escritura del ajuste de audio/idioma (por ejemplo, sin espacio en disco)? El menú sigue siendo usable en esa sesión con el valor elegido aplicado en memoria; el ajuste puede no persistir para la siguiente sesión, pero el fallo no debe bloquear ni interrumpir el uso del menú.
- ¿Qué pasa si el jugador entra al menú principal habiendo completado ya todo el contenido disponible (hoy, el Capítulo 1)? "Continuar" lo lleva al último punto jugable disponible; no es responsabilidad de esta feature ofrecer contenido nuevo que aún no existe.
- ¿Qué pasa si el jugador cambia ajustes y sale sin presionar "Aplicar/Guardar"? Los cambios no confirmados se descartan; el sistema conserva los últimos valores efectivamente guardados.
- ¿Qué pasa si el jugador quiere cambiar audio/idioma mientras está dentro de una aventura/batalla? No es posible en esta feature: los ajustes solo son accesibles desde la pantalla de menú principal, no durante el gameplay.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE mostrar el menú principal como la primera pantalla con la que el jugador puede interactuar al abrir el juego, antes de cualquier batalla o contenido jugable.
- **FR-002**: El sistema DEBE aplicar valores por defecto de audio e idioma automáticamente, sin requerir que el jugador los configure antes de poder jugar.
- **FR-003**: El sistema DEBE ofrecer, desde el menú principal, tres controles de volumen independientes (música, efectos/SFX, voces/diálogo) y un control para seleccionar el idioma entre Español, Inglés, Chino y Francés.
- **FR-004**: Al cambiar el idioma, el sistema DEBE traducir los textos del menú principal a los cuatro idiomas soportados. La UI de `001-chapter1-vertical-slice` no tiene hoy textos estáticos traducibles (solo un valor numérico de coste y el contenido narrativo de diálogo, este último explícitamente fuera de alcance — ver más abajo), así que el mecanismo de traducción DEBE quedar construido de forma reutilizable para que futura UI no narrativa (de cualquier escena) pueda adoptarlo sin rediseñarlo, sin que esta feature necesite cablear ninguna pantalla existente. La narrativa/diálogos de capítulos queda fuera de alcance de esta feature.
- **FR-005**: El sistema DEBE requerir una acción explícita "Aplicar/Guardar" para confirmar y persistir cambios de audio/idioma; los cambios no confirmados NO DEBEN persistir ni sobrescribir los últimos valores guardados.
- **FR-006**: El sistema DEBE persistir localmente los ajustes de audio e idioma confirmados, de forma que se mantengan entre sesiones (cerrar y reabrir el juego).
- **FR-007**: Los ajustes de audio e idioma SOLO DEBEN ser accesibles desde la pantalla de menú principal; esta feature no incluye acceso a esta configuración durante una aventura/batalla en curso.
- **FR-008**: El sistema DEBE mostrar la opción "Continuar" únicamente cuando exista progreso guardado válido según `002-local-save-progress`; en caso contrario, DEBE mostrar únicamente "Empezar".
- **FR-009**: El sistema DEBE tratar un guardado corrupto o ilegible como ausencia de progreso a efectos del menú (solo "Empezar" disponible), sin bloquear la carga del menú ni del juego.
- **FR-010**: Seleccionar "Empezar" DEBE llevar al jugador al punto de entrada del contenido jugable actual (hoy, la batalla del Capítulo 1 de `001-chapter1-vertical-slice`), sin pasos adicionales de cuenta o login.
- **FR-011**: Seleccionar "Continuar" DEBE llevar al jugador al contenido correspondiente a su progreso guardado más reciente, sin repetir como "nuevo" contenido ya completado.
- **FR-012**: El sistema NO DEBE requerir creación de cuenta, login, ni conectividad de red para acceder o usar el menú principal ni sus ajustes.
- **FR-013**: Si falla la persistencia de un ajuste de audio/idioma confirmado, el sistema DEBE capturar el error internamente, mantener el valor elegido en memoria durante esa sesión, y continuar funcionando con normalidad sin excepciones no controladas (mismo patrón de tolerancia a fallos que `002-local-save-progress`).

### Key Entities *(include if feature involves data)*

- **MenuSettings**: ajustes de menú persistidos localmente — volumen de música, volumen de efectos (SFX), volumen de voces/diálogo, e idioma seleccionado (Español, Inglés, Chino o Francés). Independiente de `ProgressSaveData` (002), aunque ambos viven en almacenamiento local del dispositivo.
- **ProgressSaveData** (existente, de `002-local-save-progress`): se lee desde esta feature únicamente para decidir si mostrar "Continuar", sin modificarse.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un jugador sin progreso guardado pasa de abrir el juego a estar dentro del contenido jugable en una sola selección desde el menú.
- **SC-002**: Un jugador con progreso guardado válido ve la opción "Continuar" y retoma su progreso correctamente el 100% de las veces que el guardado es legible.
- **SC-003**: Un cambio de volumen de audio o idioma confirmado con "Aplicar/Guardar" se mantiene tras un reinicio completo del juego el 100% de las veces; un cambio no confirmado nunca sobrevive a salir de la pantalla de configuración.
- **SC-004**: El menú principal se muestra y queda interactivo en menos de 2 segundos desde que se abre el juego, en un dispositivo móvil de gama media (ver Assumptions — el roadmap del proyecto describe "The Battler" como un juego de estilo gacha inspirado en Battle Cats, un título móvil; no hay todavía una decisión de plataforma objetivo formalizada en la constitución).

## Assumptions

- "Configuración básica por defecto" se limita, para esta fase, a audio (música, efectos y voces/diálogo por separado) e idioma; ajustes adicionales (gráficos, controles, accesibilidad) quedan fuera de alcance salvo que se especifiquen después, siguiendo el criterio de "lo mínimo viable" del roadmap.
- El control de idioma soporta Español, Inglés, Chino y Francés, con traducción real de los textos del menú principal. La UI existente de `001-chapter1-vertical-slice` no tiene textos estáticos traducibles hoy (revisado directamente en el código: solo un valor numérico de coste y el contenido narrativo de diálogo) — el mecanismo de traducción queda disponible para que esa u otra UI no narrativa lo adopte en el futuro, sin que esta feature necesite modificar esas pantallas. La narrativa/diálogos de capítulos (novela visual) queda fuera de alcance y se traduce, si aplica, en una feature de contenido separada.
- Como la Fase 4 (Mapa de Aventuras) todavía no tiene spec, "ir al mapa de aventuras" se resuelve en esta feature como entrar al punto de entrada de contenido jugable actual (la batalla del Capítulo 1 de `001-chapter1-vertical-slice`). Esta spec define el botón/transición de salida del menú, no la pantalla de destino; cuando la Fase 4 exista, el destino de "Empezar"/"Continuar" se redirige al mapa sin necesidad de rehacer esta spec.
- El menú principal no crea, modifica ni valida `ProgressSaveData`; solo lo lee para decidir qué opciones mostrar, respetando el comportamiento de fallback ya definido en `002-local-save-progress`.
- No hay cuentas, login, ni backend involucrados en el menú ni en sus ajustes, conforme a lo indicado explícitamente en el input de esta feature.
- Los ajustes de audio/idioma se confirman con una acción explícita "Aplicar/Guardar" (no en vivo mientras se arrastra un control) y solo son accesibles desde la pantalla de menú principal; no existe un acceso equivalente durante una aventura/batalla en curso en el alcance de esta feature.
- "Hardware objetivo" (SC-004) se asume como un dispositivo móvil de gama media, siguiendo la descripción del proyecto en el roadmap general (`docs/roadmap-fases.md`) como un juego de estilo gacha inspirado en Battle Cats (título móvil). Esta es una decisión de plataforma a nivel de proyecto, no específica de esta feature; si se formaliza de otra forma en la constitución más adelante, este criterio se ajusta en consecuencia.
