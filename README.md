# Battle Cats Web

Tower-defense 1D estilo *The Battle Cats*, 100% web nativo — sin backend, sin cuenta de jugador, progreso local vía IndexedDB.

**Stack**: Vite + React 19 + TypeScript · Pixi.js (`@pixi/react`) para el render de combate en tiempo real, con sprites reales por frame (reskin Cyber-Modern) · Zustand para estado · Dexie sobre IndexedDB para persistencia · Vitest para testing.

Las reglas de diseño y técnicas del proyecto están fijadas en [`.specify/memory/constitution.md`](.specify/memory/constitution.md). El desarrollo sigue Spec-Driven Development: cada feature no trivial pasa por `spec.md` → `plan.md` → `tasks.md` bajo [`specs/`](specs/) antes de escribirse en código.

---

## Cómo ejecutar la aplicación

Requisitos: Node.js (con npm).

```bash
npm install
npm run dev
```

Esto levanta Vite en modo desarrollo con hot-reload (por defecto en `http://localhost:5173`). No hace falta backend ni variables de entorno — todo corre en el navegador.

Otros comandos disponibles (`package.json`):

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo Vite con HMR |
| `npm run build` | Type-check (`tsc -b`) + build de producción a `dist/` |
| `npm run preview` | Sirve el build de `dist/` localmente para verificarlo |
| `npm test` | Corre la suite de Vitest (`src/engine/`, stores, componentes) |
| `npm run lint` | Lint con `oxlint` |

El progreso del jugador se guarda en IndexedDB del navegador (base `BattleCatsDB` vía Dexie, actualmente en versión 15 de esquema) — persiste entre recargas pero es local a ese navegador/perfil; borrar los datos del sitio reinicia el progreso.

`scripts/copy-sprites.mjs` es un script manual de un solo uso (no corre en `dev`/`build`) que copia los frames `idle`/`attack` de los 12 héroes usados por `src/data/cats.ts` desde `assets-source/` hacia `public/sprites/`.

---

## Estado actual

El proyecto completó 41 specs numeradas bajo `specs/`, cada una construida sobre la anterior sin tocar sus capas ya cerradas. `npx tsc -b` limpio y `npm test` en verde (**58 archivos, 783 tests**) al momento de escribir esto — las 41 specs están 100% completas, incluidas sus tareas de verificación manual en navegador. Las specs `029` a `037` cerraron un backlog propio derivado de comparar el mockup de referencia y el manual técnico contra el estado real de `src/` tras `028` (ver nota de origen en `specs/029-pulido-batalla-hud/spec.md`); `037-tienda` fue, por diseño, la última spec de ese backlog. `038-catalogo-habilidades-avanzado` abre uno nuevo, retomando el catálogo de habilidades de `specs/015` justo donde ese spec dejó explícitamente pendiente ("candidato a una iteración futura") Golpe Letal, Killers de rasgo, Escudo e Invocar; `039-habilidades-control-defensa` continúa esa misma cola con Fortalecer, Esquivar, Sobrevivir y Retroceso, y `040-dinero-extra-inmunidades` la cierra por ahora con Dinero Extra y la inmunidad de unidades (jefes) a Golpe Letal, Killer y Retroceso. `041-cabezas-de-canon` aprovecha el desplazamiento de Retroceso de `039` para cerrar lo que `specs/035` dejó pendiente: las Cabezas de Cañón del Cuerpo Ototo. (El conteo de tests excluye `.claude/worktrees/`, copias antiguas del repo que la app de escritorio deja en disco y que `vite.config.ts` ya no recoge — antes inflaban la cifra a 77 archivos/776 tests.)

