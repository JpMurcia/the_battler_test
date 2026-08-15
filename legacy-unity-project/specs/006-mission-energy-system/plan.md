# Implementation Plan: Sistema de Energía y Escalado de Dificultad por Misión

**Branch**: `006-mission-energy-system` | **Date**: 2026-07-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-mission-energy-system/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Recurso de progresión a nivel de mapa de aventuras — `MissionEnergyPool` — que se gasta al entrar a una misión (FR-002/FR-003), bloquea la entrada sin penalización cuando no alcanza (FR-004/FR-005), se recupera automáticamente con el tiempo hasta un máximo vigente (FR-006), y cuyo máximo escala con `PlayerCharacterLevel` (`005-player-dashboard`, FR-007). Las misiones — el mismo `ChapterBanner`/`ChapterBannerDefinition` ya definido en `004-adventure-map-banners` (spec.md Assumptions, sin pantalla de selección nueva) — se agrupan en `Region` con dificultad progresiva interna (FR-008/FR-009). Enfoque técnico: nuevo agregado de guardado local `MissionEnergySaveData` (`currentEnergy`, `lastUpdateTimestampUtc`) persistido en `mission-energy.json`, replicando exactamente el patrón de escritura atómica y lectura tolerante a corrupción ya validado en `LocalChapterProgressStore` (002), `LocalMenuSettingsStore` (003) y el `LocalPlayerProgressStore` planeado en 005, detrás de un nuevo contrato `IMissionEnergyStore`. La energía máxima y la tasa de regeneración viven en un `ScriptableObject` (`MissionEnergyConfig`, Principio V) con una fórmula lineal simple (`baseMaxEnergy + maxEnergyPerCharacterLevel * characterLevel`, research.md §2) — sin curva por tramos, sin datos de balance reales que la justifiquen hoy. `MissionEnergyController` (clase plana, no `MonoBehaviour`, testable en EditMode) expone `Sync(nowUtc, characterLevel)` y `TryEnterMission(cost)` como operaciones separadas y atómicas — mismo criterio de testabilidad que `BattleResourceController.Tick()` (001) y `UnitLevelingController.TryLevelUp` (005). `ChapterBannerDefinition` (004) gana tres campos nuevos (`EnergyCost`, `Region`, `DifficultyRank`); un nuevo `Region` [SO] liviano (solo identidad) reutiliza el orden ya existente de `AdventureMap.Banners` (004) como secuencia interna de dificultad, sin introducir un segundo array ordenado (research.md §5). La integración con la UI de selección de misiones es una extensión mínima de `AdventureMapFlowController.TrySelectBanner` (004): antes de navegar, además de la guarda de desbloqueo ya existente, se exige `MissionEnergyController.TryEnterMission(banner.EnergyCost) == true` (research.md §6). **Distinción explícita** (constitución, Principio II): `MissionEnergyPool` es un recurso completamente separado del "Recurso de Batalla (Energía/Dinero)" (`IBattleResourceSource`/`BattleResourceController`, 001) — no se modifica ningún archivo de ese sistema.

## Technical Context

**Language/Version**: C# (Unity 6000.3.20f1 scripting runtime), mismo proyecto que Capítulo 1, guardado local, menú principal, mapa de aventuras y dashboard de base.

**Primary Dependencies**: APIs del propio motor únicamente — `System.IO`, `UnityEngine.JsonUtility`, `System.DateTime`/`DateTimeOffset` (marca de tiempo Unix UTC para regeneración offline). No se añade ningún paquete nuevo.

**Storage**: Un archivo JSON local nuevo, `mission-energy.json`, en `Application.persistentDataPath` (mismo mecanismo que `progress.json` 002, `menu-settings.json` 003, `player-progress.json` 005, pero un archivo propio e independiente — data-model.md). Esta feature no lee ni escribe esos tres archivos existentes; lee `ChapterDefinition.AvailableUnits` y `PlayerProgressSaveData` (005, solo lectura, vía `IPlayerProgressStore`/`PlayerCharacterLevelCalculator`, para obtener `characterLevel`) y `AdventureMap.Banners`/`ChapterBannerDefinition` (004, solo lectura salvo los tres campos nuevos que esta feature añade a esa definición de datos).

