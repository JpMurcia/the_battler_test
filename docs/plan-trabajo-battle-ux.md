# The Battler — Plan de Trabajo: Pulido de Batalla y Brechas vs. Referencia

**Fuente**: playtesting directo del usuario (2026-07-31), auditoría de código (`Assets/Scripts`, `Assets/Editor/Battler`), `docs/roadmap-fases.md`, `.specify/memory/constitution.md`, y el notebook de NotebookLM "Battle-cats" (wiki de The Battle Cats + `README.md`/`constitution.md`/`spec.md` propios).

**Propósito**: consolidar los hallazgos de esta sesión en un plan priorizado. No reemplaza `docs/roadmap-fases.md` (que cubre fases de spec-kit para sistemas grandes) — lo complementa con bugs/pulido sobre contenido ya construido y con posibles fases nuevas detectadas por comparación con la wiki de referencia.

**Nota de alcance importante**: este proyecto NO es un clon 1:1 de The Battle Cats (Principio III de la constitución lo diferencia explícitamente por identidad visual animada). La wiki es material de referencia/inspiración, no una checklist obligatoria. De hecho, gran parte de la profundidad mecánica de BC ya está implementada aquí: `AttackType.cs`, `ClassificationType.cs`, `TraitTargetingAbility.cs`, `NeutralAbility.cs` y `UnitRarity.cs` existen y corresponden a las specs `007-attack-types`, `008-classification-trait-abilities` y `009-unit-evolution`, ya construidas — no son huecos.

---

## Tier 1 — Bugs de UX en contenido ya construido (prioridad inmediata)

Reportados directamente por el usuario jugando la build actual. Ninguno es spec'd todavía (confirmado por grep en `specs/001-015` y `docs/roadmap-fases.md`), así que no son regresiones — son huecos reales nunca planeados.

### 1.1 No aparece pantalla de victoria/derrota — RESUELTO Y VALIDADO VISUALMENTE (2026-07-31)

**Importante para quien ejecute los builders**: `Chapter1ContentBuilder`, `Chapter2ContentBuilder`, `EmpireOfCatsContentBuilder` y `EventBannerContentBuilder` recrean su escena desde cero (`EditorSceneManager.NewScene`) en cada "Build". Esto **destruye** tanto el `GroundBackground` (aplicado por `BattleGroundBackgroundBuilder`, un patch separado) como, en el caso de `Chapter1ContentBuilder`, el contenido de `Assets/Prefabs/Battler` (que `BasePrefabHealthBarBuilder` había parcheado con las barras de salud). **Orden correcto de ejecución tras tocar cualquier ContentBuilder**:
1. The Battler → Build Chapter 1 Placeholder Content
2. The Battler → Build Chapter 2 Placeholder Content
3. The Battler → Build Empire of Cats Placeholder Content
4. The Battler → Build Special Event Banner Content
5. The Battler → Add Battle Ground Backgrounds (reaplica fondos en las 5 escenas)
6. The Battler → Add Base Health Bars (reaplica barras de salud en los prefabs compartidos)
7. Validar cada escena con su "Validate ..." correspondiente.

Implementado, construido en las 5 escenas y verificado visualmente en el Editor (Simulator, dispositivo foldable):
- **Causa raíz**: `BattleStateManager.SetOutcome` (`Assets/Scripts/Gameplay/Battler/BattleStateManager.cs:236-264`) detectaba correctamente el resultado y disparaba `IBattleOutcomeListener.OnBattleOutcomeChanged`, pero **ninguna clase implementaba esa interfaz** — era un hook muerto. En Derrota no había feedback de ningún tipo (ni diálogo, ni pantalla); el despliegue simplemente se detenía en silencio.
- `RetryBattle()` (líneas 369-386) ya reseteaba el estado de batalla completo, pero solo lo llamaban los tests — no existía ningún botón de reintentar en ninguna escena.
- **Hecho**: `BattleOutcomePanel.cs` (`Assets/Scripts/View/Battler/BattleOutcomePanel.cs`) implementa `IBattleOutcomeListener`, se registra vía `AddOutcomeListener`. Victoria muestra "¡Victoria!" + botón "Continuar" (vuelve a `AdventureMap` vía `ISceneNavigator`); Derrota muestra "Derrota" + botones "Reintentar" (llama `RetryBattle()`) y "Mapa". `SetOutcome` se reordenó para notificar a los listeners recién después de que termine el diálogo post-batalla en Victoria (antes no había orden garantizado), así el panel no tapa el diálogo.
- Wireado en los 4 content builders (Chapter1, Chapter2, EmpireOfCats, EventBanner) — las 5 escenas de batalla lo tienen.
- **2 bugs encontrados y corregidos durante la validación visual en Unity** (no se habrían visto solo leyendo el código):
  1. `VictoryRoot`/`DefeatRoot` quedaban **activos por defecto** al abrir la escena en el Editor (se superponían, `DefeatRoot` tapando a `VictoryRoot`) — corregido con `SetActive(false)` explícito en el builder tras crearlos; `BattleOutcomePanel.OnBattleOutcomeChanged` los activa/desactiva en runtime.
  2. El fondo de ambos paneles tenía alpha 0.92 (no opaco), dejando ver el contenido de fondo (diálogo, deployment bar) a través — se subió a alpha 1.0 en las 4 builders.
