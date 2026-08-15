# Phase 0 Research: Capítulo 2 "Hacia el Futuro"

No quedaron marcadores `NEEDS CLARIFICATION` en el Technical Context del plan (la sesión de clarificación de spec.md ya resolvió las tres decisiones de contenido abiertas por el roadmap). Esta investigación cubre: (1) verificar contra el código real que el núcleo de combate de `001` generaliza a un segundo capítulo sin cambios, (2) el estado real de implementación de las dependencias `004`/`006`/`007`/`008`, y (3) las decisiones de diseño de contenido que spec.md delegó explícitamente a esta fase (número/rol de unidades nuevas, enfoque narrativo del antagonista, escalado de dificultad de la oleada enemiga).

## 1. ¿El núcleo de combate de `001` es realmente agnóstico de capítulo?

**Pregunta**: la spec de `001-chapter1-vertical-slice` fue diseñada "para un capítulo genérico", pero nunca se verificó con un segundo capítulo real. ¿Hay algún hardcode oculto de "Capítulo 1" en el código?

**Hallazgo** (lectura directa de `Assets/Scripts/`):

- `BattleStateManager.cs`: el `ChapterDefinition` es un campo `[SerializeField] private ChapterDefinition m_ChapterDefinition` asignado vía Inspector; toda su lógica (`SetupChapter`, `BeginBattle`, `SetOutcome`, guardado de progreso) opera sobre `m_ChapterDefinition.ChapterId`/`PreBattleDialogue`/`PostBattleDialogue`/`AvailableUnits`/`EnemyWaves`/`PlayerBaseMaxHealth`/`EnemyBaseMaxHealth` sin ningún literal de "Capítulo 1". Único hallazgo: un comentario de código (`// T013 + T024 + T030 - orquesta el estado de la partida del Capitulo 1`) que menciona "Capitulo 1" — es un comentario descriptivo del momento en que se escribió, no afecta comportamiento ni requiere cambio funcional para esta feature (se puede actualizar opcionalmente durante la implementación, no es un requisito).
- `EnemyWaveSpawner.cs`: recibe `EnemyWaveDefinition` vía `Initialize(wave)`, sin ninguna referencia a datos concretos de `Chapter1/EnemyWave.asset`.
- `DialoguePlaybackController.cs`: implementa `IDialogueSequencePlayer.Play(IReadOnlyList<DialogueLine> lines, Action completionCallback)` — genérico sobre cualquier lista de `DialogueLine`, sin acoplarse a las líneas concretas de `001`.
- `UnitDeploymentController.cs`/`UnitRuntime.cs`: `UnitDeploymentController.Initialize(resource, availableUnits)` recibe la lista de `UnitDefinition` del capítulo activo; `UnitRuntime.Initialize(definition, team, lanePosition)` es genérico sobre cualquier `UnitDefinition`. Ambos usan un único prefab `UnitRuntime` genérico — la apariencia de cada unidad se resuelve 100% en runtime a partir de `definition.VisualVariant`/`IdleAnimation`/`AttackAnimation`, nunca de un prefab específico por unidad.

**Decision**: no se requiere ningún cambio de código en `Assets/Scripts/Gameplay/Battler/` ni `Assets/Scripts/View/Battler/` para soportar el Capítulo 2. Se confirma la afirmación del feature brief: esto es 100% trabajo de datos + escena.

**Rationale**: el diseño data-driven de `001` (Principio V) ya generalizaba correctamente "un capítulo" en vez de "el Capítulo 1"; esta feature es la primera oportunidad real de confirmarlo con un segundo conjunto de datos, y la confirma sin encontrar ningún hardcode bloqueante.

**Alternatives considered**: no aplica — no había una decisión de diseño que tomar aquí, solo una verificación. Si se hubiera encontrado un hardcode real (p. ej. un `if (chapterId == "chapter_1")` en algún controlador), la alternativa habría sido una generalización mínima y quirúrgica de ese archivo — no ocurrió.

## 2. Estado real de implementación de `004`/`006`/`007`/`008`

**Pregunta**: la spec de esta feature depende explícitamente de `004-adventure-map-banners` (desbloqueo del banner) y `006-mission-energy-system` (escalado de dificultad); las unidades nuevas heredan los contratos de `007-attack-types` y `008-classification-trait-abilities`. ¿En qué estado están esas cuatro features hoy?

