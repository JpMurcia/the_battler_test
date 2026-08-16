---
description: "Task list template for feature implementation"
---

# Tasks: Datos Semilla, Assets Procedimentales y Flujo de Navegación

**Input**: Design documents from `specs/022-datos-semilla-flujo-navegacion/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [quickstart.md](quickstart.md)

**Tests**: Incluidos — el proyecto ya tiene cobertura Vitest para cada feature previa (`tests/unit/`) y `quickstart.md` de esta feature depende de que existan `seedData.test.ts`, `unitFactory.test.ts` y `AppFlow.test.tsx`.

**Organization**: Tareas agrupadas por historia de usuario (US1/US2/US3 de [spec.md](spec.md)) para que cada una sea implementable y verificable de forma independiente.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivo distinto, sin dependencia de una tarea incompleta)
- **[Story]**: Historia de usuario a la que pertenece (US1, US2, US3)
- Cada tarea incluye la ruta de archivo exacta

## Path Conventions

Proyecto único (SPA React + Pixi.js): `src/`, `tests/unit/` en la raíz del repo — ver plan.md § Project Structure.

---

## Phase 1: Setup

**Purpose**: Confirmar que no hace falta infraestructura nueva antes de tocar código de la feature

- [X] T001 Confirmar que `src/game/graphics/` no existe todavía y que `oxlint`/`vitest` (configuración raíz, sin globs explícitos por carpeta) cubrirán los archivos nuevos sin cambios de configuración — no crea código, solo verifica supuestos de research.md antes de empezar

**Checkpoint**: Sin bloqueos de tooling — se puede empezar Foundational.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Definir el contrato de tipos y el adaptador que las 3 historias de usuario comparten (data-model.md § SeedUnit / § Adaptador)

**⚠️ CRITICAL**: Ninguna historia de usuario puede empezar hasta que este archivo compile con los tipos y la firma del adaptador ya definidos

- [X] T002 Crear `src/data/seedData.ts` con los tipos `SeedRarity`, `SeedTargetType`, `SeedTrait`, `ProceduralShape`, `SeedUnitStats`, `ProceduralDesign`, `SeedUnit` exactamente como en data-model.md § SeedUnit, más arrays `SEED_UNITS: SeedUnit[] = []` y `SEED_ENEMIES: SeedUnit[] = []` vacíos (se rellenan en US1)
- [X] T003 En `src/data/seedData.ts`, implementar `seedUnitToCat(unit: SeedUnit): Cat` según la tabla de mapeo de research.md Decisión 1 (incluye derivar `width` desde `proceduralDesign.size` con la misma escala que `getVisualProfile` usa para `bodyWidth`), y exportar `SEED_CATS_AS_CATS`/`SEED_ENEMIES_AS_CATS` como `SEED_UNITS.map(seedUnitToCat)`/`SEED_ENEMIES.map(seedUnitToCat)` (depende de T002)

**Checkpoint**: `seedData.ts` compila, exporta tipos + adaptador + arrays vacíos — listo para que US1 los rellene.

---

## Phase 3: User Story 1 - Catálogo semilla de unidades y enemigos (Priority: P1) 🎯 MVP

**Goal**: Un catálogo semilla completo y consistente (4 gatos por rareza + 3 enemigos) disponible como datos, con todos los campos obligatorios y estadísticas coherentes con su arquetipo (spec.md FR-001 a FR-003).

**Independent Test**: `npx vitest run tests/unit/data/seedData.test.ts` en verde, sin depender de UI ni del motor de render.

### Tests for User Story 1

> Escribir primero — deben fallar contra los arrays vacíos de T002 antes de completar T005/T006

- [X] T004 [P] [US1] Test en `tests/unit/data/seedData.test.ts`: `SEED_UNITS` tiene 4 entradas (una por `SeedRarity`), `SEED_ENEMIES` tiene 3 entradas con `traits` `[]`/`['Red']`/`['Floating']`, y `seedUnitToCat()` produce un `Cat` con todos los campos requeridos por el motor — ver quickstart.md § 1 para las aserciones exactas de arquetipo (UberRare = costo/spawnCooldown más altos; Rare = hp más alto con attackRange más bajo)

### Implementation for User Story 1

- [X] T005 [US1] Rellenar `SEED_UNITS` en `src/data/seedData.ts` con las 4 entradas de la tabla de data-model.md § Catálogo semilla (`seed-cat-basic`, `seed-cat-wall`, `seed-cat-ranged`, `seed-cat-titan`), incluyendo `proceduralDesign` para cada una (depende de T002; mismo archivo que T006, no paralelizable con ella)
- [X] T006 [US1] Rellenar `SEED_ENEMIES` en `src/data/seedData.ts` con las 3 entradas de la tabla de data-model.md § Catálogo semilla (`seed-enemy-dog`, `seed-enemy-red-snake`, `seed-enemy-floating-hippo`), incluyendo `proceduralDesign` para cada una (depende de T002; mismo archivo que T005, no paralelizable con ella)
- [X] T007 [US1] En `src/data/cats.ts`, importar `SEED_CATS_AS_CATS`/`SEED_ENEMIES_AS_CATS` de `./seedData` y hacer spread al final del array `CATS` (append, sin tocar las 12 entradas de producción existentes) — depende de T003, T005, T006
- [X] T008 [US1] Ejecutar `npx vitest run tests/unit/data/seedData.test.ts` y confirmar verde; ejecutar `npm test` completo y confirmar que las 21 features previas (fixtures de `CATS`) siguen en verde tras el append de T007

**Checkpoint**: El catálogo semilla existe, es válido, y convive con el catálogo de producción sin romper nada — MVP alcanzado (US1 es demostrable con solo datos, sin UI).

---

## Phase 4: User Story 2 - Representación visual generada proceduralmente (Priority: P2)

**Goal**: Cada entrada del catálogo semilla se renderiza con una textura generada por PixiJS a partir de su `proceduralDesign`, cacheada y reutilizada entre instancias (spec.md FR-004 a FR-006).

**Independent Test**: `npx vitest run tests/unit/game/unitFactory.test.ts` en verde (caché de texturas verificada con spy sobre `generateTexture`), más una comprobación visual manual en el navegador embebido (quickstart.md § 2).

### Tests for User Story 2

> Escribir primero — deben fallar sin `unitFactory.ts` implementado

- [X] T009 [P] [US2] Test en `tests/unit/game/unitFactory.test.ts`: `drawSeedUnit()` es determinista para el mismo `ProceduralDesign`; `getOrCreateUnitTexture()` llama a `renderer.generateTexture()` una sola vez por combinación única `(seedUnitId, role)` (usar un `Renderer`/`generateTexture` mockeado, no un renderer real); dos `ProceduralDesign` distintos producen entradas de caché distintas — ver quickstart.md § 2

### Implementation for User Story 2

- [X] T010 [US2] Crear `src/game/graphics/unitFactory.ts` con `drawSeedUnit(g: Graphics, design: ProceduralDesign, role: 'ally' | 'enemy'): void` (cuerpo vía `roundRect`/`circle` según `design.baseShape`, orejas de gato con `poly` para `role === 'ally'` o el rasgo del enemigo para `role === 'enemy'`, ojos/boca simples) según research.md Decisión 2 (depende de T002 para el tipo `ProceduralDesign`)
- [X] T011 [US2] En `src/game/graphics/unitFactory.ts`, implementar `getOrCreateUnitTexture(renderer, seedUnitId, design, role)` con caché `Map<string, Texture>` module-level keyed por `` `${seedUnitId}:${role}` ``, y `clearUnitTextureCache()` para tests (depende de T010)
- [X] T012 [US2] En `src/game/UnitSprite.tsx`, añadir el tercer nivel de fallback: si el `Cat` resuelto no tiene `spriteKey` pero su `id` existe en `SEED_UNITS`/`SEED_ENEMIES` (de `src/data/seedData.ts`), usar `getOrCreateUnitTexture` vía un `pixiSprite` con la textura cacheada en lugar del `Graphics` derivado de stats — conservar el `Graphics` actual como último fallback sin cambios (depende de T005, T006, T011)
- [X] T013 [US2] Ejecutar `npx vitest run tests/unit/game/unitFactory.test.ts` y confirmar verde; ejecutar `npx vitest run tests/unit/game/animation.test.ts` y `tests/unit/BattleScreen.test.tsx` para confirmar que el fallback `Graphics` existente (unidades de producción sin `spriteKey`) no cambió de comportamiento

**Checkpoint**: El catálogo semilla se ve en pantalla con identidad visual propia y reutiliza texturas cacheadas — US1 + US2 demostrables juntas sin tocar navegación todavía.

---

## Phase 5: User Story 3 - Flujo de navegación de principio a fin (Priority: P3)

**Goal**: El catálogo semilla es jugable de punta a punta a través de las 6 pantallas ya existentes (Título → Menú → Equipo → Mejoras → Batalla → Resultado → Menú), sin construir pantallas nuevas (spec.md FR-007 a FR-013).

**Independent Test**: `npx vitest run tests/unit/AppFlow.test.tsx` en verde, cubriendo los 7 escenarios de aceptación de US3; complementado con una pasada manual en el navegador embebido (quickstart.md § 3).

### Tests for User Story 3

> Escribir primero — deben fallar sin el nivel de demostración ni fixtures de roster listos

- [X] T014 [P] [US3] Test de integración en `tests/unit/AppFlow.test.tsx`: monta `<App />` con `fake-indexeddb`, hidrata un roster con las 4 unidades de `SEED_UNITS` adaptadas, y recorre Título → Menú → Equipo (equipar 5-10) → Batalla → forzar Victoria → Resultado → Menú, aserting en cada paso el contenido de spec.md Acceptance Scenarios 1-7 de US3 (ver quickstart.md § 3, incluye el caso de Derrota y el edge case de alineación vacía)

### Implementation for User Story 3

- [X] T015 [US3] En `src/data/levels.ts`, añadir una entrada `Level` de demostración cuyo `enemyWave` referencie `seed-enemy-dog`, `seed-enemy-red-snake`, `seed-enemy-floating-hippo` por `catId` (data-model.md § Nivel de demostración) — depende de T006, T007
- [X] T016 [US3] Si `AppFlow.test.tsx` (T014) revela fricción real de navegación (p. ej. el botón de batalla no se deshabilita sin alineación — spec.md Edge Cases), corregir el punto exacto en la pantalla correspondiente (`src/screens/TeamScreen.tsx` o `src/screens/BattleScreen.tsx`) — NO crear pantallas nuevas (Constitución § VII); si no hay fricción, esta tarea se cierra sin cambios de código
- [X] T017 [US3] Ejecutar `npx vitest run tests/unit/AppFlow.test.tsx` y confirmar verde; hacer la pasada manual de quickstart.md § 3 en el navegador embebido (Menú → Equipo → Batalla con el nivel de T015) y confirmar visualmente HUD superior/inferior y el modal de resultado

**Checkpoint**: Las 3 historias de usuario funcionan juntas de extremo a extremo — feature completa y demostrable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Higiene final y evidencia de no-regresión sobre el catálogo de producción existente

- [X] T018 [P] Añadir comentarios JSDoc de una línea con referencia `specs/022-datos-semilla-flujo-navegacion` en los campos/exports nuevos de `src/data/seedData.ts` y `src/game/graphics/unitFactory.ts`, siguiendo el mismo patrón de anotación ya usado en `src/data/cats.ts`/`src/engine/types.ts`
- [X] T019 Actualizar `specs/022-datos-semilla-flujo-navegacion/checklists/requirements.md` si algún ítem quedó afectado por decisiones tomadas durante la implementación (no debería, pero es el punto de revisión final)
- [X] T020 Ejecutar la suite completa de quickstart.md § 4-5: `npm test`, `npm run lint`, `npm run build` — las 3 deben terminar sin errores antes de dar la feature por completa

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias — puede empezar de inmediato
- **Foundational (Phase 2)**: Depende de Setup — BLOQUEA las 3 historias de usuario
- **User Story 1 (Phase 3)**: Depende de Foundational — sin dependencia de US2/US3
- **User Story 2 (Phase 4)**: Depende de Foundational; T012 depende además de que T005/T006 (US1) existan, porque el fallback nuevo busca los `id` del catálogo semilla — por eso US2 se implementa después de US1 en este plan, aunque conceptualmente su test (T009) es independiente
- **User Story 3 (Phase 5)**: Depende de Foundational; T015 depende de que `SEED_ENEMIES`/`CATS` (US1) ya tengan los 3 enemigos; el resto de US3 no depende de que US2 esté terminada (la navegación funciona con el fallback `Graphics` igualmente) — pero para la validación visual completa de quickstart.md § 3 conviene tener US2 hecha primero
- **Polish (Phase 6)**: Depende de que las 3 historias estén completas

### Dentro de cada historia

- Tests (T004, T009, T014) se escriben antes que la implementación correspondiente y deben fallar primero
- T005/T006 (mismo archivo `seedData.ts`) son secuenciales entre sí, no paralelas
- T010 antes de T011 (mismo archivo `unitFactory.ts`)

### Parallel Opportunities

- T004 (test US1) puede escribirse en paralelo con T002/T003 (Foundational), aunque solo pasará en verde después de T005/T006
- T009 (test US2) puede escribirse en paralelo con el resto de Foundational/US1
- T014 (test US3) puede escribirse en paralelo con el resto de Foundational/US1/US2
- T018 (Polish, comentarios) es paralelizable con T019/T020 solo si se toca archivos distintos

---

## Parallel Example: User Story 1

```bash
# T004 (test) puede escribirse mientras T002/T003 (Foundational) todavía están en curso:
Task: "Test en tests/unit/data/seedData.test.ts para SEED_UNITS/SEED_ENEMIES/seedUnitToCat"

# T005 y T006 tocan el mismo archivo (src/data/seedData.ts) — ejecutar en secuencia, no en paralelo
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (bloqueante)
3. Completar Phase 3: User Story 1
4. **DETENER y VALIDAR**: `npx vitest run tests/unit/data/seedData.test.ts` + `npm test` completo en verde
5. En este punto el catálogo semilla ya existe y convive con producción — MVP demostrable en código, aunque todavía no visible en pantalla

### Incremental Delivery

1. Setup + Foundational → base lista
2. US1 → catálogo semilla validado por datos (MVP)
3. US2 → catálogo semilla visible y distinguible en el campo de batalla
4. US3 → catálogo semilla jugable de punta a punta a través de las 6 pantallas existentes
5. Polish → evidencia de no-regresión sobre las 21 features previas

---

## Notes

- No hay `contracts/` (proyecto 100% frontend sin interfaces externas) — sin tareas de contract test
- [P] = archivo distinto, sin dependencia de una tarea incompleta
- Commit sugerido por tarea o por grupo lógico (T002+T003, T005+T006, etc.), siguiendo el patrón de commits atómicos ya usado en las specs previas del repo
- Ningún task de esta lista modifica `src/engine/` — la Constitución § IV/VI quedan intactas
