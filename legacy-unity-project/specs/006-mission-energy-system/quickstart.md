# Quickstart: Validación del Sistema de Energía y Escalado de Dificultad por Misión

Escenarios ejecutables para comprobar que la feature cumple sus Success Criteria (spec.md). No incluye código de implementación completo — referencia los contratos y el modelo de datos ya definidos.

## Prerrequisitos

- Proyecto abierto en Unity 6000.3.20f1 (LTS), URP 2D, con `004-adventure-map-banners` y `005-player-dashboard` ya implementadas en C# (ver research.md §7 de esta feature).
- Assets de datos poblados: al menos un `MissionEnergyConfig` (`Assets/Data/Battler/DefaultMissionEnergyConfig.asset`), una `Region` (`Assets/Data/Battler/Regions/...`) y el `ChapterBannerDefinition` del Capítulo 1 con `EnergyCost`/`Region`/`DifficultyRank` asignados.
- Unity Test Framework configurado (ya usado por 001-005): `Assets/Tests/EditMode/Battler/` y `Assets/Tests/PlayMode/Battler/TheBattler.Tests.PlayMode.asmdef`.

## Escenario 1 — Consumir energía al entrar a una misión (SC-001, Historia 1)

**Vía test EditMode** (`MissionEnergyControllerTests`, sin escena):
1. Construir `MissionEnergyConfig` con `baseMaxEnergy = 100`, `maxEnergyPerCharacterLevel = 0`, `regenIntervalSeconds = 60`.
2. Construir un `IMissionEnergyStore` en memoria sin datos previos (`Load()` devuelve `currentEnergy == -1`).
3. `controller.Sync(nowUtc: T0, characterLevel: 5)` → esperar `CurrentEnergy == 100`, `MaxEnergy == 100`.
4. `controller.TryEnterMission(30)` → esperar `true`, `CurrentEnergy == 70`.
5. **Resultado esperado**: la energía se descontó exactamente en el costo de la misión (SC-001), sin margen de error.

**Vía PlayMode** (`AdventureMapEnergyFlowPlayModeTests`): con `MissionEnergyController` real, `AdventureMapFlowController.TrySelectBanner(0)` sobre un banner desbloqueado con `EnergyCost <= CurrentEnergy` → devuelve `true`, dispara navegación (`ISceneNavigator` de prueba registra exactamente una llamada), y `CurrentEnergy` expuesto por el controlador refleja el descuento inmediatamente después.

## Escenario 2 — Bloqueo sin penalización cuando no hay energía suficiente (SC-002, Historia 2)

1. Con el mismo `controller` del Escenario 1 en `CurrentEnergy == 70`, llamar `controller.TryEnterMission(9999)` (costo mayor a la energía disponible).
2. **Resultado esperado**: devuelve `false`; `CurrentEnergy` permanece en `70` (sin cambios); `IMissionEnergyStore.Save` no se invocó con un valor distinto al ya persistido (o no se invocó en absoluto, según la implementación — el contrato solo exige que el estado observable no cambie, ver contracts/mission-energy-controller.md).
3. En `AdventureMapFlowController.TrySelectBanner(bannerIndex)` con ese mismo banner: devuelve `false`, `ISceneNavigator` de prueba registra **cero** llamadas, y ningún `ChapterProgressRecord` se crea ni modifica (verificable contra el `IChapterProgressStore` de prueba usado en el mismo test, 002/004).

## Escenario 3 — Recuperación de energía con el tiempo, incluido con el juego cerrado (SC-003, Historia 3)