**Hallazgo** (verificado contra `Assets/Scripts/` — búsqueda directa de los archivos que sus propios planes declaran como "Source Code" nuevo):

| Feature | Archivos que su plan.md declara | ¿Existen hoy en `Assets/Scripts/`? |
|---|---|---|
| `004-adventure-map-banners` | `ChapterBannerDefinition.cs`, `AdventureMap.cs`, `ChapterBannerUnlockEvaluator.cs`, `AdventureMapFlowController.cs`, `AdventureMap.unity` | No — ninguno existe. `MainMenuFlowController.cs` (`003`, ya implementado) navega directamente a `"Chapter1_Battle"`, sin pasar por un mapa de banners todavía. |
| `006-mission-energy-system` | `MissionEnergySaveData.cs`, `IMissionEnergyStore.cs`, `MissionEnergyConfig.cs`, `Region.cs`, extensión de `ChapterBannerDefinition.cs` | No — ninguno existe (depende de `004`, que tampoco existe). |
| `007-attack-types` | `AttackType.cs` (Core), extensión de `UnitDefinition.cs`/`LaneRegistry.cs`/`UnitRuntime.cs` | No — `UnitDefinition.cs` hoy solo tiene los campos originales de `001` (`unitId`…`team`), sin `AttackType`. |
| `008-classification-trait-abilities` | `ClassificationType.cs`/`SpecialClassificationType.cs`/`AbilityEffectType.cs` (Core), extensión de `UnitDefinition.cs`/`UnitRuntime.cs`, `IEffectReceiver.cs` | No — mismos campos originales de `001`, sin clasificación. |

**Decision**: esta feature se planea asumiendo que su contenido nuclear (diálogo, batalla, unidades, base vs. base — User Stories 1 y 3, FR-001 a FR-007) es implementable y verificable hoy mismo sobre el `UnitDefinition`/`ChapterDefinition` ya existentes de `001`, sin esperar a `004`/`006`/`007`/`008`. La integración con el mapa de aventuras (User Story 2, FR-008/FR-009) queda descrita como contrato de datos listo para aplicarse ([contracts/adventure-map-banner-integration.md](./contracts/adventure-map-banner-integration.md)) en el momento en que `004` exista — mismo criterio de "diseño desacoplado del orden de implementación" que `005` y `006` ya documentaron sobre su propia dependencia de `004` no implementada todavía (ver `specs/006-mission-energy-system/plan.md`, sección final). Las 2 unidades nuevas se definen con la forma actual de `UnitDefinition` (sin `AttackType`/clasificación); si `007`/`008` se implementan antes que el contenido final de esta feature, esos campos nuevos toman sus valores por defecto (`SingleTarget`/`Traitless`/`None`) automáticamente sin ninguna migración (ambas specs lo garantizan explícitamente en su propio data-model.md), y pueden reautorarse con valores no-default después sin recompilar (Principio V).

**Rationale**: bloquear todo el contenido narrativo/de combate de esta feature a la espera de que 4 features previas terminen su implementación de código contradice el Principio VI (simplicidad, no generar dependencias artificiales) y el propio roadmap, que solo marca `004` como dependencia dura y `006`-`008` como opcionales ("Depende de: 001 (patrón a replicar), Fase 4 (desbloqueo), y opcionalmente Fases 7-10"). Separar "contenido nuclear, implementable ahora" de "integración con mapa/energía, implementable cuando su dependencia exista" es consistente con cómo `005`/`006` ya resolvieron el mismo problema.

**Alternatives considered**:
- *Bloquear `/speckit.tasks`/`/speckit.implement` de esta feature hasta que `004`/`006`/`007`/`008` tengan código*: rechazado — introduciría una dependencia de orden de ejecución que ni el roadmap ni la spec de esta feature exigen, y dejaría el contenido narrativo/de unidades (lo único que sí es 100% trabajo de esta feature) esperando sin motivo técnico real.
- *Reimplementar una versión mínima de `ChapterBannerDefinition`/`AttackType`/`ClassificationType` dentro de esta feature "solo para desbloquear el banner"*: rechazado — duplicaría diseño ya cerrado en otras specs (violaría la reutilización explícita que `010` exige de `004`/`006`/`007`/`008`) y generaría trabajo de re-conciliación cuando esas features se implementen de verdad.

