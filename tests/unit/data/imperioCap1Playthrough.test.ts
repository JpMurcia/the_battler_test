import { beforeEach, describe, expect, it } from 'vitest'
import { IMPERIO_CAP1_LEVELS } from '../../../src/data/levels'
import { TREASURE_SETS } from '../../../src/data/treasureSets'
import { db } from '../../../src/db'
import { useMetaStore } from '../../../src/state/useMetaStore'

/**
 * specs/027-capitulo-1-imperio-gatos (T012/T013/T015). Partida de punta a punta sobre el contenido REAL del
 * capítulo — a propósito, sin ningún vi.mock de src/data/*, para ejercitar exactamente los mismos catId/levelId/
 * arcId que produce el código de producción (mismo patrón que `useMetaStore.test.ts` § "catálogo completo
 * obtenible", pero en un archivo propio para no interferir con su SAGA_ARCS/CATS/TREASURE_SETS mockeados).
 */

beforeEach(async () => {
  await Promise.all([
    db.playerProfile.clear(),
    db.settings.clear(),
    db.ownedCats.clear(),
    db.levelProgress.clear(),
    db.teamFormation.clear(),
    db.missionEnergy.clear(),
    db.evolutionItems.clear(),
    db.treasures.clear(),
    db.arcProgress.clear(),
    db.treasureSetBonuses.clear(),
    db.battleItems.clear(),
    db.encounteredEnemies.clear(),
    db.userRank.clear(),
    db.gachaStorage.clear(),
    db.newsRead.clear(),
  ])
  await useMetaStore.getState().hydrate()
})

function winLevel(levelId: string): void {
  useMetaStore.getState().grantLevelRewards(levelId)
  useMetaStore.getState().markLevelCompleted(levelId)
}

describe('Capítulo 1 de Imperio de los Gatos — partida real de punta a punta', () => {
  it('specs/027 US2/T012: cat-recluta ya está en el roster inicial, sin superar ninguna etapa', () => {
    expect(useMetaStore.getState().ownedCats['cat-recluta']).toBeDefined()
  })

  it('specs/027 US2/T012: superar en orden las 12 etapas hito otorga cada gato en el momento exacto de su etapa, sin duplicar en victorias repetidas', () => {
    const milestones = IMPERIO_CAP1_LEVELS.filter((level) => level.firstVictoryUnlockCatId)
    expect(milestones.length).toBe(12)

    for (const level of milestones) {
      expect(useMetaStore.getState().ownedCats[level.firstVictoryUnlockCatId!]).toBeUndefined()
      winLevel(level.id)
      expect(useMetaStore.getState().ownedCats[level.firstVictoryUnlockCatId!]).toBeDefined()
    }

    // Repetir la primera victoria de la primera etapa hito no duplica ni reotorga.
    const first = milestones[0]
    const before = useMetaStore.getState().ownedCats[first.firstVictoryUnlockCatId!]
    winLevel(first.id)
    expect(useMetaStore.getState().ownedCats[first.firstVictoryUnlockCatId!]).toEqual(before)
  })

  it('specs/027 US3/T013: completar las 48 etapas otorga cat-veterano exactamente una vez, sin alterar recompensas de arco-1/arco-2 existentes', () => {
    for (const level of IMPERIO_CAP1_LEVELS) winLevel(level.id)

    expect(useMetaStore.getState().ownedCats['cat-veterano']).toBeUndefined()
    useMetaStore.getState().claimArcRewardsIfComplete('arco-imperio-de-los-gatos-cap1')
    expect(useMetaStore.getState().ownedCats['cat-veterano']).toBeDefined()
    expect(useMetaStore.getState().grantedArcRewardIds).toContain('arco-imperio-de-los-gatos-cap1')

    // Segunda llamada: no se re-otorga.
    useMetaStore.getState().claimArcRewardsIfComplete('arco-imperio-de-los-gatos-cap1')
    expect(useMetaStore.getState().grantedArcRewardIds.filter((id) => id === 'arco-imperio-de-los-gatos-cap1')).toHaveLength(1)

    // arco-1/arco-2 reales no se ven afectados (nunca se completaron en esta partida de prueba).
    expect(useMetaStore.getState().grantedArcRewardIds).not.toContain('arco-1-imperio-de-los-gatos')
    expect(useMetaStore.getState().grantedArcRewardIds).not.toContain('arco-2-imperio-de-los-gatos')
  })

  it('specs/027 US4/T015: el set de tesoros del capítulo refleja el progreso y otorga su bonificación exactamente al completarse', () => {
    const set = TREASURE_SETS.find((candidate) => candidate.id === 'set-imperio-de-los-gatos-cap1')!
    expect(set.treasureIds).toHaveLength(48)
    expect(set.passiveBonus).toEqual({ type: 'CurrencyRewardMultiplier', value: 1.15 })

    for (const level of IMPERIO_CAP1_LEVELS.slice(0, 47)) winLevel(level.id)
    expect(useMetaStore.getState().grantedTreasureSetIds).not.toContain(set.id)
    expect(useMetaStore.getState().obtainedTreasureIds).toHaveLength(47)

    winLevel(IMPERIO_CAP1_LEVELS[47].id)
    expect(useMetaStore.getState().obtainedTreasureIds).toHaveLength(48)
    expect(useMetaStore.getState().grantedTreasureSetIds).toContain(set.id)
  })
})
