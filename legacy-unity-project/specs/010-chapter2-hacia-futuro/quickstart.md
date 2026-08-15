# Quickstart: Validar el Capítulo 2 "Hacia el Futuro"

Guía para comprobar de punta a punta que el Capítulo 2 cumple los criterios de aceptación de [spec.md](./spec.md), una vez implementadas las tareas de `/speckit-tasks`. Sigue el mismo formato que [`001-chapter1-vertical-slice/quickstart.md`](../001-chapter1-vertical-slice/quickstart.md).

## Prerrequisitos

- Unity 6000.3.20f1 (o superior) con el proyecto `the_battler_test` abierto.
- Escena `Assets/Scenes/Chapter2_Battle.unity` presente y configurada con un `ChapterDefinition` que apunte a `Assets/ScriptableObjects/Battler/Chapter2/Chapter2.asset` (ver [contracts/chapter2-scriptableobject-data-contract.md](./contracts/chapter2-scriptableobject-data-contract.md)).
- `Chapter2.asset.availableUnits` referencia exactamente 7 `UnitDefinition` (las 5 de `Chapter1/Units/Player/` + las 2 nuevas de `Chapter2/Units/Player/`, ver [contracts/new-unit-definitions.md](./contracts/new-unit-definitions.md)), todas con `idleAnimation`/`attackAnimation`/`visualVariant` asignados.
- Progreso guardado (`progress.json`) con `chapter_1` marcado como completado (`Victory`) — puede lograrse jugando `Chapter1_Battle.unity` primero, o inyectando el dato directamente para pruebas aisladas.

## Pasos de validación manual (Editor) — recorrido del capítulo (User Story 1, P1)

1. **Abrir la escena** `Chapter2_Battle.unity` y entrar en Play Mode.
2. **Diálogo pre-batalla específico** (US1 Acceptance Scenario 1, FR-001): confirmar que se reproduce el diálogo con retrato + texto de "Hacia el Futuro" (no el del Capítulo 1) antes de que cualquier unidad sea desplegable.
3. **Despliegue y combate autónomo** (US1 Acceptance Scenario 2, FR-003): con recurso suficiente, desplegar unidades del roster de 7 disponibles; confirmar que actúan de forma autónoma en el carril, igual que en el Capítulo 1.
4. **Identidad visual de las 2 unidades nuevas** (FR-005a, Principio III): desplegar `player_unit_6` y `player_unit_7` al menos una vez cada una; confirmar para cada una: animación de idle antes de entrar en rango, animación de ataque distinta al entrar en rango de un objetivo, variante visual reconocible frente a las 5 unidades de `001` y entre sí.
5. **Oleada enemiga escalada** (FR-007): confirmar que la oleada enemiga del Capítulo 2 representa mayor amenaza que la del Capítulo 1 (más unidades y/o unidades enemigas con más salud/daño — comparación cualitativa, no un umbral numérico fijo).
6. **Condición de victoria/derrota** (US1 Acceptance Scenario 3, FR-004): completar la batalla en ambos sentidos (reducir la base enemiga a 0 en una corrida, dejar caer la base del jugador a 0 en otra) y confirmar que se reproduce el diálogo post-batalla correspondiente al resultado (solo en victoria, mismo comportamiento que `BattleStateManager` ya implementa para `001`).
7. **Identificación narrativa del capítulo** (User Story 3, FR-006, SC-003): tras el recorrido completo, confirmar — leyendo únicamente el diálogo reproducido y observando las unidades disponibles, sin fuentes externas — que se puede describir en qué se diferencia narrativamente "Hacia el Futuro" del Capítulo 1 (antagonista nuevo, no el "Imperio de los Test/Robot").

## Pasos de validación manual — desbloqueo desde el mapa de aventuras (User Story 2, P2)

*Aplicable únicamente una vez que `004-adventure-map-banners` esté implementado en C# y el ajuste de datos de [contracts/adventure-map-banner-integration.md](./contracts/adventure-map-banner-integration.md) esté aplicado sobre `MainAdventureMap.asset` — ver research.md §2/§5 para el estado de esa dependencia al momento de este plan.*

8. **Banner bloqueado sin progreso** (Acceptance Scenario 2 de US2, FR-009): sin `chapter_1` completado, abrir `AdventureMap.unity` y confirmar que el banner "Hacia el Futuro" aparece bloqueado y no seleccionable.
9. **Banner desbloqueado tras completar el Capítulo 1** (Acceptance Scenario 1 de US2, SC-002): con `chapter_1` completado, abrir `AdventureMap.unity` y confirmar que el banner "Hacia el Futuro" aparece desbloqueado y seleccionable.
10. **Navegación desde el banner** (FR-008): seleccionar el banner desbloqueado y confirmar que el juego navega a `Chapter2_Battle.unity`.

## Validación automatizada

- `Assets/Tests/EditMode/Battler/`: correr desde `Window > General > Test Runner > EditMode`. Deben pasar, sobre los assets de `Chapter2/` además de los de `Chapter1/`: validación de datos de `UnitDefinition` (rangos válidos, `HasValidVisualIdentity` de las 2 unidades nuevas) y de `ChapterDefinition` (`chapterId` único, diálogo no vacío, exactamente 7 `availableUnits`) — mismos validadores genéricos ya usados por `001`, sin clases de test nuevas necesarias si ya recorren todos los assets del proyecto en vez de una carpeta fija.
- `Assets/Tests/PlayMode/Battler/`: correr desde `Window > General > Test Runner > PlayMode`. Debe pasar una extensión del patrón `BattleLoopPlayModeTests` de `001` (dobles en memoria de `ChapterDefinition`/`UnitDefinition`, sin depender de los assets `.asset` reales de `Chapter2/`) verificando el mismo loop completo sobre una `ChapterDefinition` con 7 unidades en vez de 5.

## Resultado esperado

Los pasos 1–7 (recorrido nuclear del capítulo) y su suite automatizada en verde confirman que el contenido del Capítulo 2 cumple [spec.md](./spec.md) User Stories 1 y 3 (P1) de forma independiente de `004`/`006`/`007`/`008`. Los pasos 8–10 confirman adicionalmente la User Story 2 (P2, desbloqueo) una vez la integración de datos con `004` esté aplicada. Todo en verde confirma que "Hacia el Futuro" está listo para pasar a `/speckit-tasks` → `/speckit-implement` si aún no se ha construido, o para cerrarse como validado si ya se implementó.