## 3. Número y diseño de las unidades jugables nuevas

**Pregunta**: spec.md (Clarifications) fija "entre 1 y 2" unidades nuevas y delega el número exacto y el diseño concreto a esta fase.

**Decision**: **2 unidades nuevas**, pensadas para diferenciarse claramente de las 5 arquetipos ya cubiertos por `001` (Arquero = rango medio, Escudero = tanque cuerpo a cuerpo, Espadachín = daño cuerpo a cuerpo, Lancero = alcance cuerpo a cuerpo extendido, Mago = daño a distancia) y para reforzar visualmente la premisa "Hacia el Futuro" (tecnología avanzada, no magia ni armamento medieval):

1. **Unidad de apoyo/tecnología** (`player_unit_6`): rol de daño de área/soporte a distancia (dron o torreta desplegable), diferenciándose del Mago (daño a distancia único) por su forma de ataque, no por su rango. Ver [data-model.md](./data-model.md) y [contracts/new-unit-definitions.md](./contracts/new-unit-definitions.md).
2. **Unidad blindada pesada** (`player_unit_7`): rol de tanque cuerpo a cuerpo con armadura avanzada, mayor salud que el Escudero a costa de mayor coste/cooldown, reforzando visualmente el salto tecnológico del capítulo frente al Escudero "medieval" de `001`.

**Rationale**: dos unidades (el máximo permitido por spec.md) dan más margen para que la ambientación "Hacia el Futuro" se perciba en el roster jugable (User Story 3/Principio I), sin exceder el alcance de una vertical slice de contenido (Principio VI — sigue siendo del mismo orden de magnitud que las 5 de `001`, no una expansión de roster completa). Elegir roles complementarios a los 5 ya existentes evita duplicar un arquetipo ya cubierto.

**Alternatives considered**:
- *1 sola unidad nueva*: rechazado — deja menos margen para diferenciar visual/narrativamente el capítulo (User Story 3 exige que las unidades disponibles ayuden a identificar de qué trata el capítulo), y spec.md permite explícitamente hasta 2.
- *Diseñar variantes directas de las 5 unidades existentes (p. ej. "Espadachín versión futura")*: rechazado — no aporta un rol de combate distinto, reduce el valor de "unidad nueva" a un simple reskin, y no maximiza la diferenciación narrativa que Principio I/User Story 3 piden.

**Nota de dependencia de contenido, no de código**: cada unidad nueva requiere su propio `RuntimeAnimatorController` de idle, uno de ataque, y un prefab de variante visual (mismo patrón `PlaceholderArt` que `001` usó para las 5 originales) — es trabajo de autoría de arte/animación que esta feature deja como tarea de `/speckit.tasks`/`/speckit.implement`, igual que `001` ya lo dejó para sus 5 unidades originales.

## 4. Escalado de dificultad de la oleada enemiga

**Pregunta**: spec.md (Clarifications) exige reutilizar la plantilla de amenaza enemiga de `001` "con su dificultad escalada usando el sistema de escalado de `006-mission-energy-system`, sin rediseñar la estructura de amenaza desde cero".

**Hallazgo**: `006` (`specs/006-mission-energy-system/data-model.md`, sección "Extensión de ChapterBannerDefinition") no define ninguna fórmula automática que escale stats de `UnitDefinition`/`EnemyWaveDefinition` a partir de un `DifficultyRank` — ese campo es puramente un valor declarado por diseño con una regla de validación (FR-009 de `006`: no decreciente dentro de la misma `Region`, en el orden de `AdventureMap.Banners`). El "escalado de dificultad" real vive en el contenido mismo de la oleada (más entradas, enemigos con más salud/daño), no en una mecánica de motor.

