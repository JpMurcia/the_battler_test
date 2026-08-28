# Quickstart: Validar Misiones (Catnip Challenges)

## Automatizado

```bash
npx tsc -b
npm test
```

## Manual en navegador

1. Abrir el Hub, confirmar el botón "Misiones" (sin badge en un perfil nuevo).
2. Abrir el panel — confirmar las 3 misiones con progreso 0/objetivo.
3. Desplegar 10 unidades en una batalla (o varias) — confirmar que "Despliega 10 unidades" queda completa y el botón "Misiones" del Hub muestra el badge.
4. Reclamarla — confirmar que la moneda aumenta y el botón de esa misión pasa a "Reclamada".
5. Ganar una batalla — confirmar que "Completa 1 etapa" avanza.
6. Derrotar enemigos en batalla — confirmar que "Derrota 20 enemigos" avanza.
7. Vía DevTools, adelantar `missionsResetDateKey`/simular un día distinto (o esperar al día siguiente) y reabrir — confirmar que las 3 misiones vuelven a 0 sin reclamo.
