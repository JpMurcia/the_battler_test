# Phase 1 Data Model: Migración de The Battler a React Web

**Input**: [spec.md](./spec.md) Key Entities · [research.md](./research.md) Decisión 5 (contenido estático) y Decisión 1 (persistencia)

Cada entidad indica su origen C# (`Assets/Scripts/Model/Battler/` o `Assets/ScriptableObjects/Battler/`), su naturaleza (**Contenido** = JSON estático versionado en el repo; **Guardado** = persistido en `localStorage` por jugador; **Runtime** = derivado en memoria, nunca serializado) y su forma TypeScript equivalente.

## Contenido estático (JSON, `src/data/`)

### UnitDefinition
Origen: `UnitDefinition.cs` (ScriptableObject).

```ts
interface UnitDefinition {
  unitId: string;
  displayName: string;
  cost: number;
  cooldownSeconds: number;
  maxHealth: number;
  damage: number;
  range: number;
  idleAnimation: string;   // ref a atlas Pixi
  attackAnimation: string;
  visualVariant: string;   // ref a atlas Pixi
  team: "Player" | "Enemy";
  attackType: "SingleTarget" | "Area" | "LongDistance" | "MultiHit" | "Critical";
  classificationType: ClassificationType;
  specialClassificationType: SpecialClassificationType;
  traitTargetingAbilities: TraitTargetingAbility[];
  neutralAbilities: NeutralAbility[];
  immunities: Immunity[];
  resistances: Resistance[];
  strongAgainstModifiers: StrongAgainstModifier[];
  evolutionStages: UnitEvolutionStageData[]; // 0-2 entradas: [SegundaForma, FormaVerdadera]
  portrait: string; // ref a imagen
  rarity: UnitRarity;
  multiHitCount: number;
  criticalChance: number; // 0-1
}
```
Método clave a portar: `getEffectiveCombatProfile(unit, stage)` — resuelve todo-o-nada la etapa (nunca mezcla campos base + evolucionada).

### UnitEvolutionStageData
Origen: `UnitEvolutionStageData.cs`. `{ requiredLevel, requiresEvolutionItem, idleAnimation, attackAnimation, visualVariant, damage, maxHealth }`.

### UnitLevelingConfig
Origen: `UnitLevelingConfig.cs`. `{ maxLevel: number (>=2), experienceCostPerLevel: number[] }` — longitud del array = `maxLevel - 1`, indexado por `currentLevel - 1` (no es una curva continua).

### ChapterDefinition
Origen: ScriptableObject en `Assets/ScriptableObjects/Battler/<Chapter>/`. Campos: `chapterId`, `preBattleDialogue: DialogueLine[]`, `postBattleDialogue: DialogueLine[]`, `availableUnits: string[]` (unitId), `enemyWave: EnemyWaveDefinition`, `playerBaseHealth`, `enemyBaseHealth`, `maxSimultaneousEnemies`, `healthThresholdWaveTriggers: HealthThresholdWaveTrigger[]`, `treasureRewardId`, `xpReward`, `firstClearUnitUnlock`, `zombieOutbreakWave`, `levelWidth` (longitud de carril), `battleItemReward`, `battleItemRewardCount`.

### EnemyWaveDefinition / WaveEntry
`{ entries: { spawnTimeSeconds: number; unit: string; lanePosition: number }[] }`.

### ChapterBannerDefinition
Origen: `Assets/Data/Battler/Banners/*.asset`. `{ chapterId, targetSceneName /* → ruta React Router en el port */, displayNameKey, bannerArt, energyCost, region: Region, difficultyRank }`.

### AdventureMap
Origen: `Assets/Data/Battler/MainAdventureMap.asset`. `{ banners: ChapterBannerDefinition[] /* orden = secuencia de desbloqueo */, eventBanners: EventBannerDefinition[] /* excluidos del desbloqueo secuencial */ }`.