| Spec | Contenido | Tareas |
|---|---|---|
| [`001-nucleo-del-juego`](specs/001-nucleo-del-juego/) | Arquitectura base, pantallas, navegación, stores, persistencia Dexie | ✅ 23/23 |
| [`002-motor-de-combate`](specs/002-motor-de-combate/) | Motor real: colisión AABB 1D, daño, oleadas, energía, victoria/derrota | ✅ 24/24 |
| [`003-identidad-visual-animada`](specs/003-identidad-visual-animada/) | Unidades como cuerpos animados (idle/ataque) por tipo de gato | ✅ 16/16 |
| [`004-menu-principal-config`](specs/004-menu-principal-config/) | Menú principal y pantalla de configuración (volumen, idioma) | ✅ 15/15 |
| [`005-mapa-de-niveles`](specs/005-mapa-de-niveles/) | Mapa de niveles con desbloqueo secuencial | ✅ 9/9 |
| [`006-dashboard-base-jugador`](specs/006-dashboard-base-jugador/) | Dashboard de base del jugador | ✅ 17/17 |
| [`007-energia-mision-dificultad`](specs/007-energia-mision-dificultad/) | Energía de misión con regeneración y dificultad progresiva | ✅ 19/19 |
| [`008-tipos-de-ataque`](specs/008-tipos-de-ataque/) | Tipos de ataque: `Single` / `Area` / `LongRange` | ✅ 18/18 |
| [`009-clasificacion-habilidades`](specs/009-clasificacion-habilidades/) | Clasificación de gatos/enemigos y habilidades por rasgo (`TraitTargeting`, `Curse`) | ✅ 16/16 |
| [`010-evolucion-de-gatos`](specs/010-evolucion-de-gatos/) | Evolución de gatos (`Base` → `Second` → `True`) vía ítems | ✅ 16/16 |
| [`011-nivel-2-hacia-el-futuro`](specs/011-nivel-2-hacia-el-futuro/) | Segundo nivel jugable con gatos nuevos | ✅ 11/11 |
| [`012-saga-imperio-de-los-gatos`](specs/012-saga-imperio-de-los-gatos/) | Arcos de saga, Gatorreta y Brote Zombi | ✅ 36/36 |
| [`013-escalado-capitulos-sets-tesoros`](specs/013-escalado-capitulos-sets-tesoros/) | Escalado por arco y sets de tesoros con bonificación pasiva | ✅ 19/19 |
| [`014-banner-evento-especial`](specs/014-banner-evento-especial/) | Banner especial de evento: "Etapas de Fantasía" | ✅ 15/15 |
| [`015-catalogo-habilidades-combate`](specs/015-catalogo-habilidades-combate/) | Efectos `Weaken` / `Freeze` / `Slow`, resistencias | ✅ 21/21 |
| [`016-multigolpe-critico`](specs/016-multigolpe-critico/) | Tipos de ataque `MultiHit` y `Critical` | ✅ 13/13 |
| [`017-objetos-de-batalla`](specs/017-objetos-de-batalla/) | Objetos de batalla seleccionables pre-combate (máx. 3) | ✅ 20/20 |
| [`018-bibliotecas-consulta`](specs/018-bibliotecas-consulta/) | Guía de gatos, guía de enemigos y menú de tesoros | ✅ 22/22 |
| [`019-rango-de-usuario`](specs/019-rango-de-usuario/) | Sistema de rango de usuario con umbrales reclamables | ✅ 14/14 |
| [`020-barrera-de-base`](specs/020-barrera-de-base/) | Barrera de base y jefes vinculados | ✅ 15/15 |
| [`021-reskin-cyber-modern`](specs/021-reskin-cyber-modern/) | Reskin visual Cyber-Modern + sprites reales de combate (12 héroes) | ✅ 50/50 |
| [`022-datos-semilla-flujo-navegacion`](specs/022-datos-semilla-flujo-navegacion/) | Datos semilla, assets procedimentales y flujo de navegación | ✅ 20/20 |
| [`023-mapa-de-etapas-visual`](specs/023-mapa-de-etapas-visual/) | Mapa visual de etapas, catálogo completo de gatos obtenibles y grilla de despliegue fija | ✅ 23/23 |
| [`024-sistema-gacha`](specs/024-sistema-gacha/) | Sistema de gacha completo: banners con tasas propias, tirada simple/x11, Almacén de cápsulas, duplicados como nivel "+" | ✅ 37/37 |
| [`025-cat-combos`](specs/025-cat-combos/) | Cat Combos: bonificación pasiva automática por combinación de unidades en la formación activa | ✅ 18/18 |
| [`026-navegacion-hub-mockup`](specs/026-navegacion-hub-mockup/) | Hub persistente con dock inferior; Equipar/Mejorar/Cápsula/Biblioteca/Ajustes/Menú de Tesoros como paneles superpuestos; Perfil de Jugador y Buzón de Noticias nuevos | ✅ 45/45 |
| [`027-capitulo-1-imperio-gatos`](specs/027-capitulo-1-imperio-gatos/) | Contenido del Capítulo 1 de Imperio de los Gatos, basado en el manual técnico: 14 gatos jugables + 16 enemigos nuevos, 48 etapas (13 hito a mano + 35 por plantilla), arco y set de tesoros propios | ✅ 19/19 |
| [`028-ajustes-combate-mapa-disenos`](specs/028-ajustes-combate-mapa-disenos/) | Ajustes tras jugar `027`: combate por "Refuerzo de fila" (Constitución v2.0.0), pestañas de mapa con scroll, diseños procedurales distintos para las 30 unidades nuevas | ✅ 18/18 |
| [`029-pulido-batalla-hud`](specs/029-pulido-batalla-hud/) | Primera spec del backlog Nivel A: expone en la UI mecánica que el motor/estado ya calculaba (HUD de batalla, sin datos ni persistencia nueva) | ✅ 26/26 |
| [`030-filtro-detalle-unidad`](specs/030-filtro-detalle-unidad/) | Nivel B: filtro por rareza/rasgo/habilidad en Equipar y Guía de Gatos + panel de detalle de unidad compartido (stats completos, tabs de forma, botón de evolución) | ✅ 19/19 |
| [`031-mejoras-de-base`](specs/031-mejoras-de-base/) | Nivel B: mejoras de base compradas con moneda, conectadas a mecánica de combate/progreso ya existente | ✅ 23/23 |
| [`032-festival-de-tesoros`](specs/032-festival-de-tesoros/) | Nivel B (última): festival de tesoros con ventana de tiempo, reutiliza el patrón de `014`/`015` | ✅ 12/12 |
| [`033-misiones-catnip-challenges`](specs/033-misiones-catnip-challenges/) | Nivel C (primer subsistema nuevo): misiones diarias con progreso y recompensa reclamable, reinician por cambio de día del dispositivo | ✅ 25/25 |
| [`034-gamatoto`](specs/034-gamatoto/) | Nivel C: expediciones asíncronas por timestamp persistido (avanzan con la app cerrada), otorgan materiales de Gamatoto | ✅ 19/19 |
| [`035-ototo-corps`](specs/035-ototo-corps/) | Nivel C: consume materiales de Gamatoto para variantes de Gatorreta con bonos pasivos de equipo | ✅ 20/20 |
| [`036-talentos-orbes`](specs/036-talentos-orbes/) | Nivel C: mejora post-Forma Verdadera vía Orbes/NP, primer sumidero de `npCurrency` (`024`) | ✅ 31/31 |
| [`037-tienda`](specs/037-tienda/) | Quinta y última spec del backlog: sumidero de moneda vía objetos de batalla e ítems de evolución (sin pagos reales, fuera de alcance por Constitución § V) | ✅ 19/19 |
| [`038-catalogo-habilidades-avanzado`](specs/038-catalogo-habilidades-avanzado/) | Retoma `specs/015` donde quedó pendiente: 4 `Ability` nuevas — Golpe Letal (`MassiveDamage`), Killers de rasgo (`TraitKiller`), Escudo (`Shield`/`shieldRemainingHp`) e Invocar (`SummonOnDeath`) | ✅ 23/23 |
| [`039-habilidades-control-defensa`](specs/039-habilidades-control-defensa/) | Segunda tanda del catálogo de habilidades: 4 `Ability` nuevas — Fortalecer (`Strengthen`, más daño bajo un umbral de vida), Esquivar (`Dodge`), Sobrevivir (`Survive`) y Retroceso (`Knockback`, desplaza al objetivo hacia su base); unifica la tubería por golpe en `applyHit` | ✅ 25/25 |
| [`040-dinero-extra-inmunidades`](specs/040-dinero-extra-inmunidades/) | Tercera tanda del catálogo de habilidades: Dinero Extra (`ExtraMoney`, energía de batalla extra por enemigo derrotado por el golpe de la unidad) e inmunidad a habilidades (`immuneAbilities`: Golpe Letal, Killer, Retroceso), visibles en el detalle de unidad y la Guía de Enemigos | ✅ 23/23 |
| [`041-cabezas-de-canon`](specs/041-cabezas-de-canon/) | Cabezas de Cañón (Ototo Corps): tercera construcción con cinco efectos secundarios elegibles para el cañón especial (Retroceso, Debilitar, Congelar, Ralentizar, Maldecir), aplicados a los enemigos alcanzados que sobreviven; etiqueta del efecto en el HUD de batalla | ✅ 17/17 |

