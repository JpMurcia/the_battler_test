---

description: "Task list template for feature implementation"
---

# Tasks: Reskin Visual Cyber-Modern — Base del Jugador / Hub

**Input**: Design documents from `/specs/023-player-base-reskin/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/coming-soon-panel.md](./contracts/coming-soon-panel.md), [quickstart.md](./quickstart.md)

**Tests**: Incluidos donde hay lógica real que verificar (EditMode para `ComingSoonUIController`, extensión de PlayMode para los 4 accesos nuevos) — mismo patrón de verificación ya establecido en 001-022. US1/US2 no necesitan tests nuevos: son reskins puros sobre chrome ya cubierto por la suite PlayMode existente, que sirve de guardia de regresión sin modificarse.

**Organization**: Tareas agrupadas por historia de usuario (US1 P1, US2 P1, US3 P3, según spec.md).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: Historia de usuario a la que pertenece la tarea
- Cada tarea incluye la ruta exacta del archivo

## Path Conventions

Proyecto único de Unity — capas `Assets/Scripts/{Model,View}/Battler/`, herramientas de contenido en `Assets/Editor/Battler/`, tests en `Assets/Tests/{EditMode,PlayMode}/Battler/`, según [plan.md § Project Structure](./plan.md#project-structure).

---

## Phase 1: Setup

**Purpose**: Confirmar línea base antes de tocar código.

- [ ] T001 Correr la suite EditMode + PlayMode existente (001-022) en modo batch de Unity sobre `C:\Users\Usuario\Documents\GitHub\IA GAME\the_battler_test` y confirmar que sigue en verde antes de empezar, como línea base de referencia.

**Checkpoint**: Línea base verde confirmada antes de tocar código.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Confirmar que la dependencia compartida por las 3 historias de usuario (el catálogo de tema de 022) está lista — esta spec no crea ningún ScriptableObject nuevo, solo lo consume.

**⚠️ CRITICAL**: Ninguna tarea de Fase 3+ puede empezar hasta completar esta fase.

- [ ] T002 Confirmar que `Assets/ScriptableObjects/Battler/UI/UIThemeCatalog.asset` (creado por `022-cyber-modern-theme`) existe y está poblado con los valores del mockup de referencia — verificación de dependencia, no se crea ningún asset nuevo aquí.

**Checkpoint**: `UIThemeCatalog.asset` confirmado — las 3 historias de usuario pueden empezar.

---

## Phase 3: User Story 1 - Ver la Base del Jugador con la nueva identidad visual (Priority: P1) 🎯 MVP

**Goal**: La cabecera de nivel/XP y el fondo de la Base del Jugador muestran el nuevo estilo visual "cyber-modern" sin ningún cambio de comportamiento respecto al Hub actual.

**Independent Test**: Abrir `PlayerBase.unity`, entrar en Play Mode, y confirmar visualmente el nuevo estilo de la cabecera mientras el nivel de personaje/experiencia disponible siguen actualizándose exactamente igual que antes (spec.md US1).

### Implementation for User Story 1

- [ ] T003 [US1] En `Assets/Editor/Battler/PlayerBaseContentBuilder.cs`: extender la construcción de `PlayerBase.unity` para añadir `ThemedGlassPanel` sobre el contenedor de la cabecera (nivel/XP), referenciando `UIThemeCatalog.asset` — depende de T002
- [ ] T004 [US1] En la misma extensión: asignar `UIThemeCatalog.HeadingFont`/`BodyFont` a los `TMP_Text` de la cabecera (`m_CharacterLevelLabel`, `m_AvailableExperienceLabel`) — depende de T002
- [ ] T005 [US1] Confirmar que `PlayerBaseDashboardUIController.cs`/`PlayerBaseFlowController.cs` quedan sin ninguna modificación por esta historia (diff vacío) y que `Refresh()` vía `ProgressChanged` sigue funcionando igual — hace pasar la Independent Test de esta historia — depende de T003, T004

**Checkpoint**: US1 completa y verificable de forma independiente — cabecera del Hub con el nuevo estilo visual, funcionalidad idéntica a antes de esta spec.

---

## Phase 4: User Story 2 - Acceder a las pantallas ya construidas con el mismo tema (Priority: P1)

**Goal**: Los 7 accesos ya construidos (Mejorar, Equipo, Objetos de Batalla, Cat Guide, Enemy Guide, Menú de Tesoros, Rango de Usuario) se ven con el nuevo tema y siguen abriendo exactamente el mismo panel que abren hoy.

**Independent Test**: Con cada panel opcional asignado, tocar cada uno de los 7 botones y confirmar que abre el panel correcto, themeado, sin cambiar el contenido interno de ese panel (spec.md US2).

### Implementation for User Story 2

- [ ] T006 [P] [US2] En `PlayerBaseContentBuilder.cs`: añadir `ThemedAccentButton` (y `ThemedGlowIcon` donde el mockup de referencia lo use) sobre cada uno de los 7 botones de navegación ya existentes, acento apropiado por botón, referenciando `UIThemeCatalog.asset` — depende de T002
- [ ] T007 [US2] Confirmar que cada uno de los 7 accesos sigue abriendo exactamente el mismo panel que abría antes de esta spec (mismos métodos `OpenXPanel()`/`OnPanelOpened()`/`Refresh()`, sin cambios), y que el contenido interno de esos 7 paneles no cambió — depende de T006
- [ ] T008 [US2] Confirmar el comportamiento nulo-seguro ya existente: con un panel opcional sin asignar en una escena de prueba, el botón correspondiente no aparece ni rompe el layout del resto de accesos themeados (spec.md Edge Cases / US2 Escenario 2) — depende de T006

**Checkpoint**: US1 + US2 completas — el Hub completo (cabecera + los 7 accesos reales) luce el nuevo tema, cero regresión funcional. Esto ya cubre el MVP visual del Hub.

---

## Phase 5: User Story 3 - Ver claramente qué accesos todavía no están disponibles (Priority: P3)

**Goal**: Los 4 accesos a sistemas todavía no construidos (Gamatoto, Cápsula, Almacén, Tienda) se ven themeados y abren un único panel placeholder compartido "Próximamente" que identifica el sistema, sin navegar a ninguna pantalla real.

**Independent Test**: Tocar cada uno de los 4 accesos nuevos y confirmar que cada uno abre el mismo panel placeholder con el nombre de sistema correcto, sin excepciones ni navegación real (spec.md US3).

### Tests for User Story 3 ⚠️

- [ ] T009 [P] [US3] EditMode test nuevo `ComingSoonUIControllerTests.cs` en `Assets/Tests/EditMode/Battler/`: `ShowSystem("Gamatoto")` actualiza el label a "Gamatoto"; dos llamadas sucesivas con nombres distintos dejan el label con el segundo (misma instancia reutilizada); `m_SystemNameLabel` sin asignar no lanza excepción (spec.md Edge Cases) — depende de T002

### Implementation for User Story 3

- [ ] T010 [US3] Crear `ComingSoonUIController.cs` en `Assets/Scripts/View/Battler/ComingSoonUIController.cs`, según [data-model.md § ComingSoonUIController](./data-model.md#comingsoonuicontroller-nuevo-assetsscriptsviewbattlercomingsoonuicontrollercs) y [contracts/coming-soon-panel.md](./contracts/coming-soon-panel.md) — hace pasar T009 — depende de T009
- [ ] T011 [US3] En `PlayerBaseDashboardUIController.cs`: agregar los 6 campos `[SerializeField]` opcionales nuevos (`m_GamatotoNavigationButton`, `m_GachaNavigationButton`, `m_StorageNavigationButton`, `m_ShopNavigationButton`, `m_ComingSoonPanel`, `m_ComingSoonUIController`), el método privado `OpenComingSoon(string systemName)`, y los 4 `AddListener` nuevos en `Awake()` (data-model.md, [contracts/coming-soon-panel.md § PlayerBaseDashboardUIController.OpenComingSoon](./contracts/coming-soon-panel.md#playerbasedashboarduicontrolleropencomingsoonstring-systemname--contrato-de-apertura)) — sin tocar ningún campo/método existente — depende de T010
- [ ] T012 [US3] En `PlayerBaseContentBuilder.cs`: crear los 4 `GameObject` de botón nuevos (Gamatoto/Cápsula/Almacén/Tienda) y el `GameObject` `ComingSoonPanel` en `PlayerBase.unity`, cablearlos a los campos nuevos de T011, y añadir `ThemedGlassPanel`/`ThemedAccentButton`/`ThemedGlowIcon` sobre ellos referenciando `UIThemeCatalog.asset` — depende de T002, T011
- [ ] T013 [US3] Extender `Assets/Tests/PlayMode/Battler/PlayerBaseFlowPlayModeTests.cs` con 4 casos nuevos: cada uno de los 4 accesos abre `ComingSoonPanel` con el nombre de sistema correcto, sin tocar ningún assert ya existente sobre los 7 accesos previos (spec.md SC-005) — depende de T012

**Checkpoint**: Las 3 historias de usuario quedan completas e independientemente funcionales — el Hub completo (cabecera, 7 accesos reales, 4 accesos "Próximamente") luce el nuevo tema, cero regresión funcional.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T014 [P] Revisar que la implementación final no se haya desviado de [contracts/coming-soon-panel.md](./contracts/coming-soon-panel.md) / [data-model.md](./data-model.md) / [research.md](./research.md); actualizar esos documentos si hubo un cambio deliberado durante la implementación.
- [ ] T015 Correr la suite completa EditMode + PlayMode (001-023) en modo batch de Unity y confirmar 0 errores/0 warnings de compilación y 100% de tests en verde, incluyendo `PlayerBaseFlowPlayModeTests.cs` con sus asserts previos intactos.
- [ ] T016 Ejecutar los 6 pasos de validación manual de [quickstart.md](./quickstart.md) (comparación perceptual contra el mockup de referencia "Battle Cats Modernizado", pantalla `isHub`), incluyendo confirmar explícitamente que ninguna otra pantalla del juego cambió (FR-004) y que el contenido interno de los 7 paneles existentes no cambió — probablemente requiera el Editor con GUI, mismo criterio documentado para pasos equivalentes en specs anteriores.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Fase 1)**: sin dependencias
- **Foundational (Fase 2)**: depende de Setup — bloquea las 3 historias de usuario
- **US1 (Fase 3)**: depende de Foundational
- **US2 (Fase 4)**: depende de Foundational — independiente de US1 (archivos y GameObjects distintos dentro de `PlayerBaseContentBuilder.cs`)
- **US3 (Fase 5)**: depende de Foundational — independiente de US1/US2, pero es la única historia que modifica `PlayerBaseDashboardUIController.cs`
- **Polish (Fase 6)**: depende de que las 3 historias estén completas

### User Story Dependencies

- **US1 (P1)**: tras Foundational — sin dependencia de otras historias; entrega el reskin de la cabecera
- **US2 (P1)**: tras Foundational — sin dependencia de US1; entrega el reskin de los 7 accesos reales
- **US3 (P3)**: tras Foundational — sin dependencia de US1/US2; entrega el panel "Próximamente" compartido y los 4 accesos nuevos

### Parallel Opportunities

- T006 (Fase 4) puede avanzar en paralelo con T003/T004 (Fase 3) una vez completada la Fase 2 — tocan GameObjects distintos dentro del mismo `PlayerBaseContentBuilder.cs`, sin dependencia entre sí
- T009 (Fase 5, test) puede escribirse en paralelo con T003/T004/T006 — archivo distinto, sin dependencias entre sí

---

## Parallel Example: User Story 1 + User Story 2 (tras Foundational)

```bash
# Lanzar juntos los cambios independientes entre si (mismos archivo pero GameObjects/secciones distintas):
Task: "Añadir ThemedGlassPanel sobre la cabecera del Hub en PlayerBaseContentBuilder.cs (US1, T003)"
Task: "Añadir ThemedAccentButton sobre los 7 botones ya existentes en PlayerBaseContentBuilder.cs (US2, T006)"
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 2)

