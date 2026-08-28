import type { ProceduralDesign } from './seedData'

/**
 * specs/028-ajustes-combate-mapa-disenos (US3/FR-010/FR-012). Diseño procedural propio para cada una de las 30
 * unidades nuevas de `specs/027-capitulo-1-imperio-gatos` (14 `cat-*` jugables + 16 `enemy-*`, ver ese spec §
 * data-model.md), consumido por `UnitSprite.tsx` (research.md Decisión 4) igual que `SEED_UNITS`/`SEED_ENEMIES`
 * ya hacen para el catálogo semilla. `size` replica el `width` de cada `Cat` en `src/data/cats.ts`. `primaryColor`
 * es único por unidad, así que ninguna combinación forma+rasgo+color se repite entre las 30 (FR-012) sin importar
 * cuántas compartan `baseShape`/`distinctiveFeature` — el rasgo se elige por arquetipo (research.md Decisión 5):
 * tanque → 'horns', anti-Flotante/aéreo → 'wings', defensivo → 'shield', agresivo/área → 'spikes', rápido → 'tail'.
 */
export const IMPERIO_CAP1_DESIGNS: Record<string, ProceduralDesign> = {
  // — 14 Cat jugables —
  'cat-recluta': { primaryColor: 0x94a3b8, baseShape: 'circle', size: 16, distinctiveFeature: 'none' },
  'cat-yunque': { primaryColor: 0x64748b, baseShape: 'rect', size: 26, distinctiveFeature: 'shield' },
  'cat-sigiloso': { primaryColor: 0x8b5cf6, baseShape: 'poly', size: 14, distinctiveFeature: 'tail' },
  'cat-cuchilla': { primaryColor: 0xdc2626, baseShape: 'poly', size: 20, distinctiveFeature: 'spikes' },
  'cat-forzudo': { primaryColor: 0x92400e, baseShape: 'rect', size: 32, distinctiveFeature: 'horns' },
  'cat-verdoso': { primaryColor: 0x16a34a, baseShape: 'circle', size: 16, distinctiveFeature: 'wings' },
  'cat-deidad': { primaryColor: 0xfacc15, baseShape: 'circle', size: 20, distinctiveFeature: 'crest' },
  'cat-cornamenta': { primaryColor: 0xd97706, baseShape: 'poly', size: 15, distinctiveFeature: 'horns' },
  'cat-migratorio': { primaryColor: 0x38bdf8, baseShape: 'circle', size: 18, distinctiveFeature: 'wings' },
  'cat-centinela': { primaryColor: 0x475569, baseShape: 'rect', size: 20, distinctiveFeature: 'shield' },
  'cat-anfibio': { primaryColor: 0x14b8a6, baseShape: 'poly', size: 18, distinctiveFeature: 'fin' },
  'cat-escamado': { primaryColor: 0x059669, baseShape: 'rect', size: 24, distinctiveFeature: 'spikes' },
  'cat-coloso': { primaryColor: 0x1e293b, baseShape: 'rect', size: 34, distinctiveFeature: 'horns' },
  'cat-veterano': { primaryColor: 0xa8a29e, baseShape: 'circle', size: 16, distinctiveFeature: 'none' },

  // — 16 Cat de enemigo —
  'enemy-merodeador': { primaryColor: 0xb91c1c, baseShape: 'circle', size: 16, distinctiveFeature: 'fangs' },
  'enemy-escudero': { primaryColor: 0xb45309, baseShape: 'rect', size: 18, distinctiveFeature: 'shield' },
  'enemy-triturador': { primaryColor: 0x65a30d, baseShape: 'poly', size: 14, distinctiveFeature: 'fangs' },
  'enemy-rondador': { primaryColor: 0xc2410c, baseShape: 'circle', size: 16, distinctiveFeature: 'tail' },
  'enemy-turba': { primaryColor: 0xca8a04, baseShape: 'poly', size: 18, distinctiveFeature: 'spikes' },
  'enemy-planeador': { primaryColor: 0x7dd3fc, baseShape: 'circle', size: 22, distinctiveFeature: 'wings' },
  'enemy-saltarin-alado': { primaryColor: 0xf472b6, baseShape: 'poly', size: 20, distinctiveFeature: 'wings' },
  'enemy-behemot-gris': { primaryColor: 0x9ca3af, baseShape: 'rect', size: 30, distinctiveFeature: 'horns' },
  'enemy-carmesi': { primaryColor: 0x991b1b, baseShape: 'rect', size: 26, distinctiveFeature: 'fangs' },
  'enemy-emperador-volador': { primaryColor: 0x7c3aed, baseShape: 'circle', size: 26, distinctiveFeature: 'crest' },
  'enemy-foca-blindada': { primaryColor: 0x1e3a8a, baseShape: 'circle', size: 30, distinctiveFeature: 'shield' },
  'enemy-boxeador': { primaryColor: 0x7f1d1d, baseShape: 'rect', size: 32, distinctiveFeature: 'spikes' },
  'enemy-embestida': { primaryColor: 0xea580c, baseShape: 'poly', size: 32, distinctiveFeature: 'horns' },
  'enemy-instructor-feroz': { primaryColor: 0x450a0a, baseShape: 'rect', size: 34, distinctiveFeature: 'fangs' },
  'enemy-unicornio-guerra': { primaryColor: 0xfef08a, baseShape: 'poly', size: 36, distinctiveFeature: 'horns' },
  'enemy-la-mascara': { primaryColor: 0x18181b, baseShape: 'rect', size: 44, distinctiveFeature: 'crest' },
}
