# Contract: Activación del Banner de Evento

## `EventTimeWindow.Contains(DateTime now) : bool`

Lógica pura, sin dependencias de motor (mismo precedente que `ChapterBannerUnlockEvaluator`/`BattleOutcomeResolver`).

- Precondición: ninguna (tolera campos vacíos/malformados).
- `false` si `m_StartLocal`/`m_EndLocal` no parsean con `DateTime.TryParseExact("yyyy-MM-dd HH:mm:ss", ..., DateTimeStyles.None)`.
- `false` si `start > end` (ventana invertida — dato de contenido inválido, nunca actúa como "siempre activa").
- En otro caso: `true` si `start <= now && now <= end` (ambos extremos inclusive).

## `EventBannerActivationEvaluator.Evaluate(EventBannerDefinition[] eventBanners, DateTime now) : EventBannerState[]`

Función estática pura (`Assets/Scripts/Gameplay/Battler/EventBannerActivationEvaluator.cs`), mismo criterio de testabilidad que `ChapterBannerUnlockEvaluator.Evaluate`.

- `eventBanners == null` → devuelve `Array.Empty<EventBannerState>()` (no lanza).
- Para cada `EventBannerDefinition` en `eventBanners`, en orden:
  - `isActive` = `true` si **alguna** de sus `TimeWindows` contiene `now` (`Contains`), `false` si `TimeWindows` es null/vacío o ninguna contiene `now`. Ventanas solapadas se resuelven naturalmente por el OR — sin caso especial (FR-010).
  - `isSelectable` = `isActive && definition.HasPlayableDestination`.
  - Un elemento `null` dentro del array se trata como banner siempre inactivo (`isActive = false`, `isSelectable = false`), sin lanzar.

## `AdventureMapFlowController.TrySelectEventBanner(int eventBannerIndex) : bool`

Mismo contrato que `TrySelectBanner` (004/006), aplicado al array `EventBanners`/`EventBannerStates` en vez de `Banners`/`BannerStates`.

- `false` sin efectos secundarios si `EventBannerStates == null`, índice fuera de rango, o `EventBannerStates[i].isSelectable == false` (evento inactivo o sin destino jugable) — **no** navega, **no** descuenta energía.
- Si `isSelectable == true`: intenta `MissionEnergy.TryEnterMission(eventBanner.Banner.EnergyCost)` (mismo `MissionEnergyController` ya usado para banners normales — un único pool de energía en todo el mapa). Si la energía es insuficiente, devuelve `false` sin navegar (FR-006, mismo criterio que 006-mission-energy-system).
- Si hay energía suficiente: descuenta el costo, navega (`m_SceneNavigator.LoadScene(eventBanner.Banner.TargetSceneName)`), devuelve `true`.
- **No** consulta ni modifica `BannerStates`/`m_Banners` (FR-004: completamente independiente del flujo secuencial).

## Comportamiento explícitamente NO implementado (research.md §3)

`BattleStateManager` no gana ninguna referencia a `EventBannerDefinition`, `EventTimeWindow` ni al mapa de aventuras. Una batalla de la fase especial, una vez cargada la escena, se resuelve exactamente igual que cualquier otra `ChapterDefinition` — la expiración de la ventana horaria mientras la batalla está en curso no tiene ningún punto de comprobación que la afecte (US3, FR-008 satisfecho por ausencia de acoplamiento, no por una guarda nueva).
