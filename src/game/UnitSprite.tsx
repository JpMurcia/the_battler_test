import { extend, useApplication, useTick } from '@pixi/react'
import { AnimatedSprite, Container, Graphics, Sprite, type Texture } from 'pixi.js'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CATS } from '../data/cats'
import { SEED_ENEMIES, SEED_UNITS } from '../data/seedData'
import type { BattleUnit } from '../engine/types'
import { getOrCreateUnitTexture } from './graphics/unitFactory'
import { computeCyberBodyLayout, drawCyberBodyBase, drawCyberThruster, drawCyberVisor, getGlowPulseAlpha } from './graphics/cyberUnitBody'
import { getLaneScreenX, getLaneScreenY } from './graphics/layout'
import { useGameStore } from '../state/useGameStore'
import { ANIMATION_STATE_TO_SPRITE_FOLDER, getAnimationPose, getAnimationState, getVisualProfile } from './animation'
import { loadSpriteTextures, resolveSpriteAnimationSet } from './spriteAssets'

extend({ Container, Graphics, AnimatedSprite, Sprite })

const SPRITE_ANIMATION_SPEED = 0.3
const VISOR_PULSE_HZ = 1.8
const THRUSTER_PULSE_HZ = 6

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
 * el cuerpo se reemplaza por un `AnimatedSprite` real (reposo/ataque) — el intercambio de arreglo de
 * texturas ocurre dentro del mismo `useTick`, nunca por prop/re-render (research.md Decisión 2). Si no
 * hay `spriteKey`, o si la carga falla, se conserva el `Graphics` placeholder de siempre (FR-011).
 */
export function UnitSprite({ instanceId, catId, team }: UnitSpriteProps) {
  const { app } = useApplication()
  const containerRef = useRef<Container>(null)
  const spriteRef = useRef<AnimatedSprite>(null)
  // Offset aleatorio por instancia para que el bob de idle de varias unidades no quede sincronizado.
  const clockRef = useRef(Math.random() * 10)
  const activeFolderRef = useRef<'idle' | 'attack' | null>(null)

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

  // specs/022-datos-semilla-flujo-navegacion (US2): tercer nivel de fallback — unidades del catálogo
  // semilla (sin spriteKey) resuelven aquí por id y aportan su ProceduralDesign.
  const seedUnit = useMemo(
    () => SEED_UNITS.find((unit) => unit.id === catId) ?? SEED_ENEMIES.find((unit) => unit.id === catId),
    [catId],
  )

  const proceduralTexture = useMemo(() => {
    if (textures || !seedUnit || !app?.renderer) return null
    return getOrCreateUnitTexture(app.renderer, seedUnit.id, seedUnit.proceduralDesign, team === 'Player' ? 'ally' : 'enemy')
  }, [textures, seedUnit, app, team])

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
        // Edge case de spec.md: carga fallida en runtime degrada al mismo fallback que "sin spriteKey".
        if (!cancelled) setTextures(null)
      })
    return () => {
      cancelled = true
    }
  }, [animationSet])

  // specs/021-reskin-cyber-modern (rediseño Cyber-Modern): geometría del cuerpo placeholder derivada
  // una sola vez del profile — compartida entre las 3 capas Graphics de abajo (cuerpo, visor, propulsor).
  const bodyLayout = useMemo(() => (profile ? computeCyberBodyLayout(profile) : null), [profile])

  const visorRef = useRef<Graphics>(null)
  const thrusterRef = useRef<Graphics>(null)

  const drawBody = useCallback(
    (g: Graphics) => {
      if (!profile || !bodyLayout) return
      drawCyberBodyBase(g, bodyLayout, team, profile.accentColor)
    },
    [profile, bodyLayout, team],
  )

  // Geometría fija dibujada una sola vez — el brillo/parpadeo se anima después por `.alpha` en useTick,
  // nunca redibujando (Constitución § VI: nada se recalcula por frame más allá de transforms/alpha).
  const drawVisorLayer = useCallback(
    (g: Graphics) => {
      if (!bodyLayout) return
      drawCyberVisor(g, bodyLayout, team)
    },
    [bodyLayout, team],
  )

  const drawThrusterLayer = useCallback(
    (g: Graphics) => {
      if (!bodyLayout) return
      drawCyberThruster(g, bodyLayout, team)
    },
    [bodyLayout, team],
  )

  useTick(({ deltaMS }) => {
    const container = containerRef.current
    if (!profile || !container) return

    const store = useGameStore.getState()
    const unit = store.units.find((candidate) => candidate.instanceId === instanceId)
    if (!unit) return

    clockRef.current += deltaMS / 1000

    const animationState = getAnimationState(unit.state)
    const pose = getAnimationPose(animationState, profile, clockRef.current, unit.attackCooldownRemaining)

    // specs/021-reskin-cyber-modern: unit.x vive en coordenadas del carril de simulación
    // (src/engine/simulation.ts, típicamente [0, laneLength]) — se mapea a píxeles de pantalla
    // recién aquí, en la capa de render, nunca en el motor (Constitución § IV/VI).
    const laneX = getLaneScreenX(unit.x, store.laneLength, app.screen.width)
    const laneY = getLaneScreenY(app.screen.height)

    container.x = laneX
    container.y = laneY + pose.bobOffsetY
    container.scale.set(pose.scaleX, pose.scaleY)
    container.rotation = pose.rotationRadians

    // "Ojos animados": pulso de brillo neón continuo en el visor holográfico — mismo Graphics
    // estático de siempre, solo se modula alpha (specs/021 punto "detalles neón/ojos animados").
    if (visorRef.current) visorRef.current.alpha = getGlowPulseAlpha(clockRef.current, VISOR_PULSE_HZ, 0.55, 1)
    // Propulsor: parpadeo rápido, más brillante mientras la unidad avanza ('Moving') que mientras
    // combate detenida ('Engaged') — refuerza la lectura de "en movimiento" (specs/021 "propulsores").
    if (thrusterRef.current) {
      const [min, max] = unit.state === 'Moving' ? [0.6, 1] : [0.25, 0.55]
      thrusterRef.current.alpha = getGlowPulseAlpha(clockRef.current, THRUSTER_PULSE_HZ, min, max)
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
  })

  if (!profile) return null

  return (
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
        // specs/022-datos-semilla-flujo-navegacion (US2): textura procedimental cacheada del catálogo
        // semilla — misma convención de anchor/scale que el sprite real, sin animación de frames propia
        // (el bob/squash del useTick de arriba sigue aplicando, igual que al Graphics de stats).
        <pixiSprite
          texture={proceduralTexture}
          width={profile.bodyWidth}
          height={profile.bodyHeight}
          anchor={{ x: team === 'Enemy' ? 1 : 0, y: 0 }}
          scale={{ x: team === 'Enemy' ? -1 : 1, y: 1 }}
        />
      ) : (
        <>
          <pixiGraphics draw={drawBody} />
          <pixiGraphics ref={visorRef} draw={drawVisorLayer} />
          <pixiGraphics ref={thrusterRef} draw={drawThrusterLayer} />
        </>
      )}
    </pixiContainer>
  )
}
