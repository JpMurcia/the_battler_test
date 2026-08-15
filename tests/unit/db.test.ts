import { beforeEach, describe, expect, it } from 'vitest'
import { db, ensureDefaultProfile } from '../../src/db'

beforeEach(async () => {
  await db.playerProfile.clear()
  await db.settings.clear()
})

describe('ensureDefaultProfile', () => {
  it('crea las filas por defecto sobre una base de datos vacía', async () => {
    await ensureDefaultProfile()

    const profile = await db.playerProfile.get(1)
    const settings = await db.settings.get(1)

    expect(profile).toMatchObject({ currency: 0, highestUnlockedLevelIndex: 0 })
    expect(settings).toMatchObject({ musicVolume: 1, sfxVolume: 1, language: 'es' })
  })

  it('no duplica las filas en una segunda llamada', async () => {
    await ensureDefaultProfile()
    const firstProfile = await db.playerProfile.get(1)

    await ensureDefaultProfile()
    const secondProfile = await db.playerProfile.get(1)

    expect(secondProfile).toEqual(firstProfile)
    expect(await db.playerProfile.count()).toBe(1)
    expect(await db.settings.count()).toBe(1)
  })
})
