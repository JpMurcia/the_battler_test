# Implementation Plan: Dashboard de Base del Jugador

**Branch**: `005-player-dashboard` | **Date**: 2026-07-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-player-dashboard/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Pantalla de base del jugador, alcanzable desde un banner de aventura desbloqueado con contenido real (`004-adventure-map-banners`), que muestra el nivel de personaje agregado (suma de los niveles de sus unidades) y la experiencia acumulada disponible (FR-001 a FR-003), ofrece una pantalla de mejora de unidades donde gastar esa experiencia para subir el nivel de una unidad específica sin permitir mejoras que no se puedan pagar (FR-004 a FR-007), y una pantalla de organización de equipo donde elegir qué unidades llevar a la próxima batalla, sin permitir un equipo vacío (FR-008 a FR-010). Enfoque técnico: se introduce un nuevo agregado de guardado local `PlayerProgressSaveData` (`unitProgress[]`, `availableExperience`, `activeTeamUnitIds[]`) persistido en `player-progress.json`, replicando exactamente el patrón de escritura atómica y lectura tolerante a corrupción ya validado en `LocalChapterProgressStore` (002) y `LocalMenuSettingsStore` (003), detrás de un nuevo contrato `IPlayerProgressStore`. El costo de mejora por nivel vive en un `ScriptableObject` (`UnitLevelingConfig`, Principio V) en vez de una fórmula hardcodeada. `UnitProgress`/`PlayerExperiencePool` no se añaden a `UnitDefinition` (001) — son progreso de jugador, una capa separada sobre datos de diseño estáticos, coherente con cómo 002 ya separó "progreso de capítulo" de `ChapterDefinition`. El nivel de personaje (`PlayerCharacterLevel`) nunca se persiste: se calcula bajo demanda como la suma de los niveles de `ChapterDefinition.AvailableUnits`, asumiendo nivel base 1 para cualquier unidad sin progreso guardado. La integración de `TeamFormation` con la batalla es el punto de menor riesgo posible: una función pura `TeamFormationRosterFilter.Apply(availableUnits, activeTeamUnitIds)` que `BattleStateManager.SetupChapter()` invoca antes de `UnitDeploymentController.Initialize(...)`, sin modificar `ChapterDefinition` ni la firma de `UnitDeploymentController` — mismo criterio de superficie mínima ya usado por 003 (extraer una constante de `LocalChapterProgressStore`) y por 004 (no tocar `ChapterDefinition` para el desbloqueo). El fondo distinto por aventura (FR-011, Historia 4, P3) se resuelve hoy con un campo de fondo fijo en la escena, porque `004-adventure-map-banners` todavía no tiene implementación en C# y solo existe un banner jugable real — queda documentado como extensión aditiva futura sin impacto en las entidades de datos de esta feature.

## Technical Context

**Language/Version**: C# (Unity 6000.3.20f1 scripting runtime), mismo proyecto que los Capítulos 1, el guardado local, el menú principal y el mapa de aventuras.

**Primary Dependencies**: APIs del propio motor únicamente — `UnityEngine.UI`/`TMPro` (ya referenciado en `TheBattler.View`), `System.IO`, `UnityEngine.JsonUtility`. No se añade ningún paquete nuevo.

**Storage**: Un archivo JSON local nuevo, `player-progress.json`, en `Application.persistentDataPath` (mismo mecanismo que `progress.json`, 002, y `menu-settings.json`, 003, pero un archivo propio e independiente — ver research.md §1). Esta feature no lee ni escribe `progress.json` ni `menu-settings.json`; lee `ChapterDefinition.AvailableUnits` (001, solo lectura, para conocer el roster de unidades del jugador — ver research.md §9).

**Testing**: Unity Test Framework, mismo split que 001-004. EditMode (NUnit puro) para `LocalPlayerProgressStore`, `PlayerCharacterLevelCalculator`, validación de `UnitLevelingConfig`, `UnitLevelingController` y `TeamFormationController`/`TeamFormationRosterFilter` (todas testables sin `MonoBehaviour` ni escena — research.md §4). PlayMode para `PlayerBaseFlowController` (resolución de dependencias reales en `Awake()`) y para la integración equipo activo → roster de batalla en `BattleStateManager`.

**Target Platform**: El mismo definido por el proyecto (Unity 6000.3.20f1, URP 2D); sin restricciones de plataforma adicionales. SC-001 asume dispositivo móvil de gama media, misma referencia de hardware objetivo que 003/004.

