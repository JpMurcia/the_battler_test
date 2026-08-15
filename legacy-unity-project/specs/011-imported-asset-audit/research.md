# Phase 0 Research: Auditoría de Assets Importados

## 1. Cómo enumerar el contenido sin abrir el Editor de Unity

**Decision**: Usar comandos de sistema de archivos (`find`/`Get-ChildItem`) sobre `Assets/<pack>/`, ignorando `*.meta`, para contar archivos y describir la estructura de carpetas. No se usa el Asset Database de Unity ni se abre el Editor.

**Rationale**: SC-001 exige que el catálogo se pueda leer sin abrir la ventana de Proyecto de Unity; generarlo con el Editor abierto rompería esa garantía y sería más lento de reproducir/actualizar.

**Alternatives considered**: Un `EditorWindow`/script de Editor que recorra `AssetDatabase.FindAssets` — rechazado por FR-007 (esta feature no agrega código de producto) y porque requeriría abrir Unity, contradiciendo SC-001.

## 2. Alcance real de `Assets/` vs. los packs nombrados en spec.md

**Decision**: El catálogo (FR-001/FR-002/FR-003/FR-004) cubre 8 packs: los 5 originales (`Characters/`, `Assets/Assets/` con UI Elements + Raw and SpriteSheets, `"Dragon Warrior Files"`, `"Free 2D Cartoon Parallax Background"`, `Hyper_Casual_UI`) más `"Monsters Creatures Fantasy 2"`, `"Warrior free set"` y `ShootingSound`. `Assets/PlatformerMicrogame_README.txt` queda excluido por estar ya trackeado en git desde el commit baseline (`69ae9b5`) — no es un pack "recién importado".

**Rationale**: `git status` mostró carpetas de nivel superior sin trackear adicionales a las 5 originalmente nombradas — `Monsters Creatures Fantasy 2/`, `Warrior free set/`, `ShootingSound/` — cada una con su propio `License.txt`/`ReadMe.txt`/`Contact.txt`. El usuario decidió (2026-07-29) ampliar el alcance porque estos packs traen contenido usable en el juego, en particular audio (`ShootingSound`, 13 efectos `.wav`) y un personaje/criaturas adicionales.

**Alternatives considered**: Dejarlos fuera y tratarlos en una spec 012 separada — descartado por decisión explícita del usuario de ampliar esta spec. Ampliar FR-001 silenciosamente sin confirmación — rechazado inicialmente por violar el flujo Spec-Driven (constitución, Governance); resuelto pidiendo confirmación antes de tocar spec.md, que el usuario dio.

**Resolución**: spec.md actualizado (FR-001, FR-002b, FR-003, FR-004b, Assumptions) para incluir los 3 packs adicionales. `tasks.md` incluye tareas de inventario para los 8 packs.

## 5. `"Monsters Creatures Fantasy 2"` — enemigos vs. unidades jugables

**Decision**: Las 4 criaturas (`Bat`, `Mimic`, `Rat`, `Slime`) se catalogan como candidatas a enemigo/criatura (FR-002b), no se evalúan contra el Principio III (que aplica solo a unidades jugables — constitución, Principio III).

**Rationale**: La estructura del pack (`Sprites/<Criatura>/{idle,attack,hurt,death,...}.png` + `Animations/*.controller`) es equivalente en forma a un pack de personaje jugable, pero el nombre del pack y el contenido (Bat/Mimic/Rat/Slime) apunta a enemigos típicos de un dungeon crawler, no a héroes desplegables. Forzar la evaluación del Principio III sobre criaturas pensadas como enemigos daría una lectura engañosa ("incompleto" por falta de "variante visual adicional", un requisito que no aplica a enemigos).

**Alternatives considered**: Evaluarlas contra el Principio III igual que los `hero_N` — rechazado, el principio está redactado explícitamente para "cada personaje jugable"; aplicarlo a enemigos es una extrapolación no pedida por la constitución ni por el usuario.

## 6. `"Warrior free set"` y `ShootingSound`

**Decision**: `"Warrior free set"` se trata como candidato a personaje jugable único (como "Dragon Warrior") y sí se evalúa contra el Principio III (FR-003). `ShootingSound` se cataloga como pack de efectos de sonido reutilizables (FR-004b), sin asignarlo a un personaje o pantalla específica salvo que el nombre del archivo lo indique — no tiene contraparte visual, por lo que no aplica ni el Principio III ni la comparación de UI (FR-004).

**Rationale**: `"Warrior free set"` trae `Aniamtion/` (sic, typo del pack original) + `Sprite Sheet/` para un solo personaje, estructuralmente equivalente a "Dragon Warrior". `ShootingSound` solo trae 13 `.wav` + 1 `ReadMe.txt`, sin sprites ni animaciones — no encaja en ninguna entidad visual existente de data-model.md, de ahí que FR-004b lo trate como su propia categoría de contenido ("efectos de sonido") en vez de forzarlo dentro de "Candidato a Personaje" o "Recomendación de Superficie de UI".

**Alternatives considered**: Ignorar `ShootingSound` en el catálogo por no ser un pack "de arte" — rechazado, contradice el pedido explícito del usuario de ampliar el alcance justamente porque tiene sonido útil para el juego.

## 3. Formato del catálogo

**Decision**: Un único Markdown, `specs/011-imported-asset-audit/asset-catalog.md`, con una sección por pack (US1), una tabla de cumplimiento del Principio III por personaje (US2), una tabla de recomendación de UI por pantalla (US3), y una sección de licencias/riesgos (US4) — en ese orden, siguiendo la prioridad P1/P1/P2/P3 de spec.md.

**Rationale**: Un solo documento cumple FR-008 (reusable por specs futuras sin re-escanear) y es más fácil de referenciar desde un plan futuro que 4 documentos separados.

**Alternatives considered**: Un documento por historia de usuario — rechazado, añade fricción para referenciar el catálogo completo desde una spec futura (FR-008) sin beneficio claro dado el tamaño moderado del contenido.

## 4. Verificación del Principio III sin arte adicional

**Decision**: Cumplimiento mínimo = existen animaciones `idle` + `attack` (o equivalente `1_idle`/`4_attack` en `Characters/hero_N`). La "variante visual adicional" (vestimenta/accesorio) se marca por separado como "requiere decisión de diseño" cuando el pack es un sprite crudo sin evidencia de una segunda skin, tal como indica el Acceptance Scenario 1 de US2 en spec.md.

**Rationale**: Es literalmente lo que pide spec.md (línea 38); evita que la auditoría bloquee en falso a los 30 `hero_N` solo por no traer una segunda variante de vestimenta, algo que es una decisión de diseño futura, no un defecto del pack.

**Alternatives considered**: Marcar como "incompleto" a todo personaje sin variante visual — rechazado, contradice explícitamente el Acceptance Scenario 1 de US2.
