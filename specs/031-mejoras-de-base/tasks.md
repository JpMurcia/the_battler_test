---

description: "Task list for feature 031-mejoras-de-base"
---

# Tasks: Mejoras de Base

**Input**: Design documents from `/specs/031-mejoras-de-base/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Incluidos, siguiendo TDD.

**Organization**: US1 (subir de nivel) es la base de datos/persistencia que US2 (cañón) y US3 (base/investigación/contabilidad/energía) consumen — US1 debe completarse primero; US2 y US3 son independientes entre sí (tocan archivos distintos: US2 solo `startLevel`'s specialCannon, US3 toca playerBase/deployUnit/BattleOutcomeWatcher/missionEnergy).

## Format: `[ID] [P?] [Story] Description`

## Path Conventions

Single-project: `src/`, `tests/` en la raíz.

---

## Phase 1: Setup

- [X] T001 Ejecutar `npx tsc -b` y `npm test` y confirmar línea base en verde

---

## Phase 2: Foundational — catálogo de datos y persistencia

**Purpose**: Ambas historias dependen del catálogo puro y de la tabla Dexie/campo de store — se construyen una sola vez aquí.

- [X] T002 [P] Crear `tests/unit/data/baseUpgrades.test.ts`: `getBaseUpgradeCost` creciente por nivel; cada función de efecto (`getCannonPowerBonus`, `getCannonRangeBonus`, `getCannonChargeReduction`, `getBaseDefenseBonus`, `getResearchCooldownReduction`, `getAccountingMultiplier`, `getEnergyCapBonus`) devuelve 0 (o 1 para el multiplicador) en nivel 0 y crece linealmente según research.md Decisión 5 — confirmar que fallan (el archivo no existe)
- [X] T003 Crear `src/data/baseUpgrades.ts` según data-model.md
- [X] T004 Ejecutar `tests/unit/data/baseUpgrades.test.ts` y confirmar que T002 pasa
- [X] T005 En `src/db/index.ts`: añadir `BaseUpgradesRow`, tabla `baseUpgrades: Table<BaseUpgradesRow, number>`, `this.version(12).stores({ baseUpgrades: 'id' })`
- [X] T006 [P] Añadir casos a `tests/unit/useMetaStore.test.ts`: `hydrate()` sobre una base vacía deja `baseUpgrades: {}`; `upgradeBaseUpgrade(id)` con moneda suficiente sube el nivel en 1, descuenta el costo exacto de `getBaseUpgradeCost`, y persiste (releer vía `hydrate()` tras `db.baseUpgrades.get(1)`); sin moneda suficiente devuelve `false` sin mutar; en el tope de nivel (10) devuelve `false` sin mutar; `getBaseUpgradeCurrencyMultiplier()` devuelve `getAccountingMultiplier(baseUpgrades.accounting ?? 0)` (Acceptance Scenarios 1-4 de `spec.md` US1) — confirmar que fallan
- [X] T007 En `src/state/useMetaStore.ts`: añadir `baseUpgrades: Record<BaseUpgradeId, number>` a `MetaState`/`IDLE`-equivalente (default `{}`), poblarlo en `hydrate()` desde `db.baseUpgrades.get(1)` (`?.levels ?? {}`, mismo patrón que `evolutionItems`), añadir acción `upgradeBaseUpgrade(id)` (mismo patrón que `upgradeCat`: valida tope vía `BASE_UPGRADES.find(...).maxLevel`, costo vía `getBaseUpgradeCost`, descuenta `currency`, `db.baseUpgrades.put({ id: 1, levels })`), y añadir `getBaseUpgradeCurrencyMultiplier()`
- [X] T008 Ejecutar `tests/unit/useMetaStore.test.ts` y confirmar que T006 pasa y que ninguna prueba existente se rompe

**Checkpoint**: Catálogo y persistencia listos — ninguna mejora tiene efecto en batalla todavía (eso es US2/US3).

---

## Phase 3: User Story 1 - Subir de nivel una mejora desde la UI (Priority: P1)

**Goal**: Pestaña "Mejoras de Base" en `UpgradeScreen`.

**Independent Test**: Con moneda suficiente, subir una mejora desde la pestaña y confirmar nivel/costo actualizados y persistencia.

### Tests for User Story 1

- [X] T009 [US1] Añadir casos a `tests/unit/UpgradeScreen.test.tsx`: existe una pestaña "Mejoras de Base"; al seleccionarla se listan las 7 mejoras con su nivel/costo; con moneda suficiente, pulsar "Mejorar" sube el nivel mostrado e invoca `upgradeBaseUpgrade`; sin moneda suficiente o en el tope, el botón está deshabilitado; cambiar a la pestaña "Unidades" y de vuelta no altera el comportamiento de mejora de unidades ya probado (Acceptance Scenarios 1-5 de `spec.md` US1) — confirmar que fallan

### Implementation for User Story 1

- [X] T010 [US1] En `src/screens/UpgradeScreen.tsx`: añadir `useState<'units' | 'base'>('units')` para la pestaña activa, 2 botones de pestaña; extraer el contenido actual (lista de unidades + `UserRankSection`) bajo la condición `tab === 'units'`; añadir un bloque `tab === 'base'` que liste `BASE_UPGRADES`, mostrando nivel actual (`baseUpgrades[id] ?? 0`), costo (`getBaseUpgradeCost(nivel actual)`) y un botón "Mejorar" (`disabled` si `currency < costo` o `nivel >= maxLevel`, `onClick` invoca `upgradeBaseUpgrade(id)`)
- [X] T011 [US1] Ejecutar `tests/unit/UpgradeScreen.test.tsx` y confirmar que T009 pasa y que ninguna prueba existente de esa pantalla se rompe

**Checkpoint**: El jugador puede subir de nivel las 7 mejoras desde la UI (SC-001).

---

## Phase 4: User Story 2 - El cañón especial refleja Potencia/Alcance/Recarga (Priority: P2)

**Goal**: `startLevel()` aplica los 3 bonos de cañón al `specialCannon` inicial de cada batalla.

**Independent Test**: Subir Potencia de Cañón, iniciar un nivel, confirmar que `specialCannon.damage` es mayor que el valor base.

### Tests for User Story 2

- [X] T012 [P] [US2] Añadir casos a `tests/unit/useGameStore.test.ts`: con `baseUpgrades.cannonPower/cannonRange/cannonCharge` en nivel >0 (mockeando `useMetaStore`), `startLevel()` produce un `specialCannon` con `damage`/`areaRadius` mayores y `rechargeDurationSeconds` menor (nunca bajo `MIN_CANNON_RECHARGE_SECONDS`) que los valores por defecto; con las 3 en nivel 0, `specialCannon` es idéntico al valor por defecto actual (Acceptance Scenarios 1-4 de `spec.md` US2) — confirmar que fallan

### Implementation for User Story 2

- [X] T013 [US2] En `src/state/useGameStore.ts`, dentro de `startLevel()`: leer `useMetaStore.getState().baseUpgrades`, calcular `specialCannon` inicial con `getCannonPowerBonus`/`getCannonRangeBonus`/`getCannonChargeReduction` (data-model.md) en vez de `{ ...SPECIAL_CANNON_DEFAULTS, rechargeRemaining: SPECIAL_CANNON_DEFAULTS.rechargeDurationSeconds }` tal cual
- [X] T014 [US2] Ejecutar `tests/unit/useGameStore.test.ts` completo, confirmar que T012 pasa y que `tests/unit/useGameStore.activateSpecialCannon` (specs/012) y `tests/unit/engine/simulation.test.ts` no se rompen

**Checkpoint**: El cañón especial en batalla refleja las mejoras (SC-002).

---

## Phase 5: User Story 3 - Defensa de Base, Investigación, Contabilidad y Energía (Priority: P2)

**Goal**: Los 4 bonos restantes se aplican en `startLevel()`, `deployUnit()`, `BattleOutcomeWatcher` y el cálculo de `missionEnergy.max`.

**Independent Test**: Subir cada una de las 4 mejoras por separado y confirmar su efecto en una batalla/victoria/Hub de prueba.

### Tests for User Story 3

- [X] T015 [P] [US3] Añadir casos a `tests/unit/useGameStore.test.ts`: con `baseUpgrades.baseDefense` en nivel >0, `startLevel()` produce `playerBase.maxHp`/`hp` mayores que `level.playerBaseHp`; con `baseUpgrades.research` en nivel >0, `deployUnit()` asigna un `deployCooldowns[catId]` menor que `cat.cooldownSeconds` (nunca bajo `MIN_UNIT_COOLDOWN_SECONDS`) — confirmar que fallan
- [X] T016 [P] [US3] Añadir casos a `tests/unit/BattleScreen.test.tsx`: en victoria, con `baseUpgrades.accounting` en nivel >0 (vía `useMetaStore`), la moneda otorgada por `BattleOutcomeWatcher` incluye el multiplicador de `getBaseUpgradeCurrencyMultiplier()`, combinado con los 2 multiplicadores ya existentes — confirmar que falla
- [X] T017 [P] [US3] Añadir casos a `tests/unit/useMetaStore.test.ts`: con `baseUpgrades.energyCap` en nivel >0, `hydrate()` y el recálculo de `upgradeCat()` producen `missionEnergy.max` mayor que `computeMissionEnergyMax(characterLevel)` solo — confirmar que fallan

### Implementation for User Story 3

- [X] T018 [US3] En `src/state/useGameStore.ts`: `startLevel()` suma `getBaseDefenseBonus(...)` a `playerBase.hp`/`maxHp`; `deployUnit()` calcula `deployCooldowns[catId]` con `getResearchCooldownReduction(...)` y el piso `MIN_UNIT_COOLDOWN_SECONDS`
- [X] T019 [US3] En `src/screens/BattleScreen.tsx`, `BattleOutcomeWatcher`: multiplicar la recompensa de moneda por `getBaseUpgradeCurrencyMultiplier()` (`useMetaStore`), junto a `getActiveBonusMultiplier`/`getActiveComboBonusMultiplier` ya existentes
- [X] T020 [US3] En `src/state/useMetaStore.ts`: sumar `getEnergyCapBonus(baseUpgrades.energyCap ?? 0)` al `max` de `missionEnergy` en `hydrate()` y en el recálculo de `upgradeCat()` (mismo punto donde hoy se recalcula `max`/`regenPerSecond` por nivel de personaje)
- [X] T021 [US3] Ejecutar `tests/unit/useGameStore.test.ts`, `tests/unit/BattleScreen.test.tsx` y `tests/unit/useMetaStore.test.ts` completos, confirmar que T015/T016/T017 pasan y que ninguna prueba existente se rompe

**Checkpoint**: Las 4 mejoras restantes tienen efecto verificable en batalla/Hub (SC-003 a SC-006).

---

## Phase 6: Polish & Verificación Final

- [X] T022 Ejecutar `npx tsc -b` y `npm test` completos, confirmar 0 errores/0 fallos (SC-007, incluye FR-012: con las 7 mejoras en nivel 0, sin regresión)
- [X] T023 Verificación manual en navegador siguiendo `quickstart.md`

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 (Foundational, bloquea US1/US2/US3) → US1 (Phase 3, UI de subida de nivel) → US2 (Phase 4) y US3 (Phase 5) en paralelo (archivos disjuntos entre sí, ambas ya pueden asumir que `baseUpgrades`/`upgradeBaseUpgrade` existen desde Phase 2) → Phase 6.

## Implementation Strategy

**MVP = User Story 1** (Phase 3): sin la UI de subida de nivel, ninguna mejora es alcanzable — es el primer entregable con valor demostrable (el jugador ve y sube mejoras, aunque su efecto en batalla llegue en US2/US3).
