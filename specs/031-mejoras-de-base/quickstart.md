# Quickstart: Validar Mejoras de Base

## Automatizado

```bash
npx tsc -b
npm test
```

## Manual en navegador

1. Abrir "Mejorar" → pestaña "Mejoras de Base" — confirmar que se listan las 7 mejoras con nivel 0 y costo inicial.
2. Con moneda suficiente, subir Potencia de Cañón un par de niveles.
3. Entrar a una batalla, esperar a que el cañón especial recargue (specs/029) y dispararlo — confirmar (vía DevTools, `useGameStore.getState().specialCannon`) que `damage` es mayor que el valor base (50).
4. Subir Defensa de Base, entrar a una batalla nueva, confirmar que `playerBase.maxHp` es mayor que `level.playerBaseHp`.
5. Subir Investigación, desplegar una unidad, confirmar que su cooldown mostrado en la barra de despliegue es menor que su `cooldownSeconds` base.
6. Subir Contabilidad, ganar una batalla, confirmar que la moneda otorgada es mayor que sin la mejora.
7. Subir Energía, volver al Hub, confirmar que el máximo de energía de misión mostrado aumentó.
8. Con las 7 mejoras en nivel 0 (perfil nuevo), confirmar que todo el comportamiento es idéntico al de antes de esta spec.
