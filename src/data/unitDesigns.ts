import { IMPERIO_CAP1_DESIGNS } from './imperioCap1Design'
import { SEED_ENEMIES, SEED_UNITS, type ProceduralDesign } from './seedData'

/**
 * specs/042-unidades-mundo-cartoon (FR-003/FR-004, research.md Decisiones 1 y 9). Diseño cartoon propio para las
 * 28 unidades que no tenían ninguno: las 16 que se dibujaban con el cuerpo "cyber" genérico (retirado) y los 12
 * respaldos de las unidades con sprite, que se muestran solo mientras sus fotogramas cargan o si la carga falla.
 * Vive aparte de `IMPERIO_CAP1_DESIGNS` porque su test exige exactamente las 30 unidades del Capítulo 1.
 *
 * `size` = `width` de cada `Cat`. `primaryColor` es único en todo el catálogo, no coincide con ningún color de
 * información (`--bc-*`) y cumple HSL S < 0,69 y L < 0,48, por debajo de los siete tokens (research.md Decisión 7).
 *
 * Rasgo por arquetipo (biblia de arte §3; el vocabulario no crece): tanque → 'horns'; defensivo → 'shield';
 * agresivo / área → 'spikes'; rápido → 'tail'; mando / divinidad → 'crest'; aéreo (Angel) → 'wings'.
 * Control (Congelar/Debilitar/Ralentizar) y economía no tienen arquetipo en la biblia → 'none', como el Recluta.
 * Las orejas de gato NO son un rasgo: `unitFactory.ts` las añade a todo aliado.
 */
export const EXTRA_UNIT_DESIGNS: Record<string, ProceduralDesign> = {
  // — Respaldo de las 12 unidades con sprite (FR-004) —
  'basic-cat': { primaryColor: 0x8a7a63, baseShape: 'circle', size: 16, distinctiveFeature: 'none' }, // equilibrado, recluta inicial
  'tank-cat': { primaryColor: 0x6e5a4b, baseShape: 'rect', size: 24, distinctiveFeature: 'horns' }, // tanque: vida 200, daño 3
  'speed-cat': { primaryColor: 0x5f7a3a, baseShape: 'poly', size: 12, distinctiveFeature: 'tail' }, // rápido: velocidad 40
  'heavy-cat': { primaryColor: 0x7a3b2e, baseShape: 'rect', size: 28, distinctiveFeature: 'spikes' }, // agresivo: daño 20
  'solar-cat': { primaryColor: 0xa8742a, baseShape: 'circle', size: 14, distinctiveFeature: 'crest' }, // divinidad («Solar»)
  'armored-cat': { primaryColor: 0x3e5b80, baseShape: 'rect', size: 30, distinctiveFeature: 'shield' }, // defensivo: vida 250, lento
  'frost-cat': { primaryColor: 0x568694, baseShape: 'circle', size: 18, distinctiveFeature: 'none' }, // control: Congelar
  'weaken-cat': { primaryColor: 0x6b4f7a, baseShape: 'circle', size: 16, distinctiveFeature: 'none' }, // control: Debilitar
  'slow-cat': { primaryColor: 0x5c5348, baseShape: 'rect', size: 16, distinctiveFeature: 'none' }, // control: Ralentizar (grillete)
  'zombie-ward-cat': { primaryColor: 0x4d6b4f, baseShape: 'rect', size: 26, distinctiveFeature: 'shield' }, // defensivo: resistencias
  'triple-strike-cat': { primaryColor: 0x8c3f52, baseShape: 'poly', size: 18, distinctiveFeature: 'spikes' }, // agresivo: MultiHit
  'lucky-cat': { primaryColor: 0x3f7a5f, baseShape: 'circle', size: 16, distinctiveFeature: 'spikes' }, // agresivo: Critical

  // — Las 16 unidades que dejan el cuerpo "cyber" (FR-003) —
  'massive-strike-cat': { primaryColor: 0x6b3a4a, baseShape: 'rect', size: 26, distinctiveFeature: 'spikes' }, // agresivo: Daño Masivo
  'zombie-hunter-cat': { primaryColor: 0x5e6b2a, baseShape: 'poly', size: 20, distinctiveFeature: 'spikes' }, // agresivo: Asesino de Zombi
  'metal-hunter-cat': { primaryColor: 0x5a6470, baseShape: 'poly', size: 22, distinctiveFeature: 'spikes' }, // agresivo: Asesino de Metal
  'shield-cat': { primaryColor: 0x4a6d8c, baseShape: 'circle', size: 16, distinctiveFeature: 'shield' }, // defensivo: Escudo
  'summoner-cat': { primaryColor: 0x5b4a8a, baseShape: 'circle', size: 20, distinctiveFeature: 'crest' }, // mando: invoca al morir
  'strengthen-cat': { primaryColor: 0x8a4a2a, baseShape: 'poly', size: 20, distinctiveFeature: 'spikes' }, // agresivo: Enfurecer
  'dodge-cat': { primaryColor: 0x6e5f8c, baseShape: 'poly', size: 16, distinctiveFeature: 'tail' }, // rápido: Esquivar
  'survivor-cat': { primaryColor: 0x6f6a3a, baseShape: 'circle', size: 20, distinctiveFeature: 'shield' }, // defensivo: Sobrevivir
  'knockback-cat': { primaryColor: 0x82583a, baseShape: 'rect', size: 22, distinctiveFeature: 'horns' }, // tanque/empuje: Retroceso
  'wallet-cat': { primaryColor: 0x2f5f4f, baseShape: 'circle', size: 18, distinctiveFeature: 'none' }, // economía: Dinero Extra
  'anchor-cat': { primaryColor: 0x3a4a5c, baseShape: 'rect', size: 24, distinctiveFeature: 'shield' }, // defensivo: inmune a Retroceso
  'cat-garrochista': { primaryColor: 0x8f7a3a, baseShape: 'poly', size: 18, distinctiveFeature: 'tail' }, // rápido: velocidad 48
  'legend-cat-eclipse': { primaryColor: 0x2e2a4a, baseShape: 'circle', size: 40, distinctiveFeature: 'crest' }, // divinidad legendaria
  'legend-cat-supreme': { primaryColor: 0x6a4a1f, baseShape: 'rect', size: 42, distinctiveFeature: 'crest' }, // mando legendario
  'collab-cat-voidwalker': { primaryColor: 0x4f2e4a, baseShape: 'poly', size: 26, distinctiveFeature: 'spikes' }, // agresivo a distancia
  'collab-cat-star-idol': { primaryColor: 0x8c5a7a, baseShape: 'circle', size: 24, distinctiveFeature: 'wings' }, // aéreo: Angel
}

/**
 * specs/042-unidades-mundo-cartoon (research.md Decisión 1). Único punto de búsqueda del diseño de una unidad,
 * compartido por `UnitSprite` y `DeathEchoSprite`: catálogo semilla → Capítulo 1 → registro de esta spec.
 * `undefined` solo si la unidad no tiene diseño (el test de FR-012 impide que llegue a producción).
 */
export function resolveUnitDesign(catId: string): ProceduralDesign | undefined {
  return (
    SEED_UNITS.find((unit) => unit.id === catId)?.proceduralDesign ??
    SEED_ENEMIES.find((unit) => unit.id === catId)?.proceduralDesign ??
    IMPERIO_CAP1_DESIGNS[catId] ??
    EXTRA_UNIT_DESIGNS[catId]
  )
}
