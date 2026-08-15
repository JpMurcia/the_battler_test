import { Application, useTick } from '@pixi/react'
import { useRef, useState } from 'react'
import type { BattleUnit } from '../engine/types'
import { useGameStore } from '../state/useGameStore'
import { UnitSprite } from './UnitSprite'

interface ActiveUnitRef {
  instanceId: string
  catId: string
  team: BattleUnit['team']
}

function sameActiveUnits(a: ActiveUnitRef[], b: ActiveUnitRef[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 1) {
    if (a[i].instanceId !== b[i].instanceId) return false
  }
  return true
}

function BattleField() {
  // Solo mount/unmount de UnitSprite dispara re-render — nunca la posición/animación por frame
  // (specs/003-identidad-visual-animada/research.md Decisión 3, Constitución § VI).
  const activeRef = useRef<ActiveUnitRef[]>([])
  const [activeUnits, setActiveUnits] = useState<ActiveUnitRef[]>([])

  useTick(({ deltaTime }) => {
    const deltaSeconds = deltaTime / 60
    useGameStore.getState().tick(deltaSeconds)

    const nextActiveUnits = useGameStore
      .getState()
      .units.map((unit) => ({ instanceId: unit.instanceId, catId: unit.catId, team: unit.team }))

    if (!sameActiveUnits(activeRef.current, nextActiveUnits)) {
      activeRef.current = nextActiveUnits
      setActiveUnits(nextActiveUnits)
    }
  })

  return (
    <>
      {activeUnits.map((unit) => (
        <UnitSprite key={unit.instanceId} instanceId={unit.instanceId} catId={unit.catId} team={unit.team} />
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
