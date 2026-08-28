# Quickstart: Tienda

## Prerrequisitos

- `npm install` ya ejecutado.
- Suite de tests en verde antes de empezar: `npx tsc -b && npm test`.

## Validación automatizada

```bash
npx vitest run tests/unit/data/shop.test.ts
npx vitest run tests/unit/useMetaStore.test.ts
npx vitest run tests/unit/ShopPanel.test.tsx
npx vitest run tests/unit/HubScreen.test.tsx
npx tsc -b
npm test
```

Todos deben pasar en verde, sin regresión en ninguna suite existente (SC-004).

## Validación manual en navegador

1. Iniciar el dev server y abrir la app con moneda suficiente (usar herramientas de desarrollo si es necesario para forzar `currency` alto en `useMetaStore`/IndexedDB).
2. Desde el Hub, abrir "Tienda" — confirmar que aparecen las 2 secciones: Objetos de Batalla e Ítems de Evolución.
3. **Objetos de Batalla**: comprar una unidad de "Aceleración de Velocidad" — confirmar que la moneda se descuenta 150 y que, al abrir Equipar/TeamScreen, el inventario de ese objeto aumenta en 1 (SC-001).
4. **Ítems de Evolución**: confirmar que algún gato poseído con Forma Verdadera definida y sin alcanzarla aparece listado con su progreso `actual/requerido`. Nota: el catálogo de producción actual no exige ítems para ningún gato (`requiredItemCount` ausente = 0), así que todo gato listado se muestra como `0/0` con el botón "Comprar" ya deshabilitado (comportamiento correcto — FR-005: no tiene sentido comprar de más) — el flujo completo de compra incrementando el contador se valida con el gato de prueba dedicado en `tests/unit/ShopPanel.test.tsx` (SC-002), no en esta verificación manual.
5. Confirmar que un gato ya en Forma Verdadera, o sin Forma Verdadera definida en absoluto, no aparece en la sección de Ítems de Evolución.
6. Revisar la consola del navegador: sin errores nuevos.
