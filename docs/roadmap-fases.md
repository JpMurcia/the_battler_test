# The Battler — Roadmap de Fases (post-vertical-slice)

**Fuente**: `docs/Base SDDv1.docx`, `.specify/memory/constitution.md`, specs `001-chapter1-vertical-slice` y `002-local-save-progress`, y documentación de The Battle Cats Wiki (referenciada explícitamente en el docx) para el sistema de habilidades/clasificación.

**Propósito de este documento**: no es una spec en sí — es el mapa de qué specs faltan por crear con `speckit-specify` (o `/speckit.specify` según tu integración de Claude Code) para cubrir todo lo descrito en el docx base, ordenadas por dependencia. Cada fase trae un bloque **"Input para /speckit.specify"** listo para copiar/pegar tal cual como argumento del comando.

Estado ya cubierto (no repetir):
- ✅ Constitución (`.specify/memory/constitution.md`, v1.1.0)
- ✅ `001-chapter1-vertical-slice` — loop de combate, narrativa pre/post, 5 unidades
- ✅ `002-local-save-progress` — guardado local de progreso por capítulo
- ✅ `003` a `010` — Fases 3-11 de este documento (menú, mapa de banners, dashboard, energía, attack types, clasificación, trait-targeting, evolución, Capítulo 2) — ver detalle de estado en `README.md`
- ✅ `011-imported-asset-audit` / `012-real-asset-integration` — auditoría y reemplazo de arte placeholder por assets reales importados (no estaban en el alcance original de este roadmap derivado del docx; surgieron de una auditoría posterior de los packs importados)
- ✅ `013-empire-of-cats-saga` / `014-chapter-scaling-treasure-sets` — saga "Imperio de los Gatos" (multiplicadores por capítulo, Gatorreta, Brote Zombi, recompensas) y su escalado avanzado (vida de base por capítulo, ancho de nivel, sets de tesoros) — tampoco estaban en el alcance original; extienden el patrón de capítulos de Fase 11 con contenido y mecánicas nuevas descubiertas al comparar contra la wiki del juego de referencia
- 📝 `015-special-event-banner` (spec.md/plan.md/tasks.md ya existen, ver Fase 12 más abajo) — **diseñada, sin implementar** (1/30 tareas)

### Estado actualizado (2026-08-01)

Todas las fases 3-11 de este documento ya tienen spec implementada y con tests en verde (ver tabla del `README.md`). Las fases 12 ("Etapas de Fantasía") ya tiene `spec.md`/`plan.md`/`tasks.md` completos bajo `specs/015-special-event-banner/`, pero **no está implementada todavía** — el siguiente paso ahí es `/speckit.implement`, no `/speckit.specify` (ya no aplica el bloque de input de esa sección). Las fases 13 (Gacha) y 14 (Rebranding) siguen sin ninguna spec creada, tal como se documentan abajo.

---

## Cómo se derivaron estas fases

Del docx (`Base SDDv1.docx`) se identificaron estos bloques de alcance que **todavía no tienen spec**:

| Párrafo del docx | Sistema implícito |
|---|---|
| "inicio de seccion y configuracion, de momento por defecto" | Menú principal + pantalla de ajustes |
| "vanes de aventura desbloqueado... empezamos con el imperio de los test/robot, siguiente capitulo Hacia el Futuro" | Selección de aventuras/capítulos (mapa de banners), desbloqueo secuencial |
| "El baner debe ser posible despasarse sin ningún inconveniente, solo aquellos que estén desbloqueados" | Navegación/scroll del mapa de banners |
| "estapa de leyenda... Etapas de Fantasia... eventos especiales... fase activa de matanza de mastodontes" | Banner especial de eventos programados por horario |
| "dashboard... nivel de personaje... experiencia para subir niveles, mejora... organizar equipo... gacha con monedas o tickets" | Hub/base por aventura: nivel, mejora de unidad, formación de equipo, gacha |
| "cada aventura necesita energía... la energía sube con el nivel... misiones varían por país, aumenta dificultad" | Sistema de energía + escalado de dificultad por misión |
| URL `Special_Abilities`: Attack Types, Trait-targeting abilities, neutral abilities, immunities | Sistema de habilidades de combate (por fases: primero Attack Types, luego el resto) |
| URL `Cat_(Normal_Cat)`: estructura base, evolución por nivel, "true form" que duplica stats | Sistema de evolución de unidad |
| URL `Classification`: tipos (Rojo, Flotante, Oscuro/Negro, Ángel, Alien, Zombie, Relic, Sin rasgo) y tipos especiales (Colossus, Behemoth, Sage, Metal, Witch, EVA Angel, Typeless) | Sistema de clasificación/rasgos de unidad y enemigo |
| "el juego se llamará 'The Battler' test... puede cambiarse a The Battler Princess o The Battler Dogs" | Sistema de rebranding/theming (nombre, arte, no lógica de juego) |
| "siguiente capitulo Hacia el Futuro" | Capítulo 2 (contenido, siguiendo el patrón narrativo de 001) |

Nota importante: dos de estas fases (**Gacha real** y **Evolución/clasificación completa de unidades**) chocan con el Principio VI de la constitución (*Simplicidad desde el MVP — gacha real y variantes múltiples no se implementan hasta validar la vertical slice*). Se dejan marcadas como **requieren excepción/enmienda de constitución** antes de plan — no las saltes directo a `/speckit.plan` sin pasar por esa conversación.

---

## Fase 3 — Menú Principal y Configuración

**Por qué va primero**: hoy el juego "empieza" directo en la batalla del Capítulo 1 (spec 001). Sin un punto de entrada, nada de lo que sigue (mapa de aventuras, dashboard) tiene dónde colgarse.

**Alcance**: pantalla de inicio, ajustes por defecto (audio, idioma, etc. — lo mínimo viable), punto de entrada hacia el mapa de aventuras (Fase 4) y hacia continuar progreso guardado (usa `002-local-save-progress`).

**Depende de**: 002 (para saber si hay progreso que continuar).

**Input para /speckit.specify**:
```
Menú principal de "The Battler": pantalla de inicio que el jugador ve al abrir el juego, con configuración básica por defecto (audio, idioma) y dos accesos: continuar progreso guardado (si existe, usando el guardado local de 002-local-save-progress) o empezar/ir al mapa de aventuras. No incluye cuentas, login ni backend.
```

---

## Fase 4 — Mapa de Aventuras (Banners) y Desbloqueo Secuencial

**Por qué va aquí**: es el hub de navegación entre capítulos. El Capítulo 1 (spec 001) ya existe como batalla jugable, pero no hay todavía una pantalla que lo represente como "banner" dentro de un mapa navegable.

**Alcance**: pantalla con banners de aventura (capítulos), navegación/scroll sin bloqueos, entrada solo a los desbloqueados, desbloqueo secuencial al completar el anterior (ver Principio IV de la constitución). Empieza con el banner "Imperio de los Test/Robot" (Capítulo 1) enlazando a la spec 001; deja el siguiente banner "Hacia el Futuro" visible pero bloqueado (contenido real en Fase 11).

**Depende de**: 001 (batalla a la que enlaza el banner), 002 (progreso para saber qué está desbloqueado).

**Input para /speckit.specify**:
```
Mapa de aventuras de "The Battler": pantalla con banners de capítulo navegable sin bloqueos (scroll libre), donde cada banner representa un capítulo/aventura. Solo los banners desbloqueados son seleccionables; el desbloqueo es secuencial (completar un capítulo desbloquea el siguiente), usando el progreso guardado de 002-local-save-progress. El primer banner es "Imperio de los Test/Robot" y enlaza a la batalla de 001-chapter1-vertical-slice; el segundo banner "Hacia el Futuro" existe visualmente pero permanece bloqueado hasta que su contenido se especifique aparte. No incluye banners de evento/especiales (eso es una spec separada).
```