**Testing**: Unity Test Framework, mismo split que 001-005. EditMode (NUnit puro) para `LocalMissionEnergyStore`, `MissionEnergyConfig` (validación de datos), `MissionEnergyController` (regeneración, gasto atómico) y `MissionRegionDifficultyValidationTests` (`Region`/`ChapterBannerDefinition` extendido) — todas testables sin `MonoBehaviour` ni escena. PlayMode para la integración con `AdventureMapFlowController.TrySelectBanner` (energía suficiente/insuficiente → navega o no).

**Target Platform**: El mismo definido por el proyecto (Unity 6000.3.20f1, URP 2D); sin restricciones de plataforma adicionales. Mismo hardware de referencia que 003/004/005.

**Project Type**: Proyecto único de Unity (`the_battler_test`); no se crea ningún módulo/proyecto nuevo, se extiende la estructura de asmdefs existente (Core→Model→Gameplay→View). No se añade ninguna escena nueva — la energía se muestra en `AdventureMap.unity` (004, ya planeada), no requiere una pantalla propia (spec.md Assumptions: sin pantalla de selección de misiones separada).

**Performance Goals**: Sin objetivo de rendimiento propio distinto a los ya establecidos por 004 (mapa interactivo en <2s) — `Sync`/`TryEnterMission` son cálculos aritméticos en memoria más una lectura/escritura de un archivo JSON pequeño, sin red ni bucles no acotados.

**Constraints**: Un intento de entrada bloqueado por energía insuficiente nunca descuenta energía ni deja estado parcial (FR-005, SC-002); la energía recuperada nunca supera el máximo vigente, con o sin el juego cerrado de por medio (FR-006, Edge Case de spec.md); un dato de energía corrupto o ilegible se trata como ausencia de progreso → energía al máximo por defecto, sin bloquear la carga del mapa (FR-011); esta feature no introduce ni modifica ninguna misión de evento/especial con ventana horaria (FR-012, fuera de alcance); no se modifica `BattleResourceController.cs`/`IBattleResourceSource.cs` ni ningún archivo del Recurso de Batalla del Principio II.

