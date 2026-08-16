import { Coins, Settings, Sparkles, Swords, Wrench } from 'lucide-react'
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
    <main className="screen">
      <h1>{t('menu.heading')}</h1>
      <div className="hud-chip" style={{ alignSelf: 'flex-start' }}>
        <Coins size={15} aria-hidden="true" color="var(--bc-gold)" />
        {t('menu.currency')}: {currency}
      </div>
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button className="btn btn-primary anim-pulse" onClick={() => onNavigate('LevelSelect')}>
          <Swords size={16} aria-hidden="true" />
          {t('menu.levels')}
        </button>
        <button className="btn btn-outline--purple" onClick={() => onNavigate('Gacha')}>
          <Sparkles size={16} aria-hidden="true" />
          {t('menu.gacha')}
        </button>
        <button className="btn btn-outline--orange" onClick={() => onNavigate('Upgrade')}>
          <Wrench size={16} aria-hidden="true" />
          {t('menu.upgrade')}
        </button>
        <button className="btn" onClick={() => onNavigate('Settings')}>
          <Settings size={16} aria-hidden="true" />
          {t('menu.settings')}
        </button>
      </div>
    </main>
  )
}