### Contenido de juego

- **56 gatos jugables** en [`src/data/cats.ts`](src/data/cats.ts) (`CATS.length` es 59: incluye además 3 fichas de enemigo reutilizadas con el mismo tipo `Cat` para `EnemyGuideScreen`, nunca desplegables por el jugador): 12 de producción (cada uno con `spriteKey` propio `hero_1`…`hero_12` y sprites reales de idle/ataque en `public/sprites/`), 4 gatos semilla con diseño procedimental (`specs/022`), 4 exclusivos de gacha (`Legendario`/`Colaboración`, [`src/data/gachaUnits.ts`](src/data/gachaUnits.ts), sin sprite propio — usan el fallback `Graphics`, mezclados en `CATS` vía spread) y 14 del Capítulo 1 (`specs/027`: 10 Normal + 3 Especial + `cat-veterano`, sin sprite propio pero con diseño procedural propio desde `specs/028` — [`src/data/imperioCap1Design.ts`](src/data/imperioCap1Design.ts)); el resto son gatos del núcleo original/habilidades de combate/multigolpe-crítico previos a `specs/022`. Los gatos sin recompensa asignada de esas specs tempranas (y los 4 semilla) se otorgan al completar los arcos de saga (`specs/023`); los 4 de gacha solo se obtienen tirando en la Cápsula (`specs/024`); los 14 del Capítulo 1 se obtienen jugando sus etapas (`specs/027`); cada gato con Forma Verdadera puede además invertir Orbes/NP en Talentos (`specs/036`, panel en `UnitDetailPanel`).
- **51 niveles** en [`src/data/levels.ts`](src/data/levels.ts) (3 fixture + 48 del Capítulo 1, `specs/027`), agrupados en **3 arcos de saga** ([`src/data/sagaArcs.ts`](src/data/sagaArcs.ts)), presentados como **mapa visual de nodos** conectados (`LevelSelectScreen`, `specs/023`), agrupados en pestañas por región con scroll vertical de altura dinámica desde `specs/028` (en vez de los 51 nodos amontonados en un único lienzo).
- **Sets de tesoros** con bonificación pasiva ([`src/data/treasureSets.ts`](src/data/treasureSets.ts)) y **eventos especiales** con banner propio ([`src/data/events.ts`](src/data/events.ts)), representado como nodo de borde dorado en el mapa.
- **3 objetos de batalla** seleccionables antes del combate ([`src/data/battleItems.ts`](src/data/battleItems.ts)): aceleración de velocidad, energía extra, radar de tesoro.
- **Umbrales de rango de usuario** reclamables ([`src/data/userRankThresholds.ts`](src/data/userRankThresholds.ts)).
- **Equipo activo tope de 6** (`MAX_ACTIVE_TEAM_SIZE`, `useMetaStore.ts`) — la barra de despliegue en batalla es una grilla fija de 6 columnas, sin scroll horizontal (`specs/023`).
- **Gacha completo** ([`src/data/gacha.ts`](src/data/gacha.ts)): 3 banners (`UBERFEST`/`EPICFEST`/Estándar) con tasas propias por rareza, tirada simple (150 Cat Food) o x11 (1.500), resultado depositado sin activar en el Almacén (`gachaStorage`) y duplicados convertidos en nivel "+" (`plusLevel`) — todo en `GachaScreen` (`specs/024`).
- **Cat Combos** ([`src/data/catCombos.ts`](src/data/catCombos.ts)): 2 combinaciones fijas de catIds (`combo-nucleo-original`, `combo-especialistas-control`) que otorgan una bonificación pasiva (energía o recompensa de moneda) al llevarlas completas a la formación activa — visibles y con estado en vivo (completo/incompleto, no-poseído vs. no-en-formación) en `TeamScreen` (`specs/025`).
- **Buzón de Noticias** ([`src/data/news.ts`](src/data/news.ts)): catálogo estático de novedades del juego (título/fecha/descripción), con estado de lectura persistido (`newsRead`) e indicador en el Hub mientras haya alguna sin leer (`specs/026`).
- **Capítulo 1 de Imperio de los Gatos** (`specs/027`): 14 gatos jugables nuevos (10 Normal + 3 Especial + `cat-veterano` de recompensa de arco) y 16 enemigos nuevos (incl. el jefe `enemy-la-mascara`) en [`src/data/cats.ts`](src/data/cats.ts); 48 etapas nuevas (`imperio-cap1-etapa-1`…`-48`, 13 hito a mano + 35 generadas por plantilla) en [`src/data/levels.ts`](src/data/levels.ts), agrupadas en el arco `arco-imperio-de-los-gatos-cap1` ([`src/data/sagaArcs.ts`](src/data/sagaArcs.ts), 33% más barato/100% de fuerza) con su propio `TreasureSet` de 48 tesoros ([`src/data/treasureSets.ts`](src/data/treasureSets.ts), +15% de moneda). `cat-recluta` es un segundo gato inicial garantizado junto al de siempre (`ensureDefaultProfile`, `src/db/index.ts`).
- **Filtro y detalle de unidad** (`specs/030`, [`src/data/catFilter.ts`](src/data/catFilter.ts)): filtro por rareza/rasgo objetivo/habilidad (combinable Y/O, orden por nivel) en Equipar y Guía de Gatos, más un panel de detalle compartido ([`UnitDetailPanel`](src/screens/shared/UnitDetailPanel.tsx)) con stats completos, tabs por forma de evolución, botón de evolución conectado a `evolveCat()` (`specs/010`) y la sección de Talentos (`specs/036`).
- **Mejoras de Base** (`specs/031`, [`src/data/baseUpgrades.ts`](src/data/baseUpgrades.ts)): mejoras compradas con moneda que refuerzan mecánica de combate/progreso ya existente (vida de base, energía, etc.), persistidas en la tabla `baseUpgrades`.
- **Festival de Tesoros** (`specs/032`, [`src/data/treasureFestival.ts`](src/data/treasureFestival.ts)): ventana de tiempo con bonificación extra de tesoros, mismo patrón de evento programado que `specs/014`/`015`.
- **Misiones (Catnip Challenges)** (`specs/033`, [`src/data/missions.ts`](src/data/missions.ts), `MissionsPanel`): objetivos diarios fijos (completar etapas, desplegar unidades, derrotar enemigos) con progreso visible y recompensa de moneda reclamable; se reinician al cambiar el día calendario del dispositivo (tabla `missions`).
- **Gamatoto** (`specs/034`, [`src/data/gamatoto.ts`](src/data/gamatoto.ts), `GamatotoPanel`): expedición asíncrona con duración elegida cuyo progreso se calcula por timestamp persistido (tabla `gamatoto`) — avanza aunque la app esté cerrada; al reclamarse otorga materiales de Gamatoto, consumidos por `specs/035`.
- **Ototo Corps** (`specs/035`, [`src/data/ototoCorps.ts`](src/data/ototoCorps.ts), `OtotoCorpsPanel`): variantes de Gatorreta construidas con materiales de Gamatoto (tabla `ototoCorps`) que dan bonos pasivos de equipo (reducción de daño por rasgo, resistencia a debuff, reutilizando `TraitResistance`/`resistantTo` de `specs/015`).
- **Talentos y Orbes** (`specs/036`, [`src/data/talents.ts`](src/data/talents.ts)): mejora post-Forma Verdadera pagada con Orbes/NP — primer sumidero de `npCurrency` (introducido sin uso por `specs/024`); visible en la pestaña de Talentos de `UnitDetailPanel`.
- **Tienda** (`specs/037`, [`src/data/shop.ts`](src/data/shop.ts), `ShopPanel`): sumidero de moneda para objetos de batalla e ítems de evolución (comprar hasta completar la cantidad requerida para evolucionar a Forma Verdadera); no incluye el "Cat Food Shop" de pagos reales del manual técnico, fuera de alcance por Constitución § V.
- **Catálogo de habilidades avanzado** (`specs/038`, `src/engine/types.ts`/`combat.ts`/`simulation.ts`): 4 `Ability` nuevas que retoman lo que `specs/015` dejó explícitamente pendiente — **Golpe Letal** (`MassiveDamage`, probabilidad de multiplicar el daño de un golpe, incluido contra bases), **Killers de rasgo** (`TraitKiller`, probabilidad de eliminar instantáneamente a un enemigo del rasgo declarado — sembrado con Zombie/Metálico), **Escudo** (`Shield`/`BattleUnit.shieldRemainingHp`, absorbe daño antes que la vida) e **Invocar** (`SummonOnDeath`, genera unidades aliadas al morir). 5 gatos de demostración nuevos en [`src/data/cats.ts`](src/data/cats.ts) (`massive-strike-cat`, `zombie-hunter-cat`, `metal-hunter-cat`, `shield-cat`, `summoner-cat`), visibles en `UnitDetailPanel` (`describeAbility`).
- **Habilidades de control y defensa** (`specs/039`, `src/engine/types.ts`/`combat.ts`): 4 `Ability` más, sin campos nuevos en `BattleUnit` — **Fortalecer** (`Strengthen`, el daño de la unidad se multiplica mientras su vida esté en o bajo un umbral, también contra bases), **Esquivar** (`Dodge`, probabilidad por golpe de anular el golpe entero: sin daño, escudo, efectos ni Retroceso), **Sobrevivir** (`Survive`, probabilidad de quedar con 1 de vida ante un golpe letal, incluida una eliminación de Killer) y **Retroceso** (`Knockback`, probabilidad de empujar al objetivo vivo hacia su propia base sin sacarlo del carril — el borde enemigo sale de `Level.laneLength`). `Curse` suspende las cuatro. 4 gatos de demostración nuevos (`strengthen-cat`, `dodge-cat`, `survivor-cat`, `knockback-cat`), visibles en `UnitDetailPanel`; igual que los de `038`, los cuatro son de rareza `Raro` y por tanto salen de la Cápsula (ver "Qué falta").
- **Dinero Extra e inmunidades** (`specs/040`, `src/engine/types.ts`/`combat.ts`/`simulation.ts`): **Dinero Extra** (`ExtraMoney`) concede una cantidad fija de energía de batalla (el "dinero" con que se despliega) cada vez que una unidad del jugador asesta el golpe que derrota a un enemigo — el golpe letal marca el bono en el derrotado (`BattleUnit.defeatBounty`, efímero) y `stepSimulation` lo suma a `energy.current` con tope en el máximo, nunca por el cañón especial ni para el lado enemigo; **inmunidad a habilidades** (`immuneAbilities` en `Cat`/`BattleUnit`) hace que un defensor ignore por completo Golpe Letal, Killer y/o Retroceso — sin consumir su tirada — y `enemy-la-mascara`, el jefe del Capítulo 1, ya es inmune a las tres. Se ven en `UnitDetailPanel` (`Inmune a: …`) y en la Guía de Enemigos. 2 gatos de demostración nuevos (`wallet-cat`, `anchor-cat`); como los de `038`/`039`, de rareza `Raro` (entran en el pool de la Cápsula).
- **Cabezas de Cañón** (`specs/041`, [`src/data/ototoCorps.ts`](src/data/ototoCorps.ts), `OtotoCorpsPanel`, `applyCannonHead` en `src/engine/combat.ts`): tercera construcción del Cuerpo Ototo — "Cabeza de Cañón", con el mismo flujo de materiales de Gamatoto y construcción por timestamp que Base y Estilo (la elección se guarda junto a ellas en la fila `ototoCorps`, sin nueva versión de esquema) — que da al cañón especial un efecto secundario elegible: **Retroceso** (empuja a los enemigos alcanzados hacia su base, con tope de carril, reutilizando `specs/039`) o **Debilitar/Congelar/Ralentizar/Maldecir** (reutilizando las reglas de `specs/015`: inmunidad, resistencia y refresco). Solo recibe el efecto el enemigo alcanzado que sobrevive al daño, que no cambia; un enemigo inmune a Retroceso (`specs/040`, p. ej. La Máscara) recibe el daño pero no se desplaza. El control de cañón del HUD de batalla muestra "Cañón · {efecto}" cuando hay cabeza construida.

