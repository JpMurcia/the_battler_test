# Feature Specification: Integración de Arte Real Importado

**Feature Branch**: `012-real-asset-integration`

**Created**: 2026-07-29

**Status**: Draft

**Input**: User description: "Integración de arte real importado en 'The Battler': reemplazar el arte placeholder procedural (rectángulos de un solo color generados por CreateSquareSprite en Chapter1ContentBuilder, Chapter2ContentBuilder, MainMenuContentBuilder, AdventureMapContentBuilder y PlayerBaseContentBuilder) por los packs de arte reales ya importados y catalogados en specs/011-imported-asset-audit/asset-catalog.md, siguiendo su tabla 'Recomendación de UI' pantalla por pantalla. Los fondos de banner de capítulo deben usar los fondos parallax de 'Free 2D Cartoon Parallax Background'. Las unidades jugables deben usar sprites reales de Characters/hero_N; las bases jugador/enemigo deben usar props reales (Obelisk/Archway), tal como se validó en el sketch 001-full-game-mockup. No incluye moneda ni gacha (Principio VI). No incluye VFX de Dragon Warrior Files/Effects todavía. Debe mantener el pipeline idempotente/regenerable existente."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Menú Principal y Mapa de Aventuras con identidad visual real (Priority: P1)

Un jugador abre el juego y ve el Menú Principal y el Mapa de Aventuras con fondo, botones y paneles ilustrados reales (no rectángulos de color), coherente con el tono cálido/nocturno validado en el sketch de referencia, en vez del placeholder procedural actual.

**Why this priority**: Es la primera impresión del juego; sin esto ninguna otra pantalla "se siente" terminada aunque tenga la lógica correcta. Es además el diferenciador visual que exige el Principio III de la constitución.

**Independent Test**: Ejecutar "The Battler/Build Main Menu Content" y "The Battler/Build Adventure Map Content" y confirmar en el Editor que ningún elemento de UI usa un `Image`/`SpriteRenderer` con sprite generado por `CreateSquareSprite`; los banners de capítulo muestran un fondo de bioma real (parallax) en vez de un panel de color sólido.

**Acceptance Scenarios**:

1. **Given** el Menú Principal se reconstruye desde cero, **When** se ejecuta el content builder, **Then** el fondo, los botones (Empezar/Base/Ajustes) y el toggle de música usan sprites de `Hyper_Casual_UI` (o el fondo parallax correspondiente), no colores planos.
2. **Given** el Mapa de Aventuras se reconstruye, **When** se ejecuta el content builder, **Then** cada banner de capítulo (`Banner_Chapter1`, `Banner_HaciaElFuturo`) tiene su campo de arte (`m_BannerArt`) asignado a un fondo real de `Free 2D Cartoon Parallax Background` (un bioma distinto por capítulo, ej. Mountain para Capítulo 1), y los estados bloqueado/desbloqueado/completado siguen usando los iconos ya recomendados (`lock.png`, indicador de completado).
3. **Given** un capítulo bloqueado, **When** se muestra en el mapa, **Then** el fondo real sigue visible pero atenuado/oscurecido (mismo patrón que el sketch), no un placeholder gris.

---

### User Story 2 - Base del Jugador y unidades con sprites reales (Priority: P1)

Un jugador entra a su Base y ve su plantel de unidades representado con sprites reales de personaje (`Characters/hero_N`, frame de `idle`), no cuadrados de color; los paneles de la base (cabecera, mejora de unidad) usan la UI ilustrada recomendada.

**Why this priority**: La Base es la pantalla donde el jugador pasa más tiempo entre batallas evaluando su progreso; sin sprites reales de unidad es imposible validar que el Principio III (idle + ataque + variante visual) se cumple en el juego real, no solo en el catálogo.

**Independent Test**: Ejecutar "The Battler/Build Player Base Content" y confirmar que cada entrada del plantel muestra un sprite de `Characters/hero_N/.../1_idle` distinto por unidad (mapeo determinista, no aleatorio) en vez del retrato placeholder de color sólido.

**Acceptance Scenarios**:

1. **Given** el plantel tiene 5 unidades del Capítulo 1, **When** se construye la pantalla de Base, **Then** cada tarjeta de unidad muestra el frame `1_idle/1.png` de un `hero_N` distinto, con el mismo `hero_N` asignado de forma estable cada vez que se regenera el contenido (idempotente).
2. **Given** los paneles de mejora de unidad y navegación inferior (Mapa/Formación/Ajustes), **When** se construyen, **Then** usan los sprites de panel/botón de `Hyper_Casual_UI` recomendados en `asset-catalog.md` para `PlayerBase`.

---

### User Story 3 - Batalla con HUD, bases y unidades reales (Priority: P2)

