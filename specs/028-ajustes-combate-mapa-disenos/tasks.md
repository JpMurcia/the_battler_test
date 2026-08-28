---

description: "Task list for feature 028-ajustes-combate-mapa-disenos"
---

# Tasks: Ajustes Post-Revisión — Combate por Refuerzo de Fila, Pestañas de Mapa y Diseños Procedurales

**Input**: Design documents from `/specs/028-ajustes-combate-mapa-disenos/`

**Prerequisites**: plan.md, spec.md, research.md (data-model.md/contracts/ no existen para esta spec — sin entidades persistidas nuevas, ver spec.md § Key Entities)

**Tests**: Incluidos — `plan.md` § Testing nombra explícitamente los 3 archivos de test a extender/crear, y el proyecto ya sigue TDD en las 542 pruebas existentes.

**Organization**: Tareas agrupadas por historia de usuario (US1/US2/US3), en el orden de prioridad de `spec.md` (P1, P1, P2). Las 3 historias tocan archivos disjuntos y son completamente independientes entre sí.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivo distinto, sin dependencia de una tarea sin terminar)
- **[Story]**: Historia de usuario a la que pertenece (US1/US2/US3)

## Path Conventions

Proyecto single-project: `src/`, `tests/` en la raíz del repo (ver `plan.md` § Project Structure).

---

## Phase 1: Setup

**Purpose**: Confirmar una línea base limpia antes de tocar código — esta spec es 100% modificación de código existente, sin dependencias ni estructura de proyecto nueva.

- [X] T001 Ejecutar `npx tsc -b` y `npm test` en la raíz del repo y confirmar que ambos están en verde antes de empezar (línea base para SC-005)

---

## Phase 2: Foundational

**N/A para esta spec.** Las 3 historias de usuario tocan archivos disjuntos (`src/engine/simulation.ts` · `src/screens/LevelSelectScreen.tsx` + `src/theme.css` · `src/data/seedData.ts` + `src/data/imperioCap1Design.ts` + `src/game/UnitSprite.tsx` + `src/game/graphics/unitFactory.ts`) y ninguna requiere infraestructura, modelo base o configuración compartida antes de empezar — pueden implementarse en cualquier orden o en paralelo.

---

## Phase 3: User Story 1 - Combate por refuerzo de fila (Priority: P1) 🎯 MVP

**Goal**: Cuando varias unidades aliadas quedan bloqueadas en fila (directa o transitivamente) detrás de una ya trabada en combate, todas infligen daño al mismo objetivo en el mismo tick — el objetivo nunca contraataca más de una vez por tick.

**Independent Test**: Desplegar 3 aliados en el mismo punto de entrada contra 1 enemigo fuerte; confirmar que, en el tick en que el 2º y 3er aliado quedan bloqueados detrás del 1º (ya trabado), ambos infligen daño a ese enemigo ese mismo tick.

### Tests for User Story 1

- [X] T002 [P] [US1] Añadir casos de refuerzo de fila a `tests/unit/engine/simulation.test.ts`: cadena de 2 (B se suma a A vs X), cadena de 3+ (A/B/C vs X en el mismo tick), unidad bloqueada por un atacante de Área excluida de los objetivos de salpicadura (solo objetivo primario), X contraataca como máximo una vez por tick sin importar cuántos aliados le peguen, A muere a mitad de tick y el daño de B/C igual se aplica, un aliado D no bloqueado se comporta igual que hoy (Acceptance Scenarios 1-5 de `spec.md`) — confirmar que fallan contra la implementación actual

### Implementation for User Story 1

