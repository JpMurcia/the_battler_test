# Feature Specification: Auditoría de Assets Importados

**Feature Branch**: `011-imported-asset-audit`

**Created**: 2026-07-29

**Status**: Draft

**Input**: User description: "subi unos assets al proyecto quiero que lo analices"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Catalogar el contenido de los packs de arte recién importados (Priority: P1)

Un miembro del equipo (diseñador o desarrollador) revisa un catálogo que resume qué trae cada pack de assets subido a `Assets/` — `Characters/` (hero_1 a hero_30), `Assets/Assets/` (UI Elements), `"Dragon Warrior Files"`, `"Free 2D Cartoon Parallax Background"`, `Hyper_Casual_UI`, `"Monsters Creatures Fantasy 2"`, `"Warrior free set"` y `ShootingSound` — sin tener que abrir manualmente miles de archivos en el Editor de Unity.

**Why this priority**: Sin este catálogo nadie en el equipo sabe qué contenido está realmente disponible; es prerrequisito para cualquier decisión futura sobre qué integrar en un capítulo, pantalla o sistema.

**Independent Test**: Leer el documento de catálogo generado por esta feature y confirmar que enumera cada pack por separado con su ruta, tipo de contenido principal y volumen aproximado de archivos, sin necesitar abrir Unity.

**Acceptance Scenarios**:

1. **Given** los packs de assets fueron copiados a `Assets/` sin organizar ni integrar, **When** se genera el catálogo, **Then** el catálogo lista cada pack por separado con su ruta, tipo de contenido (sprites de personaje, fondos parallax, iconos/UI, efectos, fuentes, efectos de sonido) y conteo aproximado de archivos.
2. **Given** el pack `Characters/` contiene 30 héroes con variantes `male`/`female`, **When** se cataloga, **Then** el catálogo describe la estructura común (`hero_N/{male,female}/{1_idle,2_walk,3_run,4_attack,5_block,6_die}`) y cuántos héroes están completos frente a incompletos.
3. **Given** el pack `ShootingSound` contiene únicamente archivos de audio (`.wav`) sin contraparte visual, **When** se cataloga, **Then** el catálogo lo lista como pack de efectos de sonido reutilizables para el juego (por ejemplo disparos/ataques), distinto de los packs visuales, sin intentar emparejarlo con un personaje o pantalla específica.
4. **Given** el pack `"Monsters Creatures Fantasy 2"` trae 4 criaturas (`Bat`, `Mimic`, `Rat`, `Slime`) con animaciones por estado (idle/attack/hurt/death/etc.) en `Sprites/<Criatura>/` y `Animator Controllers` en `Animations/`, **When** se cataloga, **Then** el catálogo describe cada criatura por separado con sus estados de animación disponibles, y señala que son candidatas a **enemigos/criaturas** antes que a unidades jugables (research/diseño futuro decide si alguna se reutiliza como personaje jugable).

---

### User Story 2 - Evaluar qué personajes cumplen el Principio III de la constitución (Priority: P1)

Un diseñador quiere saber cuáles de los packs de personajes importados (`hero_1`...`hero_30`, "Dragon Warrior", "Warrior free set") ya cumplen el Principio III de la constitución (animación de idle, animación de ataque, y una variante visual adicional) para considerarlos listos como unidad jugable sin encargar arte extra.

**Why this priority**: La constitución exige esto explícitamente por cada unidad jugable (Principio III); sin esta verificación el equipo corre el riesgo de planear un capítulo alrededor de un pack que no cumple el mínimo requerido.

**Independent Test**: Cruzar el catálogo contra el checklist del Principio III por héroe/personaje y confirmar que el resultado marca cada uno como "cumple" o "incompleto", listando qué requisito falta.

**Acceptance Scenarios**:

1. **Given** `hero_1` tiene carpetas `idle`, `walk`, `run`, `attack`, `block` y `die` en `male` y `female`, **When** se evalúa contra el Principio III, **Then** se marca como que cumple el mínimo (idle + ataque presentes), y se anota por separado que la "variante visual adicional" (vestimenta/accesorio) requiere una decisión de diseño porque no es evidente en un pack de sprites crudo.
2. **Given** el pack "Dragon Warrior" es un único personaje (no 30 héroes) con `idle`, `attack`, `walk`, `die` y una carpeta `Effects` separada, **When** se evalúa, **Then** se marca de forma equivalente, y se anota que `Effects/` (fireball, explosion, dashwind, etc.) es reutilizable como VFX de batalla independientemente de qué personaje se elija.
3. **Given** el pack "Warrior free set" es un único personaje con carpetas `Aniamtion/` (sic) y `Sprite Sheet/`, **When** se evalúa, **Then** se marca "cumple"/"incompleto" con el mismo criterio que "Dragon Warrior", y se anota que los archivos de sonido del pack `ShootingSound` (US1) quedan disponibles como efectos reutilizables para el ataque de cualquier unidad jugable, sin asumir que pertenecen a este personaje en particular.

---

### User Story 3 - Detectar solapamiento entre los packs de UI (Priority: P2)

Tanto `Assets/Assets/UI Elements` como `Hyper_Casual_UI` proveen sprites de botones, iconos y paneles. El equipo quiere conocer el solapamiento entre ambos y recibir una recomendación de qué pack usar por pantalla (menú principal, mapa de aventuras, base del jugador, HUD de batalla) para evitar mezclar estilos visuales inconsistentes entre pantallas.

**Why this priority**: Usar ambos packs sin criterio produce una UI visualmente inconsistente entre pantallas ya construidas (`MainMenu`, `AdventureMap`, `PlayerBase`); resolverlo antes de que se adopte cualquiera de los dos evita rehacer trabajo de UI más adelante.

**Independent Test**: Comparar categorías equivalentes entre ambos packs (por ejemplo "pause", "settings", botones genéricos) y confirmar que el catálogo entrega una recomendación explícita por cada una de las cuatro pantallas existentes.

**Acceptance Scenarios**:

1. **Given** ambos packs de UI ofrecen iconos de "pause", "settings" y botones genéricos con estilos distintos, **When** se comparan, **Then** el catálogo resalta las categorías solapadas y entrega una recomendación de qué pack usar para `MainMenu`, `AdventureMap`, `PlayerBase` y el HUD de batalla, o marca explícitamente "requiere decisión de diseño" cuando no hay una elección obvia.

---

### User Story 4 - Señalar riesgos de licencia/atribución (Priority: P3)

Un responsable del proyecto quiere que cualquier archivo de licencia o léame encontrado dentro de los packs importados (por ejemplo `Dragon Warrior Files/Read Me.txt` o `Hyper_Casual_UI/Fonts/license.txt`) quede señalado explícitamente, ya que sus términos de uso no pueden confirmarse automáticamente y requieren revisión manual antes de distribuir el juego.

**Why this priority**: Es el riesgo de menor impacto inmediato en el desarrollo, pero de mayor impacto si se ignora al publicar el juego; se prioriza P3 porque no bloquea el trabajo de diseño/planificación, pero debe quedar registrado.

**Independent Test**: Buscar en el catálogo la sección de licencias y confirmar que enumera cada archivo de licencia/léame encontrado junto con su ruta exacta.

**Acceptance Scenarios**:

1. **Given** existen archivos `Read Me.txt` y `license.txt` dentro de los packs importados, **When** se cataloga, **Then** el catálogo los lista con su ruta exacta y una nota de "pendiente de revisión legal manual".

---

### Edge Cases

