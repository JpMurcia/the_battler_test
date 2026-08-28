# Quickstart: validar Navegación Hub + Modales

## Prerrequisitos

- `npm install` ya ejecutado.
- Sin progreso guardado previo relevante (o aceptar el estado actual del IndexedDB del navegador de pruebas).

## Levantar la app

```bash
npm run dev
```

Abrir `http://localhost:5173` en una ventana **horizontal** de al menos 900×420 (el layout está fijado a móvil-horizontal desde specs/021 Fase 9; en vertical la app solo muestra el aviso de "Girá tu dispositivo").

## Escenarios a validar manualmente (uno por Historia de Usuario)

### US1 — Hub persistente

1. Desde Título, pulsar "Jugar"/"Continuar".
2. **Esperado**: se ve el Hub con rango, energía de misión (actual/máx.) y moneda visibles al mismo tiempo, más el dock inferior con Biblioteca/Cápsula/Almacén y los accesos destacados ¡Batalla!/Equipar/Mejorar.
3. Pulsar "¡Batalla!" → llega al Mapa de Etapas (mismo destino que "Niveles" hoy).

### US2 — Paneles superpuestos

1. Desde el Hub, abrir cada uno de: Equipar, Mejorar, Cápsula, Biblioteca, Ajustes, Menú de Tesoros.
2. **Esperado en cada uno**: el Hub sigue visible (oscurecido) detrás del panel.
3. Dentro de Mejorar, mejorar una unidad; cerrar el panel; volver a abrirlo — el nivel mejorado debe seguir aplicado (persistencia intacta, FR-005/FR-006).
4. Dentro de Ajustes, cambiar idioma y aplicar; cerrar — el resto de la UI debe reflejar el nuevo idioma.
5. Regresión: correr `npm run test` — ningún test existente de `TeamScreen`/`UpgradeScreen`/`GachaScreen`/`CatGuideScreen`/`EnemyGuideScreen`/`SettingsScreen`/`TreasureMenuScreen` debe romperse (FR-015).

### US3 — Perfil de Jugador

1. Desde el Hub, abrir "Perfil de Jugador".
2. **Esperado**: rango actual y "X/Y gatos poseídos" (Y = tamaño total de `CATS`).
3. Pulsar el acceso a Ajustes dentro del Perfil; cerrar Ajustes → debe volver al Perfil de Jugador, no directamente al Hub (FR-013).

### US4 — Buzón de Noticias

1. Con novedades no leídas (estado inicial tras seed), confirmar que el Hub muestra el indicador en el acceso al Buzón.
2. Abrir el Buzón → lista de novedades ordenada de más reciente a más antigua; el indicador del Hub desaparece.
3. Cerrar y reabrir el Hub (recargar la página) → el indicador sigue ausente (persistido vía Dexie).

### US5 — Tesoros desde el Mapa de Etapas

1. Desde el Hub, entrar al Mapa de Etapas.
2. Pulsar el nuevo acceso "Tesoros X%".
3. **Esperado**: mismo contenido/progreso que abrir Menú de Tesoros desde Mejorar; al cerrar, vuelve al Mapa de Etapas (no al Hub).

## Comandos de verificación

```bash
npm run test    # Vitest — regresión de las 7 pantallas convertidas + nuevos tests de PanelOverlay/stack
npm run lint     # oxlint
npm run build    # tsc -b && vite build — confirma que los tipos PanelId/Screen quedan consistentes
```
