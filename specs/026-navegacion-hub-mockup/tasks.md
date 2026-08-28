---
description: "Task list template for feature implementation"
---

# Tasks: Navegación Hub + Modales (acercamiento al Mockup)

**Input**: Design documents from `specs/026-navegacion-hub-mockup/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/panel-shell.md](contracts/panel-shell.md), [quickstart.md](quickstart.md)

**Tests**: Incluidos — el proyecto ya tiene cobertura Vitest para cada pantalla y para el flujo de navegación completo (`tests/unit/AppFlow.test.tsx`); esta feature reutiliza y extiende esa cobertura en vez de crear un arnés nuevo, y sigue el mismo criterio de no-regresión que specs/021.

**Organization**: Tareas agrupadas por historia de usuario (US1-US5 de [spec.md](spec.md)) para que cada una sea implementable y verificable de forma independiente.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivo distinto, sin dependencia de una tarea incompleta)
- **[Story]**: Historia de usuario a la que pertenece (US1-US5)
- Cada tarea incluye la ruta de archivo exacta

## Path Conventions

Proyecto único (SPA React + Pixi.js): `src/`, `tests/unit/` en la raíz del repo — ver [plan.md § Project Structure](plan.md#project-structure).

## Regla transversal (no-regresión, FR-006/FR-015)

**Ninguna tarea de esta lista edita el cuerpo de** `TeamScreen.tsx`, `UpgradeScreen.tsx`, `GachaScreen.tsx`, `CatGuideScreen.tsx`, `EnemyGuideScreen.tsx`, `SettingsScreen.tsx` **ni** `TreasureMenuScreen.tsx` (research.md Decisión 2), con la única excepción aditiva de T028 (prop opcional con default retrocompatible). Tampoco se modifica `src/types/screen.ts` en lo que ya existe: el tipo `Screen` conserva sus 12 valores actuales sin cambios — `PanelId` se agrega como tipo **nuevo e independiente**, no derivado de `Screen` (evita romper la firma `onNavigate: (screen: Screen) => void` que ya usan las siete pantallas de arriba).

---

## Phase 1: Setup

**Purpose**: Confirmar que no hace falta infraestructura nueva antes de tocar código de la feature

- [X] T001 Confirmar que no se requiere ninguna dependencia npm nueva (plan.md § Technical Context — sin router, sin librería de modal) y que la rama activa es `026-navegacion-hub-mockup`; correr `npx tsc -b && npm test` como línea base en verde antes de empezar

**Checkpoint**: Sin bloqueos de tooling — se puede empezar Foundational.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: El tipo `PanelId`, el contenedor `PanelOverlay` y la persistencia del Buzón de Noticias son consumidos por las cinco historias — ninguna puede abrir un panel, apilar uno sobre otro, ni mostrar/marcar novedades sin esto.

**⚠️ CRITICAL**: Ninguna historia de usuario puede darse por verificable hasta que esta fase compile y sus tests pasen

- [X] T002 [P] En `src/types/screen.ts`, agregar (sin tocar el `type Screen` existente) `export type PanelId = 'Equip' | 'Upgrade' | 'Gacha' | 'Library' | 'Settings' | 'TreasureMenu' | 'PlayerProfile' | 'News'` (data-model.md § Estado de UI)
- [X] T003 [P] En `src/theme.css`, agregar clases para el contenedor de overlay reutilizable: `.panel-overlay` (backdrop `position:absolute;inset:0`, oscurecido + `backdrop-filter:blur`, mismo lenguaje visual que `.battle-overlay` línea 399 y `.glass-panel` línea 111), `.panel-overlay__sheet` (el panel en sí, reutilizando el radio/sombra de `.glass-panel`), `.panel-overlay__close` (botón de cierre) y `.hub-dock`/`.hub-dock__button` (dock inferior de iconos, reutilizando `.hud-bar`/`.hud-chip` como base) — sin modificar ninguna clase ya existente
- [X] T004 Crear `src/screens/shared/PanelOverlay.tsx` implementando el contrato de [contracts/panel-shell.md § PanelOverlay](contracts/panel-shell.md): props `{ labelledBy: string; onClose: () => void; children: React.ReactNode }`; al montar mueve el foco al panel (`ref` con `tabIndex={-1}` + `.focus()`), atrapa Tab/Shift+Tab dentro de los elementos focuseables del panel, y al desmontar devuelve el foco al `document.activeElement` capturado antes de abrir (guardado por el caller, ver T014/T024) — usa las clases de T003, sin lógica de negocio propia — depende de T002, T003
- [X] T005 [P] Crear `tests/unit/shared/PanelOverlay.test.tsx`: al montar, el foco queda dentro del panel; `Tab` repetido nunca saca el foco del panel (ciclo cerrado); al pulsar el control de cierre se invoca `onClose`; al desmontar (simulando `onClose` seguido de unmount), el foco vuelve al elemento activo antes de abrir — depende de T004
- [X] T006 En `src/db/index.ts`, agregar `export interface NewsReadRow { id: 1; readIds: string[] }`, la tabla `newsRead!: Table<NewsReadRow, number>`, `this.version(11).stores({ newsRead: 'id' })` (mismo patrón que `userRank`/`gachaStorage`, data-model.md § NewsReadRow), y sembrar `{ id: 1, readIds: [] }` en `ensureDefaultProfile()` si no existe la fila
- [X] T007 [P] Extender `tests/unit/db.test.ts`: `ensureDefaultProfile()` crea la fila singleton `newsRead` con `readIds: []` si no existía; no la sobreescribe si ya existía (idempotencia, mismo patrón que las demás filas singleton) — depende de T006
- [X] T008 En `src/state/useMetaStore.ts`: agregar `readNewsIds: string[]` al estado, hidratarlo desde `db.newsRead.get(1)` en `hydrate()` (mismo patrón que el resto de filas singleton), y `markNewsRead: (id: string) => Promise<void>` que agrega `id` a `readIds` si no está presente, persiste vía `db.newsRead.put(...)` y actualiza el estado en memoria (mismo patrón de escritura inmediata que el resto del store, Constitución V) — depende de T006
- [X] T009 [P] Extender `tests/unit/useMetaStore.test.ts`: `hydrate()` puebla `readNewsIds` desde Dexie; `markNewsRead('x')` agrega `'x'` a `readNewsIds` en memoria y en `db.newsRead.get(1)`; llamarlo dos veces con el mismo id no duplica la entrada — depende de T008
- [X] T010 [P] Crear `src/data/news.ts`: `export interface NewsEntry { id: string; title: string; date: string; body: string }` y `export const NEWS_ENTRIES: NewsEntry[]` con 4 entradas basadas en hitos ya shippeados del proyecto (Cat Combos, Sistema de Gacha, Mapa de Etapas Visual, Reskin Cyber-Modern — research.md Decisión 6), ids estables tipo `'news-cat-combos'`, fechas ISO ordenables
- [X] T011 [P] Crear `tests/unit/data/news.test.ts`: `NEWS_ENTRIES` no está vacío, cada entrada tiene `id`/`title`/`date`/`body` no vacíos, todos los `id` son únicos, y ordenar por `date` descendente reproduce un orden estable (sin empates ambiguos) — depende de T010
- [X] T012 Ejecutar `npx tsc -b` y `npm test` — confirmar verde antes de tocar código de cualquier historia de usuario

**Checkpoint**: `PanelId`, `PanelOverlay`, persistencia de `newsRead` y catálogo de noticias listos — las 5 historias pueden implementarse en su orden de prioridad (US2 depende de US1 por compartir `HubScreen.tsx`, ver Dependencies).

---

## Phase 3: User Story 1 - Un Hub persistente en vez de un menú de botones (Priority: P1) 🎯 MVP

**Goal**: `MainMenuScreen` se reemplaza por `HubScreen`: HUD superior (rango/energía/moneda), dock inferior visible (Biblioteca/Cápsula/Almacén) y accesos destacados (¡Batalla!/Equipar/Mejorar); "¡Batalla!" lleva al Mapa de Etapas igual que "Niveles" hoy, y "Ajustes" (preservando la capacidad que ya tiene `MainMenuScreen` hoy) abre como panel superpuesto — primera prueba end-to-end del mecanismo de panel de Foundational.

**Independent Test**: Abrir el juego, llegar al Hub, confirmar rango/energía/moneda y los 5 accesos visibles; pulsar "¡Batalla!" y llegar al Mapa de Etapas; pulsar "Ajustes", confirmar que el Hub sigue visible detrás, cerrar y confirmar que se vuelve al Hub intacto.

### Tests for User Story 1

> Escribir primero — deben fallar porque `HubScreen` todavía no existe

- [X] T013 [P] [US1] Crear `tests/unit/HubScreen.test.tsx`: renderiza rango (`characterLevelOf(ownedCats)`), "Energía de misión: X/Y" y "Moneda: N" simultáneamente en el mismo render; el dock muestra controles reconocibles para Biblioteca/Cápsula de Gatos/Almacén (por `aria-label` o texto accesible); el botón "¡Batalla!" invoca `onNavigate('LevelSelect')`; el botón "Ajustes" abre un `PanelOverlay` con el contenido de `SettingsScreen` mientras el HUD del Hub permanece en el documento; cerrar ese panel lo quita del documento sin invocar `onNavigate` (FR-005) — depende de T004, T002

### Implementation for User Story 1

- [X] T014 [US1] Crear `src/screens/HubScreen.tsx`: HUD superior con rango/energía (`useMetaStore.missionEnergy` — mismo dato que `LevelSelectScreen`)/moneda (`currency`); accesos destacados "¡Batalla!" (`onClick={() => onNavigate('LevelSelect')}`), "Equipar" y "Mejorar" (visibles, `onClick={() => open('Equip'|'Upgrade')}` usando el `PanelStackController` de abajo — su contenido real se completa en US2, T024); dock inferior con controles para Biblioteca/Cápsula de Gatos/Almacén (visibles, `onClick={() => open('Library'|'Gacha')}` — contenido real en US2/US4); un control adicional "Ajustes" fuera del dock (paridad con el botón "Configuración" que hoy tiene `MainMenuScreen`) con `onClick={() => open('Settings')}`; estado local `openPanels: PanelId[]` (`useState<PanelId[]>([])`) con `open(id)` (push) y `close()` (pop); renderiza el `PanelId` superior del stack dentro de un `PanelOverlay` — por ahora el `switch` interno solo tiene caso real para `'Settings'` (monta `<SettingsScreen onNavigate={() => close()} />`, ignorando el argumento recibido igual que contracts/panel-shell.md); los demás casos se agregan en US2/US3/US4 — depende de T013, T004, T002
- [X] T015 [US1] En `src/App.tsx`: reemplazar el `case 'MainMenu': return <MainMenuScreen onNavigate={setScreen} />` por `case 'MainMenu': return <HubScreen onNavigate={setScreen} />`; actualizar el import — depende de T014
- [X] T016 [US1] Eliminar `src/screens/MainMenuScreen.tsx` y `tests/unit/MainMenuScreen.test.tsx` (reemplazados por `HubScreen`/`HubScreen.test.tsx`; ningún otro archivo los importa tras T015) — depende de T015
- [X] T017 [US1] En `tests/unit/AppFlow.test.tsx`, ajustar únicamente el paso 1 (Título → Hub): reemplazar la aserción `screen.findByRole('heading', { name: 'Menú Principal' })` por el nuevo heading de `HubScreen` y la aserción de moneda por su equivalente en el nuevo layout; **no tocar todavía** los pasos 2-3 (Mejoras/Equipo), que siguen asumiendo navegación de página completa hasta US2 (T035) — depende de T014
- [X] T018 [US1] Ejecutar `npx vitest run tests/unit/HubScreen.test.tsx tests/unit/shared/PanelOverlay.test.tsx` y `npx tsc -b` — confirmar verde; `tests/unit/AppFlow.test.tsx` puede seguir en rojo desde el paso 2 en adelante hasta T035 (US2), documentar ese estado esperado en el mensaje de commit

**Checkpoint**: US1 demostrable — el Hub reemplaza al Menú Principal con el mismo HUD y accesos, "¡Batalla!" y "Ajustes" (como panel) funcionan de punta a punta.

---

## Phase 4: User Story 2 - Equipar, Mejorar, Cápsula, Guías y Menú de Tesoros como paneles (Priority: P1)

**Goal**: Los cinco paneles restantes (Equipar, Mejorar, Cápsula de Gatos, Biblioteca con sus dos guías, Menú de Tesoros) se abren y cierran sobre el Hub sin recargar, incluido el caso de un panel que abre a otro encima (Mejorar → Equipar/Biblioteca/Tesoros, FR-013), sin cambiar ninguna acción interna de esas siete pantallas.

**Independent Test**: Desde el Hub, abrir cada panel restante uno por uno, realizar una acción representativa (mejorar una unidad, tirar cápsula, ver una guía, ver progreso de tesoros) y cerrarlo; confirmar que `AppFlow.test.tsx` reproduce el flujo completo Hub→Mejoras→Equipo→Selección de Nivel→Batalla→Resultado sin fallos.

### Implementation for User Story 2

- [X] T019 [P] [US2] Crear `src/screens/panels/LibraryPanel.tsx` (research.md Decisión 3): tabs "Cat Guide"/"Enemy Guide" (mismo patrón de tabs ya usado en `GachaScreen.tsx` líneas 199-206) que montan `<CatGuideScreen onNavigate={...} />` / `<EnemyGuideScreen onNavigate={...} />` sin modificarlas, cada una con el `onNavigate` adaptado de T020 — sin lógica propia de datos
- [X] T020 [P] [US2] Crear `tests/unit/panels/LibraryPanel.test.tsx`: ambas tabs alternan el contenido montado; el contenido de cada tab coincide con lo ya cubierto por `CatGuideScreen.test.tsx`/`EnemyGuideScreen.test.tsx` (smoke, sin duplicar esa cobertura) — depende de T019
- [X] T021 [US2] Ampliar `src/screens/HubScreen.tsx` (mismo archivo que T014, tarea secuencial): completar el `switch` del panel superior con los casos `'Equip'` (monta `<TeamScreen onNavigate={() => close()} />`), `'Gacha'` (monta `<GachaScreen onNavigate={() => close()} />`) y `'Library'` (monta `<LibraryPanel onNavigate={() => close()} />`); conectar los `onClick` de "Equipar"/dock "Cápsula de Gatos"/dock "Biblioteca" ya declarados en T014 a `open('Equip'|'Gacha'|'Library')` — depende de T014, T019
- [X] T022 [US2] Ampliar `src/screens/HubScreen.tsx` (mismo archivo, secuencial a T021): agregar el caso `'Upgrade'` montando `<UpgradeScreen onNavigate={(dest) => { if (dest === 'MainMenu') close(); else open(dest as PanelId) }} />` — este es el único adaptador que **no** ignora siempre el argumento recibido, porque `UpgradeScreen` es el único punto de entrada existente a Equipar/Biblioteca/Tesoros *desde dentro de otro panel* (contracts/panel-shell.md tabla, FR-013); mapear sus destinos `'Team'→'Equip'`, `'CatGuide'|'EnemyGuide'→'Library'`, `'TreasureMenu'→'TreasureMenu'` — depende de T021
- [X] T023 [US2] Ampliar `src/screens/HubScreen.tsx` (mismo archivo, secuencial a T022): agregar el caso `'TreasureMenu'` montando `<TreasureMenuScreen onNavigate={() => close()} />` — depende de T022
- [X] T024 [P] [US2] Agregar una prop opcional `initialTab?: 'roll' | 'storage'` a `src/screens/GachaScreen.tsx` con default `'roll'` (mismo valor que el `useState` actual, línea 177) para que el dock "Almacén" pueda abrir Cápsula de Gatos directamente en su pestaña "Almacén" (spec.md Assumptions); único cambio permitido a esta pantalla por la Regla transversal — cambio aditivo, no altera ningún test existente de `GachaScreen.test.tsx`
- [X] T025 [P] [US2] Extender `tests/unit/GachaScreen.test.tsx` con un caso nuevo (no modifica los existentes): `<GachaScreen initialTab="storage" onNavigate={vi.fn()} />` arranca mostrando la pestaña Almacén — depende de T024
- [X] T026 [US2] En `src/screens/HubScreen.tsx` (mismo archivo, secuencial): conectar el dock "Almacén" (declarado visible en T014) a `open('Gacha')`, y en el caso `'Gacha'` del switch (T021) pasar `initialTab={openReason === 'storage' ? 'storage' : 'roll'}` — trackear el "motivo de apertura" junto al id en el stack (`{ id: PanelId; initialTab?: 'storage' }[]` en vez de `PanelId[]`, o un `Map` paralelo — decisión de implementación libre siempre que "Cápsula de Gatos" y "Almacén" abran el mismo panel en pestañas distintas) — depende de T024, T021
- [X] T027 [US2] En `src/App.tsx`: eliminar los imports y los `case` ya no alcanzables para `'Gacha' | 'Upgrade' | 'Team' | 'Settings' | 'CatGuide' | 'EnemyGuide' | 'TreasureMenu'` (ahora se montan exclusivamente dentro de `HubScreen`, nunca como `screen` de nivel superior); el `type Screen` de `src/types/screen.ts` **no se modifica** (Regla transversal) — depende de T021, T022, T023
- [X] T028 [US2] Reescribir en `tests/unit/AppFlow.test.tsx` los pasos 2-3 (Mejoras/Equipo) del test `'Título → Menú → Mejoras → Equipo → Selección de Nivel → Batalla → Victoria → Resultado → Selección de Nivel → Menú'`: en vez de esperar un cambio de `heading` de página completa, abrir el panel Mejorar desde el Hub (`fireEvent.click(screen.getByRole('button', { name: 'Mejorar' }))`), confirmar que el HUD del Hub sigue en el documento (`within`/`queryByRole` para no confundir headings), mejorar la unidad dentro del panel, abrir Equipar desde dentro de Mejorar (push anidado, FR-013), confirmar equipo, cerrar Equipar (vuelve a mostrar Mejorar) y cerrar Mejorar (vuelve al Hub) — mismas aserciones de efecto (`ownedCats['seed-cat-basic'].level`, `activeTeamCatIds`) sin cambios — depende de T017, T022
- [X] T029 [US2] Ejecutar `npx vitest run tests/unit/HubScreen.test.tsx tests/unit/AppFlow.test.tsx tests/unit/panels/LibraryPanel.test.tsx tests/unit/GachaScreen.test.tsx` y `npx tsc -b` — confirmar verde; correr también `npx vitest run tests/unit/TeamScreen.test.tsx tests/unit/UpgradeScreen.test.tsx tests/unit/GachaScreen.test.tsx tests/unit/CatGuideScreen.test.tsx tests/unit/EnemyGuideScreen.test.tsx tests/unit/SettingsScreen.test.tsx tests/unit/TreasureMenuScreen.test.tsx` sin cambios de resultado (FR-015) — depende de T026, T028

**Checkpoint**: US1 + US2 completas — el flujo de navegación principal del juego (Hub, Equipar, Mejorar, Cápsula, Biblioteca, Ajustes, Menú de Tesoros) ya funciona como paneles superpuestos, con paridad de comportamiento verificada por `AppFlow.test.tsx`.

---

## Phase 5: User Story 3 - Perfil de Jugador (Priority: P2)

**Goal**: Nuevo panel "Perfil de Jugador" con rango, colección (X/Y) y acceso a Ajustes que, al cerrarse, vuelve al Perfil (no al Hub) — FR-007, FR-013.

**Independent Test**: Desde el Hub, abrir el Perfil de Jugador y confirmar que rango/colección coinciden con los ya visibles en el panel de Mejorar; abrir Ajustes desde ahí y confirmar que cerrarlo vuelve al Perfil.

### Tests for User Story 3

- [X] T030 [P] [US3] Crear `tests/unit/screens/PlayerProfilePanel.test.tsx`: muestra "Rango {N}" igual que `characterLevelOf(ownedCats)`; muestra "{X}/{Y} gatos poseídos" con `Y = CATS.length` y `X = Object.keys(ownedCats).length`; el botón "Ajustes" abre `SettingsScreen`; con `onNavigate`/`onOpenSettings` simulado, cerrar Ajustes invoca el callback de "volver al Perfil" (no un callback de "volver al Hub") — depende de T002

### Implementation for User Story 3

- [X] T031 [US3] Crear `src/screens/PlayerProfilePanel.tsx`: recibe `ownedCats`/rango vía `useMetaStore` directamente (mismo patrón que `UpgradeScreen`), un botón "Ajustes" con `onOpenSettings: () => void` (prop, no hardcodea el destino — quien lo monta decide el comportamiento de apilar, ver T032) — depende de T030
- [X] T032 [US3] Ampliar `src/screens/HubScreen.tsx` (mismo archivo, secuencial a T023): agregar el caso `'PlayerProfile'` montando `<PlayerProfilePanel onOpenSettings={() => open('Settings')} />`; conectar un control "Perfil de Jugador" (nuevo, visible en el Hub — ubicarlo junto a los accesos destacados o el HUD superior) a `open('PlayerProfile')`; como `'Settings'` ya hace `close()` genérico (pop), abrir Ajustes desde el Perfil automáticamente vuelve al Perfil al cerrarse por ser un `pop()` sobre un stack (`['PlayerProfile','Settings'] → ['PlayerProfile']`), sin lógica adicional — depende de T031, T014
- [X] T033 [US3] Ejecutar `npx vitest run tests/unit/screens/PlayerProfilePanel.test.tsx tests/unit/HubScreen.test.tsx` y `npx tsc -b` — confirmar verde

**Checkpoint**: US3 demostrable — Perfil de Jugador accesible desde el Hub, con apilamiento correcto hacia Ajustes.

---

## Phase 6: User Story 4 - Buzón de Noticias (Priority: P2)

**Goal**: Nuevo panel "Buzón de Noticias" listando `NEWS_ENTRIES` (más reciente primero) con indicador de no-leídas en el Hub que desaparece al abrir el panel — FR-008, FR-009.

**Independent Test**: Con novedades no leídas, confirmar el indicador en el Hub; abrir el Buzón, confirmar la lista ordenada y que el indicador desaparece; recargar y confirmar que sigue ausente (persistido).

### Tests for User Story 4

- [X] T034 [P] [US4] Crear `tests/unit/screens/NewsPanel.test.tsx`: lista `NEWS_ENTRIES` ordenadas de más reciente a más antigua, cada entrada muestra título/fecha/descripción; al montar, invoca `markNewsRead` para cada entrada no leída (o una sola llamada agregada — decisión de implementación libre) — depende de T010, T008

### Implementation for User Story 4

- [X] T035 [US4] Crear `src/screens/NewsPanel.tsx`: lee `NEWS_ENTRIES` (`src/data/news.ts`) y `readNewsIds`/`markNewsRead` de `useMetaStore`; ordena por `date` descendente; al montar, marca como leídas las entradas que no lo estaban (FR-009) — depende de T034
- [X] T036 [US4] Ampliar `src/screens/HubScreen.tsx` (mismo archivo, secuencial a T032): agregar el caso `'News'` montando `<NewsPanel />`; agregar un control "Buzón de Noticias" (junto al de Perfil de Jugador, T032) con `onClick={() => open('News')}` que muestra un indicador visual (badge) cuando `NEWS_ENTRIES.some(e => !readNewsIds.includes(e.id))` es verdadero (data-model.md § derivado) — depende de T035, T032
- [X] T037 [US4] Ejecutar `npx vitest run tests/unit/screens/NewsPanel.test.tsx tests/unit/HubScreen.test.tsx tests/unit/useMetaStore.test.ts tests/unit/db.test.ts` y `npx tsc -b` — confirmar verde

**Checkpoint**: US4 demostrable — Buzón de Noticias con indicador de no-leídas que persiste correctamente entre sesiones.

---

## Phase 7: User Story 5 - Menú de Tesoros también desde el Mapa de Etapas (Priority: P3)

**Goal**: `LevelSelectScreen` gana un acceso directo a `TreasureMenuScreen` como panel propio (no comparte stack con el Hub), sin remover el acceso ya existente desde Mejorar — FR-010.

**Independent Test**: Desde el Mapa de Etapas, abrir Tesoros con el nuevo botón, confirmar el mismo progreso que muestra el acceso desde Mejorar, cerrar y confirmar que vuelve al Mapa de Etapas (no al Hub).

### Tests for User Story 5

- [X] T038 [P] [US5] Extender `tests/unit/LevelSelectScreen.test.tsx`: un botón "Tesoros {pct}%" (mismo cálculo de progreso que ya expone `TreasureMenuScreen`) abre `TreasureMenuScreen` en un `PanelOverlay` sobre el propio Mapa de Etapas (el mapa sigue en el documento detrás); cerrarlo lo quita del documento sin invocar `onNavigate('MainMenu'|'LevelSelect')` — depende de T004, T002

### Implementation for User Story 5

- [X] T039 [US5] En `src/screens/LevelSelectScreen.tsx`, agregar estado local `showTreasureMenu: boolean` (independiente del stack de `HubScreen`, research.md Decisión 1/plan.md) y un botón "Tesoros {pct}%" que lo activa; cuando está activo, renderizar `<PanelOverlay onClose={() => setShowTreasureMenu(false)}><TreasureMenuScreen onNavigate={() => setShowTreasureMenu(false)} /></PanelOverlay>` sobre el mapa — mismo cálculo de `pct` que ya usa `TreasureMenuScreen.tsx` (obtenido/total por `TreasureSet`) agregado al total del capítulo activo — depende de T038, T004
- [X] T040 [US5] Ejecutar `npx vitest run tests/unit/LevelSelectScreen.test.tsx tests/unit/TreasureMenuScreen.test.tsx` y `npx tsc -b` — confirmar verde

**Checkpoint**: Las 5 historias de usuario funcionan de forma independiente y en conjunto.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Higiene final y evidencia de no-regresión sobre el resto del proyecto

- [X] T041 [P] Revisar accesibilidad de los ocho paneles (`Equip`/`Upgrade`/`Gacha`/`Library`/`Settings`/`TreasureMenu`/`PlayerProfile`/`News`): cada uno pasa un `labelledBy` real a `PanelOverlay` (no un string vacío) — auditoría manual + ajuste si falta alguno
- [X] T042 [P] Añadir comentarios de una línea con referencia `specs/026-navegacion-hub-mockup` en los archivos nuevos (`PanelOverlay.tsx`, `HubScreen.tsx`, `LibraryPanel.tsx`, `PlayerProfilePanel.tsx`, `NewsPanel.tsx`, `news.ts`), siguiendo el patrón ya usado en `src/data/treasureSets.ts`/`src/state/useMetaStore.ts`
- [X] T043 Ejecutar `npx tsc -b`, `npm test`, `npm run lint` y `npm run build` — las 4 deben terminar sin errores antes de dar la feature por completa (SC-003)
- [X] T044 Pasada manual de `quickstart.md` (los 5 escenarios, uno por historia) en `npm run dev`, confirmando ausencia de errores de consola
- [X] T045 Actualizar `README.md`: agregar `026-navegacion-hub-mockup` a la tabla de specs completas, describir el nuevo flujo Hub + paneles en el resumen de pantallas (reemplazando la mención a `MainMenuScreen`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias — puede arrancar de inmediato
- **Foundational (Phase 2)**: Depende de Setup — BLOQUEA las 5 historias de usuario
- **US1 (Phase 3)**: Depende de Foundational
- **US2 (Phase 4)**: Depende de US1 — comparten `src/screens/HubScreen.tsx` (T021-T023 extienden el switch creado en T014); no es independiente de US1 como sí lo son entre sí US1/US2 en specs/025, porque ambas historias de esta spec son sobre el mismo componente Hub
- **US3 (Phase 5)** y **US4 (Phase 6)**: Dependen de US1 (necesitan `HubScreen.tsx` y su `PanelStackController`), no dependen entre sí ni de US2 — paralelizables entre sí y con US2
- **US5 (Phase 7)**: Depende solo de Foundational (usa su propio estado local en `LevelSelectScreen.tsx`, no el stack del Hub) — paralelizable con US2/US3/US4
- **Polish (Phase 8)**: Depende de que todas las historias deseadas estén completas

### Dentro de cada historia

- Tests se escriben antes que la implementación correspondiente y deben fallar primero
- `src/screens/HubScreen.tsx` se toca en T014 (US1), T021-T023/T026 (US2), T032 (US3), T036 (US4) — siempre de forma aditiva (nuevos casos del switch), nunca reescribiendo lo ya wireado por una historia previa
- `tests/unit/AppFlow.test.tsx` se toca en T017 (US1, solo paso 1) y T028 (US2, pasos 2-3) — mismo archivo, ediciones secuenciales y no superpuestas

### Parallel Opportunities

- T002-T003 (Foundational, archivos distintos) son paralelizables entre sí; T006/T008/T010 tocan archivos distintos (`db/index.ts`, `useMetaStore.ts`, `data/news.ts`) y son paralelizables entre sí una vez resueltas sus dependencias internas
- US3 (Phase 5) y US4 (Phase 6) son paralelizables entre sí y con US5 (Phase 7) una vez completado US1 — no comparten archivos de implementación propios (aunque las tres extienden `HubScreen.tsx` en tareas separadas: coordinar el orden de merge de T032/T036 si se trabajan en paralelo)
- US5 (Phase 7) es paralelizable con US2 (Phase 4) — no comparte ningún archivo (`LevelSelectScreen.tsx` vs. `HubScreen.tsx`)
- T041-T042 (Polish) son paralelizables entre sí

---

## Parallel Example: Tras completar US1 (Phase 3)

```bash
# US3, US4 y US5 pueden arrancar a la vez (US2 en paralelo también, coordinando merges de HubScreen.tsx con US3/US4):
Task: "Crear PlayerProfilePanel.tsx + wiring en HubScreen.tsx (US3)"
Task: "Crear NewsPanel.tsx + wiring en HubScreen.tsx (US4)"
Task: "Agregar botón Tesoros a LevelSelectScreen.tsx (US5)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (bloqueante — `PanelId`, `PanelOverlay`, persistencia de noticias)
3. Completar Phase 3: User Story 1
4. **DETENER y VALIDAR**: `npx vitest run tests/unit/HubScreen.test.tsx` + `npx tsc -b` en verde
5. En este punto el Hub ya reemplaza al Menú Principal con paridad de HUD/accesos y Ajustes funcionando como panel — MVP alcanzado (aunque Equipar/Mejorar/Cápsula/Biblioteca/Tesoros todavía no abren contenido real, eso llega con US2/US5)