**Scale/Scope**: Hoy 1 región con 1 misión real (Capítulo 1, `001-chapter1-vertical-slice`, banner "Imperio de los Test/Robot" de 004) — el escalado de dificultad dentro de esa región no tiene efecto observable todavía (Edge Case de spec.md), pero el mecanismo (`Region` + `DifficultyRank` + reutilización del orden de `AdventureMap.Banners`) debe escalar a N regiones/misiones sin cambio estructural, mismo criterio de "diseño genérico desde el día uno" ya aplicado por 004 (FR-007 de esa feature) y 005.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación |
|---|---|
| I. Narrativa Integrada | N/A — la energía y la dificultad de región son sistemas de progresión/economía de mapa, no contenido narrativo; no sustituyen ni duplican el diálogo pre/post-batalla que ya vive en `ChapterDefinition` (001). Sin conflicto. |
| II. Combate Automático por Despliegue | **Requiere distinción explícita, sin violación**: el Recurso de Batalla (Energía/Dinero) de este principio (`IBattleResourceSource`/`BattleResourceController`, 001) se acumula y gasta **dentro** de una batalla para desplegar unidades; `MissionEnergyPool` (esta feature) es un recurso distinto que se gasta **al entrar** a una misión desde el mapa de aventuras, antes de que el combate autónomo empiece. Ningún archivo del sistema de combate (`BattleResourceController.cs`, `IBattleResourceSource.cs`, `UnitDeploymentController.cs`) se modifica. Ambos recursos comparten el nombre "energía" en el documento base pero no comparten código, datos ni UI (spec.md Assumptions lo marca explícitamente). |
| III. Identidad Visual Animada | N/A — este principio aplica a personajes jugables (unidades); ni `MissionEnergyPool`, ni `Region`, ni el `DifficultyRank` de una misión son unidades ni requieren animación. Sin conflicto. |
| IV. Progresión por Capítulos con Desbloqueo | Alineación de apoyo, mismo criterio que 005 respecto a 004: esta feature no reemplaza el desbloqueo secuencial de banners (`ChapterBannerUnlockEvaluator`, 004) — añade una segunda precondición independiente (energía suficiente) sobre el mismo punto de entrada (`AdventureMapFlowController.TrySelectBanner`), sin tocar la lógica de desbloqueo existente. La dificultad progresiva por región (FR-009) es un refinamiento **dentro** de una región ya desbloqueable, complementario al desbloqueo **entre** banners que 004 ya cubre. |
| V. Balance Dirigido por Datos | Alineación central: `MissionEnergyConfig` (energía máxima base, incremento por nivel, intervalo de regeneración) es un `ScriptableObject`, mismo patrón que `UnitLevelingConfig` (005)/`UnitDefinition`/`ChapterDefinition`. `Region` (identidad de agrupación) también es un `ScriptableObject`. `EnergyCost`/`DifficultyRank` se añaden como campos de datos en `ChapterBannerDefinition` (SO), nunca como literales en `MissionEnergyController` ni en `AdventureMapFlowController`. `MissionEnergySaveData` (progreso de jugador, no dato de diseño) es una clase plana + store JSON, igual que `ProgressSaveData`/`MenuSettings`/`PlayerProgressSaveData`. |
| VI. Simplicidad desde el MVP | Fuerte alineación: fórmula lineal de dos coeficientes para energía máxima en vez de una curva por tramos sin datos de balance reales que la justifiquen (research.md §2); `Region` deliberadamente sin array propio de misiones, reutilizando el orden de `AdventureMap.Banners` en vez de duplicar estado (research.md §5); sin abstracción de reloj nueva (`ISystemClock`), un parámetro `DateTime` explícito basta para el único llamador real hoy (research.md §4); reutilización directa del patrón de persistencia atómica de 002/003/005 en vez de uno nuevo. |

Sin violaciones que requieran justificación en Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/006-mission-energy-system/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── mission-energy-store.md
│   ├── mission-energy-controller.md
│   └── mission-catalog-extension.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
Assets/Scripts/
├── Model/Battler/
│   ├── MissionEnergySaveData.cs        # nuevo — agregado persistido: formatVersion, currentEnergy (default -1, centinela "sin dato"), lastUpdateTimestampUtc (long, segundos Unix UTC)
│   ├── IMissionEnergyStore.cs          # nuevo — contrato Load()/Save()
│   ├── MissionEnergyConfig.cs          # nuevo — ScriptableObject: baseMaxEnergy, maxEnergyPerCharacterLevel, regenIntervalSeconds
│   ├── Region.cs                       # nuevo — ScriptableObject: regionId, displayNameKey (sin array propio de misiones, ver research.md §5)
│   └── ChapterBannerDefinition.cs      # EXTENSIÓN de 004 (pendiente de implementación en C# — ver research.md §7) — +EnergyCost (int), +Region (Region, nullable), +DifficultyRank (int). Ningún campo existente de 004 se modifica.
├── Gameplay/Battler/
│   ├── LocalMissionEnergyStore.cs      # nuevo — implementación JSON, mismo patrón que LocalChapterProgressStore/LocalMenuSettingsStore/LocalPlayerProgressStore (mission-energy.json)
│   ├── MissionEnergyController.cs      # nuevo — clase plana: Sync(DateTime nowUtc, int characterLevel), TryEnterMission(int cost), CurrentEnergy/MaxEnergy, evento EnergyChanged
│   └── AdventureMapFlowController.cs   # EXTENSIÓN de 004 (pendiente de implementación en C# — ver research.md §6-7) — Awake() adicionalmente resuelve IMissionEnergyStore/MissionEnergyConfig/IPlayerProgressStore, calcula characterLevel vía PlayerCharacterLevelCalculator (005), construye MissionEnergyController y llama Sync(...); expone CurrentEnergy/MaxEnergy; TrySelectBanner(index) añade la precondición TryEnterMission(banner.EnergyCost) tras la guarda de desbloqueo ya existente

