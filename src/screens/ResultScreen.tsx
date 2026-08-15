import type { Screen } from '../types/screen'

interface ResultScreenProps {
  onNavigate: (screen: Screen) => void
}

export function ResultScreen({ onNavigate }: ResultScreenProps) {
  return (
    <main>
      <h1>Resultado</h1>
      <button onClick={() => onNavigate('LevelSelect')}>Volver</button>
    </main>
  )
}