### SagaArcDefinition
`{ arcId, displayNameKey, unitCostMultiplier, enemyStrengthMultiplier, levels: string[] /* chapterId[] */, bossLevel?: string, arcCompletionUnitUnlocks: string[], arcCompletionFeatureFlags: string[] }`. Invariante: si `bossLevel` está definido, debe estar contenido en `levels`.

### MissionEnergyConfig
`{ baseMaxEnergy, maxEnergyPerCharacterLevel, regenIntervalSeconds }`.

### BattleItemDefinition / BattleItemCatalog
`{ itemId, displayNameKey, category: BattleItemCategory, magnitude }`.

### TreasureSetDefinition / TreasureSetCatalog
`{ setId, treasureIds: string[], passiveRegenBonus }` — bonus se otorga cuando `obtainedTreasureIds` (guardado) contiene todos los `treasureIds`.

### UserRankThreshold / UserRankRewardCatalog
`{ thresholdId /* estable, desacoplado de requiredRank para evitar doble-cobro tras rebalanceo */, requiredRank, reward: BattleItemDefinition, rewardCount }`.

### EventBannerDefinition / EventTimeWindow
`{ ...ChapterBannerDefinition, timeWindow: { startUtc: string; endUtc: string } }`.

### UnitUnlockCatalog / UnitUnlockEntry
`{ entries: { unitId: string; source: string }[] }`.

### DialogueLine
`{ speakerName: string; portrait: string; text: string }`.

### LocalizedTextTable / LocalizedStringEntry
`{ entries: { key: string; es: string; en: string; zh: string; fr: string }[] }`. Lookup: `getText(key, lang)` → campo del idioma si no vacío, si no `es`, si no `"[" + key + "]"`.

### Enums (`src/data/enums.ts`)
`ClassificationType` (Traitless, Red, Floating, Black, Angel, Alien, Zombie, Relic) · `SpecialClassificationType` (None, Typeless, Colossus, Behemoth, Sage, Metal, Witch, EvaAngel) · `AttackType` (SingleTarget, Area, LongDistance, MultiHit, Critical) · `AbilityEffectType` (Curse, Weaken, Freeze, Slow) · `UnitEvolutionStage` (FormaBase, SegundaForma, FormaVerdadera) · `UnitRarity` (Normal…Collaboration) · `BattleItemCategory` · `Team` (Player, Enemy) · `SupportedLanguage` (Spanish, English, Chinese, French). Convención a preservar: el miembro `0` de cada enum es siempre el default seguro, para que datos antiguos/incompletos degraden con gracia.

## Guardado del jugador (`localStorage`, ver research.md Decisión 1)

### ProgressSaveData (`battler.chapterProgress`)
`{ formatVersion: 1; chapters: ChapterProgressRecord[]; arcs: SagaArcProgressRecord[] }`.
- `ChapterProgressRecord`: `{ chapterId, isCompleted, lastOutcome: "Victory" | "Defeat" }`.
- `SagaArcProgressRecord`: `{ arcId, rewardsGranted: boolean }` — la finalización del arco NUNCA se persigue como flag propio; siempre se deriva de `chapters[]` vía el evaluador (ver `plan.md`, port de `SagaArcProgressEvaluator`).

### PlayerProgressSaveData (`battler.playerProgress`)
```ts
interface PlayerProgressSaveData {
  formatVersion: 1;
  unitProgress: UnitProgress[];
  availableExperience: number;
  activeTeamUnitIds: string[];
  unlockedBonusUnitIds: string[];
  obtainedTreasureIds: string[];
  grantedTreasureSetIds: string[];   // monótono, nunca se revoca
  battleItemInventory: { itemId: string; count: number }[]; // array, no Map — mismo motivo que en C#: forma estable serializable
  encounteredEnemyIds: string[];
  claimedThresholdIds: string[];     // monótono
}
interface UnitProgress {
  unitId: string;
  level: number;              // default 1
  experienceInvested: number;
  evolutionStage: "FormaBase" | "SegundaForma" | "FormaVerdadera"; // default FormaBase
  evolutionItemCount: number;
}
```
Nota de compatibilidad: cada feature de Unity añadió arrays a este DTO de forma aditiva sin subir `formatVersion` (todo campo nuevo por defecto es `[]`/`0`, así que un guardado viejo sigue cargando). El port web debe seguir el mismo patrón: nunca renombrar/eliminar un campo existente de este tipo, solo añadir con default seguro. Al guardar, deduplicar `unitProgress` por `unitId` quedándose con la última entrada (igual que `LocalPlayerProgressStore.Save`).

