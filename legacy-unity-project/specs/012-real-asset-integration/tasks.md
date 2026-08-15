---

description: "Task list template for feature implementation"
---

# Tasks: Integración de Arte Real Importado

**Input**: Design documents from `/specs/012-real-asset-integration/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Incluidos — mismo patrón de verificación real (EditMode/PlayMode) ya establecido en el resto del proyecto.

**Organization**: Tareas agrupadas por historia de usuario (spec.md: US1-US4) para permitir implementación y prueba independiente de cada una.

**Nota de alcance** (plan.md, Constitution Check): sin cambios en `Assets/Scripts/Gameplay/`. Superficie de código: 1 clase de Editor nueva (`BattlerArtLibrary.cs`), 1 campo nuevo en `UnitDefinition.cs`, 1 campo nuevo cada uno en `ChapterBannerItemView.cs`/`UnitUpgradeRowView.cs`/`TeamFormationRowView.cs`, y reescritura de la parte de generación de arte de los 5 `*ContentBuilder.cs`. El resto es asignación de datos (`Banner_*.asset`).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: Historia de usuario a la que pertenece la tarea (US1-US4, spec.md)
- Cada tarea incluye la ruta exacta del archivo

## Path Conventions

Proyecto único de Unity. Herramienta de arte compartida en `Assets/Editor/Battler/BattlerArtLibrary.cs`; content builders modificados en `Assets/Editor/Battler/*ContentBuilder.cs`; modelo en `Assets/Scripts/Model/Battler/UnitDefinition.cs`; vistas en `Assets/Scripts/View/Battler/*.cs`; datos en `Assets/Data/Battler/Banners/*.asset`; tests en `Assets/Tests/{EditMode,PlayMode}/Battler/`, según [plan.md § Project Structure](./plan.md#project-structure).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Clase de Editor compartida que reemplaza `CreateSquareSprite`/`CreateScaleClip` en los 5 content builders (research.md §6).

- [x] T001 Crear `Assets/Editor/Battler/BattlerArtLibrary.cs` (`#if UNITY_EDITOR`, clase estática, sin `MonoBehaviour`) con las constantes de ruta de los 8 packs recomendados (`HyperCasualUiRoot`, `UiElementsRoot`, `ParallaxBackgroundRoot`, `CharactersRoot`, `MonstersRoot`, `PropsRoot`), según [data-model.md](./data-model.md#battlerartlibrary-nueva-clase-estática-solo-editor--no-es-una-entidad-de-dominio)
- [x] T002 [P] Implementar `BattlerArtLibrary.LoadSprite(string path)` (envoltorio validante sobre `AssetDatabase.LoadAssetAtPath<Sprite>`, excepción clara si el archivo no existe)
- [x] T003 [P] Implementar `BattlerArtLibrary.LoadOrderedFrames(string folderPath, int frameCount)` (carga `1.png`..`{frameCount}.png` de una carpeta, devuelve `Sprite[]` en orden)
- [x] T004 [P] Implementar `BattlerArtLibrary.CreateSpriteFrameClip(string path, Sprite[] frames, float frameRate, bool loop)` usando `AnimationUtility.SetObjectReferenceCurve` sobre `EditorCurveBinding { type = typeof(SpriteRenderer), propertyName = "m_Sprite" }` (research.md §1) — reemplaza a `CreateScaleClip`

**Checkpoint**: `BattlerArtLibrary` compila y puede invocarse desde cualquier content builder.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Campo de datos y consumo de arte real por unidad que las Historias 2, 3 y 4 necesitan — sin esto no hay `Portrait` que mostrar en ninguna pantalla fuera de batalla.

**⚠️ CRITICAL**: Ninguna historia de usuario puede darse por completa hasta que esta fase esté lista.

- [x] T005 Añadir `[SerializeField] private Sprite m_Portrait;` y el getter público `Portrait => m_Portrait;` a `Assets/Scripts/Model/Battler/UnitDefinition.cs` (sin `FormerlySerializedAs` — campo nuevo, data-model.md)
- [x] T006 [P] Modificar `BuildUnitDefinition(...)` en `Assets/Editor/Battler/Chapter1ContentBuilder.cs` para asignar `so.FindProperty("m_Portrait").objectReferenceValue` con el frame `1` de `1_idle/` del `hero_N` asignado (vía `BattlerArtLibrary.LoadSprite`), según [contracts/unit-visual-identity-mapping.md](./contracts/unit-visual-identity-mapping.md) — depende de T001-T005
- [x] T007 [P] Modificar el método equivalente en `Assets/Editor/Battler/Chapter2ContentBuilder.cs` para asignar `m_Portrait` de `player_unit_6`/`player_unit_7`/`enemy_unit_2` según la misma tabla — depende de T001-T005
- [x] T008 [P] Test EditMode nuevo `Assets/Tests/EditMode/Battler/UnitDefinitionPortraitTests.cs`: crea una `UnitDefinition` en memoria (`ScriptableObject.CreateInstance`), asigna `m_Portrait` vía `SerializedObject` y confirma que el getter `Portrait` expone el mismo `Sprite` — depende de T005

**Checkpoint**: `UnitDefinition.Portrait` existe, se puebla al reconstruir Capítulo 1/2, y tiene cobertura de test.

---

## Phase 3: User Story 1 - Menú Principal y Mapa de Aventuras con identidad visual real (Priority: P1) 🎯 MVP

**Goal**: Fondo/botones ilustrados reales en Menú Principal; cada banner de capítulo con su fondo de bioma real.

**Independent Test**: Ejecutar "Build Main Menu Content" y "Build Adventure Map Content"; confirmar en el Editor que ningún elemento usa `Image.color` sólido como único fondo, y que `Banner_Chapter1`/`Banner_HaciaElFuturo` tienen `m_BannerArt` distinto de `null` (quickstart.md pasos 1 y 5).

### Tests for User Story 1

- [x] T009 [P] [US1] Extender `Assets/Tests/EditMode/Battler/ChapterDefinitionValidationTests.cs` (o crear `ChapterBannerArtValidationTests.cs` si esa suite no es el lugar natural) para fallar si algún `ChapterBannerDefinition` con `LinkedChapter != null` tiene `BannerArt == null` — SC-002

### Implementation for User Story 1

- [x] T010 [US1] Añadir `[SerializeField] private Image m_BackgroundImage;` a `Assets/Scripts/View/Battler/ChapterBannerItemView.cs` y asignar `m_BackgroundImage.sprite = definition.BannerArt` (con guarda de nulo) en `Initialize(...)` — data-model.md
- [x] T011 [US1] En `Assets/Editor/Battler/AdventureMapContentBuilder.cs`, asignar `m_BannerArt` de `Banner_Chapter1`/`Banner_HaciaElFuturo` a `Free 2D Cartoon Parallax Background/FullBG/1_Mountain.png`/`2_Desert.png` respectivamente (vía `BattlerArtLibrary.LoadSprite`) — [contracts/screen-asset-wiring.md](./contracts/screen-asset-wiring.md#adventuremapunity-adventuremapcontentbuildercs)
- [x] T012 [US1] En `AdventureMapContentBuilder.BuildItemTemplate(...)`, añadir el componente `Image` de fondo al `BannerItemTemplate` y cablearlo al nuevo campo `m_BackgroundImage` de `ChapterBannerItemView` (reemplaza el `Image.color` sólido actual) — depende de T010
- [x] T013 [P] [US1] En `AdventureMapContentBuilder.BuildScene(...)`, reemplazar `DefaultControls.Resources` (skin built-in) por sprites de `Hyper_Casual_UI/Sprites/Panel_Sprites/` para el panel contenedor y `Hyper_Casual_UI/Sprites/Buttons/` para el botón "Select"
- [x] T014 [P] [US1] En `Assets/Editor/Battler/MainMenuContentBuilder.cs`, reemplazar el fondo `Image.color` por `Free 2D Cartoon Parallax Background/FullBG/1_Mountain.png` y los 3 botones (Empezar/Base/Ajustes) por `Hyper_Casual_UI/Sprites/Buttons/empty_buttons/*`, conservando la etiqueta TMP existente superpuesta
- [x] T015 [US1] Ejecutar "Build Main Menu Content" + "Build Adventure Map Content" en el Editor, correr T009, y confirmar visualmente contra la pestaña "Menú Principal"/"Mapa de Aventuras" del sketch (quickstart.md paso 5)

**Checkpoint**: Menú Principal y Mapa de Aventuras usan arte real; MVP visual navegable de punta a punta hasta el mapa.

---

## Phase 4: User Story 2 - Base del Jugador y unidades con sprites reales (Priority: P1)

**Goal**: El plantel de unidades en Base del Jugador muestra el sprite `hero_N` real de cada unidad; paneles de Base usan `Hyper_Casual_UI`.

**Independent Test**: Ejecutar "Build Player Base Content"; confirmar que cada fila de `UnitUpgradeUIController` muestra un `Portrait` distinto por unidad (quickstart.md paso 5, fila "Base del Jugador").

### Tests for User Story 2

- [x] T016 [P] [US2] Test EditMode nuevo `Assets/Tests/EditMode/Battler/UnitVisualIdentityMappingTests.cs`: recorre las 7 `UnitDefinition` de jugador conocidas y confirma que ninguna comparte `Portrait`/`hero_N` con otra (0 duplicados, [contracts/unit-visual-identity-mapping.md](./contracts/unit-visual-identity-mapping.md#verificación-de-contrato))

### Implementation for User Story 2

- [x] T017 [US2] Añadir `[SerializeField] private Image m_PortraitImage;` a `Assets/Scripts/View/Battler/UnitUpgradeRowView.cs` y asignar `m_PortraitImage.sprite = unit.Portrait` (con guarda de nulo) en `Initialize(...)` — data-model.md
- [x] T018 [US2] En `Assets/Editor/Battler/PlayerBaseContentBuilder.cs`, añadir el componente `Image` de retrato a cada fila generada de `UnitUpgradeUIController` y cablearlo al nuevo campo `m_PortraitImage` — depende de T017
- [x] T019 [P] [US2] En `PlayerBaseContentBuilder.cs`, reemplazar los paneles/botones de `Image.color` sólido (cabecera, panel de mejora, navegación Mapa/Formación/Ajustes) por sprites de `Hyper_Casual_UI/Sprites/Panel_Sprites/` y `Buttons/` — [contracts/screen-asset-wiring.md](./contracts/screen-asset-wiring.md#playerbaseunity-playerbasecontentbuildercs)
- [x] T020 [US2] Ejecutar "Build Player Base Content" en el Editor, correr T016, y confirmar visualmente contra la pestaña "Base del Jugador" del sketch — depende de T006, T007, T017, T018

**Checkpoint**: Base del Jugador muestra retratos reales y coherentes entre sí; Historias 1+2 dejan 2 de las 3 pantallas fuera de batalla completas.

---

## Phase 5: User Story 3 - Batalla con HUD, bases y unidades reales (Priority: P2)

**Goal**: Bases con props reales (Obelisco+bandera / Arco+calavera), unidades con animación de sprite real (no tween de escala), variante visual real por unidad.

**Independent Test**: Ejecutar "Build Chapter 1/2 Placeholder Content"; en Play Mode, confirmar visualmente que las bases y las unidades desplegadas coinciden con la pestaña "Batalla (Cap. 1)" del sketch (quickstart.md paso 5).

**Nota de alcance**: se confirmó contra el código (`Chapter1ContentBuilder.BuildScene`) que la escena de batalla **no tiene hoy ningún control de pausa/ajustes** — solo `DeploymentCanvas`/`DialogueCanvas`. FR-007 exige que ese HUD use `UI Elements`; en vez de dejarlo sin superficie, T022b/T023b más abajo agregan el control mínimo (un botón de pausa, sin lógica de pausado real — eso sería una feature nueva fuera de alcance) ya skinneado con `UI Elements`, para que FR-007 quede cubierto sin inventar un sistema de pausa completo.

### Tests for User Story 3

- [x] T021 [P] [US3] `Assets/Tests/EditMode/Battler/UnitAnimationSpriteFrameTests.cs` (ajustado de PlayMode a EditMode: hornear un `AnimatorController`/`AnimationClip` real requiere `UnityEditor.Animations`, no disponible en el asmdef de PlayMode — ver `includePlatforms` de `TheBattler.Tests.PlayMode.asmdef`) — recorre todas las `UnitDefinition` del proyecto y confirma que `IdleAnimation`/`AttackAnimation` animan `SpriteRenderer.m_Sprite` con >1 frame (flipbook real, no el tween de escala placeholder)

### Implementation for User Story 3

- [x] T022 [US3] En `Assets/Editor/Battler/Chapter1ContentBuilder.cs`, reemplazar `BuildBasePrefab` para usar `Mod Assets/Mod Resources/Sprites/Props/Obelisk.png` (base propia) / `Archway.png` (base enemiga) en vez de `CreateSquareSprite`, con overlay hijo `Hyper_Casual_UI/Sprites/Icons/flag.png`/`skull.png` respectivamente — [contracts/screen-asset-wiring.md](./contracts/screen-asset-wiring.md#chapter1_battleunity--chapter2_battleunity-chapter1contentbuildercs-chapter2contentbuildercs)
- [x] T022b [US3] En `Chapter1ContentBuilder.BuildScene(...)`, añadir un `HudCanvas` mínimo con un botón de pausa/ajustes usando `Assets/Assets/UI Elements/Black/1x/pause.png` (sin lógica de pausado — solo la superficie visual, FR-007) — depende de T022
- [x] T023 [P] [US3] Replicar T022 en `Assets/Editor/Battler/Chapter2ContentBuilder.cs`
- [x] T023b [P] [US3] Replicar T022b en `Chapter2ContentBuilder.cs` — depende de T023
- [x] T024 [US3] En `Chapter1ContentBuilder.BuildUnitDefinition(...)`, reemplazar `CreateScaleClip` por `BattlerArtLibrary.CreateSpriteFrameClip` usando los frames reales de `1_idle/`/`4_attack/` del `hero_N` asignado (jugador) o de la criatura asignada (enemigo), según [contracts/unit-visual-identity-mapping.md](./contracts/unit-visual-identity-mapping.md) — depende de T001-T004
- [x] T025 [P] [US3] Replicar T024 en `Chapter2ContentBuilder.cs` para `player_unit_6`/`player_unit_7`/`enemy_unit_2`
- [x] T026 [US3] En `Chapter1ContentBuilder.CreateVariantPrefab(...)`, reemplazar el cuadrado de color desplazado por un ícono de `Hyper_Casual_UI/Sprites/Icons/` teñido con el `accentColor` ya definido por unidad — depende de T024
- [x] T027 [P] [US3] Replicar T026 en `Chapter2ContentBuilder.cs`
- [x] T028 [US3] Ejecutar "Build Chapter 1 Placeholder Content" + "Build Chapter 2 Placeholder Content", correr `Validate Chapter 1 Scene`/`Validate Chapter 2 Scene` (deben seguir en verde sin modificación), correr T021, y confirmar visualmente en Play contra la pestaña "Batalla (Cap. 1)" del sketch — depende de T022-T027

**Checkpoint**: Batalla usa bases, unidades y variantes reales; `HasValidVisualIdentity` sigue en `true` para las 7 unidades de jugador con contenido real en vez de placeholder.

---

## Phase 6: User Story 4 - Formación de Equipo con retratos reales (Priority: P3)

**Goal**: El roster de Formación de Equipo muestra el mismo `Portrait` que Base del Jugador para cada unidad.

**Independent Test**: Abrir la pantalla de Formación de Equipo reconstruida y confirmar que cada fila de roster muestra el mismo sprite que su tarjeta equivalente en Base del Jugador.

### Implementation for User Story 4

- [x] T029 [US4] Añadir `[SerializeField] private Image m_PortraitImage;` a `Assets/Scripts/View/Battler/TeamFormationRowView.cs` y asignar `m_PortraitImage.sprite = unit.Portrait` (con guarda de nulo) en `Initialize(...)` — data-model.md
- [x] T030 [US4] En `Assets/Editor/Battler/PlayerBaseContentBuilder.cs`, añadir el componente `Image` de retrato a cada fila generada de `TeamFormationUIController` y cablearlo al nuevo campo `m_PortraitImage` — depende de T029
- [x] T031 [US4] Ejecutar "Build Player Base Content", abrir Formación de Equipo en Play, y confirmar que el `Portrait` de cada unidad coincide con el mostrado en Base del Jugador (SC-003) — depende de T006, T007, T020, T030

**Checkpoint**: Las 4 historias de usuario completas — coherencia visual cruzada entre Base/Formación/Batalla verificada.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Confirmar que no queda arte placeholder, y que toda la suite de tests (no solo la nueva) sigue en verde.

- [x] T032 [P] Confirmar con `grep -rn "CreateSquareSprite\|CreateScaleClip" Assets/Editor/Battler/*.cs` que ninguna de las dos funciones sigue en uso en el camino feliz de los 5 content builders (quickstart.md paso 2) — pueden eliminarse si ya no tienen ningún call site
- [x] T033 [P] Correr la suite completa EditMode (`Assets/Tests/EditMode/Battler/*`) y confirmar 100% en verde, incluyendo T008/T009/T016
- [x] T034 [P] Correr la suite completa PlayMode (`Assets/Tests/PlayMode/Battler/*`) y confirmar 100% en verde sin modificación de sus aserciones existentes (research.md §7), incluyendo T021
- [x] T035 Ejecutar quickstart.md de punta a punta (pasos 1-6) y confirmar SC-001 a SC-005 de spec.md

---

## Dependencies & Execution Order

- **Setup (Phase 1)** → bloquea todo lo demás (toda historia usa `BattlerArtLibrary`).
- **Foundational (Phase 2)** → bloquea US2/US3/US4 (todas leen/pueblan `UnitDefinition.Portrait`); US1 (banners) no depende de Phase 2.
- **US1 (Phase 3, P1)**: depende solo de Phase 1. Puede implementarse primero como MVP visual (Menú+Mapa).
- **US2 (Phase 4, P1)**: depende de Phase 1+2 (necesita `Portrait` ya poblado por T006/T007).
- **US3 (Phase 5, P2)**: depende de Phase 1 (no de Phase 2 — las unidades ya tienen `hero_N`/criatura asignado desde T006/T007, pero la animación de frames es independiente del campo `Portrait`).
- **US4 (Phase 6, P3)**: depende de Phase 1+2 y de que US2 (T020) ya haya dejado el patrón de fila-con-retrato probado.
- **Polish (Phase 7)**: depende de que las 4 historias estén completas.

## Parallel Example

```text
# Tras completar Phase 1+2, estas tres historias pueden avanzar en paralelo (archivos distintos):
T010-T015  (US1 — MainMenu/AdventureMap, vistas y editor tools propios)
T017-T020  (US2 — PlayerBase, vistas y editor tools propios)
T022-T028  (US3 — Chapter1/2ContentBuilder, sin overlap de archivo con US1/US2)
```

## Implementation Strategy

**MVP = User Story 1** (Menú Principal + Mapa de Aventuras): es la historia con menos dependencias (solo Setup) y la primera impresión visual del juego. Entregar Phase 1-3 primero, validar contra el sketch, y recién después avanzar a US2/US3/US4 en cualquier orden dentro de sus dependencias.
