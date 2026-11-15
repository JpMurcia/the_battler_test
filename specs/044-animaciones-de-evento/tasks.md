# Tasks: Animaciones de Evento

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md), [data-model.md](./data-model.md), [quickstart.md](./quickstart.md)

**Tests**: Vitest. FR-011 exige pruebas de las poses y la detección. Nuevos: `tests/unit/game/eventAnimations.test.ts` y `tests/unit/game/motionPreference.test.ts`. Ajustado: `tests/unit/game/animation.test.ts`. Las suites de motor, combate y balance no se tocan (SC-007).

## Format: `- [ ] [ID] [P?] [Story] Description`

- **[P]**: paralelizable (archivos distintos, sin dependencias abiertas).
- **[Story]**: US1 Golpeado, US2 Muerte, US3 Aparición, US4 Retroceso.

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: la matemática pura y la preferencia de movimiento que usan las cuatro historias.

- [X] T001 [P] Crea `src/game/motionPreference.ts` con `prefersReducedMotion(): boolean` (matchMedia cacheado, `false` sin `window.matchMedia` o si lanza) y `resetMotionPreferenceCache()` para tests (research.md Decisión 8).
- [X] T002 [P] Crea `tests/unit/game/motionPreference.test.ts`: `false` sin `matchMedia`; refleja `.matches` de un `matchMedia` simulado, también si cambia en vivo; consulta la media query exacta `(prefers-reduced-motion: reduce)`.
- [X] T003 Crea `src/game/eventAnimations.ts` con `EVENT_ANIMATION` (data-model.md § 1), tipos `UnitEventState`, `UnitEventObservation`, `UnitEventPose` y `createUnitEventState()` (data-model.md § 3).
- [X] T004 Regresión: `npx tsc -b` limpio (depende de T001, T003).

**Checkpoint**: módulos base compilando; nada visible cambia.

---

## Phase 2: User Story 1 - Golpeado (Priority: P1) 🎯 MVP

**Goal**: destello y sacudida de 0,15 s en el cuerpo golpeado, ≤ 3 por segundo, nunca con reducir movimiento.

**Independent Test**: spec.md Historia 1; quickstart.md § 2.

- [X] T005 [US1] En `src/game/eventAnimations.ts`: `getHitPose(elapsed)` (data-model.md § 2), la parte de golpe de `updateUnitEvents` (avance de temporizadores, detección por vida o escudo, límite `hitMinIntervalSeconds`, `reduced` no inicia) y `getUnitEventPose` (composición completa de data-model.md § 4, con `clamp` de rotación).
- [X] T006 [P] [US1] Crea `src/game/graphics/hitFlash.ts` con `HIT_FLASH_MATRIX` y `getHitFlashFilter()` perezoso y compartido (research.md Decisión 3).
- [X] T007 [US1] Tests en `tests/unit/game/eventAnimations.test.ts`: `getHitPose` empieza con destello, sacude ≤ 1,5 px y termina en `{0,false}`; bajada de vida o de escudo inicia el golpe; sin bajada no; segundo golpe antes de 1/3 s se ignora y después no; con `reduced` nunca; 30 golpes en 1 s producen ≤ 3 inicios; sin eventos `getUnitEventPose` devuelve la pose base intacta; `HIT_FLASH_MATRIX` aclara (diagonal < 1, desplazamiento > 0, alfa 1).
- [X] T008 [US1] `src/game/UnitSprite.tsx`: `eventsRef = useRef(createUnitEventState())`; en el `useTick` llama a `updateUnitEvents` con `{ x: unit.x, screenX: laneX, hp: unit.hp, shield: unit.shieldRemainingHp ?? 0, team }` y `prefersReducedMotion()`, compone con `getUnitEventPose` y aplica `x/y/scale/rotation/alpha` al contenedor; `bodySpriteRef` para el `pixiSprite` de diseño; asigna/quita `getHitFlashFilter()` en el cuerpo (sprite animado o de diseño) solo cuando `flash` cambia.

**Checkpoint**: golpes visibles en batalla; el resto igual.

---

## Phase 3: User Story 2 - Muerte (Priority: P1)

**Goal**: el eco salta hacia su base, gira y se desvanece en 0,45 s.

**Independent Test**: spec.md Historia 2; quickstart.md § 3.

