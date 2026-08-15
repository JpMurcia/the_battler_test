# Research: Dashboard de Base del Jugador

## 1. Persistencia de `UnitProgress` / `PlayerExperiencePool` / `TeamFormation`

**Decision**: Un único archivo JSON nuevo (`player-progress.json`, en `Application.persistentDataPath`), gestionado por `LocalPlayerProgressStore` con el mismo patrón de escritura atómica (temp file + reemplazo) y lectura tolerante a fallos que `LocalChapterProgressStore` (002) y `LocalMenuSettingsStore` (003). El agregado raíz (`PlayerProgressSaveData`) contiene las tres entidades de la spec: `unitProgress[]`, `availableExperience` (valor escalar de `PlayerExperiencePool`) y `activeTeamUnitIds[]` (`TeamFormation`).

**Rationale**: Las tres entidades cambian juntas en la operación central de esta feature (`TryLevelUp`: descuenta `availableExperience` **y** sube `unitProgress[i].level` en la misma transacción — FR-005/FR-006) o de forma independiente pero con la misma cadencia ("cambia por una acción explícita del jugador en el dashboard, se persiste de inmediato"). Un solo archivo con una sola escritura atómica evita el escenario de "se guardó el nuevo nivel pero no el gasto de experiencia" (o viceversa) si el proceso se interrumpe entre dos escrituras separadas — más simple y más seguro que tres archivos coordinados. `TeamFormation` viaja en el mismo archivo porque comparte el mismo criterio de fallback ante corrupción (FR-013) y no tiene una cadencia de escritura distinta que justifique aislarla.

**Alternatives considered**:
- Tres archivos independientes (`unit-progress.json`, `experience-pool.json`, `team-formation.json`): rechazado — multiplica el código de store sin beneficio; introduce la posibilidad de inconsistencia entre archivos que un solo archivo con escritura atómica evita por construcción.
- Embeber estos datos dentro de `progress.json` (002) o `menu-settings.json` (003): rechazado — mismo motivo que 003 §1 rechazó compartir archivo con `progress.json`: son entidades independientes (spec.md Assumptions lo dice explícitamente) con distinto dueño conceptual (progreso de capítulo vs. progreso de base/unidades) y no deben acoplar su formato ni su ciclo de fallback.
- `PlayerPrefs`: rechazado por el mismo motivo que 003 §1 — sin punto natural para escritura atómica ni fallback explícito y testeable.

## 2. Curva de costo de mejora de unidad

**Decision**: `UnitLevelingConfig`, un `ScriptableObject` en `TheBattler.Model` con `maxLevel: int` y `experienceCostPerLevel: int[]` (longitud `maxLevel - 1`; el índice `i` es el costo de experiencia para subir del nivel `i + 1` al `i + 2`). Una única instancia compartida (`Assets/Data/Battler/DefaultUnitLevelingConfig.asset`) aplica la misma curva a las 5 unidades del Capítulo 1.

