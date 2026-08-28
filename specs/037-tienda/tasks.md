---

description: "Task list for feature 037-tienda"
---

# Tasks: Tienda

**Input**: Design documents from `/specs/037-tienda/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Incluidos.

**Organization**: Foundational bloquea todo. US1 (Objetos de Batalla) y US2 (Ítems de Evolución) son P1, independientes entre sí (datos y acciones distintas), implementadas en fases separadas pero compartiendo el mismo panel `ShopPanel.tsx`.

## Format: `[ID] [P?] [Story] Description`

## Path Conventions

Single-project: `src/`, `tests/` en la raíz.

---

## Phase 1: Setup

- [X] T001 Ejecutar `npx tsc -b` y `npm test` y confirmar línea base en verde

---

## Phase 2: Foundational — catálogo de precios y PanelId

- [X] T002 [P] Crear `tests/unit/data/shop.test.ts`: `getBattleItemPrice` devuelve el precio correcto para cada id de `BATTLE_ITEM_PRICES` y `0` para un id desconocido; `EVOLUTION_ITEM_PRICE` es un número positivo — confirmar que fallan (el archivo no existe)
- [X] T003 Crear `src/data/shop.ts` según data-model.md
- [X] T004 Ejecutar `tests/unit/data/shop.test.ts` y confirmar que T002 pasa
- [X] T005 En `src/types/screen.ts`: añadir `'Shop'` a `PanelId`

**Checkpoint**: Catálogo de precios listo — sin acciones de compra ni UI todavía.

---

## Phase 3: User Story 1 - Comprar Objetos de Batalla (Priority: P1) 🎯 MVP

**Goal**: Comprar un Objeto de Batalla con moneda, sumando al inventario existente.

**Independent Test**: Con moneda suficiente, comprar "Aceleración de Velocidad" y confirmar que `battleItemInventory['speed-boost']` aumenta en 1 y la moneda se descuenta en 150.

### Tests for User Story 1

- [X] T006 [P] [US1] Añadir casos a `tests/unit/useMetaStore.test.ts`: `purchaseBattleItem('speed-boost')` con moneda suficiente descuenta el precio exacto, suma 1 a `battleItemInventory['speed-boost']` (sobre cualquier cantidad ya existente) y persiste; con moneda insuficiente devuelve `false` sin mutar; un id de ítem inexistente (precio 0) no debería poder comprarse gratis — confirmar el comportamiento esperado y que los casos fallan antes de implementar
- [X] T007 [P] [US1] Crear `tests/unit/ShopPanel.test.tsx`: la sección "Objetos de Batalla" muestra cada `BattleItem` con su precio y cantidad en inventario; pulsar "Comprar" invoca `purchaseBattleItem(itemId)`; con moneda insuficiente el botón está deshabilitado — confirmar que fallan (el archivo no existe)

### Implementation for User Story 1

- [X] T008 [US1] En `src/state/useMetaStore.ts`: implementar `purchaseBattleItem(itemId)` según data-model.md
- [X] T009 [US1] Crear `src/screens/ShopPanel.tsx` con la sección "Objetos de Batalla" únicamente
- [X] T010 [US1] En `src/screens/HubScreen.tsx`: añadir `PANEL_LABELS.Shop`, botón de dock "Tienda", y `case 'Shop'` en el switch
- [X] T011 [P] [US1] Añadir casos a `tests/unit/HubScreen.test.tsx`: el botón "Tienda" abre el panel `ShopPanel` — confirmar que fallan
- [X] T012 [US1] Ejecutar `tests/unit/useMetaStore.test.ts`, `tests/unit/ShopPanel.test.tsx` y `tests/unit/HubScreen.test.tsx`, confirmar que T006/T007/T011 pasan y que ninguna prueba existente se rompe

**Checkpoint**: Compra de Objetos de Batalla funcional de punta a punta (SC-001).

---

## Phase 4: User Story 2 - Comprar Ítems de Evolución (Priority: P1)

**Goal**: Comprar ítems de evolución para un gato poseído elegible, hasta completar la cantidad requerida.

**Independent Test**: Comprar ítems de evolución para un gato con Forma Verdadera definida hasta alcanzar `requiredItemCount`; confirmar que el botón de compra para ese gato se deshabilita al llegar al tope, y que evolucionar a Forma Verdadera (flujo ya existente) queda disponible si el nivel también alcanza.

### Tests for User Story 2

- [X] T013 [P] [US2] Añadir casos a `tests/unit/useMetaStore.test.ts`: `purchaseEvolutionItem(catId)` sobre un gato con `evolutions.true` definido, sin alcanzarlo todavía, y con moneda suficiente, descuenta `EVOLUTION_ITEM_PRICE`, suma 1 a `evolutionItems[catId]` (sin afectar otros catId) y persiste; sobre un gato ya en `evolutionStage: 'True'`, sin `evolutions.true` definido, o que ya alcanzó `requiredItemCount`, devuelve `false`; con moneda insuficiente devuelve `false` — confirmar que fallan
- [X] T014 [P] [US2] Añadir casos a `tests/unit/ShopPanel.test.tsx`: la sección "Ítems de Evolución" lista solo gatos elegibles (Forma Verdadera definida, no alcanzada) con su progreso `actual/requerido`; pulsar "Comprar" invoca `purchaseEvolutionItem(catId)`; un gato que ya alcanzó el tope o que no tiene Forma Verdadera definida no aparece / tiene el botón deshabilitado — confirmar que fallan

### Implementation for User Story 2

- [X] T015 [US2] En `src/state/useMetaStore.ts`: implementar `purchaseEvolutionItem(catId)` según data-model.md
- [X] T016 [US2] En `src/screens/ShopPanel.tsx`: añadir la sección "Ítems de Evolución"
- [X] T017 [US2] Ejecutar `tests/unit/useMetaStore.test.ts` y `tests/unit/ShopPanel.test.tsx`, confirmar que T013/T014 pasan y que ninguna prueba existente (incluidas las de `evolveCat` en `specs/010`) se rompe

**Checkpoint**: Ambas secciones de la Tienda funcionan de punta a punta, y un gato puede alcanzar Forma Verdadera por una vía legítima del juego por primera vez (SC-002, SC-003).

---

## Phase 5: Polish & Verificación Final

- [X] T018 Ejecutar `npx tsc -b` y `npm test` completos, confirmar 0 errores/0 fallos (SC-004)
- [X] T019 Verificación manual en navegador siguiendo `quickstart.md`, incluyendo el flujo completo comprar ítems → evolucionar a Forma Verdadera → (opcional) confirmar que la sección de Talentos de `specs/036` ahora es alcanzable jugando

---

## Dependencies & Execution Order

Phase 1 → Phase 2 (Foundational) → Phase 3 (US1) → Phase 4 (US2) → Phase 5.

## Implementation Strategy

**MVP = Phase 3 completa**: Objetos de Batalla por sí solo ya es un sumidero de moneda completo y verificable; US2 se suma incrementalmente, y es la que desbloquea Forma Verdadera para el resto del juego.
