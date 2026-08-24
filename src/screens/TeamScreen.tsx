import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { BATTLE_ITEMS, MAX_BATTLE_ITEMS_PER_BATTLE } from '../data/battleItems'
import { CATS, RARITY_TAG_CLASS } from '../data/cats'
import { CAT_COMBOS, getComboMemberStatus, getCompletedCombos } from '../data/catCombos'
import { MAX_TEAM_ROSTER_SIZE, useMetaStore } from '../state/useMetaStore'
import type { Screen } from '../types/screen'

/** specs/025-cat-combos (FR-006/FR-007). Consulta contra `selectedIds` local, no `activeTeamCatIds` persistido
 * (research.md Decisión 5) — así se actualiza en el mismo render que un checkbox, sin depender de guardar. */
function CatComboSection({ ownedCatIds, selectedIds }: { ownedCatIds: string[]; selectedIds: string[] }) {
  const completedComboIds = new Set(getCompletedCombos(selectedIds).map((combo) => combo.id))

  return (
    <section className="glass-panel">
      <h2>Cat Combos</h2>
      <ul className="list-card">
        {CAT_COMBOS.map((combo) => {
          const isComplete = completedComboIds.has(combo.id)
          const memberStatus = getComboMemberStatus(combo, ownedCatIds, selectedIds)
          return (
            <li key={combo.id} className="list-card__row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <strong>{combo.name}</strong>
                <span className={`tag ${isComplete ? 'tag--normal' : 'tag--especial'}`}>{isComplete ? 'Completo' : 'Incompleto'}</span>
              </div>
              <ul>
                {memberStatus.map((member) => {
                  const cat = CATS.find((candidate) => candidate.id === member.catId)
                  const label = !member.owned ? 'no posee este gato' : member.selected ? 'en el equipo' : 'no está en el equipo'
                  return (
                    <li key={member.catId} className="list-card__meta">
                      {cat?.name ?? member.catId} — {label}
                    </li>
                  )
                })}
              </ul>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

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
      {/* Única región con scroll interno de esta pantalla — lista de gatos + Objetos de Batalla juntos,
          para que "Confirmar equipo"/"Volver" queden siempre visibles (nunca clipeados por el alto
          fijo de `.screen`). */}
      <div className="screen-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <ul className="list-card">
          {CATS.filter((cat) => cat.id in ownedCats).map((cat) => {
            const checked = selectedIds.includes(cat.id)
            // specs/022-datos-semilla-flujo-navegacion (FR-008): equipo equipable de hasta 10 — mismo patrón
            // que disabledToSelect de BattleItemSelector (no confundir con MAX_ACTIVE_TEAM_SIZE, tope de 6
            // de la grilla de despliegue en batalla, specs/023).
            const disabledToSelect = !checked && selectedIds.length >= MAX_TEAM_ROSTER_SIZE
            return (
              <li key={cat.id} className="list-card__row">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={checked} disabled={disabledToSelect} onChange={() => toggleCat(cat.id)} />
                  {cat.name}
                </label>
                {cat.rarity && <span className={`tag ${RARITY_TAG_CLASS[cat.rarity]}`}>{cat.rarity}</span>}
              </li>
            )
          })}
        </ul>
        <CatComboSection ownedCatIds={Object.keys(ownedCats)} selectedIds={selectedIds} />
        <BattleItemSelector />
      </div>
      <button className="btn btn-primary" disabled={selectedIds.length === 0} onClick={() => setActiveTeam(selectedIds)}>
        Confirmar equipo
      </button>
      <button className="btn btn-ghost" onClick={() => onNavigate('Upgrade')}>
        <ArrowLeft size={16} aria-hidden="true" />
        Volver
      </button>
    </main>
  )
}
