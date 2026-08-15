# Quickstart: Validar el Capítulo 1 — Vertical Slice Jugable

Guía para comprobar de punta a punta que la vertical slice cumple los criterios de aceptación de [spec.md](./spec.md), una vez implementadas las tareas de `/speckit-tasks`.

## Prerrequisitos

- Unity 6000.3.20f1 (o superior) con el proyecto `the_battler_test` abierto.
- Escena `Assets/Scenes/Chapter1_Battle.unity` presente y configurada con un `ChapterDefinition` que apunte a `Assets/ScriptableObjects/Battler/Chapter1/Chapter1.asset` (ver [contracts/scriptableobject-data-contract.md](./contracts/scriptableobject-data-contract.md)).
- Los 5 `UnitDefinition` de `Units/Player/` tienen `idleAnimation`, `attackAnimation` y `visualVariant` asignados (sin referencias nulas).

## Pasos de validación manual (Editor)

1. **Abrir la escena** `Chapter1_Battle.unity` y entrar en Play Mode.
2. **Diálogo pre-batalla (US2, FR-001)**: confirmar que se reproduce el diálogo con retrato + texto antes de que cualquier botón de despliegue esté interactuable. Avanzar hasta el final de la secuencia.
3. **Acumulación de recurso (US1, Acceptance Scenario 1)**: tras cerrarse el diálogo, verificar que el contador de recurso sube solo, sin input, hasta alcanzar el coste de al menos una unidad.
4. **Despliegue válido (US1, Acceptance Scenario 2)**: con recurso suficiente, desplegar una unidad. Confirmar que el recurso se descuenta exactamente el `cost` de esa `UnitDefinition`, la unidad aparece en el carril, y se mueve/ataca sin más input.
5. **Cooldown (US1, Acceptance Scenario 3)**: intentar volver a desplegar la misma unidad inmediatamente — debe rechazarse visualmente. Esperar `cooldownSeconds` y confirmar que vuelve a estar disponible.
6. **Rechazo sin recurso (Edge Case)**: intentar desplegar una unidad cuyo coste supera el recurso actual — confirmar que no se descuenta nada y no aparece unidad.
7. **Identidad visual (US3)**: para cada una de las 5 unidades, desplegar al menos una y observar: animación de idle antes de entrar en rango, animación de ataque distinta al entrar en rango de un objetivo, variante visual reconocible frente a las otras 4.
8. **Oleada enemiga (FR-011)**: confirmar que, sin ninguna acción del jugador, aparecen unidades del bando enemigo según `EnemyWaveDefinition` y avanzan hacia la base del jugador.
9. **Condición de victoria (US1, Acceptance Scenario 4)**: reducir la salud de la base enemiga a 0 (desplegando unidades suficientes) y confirmar que la batalla termina en victoria y se reproduce el diálogo post-batalla (FR-002).
10. **Condición de derrota (US1, Acceptance Scenario 5)**: en una segunda corrida, dejar que la base del jugador llegue a 0 — confirmar que termina en derrota y que el jugador puede reintentar sin bloqueos (FR-013, sin volver a ver el diálogo pre-batalla completo).

## Validación automatizada

- `Tests/EditMode/Battler/`: correr desde `Window > General > Test Runner > EditMode`. Deben pasar las validaciones de datos (rangos de `UnitDefinition`, referencias no nulas de animación/variante) y la lógica pura de recurso/condición de victoria descrita en [research.md](./research.md#5-estrategia-de-testing).
- `Tests/PlayMode/Battler/`: correr desde `Window > General > Test Runner > PlayMode`. Debe pasar el test del loop completo (acumular recurso → desplegar → cooldown → resolución de victoria/derrota) sobre una escena de prueba mínima, sin depender del contenido final del Capítulo 1.

## Resultado esperado

Todos los pasos manuales (1–10) y ambas suites automatizadas en verde confirman que la vertical slice cumple [spec.md](./spec.md) end-to-end y está lista para pasar a `/speckit-tasks` → `/speckit-implement` si aún no se ha construido, o para cerrarse como validada si ya se implementó.
