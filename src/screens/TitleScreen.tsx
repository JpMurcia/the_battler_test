import { useMetaStore } from '../state/useMetaStore'
import type { Screen } from '../types/screen'

interface TitleScreenProps {
  onNavigate: (screen: Screen) => void
}

export function TitleScreen({ onNavigate }: TitleScreenProps) {
  const hasProgress = useMetaStore((state) => state.completedLevelIds.length > 0)

  return (
    <main>
      <h1>Battle Cats Web</h1>
      <button onClick={() => onNavigate('MainMenu')}>{hasProgress ? 'Continuar' : 'Jugar'}</button>
    </main>
  )
}