### MissionEnergySaveData (`battler.missionEnergy`)
`{ formatVersion: 1; currentEnergy: number /* -1 = sin datos aún */; lastUpdateTimestampUtc: number /* epoch segundos */ }`.

### MenuSettings (`battler.menuSettings`)
`{ formatVersion: 1; musicVolume: number; sfxVolume: number; voiceVolume: number; language: SupportedLanguage }` — volúmenes clamp `[0,1]`, `language` default `Spanish`.

## Runtime (memoria, nunca serializado)

### UnitCombatProfile
Snapshot inmutable resuelto al desplegar una unidad: `{ idleAnimation, attackAnimation, visualVariant, damage, maxHealth }`. Método `scaled(profile, multiplier)` → `{ damage: max(1, round(damage*multiplier)), maxHealth: max(1, round(maxHealth*multiplier)) }`, usado para el escalado de dificultad por saga arc (`SagaArcDefinition.enemyStrengthMultiplier`).

### BattleSession (equivalente a `BattleStateManager.cs` — leído en detalle, `Assets/Scripts/Gameplay/Battler/BattleStateManager.cs`)

Estado efímero de una batalla en curso. Se descarta al salir de la pantalla de batalla (no persiste — ver spec.md Edge Cases: recargar a mitad de batalla no está cubierto por el guardado). `BattleStateManager` es en realidad un **orquestador** que compone cuatro sub-sistemas propios más el resto del motor ya documentado, no una única máquina de estados monolítica:

```ts
interface BattleSession {
  outcome: "InProgress" | "Victory" | "Defeat";
  resource: BattleResourceState;        // ver BattleResourceController
  deployment: DeploymentState;          // ver UnitDeploymentController
  wave: EnemyWaveState;                 // ver EnemyWaveSpawner
  playerBase: BaseHealthState;          // ver BaseHealth
  enemyBase: BaseHealthState;
  hasPlayedPreBattleDialogueThisSession: boolean; // no se resetea en retry
}
```

**Flujo real (`SetupChapter` → `BeginBattle` → gameplay → `SetOutcome` → `RetryBattle`)**:

