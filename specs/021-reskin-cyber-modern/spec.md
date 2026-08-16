# Feature Specification: Reskin Visual Cyber-Modern + Sprites Reales de Combate

**Feature Branch**: `021-reskin-cyber-modern`

**Created**: 2026-08-15

**Status**: Draft

**Input**: User description: "Reskin visual \"Cyber-Modern\" de \"The Battler\" (battle-cats-web) en las 12 pantallas React existentes (Title, MainMenu, Settings, LevelSelect, TreasureMenu, Battle, Team, Upgrade, CatGuide, EnemyGuide, Result, Gacha) más la escena de batalla PixiJS, siguiendo fielmente docs/the-battle-cats-redesign/project/Battle Cats Modernizado.dc.html y los valores de tema ya formalizados en legacy-unity-project/specs/022-cyber-modern-theme/data-model.md (acentos cian #22d3ee / naranja #fb923c / púrpura #a855f7 / dorado #facc15, gradiente #fb923c→#ef4444, fondo casi negro #020308, tipografía Orbitron/Inter, radios 10/14/18px). Alcance: (1) fundación de tema compartida; (2) migración de emojis/ASCII a iconos, siempre junto al texto visible existente sin cambiarlo; (3) reskin de las 12 pantallas sin tocar ningún handler, llamada a store, ni el texto/accessible-name que los tests existentes verifican; (4) reskin de la escena PixiJS de batalla: fondo transparente, capa de fondo de carril, anillo de glow por equipo; (5) integración de sprites reales: asignación determinista de arte de personaje a cada gato, reemplazando los rectángulos placeholder, conservando la lógica de pose/animación existente, con espejo horizontal para el equipo enemigo y fallback al placeholder si un gato no tiene arte asignado. Fuera de alcance explícito: Gamatoto, mecánica real de Gacha/Cápsula, Almacén, Tienda, pestaña \"Mejoras de Base\", modal \"Cat Filter\" avanzado, stats \"Leadership\"/\"Meow Medals\" — ninguno tiene spec funcional en este proyecto todavía. Ningún cambio a reglas de combate, esquema de guardado, ni firmas de acciones del store."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Fundación visual y primera impresión del juego (Priority: P1)

Un jugador abre el juego y ve la pantalla de Título, el Menú Principal y el panel de Ajustes con la nueva identidad "cyber-modern" (fondo casi negro con acentos de color, paneles tipo cristal, tipografía distintiva, iconos consistentes) en vez del HTML sin estilizar actual. Los botones "Jugar"/"Continuar", el acceso a niveles/gacha/mejora/ajustes y el flujo de Ajustes (volumen, idioma, aplicar) funcionan exactamente igual que antes.

**Why this priority**: Es la puerta de entrada al juego — el primer y más visible salto de calidad — y establece el catálogo de tema del que dependen todas las demás pantallas de esta spec. Sin esto no hay ningún cambio perceptible ni base reutilizable para el resto.

**Independent Test**: Abrir el juego en el navegador y navegar Título → Menú Principal → Ajustes → volver; confirmar visualmente el nuevo estilo y que cada botón sigue llevando exactamente al mismo destino/efecto que antes del cambio.

**Acceptance Scenarios**:

1. **Given** el juego arranca sin progreso guardado, **When** se muestra la pantalla de Título, **Then** se ve con el nuevo estilo visual y el botón muestra "Jugar" (no "Continuar"), igual que el comportamiento actual.
2. **Given** existe progreso guardado, **When** se muestra la pantalla de Título, **Then** el botón muestra "Continuar" con el nuevo estilo y lleva al mismo destino que antes.
3. **Given** el jugador está en el Menú Principal, **When** pulsa "Ajustes", **Then** ve el panel de Ajustes con el nuevo estilo (sliders de audio, selector de idioma) y "Aplicar"/volver se comportan igual que hoy.

---

### User Story 2 - Navegación y consulta con la nueva identidad visual (Priority: P2)

Un jugador que navega el Mapa de Etapas, el Menú de Tesoros, la pantalla de Equipar, la de Mejorar (unidades y rango), las Guías de Gatos/Enemigos, la pantalla de Resultado y el acceso a Cápsula ve todas estas pantallas con el mismo lenguaje visual "cyber-modern" ya establecido por la Historia 1, sin que cambie ningún dato mostrado ni ninguna interacción.

**Why this priority**: Es el grueso del tiempo de juego fuera de combate — necesario para que el reskin se sienta completo — pero depende de que exista la fundación de tema de la Historia 1.

