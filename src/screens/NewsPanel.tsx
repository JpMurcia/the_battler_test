import { useEffect } from 'react'
import { NEWS_ENTRIES } from '../data/news'
import { useMetaStore } from '../state/useMetaStore'

/** specs/026-navegacion-hub-mockup (FR-008/FR-009). Lista NEWS_ENTRIES (más reciente primero) y marca todas
 * como leídas al montar — `markNewsRead` ya es idempotente, sin necesidad de filtrar aquí. */
export function NewsPanel() {
  const markNewsRead = useMetaStore((state) => state.markNewsRead)

  const sorted = [...NEWS_ENTRIES].sort((a, b) => (a.date < b.date ? 1 : -1))

  useEffect(() => {
    for (const entry of sorted) {
      void markNewsRead(entry.id)
    }
    // Solo al montar (FR-009) — `sorted`/`markNewsRead` son estables entre renders de este panel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="screen-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h1>Buzón de Noticias</h1>
      <ul className="list-card">
        {sorted.map((entry) => (
          <li key={entry.id} className="list-card__row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <span className="list-card__title">{entry.title}</span>
              <span className="list-card__meta">{entry.date}</span>
            </div>
            <p style={{ margin: 0 }}>{entry.body}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
