---

description: "Task list template for feature implementation"
---

# Tasks: Sistema Visual Cyber-Modern — Tema Compartido y Reskin de Menú Principal

**Input**: Design documents from `/specs/022-cyber-modern-theme/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/ui-theme-consumption.md](./contracts/ui-theme-consumption.md), [quickstart.md](./quickstart.md)

**Tests**: Incluidos donde hay lógica real que verificar (EditMode, `UIThemeCatalog`) — mismo patrón de verificación ya establecido en 001-021. Ningún test PlayMode nuevo: `MainMenuFlowPlayModeTests.cs` existente sirve como guardia de regresión sin modificarse (research.md §6).

**Organization**: Tareas agrupadas por historia de usuario (US1 P1, US2 P2, según spec.md).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: Historia de usuario a la que pertenece la tarea
- Cada tarea incluye la ruta exacta del archivo

## Path Conventions

Proyecto único de Unity — capas `Assets/Scripts/{Model,View}/Battler/`, herramientas de contenido en `Assets/Editor/Battler/`, tests en `Assets/Tests/EditMode/Battler/`, según [plan.md § Project Structure](./plan.md#project-structure).

---

## Phase 1: Setup

**Purpose**: Confirmar línea base antes de tocar código.

- [X] T001 Correr la suite EditMode + PlayMode existente (001-021) en modo batch de Unity sobre `C:\Users\Usuario\Documents\GitHub\IA GAME\the_battler_test` y confirmar que sigue en verde antes de empezar, como línea base de referencia. — verificado: EditMode 273/273, PlayMode 138/138, 0 fallos.

**Checkpoint**: Línea base verde confirmada antes de tocar código.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: El catálogo de datos y los sprites base, compartidos por ambas historias de usuario.

**⚠️ CRITICAL**: Ninguna tarea de Fase 3+ puede empezar hasta completar esta fase.

- [X] T002 [P] Crear `UIThemeCatalog.cs` (ScriptableObject) en `Assets/Scripts/Model/Battler/UIThemeCatalog.cs`, según [data-model.md § UIThemeCatalog](./data-model.md#uithemecatalog-nuevo-assetsscriptsmodelbattleruithemecatalogcs)
- [X] T003 [P] Crear `UIThemeSpriteGenerator.cs` (herramienta de Editor) en `Assets/Editor/Battler/UIThemeSpriteGenerator.cs`, según [research.md §3](./research.md#3-paneles-glass-y-resplandor-sin-blur-en-tiempo-real) y [contracts/ui-theme-consumption.md § UIThemeSpriteGenerator](./contracts/ui-theme-consumption.md#uithemespritegenerator-editor-only-assetseditorbattleruithemespritegeneratorcs--contrato-de-generación)
- [X] T004 Ejecutar `UIThemeSpriteGenerator` para producir `GlassPanel9Slice.png` y `RadialGlow.png` en `Assets/Sprites/Battler/UI/` (nueva carpeta), y configurar su `TextureImporter` (tipo Sprite; 9-slice en el panel) — depende de T003 — verificado: ambos PNG existen con `spriteBorder`/`alphaIsTransparency` configurados (`UIThemeSpriteGenerator.ConfigureSpriteImporter`)
- [X] T005 Crear el asset `UIThemeCatalog.asset` en `Assets/ScriptableObjects/Battler/UI/` con los valores por defecto del mockup de referencia (data-model.md) — depende de T002 — verificado: asset existe; `m_HeadingFont`/`m_BodyFont` quedan `fileID: 0` (sin asignar) a la espera de T011/T013

**Checkpoint**: Catálogo de datos y sprites base listos — las 2 historias de usuario pueden empezar.

---

## Phase 3: User Story 1 - Ver el Menú Principal con la nueva identidad visual (Priority: P1) 🎯 MVP

**Goal**: El Menú Principal y su panel de Ajustes muestran el nuevo estilo visual "cyber-modern" sin ningún cambio de comportamiento respecto al menú actual.

**Independent Test**: Abrir `MainMenu.unity`, entrar en Play Mode, y confirmar visualmente el nuevo estilo mientras Start/Continue/Settings se comportan exactamente igual que antes (spec.md US1).

### Tests for User Story 1 ⚠️

- [X] T006 [P] [US1] EditMode test nuevo `UIThemeCatalogTests.cs` en `Assets/Tests/EditMode/Battler/`: valores por defecto razonables al crear una instancia vacía; `HeadingFont`/`BodyFont`/colores sin asignar no lanzan excepción al leerse (spec.md Edge Cases) — depende de T002 — verificado: archivo existe con 4 tests cubriendo exactamente eso

### Implementation for User Story 1

- [X] T007 [P] [US1] Crear `ThemedGlassPanel.cs` en `Assets/Scripts/View/Battler/ThemedGlassPanel.cs`, según [data-model.md § ThemedGlassPanel](./data-model.md#themedglasspanel-nuevo-assetsscriptsviewbattlerthemedglasspanelcs) y [contracts/ui-theme-consumption.md](./contracts/ui-theme-consumption.md) — depende de T002, T004 — verificado: componente hermano, fallback silencioso, coincide con el contrato
- [X] T008 [P] [US1] Confirmar con el usuario e importar DOTween (versión gratuita) en el proyecto vía Unity Asset Store, de forma que `Packages/manifest.json` (o `Assets/Plugins/Demigiant/`) refleje la dependencia — paso manual, fuera del control de este pipeline (research.md §1). **Pedir permiso explícito antes de guiar cualquier descarga.** Sin esto no puede continuar T009. — verificado: `Assets/Plugins/Demigiant/DOTween/` ya presente en el working tree (importado en una sesión previa); no se requirió ninguna descarga nueva en esta sesión
- [X] T009 [US1] Crear `ThemedAccentButton.cs` en `Assets/Scripts/View/Battler/ThemedAccentButton.cs`, incluyendo el pulso opcional vía DOTween en el CTA principal, según [data-model.md § ThemedAccentButton](./data-model.md#themedaccentbutton-nuevo-assetsscriptsviewbattlerthemedaccentbuttoncs) y [contracts/ui-theme-consumption.md](./contracts/ui-theme-consumption.md) — depende de T002, T008 — verificado: usa `DG.Tweening`, mata el tween en `OnDisable`, coincide con el contrato
- [X] T010 [P] [US1] Crear `ThemedGlowIcon.cs` en `Assets/Scripts/View/Battler/ThemedGlowIcon.cs`, según [data-model.md § ThemedGlowIcon](./data-model.md#themedglowicon-nuevo-assetsscriptsviewbattlerthemedglowiconcs) — depende de T002, T004 — verificado: coincide con el contrato
- [X] T011 [P] [US1] Confirmar con el usuario y, si se acepta, descargar la fuente "Inter" (fonts.google.com, licencia OFL) e importarla como TMP Font Asset en `Assets/TextMesh Pro/Resources/Fonts & Materials/Inter-Regular SDF.asset`; alternativa sin descarga: usar "Raleway" (ya importado en `Assets/Mod Assets/Mod Resources/Fonts/`) como `BodyFont` (research.md §2). **Pedir permiso explícito antes de cualquier descarga.** — DONE: generado `Assets/Mod Assets/Mod Resources/Fonts/Inter-Regular SDF.asset` por código desde `Inter-VariableFont.ttf` ya presente (`TMP_FontAsset.CreateFontAsset(Font, ...)` + `TryAddCharacters`, 144 glifos ASCII+Latin-1/Extended-A para es/en/fr — ver Notes: `AtlasPopulationMode.Dynamic`, no `Static` como Orbitron, porque `TryAddCharacters` rechaza poblar un atlas `Static` vía API pública). Asignado como `BodyFont` y `Orbitron-Regular SDF.asset` como `HeadingFont` en `UIThemeCatalog.asset`.
- [X] T012 [US1] En `MainMenu.unity`: añadir `ThemedGlassPanel` a `MainPanel` y `SettingsPanel`; añadir `ThemedAccentButton` a `StartButton`/`ContinueButton`/`SettingsButton`/`ApplyButton`/`CloseButton` (acento apropiado por botón, pulso solo en el CTA principal "Jugar"), todos referenciando `UIThemeCatalog.asset` (T005) — depende de T005, T007, T009 — DONE: extendido `Assets/Editor/Battler/MainMenuContentBuilder.cs` (helpers `ApplyThemedGlassPanel`/`ApplyThemedAccentButton`/`ApplyFont`). Acentos: StartButton=PrimaryGradient+pulso, ContinueButton=Cyan, SettingsButton=Purple, ApplyButton=Cyan, CloseButton=Purple. Desviación menor: `MainPanel` pasó de `StretchFull` a una tarjeta centrada 420x380 (antes invisible/sin Image) para que el tinte "glass" no cubra el fondo real ni el MusicToggle con un overlay a pantalla completa — `ButtonColumn` sigue anclado 0.5/0.5 con `anchoredPosition` cero, así que la posición en pantalla de los botones no cambió. `ThemedGlowIcon` no se aplicó a `MusicToggle` (opcional, sin FR que lo exija) para mantener el alcance acotado. Verificado con la escena generada corriendo en Play Mode (no en Editor edit-mode: `ThemedGlassPanel`/`ThemedAccentButton` no tienen `[ExecuteAlways]`, así que `OnEnable()` no corre fuera de Play Mode/build, por diseño — no es un bug): `MainPanel`=`RGBA(0.078,0.086,0.118,0.85)` + sprite `GlassPanel9Slice`, `StartButton`=`RGBA(0.984,0.573,0.235,1)` (PrimaryGradientStart), `ContinueButton`=`RGBA(0.133,0.827,0.933,1)` (AccentCyan) — coinciden exactamente con los valores por defecto del catálogo.
- [X] T013 [US1] En `MainMenu.unity`: asignar `HeadingFont` (Orbitron)/`BodyFont` (Inter o Raleway) del catálogo a los `TMP_Text` de títulos, botones y labels de Menú Principal y Ajustes — depende de T005, T011 — DONE: los 12 `TextMeshProUGUI` de la escena verificados por código — botones (Start/Continue/Settings/Apply/Close) + `SettingsTitle` en `Orbitron-Regular SDF`; labels de sliders de audio, `LanguageRow` y `LanguageDropdown` (label + item template) en `Inter-Regular SDF`.
- [X] T014 [US1] Confirmar que `MainMenuFlowController.cs`/`MainMenuUIController.cs`/`SettingsPanelController.cs` quedan sin ninguna modificación (diff vacío) y que `MainMenuFlowPlayModeTests.cs` sigue en verde sin haberse tocado (hace pasar la Independent Test de esta historia) — depende de T012, T013 — DONE: `git diff`/`git status --porcelain` vacíos en los 3 archivos; suite PlayMode completa 138/138 en verde (incluye los 9 tests de `MainMenuFlowPlayModeTests.cs`, sin modificar).

**Checkpoint**: US1 completa y verificable de forma independiente — Menú Principal + Ajustes con el nuevo estilo visual, funcionalidad idéntica a antes de esta spec.

---

## Phase 4: User Story 2 - Reutilizar el tema visual sin duplicar valores (Priority: P2)

**Goal**: Cualquier color/fuente del tema puede ajustarse editando `UIThemeCatalog.asset`, sin tocar código, y el cambio se refleja en el Menú Principal.

**Independent Test**: Cambiar un color de acento en el asset y confirmar que el Menú Principal lo refleja al reabrir la escena/Play Mode (spec.md US2).

### Implementation for User Story 2

- [X] T015 [US2] Validar en el Editor: cambiar `AccentOrange` (o cualquier otro acento) en `UIThemeCatalog.asset`, guardar, y volver a entrar en Play Mode — confirmar que `StartButton` (u otro elemento themeado con ese acento) refleja el nuevo color sin haber tocado ningún script (spec.md SC-004) — depende de T012, T013 — DONE: cambiado `AccentCyan` de `#22d3ee` a magenta de prueba `(1,0,1,1)` en `UIThemeCatalog.asset`, guardado, entrado en Play Mode sobre `MainMenu.unity` ya construida (sin recompilar nada) — `ContinueButton.Image.color` reflejó exactamente el magenta de prueba. Revertido a `#22d3ee` (`(0.133,0.827,0.933,1)`) y guardado — sin color de prueba commiteado.

