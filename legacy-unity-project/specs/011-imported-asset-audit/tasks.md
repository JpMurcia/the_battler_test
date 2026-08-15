---

description: "Task list template for feature implementation"
---

# Tasks: Auditoría de Assets Importados

**Input**: Design documents from `/specs/011-imported-asset-audit/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: No solicitados — esta feature no produce código ejecutable (plan.md Technical Context: Testing = N/A); la validación es leer `asset-catalog.md` siguiendo quickstart.md.

**Organization**: Tareas agrupadas por historia de usuario para permitir implementación y validación independiente de cada una.

**Scope note (2026-07-29)**: El alcance se amplió de 5 a 8 packs a pedido del usuario ("algunos assets tienen sonido para el juego") — se agregaron `"Monsters Creatures Fantasy 2"`, `"Warrior free set"` y `ShootingSound`. Ver research.md §2, §5, §6.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (lectura de packs distintos, sin dependencias entre sí)
- **[Story]**: Historia de usuario a la que pertenece (US1..US4)
- Todas las tareas son de solo lectura sobre `Assets/` (FR-007); el único archivo que se escribe es `specs/011-imported-asset-audit/asset-catalog.md`

## Path Conventions

Documento único: `specs/011-imported-asset-audit/asset-catalog.md`. No hay `src/`/`tests/` — ver plan.md Project Structure.

## Phase 1: Setup

**Purpose**: Crear el documento del catálogo antes de que cualquier historia escriba en él

- [X] T001 Crear `specs/011-imported-asset-audit/asset-catalog.md` con encabezado y tabla de contenidos vacía

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Fijar el esqueleto de secciones que comparten todas las historias, para que puedan escribir en paralelo sin pisarse

**⚠️ CRITICAL**: Ninguna historia escribe en `asset-catalog.md` hasta que esta fase termine

- [X] T002 Escribir el esqueleto de secciones fijas en `specs/011-imported-asset-audit/asset-catalog.md` — `## Packs`, `## Personajes — Principio III`, `## Enemigos y Criaturas`, `## Recomendación de UI`, `## Licencias y Riesgos`, `## Problemas Estructurales` — según las entidades de data-model.md (depende de T001)

**Checkpoint**: Esqueleto del catálogo listo — las historias de usuario pueden empezar en paralelo

---

## Phase 3: User Story 1 - Catalogar el contenido de los packs importados (Priority: P1) 🎯 MVP

**Goal**: Un catálogo que enumera los 8 packs con ruta, tipo de contenido y conteo de archivos, describiendo además la completitud de las 30 carpetas `hero_N`, las 4 criaturas de `"Monsters Creatures Fantasy 2"` y los efectos de sonido de `ShootingSound` (FR-001, FR-002, FR-002b, FR-004b)

**Independent Test**: Leer `asset-catalog.md` y confirmar que enumera cada uno de los 8 packs por separado con ruta, tipo de contenido y conteo de archivos, sin abrir Unity (spec.md US1)

### Implementation for User Story 1