- [X] T003 [US1] Implementar la pasada de "refuerzo de fila" en `stepSimulation` (`src/engine/simulation.ts`, tras poblar `engagements`/`freeMovers` en la línea ~226, antes del bucle de resolución de la línea ~232): iterar en fixed-point sobre `freeMovers`, promover cada unidad cuyo `tentativeX` colisione (mismo criterio `overlaps1D` ya usado por el bloqueo de movimiento en la línea ~271-276) con un aliado que sea `attackerId` de un engagement ya conocido (original o promovido en una iteración anterior de esta misma pasada), empujando `{ attackerId: unidadPromovida, targetIds: [targetIds[0] del bloqueador] }` a `engagements` y sacándola de `freeMovers`; repetir hasta una iteración sin promociones (research.md Decisión 2) — sin tocar `src/engine/combat.ts` (research.md Decisión 1)
- [X] T004 [US1] Ejecutar `tests/unit/engine/simulation.test.ts` y confirmar que todos los casos de T002 pasan y que ninguna prueba existente de la suite se rompe

**Checkpoint**: Refuerzo de fila funcional y testeado de forma independiente — 3 aliados apilados contra 1 enemigo reparten daño en el mismo tick (SC-001).

---

## Phase 4: User Story 2 - Mapa de etapas por pestañas de región (Priority: P1)

**Goal**: "Niveles" muestra pestañas por `Level.region`; cada pestaña filtra sus propios nodos en un área con scroll cuando no caben todos, sin alterar qué está bloqueado/disponible/completado.

**Independent Test**: Abrir "Niveles" con el Capítulo 1 desbloqueado, confirmar al menos 2 pestañas, que cambiar de pestaña cambia qué nodos se ven, y que los 48 nodos del Capítulo 1 son navegables (con scroll) sin superponerse.

### Tests for User Story 2

- [X] T005 [P] [US2] Añadir casos de pestañas a `tests/unit/LevelSelectScreen.test.tsx`: existen ≥2 pestañas con la primera región seleccionada por defecto, cambiar de pestaña filtra los nodos visibles a los de esa región (con sus propias líneas conectoras), cambiar de pestaña no altera el estado bloqueado/disponible/completado de ningún nivel, un nivel bloqueado sigue sin abrir el panel de detalle en cualquier pestaña, el nodo de un banner de evento activo permanece visible fuera de la cadena de pestañas (Acceptance Scenarios 1-5 de `spec.md`) — confirmar que fallan contra la implementación actual

### Implementation for User Story 2

- [X] T006 [US2] En `src/screens/LevelSelectScreen.tsx`: añadir constante `REGION_LABELS: Record<string, string>` (fallback al valor crudo de `region` si no está mapeado) y estado `useState` para la región activa, con la primera región de `LEVELS` (en su orden de arreglo) como valor por defecto
- [X] T007 [US2] En `src/screens/LevelSelectScreen.tsx`: derivar la lista de pestañas con `[...new Set(LEVELS.map(l => l.region))]` y filtrar `levelNodes` y las líneas conectoras del `<svg className="stage-map__lines">` a solo los `LEVELS` de la región activa — `eventNodes` (fase especial de banner) se mantiene sin filtrar (FR-009)
- [X] T008 [US2] En `src/screens/LevelSelectScreen.tsx`: renderizar los botones de pestaña (usando `REGION_LABELS`) encima de `.stage-map`, con `onClick` que actualiza la región activa de T006
- [X] T009 [US2] Añadir scroll vertical con altura de lienzo dinámica: reglas `.stage-map--scrollable` (contenedor exterior, `overflow-y: auto`) y `.stage-map__canvas` (usa `--stage-map-canvas-height`) en `src/theme.css`; en `src/screens/LevelSelectScreen.tsx` aplicar esas clases a `.stage-map` y fijar `--stage-map-canvas-height` inline a `Math.max(320, nodeCount * 70)` según el número de nodos de la pestaña activa (research.md Decisión 3) — sin modificar `src/data/levels.ts`
- [X] T010 [US2] Ejecutar `tests/unit/LevelSelectScreen.test.tsx` y confirmar que todos los casos de T005 pasan y que ninguna prueba existente de la suite se rompe

**Checkpoint**: Mapa de etapas navegable por pestañas, sin regresión en desbloqueo/progreso (SC-002, SC-003).

---

## Phase 5: User Story 3 - Diseños procedurales propios para las 30 unidades del Capítulo 1 (Priority: P2)

