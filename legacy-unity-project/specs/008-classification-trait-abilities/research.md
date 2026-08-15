# Research: Clasificación de Unidades/Enemigos y Habilidades Avanzadas (Trait-Targeting, Neutral, Immunities)

## 1. Ubicación de los enums nuevos: `TheBattler.Core`

**Decision**: `ClassificationType`, `SpecialClassificationType` y `AbilityEffectType` viven en `TheBattler.Core`, junto a `Team`, `BattleOutcome` y `AttackType` (007) — valores de datos compartidos sin dependencia de motor ni de otras capas.

**Rationale**: mismo criterio ya aplicado en 003 (`SupportedLanguage`) y 007 (`AttackType`): son enums puros, consultados tanto desde `Model` (`UnitDefinition`, `TraitTargetingAbility`) como desde `Gameplay` (`UnitRuntime`, matching de objetivos), sin ningún `using UnityEngine.*` más allá de lo que ya usa `Team`. Colocarlos en `Core` evita que `Model`↔`Gameplay` tengan que compartir un enum definido en cualquiera de las dos capas concretas.

**Alternatives considered**:
- Definir `ClassificationType`/`SpecialClassificationType` dentro de `UnitDefinition.cs` (`Model`) como enums anidados: rechazado — `AbilityEffectType` los necesita también desde `Gameplay` (`UnitRuntime.ApplyEffect`) y desde `Immunity`/`TraitTargetingAbility` (`Model`); anidarlos en `UnitDefinition` acoplaría innecesariamente esas clases a esa forma concreta de `UnitDefinition`.

## 2. Tipo especial opcional: enum con miembro `None = 0`, no un `bool` separado ni un tipo nullable

**Decision**: `SpecialClassificationType` declara `None` como primer miembro (`= 0`), seguido de los 7 valores reales (`Typeless`, `Colossus`, `Behemoth`, `Sage`, `Metal`, `Witch`, `EvaAngel`). "Sin tipo especial declarado" se representa como `SpecialClassificationType.None`, no como un campo `bool m_HasSpecialType` adicional ni como `SpecialClassificationType?`.

**Rationale**: mismo patrón que 007 usó para `AttackType.SingleTarget = 0` (data-model.md de 007, research.md §6): el valor por defecto de C#/Unity para un `[SerializeField]` no inicializado es `0`, así que cualquier `UnitDefinition` ya serializado de 001/007 que no declare este campo nuevo deserializa automáticamente a `None` sin migración (FR-010). Un `bool` separado duplicaría la fuente de verdad (¿qué pasa si `hasSpecialType == true` pero el enum queda en su valor por defecto?); `System.Nullable<SpecialClassificationType>` no serializa de forma nativa en el Inspector de Unity sin un wrapper adicional, indirección que ningún FR exige.

**Nota de nomenclatura importante**: `SpecialClassificationType.None` (sin tipo especial declarado, FR-010) es un valor **distinto** de `SpecialClassificationType.Typeless` ("Sin tipo"/Typeless de FR-002, uno de los 7 tipos especiales reales). Confundir ambos rompería FR-003/FR-004 — una unidad con `Typeless` declarado explícitamente SÍ cuenta como "tiene tipo especial" a efectos de la exclusión de "contra todos" (FR-004), mientras que una unidad en `None` no.

**Alternatives considered**:
- Omitir `None` y usar un campo `bool m_HasSpecialClassification` + `SpecialClassificationType m_SpecialClassificationType` (ignorando el segundo si el primero es `false`): rechazado — dos campos para expresar un solo hecho ("¿tipo especial, y cuál?"), con un estado inválido representable (`true` + valor por defecto), sin beneficio sobre un único enum con centinela `None`.

## 3. Representación de habilidades: clases `[Serializable]` anidadas en `UnitDefinition`, no ScriptableObjects propios

**Decision**: `TraitTargetingAbility`, `NeutralAbility` e `Immunity` son clases `[Serializable]` planas (no `ScriptableObject`), declaradas en `TheBattler.Model` y expuestas como arrays (`TraitTargetingAbility[]`, `NeutralAbility[]`, `Immunity[]`) directamente en `UnitDefinition`, con el mismo patrón que `EnemyWaveDefinition.WaveEntry` (001) ya usa para datos anidados sin necesidad de ser un asset independiente.

**Rationale**: ninguna de estas tres entidades se reutiliza entre varias `UnitDefinition` (a diferencia de `UnitDefinition` en sí, que sí se referencia desde `ChapterDefinition`/`EnemyWaveDefinition`) — cada habilidad/inmunidad es un dato de configuración propio de una unidad concreta. Convertirlas en `ScriptableObject` añadiría un archivo `.asset` por habilidad sin ningún beneficio de reutilización o versionado independiente, violando Principio VI (YAGNI) sin que ningún FR lo exija. Siguen siendo datos de diseño editables en el Inspector sin recompilar (Principio V) por ser campos serializados de `UnitDefinition`, que ya es un `ScriptableObject`.