### Qué falta (próximas fases)

No queda ninguna spec abierta: `001`–`041` están completas y no hay tareas pendientes en ningún `tasks.md`. Lo que sigue **no tiene spec todavía**; candidatos, ordenados por cercanía a lo ya construido:

1. **Cola del catálogo de habilidades (`038`–`040`)** — con `TraitTargeting`, `Neutral`, `TraitResistance`, `MassiveDamage`, `TraitKiller`, `Shield`, `SummonOnDeath`, `Strengthen`, `Dodge`, `Survive`, `Knockback` y `ExtraMoney`, más los efectos `Curse`/`Weaken`/`Freeze`/`Slow` y los ataques `MultiHit`/`Critical`, quedan fuera unas 24 variantes del catálogo de referencia: Warp, Tóxico, Fuerte/Masivo/Resistente por rasgo adicionales, y las Killers de los demás rasgos (el motor ya las soporta: es solo contenido). Además, la ventana de evasión de Esquivar, el retroceso estándar por umbrales de vida, el valor de dinero propio de cada enemigo (que Dinero Extra multiplicaría) e inmunidades a más habilidades.
2. **Calendario de eventos general (Fase 25 del plan técnico)** — eventos recurrentes (Meow Meow Day, eventos mensuales) más allá del banner único (`014`) y el Festival de Tesoros (`032`).
3. **Contenido** — solo existe el Capítulo 1 de Imperio de los Gatos (`027`) y el nivel "Hacia el Futuro" (`011`); faltan los capítulos siguientes.
4. **Respec de Talentos** — reiniciar y reelegir debuff/rasgo (diferido por `036`).
5. **Migraciones de datos opcionales** — mover `Metal` de clasificación especial a estándar y separar `EnemyStrengthMultiplier` en HP%/Daño% (Grupo B de `docs/plan-tecnico-manual-completo.md`); requieren plan de migración propio.
6. **Revisar los gatos de demostración en el pool de gacha** — `GACHA_POOL` (`src/data/gacha.ts`) filtra `CATS` por rareza, así que los 10 gatos de demostración de rareza `Raro` de `038`–`040` ya salen de la Cápsula: el pool `Raro` pasó de 6 gatos originales a 16 entradas (el 62,5 % de una tirada `Raro` es hoy un gato de demostración). Solo `shield-cat` (`Especial`) queda fuera de gacha. Decidir si se quedan, se mueven a una rareza fuera de gacha (`Normal`/`Especial`/`Colaboración`) o se reparten como recompensas de nivel/arco es una decisión de balance pendiente.
7. **Rebranding/Theming (Fase 14 de `docs/roadmap-fases.md`)** — por diseño la última; capa de marca (nombre, logo, textos) sin tocar la lógica.

