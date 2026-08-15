# Data Model: Sistema Visual Cyber-Modern — Tema Compartido y Reskin de Menú Principal

## `UIThemeCatalog` (nuevo, `Assets/Scripts/Model/Battler/UIThemeCatalog.cs`)

ScriptableObject de datos puros (Principio V) — sin lógica de comportamiento, sin dependencia de `Gameplay`/`View`. Instancia única consumida por todas las pantallas de esta iniciativa: `Assets/ScriptableObjects/Battler/UI/UIThemeCatalog.asset`.

```csharp
public enum ThemeAccent { Cyan, Orange, Purple, PrimaryGradient }

[CreateAssetMenu(menuName = "TheBattler/UI/UIThemeCatalog")]
public sealed class UIThemeCatalog : ScriptableObject
{
    [SerializeField] private Color m_AccentCyan = new Color(0.133f, 0.827f, 0.933f);    // #22d3ee
    [SerializeField] private Color m_AccentOrange = new Color(0.984f, 0.573f, 0.235f);  // #fb923c
    [SerializeField] private Color m_AccentPurple = new Color(0.659f, 0.333f, 0.969f);  // #a855f7

    [SerializeField] private Color m_PrimaryGradientStart = new Color(0.984f, 0.573f, 0.235f); // #fb923c
    [SerializeField] private Color m_PrimaryGradientEnd = new Color(0.937f, 0.267f, 0.267f);   // #ef4444

    [SerializeField] private Color m_PanelBorderColor = new Color(1f, 1f, 1f, 0.14f);
    [SerializeField] private float m_CornerRadiusSmall = 10f;   // consumido en Editor-time por UIThemeSpriteGenerator (research.md §3), no en runtime
    [SerializeField] private float m_CornerRadiusMedium = 14f;  // idem

    [SerializeField] private TMP_FontAsset m_HeadingFont; // Orbitron
    [SerializeField] private TMP_FontAsset m_BodyFont;    // Inter

    public Color AccentCyan => m_AccentCyan;
    public Color AccentOrange => m_AccentOrange;
    public Color AccentPurple => m_AccentPurple;
    public Color PrimaryGradientStart => m_PrimaryGradientStart;
    public Color PrimaryGradientEnd => m_PrimaryGradientEnd;
    public Color PanelBorderColor => m_PanelBorderColor;
    public float CornerRadiusSmall => m_CornerRadiusSmall;
    public float CornerRadiusMedium => m_CornerRadiusMedium;
    public TMP_FontAsset HeadingFont => m_HeadingFont;   // puede ser null — research.md §5 (fallback silencioso)
    public TMP_FontAsset BodyFont => m_BodyFont;         // idem

    public Color Resolve(ThemeAccent accent) => accent switch
    {
        ThemeAccent.Cyan => m_AccentCyan,
        ThemeAccent.Orange => m_AccentOrange,
        ThemeAccent.Purple => m_AccentPurple,
        _ => m_PrimaryGradientStart, // PrimaryGradient: color plano de respaldo para consumidores que no interpolan (p.ej. glow de un solo color)
    };
}
```

Valores por defecto en el código = los del mockup de referencia "Battle Cats Modernizado" (spec.md Assumptions) — el asset `.asset` puede sobreescribirlos sin recompilar (spec.md SC-004).

## `ThemedGlassPanel` (nuevo, `Assets/Scripts/View/Battler/ThemedGlassPanel.cs`)

Componente hermano (research.md §4) — se añade sobre un GameObject que ya tiene `Image` (p. ej. `MainPanel`, `SettingsPanel`). No modifica ni depende de ningún controller existente.

| Miembro | Tipo | Uso |
|---|---|---|
| `m_Theme` | `UIThemeCatalog` (serializado) | Fuente de `PanelBorderColor`. |

`OnEnable()`: aplica el sprite 9-slice generado (research.md §3) al `Image` del mismo GameObject y tiñe su borde con `m_Theme.PanelBorderColor`. Si `m_Theme` es `null`, no hace nada (deja el `Image` tal cual estaba) — mismo criterio de fallback silencioso de research.md §5.

