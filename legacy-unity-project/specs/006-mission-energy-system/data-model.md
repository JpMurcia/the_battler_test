# Data Model: Sistema de Energía y Escalado de Dificultad por Misión

Las entidades marcadas **[SO]** son ScriptableObjects (datos de diseño, Principio V). Las marcadas **[Runtime]** son estado calculado en memoria — no se serializan como asset de diseño ni se persisten en disco. El resto son datos de guardado (clases planas `[Serializable]`, mismo patrón que `ProgressSaveData`/`MenuSettings`/`PlayerProgressSaveData`).

> **Distinción explícita** (spec.md Assumptions): ninguna entidad de este documento es el "Recurso de Batalla (Energía/Dinero)" del Principio II de la constitución (`IBattleResourceSource`/`BattleResourceController`, `001-chapter1-vertical-slice`). Ese recurso se acumula y gasta **dentro** de una batalla para desplegar unidades y no se modifica por esta feature. `MissionEnergyPool` es un recurso de progresión **de mapa de aventuras**, gastado al entrar a una misión, independiente y sin ninguna referencia cruzada al primero.

## MissionEnergySaveData

Agregado raíz que se serializa a JSON tal cual (mismo patrón que `ProgressSaveData`/`MenuSettings`/`PlayerProgressSaveData`). Vive en `TheBattler.Model`. Persistido en `mission-energy.json`.

| Campo | Tipo | Descripción |
|---|---|---|
| `formatVersion` | `int` | Versión del esquema de guardado. Empieza en `1`. |
| `currentEnergy` | `int` | Energía actual del jugador. **Default explícito `-1`** — centinela de "sin dato guardado / corrupto", distinto de `0` (energía real en cero). Ver research.md §1. |
| `lastUpdateTimestampUtc` | `long` | Marca de tiempo (segundos Unix UTC, `DateTimeOffset.ToUnixTimeSeconds()`) de la última vez que se sincronizó la energía. `0` por defecto (sin significado hasta que `currentEnergy != -1`). |

**Reglas de validación**:
- Un `formatVersion` desconocido, o un JSON que no deserializa a esta forma, se trata como "ausencia de progreso de energía" → se devuelve una instancia nueva con los valores por defecto de arriba (`currentEnergy == -1`), nunca lanza una excepción hacia quien llama a `Load()` (FR-011, mismo patrón de tolerancia que 002/003/005).
- `currentEnergy == -1` es la única forma válida de representar "sin dato"; cualquier otro valor negativo no debería producirse por el propio sistema (si un archivo editado a mano trae, p. ej., `-5`, se trata igual que `-1`: sin dato — ver contracts/mission-energy-store.md).
- Independiente de `progress.json` (002), `menu-settings.json` (003) y `player-progress.json` (005): archivo propio, ninguno referencia a otro.

## MissionEnergyConfig **[SO]**

Curva de energía máxima y tasa de regeneración, dato de diseño. Vive en `TheBattler.Model`, mismo nivel que `UnitLevelingConfig` (005).

| Campo | Tipo | Descripción |
|---|---|---|
| `baseMaxEnergy` | `int` | Energía máxima con `characterLevel == 0` (piso de la fórmula). `>= 1`. |
| `maxEnergyPerCharacterLevel` | `int` | Incremento de energía máxima por cada punto de `PlayerCharacterLevel` (005). `>= 0` (un valor `0` es válido: energía máxima fija independiente del nivel, sigue cumpliendo FR-007 vía tasa de regeneración si se decidiera escalar esa en el futuro — hoy no se escala, ver research.md §2). |
| `regenIntervalSeconds` | `int` | Segundos reales necesarios para recuperar 1 punto de energía. `>= 1` (un valor `0` produciría división por cero en `MissionEnergyController.Sync`). |

**Reglas de validación** (ver [contracts/mission-energy-controller.md](./contracts/mission-energy-controller.md)):
- `baseMaxEnergy >= 1`.
- `maxEnergyPerCharacterLevel >= 0`.
- `regenIntervalSeconds >= 1`.

## MissionEnergyPool **[Runtime]**

Nombre usado por spec.md (Key Entities) para el estado combinado que ve el jugador. A nivel de implementación no es una clase propia: es la combinación de `MissionEnergySaveData` (persistido) con `MaxEnergy` (derivado, nunca persistido — mismo criterio que `PlayerCharacterLevel` en 005) expuesta por `MissionEnergyController` (ver [contracts/mission-energy-controller.md](./contracts/mission-energy-controller.md)).

| Propiedad expuesta | Tipo | Cálculo |
|---|---|---|
| `CurrentEnergy` | `int` | `MissionEnergySaveData.currentEnergy` tras aplicar regeneración por tiempo transcurrido en `Sync(...)` (research.md §3); nunca `< 0` ni `> MaxEnergy` tras un `Sync`. |
| `MaxEnergy` | `int` | `MissionEnergyConfig.baseMaxEnergy + MissionEnergyConfig.maxEnergyPerCharacterLevel * characterLevel` (research.md §2), con `characterLevel` = `PlayerCharacterLevelCalculator.Calculate(...)` (005). |

**Transiciones** (todas vía `MissionEnergyController`, sin mutación directa de `MissionEnergySaveData` desde fuera):
- `Sync(nowUtc, characterLevel)`: recalcula `MaxEnergy`, aplica regeneración por tiempo transcurrido, persiste. Ver research.md §3 para el algoritmo exacto (preservación de remanente, tope en el máximo).
- `TryEnterMission(energyCost)`: si `CurrentEnergy >= energyCost`, descuenta `energyCost`, persiste, dispara `EnergyChanged`, devuelve `true`; si no, no modifica nada y devuelve `false` (FR-003/FR-004/FR-005 — atómico, sin estado parcial, sin penalización).