- ¿Qué pasa cuando un asset no tiene su archivo `.meta` correspondiente (importación potencialmente rota)?
- ¿Cómo se maneja una escena o script de demo incluido en un pack (por ejemplo `ParallaxBackground_0.cs`, `BackgroundControl_0.cs`, `Demo_Scene.unity`) que aún no está conectado a las escenas propias del proyecto (`Chapter1_Battle`, `AdventureMap`, `MainMenu`, `PlayerBase`)?
- ¿Qué pasa con carpetas `hero_N` incompletas (falta una animación o falta una de las variantes de género)?
- ¿Cómo se señalan assets de UI casi duplicados (por ejemplo dos iconos de "pause" en packs distintos) sin requerir inspección visual manual de las más de 800 imágenes de UI?
- ¿Cómo se cataloga un pack puramente de audio (`ShootingSound`) que no tiene contraparte visual ni pertenece a un personaje/pantalla específica?
- ¿Cómo se distingue en el catálogo un pack de criaturas pensado como enemigos (`"Monsters Creatures Fantasy 2"`) de un pack de personaje jugable, cuando ambos traen animaciones de idle/ataque/muerte con la misma estructura?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE producir un catálogo escrito que enumere cada pack de assets recién importado bajo `Assets/` (`Characters/`, `Assets/Assets/`, `"Dragon Warrior Files"`, `"Free 2D Cartoon Parallax Background"`, `Hyper_Casual_UI`, `"Monsters Creatures Fantasy 2"`, `"Warrior free set"`, `ShootingSound`), incluyendo nombre del pack, ruta de origen y resumen del tipo de contenido (visual y/o sonoro).
- **FR-002**: Para el pack `Characters/hero_1`...`hero_30`, el sistema DEBE reportar la completitud por héroe (si existen las variantes `male`/`female`, cuáles de los 6 estados de animación — idle, walk, run, attack, block, die — están presentes, y el conteo de frames por estado).
- **FR-002b**: Para el pack `"Monsters Creatures Fantasy 2"`, el sistema DEBE reportar por criatura (`Bat`, `Mimic`, `Rat`, `Slime`) qué estados de animación existen (idle, attack, hurt, death y variantes propias como `fly`/`transform`), señalando explícitamente que se catalogan como candidatas a enemigo/criatura y no se evalúan contra el Principio III (ese principio aplica a unidades jugables) salvo que una spec futura decida adoptar alguna como personaje jugable.
- **FR-003**: El sistema DEBE evaluar cada pack de personaje candidato a unidad jugable (`Characters/hero_*`, "Dragon Warrior", "Warrior free set") contra el Principio III de la constitución (animación de idle, animación de ataque, variante visual adicional), marcando cada uno como "cumple" o "incompleto" y listando el requisito faltante.
- **FR-004**: El sistema DEBE identificar categorías de contenido solapadas/duplicadas entre los packs de UI (`Assets/Assets/UI Elements` y `Hyper_Casual_UI`) y producir una recomendación por pantalla (menú principal, mapa de aventuras, base del jugador, HUD de batalla) de qué pack estandarizar.
- **FR-004b**: El sistema DEBE catalogar el pack `ShootingSound` como una colección de efectos de sonido (`.wav`) reutilizables para el juego, sin exigirle una recomendación por pantalla (no es un pack visual) y sin asumir a qué personaje o acción pertenece cada archivo salvo que el nombre del archivo lo indique.
- **FR-005**: El sistema DEBE señalar cualquier archivo de licencia/atribución encontrado dentro de los packs importados (por ejemplo `Read Me.txt`, `license.txt`, `Contact.txt`) para revisión legal manual antes de cualquier distribución comercial.
- **FR-006**: El sistema DEBE marcar problemas estructurales detectados durante el análisis: archivos `.meta` faltantes, carpetas `hero_N` incompletas (falta variante de género o estado de animación), y escenas/scripts de demo incluidos en los packs que todavía no están conectados a las escenas propias del proyecto (por ejemplo `Monsters Creatures Fantasy 2/Demo/DemoScene.unity`).
- **FR-007**: El sistema NO DEBE mover, renombrar, eliminar, ni cablear ninguno de los assets importados dentro de escenas/prefabs/ScriptableObjects como parte de esta feature — el alcance es únicamente análisis y catalogación; la integración queda para specs futuras.
- **FR-008**: El catálogo resultante DEBE quedar organizado de forma que una spec futura (por ejemplo un nuevo capítulo o un rediseño de UI) pueda referenciarlo para decidir qué assets específicos adoptar, sin tener que re-escanear los archivos crudos.

### Key Entities *(include if feature involves data)*

