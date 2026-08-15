# Tasks: Menú Principal y Configuración

**Input**: [spec.md](./spec.md), [plan.md](./plan.md)

**Tests**: incluidos para `i18n/useTranslation.ts` (función pura, testeable con Vitest sin DOM) y para `SettingsScreen` (Testing Library, mismo patrón que `tests/unit/TitleScreen.test.tsx`).

**Organización**: sin fase de Setup — no hay dependencias nuevas que instalar.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: puede ejecutarse en paralelo (archivos distintos, sin dependencias)
- **[Story]**: a qué historia de usuario de `spec.md` pertenece la tarea

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: el módulo de i18n y el tipo `Screen` extendido — bloquean ambas historias.

- [X] T001 [P] `src/types/screen.ts`: añade `'Settings'` a la unión `Screen`.
- [X] T002 [P] `src/i18n/translations.ts`: diccionario inicial con claves de `TitleScreen`/`MainMenuScreen`/`SettingsScreen` en `es`/`en`/`zh`/`fr` (mínimo: título, botón jugar/continuar, botones de menú, labels de Configuración).
- [X] T003 `src/i18n/useTranslation.ts`: hook `useTranslation()` que devuelve `t(key)`, leyendo `useMetaStore((s) => s.settings.language)`, con fallback a `es` si la clave no existe para el idioma activo (depende de T002).
- [X] T004 [P] Test Vitest `tests/unit/i18n/useTranslation.test.ts` + `tests/unit/i18n/translations.test.ts`: `translate()`/`t()` devuelven la traducción correcta por idioma y caen a español si falta (depende de T003).

**Checkpoint**: `i18n` completo y testeado; ninguna pantalla lo usa todavía.

---

## Phase 2: User Story 1 - Ajustar audio e idioma desde el menú principal (Priority: P1) 🎯 MVP

**Goal**: pantalla `Settings` funcional con borrador local + Aplicar/Guardar sobre `useMetaStore.updateSettings`.

**Independent Test**: entrar a Configuración desde el menú, cambiar valores, confirmar, recargar y verificar persistencia (spec.md pasos 1-3).

### Implementation for User Story 1

- [X] T005 [US1] `src/screens/SettingsScreen.tsx`: estado local (`useState`) inicializado desde `useMetaStore.settings`; controles de música/efectos (sliders 0-1) e idioma (select); botón "Aplicar/Guardar" que llama `useMetaStore.updateSettings(draft)` y botón "Volver" que descarta el borrador sin llamar a `updateSettings`.
- [X] T006 [US1] `src/screens/MainMenuScreen.tsx`: añade botón "Configuración" → `onNavigate('Settings')`.
- [X] T007 [US1] `src/App.tsx`: añade el `case 'Settings'` al switch de pantallas.
- [X] T008 [US1] Test Testing Library `tests/unit/SettingsScreen.test.tsx` + `tests/unit/MainMenuScreen.test.tsx`: cambiar un control y salir sin confirmar no llama a `updateSettings`; confirmar sí lo llama con los valores del borrador; botón "Configuración" navega a `Settings` (depende de T005).

**Checkpoint**: US1 completa — Configuración es alcanzable, editable y persiste solo al confirmar.

---

## Phase 3: User Story 2 - Elegir idioma de la interfaz (Priority: P2)

**Goal**: `TitleScreen`, `MainMenuScreen` y `SettingsScreen` leen el diccionario de i18n en vez de texto fijo en español.

**Independent Test**: cambiar idioma a inglés en Configuración, confirmar, y verificar que las 3 pantallas muestran texto en inglés (spec.md pasos 1-2).

### Implementation for User Story 2

- [X] T009 [P] [US2] `src/screens/TitleScreen.tsx`: reemplaza texto fijo por `useTranslation()` (depende de T003).
- [X] T010 [P] [US2] `src/screens/MainMenuScreen.tsx`: reemplaza texto fijo por `useTranslation()` (depende de T003, T006) — implementado junto con T006.
- [X] T011 [US2] `src/screens/SettingsScreen.tsx`: reemplaza labels fijos por `useTranslation()` (depende de T003, T005) — implementado junto con T005.
- [X] T012 [US2] Verificación manual en navegador: cambiado idioma a inglés desde Configuración, confirmado, y verificado que Título/Menú/Configuración cambian de texto; el fallback a español está cubierto por el test unitario `translate()` con un diccionario incompleto.

**Checkpoint**: US1 + US2 completas — Configuración funcional y con efecto visible de idioma en las 3 pantallas.

---

## Phase 4: Polish & Cross-Cutting Concerns

- [X] T013 [P] `npx tsc -b` limpio sobre todo el proyecto.
- [X] T014 [P] `npm test` — suite completa (12 archivos, 57 tests) en verde.
- [X] T015 Recorrido final en navegador: `Title` → `MainMenu` → `Settings`, cambio de idioma a inglés confirmado con "Apply/Save", vuelta a `MainMenu` en inglés, y verificado que sobrevive a un reload real (Dexie/IndexedDB).

---

## Dependencies & Execution Order

- **Foundational (Fase 1)**: sin dependencias externas — bloquea US1 y US2. T003 depende de T002; T004 depende de T003.
- **US1 (Fase 2)**: depende de Foundational (T001, T003). T006/T007 dependen de T005.
- **US2 (Fase 3)**: depende de Foundational (T003) y de US1 (T005/T006, pantallas ya existentes que se traducen).
- **Polish (Fase 4)**: depende de que ambas historias estén completas.

## Parallel Opportunities

- T001/T002 en paralelo (Foundational).
- T009/T010 en paralelo dentro de US2 (archivos distintos).
- T013/T014 en paralelo (Polish).
