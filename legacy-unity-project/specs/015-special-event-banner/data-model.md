# Data Model: Banner Especial de Eventos: "Etapas de Fantasía"

## EventTimeWindow (nuevo, `[Serializable]` — no `ScriptableObject`, campo embebido)

Ventana horaria programada, en hora local del dispositivo (research.md §2).

| Campo | Tipo | Notas |
|---|---|---|
| `m_StartLocal` | `string` | Formato `"yyyy-MM-dd HH:mm:ss"`, inclusive. |
| `m_EndLocal` | `string` | Formato `"yyyy-MM-dd HH:mm:ss"`, inclusive. |

**Derivadas**:
- `bool TryGetRange(out DateTime start, out DateTime end)`: parsea ambos campos con `DateTime.TryParseExact(..., DateTimeStyles.None)`; `false` si cualquiera falla.
- `bool Contains(DateTime now)`: `TryGetRange` exitoso, `start <= end`, y `now` entre ambos (inclusive). `false` en cualquier caso inválido (fecha malformada, o `start > end`) — un dato de contenido roto nunca debe activar el banner.

**Validación**: `IsValid => TryGetRange(...) && start <= end`.

## EventBannerDefinition (nuevo `ScriptableObject`, `Assets/Scripts/Model/Battler/EventBannerDefinition.cs`)

Banner especial dentro de `AdventureMap`, no sujeto a desbloqueo secuencial (research.md §1).

| Campo | Tipo | Notas |
|---|---|---|
| `m_Banner` | `ChapterBannerDefinition` | Reutilizado por composición: nombre visible, arte, `LinkedChapter` (la `ChapterDefinition` de la fase especial), `TargetSceneName`, `EnergyCost`. `Region`/`DifficultyRank` de ese banner se ignoran para este flujo (no participan de `MissionRegionDifficultyValidator`, que solo se ejecuta sobre `AdventureMap.Banners`, no sobre `EventBanners`). |
| `m_TimeWindows` | `EventTimeWindow[]` | Una o más ventanas (FR-009). Vacío/null = el banner nunca está activo (Edge Case: build sin datos de evento). |

**Derivadas**:
- `bool HasPlayableDestination => Banner != null && Banner.HasPlayableDestination` (mismo criterio que `ChapterBannerDefinition`).

**Validación**: `IsValid => m_Banner != null && m_Banner.IsValid && m_TimeWindows != null && m_TimeWindows.Length > 0 && Array.TrueForAll(m_TimeWindows, w => w.IsValid)`.

## EventBannerState (nuevo, clase plana runtime — mismo criterio que `ChapterBannerState`, no se serializa/persiste)

| Campo | Tipo | Notas |
|---|---|---|
| `bannerIndex` | `int` | Índice dentro de `AdventureMap.EventBanners`. |
| `isActive` | `bool` | `true` si `now` cae dentro de alguna `EventTimeWindow` del banner (FR-002/FR-010: solapamiento resuelto por OR implícito entre ventanas). |
| `isSelectable` | `bool` | Derivada: `isActive && definition.HasPlayableDestination`. |

## AdventureMap (extendido, `Assets/Scripts/Model/Battler/AdventureMap.cs`)

Campo nuevo, aditivo, sin `FormerlySerializedAs` (no es un renombrado):

| Campo | Tipo | Notas |
|---|---|---|
| `m_EventBanners` | `EventBannerDefinition[]` | Independiente de `m_Banners` (research.md §1). Null/vacío = sin banners de evento; el mapa se comporta exactamente como antes de esta feature. |

`IsValid` de `AdventureMap` **no** cambia (sigue exigiendo solo `m_Banners` no vacío) — un mapa sin eventos configurados sigue siendo válido.

## ChapterDefinition (sin cambios de esquema)

La fase especial ("matanza de mastodontes") es una `ChapterDefinition` más, autorada como asset de contenido (no un tipo nuevo): `ChapterId` propio (`"event_fantasy_stages_mastodon_hunt"`), `PreBattleDialogue`/`PostBattleDialogue` propios (2 líneas cada uno, research.md §5 — ambos obligatorios por Principio I de la constitución, no solo el pre-batalla), `AvailableUnits` reutilizando las 5 `UnitDefinition` de `001-chapter1-vertical-slice`, `EnemyWaves` reutilizando `Chapter1/EnemyWave.asset`, `PlayerBaseMaxHealth`/`EnemyBaseMaxHealth` propios (más altos que Chapter1 — research.md §4), `TreasureRewardId`/`XpReward` propios, `LevelWidth` con su propio valor.

## Flujo de datos (sin persistencia nueva — research.md §6)

```text
AdventureMap.EventBanners[i] --(EventBannerActivationEvaluator.Evaluate)--> EventBannerState[i]
                                                                                  |
                                                        AdventureMapFlowController.TrySelectEventBanner(i)
                                                                                  |
                                        (isActive && energía suficiente) --> LoadScene(Banner.TargetSceneName)
                                                                                  |
                                                            BattleStateManager.SetupChapter() / SetOutcome()
                                                            (agnóstico de ventana horaria — research.md §3)
                                                                                  |
                                        ProgressSaveData.chapters[] (002) + PlayerProgressSaveData (XP/tesoro, 013)
```
