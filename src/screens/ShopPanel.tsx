import { BATTLE_ITEMS } from '../data/battleItems'
import { CATS } from '../data/cats'
import { EVOLUTION_ITEM_PRICE, getBattleItemPrice } from '../data/shop'
import { useMetaStore } from '../state/useMetaStore'

/** specs/037-tienda (US1/US2). Sumidero de `currency` por Objetos de Batalla (specs/017) e Ítems de
 * Evolución (specs/010) — ambos ya existentes, sin vía de compra directa hasta esta spec. */
export function ShopPanel() {
  const currency = useMetaStore((state) => state.currency)
  const battleItemInventory = useMetaStore((state) => state.battleItemInventory)
  const purchaseBattleItem = useMetaStore((state) => state.purchaseBattleItem)
  const ownedCats = useMetaStore((state) => state.ownedCats)
  const evolutionItems = useMetaStore((state) => state.evolutionItems)
  const purchaseEvolutionItem = useMetaStore((state) => state.purchaseEvolutionItem)

  // specs/037-tienda (FR-004): solo gatos con Forma Verdadera definida y todavía no alcanzada.
  const evolutionCandidates = Object.keys(ownedCats)
    .map((catId) => ({ catId, cat: CATS.find((candidate) => candidate.id === catId), owned: ownedCats[catId] }))
    .filter(
      (entry): entry is { catId: string; cat: NonNullable<typeof entry.cat>; owned: NonNullable<typeof entry.owned> } =>
        !!entry.cat && !!entry.cat.evolutions?.true && entry.owned.evolutionStage !== 'True',
    )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--bc-space-5)' }}>
      <h1>Tienda</h1>
      <span className="hud-chip">Moneda: {currency}</span>

      <h2>Objetos de Batalla</h2>
      <ul className="list-card">
        {BATTLE_ITEMS.map((item) => {
          const price = getBattleItemPrice(item.id)
          return (
            <li key={item.id} className="list-card__row">
              <div className="list-card__main">
                <span className="list-card__title">{item.name}</span>
                <span className="list-card__meta">
                  En inventario: {battleItemInventory[item.id] ?? 0} — {price} moneda
                </span>
              </div>
              <button className="btn btn-primary" disabled={currency < price} onClick={() => purchaseBattleItem(item.id)}>
                Comprar
              </button>
            </li>
          )
        })}
      </ul>

      <h2>Ítems de Evolución</h2>
      <ul className="list-card">
        {evolutionCandidates.map(({ catId, cat }) => {
          const requiredItemCount = cat.evolutions!.true!.requiredItemCount ?? 0
          const current = evolutionItems[catId] ?? 0
          const maxed = current >= requiredItemCount
          return (
            <li key={catId} className="list-card__row">
              <div className="list-card__main">
                <span className="list-card__title">{cat.name}</span>
                <span className="list-card__meta">
                  {current}/{requiredItemCount} ítems — {EVOLUTION_ITEM_PRICE} moneda
                </span>
              </div>
              <button
                className="btn btn-primary"
                disabled={maxed || currency < EVOLUTION_ITEM_PRICE}
                onClick={() => purchaseEvolutionItem(catId)}
              >
                Comprar
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
