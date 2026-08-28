# Data Model: Pulido de Batalla y HUD

Ningún dato nuevo se persiste en Dexie. Todas las entidades de esta spec son estado efímero de UI o de partida en curso (ver Constitución § V).

## `GameFields` (`useGameStore.ts`) — 2 campos nuevos

| Campo | Tipo | Default | Reseteo |
|---|---|---|---|
| `speedMultiplier` | `1 \| 2` | `1` | `IDLE_STATE` y `startLevel()` |
| `paused` | `boolean` | `false` | `IDLE_STATE` y `startLevel()` |

Ambos son leídos por `BattleField` (`BattleStage.tsx`) dentro de su `useTick` ya existente, nunca escritos desde `src/engine/`.

## `MissionEnergyState` (`useMetaStore.ts`) — 2 campos nuevos

| Campo | Tipo | Origen |
|---|---|---|
| `regenPerSecond` | `number` | `computeRegenPerSecond(characterLevel)`, ya calculado en `hydrate()`/`recalculateMissionEnergyMax` — antes descartado tras usarse, ahora también se guarda en el estado reactivo |
| `lastUpdatedAt` | `number` (epoch ms) | Mismo valor que ya se escribe en la fila `missionEnergy` de Dexie en `hydrate()` y `consumeMissionEnergy()` |

No se agrega ninguna columna a la tabla Dexie `missionEnergy` (ya tiene `current`/`max`/`lastUpdatedAt` desde `specs/007`) — el único cambio es que el estado reactivo de Zustand ahora también expone `regenPerSecond`/`lastUpdatedAt`, que antes se calculaban y usaban solo dentro de la acción sin guardarse en el objeto expuesto a componentes.

## Estado local de componente (no en ningún store)

| Campo | Vive en | Propósito |
|---|---|---|
| `rowLayout: 1 \| 2` | `BattleScreen.tsx` (`useState`) | Disposición de la barra de despliegue — ver research.md Decisión 6 |
| Contador de segundo (`tick: number`) | `EnergyRegenTimer` en `HubScreen.tsx` (`useState` + `setInterval`) | Fuerza el re-render de solo este componente una vez por segundo para recalcular el countdown mostrado |

## Nueva función pura: `drawUnitHpBar`

Ubicación: `src/game/graphics/unitHpBar.ts` (nuevo módulo, mismo patrón que `drawBaseTowerHpBar` en `src/game/graphics/baseTower.ts`).

```
drawUnitHpBar(g: Graphics, bodyLayout: CyberBodyLayout, team: BattleUnit['team'], fraction: number): void
```

- Entrada: el `Graphics` a redibujar, el layout ya calculado del cuerpo de la unidad (para posicionar la barra sobre su cabeza), el equipo (color aliado/enemigo) y la fracción de HP ya calculada.
- Reutiliza `getHpFraction`/`getHpBarFillWidth` (ya exportadas de `src/game/graphics/baseTower.ts`, ya testeadas en `tests/unit/game/baseTower.test.ts`) en vez de reimplementar el clamp `[0, 1]` — se importan directamente, sin duplicar lógica.
- Se dibuja con relleno sólido (sin `PIXI.FillGradient`), a diferencia de `drawBaseTowerHpBar` — más simple visualmente (barra pequeña por unidad) y, siguiendo el mismo límite ya documentado en `tests/unit/game/baseTower.test.ts` (FillGradient lanza en jsdom sin el paquete `canvas`), esto permite testear `drawUnitHpBar` de forma directa con un `Graphics` real de `pixi.js`, no solo con `not.toThrow()`.