**Independent Test**: Recorrer cada una de estas ocho pantallas desde el Menú Principal, confirmar visualmente el nuevo estilo en cada una y confirmar que cada acción (jugar un nivel, seleccionar equipo, mejorar una unidad, reclamar un umbral de rango, volver) produce exactamente el mismo resultado que antes del reskin.

**Acceptance Scenarios**:

1. **Given** el jugador abre el Mapa de Etapas, **When** la pantalla se renderiza, **Then** los niveles bloqueados/disponibles/completados y cualquier banner de evento activo se distinguen visualmente con el nuevo estilo, y el botón "Jugar" de cada nivel sigue disponible solo cuando corresponde.
2. **Given** el jugador tiene gatos en propiedad, **When** abre Equipar o Mejorar, **Then** ve la lista de gatos con el nuevo estilo (incluida una distinción visual por rareza) y puede seleccionar equipo / mejorar una unidad / reclamar una recompensa de rango exactamente igual que antes.
3. **Given** el jugador abre la Guía de Gatos, la Guía de Enemigos o el Menú de Tesoros, **When** la pantalla se renderiza, **Then** ve la misma información (solo lectura) con el nuevo estilo, sin ningún dato añadido ni omitido.

---

### User Story 3 - Batalla con identidad visual e iconografía consistente (Priority: P2)

Un jugador que entra a una batalla ve el HUD (energía, salud de bases, velocidad, pausa, fila de despliegue) y el propio escenario de combate con el mismo lenguaje visual "cyber-modern", sin que cambie ninguna regla de combate, coste, cooldown ni resultado.

**Why this priority**: La batalla es donde el jugador pasa más tiempo activo, pero su HUD y escenario son técnicamente más complejos (incluyen la superficie de render en tiempo real) que el resto de pantallas — se prioriza igual que la Historia 2 pero se entrega como una unidad de trabajo separada por ese riesgo técnico.

**Independent Test**: Jugar una batalla completa (desplegar unidades, ver la energía acumularse, ganar o perder) y confirmar que el HUD y el escenario muestran el nuevo estilo mientras el resultado de la batalla es idéntico al que se obtendría antes del cambio.

**Acceptance Scenarios**:

1. **Given** una batalla en curso, **When** el jugador observa el HUD, **Then** la energía, la salud de la base propia y de la enemiga se muestran con el nuevo estilo visual (incluida una barra de progreso con color), sin cambiar los valores numéricos reales.
2. **Given** una unidad entra en cooldown tras desplegarse, **When** el jugador mira su icono en la fila de despliegue, **Then** ve una indicación visual de "no disponible" acorde al nuevo estilo, y el botón sigue deshabilitado hasta que el cooldown termina, igual que hoy.
3. **Given** la batalla termina en victoria o derrota, **When** se resuelve el resultado, **Then** el jugador es dirigido a la pantalla de Resultado con el nuevo estilo, mostrando la misma recompensa/mensaje que antes.

---

### User Story 4 - Unidades de combate con arte animado real (Priority: P3)

Un jugador que observa el campo de batalla ve a cada gato (propio o enemigo) representado con una figura de personaje animada (reposo y ataque) en vez del rectángulo de color liso actual, mientras el movimiento, la posición y el resultado del combate no cambian en absoluto.

**Why this priority**: Es la mejora más vistosa dentro de la batalla, pero es independiente del resto del reskin (que ya cubre HUD y pantallas) y conlleva el mayor riesgo técnico de esta spec (carga de arte, ausencia de arte para ciertos casos) — se entrega al final para no bloquear el resto si algo aquí requiere más iteración.

**Independent Test**: Jugar una batalla y observar el campo: cada unidad desplegada muestra una figura animada distinguible por equipo, cambia de pose de reposo a pose de ataque cuando corresponde, y al morir dibuja el mismo efecto de desvanecimiento que existe hoy — todo ello sin alterar el resultado de la simulación de combate frente a la misma partida jugada antes del cambio.

**Acceptance Scenarios**:

1. **Given** el jugador despliega una unidad, **When** esta aparece en el campo, **Then** se muestra con una figura de personaje animada (no un rectángulo liso) en su pose de reposo, con una indicación visual de a qué equipo pertenece.
2. **Given** una unidad entra en combate, **When** ataca, **Then** su animación cambia a la pose de ataque en sincronía con su cadencia de daño real, igual que hoy ocurre con el pulso del rectángulo placeholder.
3. **Given** una unidad enemiga se despliega, **When** se renderiza, **Then** su figura aparece orientada hacia el lado contrario al de una unidad propia (mira hacia la base del jugador).
4. **Given** una unidad muere, **When** desaparece del campo, **Then** se muestra el mismo efecto de eco visual (encogimiento/desvanecimiento) que existe hoy, ahora sobre la figura animada en vez del rectángulo.

