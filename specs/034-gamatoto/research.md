# Research: Gamatoto

## Decisión 1 — Catálogo puro + expedición como registro de timestamp, no de contador

**Decision**: `src/data/gamatoto.ts` exporta `GamatotoExpeditionOption` (id, name, durationMs, materialsReward) y `GAMATOTO_EXPEDITION_OPTIONS: GamatotoExpeditionOption[]` (3 entradas). El estado de expedición activa vive en `useMetaStore` como `gamatotoExpedition: { optionId: string; startedAtMs: number } | null` — **sin** un campo `remainingMs` persistido (se deriva siempre de `Date.now() - startedAtMs`, nunca se guarda un valor que quede desactualizado).

**Rationale**: Guardar un `remainingMs` estático se desincronizaría en cuanto pasa tiempo real — el patrón correcto para "avanza con la app cerrada" es persistir el momento de inicio y derivar el progreso en cada lectura, igual que `missionEnergy.lastUpdatedAt` (specs/007/029) ya hace para energía continua. Aquí se aplica el mismo principio a un evento de un solo disparo (completo/no completo) en vez de un recurso que se acumula gradualmente.

## Decisión 2 — Funciones puras de progreso, testeables con `nowMs` inyectado

**Decision**: `src/data/gamatoto.ts` también exporta:
```ts
function getExpeditionRemainingMs(expedition, option, nowMs): number // Math.max(0, option.durationMs - (nowMs - expedition.startedAtMs))
function isExpeditionReady(expedition, option, nowMs): boolean // getExpeditionRemainingMs(...) <= 0
```

**Rationale**: Mismo criterio que `getFestivalTimeRemainingMs`/`getActiveTreasureFestival` (specs/032) — funciones puras sin `Date.now()` interno, testeables de forma determinista con timestamps fijos, consumidas tanto por el store (para decidir si `claimGamatotoExpedition` procede) como por el panel (para mostrar el countdown).

## Decisión 3 — Materiales como contador simple, sin consumo en esta spec

**Decision**: `gamatotoMaterials: number` en `useMetaStore`, incrementado solo por `claimGamatotoExpedition()`. Ninguna acción de esta spec lo resta — queda disponible para que `specs/035-ototo-corps` lo lea/reste.

**Rationale**: Mismo patrón que `gachaCurrency`/`npCurrency` (specs/024) — un contador de cuenta independiente, sin mezclar con `currency` porque tiene un propósito y una fuente distintos (spec.md Key Entities).

## Decisión 4 — UI: countdown en vivo con el mismo patrón ya validado 2 veces

**Decision**: El panel de Gamatoto usa el mismo patrón de `EnergyRegenTimer` (specs/029)/`TreasureFestivalBanner` (specs/032): `setInterval(1000)` local + recálculo con `Date.now()` en cada tick, sin escribir al store desde el temporizador de UI.

**Rationale**: Tercera aplicación del mismo patrón ya validado — mantiene consistencia en vez de introducir una cuarta variante.

## Decisión 5 — Persistencia: 1 tabla Dexie nueva

**Decision**: Tabla `gamatoto` (versión 14 de Dexie), fila única `{ id: 1, expedition: { optionId, startedAtMs } | null, materials: number }`.

**Rationale**: Mismo patrón singleton ya usado 10 veces en el proyecto.