---

## Fase 5 — Dashboard / Base del Jugador (por aventura)

**Por qué va aquí**: el docx describe un hub "dentro" de cada banner, con el mismo layout salvo el fondo. Depende de que exista el mapa de banners (Fase 4) para tener un punto desde el que entrar.

**Alcance**: pantalla de base con nivel de personaje (agregado de niveles de las unidades/"test-robots"), experiencia acumulable para gastar en subir nivel, pantalla de mejora de unidad, organización/formación de equipo antes de entrar a la batalla. **No incluye** todavía el gacha real (eso es la Fase 6, y requiere revisar el Principio VI antes de planear).

**Depende de**: Fase 4 (se accede desde ahí), 001 (unidades a mostrar/organizar).

**Input para /speckit.specify**:
```
Dashboard de base del jugador en "The Battler": pantalla accesible desde cada banner de aventura (mismo layout, fondo distinto según la aventura), que muestra el nivel de personaje del jugador (derivado de sus unidades/"test-robots"), la experiencia acumulada disponible para subir de nivel, una pantalla de mejora de unidades, y una pantalla para organizar/armar el equipo antes de entrar en batalla. No incluye el sistema de gacha (spec separada) ni monedas/tickets todavía.
```

---

## Fase 6 — Sistema de Energía y Escalado de Dificultad por Misión

**Por qué va aquí**: las misiones (dentro del mapa de Fase 4) requieren energía y dificultad variable; tiene sentido especificarlo una vez que existe el mapa de aventuras al que aplica.

**Alcance**: energía como recurso que limita cuántas misiones se pueden jugar, tasa de recuperación ligada al nivel de personaje (Fase 5), misiones agrupadas por "país"/región con dificultad creciente conforme se avanza.

**Depende de**: Fase 4 (misiones), Fase 5 (nivel de personaje del que depende la energía máxima/recuperación).

**Input para /speckit.specify**:
```
Sistema de energía de "The Battler": cada misión del mapa de aventuras consume energía; la energía máxima y/o su tasa de recuperación aumenta con el nivel de personaje del jugador (dashboard de base). Las misiones se agrupan por país/región y su dificultad aumenta progresivamente conforme el jugador avanza dentro de esa región. Definir qué pasa si el jugador no tiene energía suficiente para entrar a una misión (bloqueo, sin penalización).
```

---

## Fase 7 — Sistema de Habilidades de Combate: Attack Types

**Por qué va aquí y no antes**: la constitución ya exige que cada unidad tenga stats en ScriptableObjects (Principio V); esta fase añade profundidad táctica sin bloquear nada de lo anterior. Se prioriza *solo* Attack Types primero, tal como pide explícitamente el docx ("de momento solo attack types").

**Alcance**: tipos de ataque (según `Special_Abilities` de la wiki) que determinan contra qué puede hacer daño una unidad, agregado como campo de datos en el ScriptableObject de unidad ya existente (001). **No** incluye todavía trait-targeting, neutral abilities ni immunities — eso es la Fase 8.

**Depende de**: 001 (las unidades y su ScriptableObject ya existen; esta fase extiende ese contrato de datos).

**Input para /speckit.specify**:
```
Sistema de tipos de ataque ("Attack Types") para las unidades de "The Battler": cada unidad y cada enemigo declara un tipo de ataque en su ScriptableObject de datos (extendiendo el definido en 001-chapter1-vertical-slice), que determina qué puede recibir daño de esa unidad, siguiendo la referencia de https://battlecats.miraheze.org/wiki/Special_Abilities (sección Attack Types). No incluye habilidades de trait-targeting, neutral abilities ni inmunidades en esta fase.
```

---

## Fase 8 — Habilidades Avanzadas: Trait-Targeting, Neutral Abilities e Immunities

**Requiere primero Fase 7 completada y validada.** El docx lo pide explícitamente como siguiente paso tras Attack Types.

