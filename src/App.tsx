import { useEffect, useState } from 'react'
import { BattleScreen } from './screens/BattleScreen'
import { CatGuideScreen } from './screens/CatGuideScreen'
import { EnemyGuideScreen } from './screens/EnemyGuideScreen'
import { GachaScreen } from './screens/GachaScreen'
import { LevelSelectScreen } from './screens/LevelSelectScreen'
import { MainMenuScreen } from './screens/MainMenuScreen'
import { ResultScreen } from './screens/ResultScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { TeamScreen } from './screens/TeamScreen'
import { TitleScreen } from './screens/TitleScreen'
import { TreasureMenuScreen } from './screens/TreasureMenuScreen'
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
    case 'Settings':
      return <SettingsScreen onNavigate={setScreen} />
    case 'LevelSelect':
      return <LevelSelectScreen onNavigate={setScreen} />
    case 'Gacha':
      return <GachaScreen onNavigate={setScreen} />
    case 'Upgrade':
      return <UpgradeScreen onNavigate={setScreen} />
    case 'Team':
      return <TeamScreen onNavigate={setScreen} />
    case 'Battle':
      return <BattleScreen onNavigate={setScreen} />
    case 'Result':
      return <ResultScreen onNavigate={setScreen} />
    case 'CatGuide':
      return <CatGuideScreen onNavigate={setScreen} />
    case 'EnemyGuide':
      return <EnemyGuideScreen onNavigate={setScreen} />
    case 'TreasureMenu':
      return <TreasureMenuScreen onNavigate={setScreen} />
  }
}

export default App