**Checkpoint**: Las 2 historias de usuario quedan completas e independientemente funcionales — el Menú Principal luce el nuevo tema y ese tema es ajustable desde un único asset, listo para que las specs futuras de esta iniciativa (Hub, Mapa, Batalla, etc.) lo reutilicen (research.md §4).

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T016 [P] Revisar que la implementación final no se haya desviado de [contracts/ui-theme-consumption.md](./contracts/ui-theme-consumption.md) / [data-model.md](./data-model.md) / [research.md](./research.md); actualizar esos documentos si hubo un cambio deliberado durante la implementación. — DONE: revisado componente por componente contra el contrato; sin desvíos del contrato de lectura/aplicación en sí (`Resolve`, fallback silencioso, `OnEnable`/`OnDisable`, `AddComponent`+`SerializedObject`). 3 desvíos menores, todos de detalle de implementación no cubierto explícitamente por los documentos (por eso no ameritan editar research.md/data-model.md, ya quedan documentados en las notas de T011/T012 arriba y en Notes más abajo): (1) `Inter-Regular SDF.asset` con `AtlasPopulationMode.Dynamic` en vez de `Static`; (2) `MainPanel` como tarjeta centrada 420x380 en vez de `StretchFull`; (3) `ThemedGlowIcon` no aplicado a `MusicToggle` (explícitamente opcional). Confirmado además, empíricamente entrando en Play Mode, que `OnEnable()` de los 3 componentes `Themed*` NO corre durante la construcción en Editor (sin `[ExecuteAlways]`) — es el comportamiento esperado de Unity, coincide con "se refleja la próxima vez que el GameObject se activa" de research.md §5, no un defecto.
- [X] T017 Correr la suite completa EditMode + PlayMode (001-022) en modo batch de Unity y confirmar 0 errores/0 warnings de compilación y 100% de tests en verde, incluyendo `MainMenuFlowPlayModeTests.cs` sin modificar. — DONE: corrida final (después de todos los cambios de T011-T015, incluidas 2 iteraciones de Build/rebuild y varios ciclos Play/Stop): EditMode 273/273, PlayMode 138/138, 0 fallos, 0 errores/warnings nuevos en consola.
- [~] T018 Ejecutar los 6 pasos de validación manual de [quickstart.md](./quickstart.md) (comparación perceptual contra el mockup de referencia "Battle Cats Modernizado"), incluyendo confirmar explícitamente que NO se añadió el widget de código de respaldo ni el buzón de noticias (FR-007) y que ninguna escena fuera de `MainMenu.unity` cambió (FR-008) — probablemente requiera el Editor con GUI, mismo criterio documentado para pasos equivalentes en specs anteriores. — PARCIAL (automatizado lo que se pudo sin GUI humana; ver resumen final del agente que ejecutó esta tarea):
  - Paso 1 (estilo nuevo, solo "Jugar" visible sin progreso): verificado por código que `MainPanel` tiene sprite `GlassPanel9Slice` + color oscuro del catálogo, y captura de Scene View en Play Mode confirma visualmente el panel "glass" y los 3 botones con tinte de acento sobre el fondo real — NO se verificó a mano que "Continuar" esté oculto sin progreso guardado (requiere estado de guardado real, fuera del alcance automatizable aquí).
  - Paso 2 (progreso guardado, navegación): NO verificado — requiere simular una partida completa de `Chapter1_Battle`, GUI humana.
  - Paso 3 (panel de Ajustes, sliders/dropdown/Aplicar/Cerrar): comportamiento funcional ya cubierto por `MainMenuFlowPlayModeTests.cs` (verde, T014); apariencia visual del panel de Ajustes en sí NO capturada (permanece inactivo por defecto, no se abrió a mano vía click).
  - Paso 4 (cambiar acento sin tocar código): verificado — ver T015 (magenta de prueba en `AccentCyan`, reflejado en Play Mode, revertido).
  - Paso 5 (`BodyFont` vacío no lanza excepción): verificado por construcción — ningún componente `Themed*` en runtime lee `HeadingFont`/`BodyFont` (solo lo hace `MainMenuContentBuilder` en Editor-time, con `theme?.BodyFont` seguro); cubierto además por `UIThemeCatalogTests.cs` (T006, verde).
  - Paso 6 (consola limpia + sin tweens huérfanos): verificado — 2 ciclos Play/Stop consecutivos sin errores/warnings nuevos en consola; `DOTween.TotalActiveTweens()` = 1 durante Play (el pulso de `StartButton`) y vuelve a 0 al salir de Play Mode.
  - FR-007 (sin widget de código de respaldo/buzón de noticias) y FR-008 (ninguna otra escena cambió): no se tocó ninguna escena fuera de `MainMenu.unity` en todo este trabajo (confirmado por el diff de git, ver resumen final) — ningún widget nuevo de código/noticias se agregó en `MainMenuContentBuilder.cs`.
  - **Pendiente de un vistazo humano real**: comparación perceptual lado a lado contra el mockup HTML de referencia, paneles/botones con progreso guardado, apertura visual del panel de Ajustes.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Fase 1)**: sin dependencias