- [X] T009 [US2] En `src/game/eventAnimations.ts`: `getDeathPose(elapsed, team, reduced)` (data-model.md § 2).
- [X] T010 [US2] Tests: arranca en la pose neutra con alfa 1; termina con alfa 0 en `deathSeconds`; jugador va a −x y gira antihorario, enemigo al revés; `reduced` solo cambia alfa; `deathSeconds ≤ 0,5`.
- [X] T011 [US2] `src/game/DeathEchoSprite.tsx`: cuenta `elapsed` hacia arriba hasta `EVENT_ANIMATION.deathSeconds`; pivote `(bodyWidth/2, bodyHeight)` y `x = screenX + bodyWidth/2`; aplica `getDeathPose` (offset, rotación, alfa) sin escalar. Mantiene `ECHO_TINT` y el fotograma de reposo (spec 042).
- [X] T012 [US2] `src/game/animation.ts`: elimina `DEATH_ECHO_DURATION_SECONDS`, `getDeathEchoDurationSeconds` y `getDeathEchoPose`; en `tests/unit/game/animation.test.ts` elimina el `describe('getDeathEchoPose')`; actualiza la referencia del comentario de `src/game/graphics/cyberEffects.ts`.

**Checkpoint**: muertes con la nueva animación.

---

## Phase 4: User Story 3 - Aparición (Priority: P2)

**Goal**: toda unidad que entra al campo salta aplastada → estirada → normal en 0,3 s, con su anillo surgiendo a la vez.

**Independent Test**: spec.md Historia 3; quickstart.md § 1.

- [X] T013 [US3] En `src/game/eventAnimations.ts`: `getSpawnPose(elapsed, reduced)` y su uso en `getUnitEventPose` (`alpha`, `ringAlpha`, escalas, `offsetY`).
- [X] T014 [US3] Tests: estado nuevo arranca con aparición; pose inicial aplastada (scaleX > 1, scaleY < 1) y casi transparente; termina en `{0,1,1,1}` a 0,3 s y el temporizador pasa a `null`; `reduced` solo fundido; combinada con un golpe suma la sacudida.
- [X] T015 [US3] `src/game/UnitSprite.tsx`: aplica `ringAlpha` al anillo (la aparición ya llega por `getUnitEventPose` desde T008).

---

## Phase 5: User Story 4 - Retroceso (Priority: P2)

**Goal**: el empujón se ve como un deslizamiento de 0,25 s con inclinación hacia atrás; el anillo lo acompaña.

**Independent Test**: spec.md Historia 4; quickstart.md § 4.

- [X] T016 [US4] En `src/game/eventAnimations.ts`: `getKnockbackPose(elapsed, startOffsetPx, team)` y la detección de empujón en `updateUnitEvents` (sentido por bando, inicio desde la posición visible, `reduced` no inicia).
- [X] T017 [US4] Tests: jugador con `x` menor → retroceso con `startOffsetPx > 0` en pantalla; enemigo con `x` mayor → `startOffsetPx < 0`; avance normal no dispara; termina en 0 a 0,25 s; un segundo empujón a mitad continúa desde la posición visible; inclinación ≤ 0,17 rad hacia atrás según bando; rotación total acotada a 0,2 con ataque; `reduced` no inicia.
- [X] T018 [US4] `src/game/UnitSprite.tsx`: el anillo usa `laneX + ringOffsetX`.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T019 Regresión completa: `npx tsc -b`, `npx oxlint`, `npx vitest run`; `git diff --stat master -- src/engine` vacío.
- [X] T020 Verificación en navegador (quickstart.md §§ 1–7): aparición, golpe, muerte, retroceso (inyectando un empujón), reducir movimiento y consola sin errores.
- [X] T021 [P] Documentación: `docs/art/investigacion-pipeline-arte-ia.md` (§5.2, filas 3–6 marcadas como implementadas en spec 044) y `docs/art/art-bible.md` (nota breve en la sección de animación sobre las 4 reacciones y el límite de destellos).

---

## Dependencies & Execution Order

- Phase 1 → todas las historias. T005 define `updateUnitEvents`/`getUnitEventPose`, que T013 y T016 amplían: dentro de `eventAnimations.ts` las tareas son secuenciales (T005 → T009 → T013 → T016).
- `UnitSprite.tsx`: T008 → T015 → T018 (mismo archivo).
- US2 (T011, T012) es independiente de US1/US3/US4 salvo `eventAnimations.ts`.
- Polish al final.

## Parallel Opportunities

- T001/T002 con T003.
- T006 con T005.
- T021 con T019–T020.

## Implementation Strategy

MVP = Phase 1 + US1 (golpe). Después US2 (muerte), US3 (aparición) y US4 (retroceso), validando cada una en el navegador.
