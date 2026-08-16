---

description: "Task list template for feature implementation"
---

# Tasks: Reskin Visual Cyber-Modern + Sprites Reales de Combate

**Input**: Design documents from `/specs/021-reskin-cyber-modern/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Esta spec es de capa de presentación (spec.md, plan.md § Testing) — no se generan tareas de test para el reskin visual en sí (se valida por recorrido manual, `quickstart.md`). Sí se generan tareas de test para las dos funciones puras nuevas de la Historia 4 (`spriteAssets.ts`, la extensión de `animation.ts`), siguiendo el mismo patrón que el proyecto ya usa para `src/game/animation.ts` (`specs/003-identidad-visual-animada`). Cada fase de historia de usuario termina con una tarea de regresión que ejecuta la suite completa existente — ninguna aserción de esos tests se edita.

**Organization**: Tareas agrupadas por historia de usuario (spec.md), en orden de prioridad P1 → P2 → P2 → P3.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: Historia de usuario a la que pertenece (US1–US4)
- Cada tarea incluye ruta de archivo exacta

## Path Conventions

Proyecto único (`src/`, `public/`, `tests/`, `scripts/` en la raíz del repo) — sin backend/frontend separados (plan.md § Project Structure).

---

## Phase 1: Setup

**Purpose**: Prerrequisito compartido más pequeño posible antes de la fundación de tema

- [X] T001 Añadir `<link>` de Google Fonts (Orbitron 600/700/800 + Inter 400/500/600/700) a `index.html`, mismo origen que usa el mockup de referencia (research.md Decisión 1)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Catálogo de tema compartido — bloquea las Historias 1, 2 y 3 (todas consumen sus clases)

**⚠️ CRITICAL**: Ninguna tarea de reskin de pantalla puede empezar hasta completar esta fase

- [X] T002 Crear `src/theme.css` con la capa de tokens completa (`data-model.md` § ThemeTokens: `--bc-bg`, `--bc-surface`, `--bc-border`, `--bc-text*`, `--bc-cyan/orange/purple/gold/red/green/pink`, `--bc-gradient-primary-*`, `--bc-radius-*`, `--bc-font-*`) y un bloque `@media (prefers-reduced-motion: reduce)` que desactiva las animaciones cosméticas de pulso/glow (research.md § Nota de accesibilidad)
- [X] T003 Añadir a `src/theme.css` las clases utilitarias `.screen`, `.glass-panel`, `.btn`+`.btn-primary`+`.btn-outline`(+ modificadores `--cyan`/`--orange`/`--purple`)+`.btn-ghost`+`.btn-icon`, `.hud-bar`, `.progress-bar`+`.progress-bar__fill`, `.list-card`+`.list-card__row` (depende de T002, mismo archivo)
- [X] T004 Importar `theme.css` desde `src/index.css` con `@import` (depende de T002)

**Checkpoint**: Fundación de tema lista — el reskin de pantallas de la Historia 1 puede empezar

---

## Phase 3: User Story 1 - Fundación visual y primera impresión del juego (Priority: P1) 🎯 MVP

**Goal**: Título, Menú Principal y Ajustes muestran la identidad "cyber-modern" sin alterar ningún flujo/handler existente.

**Independent Test**: Navegar Título → Menú Principal → Ajustes → volver en el navegador; confirmar el nuevo estilo y que cada botón sigue llevando exactamente al mismo destino/efecto que antes del cambio (spec.md US1).

### Implementation for User Story 1

- [X] T005 [P] [US1] Reskin `src/screens/TitleScreen.tsx`: envolver en `.screen`, aplicar tipografía/paneles del tema al heading y al botón — mismas props, mismo texto (`t('title.heading')`, `t('title.continue')`/`t('title.play')`), mismo `onNavigate`
- [X] T006 [P] [US1] Reskin `src/screens/MainMenuScreen.tsx`: `.screen`/`.glass-panel`/`.btn` en los 4 accesos, iconos `lucide-react` junto a cada texto existente sin cambiarlo — mismas props/handlers
- [X] T007 [P] [US1] Reskin `src/screens/SettingsScreen.tsx`: `.screen`/`.glass-panel`, sliders/`select`/botones con clases del tema, icono `ArrowLeft` junto al texto de volver — mismo estado `draft`, mismo `handleApply`/`handleBack`
- [X] T008 [US1] Ejecutar `npm test` (regresión completa) y validar manualmente `quickstart.md` § 2 (depende de T005-T007)

**Checkpoint**: Historia 1 completa y verificable de forma independiente — MVP entregable

---

## Phase 4: User Story 2 - Navegación y consulta con la nueva identidad visual (Priority: P2)

**Goal**: Mapa de Etapas, Menú de Tesoros, Equipar, Mejorar, Guía de Gatos, Guía de Enemigos, Resultado y Cápsula muestran el mismo lenguaje visual, sin cambiar ningún dato ni interacción.

**Independent Test**: Recorrer las 8 pantallas desde el Menú Principal, confirmar el nuevo estilo en cada una (incluida distinción de rareza por color en Equipar/Mejorar/Guía de Gatos) y confirmar que cada acción produce el mismo resultado que antes (spec.md US2).

### Implementation for User Story 2

- [X] T009 [US2] Añadir a `src/theme.css` el mapeo de color por rareza (`data-model.md` § RarityColorMap: clases `.tag--normal/especial/raro/superraro/megarraro/legendario/colaboracion`), cubriendo las 7 variantes de `RarityType`
- [X] T010 [P] [US2] Reskin `src/screens/LevelSelectScreen.tsx` (incluye `EventBannerCard`): `.screen`/`.list-card`, distinción visual bloqueado/disponible/completado, icono de energía junto al texto existente — misma lógica de `handlePlay`/`spendMissionEnergy`
- [X] T011 [P] [US2] Reskin `src/screens/TreasureMenuScreen.tsx`: `.list-card` + `.progress-bar` por set de tesoro — mismos datos de `TREASURE_SETS`/`obtainedTreasureIds`
- [X] T012 [P] [US2] Reskin `src/screens/TeamScreen.tsx` (incluye `BattleItemSelector`): `.list-card`, tag de rareza por gato (depende de T009), sin cambiar `selectedIds`/`setActiveTeam`/selección de objetos de batalla
- [X] T013 [P] [US2] Reskin `src/screens/UpgradeScreen.tsx` (incluye `UserRankSection`): `.list-card`, tag de rareza por gato (depende de T009), `.progress-bar` para umbrales de rango — mismos `upgradeCat`/`claimRankThreshold`
- [X] T014 [P] [US2] Reskin `src/screens/CatGuideScreen.tsx`: `.list-card`, tag de rareza por gato (depende de T009) — misma fuente de datos (`getEffectiveCatStats`)
- [X] T015 [P] [US2] Reskin `src/screens/EnemyGuideScreen.tsx`: `.list-card` — mismos datos de `encounteredEnemyCatIds`
- [X] T016 [P] [US2] Reskin `src/screens/ResultScreen.tsx`: `.screen`/`.glass-panel` para el mensaje de Victoria/Derrota — mismo `status`/`handleBack`
- [X] T017 [P] [US2] Reskin el shell de `src/screens/GachaScreen.tsx` con clases del tema — sin ninguna mecánica nueva (spec.md FR-013), mismo `onNavigate`
- [X] T018 [US2] Ejecutar `npm test` (regresión completa) y validar manualmente `quickstart.md` § 3 (depende de T009-T017)

**Checkpoint**: Historias 1 y 2 completas — todas las pantallas fuera de Batalla están reskineadas

---

## Phase 5: User Story 3 - Batalla con identidad visual e iconografía consistente (Priority: P2)

**Goal**: El HUD de Batalla y el escenario PixiJS adoptan el tema "cyber-modern" sin alterar ninguna regla de combate.

**Independent Test**: Jugar una batalla completa (desplegar unidades, ver energía acumularse, ganar o perder) y confirmar que HUD y escenario muestran el nuevo estilo mientras el resultado es idéntico al de antes del cambio (spec.md US3).

### Implementation for User Story 3

- [X] T019 [P] [US3] Reskin el HUD DOM de `src/screens/BattleScreen.tsx`: `EnergyReadout`/`PlayerBaseReadout`/`EnemyBaseReadout` como `.progress-bar` con icono, `DeployBar` como fila de slots tipo icono con velo de cooldown, botón de salir con icono `X` — mismos selectores de `useGameStore`/`useMetaStore`, mismo `deployUnit`/`handleExit`
- [X] T020 [P] [US3] Modificar `src/game/BattleStage.tsx`: `Application` con fondo transparente (`backgroundAlpha: 0` en vez de `backgroundColor={0x1a1a2e}`) + una capa `Graphics` de fondo de carril añadida una sola vez por montaje (research.md Decisión 4); el wrapper `.battle-stage` recibe el gradiente radial cyber-modern vía CSS para que se vea a través del canvas
- [X] T021 [P] [US3] Modificar `src/game/UnitSprite.tsx`: recolorear `TEAM_COLOR` a los tokens de equipo (cian jugador / rojo enemigo) y añadir anillo de resplandor por 2-3 trazos `Graphics` concéntricos de alpha decreciente detrás del cuerpo (research.md Decisión 4) — sin tocar aún el cuerpo `Graphics` en sí (eso es Historia 4)
- [X] T022 [P] [US3] Modificar `src/game/DeathEchoSprite.tsx` con el mismo recoloreo/anillo de resplandor de T021, conservando su animación de encogimiento/desvanecimiento existente
- [X] T023 [US3] Ejecutar `npm test` (regresión completa) y validar manualmente `quickstart.md` § 4 (depende de T019-T022)

**Checkpoint**: Historias 1, 2 y 3 completas — todo el juego fuera del arte de unidades está reskineado

---

## Phase 6: User Story 4 - Unidades de combate con arte animado real (Priority: P3)

**Goal**: Cada unidad de combate se representa con una figura de personaje animada (reposo + ataque) en vez del rectángulo placeholder, sin alterar el resultado de la simulación.

**Independent Test**: Jugar una batalla y observar el campo: cada unidad desplegada muestra una figura animada distinguible por equipo, cambia de pose de reposo a pose de ataque en sincronía con su cadencia de daño real, se orienta en espejo si es enemiga, y al morir dibuja el mismo efecto de desvanecimiento que ya existe (spec.md US4).

### Implementation for User Story 4

- [X] T024 [US4] Añadir `spriteKey?: string` a la interfaz `Cat` y poblarlo en los 12 fixtures de `src/data/cats.ts` con `hero_1`…`hero_12` en el orden ya existente del array (data-model.md § Cat)
- [X] T025 [P] [US4] Crear `scripts/copy-sprites.mjs`: copia las carpetas `1_idle` (16 frames) y `4_attack` (12 frames — recuento real, distinto del de idle) de los 12 `hero_N` asignados desde `assets-source/units/Characters/hero_N/male/` hacia `public/sprites/hero_N/{idle,attack}/`, y falla con un mensaje claro si alguna carpeta origen se desvía del recuento esperado para su tipo de animación (research.md Decisión 5)
- [X] T026 [US4] Ejecutar `node scripts/copy-sprites.mjs` para generar `public/sprites/hero_1..hero_12/{idle,attack}/*.png` (336 archivos: 12 héroes × (16 idle + 12 attack)), y eliminar el `public/sprites/cat-placeholder.png` sin usar que reemplaza (depende de T025)
- [X] T027 [P] [US4] Crear `src/game/spriteAssets.ts`: tipo `SpriteAnimationSet`, `SPRITE_MANIFEST: SpriteManifest` (12 entradas, rutas hacia `public/sprites/`) y `resolveSpriteAnimationSet(spriteKey)` (data-model.md § SpriteManifest)
- [X] T028 [P] [US4] Crear `tests/unit/game/spriteAssets.test.ts`: `resolveSpriteAnimationSet` devuelve el set correcto para un `spriteKey` válido y `undefined` para uno inexistente/`undefined` (depende de T027)
- [X] T029 [US4] Añadir `ANIMATION_STATE_TO_SPRITE_FOLDER` a `src/game/animation.ts`, aditivo junto a `getAnimationState`/`getAnimationPose` existentes, sin cambiar su firma (data-model.md § AnimationState → carpeta de sprite)
- [X] T030 [P] [US4] Añadir caso de test a `tests/unit/game/animation.test.ts` para `ANIMATION_STATE_TO_SPRITE_FOLDER` (depende de T029)
- [X] T031 [US4] Reescribir `src/game/UnitSprite.tsx`: cuando `cat.spriteKey` resuelve en el manifest, renderizar `pixiAnimatedSprite` cargado vía `Assets.load` en vez del cuerpo `Graphics`, intercambiando el arreglo de texturas idle/attack dentro del `useTick` existente según `ANIMATION_STATE_TO_SPRITE_FOLDER`, con `container.scale.x` negado cuando `team === 'Enemy'`; si `spriteKey` no resuelve, o si `Assets.load` rechaza (`catch`), conserva el `Graphics` actual (fallback, FR-011) (depende de T024, T027, T029)
- [X] T032 [US4] Reescribir `src/game/DeathEchoSprite.tsx` con la misma sustitución `AnimatedSprite`/fallback (incluido el fallback por fallo de carga) de T031, congelando el frame idle vigente al morir en vez de redibujar (depende de T024, T027)
- [X] T033 [US4] Ejecutar `npm test` (regresión + tests nuevos) y validar manualmente `quickstart.md` § 5 y § 6 (incluye el caso de fallback sin `spriteKey` y la orientación en espejo del enemigo) (depende de T031, T032, T028, T030)

**Checkpoint**: Las 4 historias de usuario completas — reskin íntegro del alcance de spec.md

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verificación final que abarca las 4 historias

- [X] T034 [P] Ejecutar `npm run build` (incluye `tsc -b`) y `npm test` como pase de regresión final sobre las 4 historias
- [X] T035 Revisión de código: confirmar que ningún archivo de pantalla tocado por esta spec (`src/screens/*.tsx`, `src/game/BattleStage.tsx`, `src/game/UnitSprite.tsx`, `src/game/DeathEchoSprite.tsx`) deja un color hexadecimal/tamaño de fuente/radio literal fuera de `src/theme.css` (spec.md SC-002, `quickstart.md` § 7)
- [X] T036 Recorrer `quickstart.md` completo de punta a punta como pase de aceptación final — NOTA: el entorno de esta sesión bloquea la navegación a `localhost` en el navegador embebido (política del sandbox), así que este pase se hizo por revisión de código + regresión automatizada (`npm test`, `npx tsc -b`, `npm run build`, `npm run lint`) en vez de un recorrido visual en vivo; pendiente que el usuario confirme visualmente en su propio navegador.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias — puede empezar de inmediato
- **Foundational (Phase 2)**: sin dependencia real de Setup — T001 (`index.html`) y T002-T004 (`theme.css`/`index.css`) tocan archivos distintos y pueden ejecutarse en paralelo; Foundational BLOQUEA las Historias 1, 2 y 3
- **Historia 1 (Phase 3)**: depende de Foundational (T002-T004)
- **Historia 2 (Phase 4)**: depende de Foundational (T002-T004); independiente de Historia 1 salvo que ambas comparten el mismo `theme.css` ya estable
- **Historia 3 (Phase 5)**: depende de Foundational (T002-T004); independiente de Historias 1 y 2
- **Historia 4 (Phase 6)**: depende de que `UnitSprite.tsx`/`DeathEchoSprite.tsx` ya tengan el recoloreo/glow de Historia 3 (T021, T022) para no pisarlos con la reescritura a `AnimatedSprite` — única historia con dependencia real sobre otra historia
- **Polish (Phase 7)**: depende de las 4 historias completas

### Parallel Opportunities

- T005, T006, T007 (Historia 1) en paralelo — archivos de pantalla distintos
- T010–T017 (Historia 2) en paralelo entre sí una vez completado T009 (T012/T013/T014 además dependen de T009 específicamente)
- T019, T020, T021, T022 (Historia 3) en paralelo — cuatro archivos distintos (`BattleScreen.tsx`, `BattleStage.tsx`, `UnitSprite.tsx`, `DeathEchoSprite.tsx`)
- T025 y T027 (Historia 4) en paralelo — scripts vs. manifest, sin dependencia mutua

---

## Parallel Example: User Story 2

```bash
Task: "Reskin src/screens/LevelSelectScreen.tsx"
Task: "Reskin src/screens/TreasureMenuScreen.tsx"
Task: "Reskin src/screens/TeamScreen.tsx"
Task: "Reskin src/screens/UpgradeScreen.tsx"
Task: "Reskin src/screens/CatGuideScreen.tsx"
Task: "Reskin src/screens/EnemyGuideScreen.tsx"
Task: "Reskin src/screens/ResultScreen.tsx"
Task: "Reskin src/screens/GachaScreen.tsx"
# (todas después de T009 — rarity classes en theme.css)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1 (Setup) + Phase 2 (Foundational)
2. Completar Phase 3 (Historia 1)
3. **Detener y validar**: `quickstart.md` § 2, confirmar cero regresión
4. Este es el primer punto demostrable — Título/Menú/Ajustes con la nueva identidad

### Incremental Delivery

1. Setup + Foundational → fundación de tema lista
2. + Historia 1 → validar independientemente → MVP
3. + Historia 2 → validar independientemente
4. + Historia 3 → validar independientemente
5. + Historia 4 (única con dependencia real sobre una historia previa: reutiliza el recoloreo/glow que deja Historia 3) → validar independientemente
6. Polish final sobre las 4 historias completas

---

## Notes

- [P] = archivos distintos, sin dependencias pendientes entre sí
- Cada [Story] mapea 1:1 a las historias de `spec.md`
- Ningún texto visible ni nombre accesible cambia en ninguna tarea de reskin — verificado por la tarea de regresión (`npm test`) al final de cada fase de historia
- `src/engine/` no aparece en ninguna tarea — esta spec no lo toca (Constitución § VI)
- Commitear después de cada tarea o grupo lógico, y al cerrar cada checkpoint de historia