- Validado con `The Battler → Validate Chapter 1/2 Scene`, `Validate Empire of Cats Scenes` y `Validate Special Event Banner Content` — 0 errores en las 4.

### 1.2 Los enemigos se ven muy pequeños
- **Causa raíz**: unidades del jugador cargan arte de `Assets/Characters/hero_N/...` a 300×300px/frame; los enemigos cargan de `Assets/Monsters Creatures Fantasy 2/...` a 87-156px/frame. Ningún `.meta` fija `spritePixelsPerUnit` distinto y ningún código aplica `localScale` correctivo — es un problema sistémico de importación de arte, repetido en los 4 content builders (Chapter1, Chapter2, EmpireOfCats, EventBanner).
- **Trabajo**: decidir una convención única (opción recomendada: fijar `spritePixelsPerUnit` por pack de arte para que todas las unidades midan una altura de mundo consistente, en vez de tocar `localScale` unidad por unidad) y aplicarla en `BattlerArtLibrary` o en los `.meta` de importación.

### 1.3 No se muestra energía/salud
- Las barras de salud de **base** sí existen y funcionan (`BasePrefabHealthBarBuilder.cs`, ya parcheado en `PlayerBasePrefab.prefab`/`EnemyBasePrefab.prefab`), pero son frágiles: `Chapter1ContentBuilder.cs:50` borra y reconstruye `Assets/Prefabs/Battler` en cada re-run, lo que las destruye silenciosamente a menos que se vuelva a correr `BasePrefabHealthBarBuilder` después (ver orden de ejecución en 1.1).
- **Bug encontrado y corregido durante la validación visual (2026-07-31)**: la barra del jugador (`aboveY: 7.3f`) quedaba **fuera de cuadro** en las 5 escenas — la cámara de batalla (`orthographicSize=6`, `position.y=1`, igual en los 4 content builders) solo muestra hasta world Y=7. Se bajó a `aboveY: 6.6f`. Confirmado visualmente en `SpecialEventMastodonHunt_Battle` y `Chapter1_Battle`: ambas barras (verde jugador, roja enemigo) visibles dentro de cuadro tras el fix. Validado con `The Battler → Validate Base Health Bars` (0 errores).
- **No existen barras de salud por unidad** (`UnitRuntime.cs` trackea `CurrentHealth`/`MaxHealth` pero no expone ningún evento ni vista).
- **No existe un medidor agregado de energía/recurso** en batalla (`DeploymentUIController.cs` solo muestra costo/cooldown por slot, no el total acumulado).
- **Trabajo**: (a) hacer que `Chapter1ContentBuilder` invoque `BasePrefabHealthBarBuilder` al final de su build para que no se pueda desincronizar; (b) añadir un `HealthBarView` reutilizable por unidad; (c) añadir un medidor de recurso/energía visible en el HUD de batalla.