## Region **[SO]**

Agrupación de identidad (país/región) para misiones. Vive en `TheBattler.Model`, mismo nivel que `ChapterBannerDefinition`/`AdventureMap` (004).

| Campo | Tipo | Descripción |
|---|---|---|
| `regionId` | `string` | Identificador estable de la región (p. ej. `"region.imperio-de-los-test"`). Usado como clave, no se muestra directamente. |
| `displayNameKey` | `string` | Clave de `LocalizedTextTable` (003) para el nombre visible de la región. |

**Reglas de validación** (ver [contracts/mission-catalog-extension.md](./contracts/mission-catalog-extension.md)):
- `regionId` no vacío/nulo.
- `regionId` único entre todos los assets `Region` del proyecto (verificable en un test EditMode que recorra los assets, mismo patrón que claves únicas de `LocalizedTextTable`).
- `displayNameKey` no vacío/nulo.
- **No** contiene un array propio de misiones — la pertenencia de una misión a una región vive en `ChapterBannerDefinition.region` (ver abajo), y el orden interno de la región se deriva de `AdventureMap.Banners`, no de un campo aquí (research.md §5, evita doble fuente de verdad con el orden de desbloqueo de 004).

## Extensión de ChapterBannerDefinition (004) **[SO]**

`ChapterBannerDefinition` (definida en `specs/004-adventure-map-banners/data-model.md`) gana tres campos nuevos para esta feature. No se modifica ningún campo existente de esa entidad (`linkedChapter`, `targetSceneName`, `displayNameKey`, `bannerArt` quedan intactos); tampoco se modifican sus propiedades derivadas (`ChapterId`, `HasPlayableDestination`).

| Campo nuevo | Tipo | Descripción |
|---|---|---|
| `energyCost` | `int` | Costo de energía para entrar a esta misión (FR-002). `>= 0` (un costo `0` es válido — misión "gratis" en energía, aunque no hay un caso de diseño así hoy). |
| `region` | `Region` (nullable) | Región/país a la que pertenece esta misión. `null` es válido para un banner sin contenido jugable real todavía (p. ej. "Hacia el Futuro", que hoy tampoco tiene `linkedChapter` — ver 004 data-model.md); un banner sin `region` queda fuera de cualquier validación de progresión de dificultad (FR-008/FR-009 no aplican a misiones sin región). |
| `difficultyRank` | `int` | Valor de dificultad de esta misión. Solo tiene efecto de validación cuando `region != null` — ver regla de FR-009 abajo. `>= 0`. |

**Reglas de validación añadidas** (ver [contracts/mission-catalog-extension.md](./contracts/mission-catalog-extension.md)):
- `energyCost >= 0`.
- `difficultyRank >= 0`.
- **FR-009**: para cada `Region` referenciada por al menos un elemento de `AdventureMap.Banners`, al tomar la subsecuencia de `AdventureMap.Banners` cuyo `region` coincide (en el orden en que aparecen en ese array), `difficultyRank` debe ser no decreciente a lo largo de esa subsecuencia (`difficultyRank[i] >= difficultyRank[i-1]` para índices consecutivos dentro de la subsecuencia). Una región con un solo elemento en su subsecuencia satisface la regla trivialmente (Edge Case de spec.md: "Capítulo 1" es hoy la única misión de su región).
- Un banner con `region == null` no participa en la regla anterior (no tiene subsecuencia).

## Relación con entidades existentes

- **`ChapterBannerDefinition` / `AdventureMap` (004)**: ver "Extensión de ChapterBannerDefinition" arriba. `AdventureMap.Banners` sigue siendo la única fuente de verdad para el orden de desbloqueo (FR-007 de 004) y, ahora también, para el orden de progresión de dificultad dentro de cada región (FR-009 de esta feature) — no se introduce un segundo array ordenado.
- **`ProgressSaveData` / `IChapterProgressStore` (002)**: sin relación directa; esta feature no lee ni escribe `progress.json`. El desbloqueo (004) y la energía (006) son verificaciones independientes que `AdventureMapFlowController.TrySelectBanner` combina (research.md §6): primero desbloqueo/destino jugable (`isSelectable`, 004), después energía suficiente (`TryEnterMission`, esta feature).
- **`PlayerProgressSaveData` / `IPlayerProgressStore` / `PlayerCharacterLevelCalculator` (005)**: se leen en modo solo lectura, únicamente para obtener `characterLevel` como entrada de `MissionEnergyController.Sync(...)` (FR-007). Ningún campo ni método nuevo se añade a `PlayerProgressSaveData`/`IPlayerProgressStore`; `PlayerCharacterLevelCalculator.Calculate(...)` se invoca tal cual, sin modificarse.
- **`BattleResourceController` / `IBattleResourceSource` (001, Principio II)**: sin relación — ver nota de distinción al inicio de este documento. No se modifica ningún archivo de ese sistema.
- **`MenuSettings` / `LocalizedTextTable` (003)**: `Region.displayNameKey` reutiliza `LocalizedTextTable.GetText(key, language)` tal cual, sin cambios a esos tipos — mismo patrón que `ChapterBannerDefinition.displayNameKey` (004).

## IMissionEnergyStore (contrato)

Ver [contracts/mission-energy-store.md](./contracts/mission-energy-store.md) para la interfaz completa.

## MissionEnergyController (contrato de comportamiento)

Ver [contracts/mission-energy-controller.md](./contracts/mission-energy-controller.md) para `Sync`/`TryEnterMission`.

## Extensión de datos de misión y validación de región/dificultad (contrato)

Ver [contracts/mission-catalog-extension.md](./contracts/mission-catalog-extension.md).