1. Completar Fase 1: Setup
2. Completar Fase 2: Foundational (bloqueante — confirmar `UIThemeCatalog.asset` de 022)
3. Completar Fase 3: US1 (cabecera themeada) y Fase 4: US2 (7 accesos reales themeados) — ambas P1, en paralelo o en cualquier orden
4. **Detener y validar**: confirmar T005/T007/T008 (regresión funcional), luego el quickstart.md completo con GUI
5. Fase 5 (US3, P3) es la única historia que agrega código nuevo a `PlayerBaseDashboardUIController.cs` — puede diferirse si se prioriza cerrar primero el reskin de lo ya construido

### Incremental Delivery

1. Setup + Foundational → `UIThemeCatalog.asset` confirmado
2. + US1 → cabecera del Hub con el nuevo estilo visual, cero regresión
3. + US2 → los 7 accesos reales themeados, cero regresión — el Hub ya luce completo salvo los 4 accesos "Próximamente"
4. + US3 → panel compartido "Próximamente" + 4 accesos nuevos, cerrando FR-007/SC-005
5. Fase 6 → verificación final y quickstart manual con GUI

## Notes

- [P] = archivos distintos, o mismo archivo pero secciones/GameObjects independientes sin dependencias pendientes
- `UIThemeCatalog.cs`/`ThemedGlassPanel.cs`/`ThemedAccentButton.cs`/`ThemedGlowIcon.cs` no aparecen en ninguna tarea de creación — ya existen de `022-cyber-modern-theme` y se consumen tal cual (research.md §1).
- `PlayerBaseDashboardUIController.cs` solo se modifica en la Fase 5 (US3, T011) — US1 y US2 son reskins puros vía componentes hermanos, igual que `022` dejó `MainMenuUIController.cs` sin tocar.
- Ninguna tarea de esta spec toca el contenido interno de los 7 paneles ya construidos, ni ninguna otra pantalla del juego (Mapa de Etapas, Batalla, Equipar, Mejorar, Biblioteca, Perfil) — quedan para las fases V3-V8 de `docs/roadmap-rediseno-visual.md`.
