# Contract: Integración de evolución en batalla (`UnitRuntime.Initialize` / `UnitDeploymentController` / `BattleStateManager`)

Capa: `TheBattler.Gameplay`. Describe el único punto de integración entre el sistema de evolución (dashboard, fuera de batalla) y el ciclo de batalla en sí (FR-012) — cómo la forma de evolución vigente de cada unidad del jugador llega, sin cálculo redundante, hasta `UnitRuntime` en el momento de desplegarse.

## `UnitRuntime.Initialize` — nuevo parámetro opcional

```csharp
public void Initialize(
    UnitDefinition definition,
    Team assignedTeam,
    float startLanePosition,
    UnitEvolutionStage stage = UnitEvolutionStage.FormaBase);
```

- **Compatibilidad**: parámetro opcional con valor por defecto `FormaBase` — todos los call-sites existentes de 001/007/008 (`UnitDeploymentController.TryDeploy`, cualquier spawn de `EnemyWaveSpawner`) siguen compilando y comportándose exactamente igual sin modificación, porque `FormaBase` es también el comportamiento actual (leer directamente los campos base de `UnitDefinition`).
- **Comportamiento** (reemplaza el cuerpo actual que lee `m_Source.IdleAnimation`/`AttackAnimation`/`VisualVariant`/`Damage`/`MaxHealth` directamente):
  1. Resuelve `var profile = definition.GetEffectiveCombatProfile(stage);` — **una única vez**, al inicio de `Initialize`, no por frame (research.md §5).
  2. `m_CurrentHealth = profile.MaxHealth` (en vez de `definition.MaxHealth`).
  3. `m_Animator.runtimeAnimatorController = profile.IdleAnimation` (en vez de `m_Source.IdleAnimation`).
  4. La variante visual instanciada es `profile.VisualVariant` (en vez de `m_Source.VisualVariant`), con la misma lógica ya existente de destruir la instancia de un uso anterior del pool antes de instanciar la nueva.
  5. El daño aplicado en `Attack()` pasa a ser `profile.Damage` (en vez de `m_Source.Damage`) — `Attack()` lee el `UnitCombatProfile` resuelto en `Initialize`, no vuelve a llamar `GetEffectiveCombatProfile` en cada golpe.
  6. `MaxHealth` (propiedad pública, hoy `m_Source != null ? m_Source.MaxHealth : 0`) pasa a exponer el valor resuelto (`profile.MaxHealth` una vez inicializado), manteniendo el mismo comportamiento de `0` cuando `m_Source == null`.
  7. `Move()` sigue comparando/asignando contra `profile.IdleAnimation` (en vez de `m_Source.IdleAnimation`) cuando el animator no coincide; igual criterio para `Attack()` con `profile.AttackAnimation`.
- **Postcondición**: una unidad desplegada con `stage != FormaBase` sobre una `UnitDefinition` con datos autorados para esa forma refleja de inmediato animaciones/variante/stats de esa forma (FR-012, SC-005); una unidad desplegada sin datos autorados para `stage` (FR-011) o con `stage = FormaBase` se comporta exactamente igual que hoy (001/007/008), sin ninguna diferencia observable.

## `UnitDeploymentController.TryDeploy` — resolución de la forma vigente

`UnitDeploymentController` no cambia de firma en `Initialize(IBattleResourceSource, IReadOnlyList<UnitDefinition>)` — sigue aceptando el roster ya filtrado (por `TeamFormationRosterFilter`, 005) exactamente igual que hoy. Gana una función de resolución inyectada:

```csharp
public void Initialize(
    IBattleResourceSource resource,
    IReadOnlyList<UnitDefinition> availableUnits,
    Func<string, UnitEvolutionStage> resolveEvolutionStage = null);
```

- `resolveEvolutionStage` es opcional (por defecto `null`); si es `null`, `TryDeploy` usa `UnitEvolutionStage.FormaBase` para toda unidad desplegada — mismo comportamiento que hoy para cualquier caller que no pase este argumento (p. ej. tests existentes de 001/007/008 que construyen `UnitDeploymentController` sin conocer evolución).
- En `TryDeploy(int slotIndex)`, inmediatamente antes de `instance.Initialize(slot.Unit, Team.Player, m_PlayerSpawnLanePosition)`, se resuelve:

```csharp
var stage = resolveEvolutionStage != null
    ? resolveEvolutionStage(slot.Unit.UnitId)
    : UnitEvolutionStage.FormaBase;
instance.Initialize(slot.Unit, Team.Player, m_PlayerSpawnLanePosition, stage);
```

