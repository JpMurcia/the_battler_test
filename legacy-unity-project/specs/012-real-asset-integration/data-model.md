# Phase 1 Data Model: Integración de Arte Real Importado

Esta feature agrega **un campo nuevo** a una clase existente (`UnitDefinition`) y **un campo nuevo de vista** a tres `MonoBehaviour` existentes — no crea ninguna clase de dominio nueva ni ScriptableObject nuevo. La mayoría del trabajo son referencias a `Sprite`/`AnimationClip` reales asignadas por los content builders sobre entidades ya existentes.

## UnitDefinition **[SO]** (clase existente de `001`, campo nuevo)

| Campo | Tipo | Regla |
|---|---|---|
| `m_Portrait` *(nuevo)* | `Sprite` | Frame estático representativo de la unidad (frame `1` del estado `idle` del `hero_N`/criatura asignado). Sin `FormerlySerializedAs` (campo nuevo, no renombrado — mismo criterio que `m_AttackType` de `007`). `null` es un valor por defecto seguro para cualquier `UnitDefinition` serializada antes de esta feature (no rompe `HasValidVisualIdentity`, que no lo evalúa). |

Getter público nuevo: `Portrait => m_Portrait`. Ningún otro campo, propiedad o método de `UnitDefinition` cambia.

## Vistas — nuevo campo de imagen (tres clases existentes de `004`/`005`)

| Vista | Campo nuevo | Se asigna en | Fuente del sprite |
|---|---|---|---|
| `ChapterBannerItemView` | `[SerializeField] private Image m_BackgroundImage` | `Initialize(...)` ya existente, una línea (`if (m_BackgroundImage != null) m_BackgroundImage.sprite = definition.BannerArt;`) | `ChapterBannerDefinition.BannerArt` (campo ya existente desde `004`, hoy sin poblar) |
| `UnitUpgradeRowView` | `[SerializeField] private Image m_PortraitImage` | `Initialize(...)` ya existente, una línea | `UnitDefinition.Portrait` (nuevo, ver arriba) |
| `TeamFormationRowView` | `[SerializeField] private Image m_PortraitImage` | `Initialize(...)` ya existente, una línea | `UnitDefinition.Portrait` |

Ningún método cambia de firma; ningún flujo de datos existente (asignación de nombre, toggle, botones de mejora/evolución, indicadores de bloqueo/completado) se modifica. Guarda de nulo (`if (campo != null)`) consistente con el resto de cada clase, para que una instancia de prefab que todavía no tenga el `Image` cableado en el Inspector no rompa (mismo criterio que ya usan todos los campos existentes de estas tres vistas).

## ChapterBannerDefinition **[SO]** (clase existente de `004`, sin cambio de forma)

`m_BannerArt` (`Sprite`) ya existe desde `004` pero nunca se pobló (`Banner_Chapter1.asset`/`Banner_HaciaElFuturo.asset` tienen `m_BannerArt: {fileID: 0}`, confirmado). Esta feature solo asigna un valor real a un campo que ya existía — no cambia `ChapterBannerDefinition.cs`.

| Asset | `BannerArt` asignado |
|---|---|
| `Banner_Chapter1.asset` | `Free 2D Cartoon Parallax Background/FullBG/1_Mountain.png` (bioma "montaña", coherente con el sketch de referencia para "Imperio de los Test/Robot") |
| `Banner_HaciaElFuturo.asset` | `Free 2D Cartoon Parallax Background/FullBG/2_Desert.png` (bioma distinto — atardecer/desierto, coherente con el sketch) |

Banners de capítulos 3/4 (todavía "por definir", sin `ChapterBannerDefinition` propio) quedan fuera de alcance — no existen como asset hoy.

## BattlerArtLibrary (nueva clase estática, solo Editor — no es una entidad de dominio)

`Assets/Editor/Battler/BattlerArtLibrary.cs`, `#if UNITY_EDITOR`, sin `MonoBehaviour`/`ScriptableObject`. Responsabilidad única: cargar sprites reales y hornear `AnimationClip` de frames, para que los 5 content builders no dupliquen esa lógica (research.md §6). No se serializa, no vive en ninguna escena ni asset — es una utilidad de build-time, análoga en espíritu a las funciones `Create*` ya privadas de cada builder, solo que compartida.

| Miembro | Firma | Uso |
|---|---|---|
| `LoadSprite` | `static Sprite LoadSprite(string path)` | Envoltorio validante sobre `AssetDatabase.LoadAssetAtPath<Sprite>` (excepción clara si falta el archivo, en vez de un `NullReferenceException` aguas abajo). |
| `LoadOrderedFrames` | `static Sprite[] LoadOrderedFrames(string folderPath, int frameCount)` | Carga `1.png`..`{frameCount}.png` de una carpeta `Characters/hero_N/{género}/{estado}/` o `Monsters Creatures Fantasy 2/Sprites/<Criatura>/<estado>/`. |
| `CreateSpriteFrameClip` | `static AnimationClip CreateSpriteFrameClip(string path, Sprite[] frames, float frameRate, bool loop)` | Reemplaza a `CreateScaleClip` para idle/ataque: anima `SpriteRenderer.m_Sprite` vía `ObjectReferenceKeyframe[]` (research.md §1). |
| Constantes de ruta | p. ej. `HyperCasualUiRoot`, `UiElementsRoot`, `ParallaxBackgroundRoot`, `CharactersRoot`, `MonstersRoot`, `PropsRoot` | Centraliza las rutas ya recomendadas por `asset-catalog.md`, en vez de repetir literales de ruta en cada builder. |

## Relación con entidades existentes

- **`UnitRuntime` (`Gameplay`)**: sin cambios — sigue leyendo `UnitDefinition.IdleAnimation`/`AttackAnimation`/`VisualVariant` vía `GetEffectiveCombatProfile`, ahora poblados con controllers/clips reales en vez de placeholder. No lee `Portrait` (ese campo es solo para UI estática de pantallas fuera de batalla).
- **`UnitCombatProfile` (`009-unit-evolution`)**: sin cambios de forma — ya expone `IdleAnimation`/`AttackAnimation`/`VisualVariant`/`Damage`/`MaxHealth`; esta feature no toca evolución de unidad ni sus etapas.
- **`DialoguePlaybackController`**: sin cambios — ya tenía `m_PortraitImage` y ya lee `DialogueLine.Portrait`; sirve de patrón de referencia para los 3 campos nuevos de esta feature, no se modifica.

## Diagrama de relaciones (alto nivel)

```text
UnitDefinition [SO] (001, campo nuevo Portrait)
├── m_IdleAnimation / m_AttackAnimation   → AnimatorController envolviendo AnimationClip
│                                            horneado por BattlerArtLibrary.CreateSpriteFrameClip
│                                            desde Characters/hero_N/... o Monsters Creatures Fantasy 2/...
├── m_VisualVariant                       → prefab overlay (SpriteRenderer) con ícono de
│                                            Hyper_Casual_UI/Sprites/Icons/ en el color de acento de la unidad
└── m_Portrait (nuevo)                    → frame 1 de idle del mismo hero_N/criatura
        ├── leído por UnitUpgradeRowView.m_PortraitImage (nuevo)
        └── leído por TeamFormationRowView.m_PortraitImage (nuevo)

ChapterBannerDefinition [SO] (004, sin cambio de forma)
└── m_BannerArt (ya existía, hoy poblado) → Free 2D Cartoon Parallax Background/FullBG/<bioma>.png
        └── leído por ChapterBannerItemView.m_BackgroundImage (nuevo)
```