Assets/Scripts/View/Battler/
└── MissionEnergyBarView.cs             # nuevo — componente UI simple (TMP) que muestra "CurrentEnergy/MaxEnergy" en el mapa de aventuras (FR-001); se refresca leyendo AdventureMapFlowController.CurrentEnergy/MaxEnergy y suscribiéndose a MissionEnergyController.EnergyChanged (expuesto por el flow controller)

Assets/Data/Battler/
├── DefaultMissionEnergyConfig.asset    # nuevo — instancia de MissionEnergyConfig con la curva/tasa inicial
└── Regions/
    └── ImperioDeLosTestRobotRegion.asset  # nuevo — instancia de Region para la única región real de hoy; el ChapterBannerDefinition del Capítulo 1 (004) referencia esta instancia con EnergyCost/DifficultyRank asignados

Assets/Tests/
├── EditMode/Battler/
│   ├── LocalMissionEnergyStoreTests.cs          # nuevo — round-trip, archivo ausente, archivo corrupto (formatVersion desconocido / JSON malformado), centinela currentEnergy=-1, escritura atómica sin .tmp huérfano
│   ├── MissionEnergyConfigValidationTests.cs    # nuevo — baseMaxEnergy>=1, maxEnergyPerCharacterLevel>=0, regenIntervalSeconds>=1
│   ├── MissionEnergyControllerTests.cs          # nuevo — sin dato guardado -> energía al máximo y persistida; regeneración parcial preserva remanente; regeneración de varios intervalos otorga la cantidad exacta; energía ya en el máximo no banca exceso; TryEnterMission con energía suficiente descuenta y persiste; TryEnterMission con energía insuficiente no modifica ni persiste nada; MaxEnergy escala con characterLevel sin reducir CurrentEnergy
│   └── MissionRegionDifficultyValidationTests.cs # nuevo — secuencia no decreciente dentro de una región pasa; valor decreciente falla; regiones distintas intercaladas se validan por separado; región con un solo banner pasa trivialmente; banner sin Region no participa
└── PlayMode/Battler/
    └── AdventureMapEnergyFlowPlayModeTests.cs   # nuevo — TrySelectBanner con energía suficiente descuenta y navega exactamente una vez; TrySelectBanner con energía insuficiente no navega, no descuenta, no crea/modifica ChapterProgressRecord; dato de energía corrupto no bloquea la carga de la escena del mapa (FR-011)
