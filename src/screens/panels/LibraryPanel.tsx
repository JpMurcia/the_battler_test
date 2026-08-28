import { useState } from 'react'
import { CatGuideScreen } from '../CatGuideScreen'
import { EnemyGuideScreen } from '../EnemyGuideScreen'

interface LibraryPanelProps {
  /** Se invoca cuando cualquiera de las dos guías pide "volver" — cierra el panel Biblioteca completo,
   * sin distinguir el destino literal que pasan internamente (research.md Decisión 2/3). */
  onClose: () => void
}

/** specs/026-navegacion-hub-mockup (research.md Decisión 3). Agrupa Guía de Gatos y Guía de Enemigos bajo
 * un único acceso "Biblioteca" del dock, con tabs — sin modificar ninguna de las dos pantallas. */
export function LibraryPanel({ onClose }: LibraryPanelProps) {
  const [activeTab, setActiveTab] = useState<'cats' | 'enemies'>('cats')

  return (
    <div className="screen-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
      <div className="hud-bar">
        <button className={activeTab === 'cats' ? 'btn btn-outline--cyan' : 'btn'} onClick={() => setActiveTab('cats')}>
          Cat Guide
        </button>
        <button className={activeTab === 'enemies' ? 'btn btn-outline--cyan' : 'btn'} onClick={() => setActiveTab('enemies')}>
          Enemy Guide
        </button>
      </div>
      {activeTab === 'cats' ? (
        <CatGuideScreen onNavigate={() => onClose()} />
      ) : (
        <EnemyGuideScreen onNavigate={() => onClose()} />
      )}
    </div>
  )
}
