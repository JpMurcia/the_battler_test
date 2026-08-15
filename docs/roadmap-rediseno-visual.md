# The Battler — Roadmap de Rediseño Visual (Cyber-Modern)

**Fuente**: `docs/the-battle-cats-redesign/project/Battle Cats Modernizado.dc.html` — bundle de mockups exportado desde Claude Design, y `specs/022-cyber-modern-theme/spec.md` (primera spec de esta iniciativa, ya en curso).

**Propósito de este documento**: no es una spec en sí — es el mapa de qué specs de *reskin visual* faltan por crear con `/speckit.specify` para llevar la identidad "cyber-modern" (paneles oscuros, acentos cian/naranja/púrpura, tipografía Orbitron/Inter, `UIThemeCatalog`) a cada pantalla del juego, reutilizando el mismo catálogo de tema que crea `022-cyber-modern-theme`. Complementa a `docs/roadmap-fases.md` y `docs/plan-tecnico-manual-completo.md` (que mapean funcionalidad de gameplay, no estética).

Estado ya cubierto (no repetir):
- ✅ `022-cyber-modern-theme` — crea `UIThemeCatalog` (colores de acento, gradiente, radios, referencias de fuente) y aplica el primer reskin sobre Menú Principal + panel de Ajustes (`MainMenuUIController`, `SettingsPanelController`). **En curso** (`tasks.md`: 0/18 tareas marcadas hechas todavía).

---

## Cómo se derivó este roadmap

El mockup completo (`Battle Cats Modernizado.dc.html`) tiene una pestaña/estado por pantalla del juego. Comparando cada una contra lo que ya existe implementado en `Assets/Scripts/View/Battler/`, se dividen en dos grupos:

**Grupo A — Reskins puros**: la pantalla ya tiene un controller de UI funcionando (spec ya implementada); lo único que falta es reemplazar sus valores de estilo fijos por los de `UIThemeCatalog`, igual que hizo `022` con `MainMenuUIController`. Sin decisiones de diseño nuevas — mismo patrón, pantalla distinta.

**Grupo B — Requieren spec funcional antes que visual**: el mockup dibuja UI para algo que el juego todavía no tiene construido (ni siquiera sin estilizar). Aplicarles el tema no tiene sentido hasta que exista la funcionalidad — necesitan su propio `/speckit.specify` de gameplay primero (algunas, además, bloqueadas por la constitución). Se documentan al final de este archivo como backlog, **fuera del alcance de las fases V1-V8** de abajo.

---

## Fase V1 — Menú Principal + Ajustes ✅ En curso (`022-cyber-modern-theme`)

Ya especificada e iniciada. No repetir `/speckit.specify` — el siguiente paso ahí es retomar `specs/022-cyber-modern-theme/tasks.md` con `/speckit.implement`.

---

## Fase V2 — Base del Jugador / Hub

**Por qué va aquí**: es la pantalla a la que se llega justo después del Menú (botón "Jugar" → Hub en el mockup), y la que más tiempo ve el jugador entre batallas — máximo impacto por esfuerzo tras V1.

**Alcance**: reskin de `PlayerBaseDashboardUIController` (cabecera de nivel/XP, accesos a Batalla/Equipar/Mejorar) usando `UIThemeCatalog`. El mockup muestra además una barra inferior de iconos hacia Biblioteca, Gamatoto, Cápsula, Almacén y Tienda — de esos, solo Biblioteca (`019`) existe hoy; los otros cuatro son Grupo B. Esta fase decide cómo se ven esos accesos mientras su funcionalidad no existe (ocultarlos, o mostrarlos deshabilitados/"Próximamente") — es una decisión de UX real que le toca a `/speckit.clarify`, no algo a asumir aquí.

**Depende de**: `022` (el `UIThemeCatalog` debe existir primero), `005-player-dashboard` (controller ya implementado).

**Input para /speckit.specify**:
```
Reskin visual "Cyber-Modern" de la Base del Jugador de "The Battler": aplicar el UIThemeCatalog creado en 022-cyber-modern-theme (colores de acento cian/naranja/púrpura, gradientes, radios, tipografía Orbitron/Inter) sobre PlayerBaseDashboardUIController (005-player-dashboard), sin cambiar su contrato funcional (nivel de personaje, XP, accesos a Batalla/Equipar/Mejorar). Estilo de referencia: pantalla "Hub" (isHub) del mockup "Battle Cats Modernizado". La barra inferior de accesos del mockup incluye Gamatoto, Cápsula, Almacén y Tienda — ninguno existe todavía en el juego; definir en /speckit.clarify cómo se representan esos accesos mientras tanto (ocultos vs. deshabilitados con indicación de "Próximamente"), en vez de asumir una opción. Fuera de alcance: cualquier otra pantalla (Mapa de Etapas, Batalla, Equipar, Mejorar, Biblioteca, Perfil) y la funcionalidad de los sistemas todavía no construidos.
```

---

## Fase V3 — Mapa de Etapas

**Por qué va aquí**: siguiente parada en el flujo real (Hub → Mapa → Batalla); reutiliza el mismo patrón de nodos/tabs que ya existe en código.

