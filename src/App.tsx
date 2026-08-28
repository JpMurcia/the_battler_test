import { useEffect, useState } from 'react'
import { BattleScreen } from './screens/BattleScreen'
import { HubScreen } from './screens/HubScreen'
import { LevelSelectScreen } from './screens/LevelSelectScreen'
import { ResultScreen } from './screens/ResultScreen'
import { TitleScreen } from './screens/TitleScreen'
import { useMetaStore } from './state/useMetaStore'
import type { Screen } from './types/screen'

function App() {
  const [screen, setScreen] = useState<Screen>('Title')
  const isHydrated = useMetaStore((state) => state.isHydrated)
  const hydrate = useMetaStore((state) => state.hydrate)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  if (!isHydrated) {
    return <main>Cargando…</main>
  }

  switch (screen) {
    case 'Title':
      return <TitleScreen onNavigate={setScreen} />
    case 'MainMenu':
      return <HubScreen onNavigate={setScreen} />
    case 'LevelSelect':
      return <LevelSelectScreen onNavigate={setScreen} />
    case 'Battle':
      return <BattleScreen onNavigate={setScreen} />
    case 'Result':
      return <ResultScreen onNavigate={setScreen} />
    // specs/026-navegacion-hub-mockup (US2): Gacha/Upgrade/Team/Settings/CatGuide/EnemyGuide/TreasureMenu
    // ahora se montan exclusivamente dentro de HubScreen como paneles superpuestos — nunca como `screen`
    // de nivel superior. `type Screen` conserva esos valores (Regla transversal, tasks.md) para no romper
    // la firma `onNavigate: (screen: Screen) => void` de esas siete pantallas.
    default:
      return null
  }
}

export default App
