# Research: Cuerpo Ototo

## Decisión 1 — Mismo patrón de construcción asíncrona que `specs/034-gamatoto`

**Decision**: `src/data/ototoCorps.ts` exporta `OtotoBuildingId` (`'foundation' | 'style'`), `OtotoBuildingDefinition` (id, nombre, costo en materiales, `durationMs`), `OTOTO_BUILDINGS: OtotoBuildingDefinition[]` (2 entradas), y las mismas funciones puras `getConstructionRemainingMs`/`isConstructionReady` con la firma de `specs/034` (`entity, definition, nowMs`). El estado en curso vive en `useMetaStore` como `ototoConstruction: { building: OtotoBuildingId; choice: string; startedAtMs: number } | null` — sin remanente persistido, igual que `gamatotoExpedition`.

**Rationale**: Es literalmente el mismo mecanismo ("invertir un recurso, esperar un tiempo real, reclamar") ya validado en `specs/034` — reutilizar la forma exacta (incluso el nombre de las funciones) minimiza sorpresas y mantiene el código predecible entre ambas specs.

## Decisión 2 — Construcciones completas: 2 campos independientes, no un array

**Decision**: `ototoBuildings: { foundation?: ClassificationType; style?: EffectType }` en `useMetaStore` — cada campo es la elección activa de esa categoría, o `undefined` si nunca se completó.

**Rationale**: Solo hay 2 categorías fijas (nunca "N construcciones"), así que 2 campos con nombre son más simples de leer/testear que un array que hay que filtrar por id en cada uso.

## Decisión 3 — El bono se aplica en `deployUnit()`, extendiendo `abilities`/`resistantTo` ya soportados

**Decision**: En `useGameStore.deployUnit()`, al construir el `BattleUnit`, se leen `useMetaStore.getState().ototoBuildings` y:
- si `foundation` tiene un rasgo elegido, se antepone `{ kind: 'TraitResistance', targetClassifications: [rasgo], damageTakenMultiplier: OTOTO_DAMAGE_REDUCTION }` al arreglo `abilities` del gato (`[bono, ...cat.abilities ?? []]`);
- si `style` tiene un debuff elegido, se antepone `{ effect: debuff, durationMultiplier: OTOTO_DEBUFF_RESISTANCE }` al arreglo `resistantTo`.

Anteponer (no `push`) para que, en el caso borde de que el propio gato ya tenga una entrada para el mismo rasgo/debuff, el bono de Ototo sea el que `resolveResistanceMultiplier`/`applyOnHitEffect` encuentren primero (ambos iteran el arreglo en orden y devuelven la primera coincidencia, `src/engine/combat.ts` líneas 36-49/62-68 — comportamiento ya existente, sin cambios).

**Rationale**: `TraitResistance` (specs/015 FR-007) y `resistantTo` (specs/015 FR-009) ya son exactamente "resistencia de daño por rasgo" y "resistencia de duración por debuff" — el mismo efecto que el manual describe para Base/Estilo. Ninguna línea de `src/engine/` cambia; el motor ya sabe interpretar estos campos porque los usa desde `specs/015`.

**Alternatives considered**: Un campo nuevo en `SimState`/`BattleUnit` tipo `teamBonuses`. Rechazado — duplicaría un mecanismo que ya existe con la semántica exacta necesaria, violando el principio de reutilización ya aplicado en `specs/031` (research.md Decisión 3 de esa spec, mismo criterio).

## Decisión 4 — Valores de bono (provisionales, no balanceados)

`OTOTO_DAMAGE_REDUCTION = 0.7` (daño recibido del rasgo elegido al 70%, es decir −30%) y `OTOTO_DEBUFF_RESISTANCE = 0.5` (duración del debuff elegido a la mitad) — mismo criterio de valores redondos y simples que `SPECIAL_CANNON_DEFAULTS`/`BASE_UPGRADES`.

## Decisión 5 — Costo/duración de construcción y persistencia

Mismos órdenes de magnitud que `GAMATOTO_EXPEDITION_OPTIONS` (minutos, no horas, para quedar verificable en una sesión de desarrollo): Base 40 materiales / 15 min; Estilo 40 materiales / 15 min. Tabla Dexie nueva `ototoCorps` (versión 15), fila única `{ id: 1, construction: {...} | null, buildings: { foundation?, style? } }` — mismo patrón singleton ya usado 11 veces.