**Project Type**: Proyecto único de Unity (`the_battler_test`); no se crea ningún módulo/proyecto nuevo, se extiende la estructura de asmdefs existente (Core→Model→Gameplay→View) y se añade una escena nueva (`PlayerBase.unity`).

**Performance Goals**: SC-001 — el dashboard muestra nivel de personaje y experiencia disponible en menos de 2 segundos desde que se entra a la base (lectura de un archivo JSON pequeño + cálculo en memoria, sin red). SC-002 — mejorar una unidad con experiencia suficiente toma 2 acciones o menos desde el dashboard.

**Constraints**: Una mejora sin experiencia suficiente o con la unidad en nivel máximo nunca descuenta experiencia ni deja estado parcial (FR-006, SC-003); un equipo activo vacío nunca se persiste, se conserva el último equipo válido (FR-010); datos de `player-progress.json` corruptos o ilegibles se tratan como ausencia de progreso de mejora (unidades en nivel base) y sin equipo activo definido (equipo por defecto con todas las unidades), sin bloquear la carga del dashboard (FR-013); sin gacha, monedas ni tickets (FR-012 — la única moneda de progresión es la experiencia).

**Scale/Scope**: Hoy 1 `ChapterDefinition` real (Capítulo 1, 001) con 5 unidades — la curva de costo de mejora (`UnitLevelingConfig`) es compartida entre las 5, no por unidad (research.md §2); el mecanismo debe escalar a más capítulos/unidades sin cambio estructural (los contratos ya reciben el roster como parámetro, no hardcodean las 5 unidades). Un único slot de progreso de base local, sin perfiles múltiples, mismo patrón que 002/003.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación |
|---|---|
| I. Narrativa Integrada | N/A — el dashboard es UI de progresión/meta-juego, no contenido narrativo de capítulo; no sustituye ni duplica el diálogo pre/post-batalla que ya vive en `ChapterDefinition` (001). Sin conflicto. |
| II. Combate Automático por Despliegue | Alineación parcial e intencional: esta feature no cambia ninguna regla de combate (coste/cooldown/daño de `UnitDefinition` siguen intactos); `TeamFormation` solo restringe **qué subconjunto** de unidades ya definidas está disponible para desplegar en la siguiente batalla (FR-009), vía un filtro puro aplicado antes de que `UnitDeploymentController` construya sus slots. No contradice el principio, opera estrictamente antes de que el combate autónomo empiece. |
| III. Identidad Visual Animada | N/A directo — no se introduce ninguna unidad nueva; el dashboard presenta unidades ya existentes (001), cuya identidad visual (idle/ataque/variante) ya está validada por 001 y no se modifica aquí. |
| IV. Progresión por Capítulos con Desbloqueo | Alineación de apoyo: el dashboard solo es alcanzable desde un banner ya desbloqueado con contenido real (spec.md Assumptions, dependencia de 004); esta feature no implementa lógica de desbloqueo de capítulos en sí, añade la capa de progresión **dentro** de un capítulo ya desbloqueado (nivel de unidad/personaje), complementaria al desbloqueo **entre** capítulos que 004 ya cubre. |
| V. Balance Dirigido por Datos | Alineación central: `UnitLevelingConfig` (curva de costo de experiencia por nivel, techo de nivel) es un `ScriptableObject`, mismo patrón que `UnitDefinition`/`ChapterDefinition`/`EnemyWaveDefinition`. `UnitProgress`/`PlayerProgressSaveData` (progreso de jugador, no dato de diseño) son clases planas + store JSON, igual que `ProgressSaveData`/`MenuSettings` — no se modelan como ScriptableObject porque no son contenido de diseño compartido entre jugadores. |
| VI. Simplicidad desde el MVP | Fuerte alineación: exclusión explícita de gacha/monedas/tickets (FR-012); una sola curva de costo compartida entre las 5 unidades en vez de configuración por unidad (research.md §2); reutilización directa del patrón de persistencia de 002/003 en vez de uno nuevo; fondo por banner resuelto con un campo fijo hoy en vez de una abstracción de "proveedor de fondo" sin consumidor real todavía (research.md §7). |

