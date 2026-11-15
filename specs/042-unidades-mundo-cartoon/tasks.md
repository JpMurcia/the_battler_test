# Tasks: Unidades del Mundo Cartoon

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md), [data-model.md](./data-model.md), [quickstart.md](./quickstart.md)

**Tests**: Vitest. Nuevos: `tests/unit/data/unitDesigns.test.ts` (FR-012 la exige) y `tests/unit/game/teamRing.test.ts`. Ajustados: `tests/unit/game/unitFactory.test.ts` y `tests/unit/game/unitHpBar.test.ts`. Borrado: `tests/unit/game/cyberUnitBody.test.ts`. Las suites de motor, combate y balance no se tocan (SC-006).

**Organización**: extiende `specs/003` (eco de muerte, animación por transformaciones), `specs/021` (sprites y cuerpo "cyber"), `specs/022` y `specs/028` (diseños procedurales) y `specs/029` (barra de vida individual).

## Format: `- [ ] [ID] [P?] [Story] Description`

- **[P]**: se puede hacer en paralelo con otras tareas de su fase (archivos distintos, sin dependencias abiertas).
- **[Story]**: historia de `spec.md` (US1 dibujo cartoon, US2 anillo de equipo, US3 orejas, US4 eco de muerte).

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: desacoplar la barra de vida y el color de equipo del módulo "cyber", para poder borrarlo en US1 sin cambiar la barra (FR-009).

- [X] T001 [P] Crea `src/game/graphics/teamColors.ts` con `export const TEAM_INFO_COLOR: Record<BattleUnit['team'], number> = { Player: 0x22d3ee, Enemy: 0xef4444 }` y un comentario que la explique como espejo numérico de `--bc-cyan` / `--bc-red` (biblia §4; data-model.md § 5).
- [X] T002 `src/game/graphics/unitHpBar.ts`: `drawUnitHpBar(g, body: { bodyWidth: number; bodyHeight: number }, team, fraction)` en vez de `CyberBodyLayout`; usa `TEAM_INFO_COLOR` en lugar de `CYBER_TEAM_COLOR`; geometría y constantes idénticas (data-model.md § 6). En `src/game/UnitSprite.tsx`, el redibujado de la barra en el `useTick` pasa `profile` en vez de `bodyLayout`, y su guarda pasa a `hpBarRef.current && profile`. Ajusta `tests/unit/game/unitHpBar.test.ts` para que pase `{ bodyWidth: 30, bodyHeight: 30 }` sin importar `cyberUnitBody` (depende de T001).
- [X] T003 Regresión: `npx tsc -b` limpio y `npx vitest run` en verde; anota el conteo (depende de T002).

**Checkpoint**: la barra de vida ya no depende de `cyberUnitBody.ts`; nada visible cambia.

---

## Phase 2: User Story 1 - Toda unidad se ve como un dibujo animado coherente (Priority: P1) 🎯 MVP

**Goal**: las unidades sin sprite cargado se dibujan en cartoon (contorno oscuro, relleno plano, sin neón) y ninguna de las 65 usa el cuerpo "cyber" en ningún estado.

**Independent Test**: spec.md Historia 1 y quickstart.md §§ 1–3 (Gato Básico, Gato Yunque y Gato Golpe Certero).

### Datos

- [X] T004 [P] [US1] `src/data/seedData.ts`: `seed-cat-ranged` `0x22d3ee` → `0x2b8a99` y `seed-cat-titan` `0xef4444` → `0xa33a3a`, con un comentario `specs/042 (FR-005)` (data-model.md § 2.3).
- [X] T005 [P] [US1] `src/data/imperioCap1Design.ts`: `cat-deidad` `0xfacc15` → `0xa88a2c`, `enemy-saltarin-alado` `0xf472b6` → `0x9c4a76` y `cat-cuchilla` `0xdc2626` → `0xa5512f` (este último por estar duplicado con `seed-enemy-red-snake`, research.md Decisión 8), con un comentario `specs/042 (FR-005)`. Sigue con 30 entradas.
- [X] T006 [US1] Crea `src/data/unitDesigns.ts`: `EXTRA_UNIT_DESIGNS: Record<string, ProceduralDesign>` con las 28 entradas exactas de data-model.md §§ 2.1–2.2 (id, `size`, `baseShape`, `distinctiveFeature`, `primaryColor`) y `resolveUnitDesign(catId)`, que busca en `SEED_UNITS` → `SEED_ENEMIES` → `IMPERIO_CAP1_DESIGNS` → `EXTRA_UNIT_DESIGNS` y devuelve `undefined` si no encuentra nada. Comentario de cabecera con la regla de arquetipo → rasgo (research.md Decisión 9).
- [X] T007 [US1] Crea `tests/unit/data/unitDesigns.test.ts` (FR-004, FR-005, FR-012):
  - toda unidad de `CATS` tiene `spriteKey` o `resolveUnitDesign(id)` definido;
  - las 12 con `spriteKey` también tienen diseño;
  - `EXTRA_UNIT_DESIGNS` tiene 28 entradas y cada `size` es igual al `width` de su `Cat`;
  - los `primaryColor` de los diseños de todas las unidades de `CATS` son únicos;
  - ninguno es igual a un token de información: lee `--bc-cyan|orange|purple|gold|red|green|pink` de `src/theme.css` con `import.meta.glob('/src/theme.css', { query: '?raw', import: 'default', eager: true })` y `parseDeclarations` de `tests/unit/theme/tokenPolicy.ts`, igual que `designTokens.test.ts`;
  - los 28 nuevos y los 5 corregidos cumplen HSL `S < 0.69` y `L < 0.48` (helper `toHsl` local en el test, research.md Decisión 7).

  Depende de T004–T006.

