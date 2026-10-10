# Quickstart: Catálogo de Habilidades de Combate — Fortalecer, Esquivar, Sobrevivir y Retroceso

## Prerrequisitos

- `npm install` ya ejecutado.
- Suite de tests en verde antes de empezar: `npx tsc -b && npm test`.

## Validación automatizada

```bash
npx vitest run tests/unit/engine/combat.test.ts
npx vitest run tests/unit/engine/simulation.test.ts
npx vitest run tests/unit/shared/UnitDetailPanel.test.tsx tests/unit/data/cats.test.ts
npx tsc -b
npm test
```

Todos deben pasar en verde, sin regresión en ninguna suite existente (SC-005/SC-006). El grueso de la validación es a nivel de motor — funciones puras de `src/engine/`, sin canvas ni DOM (Constitución § VI) — con `random` inyectado de forma determinista en cada test, mismo patrón que `specs/016` y `specs/038`:

- **Refactor (`applyHit`)**: ningún test existente de `combat.test.ts`/`simulation.test.ts` cambia ni falla tras unificar la tubería por golpe — es la red de seguridad del refactor (FR-009, SC-005).
- **Fortalecer**: sin `random`. Daño normal sobre el umbral, multiplicado en o bajo él (inclusivo, p. ej. `hp = 50` de `maxHp = 100` con umbral `0.5`); también contra la base y en salpicadura; multiplicativo con Debilitar; sin efecto bajo `Curse` (SC-001).
- **Esquivar**: `random` fijo que siempre "acierta" → `hp`, `shieldRemainingHp` y los efectos de estado del defensor no cambian; `random` que siempre falla → daño normal; en `MultiHit` cada golpe hace su roll; en salpicadura cada objetivo hace el suyo; un golpe esquivado no consume ningún roll posterior (SC-002).
- **Sobrevivir**: golpe letal con roll que acierta → `hp = 1` y `state` distinto de `Dead`; con roll que falla → muere; golpe no letal → idéntico a una unidad sin la habilidad (sin consumir roll); contra escudo, solo el excedente puede ser letal; contra Killer que acierta, puede salvar; con `chance: 1` ningún golpe único mata (SC-003).
- **Retroceso**: objetivo vivo tras el golpe, roll que acierta → `x` desplazado `distance` hacia su propia base (jugador: menor `x`; enemigo: mayor `x`); topes en `x = 0` y `laneLength - width`; objetivo muerto o golpe esquivado → sin desplazamiento; en salpicadura cada objetivo hace su roll (SC-004).
- **`stepSimulation`**: un atacante con Retroceso en un combate real de varios ticks separa a las unidades y, al reevaluarse, vuelven a trabarse por las reglas normales; el tope del enemigo respeta `state.laneLength`.
- **Panel**: `UnitDetailPanel` muestra el texto de cada habilidad nueva (FR-010).

## Validación manual en navegador

1. Iniciar el dev server (`npm run dev`) y abrir la app.
2. Los gatos semilla son de rareza `Raro`, así que ya pueden salir de la Cápsula, pero para no depender del azar: desde la consola de las devtools, abrir IndexedDB `BattleCatsDB` y agregar a `ownedCats` las filas `{ catId, level: 1, experienceInvested: 0 }` para `strengthen-cat`, `dodge-cat`, `survivor-cat` y `knockback-cat`; recargar y armarlos en la formación desde "Equipar".
3. Abrir "Equipar" → detalle de cada gato nuevo y confirmar que "Habilidades" muestra el texto correcto (`Fortalecer (≤50% HP, x2)`, `Esquivar (25%)`, `Sobrevivir (30%)`, `Retroceso (30%, 30)`).
4. Entrar a un nivel jugable y desplegar el Gato Empujón contra enemigos de vida alta: confirmar que, de vez en cuando, el enemigo golpeado salta hacia atrás y vuelve a acercarse sin errores ni unidades fuera del carril.
5. Desplegar el Gato Enfurecido y dejarlo recibir daño hasta quedar bajo la mitad de su vida; confirmar (con el estado vía devtools o por la velocidad a la que baja la vida del enemigo) que su daño por golpe se duplica.
6. Desplegar el Gato Escurridizo y el Gato Superviviente contra enemigos fuertes: confirmar que algunas veces no pierden vida pese a recibir un golpe (Escurridizo), o que quedan con 1 de vida tras un golpe que los mataría (Superviviente).
7. Revisar la consola del navegador: sin errores nuevos.