**Decision**: `EnemyWaveDefinition` del Capítulo 2 reutiliza exactamente la misma forma (`WaveEntry[]` con `spawnTimeSeconds`/`unit`/`lanePosition`, sin ningún campo nuevo) que `Chapter1/EnemyWave.asset`, pero su contenido se autora para representar mayor amenaza — más entradas y/o una `UnitDefinition` enemiga con `maxHealth`/`damage` mayores que `Unit_EnemyGrunt` de `001` (valores exactos de balance quedan para `/speckit.tasks`/`/speckit.implement`, igual que `001` nunca fijó sus valores numéricos finales en su propio plan.md). El Capítulo 2 se agrupa en una `Region` nueva (p. ej. `region_hacia_el_futuro`) en vez de reutilizar la región del Capítulo 1, una vez `006` esté implementado — ver Alternatives.

**Rationale**: como el antagonista del Capítulo 2 es explícitamente "distinto del Imperio de los Test/Robot" (Clarifications de spec.md), agruparlo bajo una `Region` nueva es más coherente narrativamente que forzarlo dentro de la región del Capítulo 1 — y no tiene costo de diseño adicional: `006` (data-model.md, `Region`) ya contempla que una región con un único banner satisface trivialmente la regla de dificultad no decreciente (FR-009 de `006`).

**Alternatives considered**:
- *Reutilizar la misma `Region` que el Capítulo 1 ("Imperio de los Test/Robot")*: rechazado — mezclaría bajo una misma región/país narrativo dos arcos que la propia spec.md distingue explícitamente como historias separadas; además obligaría a que `DifficultyRank` del Capítulo 2 sea `>=` el del Capítulo 1 dentro de la misma secuencia, una restricción que no aporta valor de diseño aquí.
- *Diseñar una estructura de oleada nueva (p. ej. oleadas por fases, jefe final)*: rechazado explícitamente por FR-007 de spec.md ("sin requerir una composición de enemigos diseñada desde cero").

## 5. Integración con `004-adventure-map-banners` (banner "Hacia el Futuro")

**Pregunta**: spec.md (Edge Cases) exige documentar precisamente el ajuste que esta feature requiere sobre `004` para que el banner "Hacia el Futuro" deje de estar bloqueado independientemente del progreso.

**Hallazgo**: `004` (`data-model.md`/`contracts/chapter-banner-definition.md`) diseñó `ChapterBannerDefinition.HasPlayableDestination` como una **propiedad derivada** (`LinkedChapter != null`), no como un campo hardcodeado ni una excepción por nombre de banner. El propio spec.md de `004` (Assumptions) ya lo anticipaba: *"'Hacia el Futuro' se especifica en esta feature solo como banner visible y no seleccionable... esta feature no debe requerir cambios cuando esa spec exista — solo debería empezar a tener un destino de batalla asignado"*. Es decir: no hay ningún literal `if (bannerName == "Hacia el Futuro") locked = true` que remover del código — porque ese código (`ChapterBannerDefinition.cs`) ni siquiera existe todavía (ver §2) — y aunque existiera según su propio diseño ya cerrado, el bloqueo actual es enteramente un efecto de que el segundo elemento de `MainAdventureMap.asset` tiene `LinkedChapter == null`, un valor de **datos**, no de código.

**Decision**: la integración de esta feature con `004` es un cambio de **datos únicamente** sobre el asset `Assets/Data/Battler/MainAdventureMap.asset` (una vez `004` esté implementado): asignar `LinkedChapter = Chapter2.asset` y `TargetSceneName = "Chapter2_Battle"` en el segundo elemento de `Banners[]`. `HasPlayableDestination` pasa de `false` a `true` automáticamente por ser derivada — cero líneas de C# se modifican. Documentado en detalle en [contracts/adventure-map-banner-integration.md](./contracts/adventure-map-banner-integration.md).

**Rationale**: cumple la instrucción explícita de spec.md de describir este ajuste "como integración precisa, no ignorarlo" sin inventar una obligación de código que el propio diseño de `004` ya evitó por construcción (propiedades derivadas en vez de campos duplicados, ver `004` contracts/chapter-banner-definition.md).

**Alternatives considered**: no aplica — no hay una decisión de diseño alternativa real aquí, `004` ya cerró esta forma; esta sección documenta el hallazgo de que el ajuste es más simple (solo datos) de lo que el Edge Case de spec.md daba a entender con la palabra "excepción hardcodeada".
