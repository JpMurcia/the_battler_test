# Research: Cat Combos

## Decisión 1 — El estado de combo es una función pura derivada, no un campo persistido

**Decision**: No se agrega ningún campo nuevo a `useMetaStore`/Dexie para "qué combos están activos". En su lugar, `src/data/catCombos.ts` expone `getCompletedCombos(catIds: string[]): CatCombo[]`, una función pura que recibe cualquier lista de catIds y devuelve los combos cuyos `memberCatIds` están todos incluidos. `useMetaStore` gana `getActiveComboBonusMultiplier(type)`, que llama a `getCompletedCombos(get().activeTeamCatIds)` en el momento de la consulta.

**Rationale**: `spec.md` FR-009 exige explícitamente que el estado de combo no persista como progreso de cuenta y se recalcule cada vez que se inicia una batalla — es un requisito, no solo una opción de diseño. Además, `activeTeamCatIds` ya es progreso persistente (`specs/006`/`specs/023`); guardar un segundo dato derivado de él (qué combos cumple) violaría el mismo principio que evita duplicar `characterLevelOf` como campo propio (`specs/019`) en vez de calcularlo cada vez. Al ser una función pura sobre datos ya disponibles, es trivialmente testeable sin Dexie ni `fake-indexeddb`.

**Alternatives considered**: Replicar el patrón de `grantedTreasureSetIds` (`specs/013`) — un array persistido de combos "desbloqueados" una vez cumplidos, igual que un logro permanente — descartado explícitamente: ese patrón modela una bonificación que, una vez ganada, se queda para siempre (el jugador completó un set de tesoros, un logro irreversible). Un Cat Combo es lo opuesto por diseño (`spec.md` Historia 3, Edge Cases): se activa y se desactiva según la formación vigente en cada batalla, incluso pudiendo romperse. Persistirlo como "otorgado" produciría el bug exacto que el Edge Case de `spec.md` prohíbe (un combo roto seguiría dando bonus).

## Decisión 2 — El bonus de combo reutiliza el esquema `type`/`value` de `TreasureSetPassiveBonus`, sin tipo nuevo

**Decision**: `CatComboBonus` se define con el mismo shape que `TreasureSetPassiveBonus` (`src/data/treasureSets.ts`): `{ type: 'EnergyRegenMultiplier' | 'CurrencyRewardMultiplier', value: number }`. No se introduce ningún tipo de efecto nuevo (por ejemplo, un multiplicador de daño de unidad) para el alcance de esta spec.

**Rationale**: `spec.md` Assumptions ya fija esto como default razonable ("reutiliza el mismo esquema... en vez de crear un segundo sistema de bonificaciones paralelo"). Ambos tipos existentes se leen en puntos fuera de `src/engine/` (`useGameStore.startLevel` para energía, `BattleScreen.tsx` para moneda) — exactamente donde un bonus de combo también debe aplicarse, según Constitución § VI (el motor de combate no debe conocer combos ni tesoros, solo recibir un `regenPerSecond`/monto ya resuelto). Un tipo nuevo como "multiplicador de daño" exigiría tocar `deployUnit`/`src/engine/types.ts` y posiblemente `src/engine/combat.ts`, expandiendo el alcance mucho más allá de lo que `spec.md` pide y sin ningún FR que lo exija.

**Alternatives considered**: Tipo de bonus nuevo `DamageMultiplier` aplicado a las unidades del combo en batalla — descartado por alcance: ningún FR/SC de `spec.md` pide un efecto de combate en tiempo real, solo "una bonificación pasiva" en abstracto (Key Entities), y los dos tipos ya existentes son ejemplos suficientes y ya validados en producción por `specs/013`.

## Decisión 3 — Dos combos fixture, de tipos de bonus distintos, para poder probar la Historia 3 sin ambigüedad

**Decision**: `CAT_COMBOS` define exactamente 2 combos:
- `combo-nucleo-original`: `['basic-cat', 'tank-cat']` (los dos únicos gatos `rarity: 'Normal'` del catálogo actual) → `{ type: 'EnergyRegenMultiplier', value: 1.05 }`.
- `combo-especialistas-control`: `['weaken-cat', 'slow-cat']` (gatos de control ya existentes en el catálogo) → `{ type: 'CurrencyRewardMultiplier', value: 1.1 }`.

