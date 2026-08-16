import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { BATTLE_ITEMS, MAX_BATTLE_ITEMS_PER_BATTLE } from '../data/battleItems'
import { CATS, RARITY_TAG_CLASS } from '../data/cats'
import { useMetaStore } from '../state/useMetaStore'
import type { Screen } from '../types/screen'

interface TeamScreenProps {
  onNavigate: (screen: Screen) => void
}

/** specs/017-objetos-de-batalla (US1): selección pendiente hasta `MAX_BATTLE_ITEMS_PER_BATTLE`, consumida al entrar a jugar (FR-001/006). */
function BattleItemSelector() {
  const battleItemInventory = useMetaStore((state) => state.battleItemInventory)
  const selectedBattleItemIds = useMetaStore((state) => state.selectedBattleItemIds)
  const selectBattleItem = useMetaStore((state) => state.selectBattleItem)
  const deselectBattleItem = useMetaStore((state) => state.deselectBattleItem)

  return (
    <section className="glass-panel">
      <h2>
        Objetos de Batalla ({selectedBattleItemIds.length}/{MAX_BATTLE_ITEMS_PER_BATTLE})
      </h2>
      <ul className="list-card">
        {BATTLE_ITEMS.map((item) => {
          const owned = battleItemInventory[item.id] ?? 0
          const selectedCount = selectedBattleItemIds.filter((id) => id === item.id).length
          const checked = selectedCount > 0
          const disabledToSelect = selectedCount >= owned || selectedBattleItemIds.length >= MAX_BATTLE_ITEMS_PER_BATTLE
          return (
            <li key={item.id} className="list-card__row">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={!checked && (owned === 0 || disabledToSelect)}
                  onChange={() => (checked ? deselectBattleItem(item.id) : selectBattleItem(item.id))}
                />
                {item.name} ({selectedCount}/{owned})
              </label>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export function TeamScreen({ onNavigate }: TeamScreenProps) {
  const ownedCats = useMetaStore((state) => state.ownedCats)
  const activeTeamCatIds = useMetaStore((state) => state.activeTeamCatIds)
  const setActiveTeam = useMetaStore((state) => state.setActiveTeam)

  const [selectedIds, setSelectedIds] = useState<string[]>(
    activeTeamCatIds.length > 0 ? activeTeamCatIds : Object.keys(ownedCats),
  )

  const toggleCat = (catId: string) => {
    setSelectedIds((current) =>
      current.includes(catId) ? current.filter((id) => id !== catId) : [...current, catId],
    )
  }

  return (
    <main className="screen">
      <h1>Equipo</h1>
      <ul className="list-card">
        {CATS.filter((cat) => cat.id in ownedCats).map((cat) => (
          <li key={cat.id} className="list-card__row">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={selectedIds.includes(cat.id)} onChange={() => toggleCat(cat.id)} />
              {cat.name}
            </label>
            {cat.rarity && <span className={`tag ${RARITY_TAG_CLASS[cat.rarity]}`}>{cat.rarity}</span>}
          </li>
        ))}
      </ul>
      <button className="btn btn-primary" disabled={selectedIds.length === 0} onClick={() => setActiveTeam(selectedIds)}>
        Confirmar equipo
      </button>
      <BattleItemSelector />
      <button className="btn btn-ghost" onClick={() => onNavigate('Upgrade')}>
        <ArrowLeft size={16} aria-hidden="true" />
        Volver
      </button>
    </main>
  )
}