### Incremental Delivery

1. Setup + Foundational → mecanismo de panel y persistencia de noticias listos
2. US1 → Hub funcional con Ajustes como panel (MVP navegable)
3. US2 → los cinco paneles restantes + regresión completa de `AppFlow.test.tsx` (cierra el propósito central del spec)
4. US3/US4/US5 en paralelo → Perfil de Jugador, Buzón de Noticias, Tesoros desde el Mapa
5. Polish → evidencia de no-regresión sobre el resto del proyecto

### Parallel Team Strategy

Con varios desarrolladores:

1. El equipo completa Setup + Foundational junto (T001-T012)
2. Un desarrollador completa US1 (bloqueante para el resto)
3. Una vez US1 está listo:
   - Desarrollador A: User Story 2 (`HubScreen.tsx` casos restantes + `AppFlow.test.tsx`)
   - Desarrollador B: User Story 3 + User Story 4 (paneles nuevos, coordinando merges de `HubScreen.tsx` con A)
   - Desarrollador C: User Story 5 (`LevelSelectScreen.tsx`, sin conflicto de archivos con A/B)
4. Polish al final, con todas las historias integradas

---

## Notes

- No hay `contracts/` de API externa (proyecto 100% frontend sin interfaces de red) — [contracts/panel-shell.md](contracts/panel-shell.md) documenta el contrato *interno* entre `HubScreen`/`LevelSelectScreen` y las pantallas existentes, usado como referencia por T021-T023, T032, T036 y T039
- [P] = archivo distinto, sin dependencia de una tarea incompleta
- Commit sugerido por tarea o por grupo lógico (T004+T005, T021+T022+T023, etc.), siguiendo el patrón de commits atómicos ya usado en las specs previas del repo
- Ningún task de esta lista modifica `src/engine/` ni `src/game/` — la Constitución § I/III/VI quedan intactas; el stack de paneles es estado de React puro, nunca observado por la simulación de combate
- `src/screens/BattleScreen.tsx` y `src/screens/ResultScreen.tsx` no se tocan (FR-018, fuera de alcance) — Batalla y Resultado siguen siendo vistas de nivel superior ajenas al Hub