### 1.4 No se muestra la formación de equipo durante la batalla
- El sistema de formación sí funciona a nivel mecánico: `BattleStateManager.cs:149-150` filtra qué unidades son desplegables vía `TeamFormationRosterFilter`. Pero ningún componente de UI en la escena de batalla lo muestra — `DeploymentUIController.cs` no tiene ninguna referencia a "Formation". Los componentes de formación (`TeamFormationRowView`, `TeamFormationUIController`) solo existen en la escena de dashboard, no en batalla.
- **Trabajo**: añadir un panel (colapsable o en el HUD) que muestre el roster activo de la formación durante la batalla, reutilizando `TeamFormationRowView` si su diseño lo permite.

---

## Tier 2 — Ya está en el roadmap, decisión pendiente (no son bugs)

### 2.1 Fase 13 — Gacha
Bloqueada explícitamente en `docs/roadmap-fases.md:184-192` pendiente de una excepción documentada al Principio VI de la constitución (simplicidad desde el MVP). No se debe implementar sin pasar antes por esa conversación de gobernanza.

### 2.2 Fase 14 — Rebranding/Theming
Última fase planeada, aún no iniciada. Sin urgencia — depende de que los sistemas anteriores estén estables antes de abstraer nombres/assets de marca.

---

## Tier 3 — Mecánicas de la wiki de referencia nunca incluidas en ningún spec

Detectadas al comparar el resumen de NotebookLM (fuentes: Cat Dictionary, Special Abilities, Enemy Bases, etc.) contra el código y `docs/roadmap-fases.md`. Se listan como **fases candidatas futuras**, no como trabajo aprobado — cada una requeriría su propio `/speckit.specify` si se decide construirlas.

### 3.1 ~~Cañón especial de base ("Gatorreta")~~ — YA IMPLEMENTADO, corrección
Hallazgo inicial incorrecto: mi primer `grep` de "cannon" no encontró nada porque el nombre real en código es en español. **Ya existe** `GatorretaController.cs` (spec `013-empire-of-cats-saga`, contrato `gatorreta-and-resource-upgrade.md`, FR-010/FR-011): cañón de área con recarga lenta en la base del jugador, con tests en `GatorretaControllerTests.cs`. No es un hueco — se retira de este plan.

### 3.2 Barrera de Base (Base Barrier)
Escudo invulnerable en ciertas bases enemigas, roto solo al derrotar al jefe asociado. `grep` de "Barrier" en `Assets/Scripts` no encuentra nada. Candidata a **Fase 15**, probablemente dependiente de que exista antes un sistema de "jefe vinculado a base" (tampoco existe hoy). Dado el error de búsqueda en 3.1, antes de dar esto por confirmado como hueco conviene una segunda pasada buscando también term inología en español (p. ej. "escudo", "barrera") antes de proponer la fase formalmente.

### 3.3 Fuera de alcance por diseño (no proponer)
Store/Battle Items, Cat Combos y cápsulas de Gacha comparten el mismo estatus que la Fase 13 — bloqueadas por el Principio VI hasta que se decida lo contrario. No se listan como fases candidatas nuevas; ya están cubiertas por la nota de la Fase 13.

---

## Tier 4 — Seguimiento de esta misma sesión

### 4.1 Fondo de `PlayerBase.unity`
Ya corregido en código (`PlayerBaseContentBuilder.cs:146-157`, ahora usa `Level screen pannel.png` igual que `AdventureMap`). Pendiente: correr **The Battler → Build Player Base Content** y **Validate Player Base Scene** en el Editor de Unity para aplicar el cambio a la escena.

### 4.2 Fondos de escenas de batalla
Ya aplicados y coherentes en las 5 escenas de batalla (Chapter1=Mountain, Chapter2=Desert, Corea=Snow, Mongolia=Graveyard, Mastodon=Graveyard — duplicado aceptado). Sin trabajo pendiente salvo commitear los cambios cuando el usuario lo decida.

---

## Orden recomendado

1. Tier 1.1 — Pantalla de Victoria/Derrota (mayor impacto en la experiencia, cero feedback hoy en Derrota)
2. Tier 1.2 — Escala de enemigos (bug visual simple y aislado)
3. Tier 1.3 — Salud/energía (empezar por blindar las barras de base existentes, luego añadir las de unidad y el medidor de energía)
4. Tier 1.4 — Formación en batalla
5. Tier 4.1 — Verificar fondo de PlayerBase en Unity
6. Tier 2 y 3 — Requieren conversación de diseño/gobernanza antes de planear, no bloquean el resto
