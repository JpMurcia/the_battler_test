import { extend, useApplication, useTick } from '@pixi/react'
import { AnimatedSprite, Container, Graphics, Sprite, type Texture } from 'pixi.js'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CATS } from '../data/cats'
import { SEED_ENEMIES, SEED_UNITS } from '../data/seedData'
import type { BattleUnit } from '../engine/types'
import { getOrCreateUnitTexture } from './graphics/unitFactory'
import { useGameStore } from '../state/useGameStore'
import { ANIMATION_STATE_TO_SPRITE_FOLDER, getAnimationPose, getAnimationState, getVisualProfile } from './animation'
import { loadSpriteTextures, resolveSpriteAnimationSet } from './spriteAssets'

extend({ Container, Graphics, AnimatedSprite, Sprite })

// specs/021-reskin-cyber-modern (research.md Decisión 4): colores de equipo del catálogo de tema (cian/rojo).
const TEAM_COLOR: Record<BattleUnit['team'], number> = {
  Player: 0x22d3ee, // cian
  Enemy: 0xef4444, // rojo
}

const GLOW_RING_COUNT = 3
const GLOW_RING_STEP_PX = 4
const SPRITE_ANIMATION_SPEED = 0.3

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

  const drawBody = useCallback(
    (g: Graphics) => {
      if (!profile) return
      g.clear()
      // Anillo de resplandor por equipo — trazos concéntricos de alpha decreciente, sin paquete de
      // filtros (specs/021-reskin-cyber-modern research.md Decisión 4).
      for (let ring = GLOW_RING_COUNT; ring >= 1; ring -= 1) {
        const expand = ring * GLOW_RING_STEP_PX
        g.roundRect(
          -expand,
          -expand,
          profile.bodyWidth + expand * 2,
          profile.bodyHeight + expand * 2,
          profile.cornerRadius + expand,
        ).stroke({ width: 2, color: TEAM_COLOR[team], alpha: 0.16 / ring })
      }
      g.roundRect(0, 0, profile.bodyWidth, profile.bodyHeight, profile.cornerRadius)
        .fill(TEAM_COLOR[team])
        .roundRect(0, profile.bodyHeight * 0.62, profile.bodyWidth, profile.bodyHeight * 0.38, profile.cornerRadius)
        .fill(profile.accentColor)
    },
    [profile, team],
  )

  useTick(({ deltaMS }) => {
    const container = containerRef.current
    if (!profile || !container) return

    const unit = useGameStore.getState().units.find((candidate) => candidate.instanceId === instanceId)
    if (!unit) return

    clockRef.current += deltaMS / 1000

    const animationState = getAnimationState(unit.state)
    const pose = getAnimationPose(animationState, profile, clockRef.current, unit.attackCooldownRemaining)

    container.x = unit.x
    container.y = pose.bobOffsetY
    container.scale.set(pose.scaleX, pose.scaleY)
    container.rotation = pose.rotationRadians

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
        <pixiGraphics draw={drawBody} />
      )}
    </pixiContainer>
  )
}