**Alcance**: habilidades que solo afectan a tipos de enemigo específicos (trait-targeting), habilidades sin restricción de tipo (neutral), e inmunidades que anulan ciertos efectos — todas referenciadas en `Special_Abilities`. Depende de que exista primero un sistema de clasificación de tipos de enemigo (Fase 9) para que "trait-targeting" tenga contra qué apuntar — **considera hacer la Fase 9 antes que esta**, o fusionar ambas en un solo spec si al hacer `/speckit.clarify` se determina que están demasiado acopladas.

**Input para /speckit.specify**:
```
Extensión del sistema de habilidades de "The Battler" (tras Attack Types de la fase anterior): agregar trait-targeting abilities (habilidades que solo afectan a tipos de enemigo específicos), neutral abilities (sin restricción de tipo) e immunities (inmunidades que anulan ciertos efectos, incluyendo un efecto tipo "Curse" que deshabilita todas las habilidades de una unidad), siguiendo https://battlecats.miraheze.org/wiki/Special_Abilities. Requiere que el sistema de clasificación/tipos de enemigo (spec de Clasificación) exista primero o se desarrolle en conjunto.
```

---

## Fase 9 — Sistema de Clasificación de Unidades y Enemigos

**Por qué**: es el prerrequisito real de la Fase 8 (trait-targeting necesita tipos contra los que apuntar). Puede desarrollarse en paralelo o justo antes de la Fase 8.

**Alcance**: tipos estándar (Rojo, Flotante, Oscuro/Negro, Ángel, Alien, Zombie, Relic, Sin rasgo) y tipos especiales poco comunes que no son alcanzados por habilidades "contra todos" (Typeless, Colossus, Behemoth, Sage, Witch, EVA Angel), según `Classification`. Incluye también costos de despliegue y stats detallados por unidad/clasificación (lo que el docx llama "Detailed según la página de [clasificación]").

**Depende de**: 001 (ScriptableObject de unidad base), y en general de la Fase 7 (mismo contrato de datos que Attack Types).

**Input para /speckit.specify**:
```
Sistema de clasificación de unidades y enemigos de "The Battler": cada unidad y enemigo tiene un tipo estándar (Rojo, Flotante, Oscuro, Ángel, Alien, Zombie, Relic, Sin rasgo) y opcionalmente un tipo especial poco común que lo excluye de habilidades "contra todos los enemigos" (Sin tipo/Typeless, Colossus, Behemoth, Sage, Witch, EVA Angel), siguiendo https://battlecats.miraheze.org/wiki/Classification. Incluye costo de despliegue y stats detallados por unidad, en el mismo ScriptableObject de datos usado desde 001-chapter1-vertical-slice.
```

---

## Fase 10 — Sistema de Evolución de Unidad

**Nota de gobernanza (resuelta, `/speckit.constitution` v1.1.0, 2026-07-29)**: esta fase introduce variantes visuales adicionales por forma de evolución y cambia stats por forma, inspirada en `Cat_(Normal_Cat)` (evoluciona a nivel 10, luego con ítems a nivel 20+10, "forma verdadera" duplica ataque y vida). El Principio III fue enmendado para cubrir explícitamente mecánicas de progresión con un número acotado de etapas por unidad — ya no bloquea `/speckit.plan`/`/speckit.tasks`/`/speckit.implement`.

**Alcance**: niveles de evolución por unidad (forma base → forma 2 → forma verdadera), requisitos para evolucionar (nivel + posiblemente ítem, según se decida en `/speckit.clarify`), y el efecto en stats (ej. duplicar ataque/vida en la forma final).

**Depende de**: Fase 9 (clasificación) y 001 (unidades base).

**Input para /speckit.specify**:
```
Sistema de evolución de unidad en "The Battler": cada unidad puede evolucionar en etapas (forma base, segunda forma, forma verdadera) al alcanzar ciertos niveles, similar a https://battlecats.miraheze.org/wiki/Cat_(Normal_Cat) (evoluciona en nivel 10, y en nivel 20 con un ítem adicional). La forma final mejora significativamente los stats de la unidad (por ejemplo, duplica ataque y vida). Cada forma requiere su propia animación de idle y de ataque, conforme al Principio III de la constitución.
```

