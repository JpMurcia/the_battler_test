# Research: Misiones (Catnip Challenges)

## Decisión 1 — Catálogo de datos puro + progreso como registro simple por métrica

**Decision**: `src/data/missions.ts` exporta `MissionMetric` (`'levelsCompleted' | 'unitsDeployed' | 'enemiesDefeated'`), `MissionDefinition` (id, description, metric, target, currencyReward) y `MISSIONS: MissionDefinition[]` (3 entradas). El progreso vive en `useMetaStore` como `missionProgress: Partial<Record<MissionMetric, number>>` — **por métrica, no por misión** — más `claimedMissionIds: string[]` y `missionsResetDateKey: string`.

**Rationale**: Si 2 misiones compartieran métrica (Edge Case de spec.md), cada una compara el MISMO contador acumulado de la métrica contra su propio `target` — no hace falta un contador por misión, solo por métrica, más simple y suficiente para el catálogo actual (1 misión por métrica).

## Decisión 2 — Reinicio diario: comparación de fecha calendario, sin scheduler

**Decision**: `getDateKey(nowMs: number): string` (formato `YYYY-MM-DD`, UTC) en `src/data/missions.ts`. Cada acción que toca el progreso de misiones (`recordMissionProgress`, `claimMission`, y `hydrate()`) primero compara `missionsResetDateKey` contra `getDateKey(Date.now())`; si difieren, resetea `missionProgress: {}`/`claimedMissionIds: []` y actualiza `missionsResetDateKey` ANTES de aplicar la operación pedida.

**Rationale**: Mismo criterio de simplicidad ya aceptado en `specs/032` (ventanas de tiempo fijas, sin scheduler recurrente genérico) — comparar fechas en cada acceso es suficiente para "reiniciar al cambiar de día" sin necesitar un temporizador de fondo ni un cron.

**Alternatives considered**: Un `setInterval` que revise la fecha cada minuto. Rechazado — no hace falta que el reinicio sea "en vivo" mientras la app está abierta a medianoche (edge case de bajísimo valor); revisar en cada acción ya cubre el caso real (reabrir la app al día siguiente).

## Decisión 3 — Puntos de instrumentación, reutilizando detección ya existente

**Decision**:
- `unitsDeployed`: `useGameStore.deployUnit()` ya tiene un punto único de éxito (`return true` al final) — se añade `useMetaStore.getState().recordMissionProgress('unitsDeployed', 1)` ahí.
- `levelsCompleted`: `BattleOutcomeWatcher` (`BattleScreen.tsx`) ya tiene un único punto donde se confirma victoria — se añade `recordMissionProgress('levelsCompleted', 1)` junto al resto de efectos de victoria (moneda, desbloqueo, tesoro).
- `enemiesDefeated`: `BattleField` (`BattleStage.tsx`) ya calcula `newlyDead` (unidades que salieron de `units` entre el tick anterior y el actual, usado para death echoes) — se añade un filtro `newlyDead.filter(u => u.team === 'Enemy').length` y, si `> 0`, `recordMissionProgress('enemiesDefeated', count)`.

**Rationale**: Los 3 puntos de instrumentación ya existen y ya son el lugar donde specs anteriores (specs/018 `recordEncounteredEnemy`, specs/013 recompensas) enganchan efectos secundarios de progreso — no se introduce ningún mecanismo nuevo de detección, solo una llamada adicional en un punto ya validado. `enemiesDefeated` en particular reutiliza el mismo diff que `specs/021-reskin-cyber-modern` ya calcula para las animaciones de "death echo", sin tocar `src/engine/` (Constitución § VI).

## Decisión 4 — Progreso limitado visualmente, nunca acumulado de más internamente tampoco

**Decision**: `recordMissionProgress(metric, amount)` sí permite que el contador interno de la métrica supere el `target` de una misión ya completada (es un contador de métrica, no por misión — Decisión 1) — el `Math.min(progress, target)` para no mostrar más que el objetivo (FR-004) se aplica solo en la capa de presentación (`MissionsPanel`), nunca al guardar.

**Rationale**: Guardar el valor real (sin recortar) permite que, si en el futuro se añade una segunda misión con objetivo mayor sobre la misma métrica, su progreso ya esté correcto sin necesitar recalcular nada retroactivamente — el recorte visual es puramente de presentación.

## Decisión 5 — Persistencia: 1 tabla Dexie nueva, mismo patrón singleton

**Decision**: Tabla `missions` (versión 13 de Dexie), fila única `{ id: 1, resetDateKey, progress: Partial<Record<MissionMetric, number>>, claimedMissionIds: string[] }`.

**Rationale**: Mismo patrón ya usado 9 veces en el proyecto (`evolutionItems`, `battleItems`, `baseUpgrades`, etc.) — un solo registro singleton es suficiente porque no hay historial que conservar entre días (Decisión 2 ya lo resetea).