- **Pack de Assets**: un bundle importado de nivel superior (`Characters`, `"Dragon Warrior Files"`, `"Free 2D Cartoon Parallax Background"`, `Hyper_Casual_UI`, `Assets/Assets` UI Elements, `"Monsters Creatures Fantasy 2"`, `"Warrior free set"`, `ShootingSound`), con nombre, ruta de origen, archivo de licencia (opcional) y lista de categorías de contenido (incluye "efectos de sonido" como categoría válida, no solo visuales).
- **Candidato a Personaje**: una entrada `hero_N`, "Dragon Warrior" o "Warrior free set", con variantes de género (si aplica), estados de animación, conteo de frames y una marca de cumplimiento del Principio III.
- **Candidato a Enemigo/Criatura**: una entrada por criatura del pack `"Monsters Creatures Fantasy 2"` (`Bat`, `Mimic`, `Rat`, `Slime`), con sus estados de animación disponibles; no se evalúa contra el Principio III (ese principio es para unidades jugables), solo se cataloga como enemigo potencial.
- **Recomendación de Superficie de UI**: un mapeo entre una pantalla del juego (menú principal, mapa de aventuras, base del jugador, HUD de batalla) y el pack/estilo de UI recomendado para usar en ella.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un miembro del equipo puede determinar en menos de 5 minutos, leyendo únicamente el catálogo, qué contenido de personajes/enemigos/fondos/UI/VFX/audio está disponible entre los ocho packs importados, sin abrir la ventana de Proyecto de Unity.
- **SC-002**: El 100% de las 30 carpetas de héroe bajo `Characters/` quedan reportadas individualmente con su nivel de completitud de estados de animación.
- **SC-003**: Cada solapamiento de pack de UI identificado en el catálogo incluye una recomendación, dejando cero decisiones de selección de pack "sin definir" para las cuatro pantallas núcleo (menú principal, mapa de aventuras, base del jugador, HUD de batalla).
- **SC-004**: El 100% de los archivos de licencia/léame encontrados en los packs importados quedan listados en el catálogo con su ruta exacta, sin necesidad de volver a buscarlos en el sistema de archivos.
- **SC-005**: El 100% de las 4 criaturas de `"Monsters Creatures Fantasy 2"` y el personaje de `"Warrior free set"` quedan catalogados individualmente, y el pack `ShootingSound` queda listado con su conteo de efectos de sonido disponibles.

## Assumptions

- El alcance de esta feature es analizar y catalogar el contenido importado; no incluye integrar, mover ni cablear ningún asset dentro de escenas/prefabs/ScriptableObjects — eso queda para specs futuras (respuesta directa a la petición "quiero que lo analices").
- Los archivos bajo `Assets/Data/Battler/` (`Banners`, `MainAdventureMap`, `DefaultUnitLevelingConfig`, `MainLocalizedText`) ya están integrados al proyecto por specs anteriores (`004-adventure-map-banners`, `005-player-dashboard`, `010-chapter2-hacia-futuro`) y no se tratan como "packs nuevos a analizar", aunque aparezcan como untracked en git.
- `Assets/PlatformerMicrogame_README.txt` ya está trackeado en git desde el commit baseline (`69ae9b5`) y no es un pack recién importado; queda fuera del alcance de esta spec.
- El alcance de "packs recién importados" se amplió el 2026-07-29 (a petición del usuario, "algunos assets tienen sonido para el juego") para incluir `"Monsters Creatures Fantasy 2"`, `"Warrior free set"` y `ShootingSound`, además de los 5 packs originales — los ocho quedan cubiertos por FR-001.
- `"Monsters Creatures Fantasy 2"` se trata como pack de enemigos/criaturas, no de personajes jugables, salvo decisión de diseño explícita en una spec futura; por eso no se le exige cumplir el Principio III (que aplica a unidades jugables).
- El catálogo resultante es un documento (parte de los artefactos de esta spec), no una herramienta ni un script ejecutable dentro del juego.
- La revisión de licencias es de superficie (detectar y listar archivos de tipo léame/licencia), no una validación legal exhaustiva de términos de uso.
- Las cuatro "superficies" de UI relevantes son las ya existentes en el proyecto: `MainMenu`, `AdventureMap`, `PlayerBase` y el HUD de batalla (`Chapter1_Battle` y capítulos sucesores).
