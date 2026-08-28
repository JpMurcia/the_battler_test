# Research: Festival de Tesoros

## Decisión 1 — Catálogo de datos puro, reutilizando `EventTimeWindow`

**Decision**: `src/data/treasureFestival.ts` exporta `TreasureFestival` (`id`, `name`, `currencyMultiplier`, `timeWindows: EventTimeWindow[]`), un catálogo `TREASURE_FESTIVALS: TreasureFestival[]`, y `getActiveTreasureFestival(nowMs)`/`getFestivalTimeRemainingMs(festival, nowMs)`, importando `EventTimeWindow` de `./events` en vez de redeclararlo.

**Rationale**: Mismo tipo y misma lógica de "ventana activa" que `isEventActive` (specs/014) — reutilizar evita divergencia entre 2 sistemas de ventanas de tiempo casi idénticos. No se reutiliza `EventBanner` en sí porque este festival no tiene `specialStage` (no añade un nivel jugable nuevo, a diferencia del banner de evento).

## Decisión 2 — El efecto se resuelve donde ya se resuelven los otros 3 multiplicadores de moneda

**Decision**: `BattleOutcomeWatcher` (`BattleScreen.tsx`) añade un 4º factor: `(getActiveTreasureFestival(Date.now())?.currencyMultiplier ?? 1)`, junto a `getActiveBonusMultiplier`/`getActiveComboBonusMultiplier`/`getBaseUpgradeCurrencyMultiplier` (specs/013/025/031).

**Rationale**: El festival no depende de ningún progreso de jugador (a diferencia de los otros 3, que sí) — es una función pura de `Date.now()`, así que no necesita pasar por `useMetaStore` como getter de store; se llama directamente desde `src/data/treasureFestival.ts` en el mismo punto donde ya se combinan los demás factores. FR-005 exige el multiplicador vigente "en el momento de otorgar la recompensa" — leer `Date.now()` en `BattleOutcomeWatcher` (que corre en la transición a `Victory`, no al iniciar la batalla) ya satisface esto sin lógica adicional.

## Decisión 3 — Countdown del banner: mismo patrón que `EnergyRegenTimer` (specs/029)

**Decision**: Un componente `TreasureFestivalBanner` en `LevelSelectScreen.tsx` usa `useEffect` + `setInterval(1000)` local para re-renderizar cada segundo, recalculando `getActiveTreasureFestival(Date.now())` en cada tick; si no hay festival activo, retorna `null`.

**Rationale**: Ya validado en `specs/029-pulido-batalla-hud` (`EnergyRegenTimer`) para el mismo tipo de countdown de UI — reutilizar el patrón evita inventar un mecanismo nuevo.

**Alternatives considered**: Un `setInterval` global en el store. Rechazado — el store no debe tener temporizadores propios (ninguna otra spec lo hace); un countdown de UI es responsabilidad del componente que lo muestra.
