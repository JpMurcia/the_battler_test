import { useEffect, useState } from 'react'
import { GAMATOTO_EXPEDITION_OPTIONS, getExpeditionRemainingMs, isExpeditionReady } from '../data/gamatoto'
import { useMetaStore } from '../state/useMetaStore'

function formatCountdown(totalMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(totalMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/** specs/034-gamatoto (US1/US3). Countdown en vivo con `setInterval(1000)` local — mismo patrón que
 * `EnergyRegenTimer` (specs/029) y `TreasureFestivalBanner` (specs/032), research.md Decisión 4. */
export function GamatotoPanel() {
  const gamatotoExpedition = useMetaStore((state) => state.gamatotoExpedition)
  const gamatotoMaterials = useMetaStore((state) => state.gamatotoMaterials)
  const startGamatotoExpedition = useMetaStore((state) => state.startGamatotoExpedition)
  const claimGamatotoExpedition = useMetaStore((state) => state.claimGamatotoExpedition)
  const [, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick((value) => value + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const activeOption = gamatotoExpedition
    ? GAMATOTO_EXPEDITION_OPTIONS.find((option) => option.id === gamatotoExpedition.optionId)
    : undefined
  const ready = gamatotoExpedition && activeOption ? isExpeditionReady(gamatotoExpedition, activeOption, Date.now()) : false

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h1>Gamatoto</h1>
      <span className="hud-chip">Materiales: {gamatotoMaterials}</span>

      {gamatotoExpedition && activeOption ? (
        <div className="glass-panel">
          <p>{activeOption.name}</p>
          {ready ? (
            <button className="btn btn-primary" onClick={() => claimGamatotoExpedition()}>
              Reclamar ({activeOption.materialsReward} materiales)
            </button>
          ) : (
            <p>Tiempo restante: {formatCountdown(getExpeditionRemainingMs(gamatotoExpedition, activeOption, Date.now()))}</p>
          )}
        </div>
      ) : (
        <ul className="list-card">
          {GAMATOTO_EXPEDITION_OPTIONS.map((option) => (
            <li key={option.id} className="list-card__row">
              <div className="list-card__main">
                <span className="list-card__title">{option.name}</span>
                <span className="list-card__meta">{option.materialsReward} materiales</span>
              </div>
              <button className="btn btn-primary" aria-label={`Enviar ${option.name}`} onClick={() => startGamatotoExpedition(option.id)}>
                Enviar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