---

### Edge Cases

- ¿Qué pasa si un tipo de gato no tiene arte de personaje asignado? Debe seguir mostrándose con el rectángulo placeholder actual — nunca un hueco vacío ni un error visible.
- ¿Qué pasa si un gato sí tiene arte asignado pero la carga de esa textura falla en tiempo real (archivo movido, error de red)? Debe degradar al mismo tratamiento placeholder que el caso anterior — nunca dejar la unidad sin representación visual ni romper la batalla en curso.
- ¿Qué pasa si el navegador del jugador no soporta el efecto de desenfoque de los paneles tipo cristal? El panel debe seguir siendo legible (fondo sólido/semitransparente) sin desenfoque, sin romper el layout.
- ¿Qué pasa si el jugador tiene activada la preferencia del sistema de "reducir movimiento"? Las animaciones puramente cosméticas (pulsos, resplandores) deben poder omitirse sin afectar la disponibilidad ni el resultado de ninguna interacción.
- ¿Qué pasa con una pantalla en la que el jugador no tiene ningún gato en propiedad todavía (por ejemplo, la primera vez que abre Equipar)? Debe verse con el nuevo estilo mostrando una lista vacía, sin error.
- ¿Qué pasa con las siete piezas explícitamente fuera de alcance (Gamatoto, Cápsula real, Almacén, Tienda, Mejoras de Base, Cat Filter, Leadership/Meow Medals)? No se construyen; si ya existe un punto de entrada visible hacia alguna (p. ej. el acceso a Cápsula desde el menú), debe quedar con el nuevo estilo pero seguir llevando exactamente a donde lleva hoy (una pantalla stub), sin implicar que la mecánica está completa.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE definir un catálogo de tema visual compartido (colores de acento cian/naranja/púrpura/dorado, gradiente primario, fondo, radios de esquina, tipografía de título y de cuerpo) consumido por todas las pantallas alcanzadas por esta spec, en vez de valores de estilo fijados por pantalla.
- **FR-002**: La pantalla de Título, el Menú Principal y el panel de Ajustes DEBEN mostrar el nuevo estilo visual sin alterar su comportamiento funcional actual (visibilidad condicional de "Continuar", destinos de navegación, flujo de cambios pendientes vs. aplicados en Ajustes).
- **FR-003**: El Mapa de Etapas, el Menú de Tesoros, la pantalla de Equipar, la de Mejorar (unidades y rango), la Guía de Gatos, la Guía de Enemigos, la pantalla de Resultado y el acceso a Cápsula DEBEN mostrar el nuevo estilo visual sin alterar ningún dato mostrado ni ninguna interacción existente. Única excepción: la distinción de color por rareza que exige FR-007 puede *añadir* una indicación visual en Equipar/Mejorar/Guía de Gatos que hoy no se renderiza — no es dato nuevo (la rareza ya existe en cada `Cat`), solo empieza a mostrarse.
- **FR-004**: El HUD de Batalla (energía, salud de base propia/enemiga, control de velocidad/pausa, fila de despliegue con coste y cooldown por unidad) DEBE mostrar el nuevo estilo visual sin alterar ningún valor, coste, cooldown ni regla de combate.
- **FR-005**: El escenario de combate en tiempo real DEBE adoptar la paleta y el tratamiento visual "cyber-modern" (fondo del carril, distinción de equipo) sin alterar la posición, velocidad, colisión ni resultado de ninguna unidad.
- **FR-006**: El sistema DEBE usar un set de iconos consistente para todo control de navegación/acción recurrente (volver, cerrar, energía, barrera, reintentar, etc.) en todas las pantallas alcanzadas — reemplazando cualquier glifo de emoji/texto ASCII usado hoy donde exista, y añadiendo el icono correspondiente donde hoy el control es solo texto — sin cambiar el texto visible ni el nombre accesible de ningún control existente.
- **FR-007**: Cualquier pantalla que muestre la rareza de un gato (Normal, Especial, Raro, Superraro, Megarraro, Legendario, Colaboración) DEBE distinguir cada rareza con un tratamiento de color propio y consistente entre pantallas.
- **FR-008**: Cada unidad de combate (propia o enemiga) DEBE mostrarse con una figura de personaje animada con, como mínimo, una pose de reposo y una pose de ataque — nunca una única forma estática — reforzando la identidad visual animada ya exigida al resto del proyecto.
- **FR-009**: La asignación de qué arte de personaje corresponde a cada tipo de gato DEBE ser determinista y documentada (mismo gato → mismo arte siempre), no aleatoria ni dependiente del orden de una partida.
- **FR-010**: Una unidad del equipo enemigo DEBE renderizarse orientada en sentido contrario a una unidad del equipo propio (mirando hacia la base rival correspondiente).
- **FR-011**: Un tipo de gato sin arte de personaje asignado, o cuya carga de arte falle en tiempo real, DEBE seguir mostrándose mediante el tratamiento placeholder actual — el sistema nunca debe dejar una unidad sin representación visual.
- **FR-012**: El sistema NO DEBE alterar ninguna regla de combate, fórmula de daño/energía, esquema de datos guardados, ni la firma de ninguna acción de estado existente — esta spec es exclusivamente una capa de presentación.
- **FR-013**: El sistema NO DEBE construir la funcionalidad de Gamatoto, la mecánica real de Gacha/Cápsula (tiradas, probabilidades), el Almacén de Gatos, la Tienda, la pestaña "Mejoras de Base", el modal "Cat Filter" avanzado, ni los indicadores "Leadership"/"Meow Medals" — ninguno tiene una especificación funcional propia todavía.

