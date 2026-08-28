import { useState, type ReactNode } from 'react'
import { Archive, BookOpen, Coins, Mail, Settings as SettingsIcon, Sparkles, Swords, Wrench, Zap } from 'lucide-react'
import { NEWS_ENTRIES } from '../data/news'
import { GachaScreen } from './GachaScreen'
import { NewsPanel } from './NewsPanel'
import { LibraryPanel } from './panels/LibraryPanel'
import { PanelOverlay } from './shared/PanelOverlay'
import { PlayerProfilePanel } from './PlayerProfilePanel'
import { SettingsScreen } from './SettingsScreen'
import { TeamScreen } from './TeamScreen'
import { TreasureMenuScreen } from './TreasureMenuScreen'
import { UpgradeScreen } from './UpgradeScreen'
import { useTranslation } from '../i18n/useTranslation'
import { characterLevelOf, useMetaStore } from '../state/useMetaStore'
import type { PanelId, Screen } from '../types/screen'

interface HubScreenProps {
  onNavigate: (screen: Screen) => void
}

interface OpenPanel {
  id: PanelId
  /** specs/026-navegacion-hub-mockup (Assumptions). Solo relevante cuando `id === 'Gacha'` — el dock
   * "Almacén" abre Cápsula de Gatos directamente en su pestaña Almacén (T024). */
  gachaInitialTab?: 'roll' | 'storage'
}

const PANEL_LABELS: Record<PanelId, string> = {
  Equip: 'Equipar',
  Upgrade: 'Mejorar',
  Gacha: 'Cápsula de Gatos',
  Library: 'Biblioteca',
  Settings: 'Configuración',
  TreasureMenu: 'Menú de Tesoros',
  PlayerProfile: 'Perfil de Jugador',
  News: 'Buzón de Noticias',
}

/** specs/026-navegacion-hub-mockup (FR-001..FR-004). Sustituye a `MainMenuScreen`: HUD persistente + dock
 * inferior + accesos destacados, con Equipar/Mejorar/Cápsula/Biblioteca/Ajustes/Menú de Tesoros abriéndose
 * como paneles superpuestos en vez de pantallas completas (research.md Decisión 1). */
export function HubScreen({ onNavigate }: HubScreenProps) {
  const { t } = useTranslation()
  const ownedCats = useMetaStore((state) => state.ownedCats)
  const currency = useMetaStore((state) => state.currency)
  const missionEnergy = useMetaStore((state) => state.missionEnergy)
  const readNewsIds = useMetaStore((state) => state.readNewsIds)
  const rank = characterLevelOf(ownedCats)
  const hasUnreadNews = NEWS_ENTRIES.some((entry) => !readNewsIds.includes(entry.id))

  const [openPanels, setOpenPanels] = useState<OpenPanel[]>([])
  const open = (id: PanelId, opts?: Omit<OpenPanel, 'id'>) => setOpenPanels((stack) => [...stack, { id, ...opts }])
  const close = () => setOpenPanels((stack) => stack.slice(0, -1))
  const active = openPanels[openPanels.length - 1]

  /** contracts/panel-shell.md: único adaptador que no ignora siempre el destino recibido — `UpgradeScreen`
   * es el único punto de entrada existente a Equipar/Biblioteca/Menú de Tesoros desde dentro de otro panel (FR-013). */
  const handleUpgradeNavigate = (dest: Screen) => {
    if (dest === 'Team') open('Equip')
    else if (dest === 'CatGuide' || dest === 'EnemyGuide') open('Library')
    else if (dest === 'TreasureMenu') open('TreasureMenu')
    else close() // dest === 'MainMenu'
  }

  let panelContent: ReactNode = null
  switch (active?.id) {
    case 'Settings':
      panelContent = <SettingsScreen onNavigate={() => close()} />
      break
    case 'Equip':
      panelContent = <TeamScreen onNavigate={() => close()} />
      break
    case 'Upgrade':
      panelContent = <UpgradeScreen onNavigate={handleUpgradeNavigate} />
      break
    case 'Gacha':
      panelContent = <GachaScreen onNavigate={() => close()} initialTab={active.gachaInitialTab ?? 'roll'} />
      break
    case 'Library':
      panelContent = <LibraryPanel onClose={close} />
      break
    case 'TreasureMenu':
      panelContent = <TreasureMenuScreen onNavigate={() => close()} />
      break
    case 'PlayerProfile':
      panelContent = <PlayerProfilePanel onOpenSettings={() => open('Settings')} />
      break
    case 'News':
      panelContent = <NewsPanel />
      break
    default:
      panelContent = null
  }

  return (
    <main className="screen">
      <h1>Base de Gatos</h1>
      <div className="hud-bar">
        <span className="hud-chip">Rango {rank}</span>
        <span className="hud-chip">
          <Zap size={14} aria-hidden="true" color="var(--bc-cyan)" />
          Energía de misión: {Math.floor(missionEnergy.current)}/{missionEnergy.max}
        </span>
        <span className="hud-chip">
          <Coins size={14} aria-hidden="true" color="var(--bc-gold)" />
          Moneda: {currency}
        </span>
      </div>

      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button className="btn btn-primary anim-pulse" onClick={() => onNavigate('LevelSelect')}>
          <Swords size={16} aria-hidden="true" />
          ¡Batalla!
        </button>
        <button className="btn btn-outline--cyan" onClick={() => open('Equip')}>
          Equipar
        </button>
        <button className="btn btn-outline--orange" onClick={() => open('Upgrade')}>
          <Wrench size={16} aria-hidden="true" />
          Mejorar
        </button>
      </div>

      <div className="hud-bar hub-dock">
        <button className="btn hub-dock__button" onClick={() => open('Library')} title="Biblioteca">
          <BookOpen size={16} aria-hidden="true" color="var(--bc-pink)" />
          Biblioteca
        </button>
        <button className="btn hub-dock__button" onClick={() => open('Gacha')} title="Cápsula de Gatos">
          <Sparkles size={16} aria-hidden="true" color="var(--bc-purple)" />
          Cápsula de Gatos
        </button>
        <button className="btn hub-dock__button" onClick={() => open('Gacha', { gachaInitialTab: 'storage' })} title="Almacén">
          <Archive size={16} aria-hidden="true" />
          Almacén
        </button>
      </div>

      <div className="hud-bar">
        <button className="btn btn-ghost" onClick={() => open('PlayerProfile')}>
          Perfil de Jugador
        </button>
        <button className="btn btn-ghost" style={{ position: 'relative' }} onClick={() => open('News')} title="Buzón de Noticias">
          <Mail size={16} aria-hidden="true" />
          Buzón de Noticias
          {hasUnreadNews && <span className="hub-dock__badge">!</span>}
        </button>
        <button className="btn btn-ghost" onClick={() => open('Settings')}>
          <SettingsIcon size={16} aria-hidden="true" />
          {t('menu.settings')}
        </button>
      </div>

      {active && (
        <PanelOverlay labelledBy={PANEL_LABELS[active.id]} onClose={close}>
          {panelContent}
        </PanelOverlay>
      )}
    </main>
  )
}
