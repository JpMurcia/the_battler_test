---
description: "Task list template for feature implementation"
---

# Tasks: Sistema de Gacha Completo ("Cápsula de Gatos")

**Input**: Design documents from `specs/024-sistema-gacha/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [quickstart.md](quickstart.md)

**Tests**: Incluidos — el proyecto ya tiene cobertura Vitest para cada feature previa (`tests/unit/`) y `quickstart.md` de esta feature depende de que existan las suites nuevas/ampliadas de `tests/unit/data/gacha.test.ts`, `tests/unit/GachaScreen.test.tsx` y `tests/unit/useMetaStore.test.ts`.

**Organization**: Tareas agrupadas por historia de usuario (US1-US6 de [spec.md](spec.md)) para que cada una sea implementable y verificable de forma independiente.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivo distinto, sin dependencia de una tarea incompleta)
- **[Story]**: Historia de usuario a la que pertenece (US1-US6)
- Cada tarea incluye la ruta de archivo exacta

## Path Conventions

Proyecto único (SPA React + Pixi.js): `src/`, `tests/unit/` en la raíz del repo — ver plan.md § Project Structure.

---

## Phase 1: Setup

**Purpose**: Confirmar que no hace falta infraestructura nueva antes de tocar código de la feature

- [X] T001 Confirmar que no se requiere ninguna dependencia npm nueva (plan.md § Technical Context) y que la rama activa es `024-sistema-gacha` — no crea código, solo verifica supuestos antes de empezar

**Checkpoint**: Sin bloqueos de tooling — se puede empezar Foundational.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: El catálogo de gacha (banners, pool, funciones de tirada) y la persistencia nueva (Almacén, monedas, `plusLevel`) son consumidos por las 6 historias — ninguna puede tirar, mostrar tasas ni activar/intercambiar una cápsula sin esto. Incluye además el contenido de `Legendario`/`Colaboración` (US5) porque `GACHA_POOL` no puede quedar con un tier anunciado y vacío desde el primer commit (spec.md Edge Cases) — US1 ya necesita un banner válido para ser demostrable.

**⚠️ CRITICAL**: Ninguna historia de usuario puede darse por verificable (`tsc -b`/`npm test` en verde) hasta que este archivo compile

- [X] T002 [P] Crear `src/data/gachaUnits.ts` con 4 `Cat` gacha-exclusivos (data-model.md § `gachaUnits.ts`): `legend-cat-eclipse`/`legend-cat-supreme` (`rarity: 'Legendario'`), `collab-cat-voidwalker`/`collab-cat-star-idol` (`rarity: 'Colaboración'`) — ninguno con `spriteKey` (research.md Decisión 2, caen en el fallback `Graphics` genérico de `UnitSprite.tsx`); exportar `GACHA_UNITS: Cat[]`
- [X] T003 En `src/data/cats.ts`, importar `GACHA_UNITS` de `./gachaUnits` y hacer spread al final del array `CATS` (append, mismo patrón que `...SEED_CATS_AS_CATS`/`...SEED_ENEMIES_AS_CATS` ya existente) — depende de T002
- [X] T004 [P] En `src/db/index.ts`: agregar `GachaStorageRow { id?: number; catId: string; rarity: RarityType }`, declarar `gachaStorage!: Table<GachaStorageRow, number>` y `this.version(10).stores({ gachaStorage: '++id' })` (data-model.md § `GachaStorageRow`); agregar campos opcionales `gachaCurrency?: number`/`npCurrency?: number` a `PlayerProfileRow` y `plusLevel?: number` a `OwnedCatRow` (sin bump de versión adicional — research.md Decisión 5)
- [X] T005 Crear `src/data/gacha.ts` con `GachaRarityOdds`/`GachaBanner`/`GachaRollResult` (data-model.md), los 3 banners fijos `GACHA_BANNERS` (`uberfest`/`epicfest`/`estandar`, tasas de data-model.md § `GachaBanner`), `GACHA_POOL` construido filtrando `CATS` (ya incluye `GACHA_UNITS` tras T003) por `cat.rarity` en `Raro`/`Superraro`/`Megarraro`/`Legendario`, y las funciones puras `rollOne(banner, random = Math.random)`/`rollMany(banner, count, random?)` (research.md Decisión 6) — depende de T003
- [X] T006 [P] Crear `tests/unit/data/gacha.test.ts`: `GACHA_POOL` tiene al menos un `catId` en `Raro`/`Superraro`/`Megarraro`/`Legendario` (FR-013/SC-009); `rollMany(GACHA_BANNERS[0], 1000, seededRandom)` cae dentro de ±2 puntos porcentuales de `banner.odds` por rareza (SC-003); repetir para el banner `estandar` (sin `Legendario`) — depende de T005
- [X] T007 En `src/state/useMetaStore.ts`: agregar `gachaCurrency: number`, `npCurrency: number`, `gachaStorage: GachaStorageRow[]` a `MetaState` con sus valores iniciales; hidratar los 3 desde `db.playerProfile.get(1)` (`?? 0`) y `db.gachaStorage.toArray()` en `hydrate()`; actualizar `characterLevelOf` para sumar `cat.level + (cat.plusLevel ?? 0)` por gato (research.md Decisión 3) — depende de T004
- [X] T008 Ejecutar `npx tsc -b` y `npm test` — confirmar verde antes de tocar código de cualquier historia de usuario

**Checkpoint**: Compilación y suite existente en verde, catálogo de gacha completo y persistencia lista — las 6 historias pueden implementarse en cualquier orden o en paralelo.

---

## Phase 3: User Story 1 - Tirar una vez y recibir una cápsula en el Almacén (Priority: P1) 🎯 MVP

**Goal**: El jugador tira una vez en la Cápsula de Gatos, ve las tasas del banner activo, y el resultado cae como cápsula sin activar en el Almacén — no directamente en `ownedCats` (spec.md FR-001, FR-004, FR-005, FR-010, FR-011).

**Independent Test**: Con `gachaCurrency` suficiente, tirar una vez y confirmar que se descontó el costo exacto, que aparece una cápsula nueva en el Almacén con el `catId`/rareza correctos, y que ese gato no es seleccionable/desplegable hasta activarse.

### Tests for User Story 1

> Escribir primero — deben fallar contra el `GachaScreen` stub actual

- [X] T009 [P] [US1] Ampliar `tests/unit/useMetaStore.test.ts`: `rollGachaSingle('estandar')` con `gachaCurrency` suficiente descuenta 150, agrega exactamente 1 fila a `gachaStorage` (estado y `db.gachaStorage`) con el `catId`/rareza resueltos por `rollOne`, y no crea ninguna entrada en `ownedCats`; con `gachaCurrency` insuficiente retorna `null` sin descontar ni agregar nada — cubre FR-001/FR-004/FR-005, Acceptance Scenarios 1-2
- [X] T010 [P] [US1] Crear `tests/unit/GachaScreen.test.tsx`: la pestaña "Tirar" muestra el desglose de tasas del banner activo antes de tirar; una tirada simple exitosa muestra la pantalla de revelado con tratamiento visual distinto por rareza; al cerrarla, vuelve a la pestaña "Tirar" (Acceptance Scenario 3); un gato recién depositado en el Almacén no aparece como poseído (mock de `useMetaStore.ownedCats`) — cubre Acceptance Scenarios 1, 3, 4

### Implementation for User Story 1

- [X] T011 [US1] En `src/state/useMetaStore.ts`, implementar `rollGachaSingle(bannerId): GachaRollResult | null`: resuelve el banner por `bannerId`, valida `gachaCurrency >= 150`, descuenta, llama `rollOne(banner)`, inserta la cápsula en `gachaStorage` (estado + `db.gachaStorage.add`), retorna el resultado (`null` si no alcanza el saldo) — FR-001/FR-004/FR-005 — depende de T007
- [X] T012 [US1] En `src/theme.css`, agregar clases de revelado: `.gacha-reveal`, `.gacha-reveal__orb`, `.gacha-reveal__orb--raro`/`--superraro`/`--megarraro`/`--legendario` (colores `var(--bc-cyan)`/`var(--bc-purple)`/`var(--bc-gold)`/`var(--bc-orange)`, mismos tokens que `.tag--<rareza>`), con guard `@media (prefers-reduced-motion: reduce)` (mismo patrón que `.anim-pulse`)
- [X] T013 [US1] Reescribir `src/screens/GachaScreen.tsx`: hub con pestaña "Tirar" (banner activo fijo por ahora — el selector llega en US2) mostrando el desglose de tasas, botón "Tirada Simple" que llama `rollGachaSingle` y abre la pantalla de revelado con el color de `.gacha-reveal__orb--<rareza>`; botón "Continuar" que cierra el revelado y vuelve a "Tirar" (FR-011) — depende de T011, T012
- [X] T014 [US1] Ejecutar `npx vitest run tests/unit/useMetaStore.test.ts tests/unit/GachaScreen.test.tsx` y confirmar verde; ejecutar `npx tsc -b` para confirmar que no hay regresión de tipos

**Checkpoint**: US1 demostrable — tirada simple de punta a punta, resultado depositado en el Almacén, no desplegable hasta activarse.

---

## Phase 4: User Story 2 - Elegir entre banners con tasas distintas (Priority: P1)

**Goal**: El jugador ve al menos dos banners seleccionables, cada uno con su propio desglose de tasas, y puede cambiar el banner activo antes de tirar (spec.md FR-003).

**Independent Test**: Abrir la Cápsula, cambiar entre banners disponibles y confirmar que el desglose de tasas mostrado cambia de forma consistente, sin necesidad de tirar.

### Tests for User Story 2

> Escribir primero — deben fallar porque `GachaScreen` todavía no tiene selector de banner

- [X] T015 [P] [US2] Ampliar `tests/unit/GachaScreen.test.tsx`: se ven al menos 2 banners de `GACHA_BANNERS`, cada uno con nombre y tasas que suman 100%; seleccionar un banner distinto al activo actualiza el desglose mostrado y el banner que usará la siguiente tirada — cubre Acceptance Scenarios 1-2

### Implementation for User Story 2

- [X] T016 [US2] En `src/screens/GachaScreen.tsx`, agregar estado `activeBannerId` (por defecto el primero de `GACHA_BANNERS`) con un selector de banner; el desglose de tasas y la llamada a `rollGachaSingle`/`rollGachaMulti` usan `activeBannerId` — depende de T013
- [X] T017 [US2] Ejecutar `npx vitest run tests/unit/GachaScreen.test.tsx` y confirmar verde

**Checkpoint**: US2 demostrable — al menos 2 banners seleccionables, tasas visibles y consistentes por banner.

---

## Phase 5: User Story 3 - Activar una cápsula nueva desde el Almacén (Priority: P1)

**Goal**: Una cápsula sin activar de un gato no poseído, al activarse, se agrega de inmediato a `ownedCats` y se comporta como cualquier otro gato poseído (spec.md FR-006, FR-010).

**Independent Test**: Con una cápsula sin activar de un gato no poseído, activarla desde el Almacén y confirmar que aparece en `ownedCats` en forma base y se comporta igual que cualquier gato poseído en las pantallas ya existentes.

### Tests for User Story 3

> Escribir primero — deben fallar porque `activateCapsule` todavía no existe

- [X] T018 [P] [US3] Ampliar `tests/unit/useMetaStore.test.ts`: `activateCapsule(storageRowId)` sobre una cápsula de un `catId` no poseído llama a `addOwnedCat` (forma base, nivel natural inicial) y elimina la fila de `gachaStorage` (estado + `db.gachaStorage`) — cubre FR-006, Acceptance Scenario 1
- [X] T019 [P] [US3] Ampliar `tests/unit/GachaScreen.test.tsx`: la pestaña "Almacén" lista las cápsulas pendientes (`gachaStorage`); activar la de un gato no poseído la retira de la lista y el gato pasa a estar disponible (mock de `ownedCats` actualizado tras la acción)

### Implementation for User Story 3

- [X] T020 [US3] En `src/state/useMetaStore.ts`, implementar `activateCapsule(storageRowId: number): void`: si `ownedCats[catId]` no existe, llama a `addOwnedCat(catId)` (mecanismo ya existente, sin cambios); elimina la fila de `gachaStorage` (estado + `db.gachaStorage.delete`) — FR-006 — depende de T007, T011
- [X] T021 [US3] En `src/screens/GachaScreen.tsx`, agregar la pestaña "Almacén": lista `gachaStorage` (agrupada por `catId`), botón "Activar" por fila que llama `activateCapsule` — depende de T013, T020
- [X] T022 [US3] Ejecutar `npx vitest run tests/unit/useMetaStore.test.ts tests/unit/GachaScreen.test.tsx tests/unit/TeamScreen.test.tsx tests/unit/UpgradeScreen.test.tsx` y confirmar verde (SC-004: un gato activado se comporta igual que cualquier otro poseído, sin regresión en las pantallas ya existentes)

**Checkpoint**: US3 demostrable — activar una cápsula nueva vuelve al gato jugable de punta a punta (Cat Guide, Team, batalla).

---

## Phase 6: User Story 4 - Tirada múltiple (x11) (Priority: P2)

**Goal**: El jugador tira 11 veces de una sola vez por un costo menor a 11 tiradas simples, viendo los 11 resultados juntos en una sola revelación (spec.md FR-002, FR-012).

**Independent Test**: Con saldo suficiente para una tirada x11, ejecutarla y confirmar que se obtienen exactamente 11 cápsulas nuevas en el Almacén, todas visibles en la misma pantalla de revelación.

### Tests for User Story 4

> Escribir primero — deben fallar porque `rollGachaMulti` todavía no existe

- [X] T023 [P] [US4] Ampliar `tests/unit/useMetaStore.test.ts`: `rollGachaMulti('estandar')` con `gachaCurrency` suficiente (1.500) descuenta ese monto exacto (no 11×150) y agrega exactamente 11 filas a `gachaStorage`; con saldo insuficiente para la x11 pero suficiente para una simple, retorna `null` sin efecto — cubre FR-002/FR-004, Acceptance Scenarios 1, 3
- [X] T024 [P] [US4] Ampliar `tests/unit/GachaScreen.test.tsx`: una tirada x11 exitosa muestra los 11 resultados juntos en una sola pantalla de revelado, sin confirmaciones separadas; el botón "Tirada x11" aparece deshabilitado cuando el saldo alcanza solo para la simple — cubre Acceptance Scenarios 2-3

### Implementation for User Story 4

- [X] T025 [US4] En `src/state/useMetaStore.ts`, implementar `rollGachaMulti(bannerId): GachaRollResult[] | null`: valida `gachaCurrency >= 1500`, descuenta, llama `rollMany(banner, 11)`, inserta las 11 cápsulas en `gachaStorage` — depende de T011
- [X] T026 [US4] En `src/screens/GachaScreen.tsx`, agregar botón "Tirada x11" (deshabilitado si `gachaCurrency < 1500`) y la vista de revelado múltiple (grilla de 11 resultados, reutilizando `.gacha-reveal__orb--<rareza>` de T012) — depende de T013, T025
- [X] T027 [US4] Ejecutar `npx vitest run tests/unit/useMetaStore.test.ts tests/unit/GachaScreen.test.tsx` y confirmar verde

**Checkpoint**: US4 demostrable — tirada x11 completa con revelado conjunto, coexistiendo con la tirada simple de US1.

---

## Phase 7: User Story 5 - Todas las categorías de rareza tienen unidades reales (Priority: P2)

**Goal**: `Raro`/`Superraro`/`Megarraro`/`Legendario` tienen al menos un `catId` jugable real en el pool de gacha, cumpliendo Constitución § III/IV (spec.md FR-013).

**Independent Test**: Revisar el pool de gacha configurado y confirmar que cada rareza ofrecida por al menos un banner tiene uno o más `catId` con stats/habilidades completas.

> Esta historia ya queda satisfecha por Foundational (T002 crea las unidades, T005 arma `GACHA_POOL`, T006 audita que ningún tier esté vacío) — la única tarea propia es la auditoría formal que cierra explícitamente sus Acceptance Scenarios.

- [X] T028 [US5] Auditar manualmente `src/data/gachaUnits.ts`/`GACHA_POOL` (`src/data/gacha.ts`): confirmar que `legend-cat-eclipse`/`legend-cat-supreme` tienen stats/`classification`/`attackType` completos (mismos requisitos que cualquier `Cat` de `cats.ts`) y que ninguno lleva `spriteKey` a propósito (research.md Decisión 2); re-ejecutar `npx vitest run tests/unit/data/gacha.test.ts` como evidencia — cubre Acceptance Scenarios 1-2, sin código nuevo

**Checkpoint**: US5 demostrable — auditoría en verde, cero tiers de rareza vacíos en ningún banner.

---

## Phase 8: User Story 6 - Gestionar una cápsula duplicada desde el Almacén (Priority: P2)

**Goal**: Una cápsula de un gato ya poseído se resuelve como nivel "+" (al activarla) o como intercambio por XP/NP (spec.md FR-007, FR-008, FR-009).

**Independent Test**: Con una cápsula de un gato ya poseído, activarla y confirmar que sube `plusLevel` sin crear una entrada duplicada; con otra cápsula equivalente, intercambiarla por XP o (si es `Megarraro`/`Legendario`) por NP y confirmar el saldo correspondiente.

### Tests for User Story 6

> Escribir primero — deben fallar porque `activateCapsule` todavía no distingue duplicados y `exchangeCapsuleForXp`/`exchangeCapsuleForNp` no existen

- [X] T029 [P] [US6] Ampliar `tests/unit/useMetaStore.test.ts`: `activateCapsule` sobre una cápsula de un `catId` ya en `ownedCats` incrementa `plusLevel` en 1 (`db.ownedCats.put`) y no agrega ninguna entrada nueva; `exchangeCapsuleForXp(storageRowId)` suma `currency`, elimina la fila de `gachaStorage`, no toca `plusLevel` ni `ownedCats`; `exchangeCapsuleForNp(storageRowId)` sobre una cápsula `Megarraro`/`Legendario` suma `npCurrency` y elimina la fila; `exchangeCapsuleForNp` sobre una cápsula `Raro`/`Superraro` retorna `false` sin efecto — cubre FR-007/FR-008/FR-009, Acceptance Scenarios 1-3
- [X] T030 [P] [US6] Ampliar `tests/unit/GachaScreen.test.tsx`: cada fila del Almacén ofrece "Intercambiar por XP"; una fila `Megarraro`/`Legendario` ofrece además "Intercambiar por NP"; una fila `Raro`/`Superraro` no la ofrece

### Implementation for User Story 6

- [X] T031 [US6] En `src/state/useMetaStore.ts`, ampliar `activateCapsule`: si `ownedCats[catId]` ya existe, en vez de `addOwnedCat`, incrementa `plusLevel` de esa entrada en 1 (`db.ownedCats.put`) — FR-007 — depende de T020
- [X] T032 [US6] En `src/state/useMetaStore.ts`, implementar `exchangeCapsuleForXp(storageRowId): void` (suma a `currency`, elimina la fila) y `exchangeCapsuleForNp(storageRowId): boolean` (valida `rarity` `Megarraro`/`Legendario`, suma a `npCurrency`, elimina la fila; `false` sin efecto si la rareza no califica) — FR-008/FR-009 — depende de T007
- [X] T033 [US6] En `src/screens/GachaScreen.tsx`, agregar botones "Intercambiar por XP"/"Intercambiar por NP" por fila del Almacén, condicionando "por NP" a `rarity === 'Megarraro' || rarity === 'Legendario'` — depende de T021, T032
- [X] T034 [US6] Ejecutar `npx vitest run tests/unit/useMetaStore.test.ts tests/unit/GachaScreen.test.tsx` y confirmar verde

**Checkpoint**: US6 demostrable — duplicado gestionable por las 2 vías definidas, sin entradas inválidas en `ownedCats`.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Higiene final y evidencia de no-regresión sobre el resto del proyecto

- [X] T035 [P] Añadir comentarios de una línea con referencia `specs/024-sistema-gacha` en los campos/exports nuevos (`gacha.ts`, `gachaUnits.ts`, `GachaStorageRow`/`gachaCurrency`/`npCurrency`/`plusLevel` en `db/index.ts`, las 6 acciones nuevas de `useMetaStore.ts`), siguiendo el mismo patrón de anotación ya usado en `src/data/cats.ts`/`src/data/sagaArcs.ts`
- [X] T036 Ejecutar `npx tsc -b`, `npm test`, `npm run lint` y `npm run build` — las 4 deben terminar sin errores antes de dar la feature por completa (SC-008)
- [X] T037 Pasada manual de quickstart.md Escenarios 1-7 (tirada simple, banners, activación, x11, duplicado nivel "+"/XP/NP, persistencia tras recarga) en `npm run dev`, confirmando ausencia de errores de consola (SC-005/SC-007)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias — puede empezar de inmediato
- **Foundational (Phase 2)**: Depende de Setup — BLOQUEA que cualquier historia se dé por verificable (catálogo de gacha + persistencia nueva)
- **User Story 1 (Phase 3)**: Depende de Foundational — sin dependencia de US2-US6
- **User Story 2 (Phase 4)**: Depende de Foundational y de `GachaScreen.tsx` ya reescrito en US1 (T013) — mismo archivo, secuencial
- **User Story 3 (Phase 5)**: Depende de Foundational y de US1 (T011, `rollGachaSingle` ya deposita cápsulas que activar) y T013 (`GachaScreen.tsx`)
- **User Story 4 (Phase 6)**: Depende de Foundational y de US1 (T011, `rollOne`/patrón de inserción en `gachaStorage` que `rollGachaMulti` reutiliza) y T013
- **User Story 5 (Phase 7)**: Ya satisfecha por Foundational — sin dependencia de US1-US4/US6 más allá de eso
- **User Story 6 (Phase 8)**: Depende de US3 (T020, `activateCapsule` ya existe — US6 lo amplía) y de Foundational (T007, `npCurrency`)
- **Polish (Phase 9)**: Depende de que las 6 historias estén completas

### Dentro de cada historia

- Tests (T009-T010, T015, T018-T019, T023-T024, T029-T030) se escriben antes que la implementación correspondiente y deben fallar primero
- `src/screens/GachaScreen.tsx` se toca en T013 (US1), T016 (US2), T021 (US3), T026 (US4), T033 (US6) — mismo archivo, secuencial entre historias aunque cada bloque de UI es disjunto
- `src/state/useMetaStore.ts` se toca en T007 (Foundational), T011 (US1), T020/T031 (US3/US6, misma función `activateCapsule`), T025 (US4), T032 (US6) — secuencial, no paralelizable entre historias

### Parallel Opportunities

- T002 (gachaUnits.ts) y T004 (db/index.ts) son paralelizables entre sí (archivos distintos, sin dependencia mutua)
- T006 (test de datos) puede escribirse en paralelo con T007 (useMetaStore), aunque ambos dependen de T005
- Dentro de cada historia, el test de `useMetaStore.test.ts` y el de `GachaScreen.test.tsx` son paralelizables entre sí (archivos distintos)
- US5 (Phase 7) es paralelizable con cualquier otra historia — no depende de código nuevo, solo audita Foundational
- T035 (Polish, comentarios) es paralelizable con el resto de Polish solo si toca archivos distintos a T036/T037

---

## Parallel Example: Tras completar Foundational (Phase 2)

```bash
# US1 y US5 pueden arrancar a la vez (US5 no depende de código nuevo de US1):
Task: "Ampliar tests/unit/useMetaStore.test.ts + crear tests/unit/GachaScreen.test.tsx para rollGachaSingle (US1)"
Task: "Auditar GACHA_POOL/gachaUnits.ts contra Constitución § III/IV (US5)"
```

> Nota: US2, US3, US4 y US6 dependen de que `GachaScreen.tsx`/`rollGachaSingle`/`activateCapsule` de US1/US3 ya existan — no son paralelizables entre sí en la práctica, aunque spec.md las declara independientes en su acceptance test.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (bloqueante — catálogo de gacha + persistencia)
3. Completar Phase 3: User Story 1
4. **DETENER y VALIDAR**: `npx vitest run tests/unit/useMetaStore.test.ts tests/unit/GachaScreen.test.tsx` + `npx tsc -b` en verde
5. En este punto una tirada simple ya es demostrable de punta a punta (con un único banner fijo) — MVP alcanzado

### Incremental Delivery

1. Setup + Foundational → catálogo de gacha y persistencia listos
2. US1 → tirada simple con revelado (MVP)
3. US2 → selector de banners
4. US3 → activar cápsula nueva, gato jugable de punta a punta
5. US4 → tirada x11
6. US5 → auditoría de cobertura de rarezas (ya satisfecha, se formaliza)
7. US6 → duplicados (nivel "+" o intercambio por XP/NP)
8. Polish → evidencia de no-regresión sobre el resto del proyecto

### Parallel Team Strategy

Con varios desarrolladores:

1. El equipo completa Setup + Foundational junto (T001-T008)
2. Una vez Foundational está listo:
   - Desarrollador A: User Story 1 → luego User Story 3 (dependen entre sí)
   - Desarrollador B: User Story 5 (auditoría, sin dependencias nuevas)
   - Desarrollador C: espera a que A termine T011/T013 para tomar User Story 2 o 4
3. Coordinar en `src/screens/GachaScreen.tsx` y `src/state/useMetaStore.ts` (compartidos por casi todas las historias) — el resto de archivos son disjuntos

---

## Notes

- No hay `contracts/` (proyecto 100% frontend sin interfaces externas) — sin tareas de contract test
- [P] = archivo distinto, sin dependencia de una tarea incompleta
- Commit sugerido por tarea o por grupo lógico (T002+T003, T031+T032, etc.), siguiendo el patrón de commits atómicos ya usado en las specs previas del repo
- Ningún task de esta lista modifica `src/engine/` — la Constitución § IV/VI quedan intactas; los 4 gatos nuevos usan el fallback `Graphics` ya existente, sin tocar `src/game/graphics/unitFactory.ts` (research.md Decisión 2)
- T011/T020/T025/T031/T032 son aditivos sobre `useMetaStore.ts` — ninguno modifica una acción ya existente de specs previas (`addOwnedCat`, `spendCurrency`, etc.), solo las reutiliza
