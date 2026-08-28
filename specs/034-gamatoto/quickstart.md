# Quickstart: Validar Gamatoto

## Automatizado

```bash
npx tsc -b
npm test
```

## Manual en navegador

1. Abrir el panel de Gamatoto desde el Hub — confirmar las 3 duraciones disponibles con sus materiales.
2. Enviar la expedición corta (5 min) — confirmar que el panel muestra un countdown y ya no ofrece enviar otra.
3. Vía DevTools, adelantar `gamatotoExpedition.startedAtMs` (o esperar los 5 minutos reales) y reabrir el panel — confirmar que se muestra completa y reclamable, y que el botón "Gamatoto" del Hub muestra el badge.
4. Reclamarla — confirmar que `gamatotoMaterials` aumenta en 5 y que el panel vuelve a ofrecer las 3 duraciones.