**Rationale**: `spec.md` Historia 3 exige verificar que dos combos activos a la vez no se anulen entre sí. Usar dos tipos de bonus **distintos** para los dos combos fixture permite un test de aceptación inequívoco (cada multiplicador se puede leer y verificar por separado, sin depender de si el sistema multiplica o suma correctamente dos bonos del mismo tipo — ese caso ya lo cubre `getActiveBonusMultiplier` de tesoros con su propio `reduce`). Ambos combos caben cómodamente dentro de `MAX_ACTIVE_TEAM_SIZE` (6) a la vez (4 de 6 espacios), permitiendo un escenario de prueba realista de "los dos combos activos simultáneamente" sin forzar el límite de formación. `basic-cat`/`tank-cat` son el ejemplo más cercano al "diez unidades Normales" que cita el manual (§ 9.3) dado que el catálogo actual solo tiene dos Normales (`spec.md` Nota de alcance); `weaken-cat`/`slow-cat` son gatos de control ya existentes (`specs/015`), agrupables temáticamente sin necesitar ninguna unidad nueva.

**Alternatives considered**: Un solo combo para todo el MVP — descartado: no permite demostrar ni testear la Historia 3 (P2), que es parte explícita del alcance de `spec.md`. Definir 3+ combos — descartado por YAGNI (Constitución § VII): 2 combos ya cubren las 3 historias de usuario de `spec.md` sin contenido extra no solicitado.

## Decisión 4 — Combinación con bonos de tesoro: multiplicar en el mismo punto de lectura, nunca reemplazar

**Decision**: `useGameStore.startLevel` pasa a calcular `regenPerSecond` como `level.energyRegenPerSecond * getActiveBonusMultiplier('EnergyRegenMultiplier') * getActiveComboBonusMultiplier('EnergyRegenMultiplier')`; `BattleScreen.tsx` hace el equivalente para `addCurrency`. Ambas funciones son independientes y se multiplican explícitamente, nunca se reemplazan entre sí.

**Rationale**: `spec.md` FR-008 y el Edge Case correspondiente exigen que un bono de combo y uno de set de tesoros del mismo tipo se combinen (multiplicar), nunca se excluyan. Multiplicar en el mismo punto donde ya se lee `getActiveBonusMultiplier` es el cambio de menor superficie posible — ningún archivo nuevo, ninguna refactorización del mecanismo de tesoros ya probado en `specs/013`.

**Alternatives considered**: Una función combinada única `getActiveBonusMultiplier` que internamente sumara también los combos — descartado: mezclaría dos fuentes de datos con reglas de vigencia distintas (tesoros = permanente una vez otorgado; combos = recalculado por formación en cada batalla) dentro de la misma función, dificultando testear cada una de forma aislada (Decisión 1).

## Decisión 5 — La consulta de combos en `TeamScreen` lee el estado local `selectedIds`, no `activeTeamCatIds` persistido

**Decision**: La sección nueva de Cat Combos en `TeamScreen.tsx` llama a `getCompletedCombos(selectedIds)` (el estado local de checkboxes ya existente en el componente) en cada render, no a `activeTeamCatIds` del store. Para el detalle por miembro (FR-007, distinguir "no poseído" de "poseído pero no en formación") se añade una función hermana pura en el mismo archivo, `getComboMemberStatus(combo, ownedCatIds, selectedIds)`, que devuelve por cada miembro si está poseído y si está en la selección actual.

**Rationale**: `spec.md` Historia 2, Acceptance Scenario 4 exige que el combo pase a "completo" apenas el jugador agrega el gato que le faltaba, "sin necesidad de salir y volver a entrar a la pantalla" — y `TeamScreen.tsx` ya solo escribe a `activeTeamCatIds` al pulsar "Confirmar equipo" (`setActiveTeam(selectedIds)`), no en cada toggle. Leer `activeTeamCatIds` en la sección de combos obligaría al jugador a guardar antes de ver el efecto de su cambio, contradiciendo ese acceptance scenario. Leer `selectedIds` directamente hace que la sección se actualice en el mismo render que el checkbox, sin plumbing adicional.

**Alternatives considered**: Sincronizar `selectedIds` a un campo de store aparte para poder leerlo desde una función de `useMetaStore` — descartado por YAGNI: `selectedIds` ya es estado de React local perfectamente válido para este cálculo derivado y no necesita vivir en Zustand ni persistirse.
