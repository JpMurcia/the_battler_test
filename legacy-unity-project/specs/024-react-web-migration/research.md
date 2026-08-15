# Phase 0 Research: Migración de The Battler a React Web

**Input**: [spec.md](./spec.md) · Extracción de código fuente de `Assets/Scripts/` (168 archivos C#) y `Assets/ScriptableObjects/Battler/` / `Assets/Data/Battler/`.

Este documento resuelve las decisiones técnicas de la migración que no estaban fijadas por `spec.md` (que es tecnología-agnóstica por diseño). Cada decisión sigue el patrón Decisión / Razón / Alternativas consideradas.

## Hallazgo base: no existe backend que migrar

Confirmado por grep (`UnityWebRequest|HttpClient|Supabase|Firebase|http://|https://` → 0 resultados en `Assets/Scripts`) y por lectura directa de los 4 stores de persistencia. Todo el guardado ocurre en disco local vía `System.IO.File` + `UnityEngine.JsonUtility`, con un patrón idéntico en los 4 stores:

| Store (interfaz → impl) | Archivo | DTO | Descubierto en |
|---|---|---|---|
| `IChapterProgressStore` → `LocalChapterProgressStore` | `progress.json` | `ProgressSaveData` | `Assets/Scripts/Gameplay/Battler/LocalChapterProgressStore.cs` |
| `IMenuSettingsStore` → `LocalMenuSettingsStore` | `menu-settings.json` | `MenuSettings` | `Assets/Scripts/Gameplay/Battler/LocalMenuSettingsStore.cs` |
| `IMissionEnergyStore` → `LocalMissionEnergyStore` | `mission-energy.json` | `MissionEnergySaveData` | `Assets/Scripts/Gameplay/Battler/LocalMissionEnergyStore.cs` |
| `IPlayerProgressStore` → `LocalPlayerProgressStore` | `player-progress.json` | `PlayerProgressSaveData` | `Assets/Scripts/Gameplay/Battler/LocalPlayerProgressStore.cs` |

Cada `Load()` es defensivo: archivo ausente, JSON corrupto, o `formatVersion` no reconocida → siempre devuelve un DTO por defecto válido, nunca lanza una excepción al llamador. Cada `Save()` traga sus propios errores — un fallo de escritura no debe interrumpir el gameplay (citado explícitamente en comentarios junto a FR-005/010/011/013 de specs previas). Esta filosofía "best-effort, nunca bloqueante" es el requisito de diseño más importante a preservar en el port web.

## Decisión 1: Estrategia de persistencia web

**Decisión**: `localStorage`, una clave por store (`battler.chapterProgress`, `battler.menuSettings`, `battler.missionEnergy`, `battler.playerProgress`), cada valor un JSON `stringify` del mismo DTO que hoy define cada `*SaveData` de Unity (mismos nombres de campo, mismo `formatVersion`). Envolver cada `load()`/`save()` en try/catch que cae a un objeto por defecto ante cualquier error de parseo — replica exactamente la tolerancia a fallos de los `Local*Store` de Unity.

**Razón**: `localStorage.setItem` ya es atómico por clave (no hace falta el patrón tmp-file + `File.Move` que usa Unity para evitar corrupción a mitad de escritura — eso era una necesidad específica del sistema de archivos, no del dominio). El split en 4 claves independientes preserva el aislamiento de fallos que ya tiene Unity (un `mission-energy.json` corrupto no debe tumbar `player-progress.json`).

**Alternativas consideradas**: IndexedDB (descartada para v1 — más ceremonia async por un volumen de datos pequeño, sin necesidad de índices/queries; se puede migrar después sin tocar la capa de dominio si `src/services/persistence/*` queda detrás de una interfaz). Backend remoto con cuenta de usuario (fuera de alcance de spec.md — no hay uno en Unity y el proyecto no lo pide).

## Decisión 2: Motor de render — Pixi.js como render principal, R3F reservado

**Decisión**: Todo el juego (mapa de capítulos, carriles de batalla, unidades, Hub, diálogos) se renderiza con **Pixi.js** vía `@pixi/react`. React Three Fiber queda en el stack como dependencia disponible pero no se usa en el alcance de esta spec — no hay ningún modelo 3D que portar.

**Razón**: La búsqueda de `.fbx`/modelos 3D en todo el proyecto Unity dio **cero resultados**. Cada "variante visual" de unidad (`UnitDefinition.VisualVariant`, `UnitEvolutionStageData.VisualVariant`) es un `GameObject` 2D controlado por un `RuntimeAnimatorController` sobre sprite sheets — confirmado en `Assets/ScriptableObjects/Battler/**/PlaceholderArt/*.anim` + `*.controller`. El juego es, técnicamente, 100% 2D. Forzar R3F para esto añadiría una capa WebGL/Three.js redundante con Pixi sin beneficio — viola el Principio VI de la constitución del proyecto Unity (Simplicidad desde el MVP), que esta migración debería seguir respetando en espíritu aunque no gobierne el nuevo repositorio.

**Alternativas consideradas**: R3F con sprites como planos con textura (usar Three.js igual, sacrificando las utilidades 2D de Pixi) — descartada, es más complejo sin ninguna ventaja ya que no hay profundidad/cámara 3D real en ninguna pantalla. Mantener R3F solo por si en el futuro se agrega un fondo parallax 3D o una escena de menú 3D — aceptable como opción futura, no como requisito de esta migración.

## Decisión 3: Formato de animación de unidades

**Decisión**: Cada combinación unidad+etapa (`FormaBase`/`SegundaForma`/`FormaVerdadera`) exporta un atlas de sprites compatible con Pixi (`Spritesheet` JSON hash + PNG, formato TexturePacker) con al menos dos "tags" de animación: `idle` y `attack`, preservando el mínimo del Principio III de la constitución Unity (identidad visual animada, no sprite estático).

**Razón**: Los `.anim`/`.controller` de Unity no son portables directamente a la web; el atlas + JSON de frames es el equivalente estándar en Pixi (`PIXI.Spritesheet`) y permite reproducir el mismo patrón idle/attack por etapa que ya define `UnitDefinition`/`UnitEvolutionStageData` (animaciones propias por etapa, ver Decisión 6).

**Alternativas consideradas**: Spine/DragonBones (rigged skeletal) — descartado, las animaciones actuales son frame-by-frame según el hallazgo de investigación ("sprite-sheet animation" vía Animator), no esqueletos; adoptar un formato rigged implicaría re-autoría de arte fuera de alcance.

## Decisión 4: Bucle de simulación (game loop)

**Decisión**: Un loop de tick fijo desacoplado del render, implementado sobre `requestAnimationFrame` (o el ticker de Pixi, `PIXI.Ticker`), que avanza el estado de combate en pasos de tiempo delta acumulado — igual que Unity resuelve `Update()` por frame pero manteniendo el patrón de "segundos transcurridos" que ya usan las fórmulas portadas (regeneración de energía, cooldowns, multi-hit).

**Razón**: Varias fórmulas ya extraídas dependen explícitamente de tiempo transcurrido en segundos, no de "frames" (p. ej. `MissionEnergyController.Sync` usa `elapsedSeconds / regenIntervalSeconds` con resto acarreado; el intervalo de multi-hit es una constante en segundos, `0.2f`). Portar esa misma aritmética basada en segundos evita reintroducir errores de redondeo por frame-rate variable del navegador.

**Alternativas consideradas**: Recalcular todo en cada render de React (sin loop propio) — descartado, mezclaría lógica de simulación con el ciclo de render de componentes, dificultando el testing unitario de las fórmulas puras ya identificadas.

## Decisión 5: Contenido de datos (ScriptableObjects → JSON)

**Decisión**: Cada catálogo/definición ScriptableObject (`UnitDefinition`, `ChapterDefinition`, `ChapterBannerDefinition`, `SagaArcDefinition`, `MissionEnergyConfig`, `UnitLevelingConfig`, `BattleItemCatalog`, `TreasureSetCatalog`, `UserRankRewardCatalog`, `LocalizedTextTable`, etc.) se exporta a un archivo JSON estático versionado en el nuevo repo (`src/data/**/*.json`), con un esquema TypeScript espejo (ver `data-model.md`). La lectura es 100% estática en build/runtime — no hay edición en vivo desde un editor equivalente a Unity en el alcance de esta migración.

**Razón**: Preserva el espíritu del Principio V de la constitución Unity ("Balance Dirigido por Datos" — estadísticas nunca hardcodeadas en lógica), permitiendo iterar valores de balance sin tocar código, igual que hoy se edita un asset sin recompilar.

**Alternativas consideradas**: Reconstruir un editor de contenido dentro de la app web — fuera de alcance, ningún requisito de spec.md lo pide y añade superficie no solicitada (viola Principio VI en espíritu).

## Decisión 6: Reglas de combate — reglas ya "puras" en C#, port directo a TypeScript

**Decisión**: Portar 1:1 a funciones TypeScript puras (sin dependencias de framework) las piezas de lógica que la investigación confirmó ya están desacopladas de `MonoBehaviour`/Unity en el C# original:

- `BattleOutcomeResolver.Resolve` (victoria/derrota; empate se resuelve a favor de derrota si ambas bases caen el mismo tick).
- `PlayerCharacterLevelCalculator.Calculate`, `UnitLevelingController` (coste indexado por nivel, no fórmula continua).
- `MissionEnergyController.Sync`/`TryEnterMission` (regeneración con resto acarreado, tope en máximo).
- `UnitEvolutionController`/`UnitEvolutionStageResolver` (requisito de nivel + ítem opcional; etapa fuera de rango → `FormaBase` por defecto).
- `TeamFormationController.TryConfirmFormation` (filtra a unidades poseídas, deduplica, rechaza equipo vacío).
- `SagaArcProgressEvaluator.IsArcCompleted` (derivado, nunca cacheado).
- `UnitCombatProfile.Scaled` (escalado de dificultad por saga arc: `max(1, round(base * multiplier))`).
- Pipeline de daño de `UnitRuntime` (`ComputeOutgoingDamage`/`ApplyDamage`): multiplicadores de clasificación (`StrongAgainstModifier`), debilitamiento, crítico (`2x` si `Random < criticalChance`), suelo de daño en 1.
- Inmunidad (bloqueo binario) vs. resistencia (reducción proporcional de duración) sobre efectos de estado (Curse/Weaken/Freeze/Slow).

**Razón**: Estas clases ya son "plain classes" o funciones estáticas en el C# original (no `MonoBehaviour`), varias con comentarios explícitos de que el store es siempre la fuente de verdad y se recargan en cada llamada — es decir, ya están diseñadas sin estado de motor implícito. Portarlas como funciones puras de TypeScript, testeables con Vitest sin ningún mock de UI, es el trabajo de menor riesgo de todo el port y preserva exactamente el balance actual del juego.

**Alternativas consideradas**: Reescribir las fórmulas "desde cero" a partir de la sensación de juego — rechazado, arriesga romper el balance ya validado (crítico ×2, daño mínimo 1, suelo de energía, etc. son decisiones de diseño específicas, no incidentales).

## Decisión 7: Localización

**Decisión**: Tabla plana `{ key, es, en, zh, fr }` por entrada (mismo shape que `LocalizedStringEntry`), con fallback a español si el idioma activo no tiene el campo poblado, y convención de clave visible-si-falta (`"[" + key + "]"`) idéntica a `LocalizedTextTable.GetText`. Selección de idioma persiste en el store de `menuSettings` (equivalente a `MenuSettings.language`, default `Spanish`).

**Razón**: Es exactamente el comportamiento ya implementado y probado en Unity; no hay necesidad de adoptar un motor i18n con pluralización/interpolación avanzada porque el original tampoco lo tiene — cualquier librería (i18next, o un lookup manual) puede envolver este mismo shape sin perder comportamiento.

**Alternativas consideradas**: Migrar directo a i18next con sus convenciones de namespace — aceptable como implementación, siempre que el fallback-a-español y la convención de clave visible se preserven explícitamente (de lo contrario cambia comportamiento observable para el jugador).

## Decisión 8: Qué partes del código Unity NO se portan

La búsqueda de archivos en `Assets/Scripts/` incluye una carpeta `Mechanics/`, `Gameplay/Player*.cs`, `Model/PlatformerModel.cs`, `GameController.cs`, `TokenInstance.cs`, `PatrolPath.cs` — estos corresponden al sample/tutorial oficial de plataformas 2D de Unity ("2D Platformer"), no a lógica de **The Battler**. No se referencian desde ninguna de las clases `*Battler*` extraídas ni desde los flow controllers de Menú/Base/Aventura. **Quedan fuera del alcance de la migración** — no aparecen en la tabla de mapeo de `plan.md`.

## Assets: contradicción con la ruta asumida en la solicitud original

La solicitud original asume que el contenido vive en `Assets/Data`. La investigación confirma que `Assets/Data/Battler/` es en realidad un subconjunto delgado (13 assets: banners, configs por defecto, catálogos raíz) — el grueso real del contenido jugable (unidades por capítulo, diálogos, oleadas de enemigos, arte placeholder) vive en `Assets/ScriptableObjects/Battler/`, organizado por capítulo/saga-arc. `plan.md` y `data-model.md` usan la ruta real.
