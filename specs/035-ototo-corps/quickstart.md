# Quickstart: Validar Cuerpo Ototo

## Automatizado

```bash
npx tsc -b
npm test
```

## Manual en navegador

1. Acumular materiales de Gamatoto (spec anterior) hasta al menos 40.
2. Abrir el panel del Cuerpo Ototo, construir la Base eligiendo un rasgo (p. ej. "Floating") — confirmar que los materiales bajan y aparece el countdown.
3. Esperar (o adelantar el reloj vía DevTools) hasta que termine, reclamarla.
4. Entrar a una batalla y desplegar una unidad; vía DevTools, confirmar que `useGameStore.getState().units[0].abilities` incluye la `TraitResistance` con el rasgo elegido.
5. Repetir con el Estilo y un debuff, confirmando `resistantTo` en la unidad desplegada.
6. Con ninguna construcción completa (perfil nuevo), confirmar que las unidades desplegadas no llevan ningún bono de Ototo.
