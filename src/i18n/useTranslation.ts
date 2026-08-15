import { useMetaStore } from '../state/useMetaStore'
import { translate, translations, type Locale, type TranslationKey } from './translations'

const SUPPORTED_LOCALES: Locale[] = ['es', 'en', 'zh', 'fr']

function resolveLocale(language: string): Locale {
  return (SUPPORTED_LOCALES as string[]).includes(language) ? (language as Locale) : 'es'
}

export function useTranslation() {
  const language = useMetaStore((state) => state.settings.language)
  const locale = resolveLocale(language)

  return { t: (key: TranslationKey) => translate(translations, key, locale) }
}
