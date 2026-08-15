# Feature Specification: Reskin Visual Cyber-Modern — Base del Jugador / Hub

**Feature Branch**: `023-player-base-reskin`

**Created**: 2026-08-07

**Status**: Draft

**Input**: User description: "Reskin visual \"Cyber-Modern\" de la Base del Jugador de \"The Battler\": aplicar el UIThemeCatalog creado en 022-cyber-modern-theme (colores de acento cian/naranja/púrpura, gradientes, radios, tipografía Orbitron/Inter) sobre PlayerBaseDashboardUIController (005-player-dashboard), sin cambiar su contrato funcional (nivel de personaje, XP, accesos a Batalla/Equipar/Mejorar). Estilo de referencia: pantalla \"Hub\" (isHub) del mockup \"Battle Cats Modernizado\". La barra inferior de accesos del mockup incluye Gamatoto, Cápsula, Almacén y Tienda — ninguno existe todavía en el juego; definir en /speckit.clarify cómo se representan esos accesos mientras tanto (ocultos vs. deshabilitados con indicación de \"Próximamente\"), en vez de asumir una opción. Fuera de alcance: cualquier otra pantalla (Mapa de Etapas, Batalla, Equipar, Mejorar, Biblioteca, Perfil) y la funcionalidad de los sistemas todavía no construidos."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver la Base del Jugador con la nueva identidad visual (Priority: P1)

Un jugador que ya pasó el Menú Principal rediseñado (`022-cyber-modern-theme`) entra a su Base (Hub) y ve la misma estética "cyber-modern" (paneles oscuros con acentos de color, tipografía distintiva) en la cabecera de nivel/experiencia y en el fondo de la escena, en vez del estilo sin tema actual.

**Why this priority**: Es la pantalla que más tiempo ve el jugador entre batallas — sin este cambio, el reskin de `022` queda aislado a una sola pantalla de tránsito.

**Independent Test**: Abrir `PlayerBase.unity` en el Editor o build, y confirmar visualmente que la cabecera (nivel de personaje, experiencia disponible) y el fondo usan el nuevo tema, sin ninguna regresión en los valores mostrados ni en su actualización cuando cambia el progreso (`PlayerBaseFlowController.Leveling.ProgressChanged`).

**Acceptance Scenarios**:

1. **Given** el jugador tiene un nivel de personaje y experiencia disponible ya calculados, **When** se muestra la Base del Jugador, **Then** la cabecera se ve con el nuevo estilo visual y sigue mostrando exactamente los mismos valores que antes del reskin.
2. **Given** el jugador sube de nivel o gasta experiencia mientras la Base está abierta, **When** `ProgressChanged` se dispara, **Then** la cabecera themeada se actualiza igual que lo hacía antes del reskin, sin retraso ni parpadeo adicional.

---

### User Story 2 - Acceder a las pantallas ya construidas con el mismo tema (Priority: P1)

El jugador ve, con la nueva estética, los accesos a las pantallas que ya existen y funcionan hoy desde la Base: Mejorar (`005`), Equipar/Formación de Equipo (`005`), Objetos de Batalla (`018`), Cat Guide y Enemy Guide (`019`), Menú de Tesoros (`014`) y Rango de Usuario (`020`). Tocar cada uno abre exactamente el mismo panel que abre hoy.

**Why this priority**: Es la función central del Hub (es un menú de navegación) — un reskin que no cubra sus botones de acceso dejaría la pantalla más visible del juego a medio rediseñar.

**Independent Test**: Con cada panel opcional asignado en la escena, tocar cada botón de acceso y confirmar que abre el panel correspondiente (mismo método `OnPanelOpened()`/`Refresh()` que ya invoca `PlayerBaseDashboardUIController` hoy), con el nuevo estilo aplicado al botón mismo.

**Acceptance Scenarios**:

1. **Given** todos los paneles opcionales están asignados en la escena, **When** el jugador toca el botón "Mejorar", **Then** se abre el mismo panel de mejora de unidades que abre hoy, y el botón se ve con el nuevo tema.
2. **Given** un panel opcional (p. ej. Rango de Usuario) no está asignado en una escena determinada, **When** se muestra la Base del Jugador, **Then** el botón correspondiente no aparece — mismo comportamiento nulo-seguro que existe hoy (`m_UserRankNavigationButton == null`), sin romper el layout del resto de accesos themeados.
3. **Given** el jugador toca cualquiera de los accesos ya construidos, **When** se abre su panel, **Then** el contenido interno de ese panel (Mejorar, Equipo, Objetos de Batalla, Biblioteca, Tesoros, Rango) conserva su estilo actual sin cambios — esos paneles reciben su propio reskin en specs futuras (`docs/roadmap-rediseno-visual.md`, fases V5-V8), no en esta.