**Alternatives considered**:
- `ScriptableObject` independiente por habilidad (p. ej. `TraitTargetingAbilityDefinition.asset` referenciado desde `UnitDefinition`): rechazado — sobre-ingeniería para datos que no se comparten ni se versionan aparte; ningún FR pide reutilizar la misma habilidad entre dos unidades distintas.
- Una única clase `Ability` genérica con un campo `bool isNeutral` en vez de dos clases separadas (`TraitTargetingAbility`/`NeutralAbility`): rechazado — el propio spec.md las modela como dos Key Entities distintas (más claro para el Inspector: una `NeutralAbility` no necesita exponer campos de targeting que nunca se usan); el costo de tener dos clases pequeñas es menor que el de un campo booleano condicionando qué otros campos son relevantes.

## 4. Mecanismo de "contra todos los tipos estándar": lista completa de 8 valores, sin flag dedicado

**Decision**: no se añade un campo `bool m_TargetsAllStandardTypes` a `TraitTargetingAbility`. Una habilidad "contra todos los tipos estándar" se autora poblando `m_TargetClassificationTypes` con los 8 valores de `ClassificationType` (incluido `Traitless`). El algoritmo de coincidencia (`MatchesTarget`, ver [contracts/trait-targeting-matching.md](./contracts/trait-targeting-matching.md)) no distingue "lista completa" de "lista parcial" — es la misma comprobación de pertenencia en ambos casos.

**Rationale**: FR-003/FR-004 (el núcleo de esta feature) se satisfacen con una única regla de coincidencia sin casos especiales: si el objetivo declara tipo especial, solo importa si ese tipo especial está en `m_IncludedSpecialTypes`; si no lo declara, solo importa si su tipo estándar está en `m_TargetClassificationTypes`. Añadir un flag "todos" sería una segunda forma de expresar el mismo dato (una lista completa), con el riesgo de que ambas queden desincronizadas (flag en `true` pero lista incompleta). Mantener una única fuente de verdad (la lista) es más simple de validar y de testear.

**Alternatives considered**:
- Flag `m_TargetsAllStandardTypes` que, si es `true`, ignora `m_TargetClassificationTypes` en la evaluación: rechazado — introduce una rama condicional adicional en `MatchesTarget` y dos formas de expresar "contra todos" (flag vs. lista completa) sin que SC-003 lo requiera; la lista completa ya es suficiente y es lo que un diseñador marcaría en el Inspector (8 checkboxes) de todos modos.

## 5. Bases (`BaseHealth`) quedan fuera del alcance de trait-targeting/neutral/immunity/Curse

**Decision**: `IEffectReceiver` (ver [contracts/effect-receiver.md](./contracts/effect-receiver.md)) lo implementa únicamente `UnitRuntime`, no `BaseHealth`. Las habilidades de trait-targeting y neutrales solo pueden aplicar su efecto contra objetivos que sean `UnitRuntime` (unidades desplegadas, del jugador o enemigas); nunca contra `m_PlayerBase`/`m_EnemyBase`.

**Rationale**: `ClassificationType`/`SpecialClassificationType`/`Immunity` viven en `UnitDefinition` (FR-001/FR-002/FR-007), y `BaseHealth` no tiene ni ha tenido nunca un `UnitDefinition` asociado (data-model.md de 001, `BaseHealthState`) — no hay ninguna clasificación que evaluar contra una base. Ninguna Acceptance Scenario de spec.md (Historias 2-5) menciona una base como objetivo de una habilidad; todas hablan de "unidad"/"enemigo". Añadir clasificación/inmunidad a `BaseHealth` sin que ningún FR lo pida sería alcance no solicitado.

**Alternatives considered**:
- Añadir `ClassificationType`/`SpecialClassificationType` a `BaseHealth` con un valor fijo `Traitless`/`None` para que sea un `IEffectReceiver` trivial: rechazado — código muerto (`MatchesTarget` contra una base con `Traitless` fijo se comportaría igual que "no implementar la interfaz" para toda habilidad de trait-targeting acotada a tipos concretos, y una `NeutralAbility` contra la base no tiene ningún efecto observable definido por esta spec); más simple omitir la implementación y dejar que el chequeo `target is IEffectReceiver` de `UnitRuntime.Attack()` la excluya de forma natural.

## 6. Estado runtime de Curse: un único campo de temporizador, no un diccionario genérico de efectos activos

**Decision**: `UnitRuntime` añade un único campo `float m_CurseRemainingSeconds` (no una colección genérica `Dictionary<AbilityEffectType, float>` de todos los efectos activos posibles). `ApplyEffect(AbilityEffectType effectType, float durationSeconds)` es genérico en su firma (acepta cualquier valor de `AbilityEffectType`, no solo `Curse`) pero su implementación solo tiene una rama de comportamiento concreta hoy: `effectType == AbilityEffectType.Curse` actualiza `m_CurseRemainingSeconds`; cualquier otro valor no tiene efecto observable en esta feature.

