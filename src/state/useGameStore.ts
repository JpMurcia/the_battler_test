import { create } from 'zustand'
import { CATS } from '../data/cats'
import { LEVELS } from '../data/levels'
import { stepSimulation } from '../engine/simulation'
import type { BattleUnit } from '../engine/types'

export type { BattleUnit }

interface GameFields {
  status: 'Idle' | 'InProgress' | 'Victory' | 'Defeat'
  levelId: string | null
  energy: { current: number; max: number; regenPerSecond: number }
  playerBase: { hp: number; maxHp: number }
  enemyBase: { hp: number; maxHp: number }
  units: BattleUnit[]
  deployCooldowns: Record<string, number>
  elapsedSeconds: number
  enemiesSpawnedCount: number
}

interface GameState extends GameFields {
  startLevel: (levelId: string) => void
  tick: (deltaSeconds: number) => void
  deployUnit: (catId: string) => boolean
  reset: () => void
}

const IDLE_STATE: GameFields = {
  status: 'Idle',
  levelId: null,
  energy: { current: 0, max: 0, regenPerSecond: 0 },
  playerBase: { hp: 0, maxHp: 0 },
  enemyBase: { hp: 0, maxHp: 0 },
  units: [],
  deployCooldowns: {},
  elapsedSeconds: 0,
  enemiesSpawnedCount: 0,
}

export const useGameStore = create<GameState>((set, get) => ({
  ...IDLE_STATE,

  startLevel: (levelId) => {
    const level = LEVELS.find((candidate) => candidate.id === levelId)
    if (!level) return

    set({
      status: 'InProgress',
      levelId,
      energy: { current: 0, max: level.maxEnergy, regenPerSecond: level.energyRegenPerSecond },
      playerBase: { hp: level.playerBaseHp, maxHp: level.playerBaseHp },
      enemyBase: { hp: level.enemyBaseHp, maxHp: level.enemyBaseHp },
      units: [],
      deployCooldowns: {},
      elapsedSeconds: 0,
      enemiesSpawnedCount: 0,
    })
  },

  tick: (deltaSeconds) => {
    set(stepSimulation(get(), deltaSeconds))
  },

  deployUnit: (catId) => {
    const cat = CATS.find((candidate) => candidate.id === catId)
    if (!cat) return false

    const { energy, deployCooldowns, units } = get()
    if (energy.current < cat.cost) return false
    if ((deployCooldowns[catId] ?? 0) > 0) return false

    const unit: BattleUnit = {
      instanceId: `${catId}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      catId,
      team: 'Player',
      x: 0,
      width: cat.width,
      hp: cat.hp,
      maxHp: cat.hp,
      damage: cat.damage,
      attackIntervalSeconds: cat.attackIntervalSeconds,
      attackCooldownRemaining: 0,
      speed: cat.speed,
      state: 'Moving',
      attackType: cat.attackType,
      attackRange: cat.attackRange,
      areaRadius: cat.areaRadius,
      classification: cat.classification,
      specialClassification: cat.specialClassification,
      abilities: cat.abilities,
      immuneEffects: cat.immuneEffects,
      appliesEffect: cat.appliesEffect,
      curseRemainingSeconds: 0,
    }

    set({
      energy: { ...energy, current: energy.current - cat.cost },
      deployCooldowns: { ...deployCooldowns, [catId]: cat.cooldownSeconds },
      units: [...units, unit],
    })
    return true
  },

  reset: () => set({ ...IDLE_STATE }),
}))
