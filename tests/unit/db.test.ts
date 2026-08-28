import { beforeEach, describe, expect, it } from 'vitest'
import { CATS } from '../../src/data/cats'
import { db, ensureDefaultProfile } from '../../src/db'

beforeEach(async () => {
  await db.playerProfile.clear()
  await db.settings.clear()
  await db.ownedCats.clear()
  await db.newsRead.clear()
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

  it('siembra los gatos iniciales garantizados en ownedCats sobre un roster vacío (FR-011, specs/027-capitulo-1-imperio-gatos FR-001)', async () => {
    await ensureDefaultProfile()

    const ownedCats = await db.ownedCats.toArray()
    expect(ownedCats).toHaveLength(2)
    expect(ownedCats.find((row) => row.catId === CATS[0].id)).toMatchObject({ catId: CATS[0].id, level: 1, experienceInvested: 0 })
    expect(ownedCats.find((row) => row.catId === 'cat-recluta')).toMatchObject({ catId: 'cat-recluta', level: 1, experienceInvested: 0 })
  })

  it('no duplica los gatos iniciales en una segunda llamada', async () => {
    await ensureDefaultProfile()
    await ensureDefaultProfile()

    expect(await db.ownedCats.count()).toBe(2)
  })

  it('no siembra ningún gato inicial si el roster ya tiene al menos uno', async () => {
    await db.ownedCats.put({ catId: 'tank-cat', level: 3, experienceInvested: 200 })

    await ensureDefaultProfile()

    const ownedCats = await db.ownedCats.toArray()
    expect(ownedCats).toHaveLength(1)
    expect(ownedCats[0].catId).toBe('tank-cat')
  })

  it('crea la fila newsRead con readIds vacío si no existía (specs/026-navegacion-hub-mockup)', async () => {
    await ensureDefaultProfile()

    const newsRead = await db.newsRead.get(1)
    expect(newsRead).toEqual({ id: 1, readIds: [] })
  })

  it('no sobreescribe newsRead si ya existía (idempotencia)', async () => {
    await db.newsRead.put({ id: 1, readIds: ['news-cat-combos'] })

    await ensureDefaultProfile()

    const newsRead = await db.newsRead.get(1)
    expect(newsRead).toEqual({ id: 1, readIds: ['news-cat-combos'] })
  })
})
