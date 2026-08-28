/** specs/026-navegacion-hub-mockup (FR-008, data-model.md § NewsEntry). Catálogo estático del Buzón de
 * Noticias — sin backend, sin feed en vivo (Assumptions). */
export interface NewsEntry {
  id: string
  title: string
  date: string // ISO YYYY-MM-DD
  body: string
}

/** Ordenadas de más reciente a más antigua — hitos ya shippeados del proyecto (research.md Decisión 6). */
export const NEWS_ENTRIES: NewsEntry[] = [
  {
    id: 'news-cat-combos',
    title: 'Cat Combos',
    date: '2026-08-23',
    body: 'Lleva la combinación exacta de gatos a la batalla y activa bonificaciones pasivas de equipo.',
  },
  {
    id: 'news-gacha',
    title: 'Cápsula de Gatos',
    date: '2026-08-20',
    body: 'Nuevo sistema de gacha completo: banners, tasas de rareza, Almacén de cápsulas e intercambio por XP o NP.',
  },
  {
    id: 'news-mapa-etapas',
    title: 'Mapa de Etapas Visual',
    date: '2026-08-16',
    body: 'La selección de nivel ahora es un mapa navegable, con nodos por etapa y panel de detalle.',
  },
  {
    id: 'news-reskin-cyber-modern',
    title: 'Reskin Cyber-Modern',
    date: '2026-08-15',
    body: 'Nueva identidad visual en las 12 pantallas del juego y en la escena de batalla, con sprites reales.',
  },
]
