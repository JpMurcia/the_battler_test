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
    <main>
      <h1>{t('settings.heading')}</h1>

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

      <button onClick={handleApply}>{t('settings.apply')}</button>
      <button onClick={handleBack}>{t('settings.back')}</button>
    </main>
  )
}