Fuera de alcance por diseño: el "Cat Food Shop" de pagos reales (Constitución § V).

---

## Arquitectura

### Vista de capas

```
React (pantallas, UI reactiva a eventos)
  │  useGameStore / useMetaStore (Zustand)
  ▼
src/engine/*            ← simulación pura, sin React ni Pixi, testeada con Vitest
src/game/*               ← puente Pixi.js: lee el store por tick, dibuja/anima sprites reales
src/db/*                 ← Dexie sobre IndexedDB (persistencia, 15 versiones de esquema)
src/data/*               ← contenido (gatos, niveles, saga, tesoros, eventos, objetos, rangos)
```

Principio central (Constitución § VI): la simulación de combate vive en funciones puras de TypeScript sin ninguna dependencia de React/Pixi; React gobierna solo pantallas y UI discreta; Pixi gobierna solo el render en tiempo real. **Ningún componente de React vuelve a renderizar en el tick de 60fps del combate** — la UI overlay lee el estado vía selectores acotados de Zustand.

### Estructura de directorios

```
src/
├── main.tsx              # Entry point (ReactDOM.createRoot)
├── App.tsx                # Router manual por useState<Screen> — sin librería de routing. Solo 5 vistas base
│                           # (Title/MainMenu/LevelSelect/Battle/Result); el resto vive dentro de HubScreen
│                           # como paneles superpuestos (specs/026)
├── types/screen.ts        # type Screen (sin cambios, 12 valores) + type PanelId (specs/026, ampliado por 033-037):
│                           # 'Equip' | 'Upgrade' | 'Gacha' | 'Library' | 'Settings' | 'TreasureMenu'
│                           # | 'PlayerProfile' | 'News' | 'Missions' | 'Gamatoto' | 'OtotoCorps' | 'Shop'
│                           # — stack de paneles del Hub, independiente de Screen
├── screens/                # Una pantalla por archivo, navegación vía prop onNavigate
│   ├── HubScreen.tsx      # Hub persistente (specs/026): HUD + dock + accesos destacados + panel stack
│   ├── PlayerProfilePanel.tsx / NewsPanel.tsx  # Paneles nuevos del Hub (specs/026)
│   ├── panels/LibraryPanel.tsx                 # Agrupa CatGuide/EnemyGuide en tabs bajo "Biblioteca"
│   └── shared/PanelOverlay.tsx                 # Contenedor de overlay reutilizable (backdrop + focus trap)
├── state/
│   ├── useGameStore.ts    # Estado efímero de la partida en curso (nunca persistido)
│   └── useMetaStore.ts    # Progreso persistente del jugador, hidratado desde Dexie al arrancar
├── engine/                 # Simulación pura — sin imports de React/Pixi
│   ├── types.ts           # BattleUnit, AttackType, ClassificationType, Ability, EffectType
│   ├── collision.ts       # overlaps1D — AABB en 1D
│   ├── combat.ts          # resolveEngagement, resolveAreaEngagement, resolveBaseDamage (golpe individual: applyHit)
│   └── simulation.ts      # stepSimulation — el reducer puro de un tick completo
├── game/                   # Puente hacia Pixi.js
│   ├── BattleStage.tsx    # <Application> de Pixi + BattleField (mount/unmount por unidad)
│   ├── UnitSprite.tsx     # Sprite real (idle/attack por frame) + animación por transform en cada tick
│   ├── DeathEchoSprite.tsx # Señal visual de "death echo" al morir una unidad
│   ├── animation.ts       # Funciones puras: Cat → VisualProfile, pose de animación por frame
│   ├── spriteAssets.ts    # Manifest de rutas de textura idle/attack por spriteKey (hero_1..hero_12)
│   ├── enemyEncounters.ts # Registro de enemigos vistos (alimenta EnemyGuideScreen)
│   └── graphics/unitFactory.ts # Construcción de BattleUnit desde Cat + contenido de nivel/evento
├── data/
│   ├── cats.ts             # Catálogo de gatos (stats + spriteKey)
│   ├── levels.ts           # Niveles (bases, energía, oleada enemiga, mapPosition en el mapa visual)
│   ├── sagaArcs.ts         # Arcos de saga y agrupación de niveles
│   ├── events.ts           # Eventos especiales / banners
│   ├── treasureSets.ts     # Sets de tesoros y sus bonificaciones pasivas
│   ├── battleItems.ts      # Objetos de batalla seleccionables pre-combate
│   ├── userRankThresholds.ts # Umbrales de rango de usuario
│   ├── missionEnergy.ts    # Cálculo de energía máxima/regeneración
│   ├── levelState.ts       # Resolución de estado derivado de nivel (bloqueado/desbloqueado/completado)
│   ├── seedData.ts         # Datos semilla de bootstrap (specs/022)
│   ├── gacha.ts             # Banners, tasas por rareza y rollOne/rollMany (specs/024)
│   ├── gachaUnits.ts       # 4 gatos exclusivos de gacha (Legendario/Colaboración, specs/024)
│   ├── catCombos.ts        # Cat Combos, su bonificación pasiva y getCompletedCombos (specs/025)
│   ├── news.ts              # Catálogo estático del Buzón de Noticias (specs/026)
│   ├── imperioCap1Design.ts # Diseño procedural de las 30 unidades del Capítulo 1 (specs/027-028)
│   ├── catFilter.ts        # Filtro por rareza/rasgo/habilidad para Equipar y Guía de Gatos (specs/030)
│   ├── baseUpgrades.ts     # Catálogo de mejoras de base compradas con moneda (specs/031)
│   ├── treasureFestival.ts # Ventana de tiempo con bonificación extra de tesoros (specs/032)
│   ├── missions.ts         # Misiones diarias (Catnip Challenges) y su progreso/recompensa (specs/033)
│   ├── gamatoto.ts         # Expediciones asíncronas por timestamp persistido (specs/034)
│   ├── ototoCorps.ts       # Variantes de Gatorreta, bonos pasivos de equipo (specs/035) y Cabezas de Cañón (specs/041)
│   ├── talents.ts          # Talentos/Orbes post-Forma Verdadera (specs/036)
│   └── shop.ts              # Objetos de batalla e ítems de evolución comprables (specs/037)
└── db/index.ts             # Esquema Dexie (15 versiones) + ensureDefaultProfile()
```

