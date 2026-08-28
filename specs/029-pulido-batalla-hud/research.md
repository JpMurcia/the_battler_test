# Research: Pulido de Batalla y HUD

## Decisión 1 — Patrón de re-render para HUD reactivo (cañón, velocidad, pausa)

**Decision**: Los controles de cañón especial y velocidad/pausa se implementan como componentes React normales que suscriben campos de `useGameStore` vía selectores acotados (`useGameStore((state) => state.specialCannon)`, etc.), exactamente igual que `EnergyReadout`/`PlayerBaseReadout`/`EnemyBaseReadout` ya hacen hoy en `BattleScreen.tsx`.

**Rationale**: `EnergyReadout` ya suscribe `state.energy` (que muta en cada `tick()`, 60 veces por segundo) y re-renderiza en cada frame sin que el proyecto lo considere una violación — es un patrón ya validado y en producción desde `specs/002`. La lectura estricta de la Constitución § VI ("ningún componente de React vuelve a renderizar en el tick de 60fps") aplica al **campo de batalla renderizado por Pixi** (unidades/bases, donde si un componente React se re-montara 60 veces por segundo el costo de reconciliación sería alto) — no a chips de HUD baratos (texto + una barra de progreso) fuera del `<Application>` de Pixi. Mantener esta distinción evita inventar un mecanismo nuevo (rAF + refs) solo para estos 3 controles cuando el resto del HUD de batalla ya resuelve el mismo problema con selectores de Zustand.

**Alternatives considered**: Un hook `useAnimationFrame` que lea `useGameStore.getState()` por ref y mute el DOM directamente (mismo patrón que `UnitSprite`/`BaseTower` usan para Pixi). Rechazado por sobre-ingeniería: introduciría un mecanismo nuevo no usado en ningún otro HUD de batalla existente, para un beneficio de rendimiento no medido ni pedido por la spec.

## Decisión 2 — Dónde vive el estado de velocidad/pausa

**Decision**: `speedMultiplier: number` (1 o 2) y `paused: boolean` se agregan a `GameFields` en `useGameStore.ts`, junto al resto del estado efímero de partida (`IDLE_STATE`), reseteados en `startLevel()` y `reset()`.

**Rationale**: Es estado de partida en curso — nunca se persiste (Constitución § V), se resetea con cada nivel nuevo, y ya existe el precedente de `unitSpeedMultiplier` (specs/017, objeto de batalla "Aceleración de Velocidad") como campo hermano en la misma interfaz. `speedMultiplier` (control manual del jugador) es conceptualmente distinto de `unitSpeedMultiplier` (efecto de un objeto de batalla ya consumido) y no debe combinarse con él para no acoplar dos features independientes.

**Alternatives considered**: Un store de UI efímero separado (`useBattleUiStore`). Rechazado — no hay ningún otro precedente de un segundo store para UI de batalla en el proyecto; añadiría un archivo nuevo por 2 campos booleans/numéricos sin necesidad.

## Decisión 3 — Cómo se aplica la velocidad/pausa al tick

**Decision**: En el `useTick` de `BattleField` (`BattleStage.tsx`), antes de llamar a `store.tick(deltaSeconds)`:
```
if (store.paused) return
store.tick(deltaSeconds * store.speedMultiplier)
```

**Rationale**: `stepSimulation` ya es puro y determinista en función de `deltaSeconds` (Constitución § VI) — escalar el `deltaSeconds` de entrada reutiliza exactamente esa garantía sin tocar `src/engine/`. Pausar simplemente se salta la llamada a `tick()` ese frame; todo el resto (Pixi, animaciones idle) sigue renderizando con normalidad (las unidades no se "congelan" visualmente de forma abrupta a mitad de una animación, que es el comportamiento esperado en cualquier caso).

**Alternatives considered**: Ejecutar `stepSimulation` dos veces por frame para x2 (en vez de escalar `deltaSeconds`). Rechazado — duplicar llamadas cambia el número de evaluaciones de cooldown/colisión por segundo real de forma distinta a duplicar el tiempo simulado, con mayor riesgo de introducir diferencias de comportamiento sutil entre x1 y x2 (viola SC-002/FR-010, que exigen resultado idéntico).

