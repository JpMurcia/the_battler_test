export type Locale = 'es' | 'en' | 'zh' | 'fr'

type TranslationEntry = { es: string } & Partial<Record<Exclude<Locale, 'es'>, string>>

export function translate<K extends string>(
  dict: Record<K, TranslationEntry>,
  key: K,
  locale: Locale,
): string {
  const entry = dict[key]
  return entry[locale] ?? entry.es
}

export type TranslationKey =
  | 'title.heading'
  | 'title.play'
  | 'title.continue'
  | 'menu.heading'
  | 'menu.currency'
  | 'menu.levels'
  | 'menu.gacha'
  | 'menu.upgrade'
  | 'menu.settings'
  | 'settings.heading'
  | 'settings.musicVolume'
  | 'settings.sfxVolume'
  | 'settings.language'
  | 'settings.apply'
  | 'settings.back'

export const translations: Record<TranslationKey, TranslationEntry> = {
  'title.heading': { es: 'Battle Cats Web', en: 'Battle Cats Web', zh: 'Battle Cats Web', fr: 'Battle Cats Web' },
  'title.play': { es: 'Jugar', en: 'Play', zh: '开始', fr: 'Jouer' },
  'title.continue': { es: 'Continuar', en: 'Continue', zh: '继续', fr: 'Continuer' },
  'menu.heading': { es: 'Menú Principal', en: 'Main Menu', zh: '主菜单', fr: 'Menu Principal' },
  'menu.currency': { es: 'Moneda', en: 'Currency', zh: '货币', fr: 'Monnaie' },
  'menu.levels': { es: 'Niveles', en: 'Levels', zh: '关卡', fr: 'Niveaux' },
  'menu.gacha': { es: 'Gacha', en: 'Gacha', zh: '扭蛋', fr: 'Gacha' },
  'menu.upgrade': { es: 'Mejorar', en: 'Upgrade', zh: '升级', fr: 'Améliorer' },
  'menu.settings': { es: 'Configuración', en: 'Settings', zh: '设置', fr: 'Configuration' },
  'settings.heading': { es: 'Configuración', en: 'Settings', zh: '设置', fr: 'Configuration' },
  'settings.musicVolume': { es: 'Volumen de música', en: 'Music volume', zh: '音乐音量', fr: 'Volume de la musique' },
  'settings.sfxVolume': { es: 'Volumen de efectos', en: 'Effects volume', zh: '音效音量', fr: 'Volume des effets' },
  'settings.language': { es: 'Idioma', en: 'Language', zh: '语言', fr: 'Langue' },
  'settings.apply': { es: 'Aplicar/Guardar', en: 'Apply/Save', zh: '应用/保存', fr: 'Appliquer/Enregistrer' },
  'settings.back': { es: 'Volver', en: 'Back', zh: '返回', fr: 'Retour' },
}