1. **Setup** (`SetupChapter`, líneas 141-277): carga `ProgressSaveData`/`PlayerProgressSaveData`; resuelve el saga-arc activo (el pedido por la pantalla de selección de nivel tiene prioridad sobre uno fijo por escena, y se consume-y-resetea en el mismo frame — mismo patrón que `zombieOutbreakActive`); calcula salud de base enemiga escalada por `enemyStrengthMultiplier` y la posición de la base enemiga como `playerBaseLanePosition + ChapterDefinition.LevelWidth` (no un valor de fábrica del prefab); ajusta el tamaño ortográfico de cámara al ancho real del carril (`BattleCameraFraming` — no aplica en un canvas Pixi de tamaño fijo/responsive, se resuelve distinto en el port, ver nota más abajo); filtra el roster desplegable al equipo activo guardado, con fallback al roster completo del capítulo si no hay equipo (`TeamFormationRosterFilter`); resuelve la etapa de evolución de cada unidad del jugador (los enemigos siempre despliegan en `FormaBase`); reaplica el bono pasivo de regeneración de todos los sets de tesoro ya completados en sesiones anteriores; consume el modo "Zombie Outbreak" si fue solicitado (oleada alternativa); consume los objetos de batalla seleccionados para esta entrada (descuenta inventario, aplica `SpeedBoost`/`ExtraResource`/`BonusTreasure`).
2. **BeginBattle** (líneas 279-302): deshabilita despliegue y oleada; si hay diálogo pre-batalla configurado y **todavía no se reprodujo en esta sesión** (flag que sobrevive a `RetryBattle`, a diferencia del resto del estado), lo reproduce y solo al terminar habilita despliegue+oleada (`OnPreBattleDialogueComplete`) — en un reintento tras derrota, el diálogo pre-batalla **no** se repite.
3. **Gameplay**: `BaseHealth.HealthDepleted` (de cualquiera de las dos bases) dispara `EvaluateOutcome` → `BattleOutcomeResolver.Resolve(enemyDestroyed, playerDestroyed)` — prioridad a la base del jugador, así que un empate en el mismo tick resuelve `Defeat` (ya capturado en spec.md Edge Cases).
4. **SetOutcome** (líneas 326-357): único punto de guardado automático — `SaveChapterOutcome` (persiste y devuelve si esta victoria fue la *primera* para ese capítulo, gate de recompensas de una sola vez); en Victoria llama `GrantLevelRewards`; el diálogo post-batalla (si existe) se reproduce **antes** de notificar a los listeners (p. ej. la pantalla de resultado) solo en Victoria — en Derrota no hay diálogo post-batalla hoy y se notifica de inmediato.
5. **GrantLevelRewards** (líneas 370-498, en cada victoria salvo que se indique lo contrario): XP siempre; tesoro del capítulo siempre (deduplicado); desbloqueo de unidad **solo en la primera victoria**; bono pasivo de cada set de tesoro que se completa exactamente en esta victoria (activo ya en la sesión actual, no solo tras el próximo `SetupChapter`); recompensa de objeto de batalla del capítulo siempre; "Radar de Tesoro" (si el objeto de batalla correspondiente fue seleccionado) otorga un tesoro pendiente aleatorio entre los que faltan de todos los sets; recompensas de arco (unidades + feature flags) exactamente una vez, cuando el último nivel del arco activo queda completo.
6. **RetryBattle** (líneas 531-558): libera todas las `UnitRuntime` desplegadas (pool), resetea el recurso de batalla pero **reaplica** el monto instantáneo ya otorgado por objetos de batalla (el reset lo habría borrado), resetea slots de despliegue/oleada/salud de ambas bases/recarga de Gatorreta, y vuelve a `BeginBattle` — sin repetir el diálogo pre-batalla.

