import type { Screen } from '../types/screen'

interface UpgradeScreenProps {
  onNavigate: (screen: Screen) => void
}

export function UpgradeScreen({ onNavigate }: UpgradeScreenProps) {
  return (
    <main>
      <h1>Mejorar Gatos</h1>
      <button onClick={() => onNavigate('MainMenu')}>Volver</button>
    </main>
  )
}
