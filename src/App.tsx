import { useEffect, useState } from 'react'
import { BattleScreen } from './screens/BattleScreen'
import { GachaScreen } from './screens/GachaScreen'
import { LevelSelectScreen } from './screens/LevelSelectScreen'
import { MainMenuScreen } from './screens/MainMenuScreen'
import { ResultScreen } from './screens/ResultScreen'
import { TitleScreen } from './screens/TitleScreen'
import { UpgradeScreen } from './screens/UpgradeScreen'
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
      return <MainMenuScreen onNavigate={setScreen} />
    case 'LevelSelect':
      return <LevelSelectScreen onNavigate={setScreen} />
    case 'Gacha':
      return <GachaScreen onNavigate={setScreen} />
    case 'Upgrade':
      return <UpgradeScreen onNavigate={setScreen} />
    case 'Battle':
      return <BattleScreen onNavigate={setScreen} />
    case 'Result':
      return <ResultScreen onNavigate={setScreen} />
  }
}

export default App
