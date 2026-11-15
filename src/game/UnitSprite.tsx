import { extend, useApplication, useTick } from '@pixi/react'
import { AnimatedSprite, Container, Graphics, Sprite, type Texture } from 'pixi.js'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CATS } from '../data/cats'
import { resolveUnitDesign } from '../data/unitDesigns'
import type { BattleUnit } from '../engine/types'
import { getOrCreateUnitTexture } from './graphics/unitFactory'
import { getHpFraction } from './graphics/baseTower'
import { getLaneScreenX, getLaneScreenY } from './graphics/layout'
import { computeTeamRingGeometry, drawTeamRing } from './graphics/teamRing'
import { drawUnitHpBar } from './graphics/unitHpBar'
import { useGameStore } from '../state/useGameStore'
import { ANIMATION_STATE_TO_SPRITE_FOLDER, getAnimationPose, getAnimationState, getVisualProfile } from './animation'
import { createUnitEventState, getUnitEventPose, updateUnitEvents } from './eventAnimations'
import { getHitFlashFilter } from './graphics/hitFlash'
import { prefersReducedMotion } from './motionPreference'
import { loadSpriteTextures, resolveSpriteAnimationSet } from './spriteAssets'

extend({ Container, Graphics, AnimatedSprite, Sprite })

const SPRITE_ANIMATION_SPEED = 0.3
/** specs/029-pulido-batalla-hud (US3). Mismo umbral que BaseTower.tsx — evita redibujar por ruido de punto flotante. */
const HP_BAR_REDRAW_THRESHOLD = 0.004

/** specs/042 (research.md Decisión 5): una unidad sin sprite ni diseño se avisa una sola vez, nunca se tapa con un cuerpo genérico. */
const reportedMissingDesigns = new Set<string>()

interface UnitSpriteProps {
  instanceId: string
  catId: string
  team: BattleUnit['team']
}

interface LoadedTextures {
  idle: Texture[]
  attack: Texture[]
}

/**
 * Representación visual animada de una BattleUnit — el cuerpo se dibuja una sola vez (por
 * catId/team, que nunca cambian tras el spawn); la posición y la animación de idle/ataque se
 * aplican por transform en cada frame vía un useTick propio que lee la unidad fresca directo de
 * useGameStore, sin pasar por props/re-render de React (specs/003-identidad-visual-animada/research.md
 * Decisión 2/3). Cierra la excepción a Constitución § III declarada en specs/002-motor-de-combate/plan.md.
 *
 * specs/021-reskin-cyber-modern (US4): si `catId` tiene `spriteKey` y su carga de texturas resuelve,
 * el cuerpo es un `AnimatedSprite` real (reposo/ataque) — el intercambio de arreglo de texturas ocurre
 * dentro del mismo `useTick`, nunca por prop/re-render (research.md Decisión 2).
 *
 * specs/042-unidades-mundo-cartoon: sin sprite cargado (no tiene, aún carga o falló) el cuerpo es la
 * textura cartoon de su diseño (`resolveUnitDesign`); el cuerpo "cyber" genérico ya no existe (FR-002).
 * Bajo los pies, un anillo de equipo estático hermano del cuerpo: sigue a la unidad en x pero no hereda
 * su rebote, aplastamiento ni giro (US2/FR-008, research.md Decisión 4).
 *
 * specs/044-animaciones-de-evento: Aparición, Golpeado y Retroceso se deducen en este mismo `useTick` comparando la
 * unidad con el fotograma anterior (`updateUnitEvents`) y se componen con el reposo/ataque (`getUnitEventPose`). El
 * destello asigna un filtro compartido al cuerpo solo cuando cambia; el anillo solo sigue el deslizamiento y la aparición.
 */