### Dibujo

- [X] T008 [US1] `src/game/graphics/unitFactory.ts`: dibujo cartoon (research.md Decisiones 2 y 10; data-model.md § 3).
  - Borra `drawArmorPlates`, `drawVisorPanel`, `drawNeonRim` y el uso de `lighten` con alfa.
  - Añade `OUTLINE_COLOR = 0x0a0c14`, `outlineWidth(size) = Math.max(1.5, size * 0.08)` y `FANG_COLOR = 0xe8e2d4`.
  - Reordena `drawSeedUnit` en capas: sombra → rasgo trasero (`cat-ears`, `horns`, `crest`, `fin`, `spikes`, `wings`, `tail`) con relleno `primaryColor` y `stroke` de contorno → cuerpo con relleno y contorno → rasgo delantero (`shield` con relleno plano aclarado y opaco + contorno, `fangs` en `FANG_COLOR` + contorno) → cara en `OUTLINE_COLOR`. Divide `drawDistinctiveFeature` en una función trasera y otra delantera.
  - `getOrCreateUnitTexture` llama a `renderer.generateTexture({ target: g, resolution: 2 })`.
  - Las orejas obligatorias del aliado NO van aquí: son T017.
- [X] T009 [US1] `src/game/UnitSprite.tsx` (research.md Decisión 5):
  - Reemplaza la búsqueda de `proceduralDesign` por `resolveUnitDesign(catId)`.
  - Borra la rama de tres `Graphics` cyber (`drawBody`, `drawVisorLayer`, `drawThrusterLayer`), `visorRef`, `thrusterRef`, `bodyLayout`, `VISOR_PULSE_HZ`, `THRUSTER_PULSE_HZ` y los imports de `cyberUnitBody`.
  - Si no hay textura de sprite ni diseño: no dibuja cuerpo (sí la barra de vida) y emite `console.error` una sola vez por `catId` (un `Set` a nivel de módulo).
  - Actualiza el comentario JSDoc del componente.
  - Depende de T002, T006 y T008.
- [X] T010 [US1] `src/game/DeathEchoSprite.tsx`: sustituye `drawCyberBodyBase(..., { dimmed: true })` por un `pixiSprite` con `getOrCreateUnitTexture(app.renderer, catId, resolveUnitDesign(catId), rol)`, con la misma convención de `width`/`height`/`anchor`/`scale` que `UnitSprite`. Si no hay diseño, no dibuja cuerpo. El caso de sprite cargado (`idleFrame`) no cambia. Borra `bodyLayout` y los imports de `cyberUnitBody`. El tinte apagado es T018. Depende de T006 y T008.
- [X] T011 [US1] Borra `src/game/graphics/cyberUnitBody.ts` y `tests/unit/game/cyberUnitBody.test.ts`. Reescribe el comentario de `tests/unit/game/baseTower.test.ts:63` para que no cite el test borrado. `git grep -n "cyberUnitBody\|drawCyber\|getGlowPulseAlpha\|CYBER_TEAM_COLOR" -- src tests` no debe devolver nada (FR-002, quickstart § 2). Depende de T009 y T010.
- [X] T012 [US1] `tests/unit/game/unitFactory.test.ts`:
  - mantiene el determinismo y la caché por `(id, rol)`;
  - los 10 rasgos × 3 formas × 2 roles no lanzan;
  - `generateTexture` se llama con un objeto que incluye `resolution: 2` (`expect.objectContaining`);
  - sustituye el caso de spec 028 «ally ya no fuerza orejas» por uno que compruebe que distintos rasgos producen bounds distintos.

  Depende de T008.
- [X] T013 [US1] Regresión: `npx tsc -b`, `npx vitest run` y `npm run lint` en verde (depende de T004–T012).

**Checkpoint**: MVP. Ninguna unidad usa el cuerpo "cyber"; todas las que tienen diseño se ven cartoon.

---

