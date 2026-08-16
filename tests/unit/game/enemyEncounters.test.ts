import { describe, expect, it } from 'vitest'
import { findNewlyActiveEnemyCatIds, type ActiveUnitSnapshot } from '../../../src/game/enemyEncounters'

function makeSnapshot(overrides: Partial<ActiveUnitSnapshot> = {}): ActiveUnitSnapshot {
  return {
    instanceId: 'unit-1',
    catId: 'basic-cat',
    team: 'Enemy',
    x: 0,
    width: 16,
    ...overrides,
  }
}

describe('findNewlyActiveEnemyCatIds (specs/018-bibliotecas-consulta US2)', () => {
  it('FR-004: detecta un catId enemigo nuevo que no estaba en el tick anterior', () => {
    const next = [makeSnapshot({ instanceId: 'enemy-1', catId: 'basic-cat' })]

    expect(findNewlyActiveEnemyCatIds([], next)).toEqual(['basic-cat'])
  })

  it('no repite un catId ya presente en el tick anterior (misma instancia, sigue viva)', () => {
    const snapshot = makeSnapshot({ instanceId: 'enemy-1', catId: 'basic-cat' })

    expect(findNewlyActiveEnemyCatIds([snapshot], [snapshot])).toEqual([])
  })

  it('deduplica: dos unidades nuevas del mismo catId en el mismo tick solo aparecen una vez', () => {
    const next = [
      makeSnapshot({ instanceId: 'enemy-1', catId: 'basic-cat' }),
      makeSnapshot({ instanceId: 'enemy-2', catId: 'basic-cat' }),
    ]

    expect(findNewlyActiveEnemyCatIds([], next)).toEqual(['basic-cat'])
  })

  it('ignora unidades del equipo Player — solo enemigos cuentan como "enfrentados"', () => {
    const next = [makeSnapshot({ instanceId: 'player-1', catId: 'basic-cat', team: 'Player' })]

    expect(findNewlyActiveEnemyCatIds([], next)).toEqual([])
  })

  it('Edge Case: un enemigo planeado en la oleada pero nunca aparecido en el carril no se registra', () => {
    // Este helper opera sobre snapshots de `units` ya generadas por stepSimulation — un enemigo "planeado
    // pero no aparecido" nunca llega a formar parte de `next` en primer lugar, nada que registrar.
    expect(findNewlyActiveEnemyCatIds([], [])).toEqual([])
  })
})
