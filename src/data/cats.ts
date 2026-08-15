export interface Cat {
  id: string
  name: string
  cost: number
  cooldownSeconds: number
  hp: number
  damage: number
  speed: number
  width: number
  attackIntervalSeconds: number
}

/** Fixtures de bootstrap — valores de diseño provisionales, no balanceados (tasks.md Fase 1). */
export const CATS: Cat[] = [
  {
    id: 'basic-cat',
    name: 'Gato Básico',
    cost: 10,
    cooldownSeconds: 2,
    hp: 50,
    damage: 5,
    speed: 20,
    width: 16,
    attackIntervalSeconds: 1,
  },
  {
    id: 'tank-cat',
    name: 'Gato Tanque',
    cost: 30,
    cooldownSeconds: 5,
    hp: 200,
    damage: 3,
    speed: 10,
    width: 24,
    attackIntervalSeconds: 1.5,
  },
  {
    id: 'speed-cat',
    name: 'Gato Veloz',
    cost: 15,
    cooldownSeconds: 3,
    hp: 30,
    damage: 4,
    speed: 40,
    width: 12,
    attackIntervalSeconds: 0.8,
  },
  {
    id: 'heavy-cat',
    name: 'Gato Pesado',
    cost: 50,
    cooldownSeconds: 8,
    hp: 150,
    damage: 20,
    speed: 8,
    width: 28,
    attackIntervalSeconds: 2,
  },
]
