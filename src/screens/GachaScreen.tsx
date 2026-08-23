import { useState } from 'react'
import { ArrowLeft, Gem, Sparkles } from 'lucide-react'
import { CATS, RARITY_TAG_CLASS } from '../data/cats'
import { GACHA_BANNERS, GACHA_MULTI_ROLL_COST, GACHA_SINGLE_ROLL_COST, type GachaRarity, type GachaRollResult } from '../data/gacha'
import { useMetaStore } from '../state/useMetaStore'
import type { Screen } from '../types/screen'

interface GachaScreenProps {
  onNavigate: (screen: Screen) => void
}

/** specs/024-sistema-gacha (FR-006/FR-011). Clase `.gacha-reveal__orb--<rareza>` de src/theme.css por cada GachaRarity. */
const ORB_CLASS: Record<GachaRarity, string> = {
  Legendario: 'gacha-reveal__orb--legendario',
  Megarraro: 'gacha-reveal__orb--megarraro',
  Superraro: 'gacha-reveal__orb--superraro',
  Raro: 'gacha-reveal__orb--raro',
}

function catNameOf(catId: string): string {
  return CATS.find((cat) => cat.id === catId)?.name ?? catId
}

/** specs/024-sistema-gacha (US1/US2). Pestaña "Tirar": selector de banner, tasas y botones de tirada. */
function RollTab({ activeBannerId, setActiveBannerId, onRevealed }: {
  activeBannerId: string
  setActiveBannerId: (id: string) => void
  onRevealed: (results: GachaRollResult[]) => void
}) {
  const gachaCurrency = useMetaStore((state) => state.gachaCurrency)
  const rollGachaSingle = useMetaStore((state) => state.rollGachaSingle)
  const rollGachaMulti = useMetaStore((state) => state.rollGachaMulti)
  const [rolling, setRolling] = useState(false)

  const activeBanner = GACHA_BANNERS.find((banner) => banner.id === activeBannerId) ?? GACHA_BANNERS[0]

  const handleSingle = async () => {
    setRolling(true)
    const result = await rollGachaSingle(activeBanner.id)
    setRolling(false)
    if (result) onRevealed([result])
  }

  const handleMulti = async () => {
    setRolling(true)
    const results = await rollGachaMulti(activeBanner.id)
    setRolling(false)
    if (results) onRevealed(results)
  }

  return (
    <div className="screen-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="hud-bar">
        {GACHA_BANNERS.map((banner) => (
          <button
            key={banner.id}
            className={banner.id === activeBanner.id ? 'btn btn-outline--purple' : 'btn'}
            onClick={() => setActiveBannerId(banner.id)}
          >
            {banner.name}
          </button>
        ))}
      </div>
      <section className="glass-panel">
        <p className="screen-subtitle">{activeBanner.tagline}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          {activeBanner.odds.map((odds) => (
            <div key={odds.rarity} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className={`tag ${RARITY_TAG_CLASS[odds.rarity]}`} style={{ width: 90, flexShrink: 0 }}>
                {odds.rarity}
              </span>
              <div className="progress-bar" style={{ flex: 1 }}>
                <div className="progress-bar__fill--gold" style={{ width: `${odds.percent}%`, height: '100%', borderRadius: 5 }} />
              </div>
              <span className="list-card__meta" style={{ width: 44, textAlign: 'right' }}>
                {odds.percent}%
              </span>
            </div>
          ))}
        </div>
      </section>
      <div className="hud-bar">
        <button className="btn btn-outline--cyan" disabled={rolling || gachaCurrency < GACHA_SINGLE_ROLL_COST} onClick={handleSingle}>
          Tirada Simple ({GACHA_SINGLE_ROLL_COST})
        </button>
        <button className="btn btn-primary" disabled={rolling || gachaCurrency < GACHA_MULTI_ROLL_COST} onClick={handleMulti}>
          Tirada x11 ({GACHA_MULTI_ROLL_COST})
        </button>
      </div>
    </div>
  )
}