- [X] T003 [P] [US1] Inventariar `Assets/Characters/` — para cada `hero_1`..`hero_30`, confirmar variantes `male`/`female` y contar frames en `1_idle`..`6_die`, marcando héroes incompletos (SC-002)
- [X] T004 [P] [US1] Inventariar `Assets/Assets/` (`UI Elements/`, `Raw and SpriteSheets/`) — ruta, tipo de contenido, conteo aproximado de archivos
- [X] T005 [P] [US1] Inventariar `"Assets/Dragon Warrior Files"` — ruta, tipo de contenido (personaje único + `Effects/`), conteo aproximado de archivos
- [X] T006 [P] [US1] Inventariar `"Assets/Free 2D Cartoon Parallax Background"` — ruta, tipo de contenido, conteo aproximado de archivos
- [X] T007 [P] [US1] Inventariar `Assets/Hyper_Casual_UI/` (`Fonts/`, `Scenes/`, `Sprites/`) — ruta, tipo de contenido, conteo aproximado de archivos
- [X] T008 [P] [US1] Inventariar `"Assets/Monsters Creatures Fantasy 2"` — por criatura (`Bat`, `Mimic`, `Rat`, `Slime`) en `Sprites/<Criatura>/`, listar estados de animación disponibles (idle/attack/hurt/death/fly/transform) y los `Animator Controllers` en `Animations/` (FR-002b)
- [X] T009 [P] [US1] Inventariar `"Assets/Warrior free set"` (`Aniamtion/`, `Sprite Sheet/`) — ruta, tipo de contenido, conteo aproximado de archivos
- [X] T010 [P] [US1] Inventariar `Assets/ShootingSound/` — listar los 13 archivos `.wav` con su nombre, sin asignarlos a un personaje/pantalla específico salvo que el nombre lo indique (FR-004b)
- [X] T011 [US1] Escribir la sección `## Packs` de `specs/011-imported-asset-audit/asset-catalog.md` con los 8 packs (T003-T010), la nota de completitud de `hero_N` y la nota de `ShootingSound` como pack de audio (depende de T002, T003, T004, T005, T006, T007, T008, T009, T010)

**Checkpoint**: US1 completa y verificable de forma independiente (SC-001, SC-005)

---

## Phase 4: User Story 2 - Evaluar cumplimiento del Principio III (Priority: P1) 🎯 MVP

**Goal**: Marcar cada personaje candidato a unidad jugable (`hero_1`..`hero_30`, "Dragon Warrior", "Warrior free set") como "cumple" o "incompleto" contra el Principio III de la constitución, listando el requisito faltante (FR-003)

**Independent Test**: Cruzar el catálogo contra el checklist del Principio III por héroe/personaje y confirmar que cada uno queda marcado, listando qué requisito falta (spec.md US2)

### Implementation for User Story 2

- [X] T012 [P] [US2] Evaluar `hero_1`..`hero_30` contra el Principio III (idle + attack presentes = cumple mínimo; variante visual adicional = "requiere decisión de diseño" por ser sprites crudos — research.md §4), usando el inventario de T003
- [X] T013 [P] [US2] Evaluar "Dragon Warrior" contra el Principio III con el mismo criterio, anotando `Effects/` (fireball, explosion, dashwind) como VFX de batalla reutilizable independientemente del personaje elegido (Acceptance Scenario 2), usando el inventario de T005
- [X] T014 [P] [US2] Evaluar "Warrior free set" contra el Principio III con el mismo criterio, anotando que los efectos de `ShootingSound` (T010) quedan disponibles como sonido de ataque reutilizable sin asumir que pertenecen a este personaje en particular (Acceptance Scenario 3), usando el inventario de T009
- [X] T015 [US2] Escribir la sección `## Personajes — Principio III` de `specs/011-imported-asset-audit/asset-catalog.md` con la tabla de 32 filas (T012, T013, T014) siguiendo el esquema "Candidato a Personaje" de data-model.md (depende de T002, T012, T013, T014)

**Checkpoint**: US1 y US2 completas — MVP del catálogo entregable (SC-002, SC-005)

---

## Phase 5: User Story 3 - Detectar solapamiento entre packs de UI (Priority: P2)

**Goal**: Comparar `Assets/Assets/UI Elements` contra `Hyper_Casual_UI` y recomendar qué pack usar por pantalla (`MainMenu`, `AdventureMap`, `PlayerBase`, HUD de batalla) (FR-004)

**Independent Test**: Comparar categorías equivalentes entre ambos packs y confirmar que el catálogo entrega una recomendación explícita por cada una de las 4 pantallas existentes (spec.md US3)

### Implementation for User Story 3

