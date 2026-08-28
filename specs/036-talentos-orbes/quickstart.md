# Quickstart: Talentos y Orbes

## Prerrequisitos

- `npm install` ya ejecutado.
- Suite de tests en verde antes de empezar: `npx tsc -b && npm test`.

## Validación automatizada

```bash
npx vitest run tests/unit/data/talents.test.ts
npx vitest run tests/unit/useMetaStore.test.ts
npx vitest run tests/unit/useGameStore.test.ts
npx vitest run tests/unit/shared/UnitDetailPanel.test.tsx
npx tsc -b
npm test
```

Todos deben pasar en verde, sin regresión en ninguna suite existente (SC-005).

## Validación manual en navegador

1. Iniciar el dev server y abrir la app; si es necesario, usar herramientas de desarrollo para forzar en `useMetaStore` un gato Megarraro/Legendario a `evolutionStage: 'True'` y `npCurrency` suficiente (o jugar hasta obtener uno vía Cápsula de Gatos y evolucionarlo).
2. Desde el Hub, abrir Biblioteca (o Equipar) y ver el detalle de ese gato — confirmar que aparece la sección "Talentos" (SC-004: para un gato NO elegible, confirmar que la sección no aparece).
3. **Resistencia a Debuff**: invertir el primer punto eligiendo "Congelar" — confirmar que el NP se descuenta según el costo mostrado, y que la elección queda fija (el selector desaparece o se deshabilita). Invertir un segundo punto y confirmar que el costo mostrado ya es mayor (SC-001).
4. **Aumento de Estadísticas**: invertir puntos en HP y en Daño por separado — confirmar que cada uno tiene su propio costo/contador independiente (SC-002).
5. **Orbe**: invertir el primer punto eligiendo un rasgo (por ejemplo, "Rojo") — confirmar que la elección queda fija (SC-003).
6. Ir a Batalla, desplegar ese gato, y confirmar en combate (o inspeccionando el estado vía herramientas de desarrollo) que: (a) recibe menos duración de Congelar si un enemigo se lo aplica; (b) su HP/Daño mostrados en pantalla reflejan el bono; (c) inflige más daño contra un enemigo "Rojo" que contra uno de otro rasgo.
7. Confirmar que un gato sin ningún punto invertido se comporta exactamente igual que antes de esta spec (FR-008) — mismo daño/HP/duración de debuffs que en una batalla de referencia previa a la spec.
8. Revisar la consola del navegador: sin errores nuevos.