Sin violaciones que requieran justificación en Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/005-player-dashboard/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── player-progress-store.md
│   ├── unit-leveling.md
│   └── team-formation.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
Assets/Scripts/
├── Model/Battler/
│   ├── UnitProgress.cs                     # nuevo — dato plano: unitId, level, experienceInvested (anidado en PlayerProgressSaveData)
│   ├── PlayerProgressSaveData.cs           # nuevo — agregado: formatVersion, unitProgress[], availableExperience, activeTeamUnitIds[]
│   ├── IPlayerProgressStore.cs             # nuevo — contrato Load()/Save()
│   └── UnitLevelingConfig.cs               # nuevo — ScriptableObject: maxLevel, experienceCostPerLevel[]
├── Gameplay/Battler/
│   ├── LocalPlayerProgressStore.cs         # nuevo — implementacion JSON, mismo patron que LocalChapterProgressStore/LocalMenuSettingsStore
│   ├── PlayerCharacterLevelCalculator.cs   # nuevo — logica pura: Calculate(ownedUnits, unitProgress) -> int (testable sin escena)
│   ├── UnitLevelingController.cs           # nuevo — clase plana (no MonoBehaviour): TryLevelUp(unitId), GetUnitLevel, TryGetNextLevelCost
│   ├── TeamFormationController.cs          # nuevo — clase plana (no MonoBehaviour): TryConfirmFormation(selectedUnitIds)
│   ├── TeamFormationRosterFilter.cs        # nuevo — logica pura: Apply(availableUnits, activeTeamUnitIds) -> UnitDefinition[] (testable sin escena)
│   ├── PlayerBaseFlowController.cs         # nuevo — MonoBehaviour: resuelve IPlayerProgressStore/ChapterDefinition en Awake() (mismo patron que MainMenuFlowController), construye UnitLevelingController/TeamFormationController, expone estado a View
│   └── BattleStateManager.cs               # modificado — SetupChapter() filtra AvailableUnits vía TeamFormationRosterFilter (usando IPlayerProgressStore resuelto en Awake) antes de UnitDeploymentController.Initialize(...)

Assets/Scripts/View/Battler/
├── PlayerBaseDashboardUIController.cs      # nuevo — muestra nivel de personaje + experiencia disponible, fondo de escena, navega a las pantallas de mejora/organizacion
├── UnitUpgradeUIController.cs              # nuevo — lista unidades con nivel actual/costo de siguiente mejora, boton "Mejorar" habilitado solo si hay experiencia suficiente y no esta en nivel maximo
└── TeamFormationUIController.cs            # nuevo — seleccion pendiente vs. confirmada (mismo patron que SettingsPanelController, 003), boton "Confirmar" deshabilitado si la seleccion pendiente queda vacia

Assets/Scenes/
└── PlayerBase.unity                        # nueva — registrada en Build Settings (indice exacto definido en tasks.md)

Assets/Data/Battler/
└── DefaultUnitLevelingConfig.asset         # nuevo — instancia de UnitLevelingConfig con la curva de costo compartida por las 5 unidades del Capitulo 1

Assets/Tests/
├── EditMode/Battler/
│   ├── LocalPlayerProgressStoreTests.cs        # nuevo — round-trip, sin archivo, archivo corrupto, clamp de experiencia negativa
│   ├── PlayerCharacterLevelCalculatorTests.cs  # nuevo — sin progreso = suma de niveles base, progreso mixto
│   ├── UnitLevelingConfigValidationTests.cs    # nuevo — maxLevel >= 2, longitud de experienceCostPerLevel, costos positivos
│   ├── UnitLevelingControllerTests.cs          # nuevo — mejora exitosa descuenta/sube nivel/persiste/dispara evento; experiencia insuficiente y nivel maximo rechazados sin efectos parciales
│   ├── TeamFormationRosterFilterTests.cs       # nuevo — null/vacio -> roster completo, subconjunto preserva orden, ids desconocidos ignorados, resultado vacio -> fallback a roster completo
│   └── TeamFormationControllerTests.cs         # nuevo — confirmar vacio rechazado sin persistir, seleccion valida persiste y actualiza ActiveTeamUnitIds
└── PlayMode/Battler/
    ├── PlayerBaseFlowPlayModeTests.cs              # nuevo — resolucion real de dependencias en Awake(), nivel/experiencia consistentes con save sembrado
    └── TeamFormationBattleIntegrationPlayModeTests.cs # nuevo — BattleStateManager.SetupChapter() deja en UnitDeploymentController.Slots solo las unidades del equipo activo guardado
