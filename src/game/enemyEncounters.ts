import type { BattleUnit } from '../engine/types'

export interface ActiveUnitSnapshot {
  instanceId: string
  catId: string
  team: BattleUnit['team']
  x: number
  width: number
}

/**
 * specs/018-bibliotecas-consulta (US2/FR-004, plan.md Key Design Decision 1): `catId`s de unidades `Enemy` que
 * aparecen en `next` sin estar en `previous` (por `instanceId`) — deduplicados, porque varias unidades nuevas
 * del mismo tick pueden compartir `catId` y solo debe registrarse una vez cada uno.
 *
 * Vive en su propio módulo, separado de `BattleStage.tsx` (que importa `@pixi/react`), para poder testearse sin
 * arrastrar la cadena de imports de Pixi — mismo motivo por el que `tests/unit/BattleScreen.test.tsx` mockea
 * `BattleStage` por completo en vez de montarlo.
 */
export function findNewlyActiveEnemyCatIds(previous: ActiveUnitSnapshot[], next: ActiveUnitSnapshot[]): string[] {
  const previousInstanceIds = new Set(previous.map((unit) => unit.instanceId))
  const newlyActive = next.filter((unit) => unit.team === 'Enemy' && !previousInstanceIds.has(unit.instanceId))
  return [...new Set(newlyActive.map((unit) => unit.catId))]
}
