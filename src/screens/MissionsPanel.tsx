import { MISSIONS } from '../data/missions'
import { useMetaStore } from '../state/useMetaStore'

/** specs/033-misiones-catnip-challenges (US1). Progreso mostrado siempre recortado a `target`
 * (research.md Decisión 4) — el contador interno puede superarlo, la UI nunca lo muestra. */
export function MissionsPanel() {
  const missionProgress = useMetaStore((state) => state.missionProgress)
  const claimedMissionIds = useMetaStore((state) => state.claimedMissionIds)
  const claimMission = useMetaStore((state) => state.claimMission)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--bc-space-5)' }}>
      <h1>Misiones</h1>
      <ul className="list-card">
        {MISSIONS.map((mission) => {
          const rawProgress = missionProgress[mission.metric] ?? 0
          const displayProgress = Math.min(rawProgress, mission.target)
          const claimed = claimedMissionIds.includes(mission.id)
          const completed = rawProgress >= mission.target

          return (
            <li key={mission.id} className="list-card__row">
              <div className="list-card__main">
                <span className="list-card__title">{mission.description}</span>
                <span className="list-card__meta">Recompensa: {mission.currencyReward} moneda</span>
              </div>
              {claimed ? (
                <span className="tag tag--normal">Reclamada</span>
              ) : completed ? (
                <button className="btn btn-primary" onClick={() => claimMission(mission.id)}>
                  Reclamar
                </button>
              ) : (
                <span>
                  {displayProgress}/{mission.target}
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
