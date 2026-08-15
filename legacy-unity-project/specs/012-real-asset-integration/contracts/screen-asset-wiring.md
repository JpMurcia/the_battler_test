# Contrato: Cableado de Arte por Pantalla

Formaliza como contrato de implementación la tabla "Recomendación de UI" ya resuelta en [`specs/011-imported-asset-audit/asset-catalog.md#recomendación-de-ui`](../../011-imported-asset-audit/asset-catalog.md#recomendación-de-ui) y lo ya validado visualmente en [`.planning/sketches/001-full-game-mockup/index.html`](../../../.planning/sketches/001-full-game-mockup/index.html). Cada fila es verificable inspeccionando la escena reconstruida en el Editor.

## MainMenu.unity (`MainMenuContentBuilder.cs`)

| Elemento | Pack/sprite | Reemplaza |
|---|---|---|
| Fondo | `Free 2D Cartoon Parallax Background/FullBG/1_Mountain.png` | `Image.color` sólido |
| Botones (Empezar/Base/Ajustes) | `Hyper_Casual_UI/Sprites/Buttons/empty_buttons/*` (un color distinto por botón, etiqueta TMP propia superpuesta) | `Image.color` sólido |
| Toggle de música | `Hyper_Casual_UI/Sprites/Toggle/Toggle_ON.png`/`Toggle_Off.png` | Sin equivalente hoy (nuevo, ya contemplado por `asset-catalog.md`) |

## AdventureMap.unity (`AdventureMapContentBuilder.cs`)

| Elemento | Pack/sprite | Reemplaza |
|---|---|---|
| Fondo de pantalla / `ScrollView` | `Hyper_Casual_UI/Sprites/Panel_Sprites/` (panel contenedor) | `DefaultControls.Resources` (skin built-in `UI/Skin/*.psd`) |
| Fondo de cada `BannerItemTemplate` | `ChapterBannerDefinition.BannerArt` vía nuevo campo `m_BackgroundImage` (ver data-model.md) | `Image.color` sólido |
| Botón "Select" | `Hyper_Casual_UI/Sprites/Buttons/Next Level.png` (o equivalente) | `Image.color` sólido |
| Indicador bloqueado | `Hyper_Casual_UI/Sprites/Icons/lock.png` superpuesto (además del texto TMP ya existente, no en su reemplazo — Edge Case de spec.md: capítulos "por definir" sin `ChapterBannerDefinition" siguen sin fondo real, mostrando solo el candado) | Texto TMP solo |

## PlayerBase.unity (`PlayerBaseContentBuilder.cs`)

| Elemento | Pack/sprite | Reemplaza |
|---|---|---|
| Fondo / paneles de cabecera y mejora de unidad | `Hyper_Casual_UI/Sprites/Panel_Sprites/` (p. ej. equivalente a "Shop Panel"/"Main Menu pannel" según la sub-pantalla) | `Image.color` sólido |
| Fila de unidad en `UnitUpgradeUIController` (`UnitUpgradeRowView`) | `UnitDefinition.Portrait` vía nuevo campo `m_PortraitImage` (ver data-model.md) | Sin imagen (solo texto) |
| Fila de roster en `TeamFormationUIController` (`TeamFormationRowView`) | `UnitDefinition.Portrait` vía nuevo campo `m_PortraitImage` | Sin imagen (solo texto) |
| Botones de navegación (Mapa/Formación/Ajustes) | `Hyper_Casual_UI/Sprites/Buttons/*` | `Image.color` sólido |

## Chapter1_Battle.unity / Chapter2_Battle.unity (`Chapter1ContentBuilder.cs`/`Chapter2ContentBuilder.cs`)

| Elemento | Pack/sprite | Reemplaza |
|---|---|---|
| Base propia | `Mod Assets/Mod Resources/Sprites/Props/Obelisk.png` + overlay `Hyper_Casual_UI/Sprites/Icons/flag.png` | `CreateSquareSprite` (cuadrado de color) |
| Base enemiga | `Mod Assets/Mod Resources/Sprites/Props/Archway.png` + overlay `Hyper_Casual_UI/Sprites/Icons/skull.png` | `CreateSquareSprite` |
| Cuerpo de unidad (jugador/enemigo) | Ver [unit-visual-identity-mapping.md](./unit-visual-identity-mapping.md) | `CreateSquareSprite` + `CreateScaleClip` |
| HUD (pausa/ajustes, si existe overlay de batalla) | `Assets/Assets/UI Elements/Black/1x/{pause,settings}.png` | Iconos planos, **no** `Hyper_Casual_UI` (Edge Case de spec.md: no mezclar estilos ilustrado/plano en la misma pantalla) |
| Fondo de escena de batalla | **Fuera de alcance de esta spec** (research.md §4) — el pedido del usuario fue un fondo/bioma por banner de mapa, no rehacer el fondo de la escena de batalla en sí; queda como trabajo futuro opcional. |

## Verificación de contrato

Cada fila de este contrato es verificable ejecutando el `MenuItem` de "Build ... Content" correspondiente y confirmando en el Editor que el `Image.sprite`/`SpriteRenderer.sprite` señalado ya no es `null` ni un asset bajo una carpeta `PlaceholderArt/` (grep de `CreateSquareSprite`/`PlaceholderArt` en el proyecto tras la migración debe devolver cero resultados en las rutas de arte final — ver quickstart.md).
