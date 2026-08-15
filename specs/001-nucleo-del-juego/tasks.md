# Tasks: Bootstrap de Núcleo del Juego

**Input**: [spec.md](./spec.md), [plan.md](./plan.md)

**Scope**: las 4 tareas de bootstrap pedidas — Dexie, Zustand, estructura de UI, campo de batalla Pixi. Deja el proyecto en un estado ejecutable (`npm run dev` muestra una pantalla de título navegable y un canvas de Pixi con un sprite animado) pero **sin** el bucle de combate real conectado todavía — eso es la siguiente ronda de tareas (`plan.md` Fase 4).

**Tests**: Vitest para todo lo que sea función pura o store (sin UI); sin contract-tests (sin backend).

## Format: `[ID] [P?] Description`

- **[P]**: puede ejecutarse en paralelo (archivos distintos, sin dependencias)

## Phase 0: Setup de Dexie.js

- [X] T001 Instalar y configurar Vitest (`vitest`, `@testing-library/react` si hace falta para stores) — el scaffold de Vite no lo incluye por defecto
- [X] T002 Crear `src/db/index.ts`: clase `BattleCatsDB extends Dexie` con las 4 tablas de `spec.md` § Persistencia (`playerProfile`, `ownedCats`, `levelProgress`, `settings`), `version(1).stores({...})`, export `const db = new BattleCatsDB()`
- [X] T003 [P] Definir los tipos de fila (`PlayerProfileRow`, `OwnedCatRow`, `LevelProgressRow`, `SettingsRow`) — ya esbozados en `spec.md`, formalizarlos en `src/db/index.ts` o `src/types/persistence.ts`
- [X] T004 Implementar una función `ensureDefaultProfile()` en `src/db/index.ts`: si `playerProfile`/`settings` no tienen fila al consultar, crea la fila por defecto (moneda 0, `highestUnlockedLevelIndex` en el primer nivel, ajustes por defecto) — cubre spec.md US2 Edge Case
- [X] T005 [P] Test Vitest: `ensureDefaultProfile()` sobre una base de datos vacía crea las filas por defecto exactamente una vez (no duplica en una segunda llamada)

**Checkpoint**: `db.ts` funciona de forma aislada — se puede abrir la consola del navegador, importar `db`, y ver las tablas en IndexedDB (DevTools → Application → IndexedDB).

---

## Phase 1: Setup de Zustand

- [X] T006 Crear `src/data/cats.ts` con 3-5 `Cat` de prueba (costo, cooldown, salud, daño, velocidad, ancho — valores de diseño provisionales, no balanceados) — necesario como fixture para los stores y para Fase 3
- [X] T007 [P] Crear `src/data/levels.ts` con 1 `Level` de prueba (salud de ambas bases, tasa de regeneración de energía, recompensa de moneda)
- [X] T008 Implementar `src/state/useMetaStore.ts` (spec.md § `useMetaStore`): `hydrate()` lee de `db` (T002/T004) y puebla el estado; `addCurrency`/`spendCurrency`/`unlockNextLevel`/`markLevelCompleted`/`addOwnedCat`/`upgradeCat`/`updateSettings` — cada una escribe a Dexie en el mismo paso, no hay guardado diferido
- [X] T009 Implementar `src/state/useGameStore.ts` (spec.md § `useGameStore`): estado inicial `Idle`, `startLevel`/`deployUnit`/`reset` — **sin** implementar `tick()` todavía (placeholder que no hace nada, se completa en la siguiente ronda de tareas junto con `src/engine/`, ver `plan.md` Fase 4)
- [X] T010 [P] Test Vitest: `useMetaStore.hydrate()` contra una base de datos vacía deja el store en el estado por defecto esperado; `spendCurrency` rechaza sin efecto si el monto excede la moneda actual
- [X] T011 [P] Test Vitest: `useGameStore.deployUnit()` rechaza sin efecto si la energía es insuficiente o si el `catId` está en cooldown (usando el fixture de T006)

**Checkpoint**: ambos stores compilan y pasan sus tests sin ningún componente de React todavía.

---

## Phase 2: Estructura de UI (React) — pantalla de título y menú principal