**Rationale**: spec.md Assumptions es explícito — "esta feature no define aquí el catálogo completo de efectos posibles más allá de Curse (...); otros efectos concretos pueden definirse en specs de contenido posteriores (...) sin requerir cambios a esta spec." Construir un diccionario genérico de temporizadores por tipo de efecto hoy sería anticipar un catálogo de efectos que no existe todavía (Principio VI/YAGNI) — cuando un spec futuro añada, por ejemplo, "Congelar", esa feature decide si necesita su propio campo de estado o si puede generalizar el temporizador único en ese momento, con casos de uso reales delante en vez de una especulación ahora. Mantener `ApplyEffect`/`IsImmuneTo` genéricos en la **firma** (en vez de métodos específicos `ApplyCurse()`/`IsImmuneToCurse()`) sí es necesario ya — es el único punto de entrada que `Immunity`/`TraitTargetingAbility`/`NeutralAbility` (que ya son genéricos en `AbilityEffectType` por FR-007) necesitan para funcionar sin casos especiales por tipo de efecto.

**Alternatives considered**:
- `Dictionary<AbilityEffectType, float> m_ActiveEffectTimers`: rechazado por ahora — sin un segundo efecto con comportamiento runtime definido, es una estructura genérica sin consumidor real; el propio spec.md deja explícitamente esa generalización para cuando exista contenido que la necesite.
- Métodos específicos `ApplyCurse()`/`IsImmuneToCurse()` en vez de `ApplyEffect(AbilityEffectType, float)`/`IsImmuneTo(AbilityEffectType)` genéricos: rechazado — `Immunity`/las habilidades ya declaran su `AbilityEffectType` como dato (FR-007 exige inmunidad "a un efecto específico", genérico); un método específico por efecto obligaría a `UnitRuntime` a hacer un `switch` en el llamador en vez de en el receptor, y no escalaría sin tocar la firma de la interfaz en cada spec de contenido futura.

## 7. Punto de inserción en el flujo de combate: extensión de `UnitRuntime.Update()`/`Attack()` (mismo punto que 007)

**Decision**: no se crea ninguna clase de "resolución de habilidades" nueva. `UnitRuntime.Update()` (`Assets/Scripts/Gameplay/Battler/UnitRuntime.cs`) gana un descuento del temporizador de Curse propio (`m_CurseRemainingSeconds -= Time.deltaTime`, con piso en `0`) antes de decidir `Move()`/`Attack()`. `Attack()` gana, inmediatamente después de cada `ApplyDamage(...)` ya existente (tanto en la rama `SingleTarget`/`LongDistance` de un único objetivo como en el bucle de `Area` sobre `FindAllTargetsInRange`, ver 007 contracts/unit-attack-type-behavior.md), una llamada a un método nuevo privado `ApplyAbilitiesTo(ILaneOccupant target)` que evalúa las habilidades de `m_Source` contra `target` — ver [contracts/unit-runtime-ability-behavior.md](./contracts/unit-runtime-ability-behavior.md).

**Rationale**: es exactamente el mismo criterio que 007 ya documentó (research.md §1 de 007) y que esta feature depende de forma directa — `UnitRuntime.Attack()` sigue siendo el único punto donde una unidad aplica cualquier efecto sobre un objetivo, para las tres variantes de `AttackType`. Insertar la evaluación de habilidades justo después de `ApplyDamage` reutiliza el mismo recorrido de objetivos (uno o varios, según `AttackType`) sin duplicar la lógica de selección de objetivo ya resuelta por `LaneRegistry`/007.

**Alternatives considered**:
- Un `IAbilityResolver`/pipeline de habilidades separado, inyectado en `UnitRuntime`: rechazado por el mismo motivo que 007 rechazó `IAttackResolver` — sobre-ingeniería para un conjunto acotado de comportamientos (dos tipos de habilidad + inmunidad + un efecto concreto) sin un segundo consumidor que lo justifique hoy.

## 8. Estrategia de testing

**Decision**: mismo split EditMode/PlayMode que 001-007.
- EditMode: tests puros de `TraitTargetingAbility.MatchesTarget` (sin especial vs. especial incluido vs. especial no incluido, sin depender de Unity engine loop) y de `Immunity.Blocks`; test de valores por defecto (`UnitDefinition` sin estos campos asignados expone `ClassificationType.Traitless`, `SpecialClassificationType.None`, arrays vacíos de habilidades/inmunidades — FR-010).
- PlayMode: extensión de `AttackTypeBattlePlayModeTests`-style (`ScriptableObject.CreateInstance<UnitDefinition>()` + reflexión) cubriendo las 5 historias de usuario: trait-targeting coincide/no coincide (US2), neutral siempre aplica (US3), tipo especial excluido de "contra todos" salvo inclusión explícita (US4), inmunidad bloquea el efecto incluida Curse (US5 Escenario 1), Curse deshabilita habilidades propias mientras está activo y se recuperan al expirar (US5 Escenarios 2-3).

**Rationale**: continúa el patrón ya validado; `MatchesTarget`/`Blocks` son funciones puras sobre enums (sin motor), perfectas para EditMode igual que `LaneRegistryTargetingTests` en 007; el resto requiere el ciclo `Update()`/`Attack()` real de `UnitRuntime`, igual que `AttackTypeBattlePlayModeTests`.