## Phase 3: User Story 2 - Reconocer el bando por el anillo de equipo (Priority: P1)

**Goal**: toda unidad viva, con sprite o con diseño, muestra un anillo estático cian (aliado) o rojo (enemigo) bajo los pies.

**Independent Test**: spec.md Historia 2 y quickstart.md § 3, pasos 2 y 4.

- [X] T014 [P] [US2] Crea `src/game/graphics/teamRing.ts` (research.md Decisión 4; data-model.md § 4):
  - `computeTeamRingGeometry(bodyWidth)` devuelve `{ cx: bodyWidth / 2, rx: bodyWidth * 0.62, ry: clamp(bodyWidth * 0.2, 2, 6) }`.
  - `drawTeamRing(g, geometry, team)`: `g.clear()`, dos trazos exteriores de resplandor (ancho 5 con alfa 0,10 y ancho 3 con alfa 0,22) y el trazo principal (ancho 1,25, alfa 0,95), todos en `TEAM_INFO_COLOR[team]`, sobre `ellipse(cx, 0, rx, ry)`.
  - Sin dependencias de React.
- [X] T015 [US2] `src/game/UnitSprite.tsx`: el componente devuelve un fragmento con un `pixiGraphics` de anillo (`ringRef`, `draw` memoizado con `computeTeamRingGeometry(profile.bodyWidth)` y `team`) **antes** del `pixiContainer` del cuerpo. En el `useTick` existente: `ring.x = laneX` y `ring.y = laneY`, sin rebote, escala ni giro. El anillo no pulsa ni cambia de alfa (FR-008, FR-013). Depende de T009 y T014.
- [X] T016 [US2] Crea `tests/unit/game/teamRing.test.ts`:
  - `computeTeamRingGeometry` es proporcional (`rx` crece con `bodyWidth`) y `ry` está acotado a [2, 6] para anchos de 12 y 44;
  - `cx === bodyWidth / 2`;
  - `drawTeamRing` no lanza para `Player`/`Enemy` y produce bounds no vacíos de ancho ≈ `2 × rx` más el trazo.

  Depende de T014.

**Checkpoint**: US1 + US2. El bando se lee por el anillo en todo el campo.

---

## Phase 4: User Story 3 - Los aliados se leen como gatos (Priority: P2)

**Goal**: todo aliado con diseño muestra orejas de gato además de su rasgo; los enemigos nunca.

**Independent Test**: spec.md Historia 3 y quickstart.md § 3, pasos 2 y 3.

- [X] T017 [US3] `src/game/graphics/unitFactory.ts` (research.md Decisión 3; data-model.md § 3):
  - Añade `headFrame(shape, half)`: `circle`/`rect` → `{ top: -half, halfWidth: half }`; `poly` → `{ top: -0.45 * half, halfWidth: 0.28 * half }`.
  - Reescribe los rasgos de cabeza (`horns`, `crest`, `spikes`, `fin`, `cat-ears`) en función de `top`/`halfWidth`. En `circle` y `rect` conservan la geometría de hoy, salvo las bases, que se hunden `0.15 × half` para que el contorno del cuerpo las tape.
  - `drawCatEars(g, design, layout: 'default' | 'flanking')` con relleno `primaryColor` + contorno, base hundida `0.15 × half` dentro del cuerpo y alto `size × 0.28`.
  - En `drawSeedUnit`, si `role === 'ally'` y el rasgo no es `cat-ears`, dibuja orejas en la capa trasera, con `'flanking'` si el rasgo es de cabeza y `'default'` si no.
  - `role === 'enemy'` nunca añade orejas.
  - Actualiza el comentario de `UnitRole` (deja de valer lo de spec 028).
  - Depende de T008.
- [X] T018 [US3] `tests/unit/game/unitFactory.test.ts`, nuevo `describe('specs/042 orejas de aliado')`:
  - para cada rasgo distinto de `cat-ears`, el dibujo `ally` tiene más instrucciones (`g.context.instructions.length`) que el `enemy` del mismo diseño (FR-006, FR-007);
  - con `cat-ears`, `ally` y `enemy` tienen el mismo número de instrucciones (orejas una sola vez, escenario 3);
  - un aliado `horns` es al menos tan alto como el enemigo `horns`;
  - los tres casos en las tres formas.

  Depende de T017.

**Checkpoint**: «nosotros = gatos» se lee por la silueta.

---

## Phase 5: User Story 4 - El eco de muerte conserva el estilo (Priority: P3)

**Goal**: el eco de una unidad con diseño es su mismo dibujo cartoon, apagado, sin anillo.

**Independent Test**: spec.md Historia 4 y quickstart.md § 3, paso 5.

