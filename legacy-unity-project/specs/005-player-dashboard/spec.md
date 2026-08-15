# Feature Specification: Dashboard de Base del Jugador

**Feature Branch**: `005-player-dashboard`

**Created**: 2026-07-28

**Status**: Draft

**Input**: User description: "Dashboard de base del jugador en \"The Battler\": pantalla accesible desde cada banner de aventura (mismo layout, fondo distinto según la aventura), que muestra el nivel de personaje del jugador (derivado de sus unidades/\"test-robots\"), la experiencia acumulada disponible para subir de nivel, una pantalla de mejora de unidades, y una pantalla para organizar/armar el equipo antes de entrar en batalla. No incluye el sistema de gacha (spec separada) ni monedas/tickets todavía."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver el estado de la base del jugador (Priority: P1)

Un jugador que entra a la base desde un banner de aventura desbloqueado ve su nivel de personaje actual y la experiencia acumulada disponible para gastar.

**Why this priority**: Es la vista fundamental del dashboard — sin ella no hay contexto para decidir si mejorar unidades o cómo organizar el equipo.

**Independent Test**: Entrar a la base desde el banner "Imperio de los Test/Robot" y confirmar que se muestra el nivel de personaje actual y la experiencia acumulada disponible, coherentes con el progreso de las unidades del jugador.

**Acceptance Scenarios**:

1. **Given** el jugador selecciona un banner de aventura desbloqueado, **When** entra a la base, **Then** ve su nivel de personaje actual y la experiencia acumulada disponible para gastar.
2. **Given** el jugador entra a la base por primera vez sin haber mejorado ninguna unidad, **When** se muestra el dashboard, **Then** el nivel de personaje refleja el nivel base de sus unidades iniciales, sin errores ni valores indefinidos.

---

### User Story 2 - Mejorar una unidad usando experiencia acumulada (Priority: P1)

Un jugador con experiencia acumulada selecciona una de sus unidades en la pantalla de mejora y sube su nivel, lo que a su vez incrementa el nivel de personaje agregado.

**Why this priority**: Es el valor central del dashboard — le da sentido a acumular experiencia y conecta directamente con el progreso de combate del jugador.

**Independent Test**: Con experiencia acumulada disponible, entrar a la pantalla de mejora de unidades, subir el nivel de una unidad y confirmar que se descuenta la experiencia gastada y que el nivel de personaje agregado aumenta en consecuencia.

**Acceptance Scenarios**:

1. **Given** el jugador tiene experiencia acumulada suficiente, **When** mejora una unidad desde la pantalla de mejora, **Then** el nivel de esa unidad aumenta, la experiencia gastada se descuenta del total disponible, y el nivel de personaje agregado se actualiza.
2. **Given** el jugador no tiene experiencia suficiente para la siguiente mejora de una unidad, **When** intenta mejorarla, **Then** el sistema no permite la mejora y no descuenta experiencia.
3. **Given** el jugador mejora una unidad, **When** cierra y reabre el juego, **Then** el nivel de esa unidad y la experiencia restante se mantienen tal como quedaron.

---

### User Story 3 - Organizar el equipo antes de entrar en batalla (Priority: P2)

Un jugador entra a la pantalla de organización de equipo, elige qué unidades llevará a la próxima batalla, y esa selección se respeta al entrar al combate.

**Why this priority**: Da control táctico al jugador antes de la batalla; depende de que ya existan unidades mejorables (Historia 2) para que la organización tenga sentido más allá del orden por defecto.

**Independent Test**: Desde el dashboard, entrar a la pantalla de organización de equipo, elegir un subconjunto de las unidades disponibles, entrar a una batalla y confirmar que solo las unidades seleccionadas están disponibles para desplegar.

**Acceptance Scenarios**:

1. **Given** el jugador está en la pantalla de organización de equipo, **When** selecciona qué unidades llevar a la batalla, **Then** el sistema guarda esa selección como el equipo activo.
2. **Given** el jugador definió un equipo activo, **When** entra a una batalla, **Then** solo las unidades del equipo activo están disponibles para desplegar durante esa batalla.
3. **Given** el jugador intenta dejar el equipo activo vacío (ninguna unidad seleccionada), **When** intenta confirmar la organización, **Then** el sistema no permite guardar un equipo vacío.

---

### User Story 4 - Dashboard reutilizado entre aventuras (Priority: P3)

Un jugador que entra a la base desde distintos banners de aventura ve el mismo layout de dashboard, con un fondo visual distinto según la aventura activa.

**Why this priority**: Es una mejora de presentación/contexto — el dashboard ya es funcional con las Historias 1-3 sin esto; el fondo distinto solo refuerza en qué aventura está el jugador.

**Independent Test**: Entrar a la base desde dos banners de aventura distintos (uno desbloqueado con contenido real y otro, cuando exista) y confirmar que el layout y las funciones del dashboard son idénticos, cambiando solo el fondo visual.

**Acceptance Scenarios**:

1. **Given** el jugador entra a la base desde un banner de aventura, **When** el dashboard carga, **Then** muestra el fondo correspondiente a esa aventura manteniendo el mismo layout y funciones que en cualquier otro banner.

---

### Edge Cases

- ¿Qué pasa si el jugador no tiene experiencia acumulada al entrar a la pantalla de mejora? Las opciones de mejora se muestran no disponibles/deshabilitadas, sin bloquear el resto del dashboard.
- ¿Qué pasa si el jugador intenta guardar un equipo vacío en la organización de equipo? El sistema no lo permite; se mantiene el último equipo activo válido.
- ¿Qué pasa si el jugador entra a la base desde un banner bloqueado o sin contenido real (ej. "Hacia el Futuro", `004-adventure-map-banners`)? Fuera de alcance: esta feature asume que solo se entra a la base desde un banner con contenido de batalla real y desbloqueado.
- ¿Qué pasa si el progreso de mejora de unidades o el equipo activo guardado está corrupto o no es legible? El sistema lo trata como ausencia de progreso de mejora (unidades en su nivel base) y sin equipo activo definido (equipo por defecto con todas las unidades disponibles), consistente con el criterio de fallback de `002-local-save-progress`.
- ¿Qué pasa si el jugador cierra el juego mientras está en medio de una mejora o de organizar el equipo sin confirmar? Los cambios no confirmados no se guardan; al reabrir, el dashboard refleja el último estado confirmado.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE mostrar un dashboard de base accesible desde cada banner de aventura desbloqueado con contenido real (ver `004-adventure-map-banners`).
- **FR-002**: El dashboard DEBE mostrar el nivel de personaje del jugador, derivado de los niveles individuales de sus unidades.
- **FR-003**: El dashboard DEBE mostrar la experiencia acumulada disponible para gastar en mejoras de unidad.
- **FR-004**: El sistema DEBE ofrecer una pantalla de mejora de unidades donde el jugador puede gastar experiencia acumulada para subir el nivel de una unidad específica.
- **FR-005**: El sistema DEBE actualizar el nivel de personaje agregado inmediatamente después de que una unidad sube de nivel.
- **FR-006**: El sistema NO DEBE permitir mejorar una unidad si la experiencia acumulada disponible es insuficiente para el costo de esa mejora; en ese caso, tampoco DEBE descontar experiencia.
- **FR-007**: El sistema DEBE persistir localmente el nivel y la experiencia invertida de cada unidad, de forma que se mantengan entre sesiones (cerrar y reabrir el juego).
- **FR-008**: El sistema DEBE ofrecer una pantalla de organización de equipo donde el jugador elige qué unidades llevará a la próxima batalla.
- **FR-009**: El sistema DEBE aplicar la selección de equipo activo a la siguiente batalla que el jugador inicie, de forma que solo las unidades seleccionadas estén disponibles para desplegar.
- **FR-010**: El sistema NO DEBE permitir guardar un equipo activo vacío (sin ninguna unidad seleccionada).
- **FR-011**: El dashboard DEBE mantener el mismo layout y las mismas funciones (nivel, experiencia, mejora, organización de equipo) independientemente de la aventura desde la que se accede, variando únicamente el fondo visual.
- **FR-012**: El sistema NO DEBE incluir gacha, monedas ni tickets en esta feature; la única moneda de progresión es la experiencia acumulada.
- **FR-013**: El sistema DEBE tratar datos de progreso de unidad o de equipo activo corruptos o ilegibles como ausencia de ese progreso (unidades en nivel base, equipo por defecto con todas las unidades disponibles), sin bloquear la carga del dashboard.