Durante una batalla (Capítulo 1 o 2), el jugador ve su base y la base enemiga representadas con props reales (Obelisco con bandera vs. Arco con calavera), las unidades desplegadas usan el sprite de su `hero_N` asignado (no un cuadrado de color), y el HUD de pausa/ajustes usa los iconos planos monocromáticos de `UI Elements`.

**Why this priority**: Es el corazón jugable del producto; sin embargo depende de que las Historias 1 y 2 ya hayan resuelto qué `hero_N` corresponde a qué unidad, por eso va después.

**Independent Test**: Ejecutar los content builders de Capítulo 1 y Capítulo 2 y confirmar en el Editor que los prefabs de base (`BuildBasePrefab`) usan `Obelisk`/`Archway` + overlay (`flag.png`/`skull.png`) en vez de `CreateSquareSprite`, que el prefab `UnitRuntime` usa el sprite real del héroe asignado a esa unidad, y que los controles de HUD (pausa/ajustes) referencian sprites de `Assets/Assets/UI Elements`.

**Acceptance Scenarios**:

1. **Given** una batalla recién iniciada, **When** se observa la escena, **Then** la base propia muestra el prop dorado/cálido con bandera y la base enemiga el prop frío/gris-verde con calavera, igual que en el sketch de referencia.
2. **Given** una unidad se despliega en el carril, **When** aparece en pantalla, **Then** su sprite corresponde al `hero_N` asignado a esa unidad (mismo `hero_N` que se ve en Base del Jugador/Formación para esa misma unidad), no un cuadrado de color.
3. **Given** el HUD de batalla, **When** se muestra, **Then** los iconos de pausa/ajustes son los de `UI Elements` (monocromáticos), no ilustrados, para no competir visualmente con la acción.

---

### User Story 4 - Formación de Equipo con retratos reales (Priority: P3)

Un jugador arma su formación de equipo antes de la batalla y ve, en la lista de roster, el mismo sprite de héroe que verá luego en batalla y en la Base, para poder identificar visualmente cada unidad.

**Why this priority**: Mejora la coherencia visual entre pantallas pero no bloquea la jugabilidad — puede completarse al final una vez que el mapeo unidad→`hero_N` ya existe por las Historias 2 y 3.

**Independent Test**: Abrir la pantalla de Formación de Equipo reconstruida y confirmar que cada fila de roster muestra el mismo sprite (`hero_N`, frame `idle`) que la tarjeta equivalente en Base del Jugador.

**Acceptance Scenarios**:

1. **Given** una unidad ya tiene un `hero_N` asignado en Base del Jugador, **When** se abre Formación de Equipo, **Then** esa misma unidad muestra el mismo sprite en la lista de roster.

---

### Edge Cases

- ¿Qué pasa si el content builder de una pantalla se ejecuta antes que el de otra pantalla de la que depende el mapeo unidad→`hero_N` (por ejemplo Batalla antes que Base)? El mapeo unidad→`hero_N` debe derivarse de una única fuente determinista (p. ej. el nombre/orden de la unidad en `UnitDefinition`), no del orden de ejecución de los builders, para que el resultado sea el mismo sin importar qué builder corre primero.
- ¿Qué pasa si un banner de capítulo futuro (3/4, "por definir") no tiene todavía un bioma parallax asignado porque el capítulo no existe aún? Debe seguir mostrando el estado "bloqueado" actual (candado) sin fondo de bioma real, sin romper el mapa.
- ¿Qué pasa si se reejecuta un content builder ya cableado con arte real (regeneración idempotente)? No debe duplicar sprites/assets ni dejar referencias huérfanas — mismo comportamiento idempotente que ya tienen los builders con el placeholder actual.
- ¿Qué pasa con los 30 `hero_N` disponibles frente a menos de 30 unidades jugables definidas? Basta con un subconjunto determinista (ej. `hero_1`..`hero_5` para las 5 unidades del Capítulo 1); los `hero_N` no usados quedan disponibles para capítulos futuros, no es un error.
- ¿Qué pasa si `Hyper_Casual_UI` no tiene un ícono para una necesidad puntual de una pantalla (caso ya señalado en `asset-catalog.md`, sección Consistencia)? Se documenta como excepción puntual en el plan técnico en vez de mezclar con `UI Elements` en la misma pantalla.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El Menú Principal MUST construirse usando sprites reales de `Hyper_Casual_UI` (fondo/paneles/botones) en vez de rectángulos de color generados por código.
- **FR-002**: El Mapa de Aventuras MUST construirse usando la UI ilustrada de `Hyper_Casual_UI` para sus paneles/controles, siguiendo la recomendación de `asset-catalog.md`.
- **FR-003**: Cada `ChapterBannerDefinition` existente (`Banner_Chapter1`, `Banner_HaciaElFuturo`) MUST tener su campo `m_BannerArt` asignado a un fondo real de `Free 2D Cartoon Parallax Background`, con un bioma distinto por capítulo.
- **FR-004**: La Base del Jugador MUST construirse usando la UI ilustrada de `Hyper_Casual_UI` para sus paneles/controles, siguiendo la recomendación de `asset-catalog.md`.
- **FR-005**: Cada unidad jugable representada en Base del Jugador, Formación de Equipo y Batalla MUST mostrar un sprite real de `Characters/hero_N` (frame de `idle` en pantallas estáticas), asignado de forma determinista y estable entre regeneraciones.
- **FR-006**: Los prefabs de base jugador/enemigo en Batalla MUST usar los props reales identificados en el sketch de referencia (Obelisco + bandera para la base propia, Arco + calavera para la base enemiga) en vez de un cuadrado de color.
- **FR-007**: El HUD de Batalla (pausa, ajustes, controles superpuestos a la acción) MUST usar los iconos planos monocromáticos de `Assets/Assets/UI Elements`, no la UI ilustrada de `Hyper_Casual_UI`, siguiendo la recomendación de `asset-catalog.md`.
- **FR-008**: Ningún content builder afectado por esta spec MUST introducir un sistema de moneda ni de gacha, ni asignar sprites a un slot "por invocar" — esos elementos quedan fuera de alcance por el Principio VI de la constitución, aunque el sketch de referencia los muestre a modo ilustrativo.
- **FR-009**: Los content builders modificados MUST seguir siendo idempotentes/regenerables (reejecutar el mismo `MenuItem` de "Build ... Content" no debe duplicar assets ni dejar referencias rotas), igual que su comportamiento actual con el placeholder.
- **FR-010**: Esta spec MUST NOT introducir los VFX de `Dragon Warrior Files/Effects` ni el personaje `Warrior free set` como unidad jugable (fuera de alcance).