**Alcance**: reskin de `AdventureMapUIController` (tabs de saga, nodos de etapa, panel de etapa seleccionada) y `TreasureMenuUIController` (modal de tesoros, ya vinculado a `014-chapter-scaling-treasure-sets`), usando `UIThemeCatalog`.

**Depende de**: `022`, `004-adventure-map-banners`, `014-chapter-scaling-treasure-sets`.

**Input para /speckit.specify**:
```
Reskin visual "Cyber-Modern" del Mapa de Etapas de "The Battler": aplicar el UIThemeCatalog de 022-cyber-modern-theme sobre AdventureMapUIController (004-adventure-map-banners) y el modal TreasureMenuUIController (014-chapter-scaling-treasure-sets), sin cambiar su contrato funcional (desbloqueo secuencial, navegación de banners, porcentaje de tesoros). Estilo de referencia: pantalla "Mapa de Etapas" (isStages) y modal "Menú de Tesoros" (showTreasureMenu) del mockup "Battle Cats Modernizado". Fuera de alcance: Hub, Batalla, y cualquier otra pantalla.
```

---

## Fase V4 — Batalla

**Por qué va aquí**: es la pantalla de mayor riesgo visual (HUD en tiempo real, más elementos animados) — conviene abordarla con el patrón de tema ya validado en V1-V3.

**Alcance**: reskin de `DeploymentUIController` (fila de despliegue, coste/cooldown por unidad), la fila de Objetos de Batalla (`BattleItemSelectionUIController`, `018-battle-items`), el botón/carga de la Gatorreta (`GatorretaController`, `013-empire-of-cats-saga`) y las barras de HP de base aliada/enemiga, usando `UIThemeCatalog`.

**Depende de**: `022`, `001-chapter1-vertical-slice`, `013-empire-of-cats-saga`, `018-battle-items`.

**Input para /speckit.specify**:
```
Reskin visual "Cyber-Modern" de la pantalla de Batalla de "The Battler": aplicar el UIThemeCatalog de 022-cyber-modern-theme sobre DeploymentUIController (fila de despliegue con coste/cooldown, 001-chapter1-vertical-slice), la selección de Objetos de Batalla (018-battle-items), el botón y anillo de carga de la Gatorreta (013-empire-of-cats-saga) y las barras de HP de base aliada/enemiga, sin cambiar ninguna regla de combate ni de resolución de daño. Estilo de referencia: pantalla "Batalla" (isBattle) del mockup "Battle Cats Modernizado", incluida la pantalla de resultado (victoria/derrota). Fuera de alcance: cualquier otra pantalla y cualquier cambio a la lógica de combate.
```

---

## Fase V5 — Equipar / Formación de Equipo

**Alcance**: reskin de `TeamFormationUIController` (slots de equipo, filtro por rareza, panel de detalle de unidad seleccionada) usando `UIThemeCatalog`.

**Depende de**: `022`, `005-player-dashboard` (contrato `team-formation.md`).

**Input para /speckit.specify**:
```
Reskin visual "Cyber-Modern" de Equipar/Formación de Equipo de "The Battler": aplicar el UIThemeCatalog de 022-cyber-modern-theme sobre TeamFormationUIController (005-player-dashboard, contracts/team-formation.md — slots de equipo, roster, panel de detalle de unidad), sin cambiar su contrato funcional (selección hasta el máximo de slots, stats mostradas). Estilo de referencia: modal "Equipar Unidades" (showEquip) del mockup "Battle Cats Modernizado". Fuera de alcance: cualquier otra pantalla.
```

---

## Fase V6 — Mejorar (pestaña Unidades)

**Por qué solo la pestaña Unidades**: el mockup también muestra una pestaña "Mejoras de Base" (Poder de Cañón, Tasa del Gato Trabajador, Investigación, etc.) que no existe como funcionalidad en el juego hoy — queda en el Grupo B, no en esta fase.

**Alcance**: reskin de `UnitUpgradeUIController`, solo la pestaña de subida de nivel de unidades (natural + "plus" por duplicados), usando `UIThemeCatalog`.

**Depende de**: `022`, `005-player-dashboard`.

**Input para /speckit.specify**:
```
Reskin visual "Cyber-Modern" de la pestaña "Unidades" del menú Mejorar de "The Battler": aplicar el UIThemeCatalog de 022-cyber-modern-theme sobre UnitUpgradeUIController (005-player-dashboard), sin cambiar su contrato funcional (subida de nivel con XP). Estilo de referencia: pestaña "Unidades" del modal "Mejorar" (showUpgrade, isUpgradeUnits) del mockup "Battle Cats Modernizado". Fuera de alcance explícito: la pestaña "Mejoras de Base" del mismo modal (Poder/Alcance de Cañón, Gato Trabajador, Investigación, Contabilidad, Estudio) — esa funcionalidad no existe en el juego y requiere su propia spec funcional antes de tener sentido visual (ver backlog Grupo B). Fuera de alcance también: cualquier otra pantalla.
```

---

## Fase V7 — Biblioteca (Cat Guide / Enemy Guide)

