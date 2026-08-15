import { CATS } from '../data/cats'
import { useMetaStore } from '../state/useMetaStore'
import type { Screen } from '../types/screen'

interface UpgradeScreenProps {
  onNavigate: (screen: Screen) => void
}

/** Costo de la siguiente mejora — debe coincidir con `upgradeCost` de `useMetaStore`. */
const upgradeCost = (currentLevel: number) => currentLevel * 100

export function UpgradeScreen({ onNavigate }: UpgradeScreenProps) {
  const currency = useMetaStore((state) => state.currency)
  const ownedCats = useMetaStore((state) => state.ownedCats)
  const upgradeCat = useMetaStore((state) => state.upgradeCat)

  const characterLevel = Object.values(ownedCats).reduce((sum, cat) => sum + cat.level, 0)

  return (
    <main>
      <h1>Base</h1>
      <p>Nivel de personaje: {characterLevel}</p>
      <p>Moneda: {currency}</p>
      <ul>
        {CATS.filter((cat) => cat.id in ownedCats).map((cat) => {
          const owned = ownedCats[cat.id]
          const cost = upgradeCost(owned.level)
          const disabled = currency < cost
          return (
            <li key={cat.id}>
              {cat.name} — Nivel {owned.level} (siguiente mejora: {cost})
              <button disabled={disabled} onClick={() => upgradeCat(cat.id)}>
                Mejorar
              </button>
            </li>
          )
        })}
      </ul>
      <button onClick={() => onNavigate('Team')}>Equipo</button>
      <button onClick={() => onNavigate('MainMenu')}>Volver</button>
    </main>
  )
}
