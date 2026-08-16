import { Play } from 'lucide-react'
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
    <main className="screen" style={{ alignItems: 'center', justifyContent: 'center', gap: 28 }}>
      <div className="screen-kicker">Cyber-Modern Game UI</div>
      <h1 className="heading-hero">{t('title.heading')}</h1>
      <button className="btn btn-primary anim-pulse" onClick={() => onNavigate('MainMenu')}>
        <Play size={16} aria-hidden="true" />
        {hasProgress ? t('title.continue') : t('title.play')}
      </button>
    </main>
  )
}
