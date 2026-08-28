# Contrato: Panel Shell (`PanelOverlay` + stack de paneles)

Este proyecto no expone API externa; el "contrato" relevante es la interfaz interna entre el Hub/Mapa de Etapas (quien abre paneles) y las pantallas existentes (quienes se muestran dentro de un panel) — para que `tasks.md` pueda desglosar trabajo verificable sin ambigüedad sobre props/eventos.

## `PanelOverlay` (nuevo, `src/screens/shared/PanelOverlay.tsx`)

```ts
interface PanelOverlayProps {
  /** Título accesible del panel, anunciado al abrir (FR-014). */
  labelledBy: string
  /** Se invoca al pulsar el control de cierre del panel. El caller decide si eso
   *  significa "pop del stack" (volver al panel/vista anterior, FR-005/FR-013). */
  onClose: () => void
  children: React.ReactNode
}
```

**Garantías que debe cumplir cualquier implementación**:
1. Al montarse, mueve el foco de teclado dentro del panel (FR-014).
2. Mientras está montado, el foco no puede salir del panel con Tab/Shift+Tab (focus trap, FR-014).
3. Al desmontarse, devuelve el foco al elemento que tenía foco antes de abrir el panel (FR-014).
4. Renderiza siempre con la vista de fondo (Hub o Mapa de Etapas, u otro panel si está apilado) visible y oscurecida detrás — nunca oculta el fondo por completo (FR-004, SC-001).
5. No renderiza ninguna lógica de negocio propia — es un contenedor de layout puro; el contenido (`children`) es exactamente la pantalla existente sin modificar (research.md Decisión 2).

## Contrato de "pantalla convertible a panel"

Las siete pantallas (`TeamScreen`, `UpgradeScreen`, `GachaScreen`, `CatGuideScreen`, `EnemyGuideScreen`, `SettingsScreen`, `TreasureMenuScreen`) mantienen su prop actual:

```ts
interface ExistingScreenProps {
  onNavigate: (screen: Screen) => void
}
```

**Regla de adaptación** (sin tocar el cuerpo de estos componentes, research.md Decisión 2): el componente que las monta dentro de un `PanelOverlay` les pasa un `onNavigate` adaptado que traduce sus llamadas actuales de "volver" en un `pop()` del stack de paneles, preservando el mismo destino semántico:

| Pantalla | Llamada interna actual | Efecto tras esta feature |
|---|---|---|
| `TeamScreen` | `onNavigate('Upgrade')` | Cierra el panel Equipar → vuelve a mostrar el panel Mejorar (que lo abrió) |
| `UpgradeScreen` | `onNavigate('MainMenu')` | Cierra el panel Mejorar → vuelve al Hub |
| `UpgradeScreen` | `onNavigate('Team' \| 'CatGuide' \| 'EnemyGuide' \| 'TreasureMenu')` | Abre (push) el panel correspondiente encima de Mejorar |
| `GachaScreen` | `onNavigate('MainMenu')` | Cierra el panel Cápsula → vuelve al Hub |
| `CatGuideScreen` / `EnemyGuideScreen` | `onNavigate('Upgrade')` | Vuelve a mostrar el panel Mejorar si se llegó desde ahí; si se llegó desde el dock del Hub (Biblioteca), cierra → vuelve al Hub (ver Nota) |
| `SettingsScreen` | `onNavigate('MainMenu')` | Cierra el panel Ajustes → vuelve a la vista que lo abrió (Hub o Perfil de Jugador, FR-013) |
| `TreasureMenuScreen` | `onNavigate('Upgrade')` | Vuelve a mostrar el panel Mejorar si se llegó desde ahí; si se llegó desde el Mapa de Etapas (FR-010), cierra → vuelve al Mapa de Etapas |

**Nota**: donde el destino "hardcodeado" de una pantalla existente (p. ej. `CatGuideScreen` siempre llama `onNavigate('Upgrade')`) ya no coincide 1:1 con "de dónde vino" en el nuevo modelo de stack, el adaptador simplemente hace `pop()` (vuelve a lo que sea que esté debajo en el stack) en vez de forzar un destino fijo — esto es siempre correcto porque el stack ya registra el origen real, y es la razón por la que `research.md` Decisión 1 separa `PanelId` de `Screen`.

## Contrato de apertura (`HubScreen` / `LevelSelectScreen`)

```ts
interface PanelStackController {
  openPanels: PanelId[]           // stack actual, [] = ninguno abierto
  open: (id: PanelId) => void     // push
  close: () => void               // pop del panel superior
}
```

- `HubScreen` posee un `PanelStackController` para: `Equip`, `Upgrade`, `Gacha`, `Library`, `Settings`, `TreasureMenu`, `PlayerProfile`, `News`.
- `LevelSelectScreen` posee su propio `PanelStackController` acotado a `TreasureMenu` únicamente (FR-010) — no comparte stack con el Hub, porque el Mapa de Etapas es una vista base distinta (research.md Decisión 1).
- Ambos controllers son estado de React local (`useState<PanelId[]>([])`), sin persistencia (data-model.md).
