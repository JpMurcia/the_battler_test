/**
 * specs/021-reskin-cyber-modern (rediseño Cyber-Modern). Poses puras y deterministas para los
 * efectos de impacto efímeros (onda de choque, chispas, texto de daño flotante) que `BattleField`
 * dispara al detectar pérdida de hp de una unidad o base en un tick. Mismo patrón que
 * `getDeathEchoPose` en src/game/animation.ts: solo matemática, sin Pixi/React — el componente que
 * las consume decide cuándo expirar (Constitución § VI).
 */

const IMPACT_EFFECT_DURATION_SECONDS = 0.45
const SPARK_COUNT = 5

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Progreso 0→1 de la duración total del efecto — 1 antes de empezar, 0 al terminar (fuera de rango incluido). */
function remainingProgress(elapsedSeconds: number, durationSeconds: number): number {
  return clamp(1 - elapsedSeconds / durationSeconds, 0, 1)
}

export function getImpactEffectDurationSeconds(): number {
  return IMPACT_EFFECT_DURATION_SECONDS
}

export interface ShockwavePose {
  radius: number
  alpha: number
}

/** Anillo que se expande de 0 a `maxRadius` (ease-out) mientras se desvanece — specs/021 punto "ondas de choque". */
export function getShockwavePose(elapsedSeconds: number, maxRadius: number): ShockwavePose {
  const progress = 1 - remainingProgress(elapsedSeconds, IMPACT_EFFECT_DURATION_SECONDS)
  const eased = 1 - (1 - progress) * (1 - progress) // ease-out quadrático
  return {
    radius: maxRadius * eased,
    alpha: remainingProgress(elapsedSeconds, IMPACT_EFFECT_DURATION_SECONDS) * 0.8,
  }
}

export interface SparkPose {
  offsetX: number
  offsetY: number
  alpha: number
  scale: number
}

/**
 * Posición de una chispa individual de un burst radial — `index`/`count` reparten el ángulo de
 * salida en partes iguales, con un pequeño offset determinista por chispa para que no queden
 * perfectamente simétricas (sin `Math.random()`, sigue siendo determinista para tests).
 */
export function getSparkPose(elapsedSeconds: number, index: number, count: number, maxDistance: number): SparkPose {
  const progress = 1 - remainingProgress(elapsedSeconds, IMPACT_EFFECT_DURATION_SECONDS)
  const angle = (index / count) * Math.PI * 2 + index * 0.35
  const distance = maxDistance * progress
  return {
    offsetX: Math.cos(angle) * distance,
    offsetY: Math.sin(angle) * distance * 0.6, // aplanado — el carril es predominantemente horizontal
    alpha: remainingProgress(elapsedSeconds, IMPACT_EFFECT_DURATION_SECONDS),
    scale: 1 - progress * 0.6,
  }
}

export function getSparkCount(): number {
  return SPARK_COUNT
}

export interface FloatingDamagePose {
  offsetY: number
  alpha: number
}

/** Texto de daño que asciende y se desvanece — específicamente más lento/alto que chispas/onda para seguir legible. */
export function getFloatingDamagePose(elapsedSeconds: number): FloatingDamagePose {
  const durationSeconds = IMPACT_EFFECT_DURATION_SECONDS * 2
  const progress = clamp(elapsedSeconds / durationSeconds, 0, 1)
  return {
    offsetY: -progress * 22,
    alpha: 1 - progress,
  }
}

export function getFloatingDamageDurationSeconds(): number {
  return IMPACT_EFFECT_DURATION_SECONDS * 2
}
