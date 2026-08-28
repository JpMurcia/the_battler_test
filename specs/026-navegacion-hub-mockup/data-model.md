# Data Model: Navegación Hub + Modales

Esta feature es mayormente de navegación/UI; el único dato nuevo persistido es el estado de lectura del Buzón de Noticias. El resto de las entidades relevantes (rango, energía, moneda, colección, progreso de tesoros) ya existen en `useMetaStore`/`useGameStore` y se leen sin cambios.

## Entidad: Entrada de Noticias (`NewsEntry`)

Definida como dato estático en `src/data/news.ts` (Constitución IV — datos, no lógica).

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `string` | Identificador estable de la entrada (clave para el estado de lectura). |
| `title` | `string` | Título mostrado en el Buzón (FR-008). |
| `date` | `string` (ISO `YYYY-MM-DD`) | Fecha de la novedad; determina el orden descendente (FR-008). |
| `body` | `string` | Descripción de la novedad. |

Sin relaciones con otras entidades del dominio del juego (gatos, niveles, etc.) — es contenido puramente informativo.

## Entidad persistida: Estado de lectura del Buzón (`NewsReadRow`)

Nueva tabla Dexie singleton, análoga a `UserRankRow`/`ArcProgressRow` ya existentes en `src/db/index.ts`.

```ts
export interface NewsReadRow {
  id: 1 // fila única (singleton)
  readIds: string[] // ids de NewsEntry ya vistas por el jugador
}
```

- **Regla de estado**: `readIds` es monótono — una vez agregado un `id`, no se retira (mismo patrón que `UserRankRow.claimedThresholds`, `src/db/index.ts:69-73`).
- **Derivado**: "hay novedades no leídas" (FR-009) = `NEWS_ENTRIES.some(entry => !readIds.includes(entry.id))`. No se persiste como campo separado — se deriva en cada render, igual que `hasProgress` en `TitleScreen.tsx` o `lacksEnergy` en `LevelSelectScreen.tsx`.
- **Migración**: tabla nueva (`version(11).stores({ newsRead: 'id' })`) — no requiere migrar filas viejas porque no existía antes; se crea con `readIds: []` en `ensureDefaultProfile()` igual que las demás filas singleton.

## Estado de UI (no persistido): stack de paneles

No es una entidad de datos del juego — es estado efímero de React, vive en el componente que aloja el stack (`HubScreen` para los 6 paneles del Hub + Perfil + Buzón; `LevelSelectScreen` para el punto de entrada adicional del Menú de Tesoros).

```ts
// src/types/screen.ts (nuevo, junto a `Screen`)
export type PanelId =
  | 'Equip'
  | 'Upgrade'
  | 'Gacha'
  | 'Library'        // agrupa CatGuide + EnemyGuide (research.md Decisión 3)
  | 'Settings'
  | 'TreasureMenu'
  | 'PlayerProfile'
  | 'News'
```

- **Forma**: `PanelId[]` — un stack, no un único valor. Vacío = ningún panel abierto (se ve el Hub o el Mapa de Etapas "limpio"). `push(id)` abre un panel encima del actual (FR-013); `pop()` cierra el panel superior y revela el anterior (Hub u otro panel).
- **Sin relación con `Screen`**: el stack de paneles no participa del `switch(screen)` de `App.tsx` — es estado local a `HubScreen`/`LevelSelectScreen`, no del enrutador de nivel superior (research.md Decisión 1).
- **Sin persistencia**: si el jugador recarga la página con un panel abierto, se pierde (mismo comportamiento que hoy: recargar durante Ajustes/Equipar vuelve al Hub) — no es progreso del jugador, es navegación transitoria.