export function UnitSprite({ instanceId, catId, team }: UnitSpriteProps) {
  const { app } = useApplication()
  const containerRef = useRef<Container>(null)
  const ringRef = useRef<Graphics>(null)
  const spriteRef = useRef<AnimatedSprite>(null)
  // Offset aleatorio por instancia para que el bob de idle de varias unidades no quede sincronizado.
  const clockRef = useRef(Math.random() * 10)
  const activeFolderRef = useRef<'idle' | 'attack' | null>(null)
  // specs/044: rastreador de eventos (estado efímero de render, nunca en el store) y cuerpo que recibe el destello.
  const eventsRef = useRef(createUnitEventState())
  const bodySpriteRef = useRef<Sprite>(null)
  const flashingRef = useRef(false)

  // specs/010-evolucion-de-gatos (FR-009): el perfil visual se deriva de los stats efectivos
  // del BattleUnit ya desplegado (maxHp/damage ya incluyen el multiplicador de evolución
  // aplicado una sola vez en deployUnit), no de un lookup estático de Cat por catId. Estos
  // campos no cambian tras el spawn, así que se calculan una sola vez, igual que antes.
  const profile = useMemo(() => {
    const unit = useGameStore.getState().units.find((candidate) => candidate.instanceId === instanceId)
    if (!unit) return null
    return getVisualProfile({
      width: unit.width,
      hp: unit.maxHp,
      speed: unit.speed,
      damage: unit.damage,
      attackIntervalSeconds: unit.attackIntervalSeconds,
    })
  }, [instanceId])

  const animationSet = useMemo(() => {
    const cat = CATS.find((candidate) => candidate.id === catId)
    return resolveSpriteAnimationSet(cat?.spriteKey)
  }, [catId])

  const [textures, setTextures] = useState<LoadedTextures | null>(null)

  // specs/042 (research.md Decisión 1): un único resolvedor para catálogo semilla, Capítulo 1 y el registro
  // de las 28 unidades que antes no tenían diseño (incluidos los respaldos de las 12 con sprite).
  const proceduralDesign = useMemo(() => resolveUnitDesign(catId), [catId])

  const proceduralTexture = useMemo(() => {
    if (textures || !proceduralDesign || !app?.renderer) return null
    return getOrCreateUnitTexture(app.renderer, catId, proceduralDesign, team === 'Player' ? 'ally' : 'enemy')
  }, [textures, proceduralDesign, app, catId, team])

  useEffect(() => {
    if (animationSet || proceduralDesign || reportedMissingDesigns.has(catId)) return
    reportedMissingDesigns.add(catId)
    console.error(`[specs/042] La unidad "${catId}" no tiene sprite ni diseño: se dibuja sin cuerpo (revisa src/data/unitDesigns.ts).`)
  }, [animationSet, proceduralDesign, catId])

  useEffect(() => {
    if (!animationSet) {
      setTextures(null)
      return
    }
    let cancelled = false
    Promise.all([loadSpriteTextures(animationSet.idle), loadSpriteTextures(animationSet.attack)])
      .then(([idle, attack]) => {
        if (!cancelled) setTextures({ idle, attack })
      })
      .catch(() => {
        // Edge case de spec.md: carga fallida en runtime degrada al diseño cartoon de respaldo (specs/042 FR-004).
        if (!cancelled) setTextures(null)
      })
    return () => {
      cancelled = true
    }
  }, [animationSet])

  // specs/029-pulido-batalla-hud (US3): barra de HP redibujada imperativamente, solo cuando la
  // fracción cambia más allá de HP_BAR_REDRAW_THRESHOLD (mismo patrón que BaseTower.tsx).
  const hpBarRef = useRef<Graphics>(null)
  const lastDrawnHpFractionRef = useRef(-1)

  // La barra de HP se dibuja imperativamente por ref en el useTick de abajo (solo cuando cambia la
  // fracción) — este `draw` inicial solo deja el Graphics listo para recibir esas llamadas.
  const drawHpBarPlaceholder = useCallback((g: Graphics) => g.clear(), [])

  // specs/042 (US2): geometría fija del anillo, dibujada una sola vez — por fotograma solo cambia su posición.
  const drawRing = useCallback(
    (g: Graphics) => {
      if (!profile) return
      drawTeamRing(g, computeTeamRingGeometry(profile.bodyWidth), team)
    },
    [profile, team],
  )

  useTick(({ deltaMS }) => {
    const container = containerRef.current
    if (!profile || !container) return

    const store = useGameStore.getState()
    const unit = store.units.find((candidate) => candidate.instanceId === instanceId)
    if (!unit) return

    clockRef.current += deltaMS / 1000

    const animationState = getAnimationState(unit.state)
    const basePose = getAnimationPose(animationState, profile, clockRef.current, unit.attackCooldownRemaining)

    // specs/021-reskin-cyber-modern: unit.x vive en coordenadas del carril de simulación
    // (src/engine/simulation.ts, típicamente [0, laneLength]) — se mapea a píxeles de pantalla
    // recién aquí, en la capa de render, nunca en el motor (Constitución § IV/VI).
    const laneX = getLaneScreenX(unit.x, store.laneLength, app.screen.width)
    const laneY = getLaneScreenY(app.screen.height)

    // specs/044: eventos deducidos de la unidad fresca y compuestos con el reposo/ataque.
    const reduced = prefersReducedMotion()
    const events = eventsRef.current
    updateUnitEvents(
      events,
      { x: unit.x, screenX: laneX, hp: unit.hp, shield: unit.shieldRemainingHp ?? 0, team: unit.team },
      deltaMS / 1000,
      reduced,
    )
    const pose = getUnitEventPose(events, basePose, unit.team, reduced)

    container.x = laneX + pose.offsetX
    container.y = laneY + pose.offsetY
    container.scale.set(pose.scaleX, pose.scaleY)
    container.rotation = pose.rotation
    container.alpha = pose.alpha

    // specs/042 (US2/FR-008): el anillo queda en el suelo — sin rebote, aplastamiento, sacudida ni giro. specs/044:
    // acompaña el deslizamiento del retroceso y surge con la aparición.
    if (ringRef.current) {
      ringRef.current.x = laneX + pose.ringOffsetX
      ringRef.current.y = laneY
      ringRef.current.alpha = pose.ringAlpha
    }

    // specs/044 (US1): el filtro compartido solo se asigna o se quita al empezar o terminar el destello.
    const body = spriteRef.current ?? bodySpriteRef.current
    if (body && pose.flash !== flashingRef.current) {
      flashingRef.current = pose.flash
      body.filters = pose.flash ? [getHitFlashFilter()] : null
    }

    // specs/021-reskin-cyber-modern (US4): intercambio de arreglo de texturas por mutación directa,
    // solo en las transiciones de estado — nunca redisparado por prop/re-render (research.md Decisión 2).
    if (textures && spriteRef.current) {
      const folder = ANIMATION_STATE_TO_SPRITE_FOLDER[animationState]
      if (activeFolderRef.current !== folder) {
        activeFolderRef.current = folder
        spriteRef.current.textures = textures[folder]
        spriteRef.current.play()
      }
    }

    // specs/029-pulido-batalla-hud (US3): HP individual, redibujado solo cuando cambia perceptiblemente.
    if (hpBarRef.current) {
      const fraction = getHpFraction(unit.hp, unit.maxHp)
      if (Math.abs(fraction - lastDrawnHpFractionRef.current) > HP_BAR_REDRAW_THRESHOLD) {
        lastDrawnHpFractionRef.current = fraction
        drawUnitHpBar(hpBarRef.current, profile, team, fraction)
      }
    }
  })

  if (!profile) return null

  return (
    <>
      <pixiGraphics ref={ringRef} draw={drawRing} />
      <pixiContainer ref={containerRef} pivot={{ x: 0, y: profile.bodyHeight }}>
        {textures ? (
          <pixiAnimatedSprite
            ref={spriteRef}
            textures={textures.idle}
            width={profile.bodyWidth}
            height={profile.bodyHeight}
            anchor={{ x: team === 'Enemy' ? 1 : 0, y: 0 }}
            // specs/021-reskin-cyber-modern (FR-010): la unidad enemiga se dibuja en espejo — flip
            // local al sprite, sin tocar el transform del Container (bob/squash ya aplicado arriba).
            scale={{ x: team === 'Enemy' ? -1 : 1, y: 1 }}
            animationSpeed={SPRITE_ANIMATION_SPEED}
            loop
            autoPlay
          />
        ) : proceduralTexture ? (
          // specs/022 (US2) / specs/042: textura cartoon cacheada del diseño — misma convención de anchor/scale
          // que el sprite real, sin animación de frames propia (el bob/squash del useTick de arriba sigue aplicando).
          <pixiSprite
            ref={bodySpriteRef}
            texture={proceduralTexture}
            width={profile.bodyWidth}
            height={profile.bodyHeight}
            anchor={{ x: team === 'Enemy' ? 1 : 0, y: 0 }}
            scale={{ x: team === 'Enemy' ? -1 : 1, y: 1 }}
          />
        ) : null}
        <pixiGraphics ref={hpBarRef} draw={drawHpBarPlaceholder} />
      </pixiContainer>
    </>
  )
}