**Rationale**: Principio V exige que el balance viva en datos, no en lógica hardcodeada — un array editable en el Editor (en vez de una fórmula tipo `costo = base * nivel` escrita en C#) permite iterar la curva de costo sin recompilar, igual que `EnemyWaveDefinition.waveEntries` (001) permite iterar oleadas. Una curva **compartida** entre unidades (en vez de una `UnitLevelingConfig` por unidad) es la opción mínima viable: la spec no pide costos distintos por unidad (no hay ninguna FR ni Key Entity que lo exija) y las 5 unidades de la vertical slice no tienen hoy ninguna diferenciación de progresión — introducir configuración por unidad sería anticipar un requisito que no existe (Principio VI/YAGNI). Si el balance futuro lo pide, `UnitLevelingController` ya recibe la config por constructor, así que pasar una config distinta por unidad es una extensión aditiva, no una reestructuración.

**Alternatives considered**:
- Fórmula hardcodeada (`cost = baseCost * level` en C#): rechazada — es exactamente el tipo de "estadística de balance en lógica de comportamiento" que el Principio V prohíbe explícitamente.
- `UnitLevelingConfig` por unidad (referenciado desde `UnitDefinition`): rechazada por ahora — ninguna FR pide progresión diferenciada por unidad hoy; añadir el campo a `UnitDefinition` (001) para un caso no solicitado violaría Principio VI y además tocaría un asset ya validado por 001 sin necesidad.
- Nivel máximo infinito (sin `maxLevel`): rechazada — FR-006 exige poder rechazar una mejora; sin techo, "rechazar" solo podría deberse a experiencia insuficiente, lo cual es válido pero deja sin cubrir el Edge Case implícito de una progresión que debe terminar en algún punto para esta vertical slice. Un `maxLevel` explícito en datos resuelve ambos casos de rechazo (experiencia insuficiente O nivel máximo alcanzado) de forma uniforme en `UnitLevelingController.TryLevelUp`.

## 3. Nivel de personaje: suma vs. otras fórmulas

**Decision**: `PlayerCharacterLevelCalculator.Calculate(ownedUnits, unitProgress[])` — suma el nivel de cada unidad en `ownedUnits` (con `BaseUnitLevel = 1` para cualquier unidad sin `UnitProgress` persistido todavía).

**Rationale**: spec.md Assumptions fija esto explícitamente ("interpretación razonable... si el diseño requiere otra fórmula, se ajusta sin cambiar el resto del alcance"); no hay ninguna razón de diseño nueva descubierta durante este plan para desviarse. Requerir `ownedUnits` (no solo `unitProgress[]` persistido) como parámetro es lo que resuelve el Acceptance Scenario 2 de la Historia 1 ("nivel de personaje refleja el nivel base... sin errores ni valores indefinidos" incluso sin ningún `UnitProgress` guardado) — sumar solo sobre registros persistidos daría `0` en una instalación nueva, no la suma de los niveles base reales.

**Alternatives considered**:
- Promedio de niveles: rechazado por Assumptions de spec.md (fórmula ya fijada como suma salvo necesidad de ajuste, y no surgió ninguna).
- Sumar solo `unitProgress[]` persistido (ignorando unidades sin mejorar): rechazado — produce `0` en el caso "sin haber mejorado ninguna unidad", violando el Acceptance Scenario 2 de la Historia 1 (que exige reflejar el nivel base, no cero).

## 4. `UnitLevelingController` / `TeamFormationController` como clases planas, no `MonoBehaviour`

**Decision**: Ambas son clases C# planas en `TheBattler.Gameplay` (no heredan `MonoBehaviour`), construidas e inyectadas por `PlayerBaseFlowController` (que sí es `MonoBehaviour` y resuelve sus dependencias reales en `Awake()`, mismo patrón que `MainMenuFlowController`/`BattleStateManager`).

**Rationale**: Igual que `ChapterBannerUnlockEvaluator` (004) y `BattleOutcomeResolver` (001), mantener la lógica de negocio fuera de `MonoBehaviour` permite testearla en EditMode con un doble en memoria de `IPlayerProgressStore`, sin cargar ninguna escena — más rápido y más granular que forzar todo a PlayMode. A diferencia de esos dos ejemplos (funciones estáticas puras), `UnitLevelingController`/`TeamFormationController` sí tienen estado y dependencias (el store, el roster de unidades) que cambian entre llamadas (`TryLevelUp` sucesivos), así que se modelan como clases instanciables, no funciones estáticas — mismo espíritu, ajustado a que aquí sí hace falta encapsular estado mutable de sesión (última carga del save).

**Alternatives considered**:
- Meter la lógica de `TryLevelUp`/`TryConfirmFormation` directamente en `PlayerBaseFlowController` (`MonoBehaviour`): rechazado — obligaría a que cualquier test de esa lógica cargue una escena real (PlayMode), perdiendo la cobertura EditMode más rápida y granular que ya tienen `LocalChapterProgressStoreTests`/`LocalMenuSettingsStoreTests`.

## 5. Integración de `TeamFormation` con el roster de batalla sin modificar `ChapterDefinition`

**Decision**: `TeamFormationRosterFilter.Apply(UnitDefinition[] availableUnits, string[] activeTeamUnitIds)` — función estática pura en `TheBattler.Gameplay` que devuelve la intersección de `availableUnits` con los ids guardados, preservando el orden de `availableUnits`. `BattleStateManager.SetupChapter()` (001/002/003, ya modificado varias veces) se modifica una vez más, mínimamente: en vez de pasar `m_ChapterDefinition.AvailableUnits` directo a `m_DeploymentController.Initialize(...)`, primero lo pasa por este filtro junto con `IPlayerProgressStore.Load().activeTeamUnitIds`.

**Rationale**: Es el punto de menor riesgo posible — un único punto de la escena de batalla ya lee `ChapterDefinition.AvailableUnits` para poblar el roster desplegable (`UnitDeploymentController.Initialize`, ver `Assets/Scripts/Gameplay/Battler/BattleStateManager.cs:84`). Insertar un filtro puro justo ahí, sin tocar `ChapterDefinition` (001) ni `UnitDeploymentController` (001) ni su contrato `Initialize(IBattleResourceSource, IReadOnlyList<UnitDefinition>)` (que ya acepta cualquier lista, no necesariamente las 5 completas), satisface FR-009 con el mínimo de superficie de cambio. Es exactamente el mismo criterio que 003 usó para justificar su única modificación a `LocalChapterProgressStore` (extraer una constante) y que 004 documentó como "no se modifica `ChapterDefinition`... el desbloqueo se deriva".

**Casos borde resueltos por el filtro** (cubren FR-010 y FR-013 con la misma regla):
- `activeTeamUnitIds` es `null` o vacío (nunca se confirmó un equipo, o el archivo estaba corrupto y `LocalPlayerProgressStore.Load()` ya lo normalizó a "sin datos") → se devuelve `availableUnits` completo (equipo por defecto, Edge Case de spec.md).
- La intersección resultante queda vacía (p. ej. `activeTeamUnitIds` referencia ids que ya no existen en `availableUnits` porque el roster del capítulo cambió) → también se devuelve `availableUnits` completo. Nunca se entra a una batalla con cero unidades desplegables, consistente con el criterio de "nunca bloquear" ya establecido en 002/003/004.

**Alternatives considered**:
- Añadir un campo `ActiveTeam` a `ChapterDefinition`: rechazado — `ChapterDefinition` es un `ScriptableObject` de diseño (datos de balance compartidos por todos los jugadores); el equipo activo es estado de partida de un jugador concreto, no pertenece ahí (mismo argumento que 002 usó para no tocar `ChapterDefinition` con el guardado de progreso).
- Filtrar dentro de `UnitDeploymentController.Initialize`: rechazado — acoplaría ese componente (que hoy no sabe nada de `IPlayerProgressStore` ni de esta feature) a una dependencia nueva; mantener el filtro como función pura externa, invocada desde `BattleStateManager` (que ya es el orquestador con todas las dependencias de la partida), es más consistente con cómo esa clase ya coordina `IChapterProgressStore` (002).

## 6. Pantalla de organización de equipo: selección pendiente vs. confirmada

**Decision**: `TeamFormationUIController` (View) mantiene la selección en curso (qué unidades están marcadas) en memoria, en la propia capa View, y solo llama a `TeamFormationController.TryConfirmFormation(selectedUnitIds)` al presionar "Confirmar". Salir sin confirmar descarta la selección en curso.

**Rationale**: Mismo patrón ya validado y decidido explícitamente para `SettingsPanelController` en 003 (research.md §4) — una copia de trabajo en la capa de presentación, sin que `TeamFormationController`/`IPlayerProgressStore` necesiten ningún concepto de "pendiente". Resuelve directamente el Edge Case de spec.md ("cierra el juego mientras organiza el equipo sin confirmar... los cambios no confirmados no se guardan").

**Alternatives considered**: Persistir en cada toggle: rechazado por el mismo motivo que 003 rechazó aplicar/persistir ajustes en cada cambio de slider — no es lo que pide el Edge Case de spec.md (que exige que solo sobreviva el último equipo confirmado).

## 7. Fondo visual distinto por aventura (FR-011 / Historia 4, P3)

**Decision**: Para este plan, `PlayerBaseDashboardUIController` (View) expone un campo serializado simple (`Sprite` de fondo) asignado en el Editor sobre `Assets/Scenes/PlayerBase.unity`. No se introduce ninguna abstracción nueva de "proveedor de fondo por banner".

**Rationale**: Hoy solo existe un banner con contenido de batalla real y desbloqueado por defecto ("Imperio de los Test/Robot", ver `004-adventure-map-banners` Assumptions y spec.md §Assumptions de esta feature: "el acceso al dashboard solo ocurre desde banners... con contenido de batalla real"). Con un solo banner jugable, FR-011 ("mismo layout y funciones... variando solo el fondo") se cumple trivialmente — no hay un segundo fondo real con el que contrastar todavía, y `004-adventure-map-banners` **tampoco tiene implementación en C# aún** (solo su plan/data-model; `ChapterBannerDefinition.cs` no existe en el repo — verificado). Construir un mecanismo de selección de fondo por banner ahora sería anticipar una integración con una feature que ni siquiera está implementada, violando Principio VI. La superficie queda limpiamente extensible sin cambios de datos: el día que exista un segundo banner jugable real, sustituir el campo serializado fijo por un `Sprite` que llegue desde `ChapterBannerDefinition.BannerArt` (ya definido en el data-model de 004) es un cambio aditivo y puramente de presentación — no toca ninguna entidad de este plan (`UnitProgress`, `PlayerExperiencePool`, `TeamFormation` no tienen ni deben tener conocimiento del fondo, tal como indica la nota de alcance de la asignación de esta tarea).

**Alternatives considered**:
- Interfaz `IPlayerBaseBackgroundProvider` con una implementación "por banner" ya diseñada ahora: rechazada — no tiene ningún consumidor real hoy (un solo banner), y diseñar la interfaz sin poder validarla contra un segundo caso real es exactamente el tipo de complejidad prematura que Principio VI pide evitar.

## 8. Origen de la experiencia acumulada (fuera de alcance)

**Decision**: Esta feature no define cómo se genera experiencia (spec.md Assumptions lo excluye explícitamente); `PlayerProgressSaveData.availableExperience` es un contador que esta feature solo **gasta** (`UnitLevelingController.TryLevelUp`). Para la validación manual (quickstart.md), se usa un hook de QA análogo a `BattleStateManager.ClearSavedProgress` (`[ContextMenu]`) que otorga una cantidad fija de experiencia de prueba.

**Rationale**: Mantiene el plan estrictamente dentro del alcance de la spec (no inventa una tasa de generación de experiencia por batalla, que pertenece a una feature futura no escrita todavía). El hook de QA sigue el mismo precedente ya usado en 001/002 (`ClearSavedProgress`) para dar a un tester una forma de alcanzar un estado sin depender de contenido no implementado.

## 9. Roster de "unidades propias del jugador"

**Decision**: El roster que ve la pantalla de mejora y la de organización de equipo es `ChapterDefinition.AvailableUnits` (001), referenciado por `PlayerBaseFlowController` vía un campo serializado (`[SerializeField] ChapterDefinition`), exactamente igual que `BattleStateManager` ya lo referencia en `Chapter1_Battle.unity`.

**Rationale**: FR-012 excluye gacha explícitamente — no existe hoy el concepto de "unidades obtenidas/desbloqueadas por el jugador" distinto de "unidades definidas en el capítulo". El roster completo del capítulo **es** el roster del jugador en este MVP (mismo criterio que 001 fijó: 5 unidades, todas disponibles desde el inicio). Introducir una entidad "unidades poseídas por el jugador" sin gacha que las otorgue de forma diferenciada sería anticipar un sistema fuera de alcance (Principio VI). Igual que 003 documentó no poder resolver dinámicamente "a qué capítulo ir" sin 004 implementado, aquí se documenta como supuesto de alcance: cuando exista selección multi-capítulo real (004 implementado en código), `PlayerBaseFlowController` recibirá el `ChapterDefinition` correspondiente al banner de origen en vez de una referencia fija — cambio aditivo, no estructural.

## 10. Estrategia de testing

**Decision**: Mismo split EditMode/PlayMode que 001-004.
- EditMode: `LocalPlayerProgressStoreTests`, `PlayerCharacterLevelCalculatorTests`, `UnitLevelingConfigValidationTests`, `UnitLevelingControllerTests`, `TeamFormationRosterFilterTests`, `TeamFormationControllerTests` — todas sin `MonoBehaviour`, con dobles en memoria de `IPlayerProgressStore` (mismo patrón que `LocalChapterProgressStoreTests`/`ChapterBannerUnlockEvaluatorTests`).
- PlayMode: `PlayerBaseFlowPlayModeTests` (resolución real de dependencias en `Awake()`, exposición de nivel de personaje/experiencia consistente con un save sembrado) y `TeamFormationBattleIntegrationPlayModeTests` (verifica que `BattleStateManager.SetupChapter()` deja en `UnitDeploymentController.Slots` únicamente las unidades del equipo activo guardado).

**Rationale**: Continuación directa del patrón ya validado; maximiza cobertura EditMode (más rápida) dado que la mayoría de la lógica nueva es plana/pura (§4), reservando PlayMode para los dos puntos que sí dependen de `MonoBehaviour`/orden de `Awake()`/escena real.
