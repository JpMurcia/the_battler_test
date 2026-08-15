# The Battler — Plan Técnico: Fases 15+ derivadas del Manual Técnico completo

**Fuente principal**: `The_Battle_Cats_Manual_Tecnico.docx` (96.382 caracteres, añadido 2026-08-02 al notebook de NotebookLM "Battle-cats") — documento de referencia mucho más profundo que las fuentes usadas hasta ahora (wiki suelta, `Base SDDv1.docx`): cubre arquitectura cliente-servidor, pipeline de animación por piezas recortadas, fórmulas de magnificación/crecimiento de stats, catálogo completo de rasgos/habilidades, y 10 sistemas de "modo de juego adicional" (Gamatoto, Ototo Corps, Cat Combos, Talentos, Bibliotecas, Calendario de eventos, Rango de Usuario, Cat Storage) que **no aparecían en ningún documento fuente anterior**.

**Complementa, no reemplaza**: `docs/roadmap-fases.md` (Fases 3-14, spec-kit) y `docs/plan-trabajo-battle-ux.md` (bugs de UX + Tier 3 de gaps detectados con una fuente más superficial). Este documento retoma la numeración de Fases donde `roadmap-fases.md` la dejó (última Fase = 14) y resuelve/actualiza los puntos de Tier 2/3 de `plan-trabajo-battle-ux.md` con información que esa sesión no tenía todavía.

**Cómo leer esto**: primero la comparación (qué dice el manual vs. qué hay en el repo hoy), después las fases nuevas propuestas, después el orden recomendado.

---

## Parte 1 — Comparación: manual técnico vs. estado real del repo

### 1.1 Lo que ya está construido y coincide bien con el manual