---

### User Story 3 - Ver claramente qué accesos todavía no están disponibles (Priority: P3)

El mockup de referencia muestra además accesos a Gamatoto, Cápsula de Gatos, Almacén y Tienda — ninguno de los cuatro existe como sistema jugable en el proyecto hoy. El jugador que ve la Base del Jugador rediseñada no debe encontrarse con un botón que no hace nada o que rompe la escena al tocarlo.

**Why this priority**: Es una cuestión de claridad de UI, no del núcleo funcional del Hub — el Hub es perfectamente usable sin resolver esto, pero dejarlo sin definir arriesga confundir al jugador con accesos "muertos".

**Independent Test**: Abrir la Base del Jugador, tocar cada uno de los cuatro accesos (Gamatoto, Cápsula, Almacén, Tienda) y confirmar que cada uno abre el mismo panel placeholder genérico "Próximamente" (identificando de qué sistema se trata), sin navegar a ninguna pantalla real ni producir una excepción.

**Acceptance Scenarios**:

1. **Given** Gamatoto/Cápsula/Almacén/Tienda no existen todavía como sistemas del juego, **When** se muestra la Base del Jugador, **Then** sus cuatro accesos se ven visibles y tocables, con el mismo estilo themeado que el resto de accesos del Hub.
2. **Given** el jugador toca cualquiera de los cuatro accesos, **When** se abre el panel resultante, **Then** es el mismo panel placeholder genérico "Próximamente" (un único componente reutilizado, no cuatro paneles distintos), mostrando el nombre del sistema correspondiente, y se cierra volviendo al Hub sin alterar ningún otro estado.

---

### Edge Cases

