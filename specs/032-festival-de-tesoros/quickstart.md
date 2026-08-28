# Quickstart: Validar Festival de Tesoros

## Automatizado

```bash
npx tsc -b
npm test
```

## Manual en navegador

1. Con la ventana de festival de bootstrap activa (cubre la fecha actual de desarrollo), abrir el mapa de etapas — confirmar que el banner muestra el multiplicador y una cuenta regresiva.
2. Esperar unos segundos y confirmar que la cuenta regresiva decrece.
3. Ganar un nivel y confirmar (vía DevTools, `useMetaStore.getState().currency`) que la moneda otorgada incluye el multiplicador del festival.
4. Modificar temporalmente `TREASURE_FESTIVALS` (o simular una fecha fuera de ventana) y confirmar que el banner desaparece y la moneda de victoria vuelve a su valor sin festival.
