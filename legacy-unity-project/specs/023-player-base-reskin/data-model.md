# Data Model: Reskin Visual Cyber-Modern — Base del Jugador / Hub

## `UIThemeCatalog` / `ThemedGlassPanel` / `ThemedAccentButton` / `ThemedGlowIcon`

**Sin cambios** (research.md §1) — se consumen tal cual quedaron definidos en `022-cyber-modern-theme`. Ver `specs/022-cyber-modern-theme/data-model.md` para su forma completa. Esta spec solo los añade como componentes hermanos sobre GameObjects nuevos/existentes de `PlayerBase.unity`, sin tocar ninguno de los cuatro scripts.

## `ComingSoonUIController` (nuevo, `Assets/Scripts/View/Battler/ComingSoonUIController.cs`)

Panel placeholder genérico, sin lógica de dominio — el componente más simple posible para resolver FR-007/SC-005 (research.md §2). No depende de `UIThemeCatalog` directamente: el estilo del panel que lo contiene viene de `ThemedGlassPanel`/`ThemedAccentButton` añadidos como hermanos sobre el mismo `GameObject`, igual que cualquier otro panel del Hub.

```csharp
public class ComingSoonUIController : MonoBehaviour
{
    [SerializeField] private TMP_Text m_SystemNameLabel;

    public void ShowSystem(string systemName)
    {
        if (m_SystemNameLabel != null) m_SystemNameLabel.text = systemName;
    }
}
```

| Miembro | Tipo | Uso |
|---|---|---|
| `m_SystemNameLabel` | `TMP_Text` (serializado) | Único dato mostrado: el nombre del sistema todavía no construido ("Gamatoto", "Cápsula de Gatos", "Almacén", "Tienda"). |

`ShowSystem(string systemName)`: actualiza el label y no hace nada más — no activa el `GameObject` (eso lo hace el llamador, mismo patrón que el resto de paneles del Hub vía `SetActive(true)` + `OnPanelOpened()`/`Refresh()`, ver `PlayerBaseDashboardUIController.cs:104-158`). Si `m_SystemNameLabel` es `null`, no hace nada (fallback silencioso, mismo criterio que `022`).

## `PlayerBaseDashboardUIController` (existente, modificado)

Gana 6 campos `[SerializeField]` nuevos, todos opcionales, siguiendo exactamente el mismo patrón nulo-seguro que los 7 campos ya existentes:

| Miembro nuevo | Tipo | Uso |
|---|---|---|
| `m_GamatotoNavigationButton` | `Button` (opcional) | Abre `ComingSoonPanel` con `"Gamatoto"`. |
| `m_GachaNavigationButton` | `Button` (opcional) | Abre `ComingSoonPanel` con `"Cápsula de Gatos"`. |
| `m_StorageNavigationButton` | `Button` (opcional) | Abre `ComingSoonPanel` con `"Almacén"`. |
| `m_ShopNavigationButton` | `Button` (opcional) | Abre `ComingSoonPanel` con `"Tienda"`. |
| `m_ComingSoonPanel` | `GameObject` (opcional) | Contenedor único reutilizado por los 4 botones de arriba. |
| `m_ComingSoonUIController` | `ComingSoonUIController` (opcional) | Recibe `ShowSystem(string)` al abrir. |

`Awake()` gana 4 `AddListener` nuevos (uno por botón, cada uno cerrando sobre el nombre de sistema fijo correspondiente) y `m_ComingSoonPanel.SetActive(false)` inicial, mismo patrón que los 7 paneles existentes. Se agrega un único método privado `OpenComingSoon(string systemName)` reutilizado por los 4 listeners, en vez de 4 métodos casi idénticos — la única diferencia entre los 4 accesos es el string que pasan.

Ningún campo, método público, evento, ni el comportamiento de `Refresh()` existente cambia.

## Relación con datos ya existentes

- `PlayerBaseFlowController` (nivel de personaje, experiencia disponible) no cambia — esta spec es estrictamente de presentación.
- Los 7 paneles ya construidos (`UnitUpgradeUIController`, `TeamFormationUIController`, `BattleItemSelectionUIController`, `CatGuideUIController`, `EnemyGuideUIController`, `TreasureMenuUIController`, `UserRankUIController`) no cambian su lógica interna — solo ganan componentes `Themed*` como hermanos sobre su propio chrome de Hub (el botón que los abre desde el Hub), no sobre su contenido interno (eso es Grupo A, fases V5-V8 de `docs/roadmap-rediseno-visual.md`).
- `ComingSoonUIController` no persiste nada — no hay relación con `PlayerProgressSaveData` ni ningún store.
