export type Screen =
  | 'Title'
  | 'MainMenu'
  | 'LevelSelect'
  | 'Gacha'
  | 'Upgrade'
  | 'Team'
  | 'Battle'
  | 'Result'
  | 'Settings'
  | 'CatGuide'
  | 'EnemyGuide'
  | 'TreasureMenu'

/** specs/026-navegacion-hub-mockup (data-model.md § Estado de UI). Independiente de `Screen` — el stack de
 * paneles superpuestos del Hub/Mapa de Etapas no participa del switch de vistas base de `App.tsx`. */
export type PanelId =
  | 'Equip'
  | 'Upgrade'
  | 'Gacha'
  | 'Library'
  | 'Settings'
  | 'TreasureMenu'
  | 'PlayerProfile'
  | 'News'
  /** specs/033-misiones-catnip-challenges. */
  | 'Missions'
