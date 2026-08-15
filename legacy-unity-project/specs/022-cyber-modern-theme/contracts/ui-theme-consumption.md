# Contract: Consumo del Tema Visual (`UIThemeCatalog` + `Themed*`)

Ver [research.md §4-§5](../research.md) para las decisiones de diseño detrás de este contrato.

## `UIThemeCatalog` — contrato de lectura

```text
Resolve(accent):
    switch accent:
        Cyan   -> AccentCyan
        Orange -> AccentOrange
        Purple -> AccentPurple
        PrimaryGradient (default) -> PrimaryGradientStart
```

**Regla de contrato**: `UIThemeCatalog` no expone ningún método mutador — es de solo lectura para cualquier consumidor en runtime (Principio V: los valores solo cambian editando el asset en el Inspector, nunca desde código). `HeadingFont`/`BodyFont` pueden ser `null`; ningún consumidor debe lanzar una excepción no controlada si lo son (research.md §5).

## `Themed*.OnEnable()` — aplicación de estilo (extensión aditiva, sin tocar controllers existentes)

```text
ThemedGlassPanel.OnEnable():
    si m_Theme == null: return   # fallback silencioso
    Image.sprite = <sprite panel 9-slice generado>
    Image hijo de borde (si existe).color = m_Theme.PanelBorderColor

ThemedAccentButton.OnEnable():
    si m_Theme == null: return
    Image.color = m_Theme.Resolve(m_Accent)
    si m_Pulse: arranca tween de pulso (DOTween, loop infinito)

ThemedAccentButton.OnDisable():
    DOTween.Kill(transform)   # nunca deja un tween corriendo sobre un objeto inactivo/destruido

ThemedGlowIcon.OnEnable():
    si m_Theme == null: return
    m_GlowImage.sprite = <sprite glow radial generado>
    m_GlowImage.color = m_Theme.Resolve(m_Accent)
```

**Regla de contrato**: ninguno de estos tres componentes lee ni escribe ningún campo de `MainMenuUIController`/`SettingsPanelController`/`MainMenuFlowController` — se aplican exclusivamente sobre su propio `Image`/`Button` (o el de un hijo dedicado, en el caso del glow). Añadir, quitar o reordenar un componente `Themed*` en la escena no puede, por construcción, cambiar el resultado de ningún test de `MainMenuFlowPlayModeTests.cs` (esos tests no inspeccionan `Image.color`/`Image.sprite`/`TMP_FontAsset` en ningún assert).

**Regla de contrato (recarga de valores)**: como la aplicación ocurre en `OnEnable()`, un cambio de color/fuente en el asset `UIThemeCatalog.asset` se refleja la próxima vez que el GameObject se activa (reabrir la escena, o volver a entrar en Play Mode) — no hay actualización en caliente frame-a-frame, ni se necesita (spec.md SC-004 solo exige que el cambio se refleje "sin recompilar", no en el mismo frame).

## `UIThemeSpriteGenerator` (Editor-only, `Assets/Editor/Battler/UIThemeSpriteGenerator.cs`) — contrato de generación

```text
GeneratePanelSprite(cornerRadius) -> Texture2D  # rectángulo redondeado, alfa variable, listo para 9-slice
GenerateRadialGlowSprite() -> Texture2D          # gradiente radial blanco->transparente, listo para teñir por Image.color
```

**Regla de contrato**: ambos sprites se generan en escala de grises/blanco puro — el color final lo aplica siempre `Image.color` en runtime (`ThemedGlassPanel`/`ThemedGlowIcon`), nunca se hornea un color específico en el PNG. Esto permite que los mismos dos sprites sirvan para los tres acentos (Cyan/Orange/Purple) y el gradiente primario sin generar una textura por color.

## Acceptance mapping

| Escenario de spec.md | Cubierto por |
|---|---|
| US1 Escenario 1 (Menú sin progreso: nuevo estilo, solo "Jugar" visible) | `Themed*` reskinea sin tocar `MainMenuUIController` — la visibilidad de `ContinueButton` la sigue gobernando exactamente el mismo código que hoy |
| US1 Escenario 2 (Menú con progreso: ambos botones, mismo destino de navegación) | Idéntico — `StartNewGame()`/`ContinueGame()` sin cambios (data-model.md) |
| US1 Escenario 3 (Ajustes con nuevo estilo, mismo comportamiento pendiente/confirmado) | `Themed*` sobre `SettingsPanel`/`SettingsColumn`; `SettingsPanelController` sin cambios |
| US2 (cambiar un color en el asset se refleja sin tocar código) | `UIThemeCatalog` de solo lectura + aplicación en `OnEnable()` |
| Edge case (fuente faltante en el catálogo) | `HeadingFont`/`BodyFont` nulos → el `Themed*` correspondiente no sobreescribe el `TMP_FontAsset` ya puesto en la escena (research.md §5) |
| Edge case (animación no debe bloquear interacción) | El pulso de `ThemedAccentButton` solo anima `transform`/`Image.color` — el `Button.onClick` ya cableado por `MainMenuUIController` sigue pudiendo recibir clicks en cualquier punto del tween |
| Edge case (guardado/progreso no afectado) | Ningún componente `Themed*` toca `IMenuSettingsStore`/`IChapterProgressStore`/`ISceneNavigator` (data-model.md "Relación con datos ya existentes") |