```

**Structure Decision**: Se reutiliza la misma capa de asmdefs ya validada en 001-004 (`TheBattler.Core` → `TheBattler.Model` → `TheBattler.Gameplay` → `TheBattler.View`); no se crea ningún ensamblado nuevo, ni ninguna carpeta nueva en `Core/Battler` (no hay ningún enum/interfaz sin dependencias que esta feature necesite añadir). Los datos y contratos (`UnitProgress`, `PlayerProgressSaveData`, `IPlayerProgressStore`, `UnitLevelingConfig`) van en Model, igual que `ProgressSaveData`/`IChapterProgressStore`/`ChapterDefinition`. Las implementaciones con I/O (`LocalPlayerProgressStore`) y la lógica de orquestación/comportamiento (`PlayerCharacterLevelCalculator`, `UnitLevelingController`, `TeamFormationController`, `TeamFormationRosterFilter`, `PlayerBaseFlowController`) van en Gameplay, igual que `LocalChapterProgressStore`/`BattleOutcomeResolver`/`MainMenuFlowController`. `UnitLevelingController` y `TeamFormationController` se modelan deliberadamente como clases planas (no `MonoBehaviour`) para que su lógica de negocio (`TryLevelUp`, `TryConfirmFormation`) sea testeable en EditMode sin escena — ver research.md §4, mismo criterio de testabilidad que ya motivó `ISceneNavigator` en 003. Los componentes de UI van en View, igual que `MainMenuUIController`/`SettingsPanelController`/`AdventureMapUIController`. La única modificación a un archivo existente es `BattleStateManager.cs` (un filtro de una línea en `SetupChapter()`, más la resolución de `IPlayerProgressStore` en `Awake()` siguiendo el patrón ya usado para `IChapterProgressStore`) — no se toca `ChapterDefinition.cs`, `UnitDefinition.cs` ni `UnitDeploymentController.cs` (ver research.md §5 y contracts/team-formation.md).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Sin violaciones — tabla omitida.

## Post-Design Constitution Re-check

*Tras completar research.md, data-model.md, contracts/ y quickstart.md (Fase 1).*

El diseño final (`PlayerProgressSaveData`/`IPlayerProgressStore`/`LocalPlayerProgressStore` replicando exactamente el patrón de `ProgressSaveData`/`IChapterProgressStore`/`LocalChapterProgressStore` de 002 y `MenuSettings`/`IMenuSettingsStore`/`LocalMenuSettingsStore` de 003; `UnitLevelingConfig` como `ScriptableObject` compartido en vez de configuración por unidad; `PlayerCharacterLevelCalculator` como función pura que nunca persiste el nivel de personaje; `UnitLevelingController`/`TeamFormationController` como clases planas testables en EditMode; `TeamFormationRosterFilter` como el único punto de integración con la batalla, aplicado desde una modificación mínima de `BattleStateManager.SetupChapter()`) no introdujo ninguna dependencia, capa o mecanismo fuera de lo ya contemplado en el Constitution Check inicial. Las 6 evaluaciones de la tabla anterior se mantienen sin cambios. Sigue sin haber violaciones ni necesidad de Complexity Tracking.

Dos precisiones de alcance identificadas durante el diseño (no cambios de scope de la feature, sino acotaciones explícitas, mismo estilo que 003/004 documentaron las suyas):

1. `BattleStateManager.cs` requiere una modificación mínima adicional (resolver `IPlayerProgressStore` en `Awake()` y filtrar `AvailableUnits` con `TeamFormationRosterFilter` antes de `UnitDeploymentController.Initialize(...)`, ver research.md §5 y contracts/team-formation.md) — no cambia ningún comportamiento de 001/002/003 existente (`IChapterProgressStore`, diálogo, resolución de victoria/derrota siguen intactos), solo añade un paso adicional de preparación del roster.
2. El fondo distinto por aventura (FR-011, Historia 4) se resuelve en este plan con un campo de fondo fijo en `PlayerBase.unity`, no con una abstracción de "proveedor de fondo por banner" — porque `004-adventure-map-banners` todavía no tiene ninguna clase C# implementada en el repo (verificado: no existe `ChapterBannerDefinition.cs`) y hoy solo hay un banner jugable real. Esto no reduce el alcance funcional de esta feature (FR-011 se cumple trivialmente con un único fondo real existente) y queda documentado como extensión aditiva futura sin impacto en `UnitProgress`/`PlayerExperiencePool`/`TeamFormation` (research.md §7).