### Flujo de pantallas

`App.tsx` mantiene un `useState<Screen>` simple (sin router) y renderiza la vista base activa por `switch` — solo 5 casos (`Title`/`MainMenu`/`LevelSelect`/`Battle`/`Result`). Al montar, hidrata `useMetaStore` desde IndexedDB antes de mostrar nada.

Desde `specs/026-navegacion-hub-mockup`, `MainMenu` es `HubScreen`: un Hub persistente (rango/energía/moneda + dock inferior) sobre el que Equipar/Mejorar/Cápsula/Biblioteca/Ajustes/Menú de Tesoros/Perfil de Jugador/Buzón de Noticias/Misiones/Gamatoto/Ototo Corps/Tienda se abren como **paneles superpuestos** (`PanelOverlay`, con foco atrapado y fondo del Hub siempre visible detrás) en vez de pantallas de página completa — un stack local (`PanelId[]`) permite apilar un panel sobre otro (p. ej. Ajustes abierto desde Mejorar vuelve a Mejorar al cerrarse, no al Hub):

```
Title ──▶ Hub (HubScreen) ──┬──▶ LevelSelect ──▶ Battle ──▶ Result ──(Volver)──▶ LevelSelect
                             │        ▲                                             │
                             │        └─────────────────────────────────────────────┘ (Volver)
                             │        └──▶ [panel propio] TreasureMenu (specs/026 US5, no comparte stack con el Hub)
                             │
                             ├──▶ [panel] Equip (Team)
                             ├──▶ [panel] Upgrade ──┬──▶ [panel] Equip
                             │                      ├──▶ [panel] Library (CatGuide/EnemyGuide, tabs)
                             │                      └──▶ [panel] TreasureMenu
                             ├──▶ [panel] Gacha (Tirar / Almacén — el dock "Almacén" abre esta pestaña directo)
                             ├──▶ [panel] Settings
                             ├──▶ [panel] PlayerProfile ──▶ [panel] Settings (vuelve a PlayerProfile al cerrarse)
                             ├──▶ [panel] News (marca todo como leído al abrir)
                             ├──▶ [panel] Missions (specs/033, objetivos diarios reclamables)
                             ├──▶ [panel] Gamatoto (specs/034, expedición asíncrona por timestamp)
                             ├──▶ [panel] OtotoCorps (specs/035, consume materiales de Gamatoto)
                             └──▶ [panel] Shop (specs/037, objetos de batalla + ítems de evolución)
```