- **Foundational (Fase 2)**: depende de Setup — bloquea las 2 historias de usuario
- **US1 (Fase 3)**: depende de Foundational
- **US2 (Fase 4)**: depende de que US1 haya reskinado el Menú Principal (T012/T013) — su único propósito es validar que ESE reskin ya construido es ajustable vía datos, no construye nada nuevo
- **Polish (Fase 5)**: depende de que las 2 historias estén completas

### User Story Dependencies

- **US1 (P1)**: tras Foundational — sin dependencia de otras historias; entrega el reskin visual completo del Menú Principal + Ajustes
- **US2 (P2)**: depende de que US1 haya cableado `UIThemeCatalog.asset` en la escena (T012/T013) — es una validación del mismo trabajo, no una implementación separada

### Parallel Opportunities

- T002, T003 (Fase 2) son independientes entre sí — archivos distintos
- T006 (test), T007, T010 (Fase 3) pueden avanzar en paralelo una vez completada la Fase 2 — archivos distintos, sin dependencias entre sí
- T008 (permiso DOTween) y T011 (permiso Inter) pueden pedirse en paralelo — son checkpoints de permiso independientes entre sí y de T006/T007/T010

---

## Parallel Example: Foundational (Fase 2)

```bash
# Lanzar juntos los cambios independientes entre si (archivos distintos):
Task: "Crear UIThemeCatalog.cs en Assets/Scripts/Model/Battler/UIThemeCatalog.cs"
Task: "Crear UIThemeSpriteGenerator.cs en Assets/Editor/Battler/UIThemeSpriteGenerator.cs"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Completar Fase 1: Setup
2. Completar Fase 2: Foundational (bloqueante — catálogo de datos + sprites base)
3. Completar Fase 3: US1 (reskin visual completo del Menú Principal + Ajustes) — esto ya es el resultado visible principal de la spec
4. **Detener y validar**: correr T006 en verde de forma aislada, confirmar T014 (regresión funcional), luego el quickstart.md completo con GUI
5. Fase 4 (US2) es una validación corta del mismo trabajo, no una segunda pieza de alcance — puede hacerse inmediatamente después de US1

### Incremental Delivery

1. Setup + Foundational → catálogo de datos y sprites base listos
2. + US1 → Menú Principal y Ajustes con el nuevo estilo visual, cero regresión funcional
3. + US2 → confirmado que el tema es ajustable desde datos, sin tocar código — listo para que las specs futuras de esta iniciativa lo reutilicen
4. Fase 5 → verificación final y quickstart manual con GUI

## Notes

- [P] = archivos distintos, sin dependencias pendientes
- T008/T011 son checkpoints de **permiso del usuario**, no tareas de código — ningún archivo se descarga sin confirmación explícita en el chat en el momento de ejecutarlas (research.md §1-§2), sin importar que el diseño general de esta spec ya fue aprobado antes.
- `MainMenuFlowController.cs`/`MainMenuUIController.cs`/`SettingsPanelController.cs` no aparecen en ninguna tarea de esta lista — research.md §4 documenta por qué (componentes `Themed*` hermanos, cero cambios a esos tres archivos); T014 es la verificación explícita de esa garantía.
- Ninguna tarea de esta spec toca otra pantalla del juego (Hub, Mapa de Etapas, Batalla, Equipar, Mejorar, Biblioteca, Perfil, Cápsula/Gacha) — quedan para specs futuras que reutilizarán `UIThemeCatalog` y los componentes `Themed*` ya construidos aquí.
- Desviación menor en T011: `Inter-Regular SDF.asset` quedó con `AtlasPopulationMode.Dynamic` (no `Static`, como `Orbitron-Regular SDF.asset`). La API pública `TMP_FontAsset.TryAddCharacters` rechaza poblar un atlas `Static` fuera de la ventana `TMP_FontAssetCreatorWindow` interna ("Unable to add characters... AtlasPopulationMode is set to Static"); `Dynamic` es el modo estándar recomendado por Unity para escenarios scripteados y funciona de forma idéntica en runtime para este caso de uso (texto de UI, fuente fuente incluida en el proyecto). No afecta ningún contrato de `data-model.md`/`contracts/ui-theme-consumption.md`, que no especifican modo de atlas.