**Por qué solo lo ya construido**: el mockup incluye un modal "Cat Filter" (filtro por rareza/rasgo/habilidad con AND/OR, "solo formas máximas") que extiende `019-library-screens` más allá de su alcance actual (que es de solo lectura, sin filtrado) — queda en el Grupo B.

**Alcance**: reskin de `CatGuideUIController` y `EnemyGuideUIController` usando `UIThemeCatalog`.

**Depende de**: `022`, `019-library-screens`.

**Input para /speckit.specify**:
```
Reskin visual "Cyber-Modern" de la Biblioteca de "The Battler": aplicar el UIThemeCatalog de 022-cyber-modern-theme sobre CatGuideUIController y EnemyGuideUIController (019-library-screens), sin cambiar su contrato de solo lectura. Estilo de referencia: modal "Biblioteca" (showGuide, pestañas Cat Guide/Enemy Guide) del mockup "Battle Cats Modernizado", incluidas las tarjetas de perfil de unidad/enemigo (isProfileOpen, isEnemyProfileOpen). Fuera de alcance explícito: el modal "Cat Filter" (showFilter) — filtrado por rareza/rasgo/habilidad con AND/OR y "solo formas máximas" es funcionalidad nueva que extiende 019-library-screens, no cubierta hoy; requiere su propia spec funcional (ver backlog Grupo B). Fuera de alcance también: cualquier otra pantalla.
```

---

## Fase V8 — Perfil de Jugador (Rango)

**Por qué solo Rango**: el mockup muestra "Leadership" y "Meow Medals" como stats del perfil — ninguno de los dos está definido en ningún spec ni documento fuente del proyecto. Solo el Rango de Usuario (`020`) tiene una implementación real detrás.

**Alcance**: reskin de `UserRankUIController` (rango, progreso hacia siguiente recompensa, reclamo) usando `UIThemeCatalog`.

**Depende de**: `022`, `020-user-rank`.

**Input para /speckit.specify**:
```
Reskin visual "Cyber-Modern" del Perfil de Jugador de "The Battler": aplicar el UIThemeCatalog de 022-cyber-modern-theme sobre UserRankUIController (020-user-rank — rango, progreso, reclamo de recompensas por umbral), sin cambiar su contrato funcional. Estilo de referencia: modal "Perfil de Jugador" (showPlayerProfile) del mockup "Battle Cats Modernizado". Fuera de alcance explícito: las estadísticas "Leadership" y "Meow Medals" mostradas en el mockup — no existe ninguna definición ni fuente para ellas en el proyecto; no inventarlas en esta spec. Fuera de alcance también: cualquier otra pantalla.
```

---

## Orden recomendado (resumen)

1. V1 — Menú Principal + Ajustes ✅ en curso (`022-cyber-modern-theme`)
2. V2 — Base del Jugador / Hub
3. V3 — Mapa de Etapas
4. V4 — Batalla
5. V5 — Equipar / Formación de Equipo
6. V6 — Mejorar (Unidades)
7. V7 — Biblioteca
8. V8 — Perfil de Jugador (Rango)

Cada fase es independiente en su propio `specs/0XX-.../` y depende únicamente de `022` (por `UIThemeCatalog`) y de la spec de gameplay que ya implementa esa pantalla — se puede hacer el ciclo completo (`specify → clarify → checklist → plan → tasks → analyze → implement`) de una fase antes de pasar a la siguiente, igual que el resto del proyecto.

---

## Backlog — Grupo B: requieren spec funcional antes que visual

Estas piezas aparecen dibujadas en el mockup pero no tienen ninguna funcionalidad real detrás todavía. Reskinearlas ahora significaría inventar el sistema al mismo tiempo que su estética — se documentan aquí para no perderlas, pero **no forman parte de las fases V1-V8** y no se manda ninguna a `/speckit.specify` sin decisión explícita:

- **Mejoras de Base** (pestaña del modal Mejorar: Poder/Alcance/Carga de Cañón, Tasa/Cartera del Gato Trabajador, Defensa de Base, Investigación, Contabilidad, Estudio) — meta-progresión nueva, no está en `roadmap-fases.md` ni en `plan-tecnico-manual-completo.md`.
- **Cat Filter avanzado** (rareza/rasgo/habilidad, AND/OR, "solo formas máximas") — extensión de `019-library-screens`.
- **Leadership / Meow Medals** — stats de Perfil de Jugador sin definición en ningún documento fuente.
- **Tienda** (compra con Cat Food/XP) — sin spec en ningún documento.
- **Catnip Challenges** (misiones diarias + logros) — distinto de `006-mission-energy-system` (que es energía de etapas, no misiones diarias); sin spec.
- **Gamatoto** — Fase 22 de `docs/plan-tecnico-manual-completo.md`, sin spec todavía.
- **Cápsula de Gatos (Gacha)** y **Almacén de Cápsulas (Cat Storage)** — Fase 13 de `docs/roadmap-fases.md`, bloqueadas por el Principio VI de la constitución (`.specify/memory/constitution.md`) hasta que se decida destrabarlas explícitamente.