```

**Structure Decision**: Se reutiliza la misma capa de asmdefs ya validada en 001-005 (`TheBattler.Core` → `TheBattler.Model` → `TheBattler.Gameplay` → `TheBattler.View`); no se crea ningún ensamblado nuevo, ni ninguna carpeta nueva en `Core/Battler` (no hay ningún enum/interfaz sin dependencias de motor que esta feature necesite añadir — `EnergyCost`/`DifficultyRank` son `int` simples, no ameritan un tipo propio). Los datos y contratos nuevos (`MissionEnergySaveData`, `IMissionEnergyStore`, `MissionEnergyConfig`, `Region`) van en Model, igual que `ProgressSaveData`/`IChapterProgressStore`/`UnitLevelingConfig`. La implementación con I/O (`LocalMissionEnergyStore`) y la lógica de orquestación testable sin escena (`MissionEnergyController`) van en Gameplay, igual que `LocalChapterProgressStore`/`UnitLevelingController`. `MissionEnergyController` se modela deliberadamente como clase plana (no `MonoBehaviour`), mismo criterio de testabilidad ya usado por `UnitLevelingController`/`TeamFormationController` (005) y por la separación `Tick`/`Update` de `BattleResourceController` (001, research.md §4). El componente de UI (`MissionEnergyBarView`) va en View, igual que `PlayerBaseDashboardUIController`/`ChapterBannerItemView`.

Dos archivos existen fuera del control de esta feature (planeados por 004, sin implementación en C# todavía — ver research.md §7): `ChapterBannerDefinition.cs` y `AdventureMapFlowController.cs`. Este plan los trata como **extensión** (tres campos nuevos en el primero, una integración mínima en el segundo) en vez de "nuevo", porque su forma base ya está cerrada en `specs/004-adventure-map-banners/data-model.md`/`plan.md`; el orden real de implementación entre 004 y 006 no bloquea el diseño (la parte de esta feature sin dependencia de UI — `MissionEnergySaveData` a `MissionEnergyController` — es completamente implementable y testeable de forma aislada). No se modifica `ChapterDefinition.cs`, `UnitDefinition.cs`, `IChapterProgressStore.cs`, `IPlayerProgressStore.cs`, `BattleResourceController.cs` ni `IBattleResourceSource.cs`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Sin violaciones — tabla omitida.

## Post-Design Constitution Re-check

*Tras completar research.md, data-model.md, contracts/ y quickstart.md (Fase 1).*

El diseño final (`MissionEnergySaveData`/`IMissionEnergyStore`/`LocalMissionEnergyStore` replicando exactamente el patrón de `ProgressSaveData`/`IChapterProgressStore`/`LocalChapterProgressStore` de 002 y equivalentes de 003/005; `MissionEnergyConfig` como `ScriptableObject` con fórmula lineal de dos coeficientes en vez de una curva por tramos sin datos de balance reales; `MissionEnergyController` como clase plana testable en EditMode con `Sync`/`TryEnterMission` separados y atómicos; `Region` como `ScriptableObject` de identidad pura que reutiliza el orden de `AdventureMap.Banners` (004) en vez de un array propio de misiones; la integración con `AdventureMapFlowController.TrySelectBanner` como una precondición adicional sobre el punto de entrada ya existente de 004) no introdujo ninguna dependencia, capa o mecanismo fuera de lo ya contemplado en el Constitution Check inicial. Las 6 evaluaciones de la tabla anterior se mantienen sin cambios. Sigue sin haber violaciones ni necesidad de Complexity Tracking.

Tres precisiones de alcance identificadas durante el diseño (no cambios de scope de la feature, mismo estilo que 003/004/005 documentaron las suyas):

1. **Sin abstracción de reloj (`ISystemClock`)**: `MissionEnergyController.Sync` recibe `DateTime nowUtc` como parámetro explícito en vez de leer `DateTime.UtcNow` internamente o depender de una interfaz de reloj inyectable — el único llamador real (`AdventureMapFlowController.Awake()`) pasa `DateTime.UtcNow` directamente; los tests EditMode pasan valores explícitos. Se documenta como punto de extensión no disruptivo si un segundo consumidor apareciera más adelante (research.md §4).
2. **`ChapterBannerDefinition`/`AdventureMapFlowController` como "extensión pendiente" de 004**: verificado en este plan (research.md §7) que ninguno de los dos archivos existe todavía en `Assets/Scripts/` — mismo hallazgo que 005 ya documentó sobre 004. Este plan asume que, por orden del roadmap (Fase 6 sigue a Fases 4-5), ambos existirán para cuando `/speckit-tasks`/`/speckit-implement` de esta feature se ejecuten; si no fuera así, la parte de esta feature independiente de la UI de selección (`MissionEnergySaveData` a `MissionEnergyController`, `Region`, extensión de datos de `ChapterBannerDefinition`) sigue siendo completamente implementable y testeable en aislamiento.
3. **`Region` sin campo de orden propio**: se evaluó explícitamente añadir `Region.missions[]` (ordenado) para independizar la dificultad del orden de desbloqueo de 004, y se descartó por crear una segunda fuente de verdad sobre el orden de las misiones (research.md §5) — la reutilización del orden de `AdventureMap.Banners` para ambos propósitos (desbloqueo y dificultad) es una simplificación deliberada bajo Principio VI, no una limitación accidental.