## `ThemedAccentButton` (nuevo, `Assets/Scripts/View/Battler/ThemedAccentButton.cs`)

Componente hermano sobre un GameObject que ya tiene `Button`+`Image` (p. ej. `StartButton`, `ContinueButton`, `SettingsButton`, `ApplyButton`).

| Miembro | Tipo | Uso |
|---|---|---|
| `m_Theme` | `UIThemeCatalog` (serializado) | Fuente de color/gradiente. |
| `m_Accent` | `ThemeAccent` (serializado, default `PrimaryGradient`) | Qué color/gradiente aplicar. |
| `m_Pulse` | `bool` (serializado, default `false`) | Si `true`, reproduce un pulso de escala/glow en bucle vía DOTween (`transform.DOScale(...).SetLoops(-1, LoopType.Yoyo)`), solo en el botón de CTA principal ("Jugar" — mismo criterio visual que `bc-pulse` del mockup de referencia). |

`OnEnable()`: aplica el color (o el primer color del gradiente, si el `Image` no soporta gradiente nativo — ver Notas) al `Image` del mismo GameObject vía `m_Theme.Resolve(m_Accent)`; si `m_Pulse`, arranca el tween. `OnDisable()`: mata el tween (`DOTween.Kill(transform)`) para no dejarlo corriendo sobre un objeto inactivo. Si `m_Theme` es `null`, no hace nada.

## `ThemedGlowIcon` (nuevo, `Assets/Scripts/View/Battler/ThemedGlowIcon.cs`)

Componente hermano que añade/tiñe un `Image` hijo con el sprite de glow radial (research.md §3) detrás de un icono ya existente.

| Miembro | Tipo | Uso |
|---|---|---|
| `m_Theme` | `UIThemeCatalog` (serializado) | Fuente de color. |
| `m_Accent` | `ThemeAccent` (serializado) | Color del glow. |
| `m_GlowImage` | `Image` (serializado, hijo dedicado al glow) | Recibe el sprite generado + el color resuelto. |

`OnEnable()`: `m_GlowImage.sprite = <sprite generado>`; `m_GlowImage.color = m_Theme.Resolve(m_Accent)`. Sin animación propia (el parpadeo tipo `bc-glow` del mockup, si se decide incluir, se hace vía el mismo mecanismo de pulso de `ThemedAccentButton`, no se duplica lógica aquí).

## `MainMenuUIController` / `SettingsPanelController` / `MainMenuFlowController`

**Sin cambios** (research.md §4) — ningún campo, método, propiedad ni evento se añade, renombra o modifica. `MainMenuFlowPlayModeTests.cs` (9 tests existentes) permanece como guardia de regresión sin necesitar ninguna actualización.

## Relación con datos ya existentes

- `MenuSettings`/`IMenuSettingsStore`/`ProgressSaveData` (`002-local-save-progress`, `003-main-menu-config`) no cambian de esquema — el reskin no toca ningún dato persistido.
- `LocalizedTextTable`/`LocalizedTextBinder` (existente) siguen gobernando el *texto* de cada label; los componentes `Themed*` solo tocan color/sprite/fuente, nunca contenido de string — ambos sistemas conviven en el mismo `TMP_Text` sin conflicto.
- Ningún campo de `UnitDefinition`/`EnemyWaveDefinition`/etc. (Principio V, datos de combate) se toca — `UIThemeCatalog` es un catálogo paralelo y no relacionado, exclusivamente de UI.

## Notas

- `Image` de uGUI no soporta gradiente nativo de dos colores; donde el mockup de referencia usa gradiente diagonal (p. ej. el botón "Jugar"), `ThemedAccentButton` aplica `PrimaryGradientStart` como color plano del `Image` — el efecto de gradiente diagonal completo queda como mejora visual opcional de una spec futura (p. ej. vía un shader UI simple), no bloquea esta spec (spec.md no lo exige explícitamente, solo "gradiente" como concepto de datos en el catálogo).
