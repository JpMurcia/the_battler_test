# Quickstart: Validar la Identidad Visual Animada

## Prerrequisitos

- `specs/002-motor-de-combate/` ya implementado (motor de combate real corriendo end-to-end).
- `npm install` ejecutado (Vitest, `pixi.js`, `@pixi/react` ya presentes — sin dependencias nuevas).

## Validación automatizada

```bash
npm run test
```

Casos que deben pasar (nuevos + toda la suite existente sin regresión, en particular `tests/unit/engine/*` sin ningún cambio):

- `tests/unit/game/animation.test.ts` — `getVisualProfile(cat)` produce parámetros distintos y deterministas para los 4 tipos de gato de `src/data/cats.ts` (el mismo `Cat` produce siempre el mismo `VisualProfile`); el mapeo de `BattleUnit.state` a `AnimationState` es correcto (`Moving` → `Idle`, `Engaged` → `Attacking`); el ritmo de la animación de ataque se deriva de `attackIntervalSeconds` sin necesitar ningún campo nuevo.
- Suite existente de `src/engine/` (`collision.test.ts`, `combat.test.ts`, `simulation.test.ts`) — **sin ningún cambio**, prueba que `src/engine/` no se tocó (Constitución § VI, research.md Decisión 4).

## Validación manual en navegador

```bash
npm run dev
```

1. Título → "Jugar" → Menú Principal → Niveles → "Jugar" en Nivel 1.
2. Desplegar un gato del roster y confirmar que, mientras avanza sin ningún oponente, muestra una animación de movimiento/idle continua — en ningún instante se ve como una forma completamente inmóvil (spec.md US1, SC-001).
3. Dejar que choque con una unidad enemiga de la oleada (o con la base enemiga) y confirmar que cambia a una animación de ataque reconociblemente distinta de la de movimiento/idle, con un ritmo perceptible acorde a su `attackIntervalSeconds` (US1, SC-002).
4. Confirmar que, al morir su oponente y quedar libre de nuevo, la unidad vuelve a la animación de movimiento/idle sin quedar congelada en la pose de ataque (US1).
5. Desplegar al menos dos tipos de gato distintos (por ejemplo, básico y tanque) en la misma batalla y confirmar que se distinguen visualmente entre sí más allá del color de equipo — tamaño, proporción o ritmo de movimiento perceptiblemente distintos (US2, SC-005).
6. Dejar que una unidad muera en combate y confirmar que se percibe una señal visual de derrota (encogimiento/desvanecimiento) antes de que desaparezca de la pantalla, en vez de una desaparición instantánea sin ningún cambio visible (US3).
7. Con 10 o más unidades activas y animadas en pantalla a la vez (desplegar varias del jugador mientras la oleada enemiga avanza), confirmar que la batalla se mantiene fluida y sin tirones perceptibles — abrir el panel de rendimiento del navegador (FPS) si hace falta confirmarlo numéricamente (SC-003, sin regresión respecto al umbral ya validado en `specs/002-motor-de-combate/`).
8. Salir de la batalla a mitad (botón "Salir") y confirmar que no queda ningún "eco de muerte" ni animación residual visible al volver a entrar a un nivel — el registro efímero de la capa de render se reinicia limpio.

## Notas

- No hay contrato de API externo que validar (frontend puro, sin backend) — la validación de "contrato" de esta feature es el comportamiento observable descrito arriba, cubierto por `animation.test.ts` y el recorrido manual.
- `src/engine/` no cambia en esta spec — los tests de motor de `specs/002-motor-de-combate/` deben seguir pasando exactamente igual, sin modificación, como evidencia de que la Constitución § VI se respetó.
- Las unidades ya no se ven como un único rectángulo de color estático — esto cierra la excepción a la Constitución § III declarada en `specs/002-motor-de-combate/plan.md` § Complexity Tracking.
