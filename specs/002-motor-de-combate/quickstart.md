# Quickstart: Validar el Motor de Combate Real

## Prerrequisitos

- Bootstrap de `specs/001-nucleo-del-juego/` ya implementado (commit `a66a0de` en este repo).
- `npm install` ejecutado (Vitest, Testing Library, Dexie, Pixi ya presentes).

## Validación automatizada

```bash
npm run test
```

Casos que deben pasar (nuevos + existentes):

- `tests/unit/engine/collision.test.ts` — `overlaps1D` detecta y descarta superposición en varios casos límite (bordes exactos, sin overlap, contenido completo).
- `tests/unit/engine/combat.test.ts` — intercambio de daño reduce `hp` de ambas unidades por intervalo; una unidad con `hp <= 0` pasa a `state: 'Dead'`.
- `tests/unit/engine/simulation.test.ts` — un paso de `stepSimulation`: mueve unidades sin bloqueo, bloquea y combate unidades superpuestas, aplica daño a base sin unidades bloqueando, regenera energía, spawnea la oleada enemiga en el `spawnAtSeconds` correcto, resuelve `Victory`/`Defeat` cuando una base llega a 0 y detiene todo movimiento posterior.
- `tests/unit/useGameStore.test.ts` (ampliado) — `tick()` real delega en `stepSimulation` y actualiza la store.
- `tests/unit/db.test.ts` (ampliado) — `ensureDefaultProfile()` siembra el gato inicial en `ownedCats` además de `playerProfile`/`settings`.

## Validación manual en navegador

```bash
npm run dev
```

1. Título → "Jugar" → Menú Principal → Niveles → "Jugar" en Nivel 1.
2. Confirmar que la energía sube visiblemente con el tiempo (overlay de `BattleScreen`).
3. Al alcanzar el costo de un gato, desplegarlo y confirmar que avanza solo por el carril.
4. Confirmar que una unidad enemiga de la oleada aparece, avanza, y que al chocar con la unidad del jugador ambas quedan "Engaged" (dejan de avanzar) hasta que una muere.
5. Dejar que una unidad del jugador llegue sin bloqueo hasta la base enemiga y confirmar que su salud baja.
6. Forzar (o esperar) a que una base llegue a 0 de salud y confirmar: la batalla se detiene de inmediato, aparece `ResultScreen` con el resultado correcto (victoria/derrota), y en victoria la moneda/desbloqueo del siguiente nivel se reflejan al volver a `LevelSelectScreen` sin recargar la página.
7. Repetir el paso 3-4 pero saliendo de la batalla a mitad (botón "Salir") o recargando la página — confirmar que la moneda y los niveles desbloqueados quedan exactamente como antes de entrar (User Story 3).

## Notas

- No hay contrato de API externo que validar (frontend puro, sin backend) — la validación de "contrato" de esta feature es el comportamiento observable descrito arriba, cubierto por los tests automatizados en `src/engine/` y el recorrido manual.
- Las unidades se ven como rectángulos de color por equipo (sin animación) — es la excepción declarada en `plan.md` § Complexity Tracking, no un defecto a corregir en esta ronda.