## Decisión 4 — Dónde y cómo se dibuja la barra de HP por unidad

**Decision**: Se añade una capa `Graphics` adicional al `pixiContainer` de `UnitSprite.tsx` (hermana de `drawBody`/`visorRef`/`thrusterRef`), redibujada imperativamente dentro del `useTick` ya existente de `UnitSprite`, solo cuando la fracción de HP cambia más allá de un umbral — mismo patrón exacto que `BaseTower.tsx` ya usa para la barra de HP de base (`drawBaseTowerHpBar`, `HP_BAR_REDRAW_THRESHOLD`).

**Rationale**: Es el patrón ya validado en el propio repo para "barra de HP dibujada en Pixi sin re-render de React" — reutilizarlo evita divergencia de estilo y respeta la Constitución § VI (el `useTick` de `UnitSprite` ya lee `unit` fresco de `useGameStore.getState()` cada frame, sin pasar por props/reconciliación de React). Se extrae una función `drawUnitHpBar` a un módulo de gráficos (mismo patrón que `drawBaseTowerHpBar` en `src/game/graphics/baseTower.ts`), consumida tanto por `UnitSprite` como, si aplica, reutilizando el helper `getHpFraction` ya existente.

**Alternatives considered**: Barra de HP como overlay HTML posicionado por `left`/`top` calculado en cada tick. Rechazado — requeriría un elemento DOM por unidad activa (hasta 6 aliadas + N enemigas simultáneas) sincronizado a mano con las coordenadas de pantalla que Pixi ya calcula internamente (`getLaneScreenX`/`getLaneScreenY`), duplicando trabajo que Pixi ya resuelve mejor al vivir en el mismo `Container` que el sprite.

## Decisión 5 — Cómo se expone el temporizador de regeneración de energía

**Decision**: `MissionEnergyState` (en `useMetaStore.ts`) se extiende con `regenPerSecond: number` y `lastUpdatedAt: number`, poblados desde el mismo cálculo que `hydrate()`/`consumeMissionEnergy()` ya hacen hoy (`computeRegenPerSecond`, y el `now`/`lastUpdatedAt` que ya se escribe en Dexie). Un componente `EnergyRegenTimer` en `HubScreen.tsx` lee esos 3 campos (`current`, `max`, `regenPerSecond`, `lastUpdatedAt`) más `Date.now()`, y usa un `useEffect` con `setInterval(1000)` **local al componente** (no al store global) para forzar su propio re-render una vez por segundo y recalcular el countdown — nunca escribe de vuelta al store ni a Dexie desde este componente (esta spec no cambia cómo se calcula ni se persiste la regeneración, solo cómo se muestra).

**Rationale**: Reutiliza el cálculo ya validado en `missionEnergy.ts` sin duplicar lógica de negocio en la capa de presentación; un `setInterval` local de 1s es más que suficiente para un contador de mm:ss (no necesita 60fps) y no añade carga al store global ni a otros componentes que no muestran el temporizador.

**Alternatives considered**: Recalcular energía en tiempo real en cada tick de batalla. No aplica — el Hub no tiene ticker de Pixi corriendo (solo `BattleScreen` lo tiene); un `setInterval` de UI es el mecanismo estándar ya usado en apps React para countdowns fuera del bucle de combate.

## Decisión 6 — Persistencia del toggle de filas

**Decision**: Estado local de componente (`useState` en `BattleScreen.tsx`), no persistido — se resetea a "1 fila" cada vez que se entra a una batalla nueva, consistente con la Assumption de `spec.md`.

**Rationale**: Es la interpretación más simple compatible con FR-009/Assumptions; no hay ninguna señal en el mockup ni en el manual de que esta preferencia deba sobrevivir entre partidas, y añadir un campo a `useMetaStore`/Dexie por una preferencia visual de bajo impacto no se justifica sin pedido explícito (Principio VII, Simplicidad desde el MVP).

**Alternatives considered**: Persistir en `useMetaStore.settings` (mismo lugar que música/idioma). Se deja como posible mejora futura, no bloqueante — puede añadirse después sin romper esta spec si el usuario lo pide.