- [X] T016 [P] [US3] Listar categorías de contenido de `Assets/Assets/UI Elements` (pause, settings, botones genéricos, paneles, iconos) usando el inventario de T004
- [X] T017 [P] [US3] Listar categorías de contenido de `Assets/Hyper_Casual_UI/Sprites` (pause, settings, botones genéricos, paneles, iconos) usando el inventario de T007
- [X] T018 [US3] Comparar T016 vs T017, resaltar categorías solapadas y producir una recomendación (o "requiere decisión de diseño") por cada una de las 4 pantallas núcleo (depende de T016, T017)
- [X] T019 [US3] Escribir la sección `## Recomendación de UI` de `specs/011-imported-asset-audit/asset-catalog.md` con la tabla de T018, dejando cero pantallas sin decisión (SC-003) (depende de T002, T018)

**Checkpoint**: US1, US2 y US3 funcionan de forma independiente

---

## Phase 6: User Story 4 - Señalar riesgos de licencia/atribución (Priority: P3)

**Goal**: Listar cada archivo de licencia/léame encontrado en los 8 packs importados con su ruta exacta, marcado como "pendiente de revisión legal manual" (FR-005)

**Independent Test**: Buscar en el catálogo la sección de licencias y confirmar que enumera cada archivo de licencia/léame encontrado junto con su ruta exacta (spec.md US4)

### Implementation for User Story 4

- [X] T020 [US4] Buscar archivos de licencia/léame/contacto dentro de los 8 packs de FR-001 — ya se sabe que existen `Dragon Warrior Files/Read Me.txt`, `Hyper_Casual_UI/Fonts/license.txt`, `Warrior free set/License.txt`, `Warrior free set/Contact.txt` y `ShootingSound/ReadMe.txt`
- [X] T021 [US4] Escribir la sección `## Licencias y Riesgos` de `specs/011-imported-asset-audit/asset-catalog.md` listando cada archivo de T020 con su ruta exacta y "pendiente de revisión legal manual" (SC-004) (depende de T002, T020)

**Checkpoint**: Las 4 historias de usuario funcionan de forma independiente

---

## Phase 7: Polish & Cross-Cutting Concerns (FR-006, Edge Cases)

**Purpose**: Problemas estructurales que abarcan varios packs a la vez (no pertenecen a una sola historia de usuario) y validación final

- [X] T022 [P] Detectar archivos sin su `.meta` correspondiente en los 8 packs, comparando el inventario de T003-T010 contra los `.meta` presentes
- [X] T023 [P] Detectar carpetas `hero_N` incompletas (falta variante de género o falta un estado de animación) a partir del inventario de T003
- [X] T024 [P] Detectar escenas/scripts de demo incluidos en los packs que aún no están cableados a las escenas propias del proyecto (`Dragon Warrior Files/Demo.unity`, `Assets/Assets/Scenes/*`, `Hyper_Casual_UI/Scenes/*`, `Monsters Creatures Fantasy 2/Demo/DemoScene.unity`) frente a `Chapter1_Battle`, `AdventureMap`, `MainMenu`, `PlayerBase`
- [X] T025 Escribir la sección `## Problemas Estructurales` de `specs/011-imported-asset-audit/asset-catalog.md` con los hallazgos de T022-T024 (depende de T002, T022, T023, T024)
- [X] T026 Ejecutar quickstart.md completo sobre el `asset-catalog.md` final (checks US1-US4 + confirmación FR-007 de que `git status` en `Assets/` no cambió) (depende de T011, T015, T019, T021, T025)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias — empieza de inmediato
- **Foundational (Phase 2)**: Depende de Setup — BLOQUEA la escritura de cualquier sección por parte de las historias
- **User Stories (Phase 3-6)**: Todas dependen de Foundational; el inventario de cada historia (tareas `[P]` de lectura) puede correr en paralelo entre historias, la escritura de sección de cada historia depende solo de su propio inventario
- **Polish (Phase 7)**: Depende de los inventarios de US1 (T003-T010); su tarea de validación final (T026) depende de que las 4 secciones de historia ya estén escritas

### User Story Dependencies

