import { ArrowLeft, Check } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from '../i18n/useTranslation'
import type { Locale } from '../i18n/translations'
import { useMetaStore } from '../state/useMetaStore'
import type { Screen } from '../types/screen'

interface SettingsScreenProps {
  onNavigate: (screen: Screen) => void
}

const LOCALES: { value: Locale; label: string }[] = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'zh', label: '中文' },
  { value: 'fr', label: 'Français' },
]

export function SettingsScreen({ onNavigate }: SettingsScreenProps) {
  const { t } = useTranslation()
  const settings = useMetaStore((state) => state.settings)
  const updateSettings = useMetaStore((state) => state.updateSettings)
  const [draft, setDraft] = useState(settings)

  const handleApply = () => {
    updateSettings(draft)
    onNavigate('MainMenu')
  }

  const handleBack = () => {
    onNavigate('MainMenu')
  }

  return (
    <main className="screen">
      <h1>{t('settings.heading')}</h1>

      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="field">
          <label htmlFor="musicVolume">{t('settings.musicVolume')}</label>
          <input
            id="musicVolume"
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={draft.musicVolume}
            onChange={(e) => setDraft({ ...draft, musicVolume: Number(e.target.value) })}
          />
        </div>

        <div className="field">
          <label htmlFor="sfxVolume">{t('settings.sfxVolume')}</label>
          <input
            id="sfxVolume"
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={draft.sfxVolume}
            onChange={(e) => setDraft({ ...draft, sfxVolume: Number(e.target.value) })}
          />
        </div>

        <div className="field">
          <label htmlFor="language">{t('settings.language')}</label>
          <select
            id="language"
            value={draft.language}
            onChange={(e) => setDraft({ ...draft, language: e.target.value })}
          >
            {LOCALES.map((locale) => (
              <option key={locale.value} value={locale.value}>
                {locale.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-primary" onClick={handleApply}>
          <Check size={16} aria-hidden="true" />
          {t('settings.apply')}
        </button>
        <button className="btn btn-ghost" onClick={handleBack}>
          <ArrowLeft size={16} aria-hidden="true" />
          {t('settings.back')}
        </button>
      </div>
    </main>
  )
}
