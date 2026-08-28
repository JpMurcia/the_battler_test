import { describe, expect, it } from 'vitest'
import { BATTLE_ITEM_PRICES, EVOLUTION_ITEM_PRICE, getBattleItemPrice } from '../../../src/data/shop'

describe('shop (specs/037-tienda)', () => {
  it('getBattleItemPrice devuelve el precio correcto para cada id conocido', () => {
    expect(getBattleItemPrice('speed-boost')).toBe(BATTLE_ITEM_PRICES['speed-boost'])
    expect(getBattleItemPrice('extra-energy')).toBe(BATTLE_ITEM_PRICES['extra-energy'])
    expect(getBattleItemPrice('treasure-radar')).toBe(BATTLE_ITEM_PRICES['treasure-radar'])
  })

  it('getBattleItemPrice devuelve 0 para un id desconocido', () => {
    expect(getBattleItemPrice('unknown-item')).toBe(0)
  })

  it('EVOLUTION_ITEM_PRICE es un número positivo', () => {
    expect(EVOLUTION_ITEM_PRICE).toBeGreaterThan(0)
  })
})
