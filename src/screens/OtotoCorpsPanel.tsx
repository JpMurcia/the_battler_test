import { useEffect, useState } from 'react'
import type { ClassificationType, EffectType } from '../engine/types'
import { OTOTO_BUILDINGS, getConstructionRemainingMs, isConstructionReady, type OtotoBuildingId } from '../data/ototoCorps'
import { useMetaStore } from '../state/useMetaStore'

const TRAIT_OPTIONS: ClassificationType[] = ['Red', 'Floating', 'Black', 'Angel', 'Alien', 'Zombie', 'Relic', 'Traitless']
const DEBUFF_OPTIONS: EffectType[] = ['Weaken', 'Freeze', 'Slow', 'Curse']

function formatCountdown(totalMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(totalMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/** specs/035-ototo-corps (US1/US2). Mismo patrón de countdown que `GamatotoPanel` (specs/034). */
export function OtotoCorpsPanel() {
  const ototoConstruction = useMetaStore((state) => state.ototoConstruction)
  const ototoBuildings = useMetaStore((state) => state.ototoBuildings)
  const gamatotoMaterials = useMetaStore((state) => state.gamatotoMaterials)
  const startOtotoConstruction = useMetaStore((state) => state.startOtotoConstruction)
  const claimOtotoConstruction = useMetaStore((state) => state.claimOtotoConstruction)
  const [choices, setChoices] = useState<Record<OtotoBuildingId, string>>({
    foundation: TRAIT_OPTIONS[0],
    style: DEBUFF_OPTIONS[0],
  })
  const [, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick((value) => value + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const activeDefinition = ototoConstruction ? OTOTO_BUILDINGS.find((def) => def.id === ototoConstruction.building) : undefined
  const ready = ototoConstruction && activeDefinition ? isConstructionReady(ototoConstruction, activeDefinition, Date.now()) : false

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h1>Cuerpo Ototo</h1>
      <span className="hud-chip">Materiales: {gamatotoMaterials}</span>

      {ototoConstruction && activeDefinition ? (
        <div className="glass-panel">
          <p>
            {activeDefinition.name} — {ototoConstruction.choice}
          </p>
          {ready ? (
            <button className="btn btn-primary" onClick={() => claimOtotoConstruction()}>
              Reclamar
            </button>
          ) : (
            <p>Tiempo restante: {formatCountdown(getConstructionRemainingMs(ototoConstruction, activeDefinition, Date.now()))}</p>
          )}
        </div>
      ) : (
        <ul className="list-card">
          {OTOTO_BUILDINGS.map((definition) => {
            const options = definition.id === 'foundation' ? TRAIT_OPTIONS : DEBUFF_OPTIONS
            const currentBuilt = ototoBuildings[definition.id as 'foundation' | 'style']
            const disabled = gamatotoMaterials < definition.materialsCost
            return (
              <li key={definition.id} className="list-card__row">
                <div className="list-card__main">
                  <span className="list-card__title">{definition.name}</span>
                  <span className="list-card__meta">
                    {definition.materialsCost} materiales{currentBuilt ? ` — actual: ${currentBuilt}` : ''}
                  </span>
                </div>
                <select
                  aria-label={`Elegir para ${definition.name}`}
                  value={choices[definition.id]}
                  onChange={(event) => setChoices((current) => ({ ...current, [definition.id]: event.target.value }))}
                >
                  {options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <button
                  className="btn btn-primary"
                  disabled={disabled}
                  onClick={() => startOtotoConstruction(definition.id, choices[definition.id])}
                >
                  Construir
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
