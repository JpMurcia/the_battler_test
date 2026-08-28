# Quickstart: Validar Filtro de Gatos y Panel de Detalle de Unidad

## Automatizado

```bash
npx tsc -b
npm test
```

## Manual en navegador

1. **Filtro**: abrir Equipar (o Biblioteca de Gatos), marcar una rareza — confirmar que la lista se reduce correctamente; marcar un rasgo objetivo y una habilidad con Y/O y confirmar el resultado esperado en ambos modos; activar "Ordenar por nivel" y confirmar el reordenamiento.
2. **Detalle**: tocar un gato — confirmar que se abre el panel con las 8 estadísticas (HP/Daño/DPS/Alcance/Velocidad/Coste/Recarga/Tipo de ataque) y su Rasgo/Habilidades.
3. **Tabs de forma**: en un gato con evoluciones, cambiar de pestaña y confirmar que los stats mostrados cambian sin alterar la forma real del gato (cerrar el panel y reabrirlo debe mostrar la forma original vigente por defecto).
4. **Evolución**: con un gato elegible (nivel suficiente), pulsar el botón de evolución — confirmar que la forma cambia de inmediato y que, tras recargar la página, sigue en la nueva forma.
5. **Regresión**: confirmar que seleccionar/deseleccionar gatos en Equipar y "Confirmar equipo" siguen funcionando igual que antes de esta spec.