- **US1 (P1)**: Después de Foundational — sin dependencia de otras historias
- **US2 (P1)**: Después de Foundational — reutiliza los inventarios T003/T005/T009 de US1 (no bloquea la escritura de la sección de US1, ambas secciones son independientes)
- **US3 (P2)**: Después de Foundational — reutiliza los inventarios T004/T007 de US1
- **US4 (P3)**: Después de Foundational — no depende de ningún inventario de otra historia

### Within Each User Story

- Inventario (lectura, `[P]`) antes de la tarea de escritura de sección de esa historia
- La tarea de escritura de sección es la única no paralelizable dentro de la historia (todas escriben en el mismo archivo `asset-catalog.md`, en secciones distintas)

### Parallel Opportunities

- T003-T010 (inventarios de los 8 packs, US1) en paralelo entre sí
- T012, T013, T014 (evaluación Principio III, US2) en paralelo entre sí, y en paralelo con T003-T010 si el inventario que consumen (T003, T005, T009) ya terminó
- T016, T017 (categorías de UI, US3) en paralelo entre sí
- T022, T023, T024 (Polish) en paralelo entre sí
- Las tareas de escritura de sección (T011, T015, T019, T021, T025) no son paralelizables entre sí porque todas modifican `asset-catalog.md`

---

## Parallel Example: User Story 1

```bash
# Lanzar los 8 inventarios de packs en paralelo:
Task: "Inventariar Assets/Characters/ (T003)"
Task: "Inventariar Assets/Assets/ (T004)"
Task: "Inventariar \"Assets/Dragon Warrior Files\" (T005)"
Task: "Inventariar \"Assets/Free 2D Cartoon Parallax Background\" (T006)"
Task: "Inventariar Assets/Hyper_Casual_UI/ (T007)"
Task: "Inventariar \"Assets/Monsters Creatures Fantasy 2\" (T008)"
Task: "Inventariar \"Assets/Warrior free set\" (T009)"
Task: "Inventariar Assets/ShootingSound/ (T010)"

# Luego, una sola tarea de escritura:
Task: "Escribir sección ## Packs en asset-catalog.md (T011)"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 — ambas P1)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (bloqueante)
3. Completar Phase 3: US1 (catálogo de packs, incluye enemigos/criaturas y audio)
4. Completar Phase 4: US2 (cumplimiento Principio III, incluye "Warrior free set")
5. **STOP and VALIDATE**: correr los checks US1/US2 de quickstart.md sobre `asset-catalog.md`
6. El catálogo ya es útil como insumo para decidir qué personajes están listos como unidad jugable, aunque falten US3/US4

### Incremental Delivery

1. Setup + Foundational → esqueleto del catálogo listo
2. US1 + US2 (MVP) → catálogo de 8 packs + cumplimiento Principio III
3. US3 → recomendación de UI por pantalla
4. US4 → riesgos de licencia
5. Polish (FR-006) → problemas estructurales + validación final con quickstart.md

### Parallel Team Strategy

Con varias personas disponibles después de Foundational:

- Persona A: US1 (T003-T011)
- Persona B: US2 (T012-T015, puede empezar en cuanto T003/T005/T009 tengan datos)
- Persona C: US3 (T016-T019)
- Persona D: US4 (T020-T021)
- Cualquiera: Polish (T022-T026) al final, cuando las 4 secciones de historia estén escritas

---

## Notes

- [P] = archivos/lectura distintos, sin dependencias entre sí
- [Story] mapea cada tarea a su historia de usuario para trazabilidad
- Todas las tareas son de solo lectura sobre `Assets/` — ninguna mueve, renombra, elimina ni cablea assets (FR-007)
- El único artefacto que se modifica/crea es `specs/011-imported-asset-audit/asset-catalog.md`
- `"Monsters Creatures Fantasy 2"` se cataloga en US1 (T008) pero NO se evalúa contra el Principio III en US2 — son candidatas a enemigo, no a unidad jugable (research.md §5)