---

## Fase 11 — Capítulo 2: "Hacia el Futuro" ✅ Completa (`010-chapter2-hacia-futuro`)

**Por qué va aquí**: usa todo lo anterior (mapa de banners, dashboard, energía, habilidades) como contenido real de un segundo capítulo, siguiendo el mismo patrón narrativo validado en 001.

**Alcance**: igual estructura que 001 (diálogo pre/post, batalla, unidades nuevas si aplica) pero para el capítulo "Hacia el Futuro", desbloqueado tras completar el Capítulo 1 (vía Fase 4).

**Depende de**: 001 (patrón a replicar), Fase 4 (desbloqueo), y opcionalmente Fases 7-10 si el capítulo 2 introduce nuevas habilidades/clasificaciones/evoluciones.

**Input para /speckit.specify**:
```
Capítulo 2 "Hacia el Futuro" de "The Battler": siguiendo el mismo patrón que 001-chapter1-vertical-slice (diálogo pre-batalla y post-batalla específicos, combate automático por despliegue, base del jugador vs base enemiga), se desbloquea al completar el Capítulo 1 en el mapa de aventuras. [Completar aquí unidades nuevas, ambientación y beat de historia específico cuando se defina el guion.]
```

---

## Fase 12 — Banner Especial de Eventos: "Etapas de Fantasia" 📝 Especificada, sin implementar (`015-special-event-banner`)

**Por qué va al final**: es contenido de "evento" que depende de que exista el mapa de banners (Fase 4) y, probablemente, unidades/dificultad ya balanceadas (Fases 6-9) para tener sentido como desafío especial.

**Alcance**: banner especial visible en el mapa pero fuera del flujo de desbloqueo secuencial normal, activo solo en ciertos horarios programados; incluye la fase especial mencionada en el docx ("matanza de mastodontes" — un desafío/evento temático dentro de ese banner).

**Depende de**: Fase 4 (mapa de banners), y contenido de combate ya maduro (Fases 6-10) para que el evento tenga stats/dificultad contra las que diseñar.

**Estado real**: `spec.md`/`plan.md`/`tasks.md` ya existen en `specs/015-special-event-banner/` (30 tareas, 1 marcada hecha) — el bloque de input de abajo ya no aplica, se conserva solo como referencia histórica de la intención original. Siguiente paso real: retomar `specs/015-special-event-banner/tasks.md` con `/speckit.implement`, no volver a correr `/speckit.specify`.

**Input para /speckit.specify** (histórico — ya no aplica, ver "Estado real" arriba):
```
Banner especial de eventos "Etapas de Fantasia" en "The Battler": un banner adicional en el mapa de aventuras, fuera del flujo de desbloqueo secuencial normal, que solo está activo en horarios programados. Durante su ventana activa incluye una fase especial temática (ej. un evento de "matanza de mastodontes") con su propia dificultad y recompensas. Definir en /speckit.clarify cómo se configuran los horarios (fijos en build vs. remotos) y qué pasa si el jugador entra justo cuando el evento termina.
```

---

## Fase 13 (bloqueada por decisión de diseño) — Sistema de Gacha

**⚠️ Bloqueada por el Principio VI de la constitución** ("gacha real... no se implementa hasta que la vertical slice esté jugable y validada"). No la mandes a `/speckit.plan` sin antes decidir si ya se considera "validada" la vertical slice, y sin actualizar la constitución (`/speckit.constitution`) para levantar la excepción explícitamente.

**Alcance** (cuando se desbloquee): moneda del juego y/o tickets obtenidos jugando, tirada de gacha para conseguir mejores unidades y mejoras de base, integrado con el dashboard (Fase 5).

