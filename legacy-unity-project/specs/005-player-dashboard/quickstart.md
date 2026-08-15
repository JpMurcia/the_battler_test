# Quickstart: Dashboard de Base del Jugador

## Prerrequisitos

- Unity 6000.3.20f1 con el proyecto `the_battler_test` abierto (o accesible en modo batch).
- Features 001 (Capítulo 1), 002 (Guardado local) y 003 (Menú/config) implementadas y en verde — esta feature lee `ChapterDefinition.AvailableUnits` (001) y escribe su propio `player-progress.json` independiente de `progress.json` (002) y `menu-settings.json` (003).
- `Assets/Scenes/PlayerBase.unity` registrada en Build Settings (índice exacto definido en tasks.md).
- `Assets/Data/Battler/DefaultUnitLevelingConfig.asset` configurado con `maxLevel` y `experienceCostPerLevel` (datos de diseño, no forman parte de esta validación de comportamiento).
- Para otorgar experiencia de prueba sin depender de una feature de recompensas todavía no escrita (research.md §8), usar el hook de QA `[ContextMenu] "Grant Test Experience"` en `PlayerBaseFlowController` (mismo patrón que `BattleStateManager.ClearSavedProgress`, 001/002).

## Validación automatizada

```powershell
& "C:\Program Files\Unity\Hub\Editor\6000.3.20f1\Editor\Unity.exe" -batchmode -nographics -silent-crashes -projectPath "C:\Users\Usuario\Documents\GitHub\IA GAME\the_battler_test" -runTests -testPlatform EditMode -testResults "<ruta>\editmode-results.xml" -logFile "<ruta>\editmode.log" -quit
```

- Debe incluir y pasar: `LocalPlayerProgressStoreTests` (round-trip, archivo ausente, archivo corrupto, clamp de experiencia negativa), `PlayerCharacterLevelCalculatorTests` (sin progreso = suma de niveles base; progreso mixto), `UnitLevelingConfigValidationTests` (`maxLevel >= 2`, longitud del array de costos, costos positivos), `UnitLevelingControllerTests` (mejora exitosa descuenta experiencia/sube nivel/persiste/dispara evento; experiencia insuficiente rechazada sin efectos parciales; nivel máximo rechazado sin efectos parciales), `TeamFormationRosterFilterTests` (vacío/null → roster completo; subconjunto preserva orden del roster; ids desconocidos ignorados; resultado vacío tras filtrar → fallback a roster completo), `TeamFormationControllerTests` (confirmar vacío rechazado sin persistir; selección válida persiste y actualiza `ActiveTeamUnitIds`).

```powershell
& "C:\Program Files\Unity\Hub\Editor\6000.3.20f1\Editor\Unity.exe" -batchmode -nographics -silent-crashes -projectPath "C:\Users\Usuario\Documents\GitHub\IA GAME\the_battler_test" -runTests -testPlatform PlayMode -testResults "<ruta>\playmode-results.xml" -logFile "<ruta>\playmode.log" -quit
```

- Debe incluir y pasar: `PlayerBaseFlowPlayModeTests` (resolución real de `IPlayerProgressStore` en `Awake()`, nivel de personaje/experiencia consistentes con un save sembrado) y `TeamFormationBattleIntegrationPlayModeTests` (`BattleStateManager.SetupChapter()` deja en `UnitDeploymentController.Slots` únicamente las unidades del equipo activo guardado).

## Validación manual (escenario end-to-end)

1. Borrar (o renombrar temporalmente) `player-progress.json` en `Application.persistentDataPath`, para simular una instalación nueva. Dejar `progress.json`/`menu-settings.json` como estén (no interfieren).
2. Abrir `PlayerBase.unity` en el Editor y entrar en Play Mode (o, si el flujo real ya conecta con `004`, entrar desde el banner "Imperio de los Test/Robot" en `AdventureMap.unity`).
3. Confirmar que el dashboard muestra, sin errores en consola: nivel de personaje = suma de los niveles base (5, con las 5 unidades del Capítulo 1 en nivel 1) y experiencia acumulada = 0 (Historia 1, Escenario 2).
4. Usar el hook de QA para otorgar experiencia de prueba (prerrequisitos).
5. Entrar a la pantalla de mejora de unidades; confirmar que las unidades muestran su nivel actual y el costo de la siguiente mejora, y que "Mejorar" está habilitado solo si la experiencia acumulada alcanza ese costo (Edge Case de spec.md: sin experiencia, opciones deshabilitadas sin bloquear el resto del dashboard).
6. Mejorar una unidad; confirmar que su nivel sube, la experiencia acumulada disponible baja exactamente en el costo mostrado, y el nivel de personaje del dashboard se actualiza de inmediato (Historia 2, Escenario 1 / FR-005).
7. Intentar mejorar una unidad sin experiencia suficiente (agotar la experiencia primero); confirmar que la mejora es rechazada, el nivel de la unidad no cambia y la experiencia acumulada no se descuenta (Historia 2, Escenario 2 / SC-003).
8. Salir de Play Mode y volver a entrar (o cerrar y reabrir el Editor); confirmar que el nivel de la unidad mejorada y la experiencia restante se mantienen tal como quedaron (Historia 2, Escenario 3 / FR-007 / SC-005).
9. Entrar a la pantalla de organización de equipo; deseleccionar unidades hasta dejar solo una marcada, sin presionar "Confirmar"; salir de la pantalla y volver a entrar — confirmar que se ve la última selección confirmada (todas, por defecto), no el cambio descartado (Edge Case de spec.md).
10. Repetir el paso 9 pero presionando "Confirmar" con un subconjunto no vacío de unidades; confirmar que el dashboard refleja ese equipo como activo.
11. Entrar a una batalla (Capítulo 1); confirmar que únicamente las unidades del equipo activo confirmado en el paso 10 están disponibles para desplegar durante esa batalla, y ninguna otra (Historia 3, Escenario 2 / FR-009 / SC-004).
12. Intentar dejar el equipo activo vacío (deseleccionar todas las unidades) y presionar "Confirmar"; confirmar que el sistema no lo permite y el equipo activo sigue siendo el del paso 10 (Historia 3, Escenario 3 / FR-010).
13. Corromper manualmente `player-progress.json` (truncar el JSON) y volver a entrar en Play Mode al dashboard; confirmar que se trata como ausencia de progreso de mejora (unidades en nivel base) y sin equipo activo definido (equipo por defecto con todas las unidades disponibles), sin errores en consola ni bloqueo de carga (FR-013).
14. (Historia 4, cuando exista un segundo banner jugable real — ver research.md §7) Entrar al dashboard desde dos banners de aventura distintos y confirmar que el layout y las funciones son idénticos, cambiando solo el fondo visual (FR-011). Hoy solo existe un banner jugable real, por lo que este paso queda documentado para cuando `004-adventure-map-banners` tenga un segundo banner implementado.

## Resultado esperado

- Los pasos 1-13 se completan sin errores en la consola de Unity, en el hardware objetivo de referencia (dispositivo móvil de gama media, misma referencia que 003/004) dentro de los tiempos de SC-001/SC-002.
- El contenido de `player-progress.json` en cada paso coincide con lo descrito en [data-model.md](./data-model.md).
- El paso 14 queda pendiente de un segundo banner jugable real (fuera del alcance de datos de esta feature, ver research.md §7).