`LevelSelectScreen` renderiza el progreso como un **mapa visual de nodos** (círculos conectados por líneas punteadas, posicionados por `Level.mapPosition`; el evento especial activo aparece como nodo aparte de borde dorado, fuera de la cadena de pestañas) en vez de la lista vertical original, agrupado en **pestañas por `Level.region`** con lienzo de altura dinámica y scroll vertical cuando no caben todos los nodos (`specs/028`, sin alterar qué nivel está bloqueado/disponible/completado) — tocar un nodo disponible o completado abre un panel de detalle con dificultad en estrellas, costo de energía y el botón "¡Atacar!", que llama a `useGameStore.startLevel(levelId)` y navega a `Battle` (`specs/023`); un botón "Tesoros X%" propio abre el Menú de Tesoros superpuesto sobre el mapa (`specs/026`). `Upgrade` (panel "Mejorar") funciona como hub hacia `Equip` (formación activa, tope `MAX_ACTIVE_TEAM_SIZE`, con una sección "Cat Combos" que muestra en vivo qué combinaciones de gatos están completas o incompletas según la selección aún sin guardar, `specs/025`), `Library` (bibliotecas de consulta, specs/018, agrupadas bajo tabs "Cat Guide"/"Enemy Guide" desde `specs/026`) y `TreasureMenu`. `Gacha` ofrece selector de banner con desglose de tasas, tirada simple/x11 con pantalla de revelado, y el Almacén de cápsulas para activar (nueva unidad jugable) o intercambiar duplicados por XP/NP (`specs/024`).

### Motor de combate (`src/engine/`)

Determinista y puro — `stepSimulation(state, deltaSeconds) → nextState`, sin timers propios ni side effects:

1. **Energía y cooldowns** avanzan según `deltaSeconds`.
2. **Spawns de oleada**: se generan las `BattleUnit` enemigas cuyo `spawnAtSeconds` ya venció (`src/data/levels.ts`).
3. **Detección de combate**: por tipo de ataque (`Single`/`Area`/`LongRange`/`MultiHit`/`Critical`) y alcance (`attackRange`/`areaRadius`) se busca la unidad o base enemiga elegible en X (`overlaps1D`, AABB 1D extendido a rango); de haberla, ambas quedan `Engaged`; si no, la unidad avanza libremente (bloqueada solo por aliados delante que no estén `Moving`). **Refuerzo de fila** (`specs/028`, Constitución § I v2.0.0): toda unidad bloqueada — directa o transitivamente — detrás de una aliada ya `Engaged` se suma como atacante adicional contra el mismo objetivo primario de esa aliada, en el mismo tick (nunca contra objetivos de salpicadura); el objetivo sigue contraatacando como máximo una vez por tick, gobernado por su propio cooldown.
4. **Resolución de daño**: `resolveEngagement` (unidad vs. unidad) y `resolveBaseDamage` (unidad vs. base) aplican daño simultáneo según el cooldown propio de cada unidad, moduladas por `Ability`/`ClassificationType` (daño por rasgo), efectos activos (`Curse`/`Weaken`/`Freeze`/`Slow`) y multi-golpe/crítico; la muerte (`hp <= 0`) se marca en el mismo tick. Cada golpe individual — de la unidad, de una secuencia multi-golpe o de la salpicadura de área — pasa por una única tubería (`applyHit`, `specs/039`): Esquivar del defensor → daño base (Debilitar × Fortalecer × rasgo) → Golpe Letal → Crítico → Killer o escudo/`hp` → Sobrevivir del defensor → Retroceso del atacante → efectos on-hit; cada tirada de azar solo se consume si la habilidad aplica (el `random` es inyectable para los tests).
5. **Condición de victoria/derrota**: `enemyBase.hp <= 0` → `Victory`; `playerBase.hp <= 0` → `Defeat`.

