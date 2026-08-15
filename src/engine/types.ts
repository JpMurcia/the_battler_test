export interface BattleUnit {
  instanceId: string
  catId: string
  team: 'Player' | 'Enemy'
  x: number
  width: number
  hp: number
  maxHp: number
  damage: number
  attackIntervalSeconds: number
  attackCooldownRemaining: number
  speed: number
  state: 'Moving' | 'Engaged' | 'Dead'
}