### Key Entities *(include if feature involves data)*

- **Catálogo de Tema Visual**: representa el conjunto compartido de valores de estilo (colores de acento, gradiente, fondo, radios, tipografías) que consumen todas las pantallas de esta spec; es un catálogo de datos de presentación, sin lógica de comportamiento.
- **Mapeo de Color por Rareza**: asocia cada una de las siete rarezas existentes con un color distintivo, reutilizado en cualquier pantalla que muestre rareza.
- **Arte de Personaje por Unidad**: asociación entre un tipo de gato y su figura animada (poses de reposo y ataque); un tipo de gato puede no tener ninguna asociación, en cuyo caso aplica el tratamiento placeholder (FR-011).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un jugador que recorre las 12 pantallas del juego más una batalla completa ve la identidad visual "cyber-modern" en el 100% de ellas, sin ninguna pérdida de funcionalidad respecto al estado anterior — verificado por comparación manual contra el mockup de referencia.
- **SC-002**: El 100% de los valores de color/tipografía/radio usados por las pantallas alcanzadas provienen del catálogo de tema compartido — cero valores de estilo fijados de forma aislada por pantalla dentro del alcance de esta spec.
- **SC-003**: Las suites de test automatizadas existentes (componentes/pantallas y motor/combate) siguen en verde tras el cambio — cero regresión funcional.
- **SC-004**: El 100% de los tipos de gato definidos hoy en el catálogo de datos del juego muestran una figura de personaje animada (reposo + ataque) en batalla, en vez del rectángulo placeholder previo.
- **SC-005**: Un jugador puede identificar a qué equipo pertenece una unidad en el campo de batalla (propia vs. enemiga) con la misma facilidad que antes del cambio — cero regresión en la distinguibilidad visual de equipo.

## Assumptions

- El resultado no necesita replicar el mockup de referencia (construido en HTML/CSS/JS) píxel a píxel — se adapta a las convenciones y componentes ya existentes de React/DOM de este proyecto; esta spec fija la interpretación web de ese lenguaje visual, no una copia exacta.
- La asignación de arte de personaje por tipo de gato es una decisión de contenido determinista tomada durante la implementación (mismo criterio ya usado por otras specs de este proyecto para fixtures de diseño provisionales) — no requiere curaduría temática por unidad, ya que el paquete de arte disponible no trae metadata de personaje/tema.
- El comportamiento responsivo (tamaños de viewport) no cambia respecto al que ya tienen las pantallas actuales — esta spec no introduce nuevos requisitos de adaptabilidad de layout.
- Las siete piezas listadas como fuera de alcance (FR-013) permanecen exactamente como están hoy en términos de alcance funcional; solo pueden recibir el mismo tratamiento visual superficial que el resto de un contenedor ya existente (p. ej. un botón de acceso), nunca nueva mecánica.
- Esta spec no introduce ningún requisito nuevo de rendimiento ni de dispositivos soportados más allá de los que el proyecto ya sostiene hoy.