**Goal**: Cada una de las 30 unidades nuevas de `specs/027-capitulo-1-imperio-gatos` (14 `cat-*` jugables + 16 `enemy-*`) tiene un `ProceduralDesign` propio (forma + rasgo + color), sin combinación repetida entre ellas; el rol `'ally'` deja de forzar orejas de gato y respeta `distinctiveFeature` igual que `'enemy'`.

**Independent Test**: Desplegar en sesiones distintas 3 unidades nuevas de roles claramente distintos (área, alcance largo, jefe final) y confirmar que sus siluetas/colores/rasgos son distinguibles a simple vista, sin dos compartiendo la misma combinación.

### Tests for User Story 3

- [X] T013 [P] [US3] Crear `tests/unit/data/imperioCap1Design.test.ts`: las 30 unidades nuevas de `specs/027` (14 `cat-*` de `specs/027-capitulo-1-imperio-gatos/data-model.md` § 14 `Cat` jugables + 16 `enemy-*` de su § 16 `Cat` de enemigo) tienen entrada en `IMPERIO_CAP1_DESIGNS`, y ninguna pareja comparte exactamente la misma combinación `baseShape` + `distinctiveFeature` + `primaryColor` (FR-012) — confirmar que falla contra la implementación actual (el archivo aún no existe)

### Implementation for User Story 3

- [X] T011 [P] [US3] En `src/data/seedData.ts`: ampliar la unión `ProceduralDesign['distinctiveFeature']` de 5 a 10 valores, añadiendo `'horns' | 'wings' | 'shield' | 'spikes' | 'tail'`
- [X] T012 [US3] Crear `src/data/imperioCap1Design.ts` exportando `IMPERIO_CAP1_DESIGNS: Record<string, ProceduralDesign>` con una entrada por cada uno de los 30 ids (14 `cat-*` + 16 `enemy-*`, ver `specs/027-capitulo-1-imperio-gatos/data-model.md`), mapeando arquetipo → rasgo según research.md Decisión 5 (tanque → `horns`, anti-Flotante/aéreo → `wings`, defensivo → `shield`, agresivo/área → `spikes`, rápido → `tail`, o los 5 rasgos ya existentes cuando el arquetipo no calce), verificando a mano que ninguna combinación forma+rasgo+color se repite (FR-012) — depende de T011 para el tipo ampliado
- [X] T014 [US3] En `src/game/graphics/unitFactory.ts`: generalizar `drawEnemyFeature` para manejar los 5 casos nuevos (`'horns' | 'wings' | 'shield' | 'spikes' | 'tail'`) y quitar el caso especial `role === 'ally'` de `drawSeedUnit` para que ambos roles llamen a la función de rasgo generalizada — verificar que los 4 `SEED_UNITS` existentes (que ya declaran `distinctiveFeature: 'cat-ears'`) renderizan igual que antes (research.md Decisión 5, punto 5)
- [X] T015 [US3] En `src/game/UnitSprite.tsx`: sustituir el lookup `SEED_UNITS.find(...) ?? SEED_ENEMIES.find(...)` (que devuelve el objeto `SeedUnit` completo) por una resolución directa de `ProceduralDesign`: `SEED_UNITS.find(u => u.id === catId)?.proceduralDesign ?? SEED_ENEMIES.find(u => u.id === catId)?.proceduralDesign ?? IMPERIO_CAP1_DESIGNS[catId]`, y actualizar la llamada a `getOrCreateUnitTexture` para usar ese diseño resuelto directamente (research.md Decisión 4) — el orden de prioridad `spriteKey` → procedural → cuerpo genérico (FR-011) no cambia
- [X] T016 [US3] Ejecutar `npx tsc -b`, `tests/unit/data/imperioCap1Design.test.ts` (T013) y las suites existentes que tocan `UnitSprite`/`unitFactory`, confirmando que todo pasa sin regresión

**Checkpoint**: Las 30 unidades del Capítulo 1 tienen diseño visual propio y distinguible (SC-004).

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verificación final de las 3 historias en conjunto.