`useGameStore.tick(deltaSeconds)` simplemente llama a `stepSimulation(get(), deltaSeconds)` y aplica el resultado — el store no contiene lógica de combate propia.

### Capa de render (`src/game/`)

- `BattleStage.tsx`: monta el `<Application>` de Pixi (vía `@pixi/react`) y su `useTick` maestro llama a `useGameStore.getState().tick(deltaSeconds)` en cada frame. `BattleField` solo dispara `setState` de React (re-render) cuando cambia el **conjunto** de `instanceId`s activos (nace/muere una unidad) — nunca por su posición.
- `UnitSprite.tsx`: por cada unidad activa, monta su sprite real (`spriteAssets.ts`, frames idle/attack por `spriteKey`) y en un `useTick` propio lee la unidad fresca directo de `useGameStore.getState()` por `instanceId` para mutar `position`/`scale`/frame vía `ref` — sin pasar por props ni re-render de React.
- `DeathEchoSprite.tsx`: señal visual efímera al morir una unidad (specs/003 US3).
- `animation.ts`: funciones puras — `getVisualProfile(cat)` deriva tamaño/ritmo de idle de los stats del gato; `getAnimationPose(...)` calcula la pose para un instante dado.
- `spriteAssets.ts` / `graphics/unitFactory.ts`: manifest de texturas y construcción de `BattleUnit` a partir de `Cat` + contenido del nivel/evento activo.

### Estado (Zustand)

- **`useGameStore`** — estado de la partida en curso: `status`, energía, HP de bases, `units[]`, cooldowns de despliegue, objetos de batalla seleccionados, tiempo transcurrido. Completamente efímero: `reset()` lo vuelve a `Idle`, nunca se persiste (Constitución § V).
- **`useMetaStore`** — progreso persistente del jugador: moneda, niveles desbloqueados/completados, gatos poseídos (nivel, XP, `evolutionStage`, `plusLevel` de duplicados de gacha), formación activa (`setActiveTeam`, tope `MAX_ACTIVE_TEAM_SIZE = 6`), energía de misión, ítems de evolución, tesoros obtenidos, recompensas de arco/set otorgadas (incluye `unlockCatIds` de los 13 gatos previamente inalcanzables, `specs/023`), inventario de objetos de batalla, enemigos avistados, rango reclamado, moneda de gacha/NP y cápsulas sin activar (`gachaStorage`, `specs/024`), novedades del Buzón ya leídas (`readNewsIds`/`markNewsRead`, `specs/026`), y ajustes. Se hidrata una vez desde Dexie al arrancar (`hydrate()`) y cada acción de mutación escribe de inmediato en IndexedDB (sin paso de "guardar" separado).

### Persistencia (`src/db/index.ts`)

Dexie sobre IndexedDB, base `BattleCatsDB`, con 15 versiones de esquema acumuladas spec sobre spec. Tablas actuales: `playerProfile`, `ownedCats`, `levelProgress`, `settings`, `teamFormation`, `missionEnergy`, `evolutionItems`, `treasures`, `arcProgress`, `treasureSetBonuses`, `battleItems`, `encounteredEnemies`, `userRank`, `gachaStorage`, `newsRead`, `baseUpgrades` (`specs/031`), `missions` (`specs/033`), `gamatoto` (`specs/034`), `ototoCorps` (`specs/035`) — 19 en total; Talentos (`specs/036`) y Tienda (`specs/037`) reutilizan tablas existentes sin añadir una propia. `ensureDefaultProfile()` es idempotente y siembra el perfil por defecto y el primer gato garantizado en la primera sesión.

### Testing

Vitest + Testing Library + `fake-indexeddb` (jsdom). La suite cubre `src/engine/` (colisión, combate, simulación, tipos de ataque, clasificación/habilidades, efectos, multi-golpe/crítico), `src/data/*` (niveles, eventos, datos semilla), los stores (`useGameStore`, `useMetaStore`, incluyendo Dexie con `fake-indexeddb`), `src/game/*` (animación, sprites, encuentros de enemigos, fábrica de unidades) y todas las pantallas/paneles, incluido un test de flujo end-to-end (`AppFlow.test.tsx`) y uno del contenedor de overlay compartido (`PanelOverlay.test.tsx`, focus trap incluido). El motor de combate se testea sin canvas ni árbol de componentes, por diseño (Constitución § VI).

---

## Documentación adicional

- [`.specify/memory/constitution.md`](.specify/memory/constitution.md) — principios de diseño no negociables del proyecto.
- [`specs/`](specs/) — spec/plan/tasks de cada una de las 40 features, en orden cronológico.
- [`docs/`](docs/) — material de diseño y rediseño visual adicional (guías de estilo, roadmap de fases, referencia de manual técnico).
