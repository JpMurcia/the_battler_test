import { Application, useTick } from '@pixi/react'
import { useRef, useState } from 'react'
import type { BattleUnit } from '../engine/types'
import { useGameStore } from '../state/useGameStore'
import { UnitSprite } from './UnitSprite'

function BattleField() {
  const [units, setUnits] = useState<BattleUnit[]>(() => useGameStore.getState().units)

  useTick(({ deltaTime }) => {
    const deltaSeconds = deltaTime / 60
    useGameStore.getState().tick(deltaSeconds)
    setUnits(useGameStore.getState().units)
  })

  return (
    <>
      {units.map((unit) => (
        <UnitSprite key={unit.instanceId} unit={unit} />
      ))}
    </>
  )
}

export function BattleStage() {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div ref={containerRef} className="battle-stage">
      <Application resizeTo={containerRef} backgroundColor={0x1a1a2e}>
        <BattleField />
      </Application>
    </div>
  )
}
