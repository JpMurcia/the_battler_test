import { Application, extend, useTick } from '@pixi/react'
import { Assets, Sprite, Texture } from 'pixi.js'
import { useEffect, useRef, useState } from 'react'

extend({ Sprite })

const SPRITE_PATH = '/sprites/cat-placeholder.png'
const SPEED_PX_PER_SECOND = 80
const TRACK_WIDTH = 400

function TestSprite() {
  const [texture, setTexture] = useState(Texture.EMPTY)
  const spriteRef = useRef<Sprite>(null)

  useEffect(() => {
    let cancelled = false
    void Assets.load(SPRITE_PATH).then((loaded: Texture) => {
      if (!cancelled) setTexture(loaded)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useTick(({ deltaTime }) => {
    const sprite = spriteRef.current
    if (!sprite) return
    sprite.x += (SPEED_PX_PER_SECOND * deltaTime) / 60
    if (sprite.x > TRACK_WIDTH) sprite.x = 0
  })

  return <pixiSprite ref={spriteRef} texture={texture} x={0} y={100} />
}

export function BattleStage() {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div ref={containerRef} className="battle-stage">
      <Application resizeTo={containerRef} backgroundColor={0x1a1a2e}>
        <TestSprite />
      </Application>
    </div>
  )
}
