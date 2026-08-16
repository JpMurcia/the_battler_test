import { ArrowLeft, Sparkles } from 'lucide-react'
import type { Screen } from '../types/screen'

interface GachaScreenProps {
  onNavigate: (screen: Screen) => void
}

export function GachaScreen({ onNavigate }: GachaScreenProps) {
  return (
    <main className="screen" style={{ alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <Sparkles size={32} aria-hidden="true" color="var(--bc-purple)" />
      <h1>Gacha</h1>
      <button className="btn btn-ghost" onClick={() => onNavigate('MainMenu')}>
        <ArrowLeft size={16} aria-hidden="true" />
        Volver
      </button>
    </main>
  )
}