- [X] T017 [P] Ejecutar `npx tsc -b` limpio y `npm test` completo en la raíz del repo — 0 regresiones en cualquier suite existente (SC-005)
- [X] T018 Revisión manual en navegador (dev server): confirmar SC-001 (3 aliados apilados reparten daño en el mismo tick, 1 solo contraataque), SC-002 (≥2 pestañas, 100% de nodos navegables sin superposición) y SC-004 (30 unidades nuevas visualmente distinguibles, sin combinación repetida) — criterios de Independent Test de `spec.md` para las 3 historias

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias — empieza de inmediato
- **Foundational (Phase 2)**: N/A, no bloquea nada (ver nota arriba)
- **User Stories (Phase 3-5)**: cada una depende solo de Setup (T001); son independientes entre sí y pueden implementarse en cualquier orden o en paralelo
- **Polish (Phase 6)**: depende de que las 3 historias estén completas

### User Story Dependencies

- **US1 (P1)**: sin dependencia de US2/US3 — toca solo `src/engine/simulation.ts` + su test
- **US2 (P1)**: sin dependencia de US1/US3 — toca solo `src/screens/LevelSelectScreen.tsx` + `src/theme.css` + su test
- **US3 (P2)**: sin dependencia de US1/US2 — toca solo `src/data/seedData.ts`, `src/data/imperioCap1Design.ts`, `src/game/UnitSprite.tsx`, `src/game/graphics/unitFactory.ts` + su test

### Within Each User Story

- US1: T002 (test) antes de T003 (implementación) antes de T004 (verificación)
- US2: T005 (test) antes de T006→T007→T008→T009 (mismo archivo, orden secuencial) antes de T010 (verificación)
- US3: T011 (tipo) antes de T012 (registro de diseños) y antes de T014 (generalización de dibujo); T013 (test) puede escribirse en paralelo a T012 pero solo pasa tras T012+T014+T015; T015 depende de T012 y T014; T016 verifica al final

### Parallel Opportunities

- T001 (Setup) no tiene tareas paralelas hermanas
- Las 3 historias completas (Phase 3, 4, 5) pueden trabajarse en paralelo entre sí una vez pasado Setup
- Dentro de US1: solo T002 es paralelizable respecto al resto (test independiente antes de tocar `simulation.ts`)
- Dentro de US2: solo T005 es paralelizable
- Dentro de US3: T011 y T013 son paralelizables entre sí (archivos distintos); T012/T014/T015/T016 son secuenciales por las dependencias de tipo/registro descritas arriba

---

## Parallel Example: Lanzar las 3 historias a la vez tras T001

```bash
# Cada historia en su propio hilo de trabajo, todas tras completar T001:
Task: "US1 — refuerzo de fila en src/engine/simulation.ts"
Task: "US2 — pestañas de región en src/screens/LevelSelectScreen.tsx"
Task: "US3 — diseños procedurales en src/data/imperioCap1Design.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1 (T001)
2. Completar Phase 3 — US1 (T002-T004)
3. **STOP and VALIDATE**: probar refuerzo de fila de forma independiente (SC-001)
4. Deploy/demo si está listo — es el ajuste de mayor impacto señalado por el jugador

### Incremental Delivery

1. Setup → línea base lista
2. + US1 (refuerzo de fila) → validar independientemente → demo (MVP)
3. + US2 (pestañas de mapa) → validar independientemente → demo
4. + US3 (diseños procedurales) → validar independientemente → demo
5. Cada historia suma valor sin romper las anteriores — las 3 tocan archivos disjuntos

### Parallel Team Strategy

Con varios desarrolladores, tras T001: Dev A toma US1, Dev B toma US2, Dev C toma US3 — sin conflictos de archivo entre ellas.

---

## Notes

- [P] = archivos distintos, sin dependencias entre sí
- [Story] mapea cada tarea a su historia de usuario para trazabilidad
- Cada historia es completable y testeable de forma independiente
- Confirmar que los tests fallan antes de implementar (T002, T005, T013)
- Ningún cambio de esta spec toca `src/engine/combat.ts`, `getLevelState`/`highestUnlockedLevelIndex`/`useMetaStore`, ni introduce `spriteKey`/arte importado — restricciones explícitas de `plan.md` § Technical Context