**Input para /speckit.specify** (guardar para cuando se decida avanzar):
```
Sistema de gacha de "The Battler": el jugador usa moneda del juego o tickets (obtenidos jugando) para hacer tiradas de gacha y conseguir nuevas unidades o mejoras de base, accesible desde el dashboard de base (spec de Fase 5). [Requiere excepción documentada al Principio VI de la constitución antes de continuar a /speckit.plan.]
```

---

## Fase 14 — Sistema de Rebranding / Theming

**Por qué va al final**: no es lógica de gameplay — es una capa de configuración de marca (nombre del juego, assets de arte, textos) que permite relanzar el mismo motor como "The Battler Princess" o "The Battler Dogs" sin tocar los sistemas anteriores. Tiene sentido especificarlo último, cuando ya se sabe qué strings/assets están hardcodeados en cada sistema previo.

**Input para /speckit.specify**:
```
Sistema de rebranding de "The Battler": permite cambiar el nombre del juego y sus assets de marca (logo, textos de título) para relanzar el mismo proyecto como una variante distinta (ej. "The Battler Princess", "The Battler Dogs") sin modificar la lógica de los sistemas de juego ya implementados. Definir qué queda como configuración de datos vs. qué requiere reemplazo de assets.
```

---

## Orden recomendado (resumen)

1. Fase 3 — Menú Principal y Configuración ✅ (`003-main-menu-config`)
2. Fase 4 — Mapa de Aventuras (Banners) ✅ (`004-adventure-map-banners`)
3. Fase 5 — Dashboard de Base ✅ (`005-player-dashboard`)
4. Fase 6 — Energía y Dificultad ✅ (`006-mission-energy-system`)
5. Fase 7 — Attack Types ✅ (`007-attack-types`)
6. Fase 9 — Clasificación (antes que Fase 8 por dependencia) ✅ (`008-classification-trait-abilities`, fusionada con Fase 8)
7. Fase 8 — Trait-Targeting / Neutral / Immunities ✅ (fusionada con `008-classification-trait-abilities`)
8. Fase 10 — Evolución de Unidad ✅ (`009-unit-evolution`)
9. Fase 11 — Capítulo 2 ✅ (`010-chapter2-hacia-futuro`)
   - *(fuera del alcance original de este roadmap)* `011-imported-asset-audit` / `012-real-asset-integration` ✅ — arte real
   - *(fuera del alcance original de este roadmap)* `013-empire-of-cats-saga` / `014-chapter-scaling-treasure-sets` ✅ — saga nueva + escalado avanzado
10. Fase 12 — Banner de Eventos 📝 especificada (`015-special-event-banner`), sin implementar
11. Fase 13 — Gacha (bloqueada hasta decisión explícita) — sin spec todavía
12. Fase 14 — Rebranding — sin spec todavía

---

## Cómo avanzar cada fase en Claude Code (resumen del flujo ya instalado en este repo)

Este repo ya tiene Spec Kit inicializado (`.specify/`, skills `speckit-*` en `.claude/skills/`). Por cada fase, dentro de Claude Code, en este repositorio:

1. `/speckit.specify <input de la fase>` — pega el bloque "Input para /speckit.specify" de la fase. Esto crea `specs/00X-nombre/spec.md`.
2. `/speckit.clarify` — resuelve ambigüedades marcadas [NEEDS CLARIFICATION] antes de planear.
3. `/speckit.checklist` — genera el checklist de calidad de la spec.
4. `/speckit.plan` — genera el plan técnico (Unity/C#, qué ScriptableObjects, qué escenas).
5. `/speckit.tasks` — desglosa el plan en tareas ejecutables.
6. `/speckit.analyze` — valida consistencia entre spec, plan y tareas.
7. `/speckit.implement` — Claude Code escribe el código C#/Unity siguiendo las tareas.

Repite fase por fase, en el orden recomendado arriba. Cada fase es independiente en su propio `specs/00X-.../`, así que puedes hacer todo el ciclo (specify→implement) de una fase antes de pasar a la siguiente, o encolar varias specs primero y planear después — ambos flujos son válidos con Spec Kit.