| Sistema del manual | Sección | Estado en el repo |
|---|---|---|
| Bucle de juego (dinero pasivo → despliegue → simulación → resolución) | 2.3 | ✅ `001-chapter1-vertical-slice`, núcleo del `BattleStateManager` |
| Persistencia de cuenta separada de estado de partida efímero | 2.4 | ✅ Principio de diseño ya seguido — `002-local-save-progress` solo persiste progreso, no batallas en curso |
| Ficha de stats compartida entre unidad propia y enemiga | 2.6, 6.5 | ✅ `EnemyWaveDefinition` reutiliza `UnitDefinition` para enemigos — mismo esquema de datos, coincide exactamente con el hallazgo del manual ("ambos comparten el mismo motor de combate") |
| Idle + Ataque + variante visual mínima por unidad | 2.5 | ✅ Principio III de la constitución, `UnitDefinition.HasValidVisualIdentity` |
| Rarezas (Normal → Legend) | 5.1 | ✅ `UnitRarity.cs` (incluye además `Collaboration`, no exigido por el manual) |
| Evolución por forma (Base → Segunda → Verdadera) | 5.3 | ✅ `009-unit-evolution`, `UnitEvolutionStageData`, `GetEffectiveCombatProfile` |
| Rasgos estándar y objetivo de habilidad | 6.1, 7.2 | ✅ `ClassificationType` (Traitless/Red/Floating/Black/Angel/Alien/Zombie/Relic) |
| Categorías especiales poco comunes | 6.2 | ✅ `SpecialClassificationType` (Typeless/Colossus/Behemoth/Sage/Metal/Witch/EvaAngel) |
| Trait-targeting / neutral / inmunidades (framework) | 7.2-7.4 | ✅ `TraitTargetingAbility`, `NeutralAbility`, `Immunity` — algoritmo de matching correcto (`008-classification-trait-abilities`) |
| Reutilizar enemigos con multiplicador de dificultad | 6.3, 14.2 (recomendación explícita #2) | ✅ `SagaArcDefinition.EnemyStrengthMultiplier`, `UnitCombatProfile.Scaled` — el proyecto ya sigue esta recomendación de diseño sin haberla leído textualmente |
| Cañón de base con recarga y disparo manual | 9.2 (Cat Cannon) | ✅ `GatorretaController` (`013-empire-of-cats-saga`) |
| Costo de despliegue escalado por capítulo | 5.2, 8 | ✅ `UnitDeploymentController`, multiplicador por arco |
| Tesoros con bonificación pasiva de cuenta | 9.4 | ✅ `TreasureSetDefinition`, `TreasureSetProgressEvaluator` (`014-chapter-scaling-treasure-sets`) — cubre solo el bono de regeneración, ver 1.3 |
| Banner de evento programado por horario | 9.8 (parcial) | 📝 `015-special-event-banner` — especificado, sin implementar |

### 1.2 Lo que el manual describe y **no existe en ningún spec** (ni en `roadmap-fases.md` ni en `plan-trabajo-battle-ux.md`)

Estos son hallazgos nuevos de esta lectura — la Sección 9 completa del manual ("Modos de juego y sistemas adicionales") no tenía ninguna fuente previa que la cubriera:

- **Gamatoto** (9.1): expediciones asíncronas en tiempo real, con la app cerrada.
- **Ototo Corps** (9.2): construcciones que cambian el aspecto/efecto de la Gatorreta y dan bonos pasivos de equipo (reducción de daño por rasgo, resistencia a debuff).
- **Cat Combos** (9.3): bonos pasivos por combinación de unidades en equipo.
- **Talentos y Orbes** (9.5): mejora post-Forma Verdadera.
- **Bibliotecas** — Cat Guide / Enemy Guide / Treasure Menu (9.7): pantallas de consulta de progreso.
- **Rango de Usuario** (9.9): contador de progreso de cuenta = suma de niveles de todas las unidades.
- **Cat Storage** (9.10): depende de gacha, sigue bloqueado por Principio VI.
- **Objetos de Batalla** (3.1): consumibles seleccionables antes de cada nivel (Speed Up, Rich Cat, radar de tesoro, etc.).
- **Catálogo extenso de habilidades** (7.1-7.5, >40 variantes): el framework (`TraitTargetingAbility`/`NeutralAbility`/`Immunity`) existe, pero `AbilityEffectType` solo tiene **un** miembro con comportamiento real (`Curse`). Es el hueco más importante del repo hoy: hay tubería sin contenido.

### 1.3 Discrepancias de precisión — separadas en dos grupos por riesgo de romper specs ya construidos

**Regla aplicada aquí, confirmada contra el propio código del proyecto**: el repo ya sigue un patrón estricto de compatibilidad hacia atrás en cada enum/dato serializado — comentarios como `data-model.md#attacktype-enum - SingleTarget DEBE seguir siendo el miembro 0` ([`AttackType.cs:3`](Assets/Scripts/Core/Battler/AttackType.cs:3)) o `ClassificationType.Traitless DEBE seguir siendo el miembro 0` ([`ClassificationType.cs:3`](Assets/Scripts/Core/Battler/ClassificationType.cs:3)) existen exactamente para que un spec nuevo **nunca invalide** los `UnitDefinition`/`SagaArcDefinition` ya serializados por un spec anterior. Cualquier cosa que rompa esa regla no es "profundizar" un spec — es sobrescribir su funcionamiento. Con ese criterio:

**Grupo A — aditivas, seguras, no tocan ningún spec ya completado (lo que proponen las Fases 15-23 tal cual)**:
- Nuevos miembros de `AbilityEffectType` (hoy solo `Curse`) y de `AttackType` (Multi-Hit, Crítico): agregar al final del enum, igual que ya hizo cada spec anterior. `Curse = 0` y `SingleTarget = 0` no cambian de valor — ningún dato existente se reinterpreta.
- Nuevo campo de bono en `TreasureSetDefinition` (hoy solo `PassiveRegenBonus`): mismo patrón, campo nuevo con default seguro, no se toca el existente.
- Todos los sistemas completamente nuevos (Gamatoto, Ototo Corps, Bibliotecas, Rango de Usuario, Talentos, Objetos de Batalla) — no editan ningún dato de specs anteriores, solo lo leen.

**Grupo B — NO son aditivas, tocarían datos ya serializados por specs completados. Las saco de las Fases 15/16/20 como prerrequisito y las dejo como decisiones aparte, opcionales, que requieren su propio `/speckit.clarify` de migración antes de tocarse:**
- **"Metálico" de especial a estándar**: mover `SpecialClassificationType.Metal` a `ClassificationType` no es agregar un miembro — es **reinterpretar** un valor que ya existe en cualquier `UnitDefinition`/`EnemyWaveDefinition` que hoy tenga `SpecialClassificationType.Metal` asignado (por ejemplo, contenido ya construido en `013`/`014`). Ese dato quedaría en un campo que ya no se lee donde se leía antes. **Se retira como requisito de la Fase 16** — Multi-Hit y Crítico pueden implementarse sin esto (Crítico simplemente no tendrá su contador especial contra Metálicos hasta que se decida esta migración aparte).
- **Separar `EnemyStrengthMultiplier` en HP%/Daño%**: cambiar la firma de `SagaArcDefinition` (un float → dos) rompe cualquier asset ya serializado por `013`/`014` (`Corea.asset`, `Mongolia.asset`) salvo que se migre con cuidado (mismo criterio que el propio `013` documentó para su único cambio de firma deliberado, `IChapterProgressStore.SaveChapterOutcome` de `void` a `bool`, ver `Notes` de `specs/013-empire-of-cats-saga/tasks.md`). **Se retira como requisito de la Fase 20** — Barrera de Base no necesita esto para funcionar.

**Pipeline de animación por piezas recortadas** (2.6, guía práctica explícita del manual): esqueleto de piezas sueltas (cabeza/torso/extremidades) animado por fotogramas clave a 30 fps — técnica de *producción* de arte, no toca ningún dato ni spec existente (el contrato `UnitDefinition.HasValidVisualIdentity` sigue exigiendo lo mismo). Recomendación para quien produzca animaciones, no una fase.

---

### 1.4 Catálogo del manual como datos semilla para contenido nuevo

Confirmado con el usuario: las unidades/enemigos de ejemplo del manual (tabla completa de 17 enemigos del Capítulo 1 con HP/daño exactos en 6.6 — Doge 90/8, Snache 100/15, Hippoe 1000/100, The Face 99999/2000, etc.; las 10 unidades Normales y sus formas en 5.4; los ejemplos de Especiales/Raras en 5.6/5.8) se usan como **datos semilla** al poblar `UnitDefinition`/`EnemyWaveDefinition` nuevos en las Fases 15-23 — no solo como inspiración de diseño. Esto es consistente con cómo ya trabajó el proyecto en `011-imported-asset-audit`/`012-real-asset-integration` (auditar referencia real → poblar assets propios) y evita inventar stats desde cero para cada unidad nueva. Aplica en particular a: Fase 17 (Objetos de Batalla — usar los ejemplos de 3.1 como catálogo semilla), Fase 20 (Barrera de Base — usar la ficha de The Face en 6.6 como semilla del primer jefe real), y cualquier ampliación futura del roster.

---

## Parte 2 — Fases nuevas propuestas (continúan la numeración de `roadmap-fases.md`)

Todas siguen el mismo criterio de gobernanza que las fases 3-14: cualquiera que dependa de gacha real permanece bloqueada por el Principio VI hasta que se levante la excepción. Ninguna de las Fases 15-23 de abajo depende de gacha — todas usan vías de obtención ya existentes en el proyecto (progreso de capítulo, misiones, recompensas de nivel), igual que `UnitUnlockCatalog` ya hace desde `013`.

### Fase 15 — Profundizar el catálogo de habilidades de combate

**Por qué va primero**: el framework de `008-classification-trait-abilities` ya existe y está bien probado; lo que falta es contenido, no arquitectura. Tiene más retorno profundizar lo ya construido que empezar sistemas nuevos.

**Alcance**: nuevos miembros de `AbilityEffectType` con comportamiento real — ofensivas (Fuerte Contra, Daño Masivo, Golpe Letal, Zombie Killer, Metal Killer), control (Debilitar, Congelar, Ralentizar, Retroceso extra, Deformación/Warp, Tóxico), defensivas (Resistente, Sobrevivir, Fortalecer, Esquivar) y utilidad (Dinero Extra, Escudo/Barrera de golpes, Invocar). No es necesario implementar las ~40 variantes del manual de una vez — priorizar 6-8 que ya tengan sentido contra el roster actual.

**Depende de**: `008` (framework ya construido).

**Input para /speckit.specify**:
```
Ampliación del catálogo de habilidades de combate de "The Battler": añadir nuevos tipos de AbilityEffectType con comportamiento real (hoy solo existe Curse), priorizando Debilitar, Congelar, Ralentizar, Fuerte Contra y Resistente, siguiendo el catálogo de https://battlecats.miraheze.org/wiki/Special_Abilities secciones "Trait-targeting abilities" y "Immunities". Reutiliza el framework ya existente de TraitTargetingAbility/NeutralAbility/Immunity (008-classification-trait-abilities) — esta fase agrega contenido, no arquitectura nueva.
```

---

### Fase 16 — Patrones de ataque extendidos (Multi-Hit, Crítico) 📝 Especificada, sin implementar (`017-multi-hit-critical`)

**Por qué va aquí**: comparte el mismo pipeline de resolución de daño que la Fase 15 (`UnitRuntime.Attack()` llama a `ApplyAbilitiesTo()` justo después de `ApplyDamage()` — [`UnitRuntime.cs:178-191`](Assets/Scripts/Gameplay/Battler/UnitRuntime.cs:178), dependencia confirmada por código, no supuesta).

**Alcance**: `AttackType` extendido con Multi-Hit (varios impactos por animación, reinicio si se interrumpe) y Crítico (probabilidad de daño doble) — ambos como miembros nuevos al final del enum existente, aditivo y compatible con `007`. **Ya no incluye** la reclasificación de "Metálico" (ver 1.3 Grupo B) — Crítico se implementa sin contador especial contra Metálicos por ahora; esa reclasificación queda como decisión aparte, opcional, con su propio plan de migración de datos.

**Depende de**: `007` (Attack Types), Fase 15.

**Input para /speckit.specify**:
```
Extensión de tipos de ataque de "The Battler": añadir Multi-Hit (varios golpes por animación de ataque, con reinicio de la secuencia si la unidad es interrumpida antes del último impacto) y Crítico (probabilidad configurable de infligir el doble de daño) al AttackType existente de 007-attack-types, como miembros nuevos al final del enum (sin reordenar ni reinterpretar los valores existentes: SingleTarget/Area/LongDistance deben seguir siendo 0/1/2). No incluye reclasificar el rasgo "Metálico" — eso es una decisión de migración de datos separada, fuera de esta spec.
```

---

### Fase 17 — Objetos de Batalla (Battle Items) ✅ Completa (`018-battle-items`)

**Alcance**: selección de hasta N consumibles antes de cada nivel (Speed Up, Rich Cat, radar de tesoro, Cat CPU, eliminar enemigo aleatorio). Obtenibles vía recompensa de misión/tesoro, no gacha — mismo patrón que las unidades de recompensa ya usadas en `013`.

**Depende de**: `005` (formación de equipo, mismo flujo pre-batalla), `006` (energía).

**Input para /speckit.specify**:
```
Sistema de Objetos de Batalla de "The Battler": el jugador selecciona hasta un número limitado de consumibles antes de entrar a un nivel (por ejemplo, aceleración de velocidad, dinero extra, radar de tesoro), obtenidos como recompensa de misión o tesoro (no gacha), siguiendo https://battlecats.miraheze.org/wiki/Special_Abilities y la sección "Objetos de batalla" del manual técnico del proyecto. Se integra en el flujo pre-batalla ya existente en 005-player-dashboard.
```

---

### Fase 18 — Bibliotecas del juego (Cat Guide / Enemy Guide / Treasure Menu) 📝 Especificada, sin implementar (`019-library-screens`)

**Por qué**: bajo riesgo técnico — son pantallas de solo lectura sobre datos que ya existen (`UnitUnlockCatalog`, `TreasureSetCatalog`); alto valor de UX/onboarding.

**Alcance**: tres pantallas de consulta: unidades desbloqueadas con stats, enemigos ya enfrentados con stats, y progreso de tesoros por capítulo.

**Depende de**: `005`, `013`/`014` (tesoros).

**Input para /speckit.specify**:
```
Bibliotecas de consulta de "The Battler": tres pantallas de solo lectura accesibles desde la Base del Jugador — Cat Guide (unidades desbloqueadas y sus stats, usando UnitUnlockCatalog), Enemy Guide (enemigos ya enfrentados en batalla, con sus stats) y Treasure Menu (progreso de tesoros por capítulo, usando TreasureSetDefinition de 014-chapter-scaling-treasure-sets). No modifica ningún sistema existente, solo lo expone.
```

---

### Fase 19 — Rango de Usuario / Estado del Jugador 📝 Especificada, sin implementar (`020-user-rank`)

**Ya validado**: el dato base **ya está consolidado**, no hace falta esquema de guardado nuevo. `PlayerProgressSaveData.unitProgress: UnitProgress[]` ([`PlayerProgressSaveData.cs:10`](Assets/Scripts/Model/Battler/PlayerProgressSaveData.cs:10)) ya tiene un `level` por unidad poseída ([`UnitProgress.cs:11`](Assets/Scripts/Model/Battler/UnitProgress.cs:11)). El Rango de Usuario es un valor **derivado** (`unitProgress.Sum(u => u.level)`), no un dato nuevo a persistir — esta fase es más barata de lo que parece: solo agrega el cálculo, la pantalla de estado y las recompensas por umbral. **Confirmado durante `/speckit.specify` de `020-user-rank`**: esa suma es exactamente la misma que `PlayerCharacterLevelCalculator.Calculate` ya expone como "nivel de personaje" desde `005-player-dashboard` — el Rango de Usuario reutiliza ese cálculo sin duplicarlo; el trabajo nuevo real es la capa de umbrales/recompensas reclamables.

**Alcance**: contador de progreso de cuenta derivado de `unitProgress[].level`; pantalla de "estado del jugador"; recompensas reclamables por umbral (objetos de batalla, no moneda premium).

**Depende de**: `005` (fuente del dato, ya persistido), `002` (guardado).

**Input para /speckit.specify**:
```
Sistema de Rango de Usuario de "The Battler": un contador de progreso de cuenta calculado como la suma de los niveles de todas las unidades que el jugador posee (PlayerProgressSaveData.unitProgress[].level, ya persistido desde 005-player-dashboard — no requiere campo de guardado nuevo, es un valor derivado), visible en la Base del Jugador, con recompensas reclamables (objetos de batalla, no moneda premium) al superar umbrales configurables. Sigue https://battlecats.miraheze.org/wiki/User_Rank, adaptado sin depender de gacha ni moneda premium (Principio VI).
```

---

### Fase 20 — Barrera de Base y Jefes vinculados ✅ Completa (`021-base-barrier`)

**Nota**: retoma el hallazgo de `docs/plan-trabajo-battle-ux.md` Tier 3.2 ("Barrera de Base"), confirmado también por el manual (6.4, jefes).

**Alcance**: escudo invulnerable en la base enemiga hasta derrotar a un jefe específico del nivel — profundiza el concepto de `SagaArcDefinition.BossLevel` ya existente pero sin comportamiento propio hoy. Usar la ficha de "The Face" (6.6: 99999 HP / 2000 daño) como dato semilla del primer jefe real (ver 1.4).

**Depende de**: `013` (`BossLevel`). **Ya no depende** de la Fase 16 (Crítico) — se retiró como prerrequisito junto con la reclasificación de Metálico (ver 1.3 Grupo B); un jefe puede tener counters propios sin que eso dependa de esa migración.

**Input para /speckit.specify**:
```
Barrera de Base de "The Battler": ciertos niveles marcados como BossLevel (013-empire-of-cats-saga) otorgan a la base enemiga un escudo invulnerable hasta que se derrota a un enemigo jefe específico dentro de ese nivel, momento en el que la base vuelve a ser atacable con normalidad. Usar la ficha de "The Face" del manual técnico del proyecto (99999 HP / 2000 daño) como dato semilla del primer jefe real. Sigue https://battlecats.miraheze.org/wiki/Enemy_Bases sección "Base Barrier".
```

---

### Fase 21 — Ototo Corps (variantes de Gatorreta)

**Alcance**: construcciones que cambian el aspecto/efecto de `GatorretaController` y otorgan bonos pasivos de equipo (reducción de daño de un rasgo, resistencia a un debuff), alimentadas por materiales obtenibles en batalla.

**Depende de**: `013` (`GatorretaController`), Fase 15 (para que "resistencia a debuff" tenga contra qué aplicar).

**Input para /speckit.specify**:
```
Cuerpo Ototo de "The Battler": sistema de construcciones que se activan invirtiendo materiales obtenidos en batalla (no gacha) para cambiar el efecto de la Gatorreta (013-empire-of-cats-saga) y otorgar bonos pasivos permanentes a todo el equipo (reducción de daño recibido de un rasgo específico, resistencia a un debuff concreto). Sigue https://battlecats.miraheze.org/wiki/Ototo_Development_Team.
```

---

### Fase 22 — Gamatoto (expediciones asíncronas)

**Por qué va después de las anteriores**: introduce un patrón técnico nuevo (temporizador persistido que avanza con la app cerrada) que ningún spec anterior necesitó — conviene aislarlo una vez que el resto del contenido que consume (materiales) ya tiene destino (Fase 21).

**Alcance**: expediciones con duración real (minutos/horas) que otorgan materiales al completarse, calculadas por timestamp guardado (no requiere que la app esté abierta).

**Depende de**: `002` (guardado local), Fase 19 (desbloqueo por Rango de Usuario), Fase 21 (consumo de materiales).

**Input para /speckit.specify**:
```
Sistema de Gamatoto de "The Battler": el jugador envía una expedición por una duración configurable (minutos/horas); el progreso se calcula por timestamp persistido en el guardado local (002-local-save-progress), de forma que avanza aunque la app esté cerrada. Al completarse, otorga materiales usables en el Cuerpo Ototo (Fase 21). Sigue https://battlecats.miraheze.org/wiki/Gamatoto_Expedition.
```

---

### Fase 23 — Talentos y Orbes

**Alcance**: mejora opcional post-Forma Verdadera — puntos invertibles en resistencias a debuff o stats extra.

**Depende de**: `009` (evolución de unidad).

**Input para /speckit.specify**:
```
Sistema de Talentos de "The Battler": unidades que alcanzaron su Forma Verdadera (009-unit-evolution) pueden invertir puntos de talento (obtenidos como recompensa de nivel) en resistencias a debuffs específicos o bonos de stats, siguiendo https://battlecats.miraheze.org/wiki/Talents. No incluye Orbes equipables en esta primera versión — evaluar como extensión posterior.
```

---

## Parte 3 — Fases existentes: sin cambios, con una precisión

- **Fase 13 (Gacha)** — sigue bloqueada por el Principio VI. Ninguna de las Fases 15-23 la requiere como prerrequisito: todas usan vías de obtención ya existentes (progreso de capítulo/misión), igual que el resto del juego hoy. Cat Storage (9.10 del manual) es la única pieza que sí depende de gacha de forma inherente — queda fuera de alcance hasta que se decida destrabar la Fase 13.
- **Fase 14 (Rebranding)** — sin cambios.
- **Cat Combos**: `plan-trabajo-battle-ux.md` (Tier 3.3) lo agrupó junto a Gacha/Store como "fuera de alcance por Principio VI". Con la lectura completa del manual, esa dependencia no es técnica — Cat Combos son bonos pasivos por combinar unidades **ya desbloqueadas por historia**, no requieren gacha. Se deja como **Fase 24 opcional**, a decisión explícita del usuario (no se agenda automáticamente porque una sesión anterior ya la marcó como "no proponer").
- **Calendario de eventos general** (más allá del banner único de `015`): Festivales de Tesoro recurrentes, Meow Meow Day, eventos mensuales. Candidata a **Fase 25**, depende de que `015-special-event-banner` esté implementado primero (reutiliza su `EventTimeWindow`).

---

## Orden recomendado

1. `015-special-event-banner` — ya especificada, retomar con `/speckit.implement` (pendiente desde antes de este documento).
2. **Fase 15** — Catálogo de habilidades (profundiza 008, mayor apalancamiento inmediato). ✅ Completa (`016-combat-ability-catalog`).
3. **Fase 16** — Patrones de ataque extendidos (Multi-Hit, Crítico). 📝 Especificada, sin implementar (`017-multi-hit-critical`) — retomar con `/speckit.implement`.
4. **Fase 17** — Objetos de Batalla (bajo esfuerzo, refuerza el loop pre-batalla). ✅ Completa (`018-battle-items`).
5. **Fase 18** — Bibliotecas (bajo riesgo, valor de UX inmediato). 📝 Especificada, sin implementar (`019-library-screens`) — retomar con `/speckit.implement`.
6. **Fase 20** — Barrera de Base (independiente de Fase 16 tras la corrección de 1.3; cierra un gap ya detectado en `plan-trabajo-battle-ux.md`). ✅ Completa (`021-base-barrier`).
7. **Fase 19** — Rango de Usuario (habilita desbloqueos de las siguientes). 📝 Especificada, sin implementar (`020-user-rank`) — retomar con `/speckit.implement`.
8. **Fase 21** — Ototo Corps.
9. **Fase 22** — Gamatoto.
10. **Fase 23** — Talentos.
11. **Fase 13** (Gacha, si se decide destrabar) → **Fase 24** (Cat Combos, opcional) → **Fase 25** (Calendario de eventos general) → **Fase 14** (Rebranding, siempre al final).

**Total de fases identificadas tras esta revisión**: 14 ya cubiertas por `roadmap-fases.md` (3 a 14) + 1 especificada sin implementar (`015`) + 9 nuevas de este documento (15-23) + 2 opcionales condicionadas (24, 25) = **23-25 fases** en el mapa completo del proyecto, de las cuales **17 están completas hoy** (Fase 15 y Fase 17/`018-battle-items` se sumaron a las 15 previas) y **3 más quedaron especificadas sin implementar** (Fases 16, 18, 19: `017`/`019`/`020`), listas para `/speckit.implement` cuando se decida avanzar.