- **Rationale de la firma como `Func<string, UnitEvolutionStage>` (no `UnitEvolutionStageResolver` como dependencia directa)**: `UnitDeploymentController` no necesita conocer `IPlayerProgressStore` ni `UnitProgress[]` — solo necesita, dado un `unitId`, la forma vigente. Esto mantiene la misma superficie mínima de integración que 005 ya documentó para `TeamFormationRosterFilter` (contracts/team-formation.md de 005): la resolución real (`UnitEvolutionStageResolver.Resolve` sobre el `UnitProgress[]` cargado) vive en `BattleStateManager`, que sí conoce el store.

## `BattleStateManager.SetupChapter()` — construcción del resolver

Extiende el mismo patrón que 005 ya documentó para `TeamFormationRosterFilter` (contracts/team-formation.md de 005, §"Integración con la batalla"). Donde 005 deja:

```csharp
var activeTeam = m_PlayerProgressStore.Load().activeTeamUnitIds;
var roster = TeamFormationRosterFilter.Apply(m_ChapterDefinition.AvailableUnits, activeTeam);
m_DeploymentController.Initialize(m_ResourceController, roster);
```

esta feature añade la resolución de evolución sobre el mismo `PlayerProgressSaveData` ya cargado (una única llamada a `store.Load()`, no dos):

```csharp
var playerProgress = m_PlayerProgressStore.Load();
var roster = TeamFormationRosterFilter.Apply(m_ChapterDefinition.AvailableUnits, playerProgress.activeTeamUnitIds);
UnitEvolutionStage ResolveStage(string unitId) =>
    UnitEvolutionStageResolver.Resolve(unitId, playerProgress.unitProgress);
m_DeploymentController.Initialize(m_ResourceController, roster, ResolveStage);
```

- `m_PlayerProgressStore` se resuelve en `Awake()` igual que `m_ProgressStore` (`IChapterProgressStore`, 002) y que el propio `IPlayerProgressStore` que 005 ya introduce para `TeamFormationRosterFilter` — no se añade una segunda instancia de store; se reutiliza la misma resolución de dependencia que 005 ya deja lista.
- `EnemyWaveSpawner` (001) no se modifica: sigue desplegando enemigos vía su propio flujo sin pasar `resolveEvolutionStage`, por lo que todo enemigo se despliega con `UnitEvolutionStage.FormaBase` (comportamiento actual, sin cambio — plan.md Constraints: "esta feature no introduce evolución para unidades enemigas").

## Tabla de comportamiento (cobertura de FR-011/FR-012/FR-013 en batalla)

| Escenario | `resolveEvolutionStage(unitId)` | `stage` pasado a `Initialize` | Resultado |
|---|---|---|---|
| Unidad del jugador sin progreso de evolución guardado | `UnitEvolutionStageResolver.Resolve` → `FormaBase` | `FormaBase` | Comportamiento idéntico a 001/007/008 (FR-011). |
| Unidad del jugador evolucionada a Segunda Forma, con datos autorados | `SegundaForma` | `SegundaForma` | `GetEffectiveCombatProfile(SegundaForma)` devuelve los datos de esa forma (FR-012). |
| Unidad del jugador con `evolutionStage` guardado corrupto/fuera de rango | `UnitEvolutionStageResolver.Resolve` → `FormaBase` (FR-013) | `FormaBase` | Comportamiento idéntico a 001/007/008, sin bloquear el despliegue. |
| Enemigo (`EnemyWaveSpawner`) | (no aplica — no pasa `resolveEvolutionStage`) | `FormaBase` (valor por defecto del parámetro) | Sin cambio de comportamiento respecto a hoy. |

## Doble de test

`UnitEvolutionBattleIntegrationPlayModeTests` (PlayMode, mismo patrón que `TeamFormationBattleIntegrationPlayModeTests` de 005 y `ClassificationAbilityBattlePlayModeTests` de 008): inyecta una implementación en memoria de `IPlayerProgressStore` (por reflexión sobre el campo privado de `BattleStateManager`, mismo mecanismo ya usado para `IChapterProgressStore` en `BattleLoopPlayModeTests`, 002) con un `UnitProgress` conocido en `SegundaForma`/`FormaVerdadera`, despliega esa unidad, y verifica en la instancia de `UnitRuntime` resultante que su `Animator.runtimeAnimatorController`/daño aplicado corresponden a la `UnitEvolutionStageData` de esa forma, no a los campos base (FR-012, SC-005). Un segundo caso cubre Historia 4: tres despliegues sucesivos de la misma `UnitDefinition` en sus tres formas confirman que cada una reproduce una animación de idle/ataque distinta entre sí.
