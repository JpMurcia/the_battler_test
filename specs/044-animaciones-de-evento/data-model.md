# Data Model: Animaciones de Evento

Nada se persiste. Todas las entidades son estado efímero de render en `src/game/eventAnimations.ts`. `p = clamp(elapsed / duración, 0, 1)`; `backDir = team === 'Player' ? -1 : 1`.

## 1. Constantes (`EVENT_ANIMATION`)

| Clave | Valor |
|---|---|
| `hitSeconds` | 0,15 |
| `hitFlashSeconds` | 0,08 |
| `hitMinIntervalSeconds` | 1/3 |
| `hitShakePx` | 1,5 |
| `spawnSeconds` | 0,3 |
| `knockbackSeconds` | 0,25 |
| `knockbackHopPx` | 4 |
| `knockbackTiltRadians` | 0,17 |
| `deathSeconds` | 0,45 |
| `deathDriftPx` / `deathHopPx` / `deathSpinRadians` | 12 / 12 / 1,2 |
| `maxRotationRadians` | 0,2 |
| `hpEpsilon` / `xEpsilon` | 0,01 / 0,01 |

## 2. Poses por evento (funciones puras)

**`getHitPose(elapsed)`** → `{ offsetX, flash }`
- `offsetX = hitShakePx · sin(6πp) · (1 − p)`; `flash = elapsed < hitFlashSeconds`. En `p = 1`: `{0, false}`.

**`getSpawnPose(elapsed, reduced)`** → `{ offsetY, scaleX, scaleY, alpha }`
- `c = (1 − p)³`, `s = sin(πp)`; `scaleX = 1 + 0,3c − 0,08s`; `scaleY = 1 − 0,35c + 0,12s`; `offsetY = −6s`; `alpha = min(1, p / 0,4)`.
- Reducido: escala 1, `offsetY 0`, `alpha = p`. En `p = 1`: `{0, 1, 1, 1}`.

**`getKnockbackPose(elapsed, startOffsetPx, team)`** → `{ offsetX, offsetY, rotation }`
- `e = 1 − (1 − p)²`; `offsetX = startOffsetPx · (1 − e)`; `offsetY = −4 · sin(πp)`; `rotation = backDir · 0,17 · sin(πp)`. En `p = 1`: ceros.

**`getDeathPose(elapsed, team, reduced)`** → `{ offsetX, offsetY, rotation, alpha }`
- `offsetX = backDir · 12p`; `offsetY = −12 · sin(πp)`; `rotation = backDir · 1,2p`; `alpha = 1 − p²`.
- Reducido: desplazamientos y giro 0, `alpha = 1 − p`.

## 3. Rastreador por unidad (`UnitEventState`, mutable)

| Campo | Tipo | Inicial |
|---|---|---|
| `spawnElapsed` | `number \| null` | `0` |
| `hitElapsed` | `number \| null` | `null` |
| `sinceHitStart` | `number` | `∞` |
| `knockback` | `{ elapsed, startOffsetPx } \| null` | `null` |
| `lastX` / `lastScreenX` | `number \| null` | `null` |
| `lastHp` / `lastShield` | `number \| null` | `null` |

**`updateUnitEvents(state, obs, deltaSeconds, reduced)`** con `obs = { x, screenX, hp, shield, team }`:
1. Avanza los temporizadores activos; el que alcanza su duración pasa a `null`. `sinceHitStart += delta`.
2. Si hay observación previa:
   - **Golpe**: `lastHp − hp > ε` o `lastShield − shield > ε`, y `!reduced`, y `sinceHitStart ≥ 1/3` → `hitElapsed = 0`, `sinceHitStart = 0`.
   - **Empujón**: jugador `x < lastX − ε` o enemigo `x > lastX + ε`, y `!reduced` → `startOffsetPx = (lastScreenX + offsetX actual del retroceso) − screenX`; `knockback = { elapsed: 0, startOffsetPx }`.
3. Guarda `x`, `screenX`, `hp`, `shield`.

## 4. Composición (`getUnitEventPose(state, base, team, reduced)`)

Entrada: la `AnimationPose` actual (`bobOffsetY`, `scaleX`, `scaleY`, `rotationRadians`).

| Salida | Fórmula |
|---|---|
| `offsetX` | sacudida + `knockback.offsetX` |
| `offsetY` | `base.bobOffsetY + spawn.offsetY + knockback.offsetY` |
| `scaleX/Y` | `base.scale × spawn.scale` |
| `rotation` | `clamp(base.rotation + knockback.rotation, ±0,2)` |
| `alpha` | `spawn.alpha` (1 sin aparición) |
| `flash` | `hit.flash` |
| `ringOffsetX` | `knockback.offsetX` |
| `ringAlpha` | `spawn.alpha` |

Sin eventos activos el resultado es exactamente la pose base con `alpha 1`, `flash false` y desplazamientos 0 (FR-006).

## 5. Filtro de destello (`src/game/graphics/hitFlash.ts`)

`HIT_FLASH_MATRIX` (4×5): diagonal RGB 0,35, desplazamiento RGB 0,65, alfa 1. `getHitFlashFilter()` crea una única `ColorMatrixFilter` la primera vez.
