export type LevelState = 'locked' | 'unlocked' | 'completed'

/** specs/005-mapa-de-niveles FR-002: desbloqueo genérico por posición en LEVELS. */
export function getLevelState(levelIndex: number, highestUnlockedLevelIndex: number, isCompleted: boolean): LevelState {
  if (levelIndex > highestUnlockedLevelIndex) return 'locked'
  return isCompleted ? 'completed' : 'unlocked'
}
