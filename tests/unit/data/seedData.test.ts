import { describe, expect, it } from 'vitest'
import { SEED_CATS_AS_CATS, SEED_ENEMIES, SEED_ENEMIES_AS_CATS, SEED_UNITS, seedUnitToCat, type SeedRarity } from '../../../src/data/seedData'

describe('SEED_UNITS', () => {
  it('tiene exactamente 4 entradas, una por cada SeedRarity', () => {
    const rarities = SEED_UNITS.map((unit) => unit.rarity)
    const expected: SeedRarity[] = ['Normal', 'Rare', 'SuperRare', 'UberRare']

    expect(SEED_UNITS).toHaveLength(4)
    expect(new Set(rarities)).toEqual(new Set(expected))
  })

  it('el gato UberRare tiene el costo y el spawnCooldown más altos del catálogo semilla', () => {
    const uberRare = SEED_UNITS.find((unit) => unit.rarity === 'UberRare')!
    const others = SEED_UNITS.filter((unit) => unit.rarity !== 'UberRare')

    expect(others.every((unit) => unit.stats.cost < uberRare.stats.cost)).toBe(true)
    expect(others.every((unit) => unit.stats.spawnCooldown < uberRare.stats.spawnCooldown)).toBe(true)
  })

  it('el gato Rare tiene el hp más alto con el attackRange más bajo (arquetipo muro/tanque)', () => {
    const rare = SEED_UNITS.find((unit) => unit.rarity === 'Rare')!
    const others = SEED_UNITS.filter((unit) => unit.rarity !== 'Rare')

    expect(others.every((unit) => unit.stats.hp < rare.stats.hp)).toBe(true)
    expect(others.every((unit) => unit.stats.attackRange >= rare.stats.attackRange)).toBe(true)
  })

  it('el gato SuperRare tiene el attackRange más alto del catálogo semilla (arquetipo a distancia)', () => {
    const superRare = SEED_UNITS.find((unit) => unit.rarity === 'SuperRare')!
    const others = SEED_UNITS.filter((unit) => unit.rarity !== 'SuperRare')

    expect(others.every((unit) => unit.stats.attackRange < superRare.stats.attackRange)).toBe(true)
  })

  it('cada unidad tiene un proceduralDesign completo', () => {
    for (const unit of SEED_UNITS) {
      expect(unit.proceduralDesign.primaryColor).toBeTypeOf('number')
      expect(unit.proceduralDesign.baseShape).toBeTruthy()
      expect(unit.proceduralDesign.size).toBeGreaterThan(0)
      expect(unit.proceduralDesign.distinctiveFeature).toBeTruthy()
    }
  })
})

describe('SEED_ENEMIES', () => {
  it('tiene exactamente 3 entradas: sin rasgo, Red y Floating', () => {
    const traits = SEED_ENEMIES.map((enemy) => enemy.traits)

    expect(SEED_ENEMIES).toHaveLength(3)
    expect(traits).toContainEqual([])
    expect(traits).toContainEqual(['Red'])
    expect(traits).toContainEqual(['Floating'])
  })

  it('la Serpiente Roja (Red) es la más veloz del catálogo de enemigos semilla', () => {
    const redSnake = SEED_ENEMIES.find((enemy) => enemy.traits.includes('Red'))!
    const others = SEED_ENEMIES.filter((enemy) => !enemy.traits.includes('Red'))

    expect(others.every((enemy) => enemy.stats.moveSpeed < redSnake.stats.moveSpeed)).toBe(true)
  })

  it('el Hipopótamo Flotante (Floating) tiene el hp más alto del catálogo de enemigos semilla', () => {
    const floatingHippo = SEED_ENEMIES.find((enemy) => enemy.traits.includes('Floating'))!
    const others = SEED_ENEMIES.filter((enemy) => !enemy.traits.includes('Floating'))

    expect(others.every((enemy) => enemy.stats.hp < floatingHippo.stats.hp)).toBe(true)
  })
})

describe('seedUnitToCat', () => {
  it('mapea todos los campos requeridos por el motor', () => {
    const unit = SEED_UNITS[0]
    const cat = seedUnitToCat(unit)

    expect(cat.id).toBe(unit.id)
    expect(cat.name).toBe(unit.name)
    expect(cat.hp).toBe(unit.stats.hp)
    expect(cat.damage).toBe(unit.stats.attackPower)
    expect(cat.attackRange).toBe(unit.stats.attackRange)
    expect(cat.speed).toBe(unit.stats.moveSpeed)
    expect(cat.attackIntervalSeconds).toBe(unit.stats.attackCooldown)
    expect(cat.cost).toBe(unit.stats.cost)
    expect(cat.cooldownSeconds).toBe(unit.stats.spawnCooldown)
    expect(cat.width).toBeGreaterThan(0)
    expect(cat.attackType).toBe('Single')
  })

  it('una unidad sin traits se mapea a classification Traitless', () => {
    const dog = SEED_ENEMIES.find((enemy) => enemy.traits.length === 0)!

    expect(seedUnitToCat(dog).classification).toBe('Traitless')
  })

  it('una unidad con un trait usa ese trait como classification', () => {
    const redSnake = SEED_ENEMIES.find((enemy) => enemy.traits.includes('Red'))!

    expect(seedUnitToCat(redSnake).classification).toBe('Red')
  })

  it('SEED_CATS_AS_CATS y SEED_ENEMIES_AS_CATS son el resultado de mapear seedUnitToCat sobre cada catálogo', () => {
    expect(SEED_CATS_AS_CATS).toEqual(SEED_UNITS.map(seedUnitToCat))
    expect(SEED_ENEMIES_AS_CATS).toEqual(SEED_ENEMIES.map(seedUnitToCat))
  })
})