1. `controller.Sync(nowUtc: T0, characterLevel: 5)` con `CurrentEnergy == 40`, `MaxEnergy == 100`, `regenIntervalSeconds == 60`.
2. `controller.Sync(nowUtc: T0 + 150s, characterLevel: 5)` (simulando 150 segundos transcurridos, con o sin "cierre del juego" de por medio — el algoritmo no distingue, research.md §3) → esperar `CurrentEnergy == 42` (`floor(150/60) = 2` unidades ganadas), con `15s` de remanente preservados para el siguiente `Sync` (no se pierden).
3. `controller.Sync(nowUtc: T0 + 150s + 45s, characterLevel: 5)` (45s adicionales, sumando `60s` de remanente total) → esperar `CurrentEnergy == 43` (una unidad más).
4. Repetir con energía ya en el máximo (`CurrentEnergy == 100`) y un salto grande de tiempo (p. ej. varios días) → esperar `CurrentEnergy == 100` (nunca supera el máximo, sin overflow ni excepción).

## Escenario 4 — Escalado de energía máxima con el nivel de personaje (SC-004, Historia 3)

1. Con `MissionEnergyConfig(baseMaxEnergy: 100, maxEnergyPerCharacterLevel: 5)`, `controller.Sync(nowUtc: T0, characterLevel: 5)` → `MaxEnergy == 125`.
2. Simular una mejora de unidad en `005` que eleva `PlayerCharacterLevel` a `8` (vía `UnitLevelingController.TryLevelUp` de prueba, contracts/unit-leveling.md de 005).
3. `controller.Sync(nowUtc: T0, characterLevel: 8)` (mismo instante, nuevo nivel) → esperar `MaxEnergy == 140`; `CurrentEnergy` no se reduce por el cambio de máximo (solo puede subir si hay regeneración pendiente, nunca baja por un aumento de `MaxEnergy` — Edge Case de spec.md).
4. **Resultado esperado**: el nuevo máximo se refleja "la próxima vez que el jugador consulta su energía" (SC-004) sin necesidad de reiniciar el proceso.

## Escenario 5 — Dificultad progresiva dentro de una región (SC-005, Historia 4)

**Vía test EditMode** (`MissionRegionDifficultyValidationTests`):
1. Construir tres `ChapterBannerDefinition` de prueba, todos con la misma `Region`, `DifficultyRank` = `1, 2, 3` respectivamente, insertados en ese orden en un `AdventureMap.Banners` de prueba.
2. Ejecutar la validación descrita en contracts/mission-catalog-extension.md → sin fallos.
3. Repetir con `DifficultyRank` = `1, 3, 2` (decreciente en el tercer elemento) → la validación debe reportar el fallo en el par `(índice 1, índice 2)`.
4. Repetir con una segunda `Region` intercalada entre los banners de la primera, con `DifficultyRank` bajo (p. ej. `1`) — no debe afectar la validación de la primera región (Acceptance Scenario 2, Historia 4: la dificultad de una región nueva no depende de dónde terminó la anterior).
5. Caso hoy real: una única `Region` con un único `ChapterBannerDefinition` (Capítulo 1) → la validación pasa trivialmente (Edge Case de spec.md), sin bloquear el resto del sistema.

## Escenario 6 — Tolerancia a datos corruptos (FR-011)

1. Escribir manualmente un archivo `mission-energy.json` con contenido no-JSON (o un `formatVersion` desconocido) en la ruta que usaría `LocalMissionEnergyStore`.
2. Llamar `store.Load()` → esperar un `MissionEnergySaveData` con `currentEnergy == -1` (centinela "sin dato"), sin excepción.
3. Encadenar con `controller.Sync(nowUtc: T0, characterLevel: N)` → esperar `CurrentEnergy == MaxEnergy` (energía al máximo por defecto), y que el mapa de aventuras cargue sin bloquearse (verificable en `AdventureMapEnergyFlowPlayModeTests`, sin excepción capturada por Unity durante `Awake()`).

## Comandos de ejecución

- EditMode: `Window > General > Test Runner > EditMode > Run All` (o `Unity.exe -batchmode -runTests -testPlatform EditMode ...`, mismo comando usado por 001-005).
- PlayMode: `Window > General > Test Runner > PlayMode > Run All`, escena `AdventureMap.unity` (004) debe estar registrada en Build Settings.