**Sub-sistemas** (cada uno un archivo C# propio en `Assets/Scripts/Gameplay/Battler/`, todos MonoBehaviour salvo indicación):

- **`BattleResourceController`**: el recurso de despliegue en batalla ("Energía/Dinero" del Principio II de la constitución Unity) — **no es lo mismo que la Energía de Misión** (`MissionEnergyController`, que limita cuántas *batallas* se pueden iniciar; este recurso se acumula *dentro* de una batalla y se resetea en cada reintento/entrada). Expone `ApplyPassiveRegenBonus` (sets de tesoro), `AddInstantResource` (objeto "Dinero Extra"), `ResetResource`.
- **`UnitDeploymentController`**: `Initialize(resourceController, roster, resolveStageFn, unitCostMultiplier)` — gestiona coste/cooldown por unidad del roster activo, habilita/deshabilita despliegue como bloque (gate de diálogo).
- **`EnemyWaveSpawner`**: `Initialize(wave, enemyBase, healthThresholdTriggers, maxSimultaneousEnemies, enemyStrengthMultiplier)` — dispara oleadas por tiempo y por umbral de salud de la base enemiga; evento `EnemyEncountered` (usado para `encounteredEnemyIds`, ver Nota de alcance abajo); soporta una oleada alternativa completa "Zombie Outbreak".
- **`BaseHealth`**: `Initialize(team, maxHealth, lanePosition)`, `ResetHealth()`, evento `HealthDepleted`.
- **`BattleLaunchContext`** (estático, no `MonoBehaviour`, no persistido): handoff entre la pantalla de selección de nivel y la escena de batalla — `RequestedArc`, `ZombieOutbreakRequested`, `SelectedBattleItemIds`; cada campo se **consume y resetea en el mismo frame** en `SetupChapter` para no filtrarse a la siguiente escena/reintento. Equivalente web: parámetros de navegación de router (state de `react-router`) leídos una vez al montar `BattleScreen`, no un store persistente.
- **`BattleSessionModifiers`** (estático): `MoveSpeedMultiplier`, fijado por el objeto de batalla `SpeedBoost`; global a la sesión, reseteado a `1f` en cada `SetupChapter` (no en `RetryBattle`).
- **`GatorretaController`** (opcional, `013-empire-of-cats-saga`, `null` en Capítulo 1/2): mecánica de recarga de recurso específica de la saga Empire of Cats; `ResetRecharge()` en reintento.
- **`IBattleOutcomeListener`** / `LevelRewardResult` / `ArcRewardResult`: contrato observer + payloads de evento para que la UI (pantalla de resultado) reaccione sin acoplarse a `BattleStateManager` directamente — equivalente web: callback/evento de `useBattleSessionStore` o un simple `EventEmitter` interno.

### Nota de alcance: sistemas encontrados en `BattleStateManager` que exceden las 5 historias de `spec.md`

La lectura completa reveló systems ya construidos en Unity (specs `013-empire-of-cats-saga`, `014-chapter-scaling-treasure-sets`, `018-battle-items`, `019-library-screens`) que **no** están cubiertos por ninguna de las 5 historias de usuario actuales de `spec.md`: multiplicadores/recompensas de saga-arc, sets de tesoro con bono pasivo, inventario y efectos de objetos de batalla (`SpeedBoost`/`ExtraResource`/`BonusTreasure`), la mecánica "Gatorreta", y el registro de enemigos encontrados (`encounteredEnemyIds`, futura pantalla de biblioteca/bestiario). Todos comparten el mismo `PlayerProgressSaveData`/`ProgressSaveData` ya definido en este documento, así que portarlos más adelante no rompe el modelo de datos ya fijado — pero **no están incluidos en `tasks.md`** como trabajo requerido del MVP; ver Fase 3, tarea final marcada opcional, y considerar una ampliación explícita de `spec.md` con historias nuevas antes de planificarlos en detalle.

## Relaciones clave

- `ChapterBannerDefinition (1) → ChapterDefinition (1)` vía `chapterId`.
- `SagaArcDefinition (1) → ChapterDefinition (*)` vía `levels[]`; `bossLevel` ⊆ `levels[]`.
- `UnitDefinition (1) → UnitEvolutionStageData (0..2)` vía `evolutionStages[]`, indexado por `UnitEvolutionStage - 1`.
- `PlayerProgressSaveData.unitProgress[] (*) → UnitDefinition (1)` vía `unitId` (match ordinal de string, no id numérico).
- `ProgressSaveData.chapters[] (*) → ChapterDefinition (1)` vía `chapterId`; `TreasureSetDefinition.treasureIds[]` se satura contra `PlayerProgressSaveData.obtainedTreasureIds[]`.
- `AdventureMap.banners[]` — el **orden del array** codifica la secuencia de desbloqueo (no hay campo `order` explícito); debe preservarse al exportar a JSON.

## Inventario de assets (para exportación)

- **Unidades**: 16 prefabs de variante visual en `Assets/Prefabs/Battler/Units/` → 16 conjuntos de atlas idle+attack como mínimo (más por cada `evolutionStages` con `visualVariant` propio). **Cero modelos 3D** (`.fbx`) en todo el proyecto — confirma Decisión 2 de `research.md`.
- **Contenido por capítulo**: `Assets/ScriptableObjects/Battler/{Chapter1,Chapter2,EmpireOfCats,Events/MastodonHuntStage}/` — cada uno con `Units/Player/`, `Units/Enemy/`, `Dialogue/PreBattle|PostBattle/`, `EnemyWave.asset`, `PlaceholderArt/*.anim+*.controller`.
- **Banners/mapa**: `Assets/Data/Battler/Banners/` (4 assets) + `Regions/` (3 assets) + `MainAdventureMap.asset`.
- **Configs raíz**: `DefaultMissionEnergyConfig`, `DefaultUnitLevelingConfig`, `EnemyCatalog`, `MainLocalizedText`, `UserRankRewardCatalog` (5 assets en `Assets/Data/Battler/`).
- **Tipografía**: `Baloo2` (5 pesos, `Assets/Hyper_Casual_UI/Fonts/`) — candidato principal para la UI web; `LiberationSans` es solo fallback técnico de TextMeshPro, no necesita portarse.
- **UI**: `Assets/Hyper_Casual_UI/Sprites/` (~400 archivos) es el candidato más probable al tema visual real del juego; `Assets/Assets/UI Elements/` (~228 assets) es un kit de UI plana **confirmado en uso** (referenciado por las 6 escenas de batalla — ver auditoría abajo).
- **Auditoría de referencias real (2026-08-14, grep de GUIDs `.meta` contra `.unity`/`.prefab`/`.asset`/`.anim`/`.controller` de todo el repo)** — corrige una suposición anterior de este documento: los paquetes de terceros **sí están en uso**, no son clutter.
  - `Assets/Characters/` (172 MB, hero_1..30) — **EN USO**: `Unit_Arquero`, `Unit_Escudero`, `Unit_Espadachin`, `Unit_Lancero`, `Unit_Mago` (Capítulo 1), `CentinelaBlindado`, `DronDeApoyo` (Capítulo 2), `Unit_GatoDefensor`, `Unit_GatoLuchador` (Empire of Cats) y `UnitRuntime.prefab` referencian sprites/anims de esta carpeta directamente. **No portar sin antes exportar exactamente los sprites que estos 9 `UnitDefinition` usan** — no la carpeta completa (miles de archivos no referenciados conviven ahí).
  - `Assets/Monsters Creatures Fantasy 2/` — **EN USO**: fuente de sprites de todas las unidades enemigas (`Unit_EnemyGrunt`, `Unit_EnemySentinel`, `Unit_Chucho`/`ChuchoZ`/`Kodrizzz`/`Serpi`/`TheFace`/`Zerpi`).
  - `Assets/Sprites/` (raíz, 4 assets) — **EN USO**: referenciado por `MainMenu`, `AdventureMap` y las 6 escenas de batalla.
  - `Assets/Character/` (singular, 3 MB) — **CONFIRMADO SIN USO**: 0 referencias en todo el repo. Son los clips (`PlayerJump`/`PlayerLand`/`PlayerVictory`/`Enemy.controller`) del sample "2D Platformer" de Unity (`research.md` Decisión 8) — mismo hallazgo, ahora verificado a nivel de GUID.
  - `Assets/Dragon Warrior Files/`, `Assets/Warrior free set/`, `Assets/ShootingSound/`, `Assets/Scripts/Mechanics/` — **CONFIRMADO SIN USO**: 0 referencias cada uno.
  - `Assets/Tiles/` — solo lo referencia `Assets/Prefabs/TilePalette.prefab`, que a su vez **no está colocado en ninguna escena** (0 referencias) — cadena muerta de un solo salto, safe de eliminar junto con `TilePalette.prefab`.
  - No se auditó `Assets/Assets/UI Elements/` a nivel de qué sub-sprites específicos de sus 228 assets están en uso (solo que la carpeta como un todo tiene consumidores reales) — un pase más fino podría reducir qué se porta de ahí, pero la carpeta no es candidata a eliminación completa.