/** specs/024-sistema-gacha (FR-011/FR-012). Revelado — un orbe (tirada simple) o grilla de 11 (tirada x11). */
function RevealScreen({ results, onContinue }: { results: GachaRollResult[]; onContinue: () => void }) {
  const isMulti = results.length > 1
  return (
    <div className="gacha-reveal screen-scroll">
      {isMulti ? (
        <div className="gacha-reveal__grid">
          {results.map((result, index) => (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div className={`gacha-reveal__orb ${ORB_CLASS[result.rarity]}`}>{catNameOf(result.catId).charAt(0)}</div>
              <span className="list-card__meta" style={{ textAlign: 'center' }}>
                {catNameOf(result.catId)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className={`gacha-reveal__orb ${ORB_CLASS[results[0].rarity]}`} style={{ width: 130, height: 130, fontSize: 30 }}>
            {catNameOf(results[0].catId).charAt(0)}
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className={`tag ${RARITY_TAG_CLASS[results[0].rarity]}`}>{results[0].rarity}</div>
            <h2 style={{ marginTop: 4 }}>{catNameOf(results[0].catId)}</h2>
          </div>
        </>
      )}
      <button className="btn btn-primary" onClick={onContinue}>
        Continuar
      </button>
    </div>
  )
}

/** specs/024-sistema-gacha (US3/US6). Pestaña "Almacén": activar (nuevo → roster, duplicado → nivel "+") o intercambiar por XP/NP. */
function StorageTab() {
  const gachaStorage = useMetaStore((state) => state.gachaStorage)
  const ownedCats = useMetaStore((state) => state.ownedCats)
  const activateCapsule = useMetaStore((state) => state.activateCapsule)
  const exchangeCapsuleForXp = useMetaStore((state) => state.exchangeCapsuleForXp)
  const exchangeCapsuleForNp = useMetaStore((state) => state.exchangeCapsuleForNp)

  if (gachaStorage.length === 0) {
    return <p className="screen-subtitle">Sin cápsulas pendientes.</p>
  }

  return (
    <ul className="list-card screen-scroll">
      {gachaStorage.map((row) => {
        const isDuplicate = row.catId in ownedCats
        const canExchangeForNp = row.rarity === 'Megarraro' || row.rarity === 'Legendario'
        return (
          <li key={row.id} className="list-card__row">
            <div className="list-card__main">
              <span className="list-card__title">{catNameOf(row.catId)}</span>
              <span className={`tag ${RARITY_TAG_CLASS[row.rarity]}`}>{row.rarity}</span>
              {isDuplicate && <span className="list-card__meta">Ya poseído — activar suma nivel "+"</span>}
            </div>
            <div className="hud-bar">
              <button className="btn btn-primary" onClick={() => activateCapsule(row.id!)}>
                Activar
              </button>
              <button className="btn btn-outline--cyan" onClick={() => exchangeCapsuleForXp(row.id!)}>
                Intercambiar por XP
              </button>
              {canExchangeForNp && (
                <button className="btn btn-outline--gold" onClick={() => exchangeCapsuleForNp(row.id!)}>
                  Intercambiar por NP
                </button>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function GachaScreen({ onNavigate }: GachaScreenProps) {
  const gachaCurrency = useMetaStore((state) => state.gachaCurrency)
  const npCurrency = useMetaStore((state) => state.npCurrency)
  const gachaStorage = useMetaStore((state) => state.gachaStorage)

  const [activeTab, setActiveTab] = useState<'roll' | 'storage'>('roll')
  const [activeBannerId, setActiveBannerId] = useState(GACHA_BANNERS[0].id)
  const [revealResults, setRevealResults] = useState<GachaRollResult[] | null>(null)

  return (
    <main className="screen">
      <h1>Cápsula de Gatos</h1>
      <div className="hud-bar">
        <span className="hud-chip">
          <Sparkles size={14} aria-hidden="true" color="var(--bc-purple)" />
          Créditos de Cápsula: {gachaCurrency}
        </span>
        <span className="hud-chip">
          <Gem size={14} aria-hidden="true" color="var(--bc-gold)" />
          NP: {npCurrency}
        </span>
      </div>

      {revealResults ? (
        <RevealScreen results={revealResults} onContinue={() => setRevealResults(null)} />
      ) : (
        <>
          <div className="hud-bar">
            <button className={activeTab === 'roll' ? 'btn btn-outline--cyan' : 'btn'} onClick={() => setActiveTab('roll')}>
              Tirar
            </button>
            <button className={activeTab === 'storage' ? 'btn btn-outline--cyan' : 'btn'} onClick={() => setActiveTab('storage')}>
              Almacén ({gachaStorage.length})
            </button>
          </div>

          {activeTab === 'roll' ? (
            <RollTab activeBannerId={activeBannerId} setActiveBannerId={setActiveBannerId} onRevealed={setRevealResults} />
          ) : (
            <StorageTab />
          )}
        </>
      )}

      <button className="btn btn-ghost" onClick={() => onNavigate('MainMenu')}>
        <ArrowLeft size={16} aria-hidden="true" />
        Volver
      </button>
    </main>
  )
}