- ¿Qué pasa si un panel opcional (Mejorar, Equipo, Objetos de Batalla, Cat Guide, Enemy Guide, Menú de Tesoros, Rango de Usuario) no está asignado en una escena concreta? El botón correspondiente no debe aparecer ni dejar un hueco roto en el layout — mismo criterio nulo-seguro que ya sigue `PlayerBaseDashboardUIController` para cada campo `[SerializeField]` opcional.
- ¿Qué pasa si el jugador toca un acceso a un sistema no construido (Gamatoto/Cápsula/Almacén/Tienda)? Abre el panel placeholder genérico "Próximamente" (FR-007) — no debe navegar a ninguna pantalla real, ni lanzar una excepción no controlada, ni dejar la Base en un estado inconsistente.
- ¿Qué pasa si el jugador toca varios accesos "Próximamente" seguidos (p. ej. Gamatoto y luego Tienda)? Reutiliza la misma instancia de panel placeholder, actualizando solo el nombre del sistema mostrado — no se instancian paneles duplicados.
- ¿Qué pasa con las animaciones cosméticas del Hub (si las hubiera, p. ej. resplandor de la cabecera) en dispositivos de gama baja? No deben bloquear la interacción — mismo criterio ya establecido en `022-cyber-modern-theme` FR-006.
- ¿Qué pasa con el fondo de escena por banner/aventura (`research.md §7` de `005-player-dashboard`, hoy fijo por escena, sin abstracción de "proveedor de fondo por banner")? Esta spec no cambia esa limitación — solo restylea el contenedor visual que envuelve al fondo existente.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE tomar todos los valores de color/gradiente/radio/fuente de la cabecera y accesos del Hub desde el `UIThemeCatalog` ya creado por `022-cyber-modern-theme` — cero valores de estilo nuevos hardcodeados por componente.
- **FR-002**: La cabecera de la Base del Jugador (nivel de personaje, experiencia disponible) DEBE mostrar el nuevo estilo visual sin alterar los valores mostrados ni el mecanismo de actualización actual (`PlayerBaseFlowController.Leveling.ProgressChanged`).
- **FR-003**: Cada botón de acceso a un panel ya construido (Mejorar, Equipo, Objetos de Batalla, Cat Guide, Enemy Guide, Menú de Tesoros, Rango de Usuario) DEBE mostrarse con el nuevo estilo visual y seguir abriendo exactamente el mismo panel que abre hoy, sin alterar los métodos `OpenXPanel()`/`OnPanelOpened()`/`Refresh()` ya existentes.
- **FR-004**: El sistema NO DEBE modificar el contenido ni el estilo interno de los paneles que se abren desde el Hub (Mejorar, Equipo, Objetos de Batalla, Cat Guide, Enemy Guide, Menú de Tesoros, Rango de Usuario) — esos paneles reciben su propio reskin en specs futuras según `docs/roadmap-rediseno-visual.md`.
- **FR-005**: El sistema DEBE conservar el comportamiento nulo-seguro ya existente para cada campo opcional de `PlayerBaseDashboardUIController` — un panel/botón no asignado en una escena no debe aparecer ni romper el resto del layout themeado.
- **FR-006**: El fondo de escena de la Base (`m_BackgroundImage`/`m_Background`) DEBE seguir asignándose igual que hoy — esta spec solo restylea el contenedor/overlay visual alrededor de él, no introduce selección de fondo por banner.
- **FR-007**: Los accesos a sistemas todavía no construidos en el juego (Gamatoto, Cápsula de Gatos, Almacén, Tienda — presentes en el mockup de referencia pero sin funcionalidad real) DEBEN mostrarse visibles y tocables, themeados igual que el resto de accesos del Hub, y DEBEN abrir un único panel placeholder genérico "Próximamente" compartido por los cuatro (no cuatro paneles distintos), que identifica el nombre del sistema correspondiente y no navega a ninguna pantalla real.
- **FR-008**: El sistema NO DEBE alterar ninguna lógica de `PlayerBaseFlowController` (cálculo de nivel de personaje, experiencia disponible, o cualquier otro dato) — el alcance de esta spec es estrictamente visual.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un jugador que abre la Base del Jugador ve una pantalla visualmente distinta a la actual (paneles oscuros con acentos de color, tipografía distintiva), consistente con el Menú Principal ya rediseñado en `022` — verificado por comparación manual contra el mockup de referencia vía `quickstart.md`, mismo criterio ya usado en specs 013-022.
- **SC-002**: El 100% de los valores de color/fuente/radio de la cabecera y los botones de acceso del Hub provienen del `UIThemeCatalog` compartido — cero valores de estilo fijados por componente dentro de ese alcance.
- **SC-003**: Las suites de test existentes (EditMode + PlayMode, specs 001-022) siguen en verde tras el cambio — cero regresión funcional.
- **SC-004**: Los 7 accesos ya construidos (Mejorar, Equipo, Objetos de Batalla, Cat Guide, Enemy Guide, Menú de Tesoros, Rango de Usuario) abren su panel correcto 1:1 después del reskin, verificado con los mismos tests de integración que ya cubren esa navegación desde `005`/`018`/`019`/`020`.
- **SC-005**: Los 4 accesos a sistemas todavía no construidos (Gamatoto, Cápsula, Almacén, Tienda) abren el panel placeholder "Próximamente" sin excepción y sin navegar a ninguna pantalla real, verificado por un único test de integración parametrizado sobre los cuatro.

## Assumptions

- El resultado final no necesita replicar literalmente el mockup "Battle Cats Modernizado" píxel a píxel — se adapta a uGUI + TextMeshPro, igual que ya estableció `022-cyber-modern-theme`.
- Esta spec reutiliza el `UIThemeCatalog` de `022` tal cual existe — no agrega campos nuevos al catálogo salvo que el panel placeholder "Próximamente" (FR-007) necesite un token visual que hoy no existe, en cuyo caso se agrega ahí, no se hardcodea.
- El panel "Próximamente" es un único componente genérico reutilizado por los 4 accesos (Gamatoto, Cápsula, Almacén, Tienda) — solo muestra el nombre del sistema, sin contenido específico por sistema. Ninguno de los cuatro tiene todavía una spec funcional propia (quedan documentados como backlog Grupo B en `docs/roadmap-rediseno-visual.md`), así que este panel no anticipa ni implementa nada de su futura mecánica.
- El reskin no requiere nuevos assets de arte de personajes/unidades — solo "chrome" de UI (cabecera, paneles, botones), igual que `022`.
- Las animaciones cosméticas (si se agregan) usan la misma dependencia de tweening ya introducida por `022` (DOTween), sin mecanismos nuevos por pantalla.