- [X] T012 Reescribir `src/App.tsx`: estado de "pantalla activa" (`"Title" | "MainMenu" | "LevelSelect" | "Gacha" | "Upgrade" | "Battle" | "Result"`) y renderizado condicional del componente correspondiente — sin router externo por ahora (spec.md § Arquitectura UI, Navegación)
- [X] T013 Al montar `App.tsx`, llamar `useMetaStore.hydrate()` una sola vez y mostrar un estado de carga mínimo mientras `isHydrated === false`
- [X] T014 [P] `src/screens/TitleScreen.tsx`: título del juego, botón "Jugar" (si `completedLevelIds.length === 0`) o "Continuar" (si ya hay progreso) — navega a `MainMenu`
- [X] T015 [P] `src/screens/MainMenuScreen.tsx`: muestra `currency` de `useMetaStore`, botones de acceso a `LevelSelect`/`Gacha`/`Upgrade` (pueden navegar a pantallas todavía-placeholder en esta ronda)
- [X] T016 [P] Placeholders mínimos (`LevelSelectScreen.tsx`, `GachaScreen.tsx`, `UpgradeScreen.tsx`, `ResultScreen.tsx`): cada uno un título y un botón "Volver" — contenido real fuera de alcance de este bootstrap
- [X] T017 Test de componente: `TitleScreen` muestra "Jugar" con progreso vacío y "Continuar" con progreso existente (mock de `useMetaStore`)

**Checkpoint**: `npm run dev` navega de Título → Menú Principal → pantallas placeholder y de vuelta, con la moneda real leída desde Dexie.

---

## Phase 3: Setup del Campo de Batalla (Pixi.js)

- [X] T018 `src/screens/BattleScreen.tsx`: monta `BattleStage` (T019) a pantalla completa, sin overlay de UI real todavía (placeholder de barra de energía/salud de bases, sin datos reales — se conecta en la siguiente ronda de tareas)
- [X] T019 `src/game/BattleStage.tsx`: `<Application>` de `@pixi/react` (Stage), tamaño responsive al contenedor, fondo de color sólido de prueba
- [X] T020 Cargar un sprite de prueba (un `.png` placeholder en `public/sprites/`) y renderizarlo como `<Sprite>` de Pixi dentro de `BattleStage`, en una posición fija
- [X] T021 Implementar el `Ticker` de Pixi (`useTick` de `@pixi/react` o `app.ticker.add`) que mueve el sprite de prueba de izquierda a derecha a velocidad constante en cada frame — confirma que el bucle de render corre a 60fps sin re-renderizar componentes de React (spec.md § Arquitectura Core del Juego, Regla de frontera)
- [X] T022 Añadir navegación real: `MainMenuScreen`/`LevelSelectScreen` → `BattleScreen` con `useGameStore.startLevel(levelId)`, y un botón de salida que vuelve a `MainMenuScreen` sin persistir nada (spec.md FR-013)
- [X] T023 Verificación manual en navegador: el sprite de prueba se mueve de forma fluida en `BattleScreen`, sin caída de frames perceptible, confirmando la base sobre la que se conectará el motor de combate real en la siguiente ronda de tareas

**Checkpoint**: el proyecto completo es ejecutable de punta a punta — Título → Menú → Batalla con un canvas Pixi animado — aunque todavía sin reglas de combate reales. Listo para la siguiente ronda de tareas (`plan.md` Fase 4: conectar `src/engine/` al render y al `useGameStore.tick`).

---

## Dependencies & Execution Order

- **Fase 0 (Dexie)**: sin dependencias — puede empezar de inmediato.
- **Fase 1 (Zustand)**: depende de Fase 0 (T002/T004) para `useMetaStore.hydrate()`; T006/T007 (fixtures de contenido) son independientes y pueden adelantarse en paralelo.
- **Fase 2 (UI React)**: depende de Fase 1 (lee `useMetaStore` real, no un mock, para `TitleScreen`/`MainMenuScreen`).
- **Fase 3 (Pixi)**: depende de Fase 2 (necesita `BattleScreen` ya enrutable) pero no depende de que el motor de combate (`src/engine/`) exista todavía — el sprite de prueba de T020/T021 es deliberadamente independiente de `useGameStore.tick`.

## Implementation Strategy

1. Fase 0 → Fase 1 → Fase 2 → Fase 3, en ese orden — cada una depende de la anterior salvo lo ya anotado como paralelo.
2. Al terminar Fase 3, el proyecto queda en un estado demostrable ("se ve y se mueve algo en pantalla, con menús reales alrededor") sin todavía prometer que el juego es jugable — eso es intencional, es un bootstrap, no el MVP completo.
3. La siguiente ronda de tareas (fuera de este documento) conecta `src/engine/collision.ts`/`combat.ts`/`simulation.ts` al `Ticker` de `BattleStage` y a `useGameStore.tick`, reemplazando el sprite de prueba por unidades reales del roster del jugador — momento en que `spec.md` US1 (el bucle central) queda verificable de punta a punta.
