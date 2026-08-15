import { useMetaStore } from '../state/useMetaStore'
import type { Screen } from '../types/screen'

interface MainMenuScreenProps {
  onNavigate: (screen: Screen) => void
}

export function MainMenuScreen({ onNavigate }: MainMenuScreenProps) {
  const currency = useMetaStore((state) => state.currency)

  return (
    <main>
      <h1>Menú Principal</h1>
      <p>Moneda: {currency}</p>
      <button onClick={() => onNavigate('LevelSelect')}>Niveles</button>
      <button onClick={() => onNavigate('Gacha')}>Gacha</button>
      <button onClick={() => onNavigate('Upgrade')}>Mejorar</button>
    </main>
  )
}