### Key Entities *(include if feature involves data)*

- **Asignación unidad→hero_N**: mapeo determinista entre cada `UnitDefinition` existente y un sprite/carpeta `Characters/hero_N` — de qué fuente se deriva (orden de creación, nombre, u otro campo estable) se decide en el plan técnico.
- **ChapterBannerDefinition.m_BannerArt**: campo ya existente en el modelo de datos, hoy sin asignar (`fileID: 0`); esta spec lo puebla con un sprite de fondo parallax real por capítulo.
- **Prefab de base (jugador/enemigo)**: hoy generado con `BuildBasePrefab` + `CreateSquareSprite`; pasa a usar el prop real (`Obelisk`/`Archway`) + overlay (`flag.png`/`skull.png`).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Al reconstruir las 5 escenas afectadas (MainMenu, AdventureMap, PlayerBase, Chapter1_Battle, Chapter2_Battle) desde cero, cero elementos visuales usan un sprite generado por `CreateSquareSprite` (verificable buscando referencias a esa función/carpeta de arte placeholder tras la migración).
- **SC-002**: El 100% de los banners de capítulo existentes tiene un fondo real asignado (`m_BannerArt` distinto de `fileID: 0`).
- **SC-003**: El 100% de las unidades jugables mostradas en Base del Jugador, Formación de Equipo y Batalla usa el mismo sprite de `hero_N` en las tres pantallas para una misma unidad (coherencia cruzada, verificable comparando el sprite asignado en cada pantalla).
- **SC-004**: Un revisor que compare cada una de las 6 pantallas reconstruidas contra su equivalente en `.planning/sketches/001-full-game-mockup/index.html` confirma que el estilo de UI (ilustrado vs. plano monocromático) coincide pantalla por pantalla con lo mostrado en el sketch, sin mezclar ambos estilos dentro de la misma pantalla.
- **SC-005**: Los tests EditMode/PlayMode existentes seguir pasando sin modificación de sus aserciones de lógica de juego (los cambios son de presentación, no de comportamiento), y se agregan/actualizan tests donde corresponda para cubrir el nuevo mapeo unidad→sprite.

## Assumptions

- El mapeo unidad→`hero_N` se define una sola vez de forma determinista (por ejemplo por índice/orden de la unidad) y se reutiliza igual en Base, Formación y Batalla; no requiere una nueva spec de "clasificación visual" separada.
- Los packs `Free 2D Cartoon Parallax Background`, `Hyper_Casual_UI`, `Characters` y `Assets/Assets` (UI Elements) ya están completos e importados según confirmó `011-imported-asset-audit`; no se requiere importar arte adicional para esta spec.
- El sketch `.planning/sketches/001-full-game-mockup/index.html` es la referencia visual de aceptación (estilo, paleta, disposición), no un mockup a reproducir pixel-por-pixel — pequeñas diferencias de layout entre el HTML del sketch y la UI real de Unity son aceptables si el estilo/pack usado coincide.
- Los elementos de moneda/gacha visibles en el sketch se ignoran deliberadamente por esta spec (bloqueados por Principio VI); no es un defecto de esta spec no implementarlos.
- La licencia de `Warrior free set` (prohíbe redistribuir/revender el asset) no aplica a esta spec porque no se introduce ese personaje como unidad jugable.
