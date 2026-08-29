# Quickstart: Catálogo de Habilidades de Combate — Golpe Letal, Killers, Escudo e Invocar

## Prerrequisitos

- `npm install` ya ejecutado.
- Suite de tests en verde antes de empezar: `npx tsc -b && npm test`.

## Validación automatizada

```bash
npx vitest run tests/unit/engine/combat.test.ts
npx vitest run tests/unit/engine/simulation.test.ts
npx tsc -b
npm test
```

Todos deben pasar en verde, sin regresión en ninguna suite existente (SC-005/SC-006). El grueso de la validación de esta spec es a nivel de motor — funciones puras de `src/engine/`, sin canvas ni DOM (Constitución § VI) — con `random` inyectado de forma determinista en cada test, mismo patrón que `criticalChance` en `specs/016`:

- **Golpe Letal**: `random` fijo que siempre "acierta" el roll → el daño infligido es `damage * damageMultiplier`; `random` fijo que siempre "falla" → daño normal (SC-001).
- **Killers de rasgo**: unidad con `TraitKiller` contra un `BattleUnit` de prueba con vida muy alta del rasgo objetivo, `random` que acierta → `hp` queda en 0 en un solo golpe; contra un rasgo distinto, nunca se activa aunque `random` acierte (SC-002).
- **Escudo**: `BattleUnit` de prueba con `shieldRemainingHp` inicial → recibe varios golpes fijos y se verifica que `hp` no baja hasta agotar el escudo, y que el golpe que lo agota reparte correctamente el excedente (SC-003).
- **Invocar**: `stepSimulation` con una unidad de prueba a punto de morir (`hp` bajo) y `SummonOnDeath` declarado → tras el tick que la mata, `state.units` contiene la nueva unidad aliada configurada (SC-004).

## Validación manual en navegador

1. Iniciar el dev server y entrar a cualquier nivel jugable.
2. Desplegar la unidad semilla con `MassiveDamage` (`data-model.md`) varias veces contra un enemigo de vida alta — confirmar visualmente que, de vez en cuando, su barra de vida baja mucho más que con un ataque normal.
3. Desplegar la unidad semilla con un `TraitKiller` (Zombie o Metálico) contra un enemigo de ese rasgo si el nivel activo tiene alguno disponible (ej. un nivel de Brote Zombi) — confirmar que en algunos golpes el enemigo muere de golpe pese a tener vida alta.
4. Desplegar la unidad semilla con `Shield` y dejar que reciba el primer impacto enemigo — confirmar en el HUD/consola de desarrollo (o inspeccionando el estado vía devtools) que su `hp` no bajó pese a haber recibido daño.
5. Desplegar la unidad semilla con `SummonOnDeath` y dejar que muera en combate — confirmar que aparece una nueva unidad aliada en su posición, capaz de moverse y atacar.
6. Revisar la consola del navegador: sin errores nuevos.
