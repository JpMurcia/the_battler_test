import type { Screen } from '../types/screen'

interface GachaScreenProps {
  onNavigate: (screen: Screen) => void
}

export function GachaScreen({ onNavigate }: GachaScreenProps) {
  return (
    <main>
      <h1>Gacha</h1>
      <button onClick={() => onNavigate('MainMenu')}>Volver</button>
    </main>
  )
}
