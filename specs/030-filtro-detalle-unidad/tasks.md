---

description: "Task list for feature 030-filtro-detalle-unidad"
---

# Tasks: Filtro de Gatos y Panel de Detalle de Unidad

**Input**: Design documents from `/specs/030-filtro-detalle-unidad/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Incluidos, siguiendo TDD como el resto del proyecto.

**Organization**: US1 (filtro) y US2 (detalle+evolución) comparten los mismos 2 archivos de pantalla (`TeamScreen.tsx`/`CatGuideScreen.tsx`) pero son lógicamente independientes — US2 puede implementarse sin filtro activo, y el filtro no depende del panel de detalle.

## Format: `[ID] [P?] [Story] Description`

## Path Conventions

Single-project: `src/`, `tests/` en la raíz.

---

## Phase 1: Setup

- [X] T001 Ejecutar `npx tsc -b` y `npm test` y confirmar línea base en verde antes de empezar

---

## Phase 2: Foundational

**N/A.** Sin infraestructura compartida bloqueante entre US1 y US2.

---

## Phase 3: User Story 1 - Filtrar el roster por rareza, rasgo y habilidad (Priority: P1)

**Goal**: `catFilter.ts` puro + control de filtro en `TeamScreen`/`CatGuideScreen`.

**Independent Test**: Con gatos de ≥2 rarezas, marcar una en el filtro de Equipar y confirmar que la lista se reduce exactamente a esos gatos.

### Tests for User Story 1

- [X] T002 [P] [US1] Crear `tests/unit/data/catFilter.test.ts`: sin criterios devuelve `true` para cualquier gato; filtro de rareza incluye/excluye correctamente (incluido un gato sin `rarity`); filtro de rasgo objetivo matchea solo gatos con `Ability` `TraitTargeting` que incluya ese rasgo; filtro de habilidad matchea `appliesEffect.type` (Weaken/Freeze/Slow/Curse) y `attackType` (Critical/MultiHit); combinación de rasgo+habilidad en modo `AND` exige ambos, en modo `OR` exige cualquiera; un gato sin `abilities` nunca matchea un filtro de rasgo/habilidad basado en `TraitTargeting` pero sí puede matchear por `attackType` (Acceptance Scenarios 1-6 de `spec.md` US1) — confirmar que fallan (el archivo no existe)

### Implementation for User Story 1

- [X] T003 [US1] Crear `src/data/catFilter.ts`: `CatFilterAbility`, `CatFilterState`, `EMPTY_CAT_FILTER`, `matchesCatFilter(cat, filter)` según data-model.md
- [X] T004 [US1] Ejecutar `tests/unit/data/catFilter.test.ts` y confirmar que T002 pasa
- [X] T005 [P] [US1] Añadir casos a `tests/unit/TeamScreen.test.tsx`: el control de filtro existe; marcar una rareza reduce la lista visible a los gatos de esa rareza; marcar rasgo+habilidad con Y/O produce el resultado esperado; "Ordenar por nivel" reordena sin cambiar el conjunto incluido; sin criterios, la lista es idéntica a la actual (Acceptance Scenarios 1,6,7 de `spec.md` US1) — confirmar que fallan
- [X] T006 [P] [US1] Añadir casos equivalentes a `tests/unit/CatGuideScreen.test.tsx` (mismo control de filtro, misma función `matchesCatFilter`) — confirmar que fallan
- [X] T007 [US1] En `src/screens/TeamScreen.tsx`: añadir `useState<CatFilterState>(EMPTY_CAT_FILTER)` y `useState(false)` para orden por nivel; renderizar chips/checkboxes de rareza (`RARITY_TAG_CLASS` ya expone las 7 rarezas), un `<select>`/chips de rasgo (`ClassificationType`, 8 valores) y de habilidad (`CatFilterAbility`, 6 valores), un toggle Y/O y un toggle de orden; aplicar `CATS.filter(cat => cat.id in ownedCats && matchesCatFilter(cat, filter))` y, si `sortByLevel`, ordenar por `ownedCats[cat.id].level` antes de renderizar — sin cambiar `selectedIds`/`toggleCat`/`Confirmar equipo` (FR-011)
- [X] T008 [US1] Aplicar el mismo patrón de T007 a `src/screens/CatGuideScreen.tsx` (su propio estado de filtro, misma función `matchesCatFilter`)
- [X] T009 [US1] Ejecutar `tests/unit/TeamScreen.test.tsx` y `tests/unit/CatGuideScreen.test.tsx`, confirmar que T005/T006 pasan y que ninguna prueba existente se rompe

**Checkpoint**: Filtro funcional e independiente en ambas pantallas (SC-001, SC-002).

---

## Phase 4: User Story 2 - Panel de detalle de unidad con evolución (Priority: P1)

**Goal**: `UnitDetailPanel` compartido, con stats completos, tabs de forma y botón de evolución conectado a `evolveCat()`.

**Independent Test**: Tocar un gato elegible para evolucionar, pulsar el botón, confirmar que la forma cambia y persiste.

### Tests for User Story 2

- [X] T010 [P] [US2] Crear `tests/unit/shared/UnitDetailPanel.test.tsx`: muestra las 8 estadísticas (HP/Daño/DPS/Alcance/Velocidad/Coste/Recarga/Tipo de ataque) para un gato de fixture; sin `evolutions`, no muestra pestañas de forma; con `evolutions.second` (sin `.true`), muestra solo pestañas Base/Evolucionada; cambiar de pestaña cambia los stats mostrados sin invocar `evolveCat`; con nivel suficiente para la siguiente forma, el botón de evolución está habilitado y pulsarlo invoca `evolveCat(catId)` y refleja la nueva forma; con nivel insuficiente, el botón está deshabilitado mostrando el requisito; en forma `True` (o forma máxima del gato), no se muestra ningún botón de evolución (Acceptance Scenarios 1-7 de `spec.md` US2) — confirmar que fallan (el archivo no existe)

### Implementation for User Story 2

- [X] T011 [US2] Crear `src/screens/shared/UnitDetailPanel.tsx` según data-model.md § UnitDetailPanel: usa `PanelOverlay` (`labelledBy` = nombre del gato), calcula `availableForms`/`statsForTab`/`dps`/`nextForm`/`canEvolve`, renderiza pestañas de forma (si `availableForms.length > 1`) y el botón de evolución (research.md Decisión 6: opera siempre sobre `owned.evolutionStage` real, nunca sobre `selectedFormTab`)
- [X] T012 [US2] Ejecutar `tests/unit/shared/UnitDetailPanel.test.tsx` y confirmar que T010 pasa
- [X] T013 [P] [US2] Añadir casos a `tests/unit/TeamScreen.test.tsx`: tocar un gato de la lista abre `UnitDetailPanel` con ese `catId`; cerrarlo vuelve a la lista con el filtro (si había uno) todavía aplicado (Acceptance Scenario 8 de `spec.md` US2) — confirmar que fallan
- [X] T014 [P] [US2] Añadir casos equivalentes a `tests/unit/CatGuideScreen.test.tsx` — confirmar que fallan
- [X] T015 [US2] En `src/screens/TeamScreen.tsx`: añadir `useState<string | null>(null)` para `detailCatId`, hacer que cada fila de la lista sea accionable (botón/onClick) para abrir el panel con su `catId`, renderizar `<UnitDetailPanel catId={detailCatId} onClose={() => setDetailCatId(null)} />` cuando no sea `null` — sin interferir con el checkbox de selección existente (deben ser controles distintos dentro de la misma fila)
- [X] T016 [US2] Aplicar el mismo patrón de T015 a `src/screens/CatGuideScreen.tsx`
- [X] T017 [US2] Ejecutar `tests/unit/TeamScreen.test.tsx` y `tests/unit/CatGuideScreen.test.tsx` completos, confirmar que T013/T014 pasan y que ninguna prueba existente (incluidas las de US1) se rompe

**Checkpoint**: Panel de detalle funcional en ambas pantallas, `evolveCat()` alcanzable desde la UI por primera vez (SC-003, SC-004).

---

## Phase 5: Polish & Verificación Final

- [X] T018 Ejecutar `npx tsc -b` y `npm test` completos, confirmar 0 errores/0 fallos (SC-005)
- [X] T019 Verificación manual en navegador siguiendo `quickstart.md`

---

## Dependencies & Execution Order

- Phase 1 bloquea todo lo demás.
- US1 (Phase 3) y US2 (Phase 4) tocan los mismos 2 archivos de pantalla (`TeamScreen.tsx`/`CatGuideScreen.tsx`) — implementar US1 completa antes de US2 para evitar conflictos de edición concurrente sobre las mismas filas de lista, aunque son lógicamente independientes (T007/T008 de US1 no dependen de T011 de US2, y viceversa).
- Phase 5 al final.

## Implementation Strategy

**MVP = User Story 2** si se prioriza por impacto (conecta `evolveCat()`, huérfano desde `specs/010`) o **User Story 1** si se prioriza por el orden ya fijado en `spec.md` (ambas son P1) — este documento sigue el orden de `spec.md` (US1 primero) por ser el que aparece primero en la spec, pero ambas son entregables de forma independiente.