### Key Entities *(include if feature involves data)*

- **UnitProgress**: progreso de mejora de una unidad específica — identificador de unidad (ligado al ScriptableObject de `001-chapter1-vertical-slice`), nivel actual, y experiencia invertida en ella. Persistido localmente.
- **PlayerExperiencePool**: cantidad de experiencia acumulada disponible para gastar en mejoras de unidad. Persistido localmente.
- **PlayerCharacterLevel**: valor agregado derivado de la suma de los niveles individuales de todas las `UnitProgress` del jugador; no se persiste directamente, se calcula a partir de `UnitProgress`.
- **TeamFormation**: conjunto de unidades seleccionadas por el jugador como equipo activo para la próxima batalla. Persistido localmente.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un jugador puede ver su nivel de personaje y experiencia disponible en menos de 2 segundos desde que entra a la base, en un dispositivo móvil de gama media (misma referencia usada en `003-main-menu-config` y `004-adventure-map-banners`).
- **SC-002**: Un jugador con experiencia suficiente puede mejorar una unidad en 2 acciones o menos desde el dashboard (entrar a mejora, confirmar mejora).
- **SC-003**: Un intento de mejora sin experiencia suficiente es rechazado el 100% de las veces sin descontar experiencia ni dejar el estado de la unidad inconsistente.
- **SC-004**: El equipo activo elegido por el jugador se respeta el 100% de las veces al entrar a la siguiente batalla.
- **SC-005**: El nivel y la experiencia invertida de cada unidad, así como el equipo activo, se mantienen intactos el 100% de las veces tras cerrar y reabrir el juego (cierre normal de la aplicación).

## Assumptions

- "Nivel de personaje" se calcula como la suma de los niveles individuales de las unidades del jugador (interpretación razonable de "agregado de niveles" en el input de la feature); si el diseño requiere otra fórmula (promedio, ponderada), se ajusta en `/speckit.clarify` o `/speckit.plan` sin cambiar el resto del alcance.
- La experiencia se acumula jugando batallas (patrón estándar del género); esta feature no define la tasa exacta de generación de experiencia por batalla, solo que existe un total acumulado disponible para gastar aquí.
- La experiencia es la única moneda de progresión de esta feature; no hay monedas ni tickets de gacha, conforme a la exclusión explícita del input.
- El tamaño mínimo del equipo activo es de al menos una unidad; no se define aquí un máximo distinto al total de unidades que el jugador posea (hoy, las 5 de `001-chapter1-vertical-slice`).
- Los datos de `UnitProgress`, `PlayerExperiencePool` y `TeamFormation` se persisten localmente en el dispositivo, de forma independiente a `ProgressSaveData` (002) y `MenuSettings` (003), aunque comparten el mismo mecanismo de almacenamiento local y el mismo criterio de tolerancia a corrupción/fallback.
- Esta feature no modifica la lógica de combate de `001-chapter1-vertical-slice`; solo determina qué unidades están disponibles para desplegar según el equipo activo elegido.
- El acceso al dashboard solo ocurre desde banners de aventura con contenido de batalla real y desbloqueado (`004-adventure-map-banners`); banners bloqueados o sin contenido (ej. "Hacia el Futuro") no ofrecen acceso a un dashboard en esta feature.
