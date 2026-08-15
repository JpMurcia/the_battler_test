import { useTranslation } from '../i18n/useTranslation'
import { useMetaStore } from '../state/useMetaStore'
import type { Screen } from '../types/screen'

interface TitleScreenProps {
  onNavigate: (screen: Screen) => void
}

export function TitleScreen({ onNavigate }: TitleScreenProps) {
  const { t } = useTranslation()
  const hasProgress = useMetaStore((state) => state.completedLevelIds.length > 0)

  return (
    <main>
      <h1>{t('title.heading')}</h1>
      <button onClick={() => onNavigate('MainMenu')}>{hasProgress ? t('title.continue') : t('title.play')}</button>
    </main>
  )
}
