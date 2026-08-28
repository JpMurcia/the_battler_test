# Research: Mejoras de Base

## Decisión 1 — Catálogo de datos puro, mismo patrón que `userRankThresholds.ts`/`treasureSets.ts`

**Decision**: `src/data/baseUpgrades.ts` exporta `BaseUpgradeId` (7 valores), `BASE_UPGRADES: BaseUpgradeDefinition[]` (nombre, tope de nivel, costo por nivel) y funciones puras de efecto por mejora (`getCannonPowerBonus(level)`, etc.), sin ningún import de React/Zustand.

**Rationale**: Consistente con Constitución § IV (Balance Dirigido por Datos) y con todo `src/data/*` existente — el efecto de cada mejora es una fórmula determinista de su nivel, testeable sin store ni componentes.

## Decisión 2 — Persistencia: 1 tabla Dexie nueva, mismo patrón singleton que `evolutionItems`/`battleItems`

**Decision**: Tabla `baseUpgrades` (versión 12 de Dexie), fila única `{ id: 1, levels: Record<BaseUpgradeId, number> }`. En `useMetaStore`, campo `baseUpgrades: Record<BaseUpgradeId, number>` (default `{}`, niveles ausentes = 0 al leer — mismo patrón que `evolutionItems`/`battleItemInventory`).

**Rationale**: Ninguna mejora necesita más que "nivel actual por id" — un registro plano es suficiente, igual que `EvolutionItemsRow.counts`/`BattleItemsRow.counts`. No se seedea en `ensureDefaultProfile()` (todas empiezan en 0 por ausencia, sin necesidad de escribir una fila vacía).

## Decisión 3 — Los bonos se resuelven en la capa de estado, nunca en `src/engine/`

**Decision**: `useGameStore.startLevel()` y `useGameStore.deployUnit()` leen `useMetaStore.getState().baseUpgrades` y aplican los bonos ya resueltos (daño/radio/recarga de cañón, HP de base, cooldown de unidad) como valores de entrada — mismo patrón ya usado por `enemyStrengthMultiplier` (specs/012), `getActiveBonusMultiplier`/`getActiveComboBonusMultiplier` (specs/013/025) y `unitSpeedMultiplier` (specs/017). `BattleOutcomeWatcher` (`BattleScreen.tsx`) multiplica la recompensa de moneda por un tercer factor `getBaseUpgradeCurrencyMultiplier()`, junto a los 2 ya existentes.

**Rationale**: Ninguna regla de `src/engine/` cambia — los bonos ya resueltos entran como parámetros, exactamente el mismo patrón que specs anteriores establecieron para "modificadores de cuenta que afectan una batalla". Reutilizar el patrón evita inventar un mecanismo nuevo.

**Alternatives considered**: Que `stepSimulation` lea `useMetaStore` directamente. Rechazado — violaría Constitución § VI (el motor no debe depender de ningún store).

## Decisión 4 — Pisos mínimos para evitar valores degenerados

**Decision**: Recarga de Cañón nunca baja de `MIN_CANNON_RECHARGE_SECONDS = 5`; el cooldown de una unidad nunca baja de `MIN_UNIT_COOLDOWN_SECONDS = 0.5`. Ambos como `Math.max(piso, base - bono)`.

**Rationale**: FR-008/Edge Cases exigen explícitamente un piso — con el tope de nivel 10 y los incrementos elegidos (research.md abajo) ningún valor real llega a rozar el piso hoy, pero el piso queda como guardia explícita ante cualquier rebalanceo futuro de `BASE_UPGRADES`.

## Decisión 5 — Valores de nivel/costo/efecto (provisionales, no balanceados)

Mismo criterio que `SPECIAL_CANNON_DEFAULTS` (specs/012) y el costo lineal de `UpgradeScreen.tsx` (`currentLevel * 100`) — números redondos, fáciles de razonar, sin pretensión de balance final:

| Mejora | Tope | Costo por nivel | Efecto por nivel |
|---|---|---|---|
| Potencia de Cañón | 10 | `(nivel+1) * 100` | +10 daño |
| Alcance de Cañón | 10 | `(nivel+1) * 100` | +5 radio de área |
| Recarga de Cañón | 10 | `(nivel+1) * 100` | −1s (piso 5s) |
| Defensa de Base | 10 | `(nivel+1) * 100` | +100 HP máximo de base |
| Investigación | 10 | `(nivel+1) * 100` | −0.1s cooldown por unidad (piso 0.5s) |
| Contabilidad | 10 | `(nivel+1) * 100` | +5% moneda de victoria (multiplicativo) |
| Energía | 10 | `(nivel+1) * 100` | +10 energía de misión máxima |

## Decisión 6 — Exclusiones documentadas ya en `spec.md`

Ritmo/Cartera del Trabajador y Estudio quedan fuera (spec.md Assumptions) — no requieren investigación técnica adicional, es una decisión de alcance ya resuelta antes de planear.
