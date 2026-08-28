import type { ClassificationType } from '../../engine/types'
import { RARITY_TAG_CLASS, type RarityType } from '../../data/cats'
import { EMPTY_CAT_FILTER, type CatFilterAbility, type CatFilterState } from '../../data/catFilter'

/**
 * specs/030-filtro-detalle-unidad (US1). Control de filtro compartido entre `TeamScreen` y
 * `CatGuideScreen` — puramente presentacional, la lógica de matching vive en `src/data/catFilter.ts`.
 */

const ALL_RARITIES = Object.keys(RARITY_TAG_CLASS) as RarityType[]
const ALL_TRAITS: ClassificationType[] = ['Red', 'Floating', 'Black', 'Angel', 'Alien', 'Zombie', 'Relic', 'Traitless']
const ALL_ABILITIES: CatFilterAbility[] = ['Weaken', 'Freeze', 'Slow', 'Curse', 'Critical', 'MultiHit']

interface CatFilterControlsProps {
  filter: CatFilterState
  onChange: (filter: CatFilterState) => void
  sortByLevel: boolean
  onToggleSort: () => void
}

export function CatFilterControls({ filter, onChange, sortByLevel, onToggleSort }: CatFilterControlsProps) {
  const toggleRarity = (rarity: RarityType) => {
    const rarities = filter.rarities.includes(rarity) ? filter.rarities.filter((r) => r !== rarity) : [...filter.rarities, rarity]
    onChange({ ...filter, rarities })
  }

  return (
    <div className="glass-panel cat-filter" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {ALL_RARITIES.map((rarity) => (
          <label key={rarity} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
            <input type="checkbox" checked={filter.rarities.includes(rarity)} onChange={() => toggleRarity(rarity)} />
            {rarity}
          </label>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          Rasgo objetivo
          <select
            aria-label="Rasgo objetivo"
            value={filter.trait ?? ''}
            onChange={(event) => onChange({ ...filter, trait: (event.target.value || null) as ClassificationType | null })}
          >
            <option value="">(cualquiera)</option>
            {ALL_TRAITS.map((trait) => (
              <option key={trait} value={trait}>
                {trait}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          Habilidad
          <select
            aria-label="Habilidad"
            value={filter.ability ?? ''}
            onChange={(event) => onChange({ ...filter, ability: (event.target.value || null) as CatFilterAbility | null })}
          >
            <option value="">(cualquiera)</option>
            {ALL_ABILITIES.map((ability) => (
              <option key={ability} value={ability}>
                {ability}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => onChange({ ...filter, mode: filter.mode === 'AND' ? 'OR' : 'AND' })}
        >
          Modo: {filter.mode === 'AND' ? 'Y (ambos)' : 'O (cualquiera)'}
        </button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
          <input type="checkbox" checked={sortByLevel} onChange={onToggleSort} />
          Ordenar por nivel
        </label>
        <button type="button" className="btn btn-ghost" onClick={() => onChange(EMPTY_CAT_FILTER)}>
          Limpiar filtro
        </button>
      </div>
    </div>
  )
}
