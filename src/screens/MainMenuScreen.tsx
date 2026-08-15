import { useTranslation } from '../i18n/useTranslation'
import { useMetaStore } from '../state/useMetaStore'
import type { Screen } from '../types/screen'

interface MainMenuScreenProps {
  onNavigate: (screen: Screen) => void
}

export function MainMenuScreen({ onNavigate }: MainMenuScreenProps) {
  const { t } = useTranslation()
  const currency = useMetaStore((state) => state.currency)

  return (
    <main>
      <h1>{t('menu.heading')}</h1>
      <p>
        {t('menu.currency')}: {currency}
      </p>
      <button onClick={() => onNavigate('LevelSelect')}>{t('menu.levels')}</button>
      <button onClick={() => onNavigate('Gacha')}>{t('menu.gacha')}</button>
      <button onClick={() => onNavigate('Upgrade')}>{t('menu.upgrade')}</button>
      <button onClick={() => onNavigate('Settings')}>{t('menu.settings')}</button>
    </main>
  )
}