- [X] T019 [US4] `src/game/DeathEchoSprite.tsx`: añade `ECHO_TINT = 0x8a8f99` y aplícalo como `tint` del `pixiSprite` del diseño (no al fotograma del sprite, que no cambia). Sin anillo; escala, alfa y 0,35 s sin cambios (research.md Decisión 6; FR-010). Actualiza el JSDoc del componente. Depende de T010.

**Checkpoint**: las cuatro historias completas.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T020 [P] `docs/art/entity-inventory.md`: el nivel C pasa a 0 (las 16 a nivel B con diseño propio), las 12 de nivel A anotan «respaldo B (spec 042)», actualiza el resumen y quita la «deuda de color» de las cuatro unidades corregidas. En `docs/art/art-bible.md` §4 (Deuda de color) y §5 (tabla de niveles), anota que la spec 042 lo resolvió.
- [X] T021 [P] `specs/042-unidades-mundo-cartoon/spec.md` (Assumptions → Colores): añade el duplicado `cat-cuchilla`/`seed-enemy-red-snake` corregido por FR-005 (research.md Decisión 8).
- [X] T022 Verificación final: `npx tsc -b`, `npx vitest run`, `npm run lint` y el `git grep` de quickstart § 2, todos limpios; anota el conteo de tests (depende de T001–T021). **Verificado**: `tsc -b` limpio, 867/867 tests en verde (60 archivos; antes de la spec 856/59), `oxlint src tests` sin avisos y el `git grep` de "cyber" sin coincidencias.
- [X] T023 Revisión visual (quickstart.md § 3, pasos 1–8) con el servidor de desarrollo:
  - unidades de los tres orígenes, triángulos con orejas, anillos en pausa, eco, sprite con carga fallida y la prueba de lectura en gris al 50 %;
  - ajusta los valores iniciales de las orejas y del marco de cabeza (data-model.md § 3) si se ven mal, y vuelve a pasar T022;
  - guarda capturas como evidencia.

  Depende de T022.

  **Verificado en el navegador** (batalla del Nivel 1 con 10–12 aliados y 5–6 enemigos de distintos orígenes):
  - Todas se dibujan en cartoon, sin cuerpo "cyber"; cada una lleva su anillo cian o rojo y conserva la barra de vida.
  - Con un fotograma de `hero_1` retirado, el Gato Básico cae a su diseño cartoon de respaldo.
  - En pausa, los anillos siguen en su sitio.
  - En gris, las siluetas se leen.
  - No hay errores en la consola.
  - La revisión ampliada obligó a cambiar tres valores iniciales: marco de cabeza y orejas del triángulo, cara del triángulo y escudo delante de la cara (data-model.md § 3).

  **No verificado a ojo**:
  - El eco de muerte (dura 0,35 s); queda cubierto por el código: misma textura y `ECHO_TINT`, sin anillo.
  - La fluidez solo se observó, no se midió con el panel Performance.

  **Observación**: los cuerpos casi negros (La Máscara, Coloso, Eclipse) contrastan poco con el fondo oscuro actual de la batalla. Se resuelve con el fondo diurno previsto en la biblia §6.

---

## Dependencies & Execution Order

- **Phase 1** (T001–T003) bloquea a todas las demás.
- **US1** (T004–T013) depende de Phase 1. Es el MVP y prerrequisito de las demás: borra el "cyber" y deja `UnitSprite` y `unitFactory` en su forma nueva.
- **US2** (T014–T016) depende de US1, porque comparte `UnitSprite.tsx` con T009. T014 y T016 se pueden adelantar en paralelo con US1.
- **US3** (T017–T018) depende de T008 (comparte `unitFactory.ts`). Es independiente de US2.
- **US4** (T019) depende de T010.
- **Polish** (T020–T023): T020 y T021 en cualquier momento; T022 y T023 al final.

```text
T001 → T002 → T003
          └→ US1: (T004 ∥ T005) → T006 → T007
                   T008 → T009 → T010 → T011 → T012 → T013
                     ├→ US3: T017 → T018
                     └→ US2: T014 ∥ … → T015 (tras T009) → T016
                              US4: T019 (tras T010)
                                     → T020 ∥ T021 → T022 → T023
```

## Parallel Opportunities

- Phase 1: T001 mientras se lee T002.
- US1: T004 ∥ T005 (archivos de datos distintos); T014 (US2) ∥ T008 (archivos distintos).
- Polish: T020 ∥ T021.

## Implementation Strategy

1. **MVP = Phase 1 + US1**: con eso desaparece el "cyber" y el mundo es cartoon. Se valida con quickstart §§ 1–2 y el paso 1 de § 3.
2. **US2** repone la señal de bando que el neón daba antes. Conviene entregarla junto con el MVP, porque sin ella cuesta distinguir aliados de enemigos.
3. **US3** y **US4** son incrementos pequeños sobre los mismos archivos.
4. Cierre: documentación de arte, verificación completa y revisión visual con capturas.
