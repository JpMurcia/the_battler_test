# Data Model: Misiones (Catnip Challenges)

## `src/data/missions.ts` (nuevo módulo puro)

```ts
export type MissionMetric = 'levelsCompleted' | 'unitsDeployed' | 'enemiesDefeated'

export interface MissionDefinition {
  id: string
  description: string
  metric: MissionMetric
  target: number
  currencyReward: number
}

export const MISSIONS: MissionDefinition[] = [
  { id: 'mision-completar-etapa', description: 'Completa 1 etapa', metric: 'levelsCompleted', target: 1, currencyReward: 50 },
  { id: 'mision-desplegar-unidades', description: 'Despliega 10 unidades', metric: 'unitsDeployed', target: 10, currencyReward: 50 },
  { id: 'mision-derrotar-enemigos', description: 'Derrota 20 enemigos', metric: 'enemiesDefeated', target: 20, currencyReward: 100 },
]

/** `YYYY-MM-DD` en UTC — determinista y testeable con `nowMs` inyectado. */
export function getDateKey(nowMs: number): string {
  return new Date(nowMs).toISOString().slice(0, 10)
}
```

## `useMetaStore` — campos y acciones nuevas

| Campo/acción | Tipo | Descripción |
|---|---|---|
| `missionProgress` | `Partial<Record<MissionMetric, number>>` | Contador acumulado hoy por métrica — ausente = 0, sin recorte interno (research.md Decisión 4) |
| `claimedMissionIds` | `string[]` | Ids de `MissionDefinition` ya reclamados hoy |
| `missionsResetDateKey` | `string` | `getDateKey` de la última vez que se tocó el progreso — usado para detectar cambio de día |
| `recordMissionProgress(metric, amount)` | `(metric: MissionMetric, amount: number) => void` | Primero aplica el reinicio si `missionsResetDateKey !== getDateKey(Date.now())` (research.md Decisión 2), luego suma `amount` a `missionProgress[metric]`, persiste |
| `claimMission(missionId)` | `(missionId: string) => boolean` | Aplica el mismo chequeo de reinicio; `false` si la misión no existe, ya fue reclamada hoy, o su progreso no alcanza `target`; si no, suma `currencyReward` a `currency`, agrega `missionId` a `claimedMissionIds`, persiste |

## Dexie (`src/db/index.ts`)

```ts
export interface MissionsRow {
  id: 1 // fila única (singleton)
  resetDateKey: string
  progress: Partial<Record<MissionMetric, number>>
  claimedMissionIds: string[]
}
```

`this.version(13).stores({ missions: 'id' })`. Sin seed en `ensureDefaultProfile()` — ausencia de fila se trata como "primera vez", `hydrate()` la inicializa con `getDateKey(Date.now())`/progreso vacío (mismo patrón que `baseUpgrades`).

## `types/screen.ts`

`PanelId` gana `'Missions'`.

## Puntos de instrumentación (sin cambio de tipo en los archivos, solo una llamada añadida)

- `src/state/useGameStore.ts`, `deployUnit()`: al final del `return true` exitoso, `useMetaStore.getState().recordMissionProgress('unitsDeployed', 1)`.
- `src/screens/BattleScreen.tsx`, `BattleOutcomeWatcher`, rama `status === 'Victory'`: `recordMissionProgress('levelsCompleted', 1)`.
- `src/game/BattleStage.tsx`, `BattleField`'s `useTick`, junto al cálculo ya existente de `newlyDead`: `const enemyDeaths = newlyDead.filter(u => u.team === 'Enemy').length; if (enemyDeaths > 0) useMetaStore.getState().recordMissionProgress('enemiesDefeated', enemyDeaths)`.
