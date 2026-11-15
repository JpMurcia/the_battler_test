# Investigación detallada: diseño y animación de personajes con IA (pipeline automatizable) + rediseño UI/UX

> **Fecha:** 2026-11-11 · **Proyecto:** Battle Cats Web (React 19 + PixiJS 8 + Zustand + Dexie) · **Estado:** investigación, sin cambios de código
> **Documentos hermanos:** `docs/art/art-bible.md` (identidad visual), `docs/art/entity-inventory.md` (65 unidades), `docs/art/asset-manifest.md`, `docs/art/asset-specs/basic-cat-assets.md`, `specs/042-unidades-mundo-cartoon/spec.md`.
>
> **Cómo leer la fiabilidad.** Lo marcado **[REPO]** está verificado leyendo el código de este repositorio. Lo marcado **[WEB]** viene de búsquedas web, en su mayoría blogs y páginas de proveedores: son pistas, no hechos. Lo marcado **[ESTIMACIÓN]** es un cálculo mío a partir de datos del repo. Lo marcado **⚠** debe comprobarse antes de comprometer dinero o tiempo (precios, límites, licencias).

---

## 0. Resumen ejecutivo

1. **Cuántas animaciones automatizar: 6 por unidad** (Marcha, Ataque, Golpeado, Muerte, Aparición, Retroceso). De ellas **solo 2 necesitan movimiento diseñado** (Marcha y Ataque, el mínimo que exige la Constitución § III); las otras 4 son transformaciones procedurales del contenedor, sin arte nuevo.
2. **Con un sistema de esqueletos por plantilla, esas 6 animaciones × 65 unidades = 390 instancias salen de solo ~20 definiciones de movimiento** (6 esqueletos × 2 clips + 4 modificadores de ataque + 4 clips genéricos). La alternativa "fotograma a fotograma" costaría **1.820 fotogramas** solo para reposo+ataque (65 × 28), y **3.640** con el set completo.
3. **Ruta recomendada: "recortes + rig por transformaciones"** (R3): una ilustración cartoon por unidad → despiece en ~8 piezas → animación por plantilla en Pixi. Conserva la identidad exacta del personaje (es siempre la misma imagen) y reutiliza lo que `animation.ts` ya hace (transformaciones, no redibujado).
4. **Modelos:** Fable/Claude **no genera imágenes**; es el director de arte, el control de calidad (visión) y quien escribe scripts y specs. Para imagen: **Nano Banana Pro** para la hoja de referencia de cada personaje y **Nano Banana 2** para volumen. Ambos están ya en tu Comfy Cloud.
5. **Comfy: sí. n8n: opcional.** Comfy (conectado a esta sesión) da acceso a todos los modelos. n8n solo orquesta llamadas; un script versionado en el repo hace lo mismo con menos piezas. Úsalo cuando quieras panel de aprobación o lotes nocturnos.
6. **Tamaño real manda:** las unidades se ven a **14–44 px de alto**. Detalle que no sobrevive a esa reducción no existe. Esto simplifica el trabajo de la IA (siluetas grandes, 2–3 tonos) y hace innecesarios 28 fotogramas por unidad.
7. **Siguiente paso:** piloto con el Gato Básico (hoja de referencia → despiece → rig → verlo a 16 px en el juego real). Decide si el enfoque escala antes de gastar en las otras 64 unidades.

---

## 1. Estado actual verificado

### 1.1 Unidades y niveles de arte **[REPO]**

| Nivel | Qué es | Cantidad | Situación |
|---|---|---|---|
| A | Sprite de fotogramas (`public/sprites/hero_1..12`, 16 reposo + 12 ataque, 300×300) | 12 | Son "guerreros humanos"; la biblia pide reemplazarlos por gatos (336 fotogramas) |
| B | Diseño procedural (Pixi `Graphics`) | 37 | Con borde neón/visor hoy; la spec 042 los pasa a cartoon plano |
| C | Cuerpo "cyber" genérico | 16 | Sin diseño propio; la spec 042 les da diseño |
| **Total** | | **65** | 47 gatos + 18 enemigos |

Distribución de los 30 diseños del Capítulo 1 (`imperioCap1Design.ts`): masa base **círculo 10 · rectángulo 11 · triángulo 9**; rasgos: cuernos 6, colmillos 4, escudo 4, púas 4, alas 4, cresta 3, cola 2, aleta 1, ninguno 2.

Tipos de ataque declarados en `cats.ts`: **Single 42 · LongRange 7 · Area 4 · Critical 1 · MultiHit 1**.

### 1.2 Cómo se anima hoy **[REPO]**

- Estado del motor: `Moving | Engaged | Dead`. Estado de animación: **solo `Idle | Attacking`** (`animation.ts`). `Moving` se mapea a `Idle`: **la unidad camina con la animación de "reposo"**. No existe un reposo estático ni una marcha distinta.
- Nivel A: `AnimatedSprite` con 16/12 fotogramas fijos para todas las unidades (`spriteAssets.ts`, `animationSpeed = 0,3` ≈ 18 fps con ticker a 60).
- Nivel B/C: solo transformaciones del contenedor: rebote en reposo (≤ 2 px), aplastamiento 12 % y giro ≤ 0,15 rad al atacar, sincronizados con `attackCooldownRemaining`.
- Muerte: eco de 0,35 s que encoge y desvanece (`DeathEchoSprite.tsx`), reutilizando el primer fotograma de reposo.
- Efectos de impacto/daño flotante: `ImpactEffect.tsx` y `cyberEffects.ts` (información, no mundo).
- Restricción de la Constitución § III: **cada unidad necesita como mínimo animación de movimiento/idle y de ataque**.
- § VI: nada se re-renderiza por el tick de combate → toda animación debe ir por transformaciones dentro de `useTick`.

### 1.3 Arte y documentación **[REPO]**

- Biblia de arte: secciones 1–6 completas. **§7 UI/HUD, §8 estándares de assets y §9 referencias: "Por diseñar"** (la §8 es imprescindible antes de producir en serie).
- Manifiesto: 4 assets (todos del Gato Básico), 0 aprobados.
- `assets-source/`: packs de terceros de Unity (humanos, monstruos, fondos). **El pack de fondos no trae licencia.**
- Dependencias: `pixi.js` 8.19, `@pixi/react` 8. **No hay runtime esquelético** (ni Spine ni DragonBones).
- Skills ya instaladas útiles aquí: `art-bible`, `asset-spec`, `estimate`, `scope-check`, `balance-check`, familia `pixijs-*` y `speckit-*`.

### 1.4 Conflictos de código ya detectados (de `basic-cat-assets.md`) **[REPO]**

1. Conteo de fotogramas fijo 16/12 para todas las claves → falta un conteo por unidad.
2. `tests/unit/data/imperioCap1Design.test.ts:44` exige exactamente 30 diseños → el registro procedural de las demás unidades necesita un sitio nuevo.
3. Al pasar de reposo a ataque la animación reinicia en el fotograma 1 → ambas empiezan en la misma pose neutra.
4. Los enemigos se espejan → todo sprite mira a la **derecha**.

---

## 2. Modelos: qué hace cada uno y para qué usarlo

### 2.1 Fable / familia Claude **[REPO + conocimiento del modelo]**

Entrada: texto e imágenes. Salida: **texto y código, no imágenes raster**. Sirve para:
- **Dirección de arte:** convertir los datos de cada unidad (`cats.ts`: forma, rasgo, rareza, tipo de ataque) en briefs y prompts coherentes con la biblia.
- **Control de calidad por visión:** revisar cada imagen generada contra reglas medibles (ver § 7.5) y rechazar o aprobar.
- **SVG y código:** iconos de UI, marcadores procedurales Pixi, definiciones de rig, scripts del pipeline.
- **Specs y pruebas** (speckit) y mantenimiento del manifiesto.

No sirve para pintar el personaje. Para eso necesitas un generador de imagen.

### 2.2 Generadores de imagen disponibles en tu Comfy Cloud **[REPO: catálogo `search_models` del MCP conectado]**

| Familia | IDs en Comfy | Nota |
|---|---|---|
| Google Nano Banana | `vertexai/nano-banana-pro`, `nano-banana-2`, `nano-banana-2-lite` | Texto→imagen **y edición** con imágenes de referencia |
| Black Forest Labs | `bfl/flux-2-pro`, `flux-2-max`, `flux-kontext-pro/max`, `flux-pro-fill`, `flux-pro-expand` | Kontext = edición; Fill = relleno/inpaint |
| OpenAI | `openai/images-generations` | gpt-image |
| ByteDance | `byteplus/images-generations` (Seedream) + plantilla *layer separation* | Separación en capas transparentes |
| Otros | `ideogram/*`, `qwen/qwen-image-3`, `xai/grok-image-*` | Texto en imagen, alternativas |
| Vídeo | `kling-v3`, `kling-3.0-turbo`, `seedance-2.0/2.5`, `veo-3.1`, `ltx-2.5`, `hailuo-03` | Para animar a partir de imagen |

### 2.3 Versiones de Nano Banana **[WEB, con ⚠]**

Según la explicación de Google recogida por [The Decoder](https://the-decoder.com/google-explains-the-differences-between-its-three-nano-banana-image-generation-models/) y comparativas de terceros:

| Modelo | ID de API (según docs de Google) | Cuándo usarlo en este proyecto |
|---|---|---|
| Nano Banana original (Gemini 2.5 Flash Image) | — | Borradores baratos; consistencia floja |
| **Nano Banana Pro** | `gemini-3-pro-image-preview` | **Hoja de referencia ("ADN") de cada personaje**; ediciones críticas; mejor razonamiento y fidelidad |
| **Nano Banana 2** | `gemini-3.1-flash-image-preview` | **Volumen:** variantes, poses, piezas. Según Google, ~95 % de las capacidades de Pro a un precio notablemente menor |
| Nano Banana 2 Lite | (Comfy) | Pruebas rápidas de prompt |

⚠ Sin confirmar: límite de imágenes de referencia (terceros dicen 14), tamaños admitidos (512 px a 4K según terceros) y precios exactos. **Ninguna fuente confirma transparencia nativa:** pide fondo plano (blanco o verde croma) y recorta con script. Verifica en la [guía oficial](https://ai.google.dev/gemini-api/docs/image-generation).

**Regla práctica:** Pro para fijar el diseño, 2 para repetirlo, Claude para juzgarlo.

---

## 3. Herramientas: qué usar y qué no

| Herramienta | Veredicto | Motivo |
|---|---|---|
| **Comfy Cloud (MCP ya conectado)** | **Sí** | Un único acceso a Nano Banana, Flux, Seedream, Kling…; workflows guardables; LoRA/ControlNet por si luego quieres entrenar el estilo de la casa |
| **Scripts en `scripts/art/`** | **Sí (núcleo)** | Versionados con el repo, reproducibles, sin servidor |
| **n8n** | **Opcional, fase tardía** | Orquesta (loop de 65 unidades → Comfy → QA → aprobación → mover archivos) pero **no diseña** estructura ni animaciones. Patrón [WEB]: webhook → API de ComfyUI → polling → guardar; existe el nodo comunitario `n8n-nodes-comfyui` ⚠ (comprobar estado). Úsalo solo si necesitas panel de aprobación o lotes nocturnos |
| **PixiJS (ya instalado)** | **Sí** | Ejecuta los rigs por transformaciones |
| **Spine** (`spine-pixi-v8`) | **Solo si escala mucho** | Estándar de industria con runtime oficial para Pixi 8 ([anuncio](https://esotericsoftware.com/blog/spine-pixi-v8-runtime-released)); licencia de pago ⚠ y editor externo |
| **DragonBones** | No | [WEB] editor poco mantenido (afirmación de una sola fuente ⚠) |
| **PixelLab / Retro Diffusion / Scenario** | No (por ahora) | Optimizados para **pixel art** ([comparativa](https://app.cinevva.com/guides/ai-pixel-art-generators)); tu biblia exige cartoon de contorno grueso |
| **Figma** | Pendiente | Conectado pero sin autorizar (`/mcp`); no imprescindible |
| **Playwright** | Sí | Ya es dependencia: capturas para la prueba "gris al 50 %" |

---

## 4. Rutas de animación comparadas

| Ruta | Descripción | Fotogramas/piezas por unidad | Consistencia | Esfuerzo humano | Encaje |
|---|---|---|---|---|---|
| **R1. Fotogramas por edición** | Hoja de referencia → editar pose a pose con Nano Banana → interpolar | 4+3 poses clave → 16+12 | Media (deriva entre poses) | Alto: revisar cada pose | Héroes y jefes |
| **R2. Imagen→vídeo→fotogramas** | Sprite sobre fondo croma → Kling/Seedance/Veo 4–6 s → `ffmpeg fps=12` → quitar fondo ([guía](https://sorceress.games/blog/ai-animation-generator-from-image-game-ready-in-minutes)) | 8–24 extraídos | Media-alta | Medio; halos de croma, bucle sin cerrar, el ataque no vuelve a la pose inicial | Solo gacha/promo |
| **R3. Recortes + rig por transformaciones** ⭐ | Una ilustración → ~8 piezas → animación por plantilla en Pixi | ~8 piezas, 0 fotogramas | **Perfecta** (es la misma imagen) | Bajo tras montar plantillas | **Los 65 personajes** |
| **R4. Esqueletal con Spine** | Spine + runtime Pixi | Piezas + malla | Perfecta | Medio-alto; licencia | Si el proyecto crece mucho |

**Decisión recomendada: R3 como base, R1 para héroes/jefes de rareza alta, R2 solo para marketing.**

Por qué R3 gana aquí:
- El motor **ya anima por transformaciones**; R3 es una extensión natural (de "un cuerpo rebota" a "ocho piezas se mueven").
- A 14–44 px el espectador no distingue 28 fotogramas dibujados de un balanceo de piezas bien sincronizado.
- Cambiar el diseño de una unidad = regenerar 1 imagen, no 28.
- Las animaciones nuevas (Golpeado, Muerte…) son gratis: no requieren arte.

Riesgo honesto de R3: depende de que el generador produzca el personaje con **extremidades separables** (brazos lejos del torso, piernas abiertas, cola libre). Es una hipótesis **sin probar**; por eso existe el piloto (§ 10).

---

## 5. Catálogo de animaciones y cuántas automatizar

### 5.1 Qué eventos distingue ya el juego **[REPO]**

Estados del motor: `Moving`, `Engaged`, `Dead`. Habilidades con efecto visible potencial: Knockback, Shield, SummonOnDeath, Dodge, Survive, Strengthen, ExtraMoney; efectos de estado: Weaken, Freeze, Slow, Curse. Tipos de ataque: Single, Area, LongRange, MultiHit, Critical.

### 5.2 Catálogo propuesto

| # | Animación | Tipo | ¿Arte nuevo? | Duración | Prioridad | Dispara |
|---|---|---|---|---|---|---|
| 1 | **Marcha** (reemplaza al "Idle" actual) | Bucle, por esqueleto | Movimiento de piezas | ~0,8 s | **P0 (Constitución § III)** | `state = Moving` |
| 2 | **Ataque** | Una vez, sincronizado con el cooldown, por esqueleto + modificador por tipo de ataque | Movimiento de piezas | = `attackIntervalSeconds` | **P0 (Constitución § III)** | `state = Engaged` |
| 3 | **Golpeado** | Procedural: destello blanco + sacudida | No | 0,15 s | P1 | Evento de daño (ya existe `ImpactEffect`; **verificar** de dónde sale el evento) |
| 4 | **Muerte** | Procedural: salto + giro + desvanecer (reemplaza el encogimiento) | No | 0,35–0,5 s | P1 | `state → Dead` (hoy `DeathEchoSprite`) |
| 5 | **Aparición** | Procedural: salto desde la base con aplastamiento | No | 0,3 s | P1 | Despliegue |
| 6 | **Retroceso** (knockback) | Procedural: deslizamiento hacia atrás + inclinación | No | 0,25 s | P1 | Habilidad Knockback / cañón de Ototo |
| 7 | Estados alterados (Congelado, Lento, Debilitado, Maldito) | **Capa de información** (tinte/icono neón sobre la unidad) | No | mientras dure | P2 | `AppliesEffect` |
| 8 | Efectos de habilidad (rotura de escudo, invocación, esquiva) | Efecto aparte | Mínimo | 0,3–0,6 s | P2 | Habilidad correspondiente |
| 9 | Victoria / celebración | Para pantalla de resultado, gacha, ficha | Movimiento de piezas | 1–2 s | P3 | UI |

> **Estado (2026-11-15):** las filas 3–6 (Golpeado, Muerte, Aparición, Retroceso) están implementadas en `specs/044-animaciones-de-evento`, sin depender del rig de la spec 043.

> La biblia (§1, §5) exige que **estados de unidad no se muestren oscureciendo o desaturando al personaje**; las animaciones 3–8 respetan esa regla (el estado va en la capa neón).

### 5.3 Recomendación: cuántas automatizar

| Alcance | Animaciones por unidad | Instancias totales (×65) | Movimiento diseñado |
|---|---|---|---|
| **Mínimo legal** | 2 (Marcha, Ataque) | 130 | 12 clips (6 esqueletos × 2) + 4 modificadores = 16 |
| **Recomendado** ⭐ | **6** (+ Golpeado, Muerte, Aparición, Retroceso) | **390** | **~20 definiciones** (los 4 extra son genéricos) |
| Completo | 9 (+ estados, efectos, victoria) | 585 | ~26 |

**Por qué 6 y no más:** las cuatro añadidas cuestan casi cero (código + parámetros), mejoran mucho la sensación de combate, y no multiplican arte. Estados alterados (7) y efectos (8) son capa de información; van en una spec de UI, no de personajes. Victoria (9) solo si decides usar los personajes en pantallas de menú.

### 5.4 Cómo se descompone el trabajo (recomendado)

- **6 esqueletos** (ver § 6) × **2 clips** (Marcha, Ataque-Single) = **12 clips**.
- **4 modificadores de ataque** sobre el clip base, parametrizados por anticipación/impacto/recuperación: LongRange (proyectil/lanzamiento), Area (golpe giratorio), MultiHit (3 golpes rápidos), Critical (anticipación larga + impacto fuerte) = **4**.
- **4 clips genéricos de cuerpo completo** (Golpeado, Muerte, Aparición, Retroceso), independientes del esqueleto = **4**.
- **Total: 20 definiciones** **[ESTIMACIÓN]**.

### 5.5 Cuánto ahorra frente a fotogramas **[ESTIMACIÓN]**

| Enfoque | Cálculo | Total |
|---|---|---|
| Fotogramas, solo reposo+ataque (estándar actual) | 65 × (16+12) | **1.820** |
| Fotogramas, 6 animaciones (16+12+6+8+6+6) | 65 × 54 | **3.510** |
| Fotogramas reducidos (8+6) | 65 × 14 | 910 |
| **R3 recomendado** | ~8 piezas × 65 unidades | **~520 piezas + 20 definiciones** |

### 5.6 Reglas de diseño del movimiento (desde `animation.ts`)

- **Definir los clips por fase (0–1), no por tiempo**: así el ataque se sincroniza con `attackCooldownRemaining` como hoy (`cycleProgress`).
- Inclinación total ≤ ~10° (el contenedor ya añade giro de hasta ~8,6° y aplastamiento del 12 %): **no duplicar** esos efectos; el rig aporta el movimiento interno de las piezas, el contenedor sigue aportando el cuerpo completo.
- Desfase de reloj por instancia para que un ejército no marche sincronizado (ya existe).
- Respetar `prefers-reduced-motion`.
- Mirar siempre a la derecha en la fuente; el enemigo se espeja.

---

## 6. Esqueletos (plantillas de rig)

| ID | Esqueleto | Cubre | Piezas típicas |
|---|---|---|---|
| T1 | Bípedo redondo | Círculo: Recluta, Veterano, Verdoso, Merodeador, gatos ligeros | cabeza+orejas, torso, brazo delantero (arma), brazo trasero, pierna ×2, cola |
| T2 | Bípedo pesado | Rectángulo: Yunque, Forzudo, Centinela, Boxeador, Behemot | igual que T1 con torso ancho y pivotes más bajos |
| T3 | Bípedo afilado | Triángulo: Sigiloso, Cuchilla, Cornamenta, Triturador, Embestida | inclinación hacia delante, zancada larga |
| T4 | Volador | Alas (4 en Cap. 1): Migratorio, Planeador, Saltarín Alado, Emperador Volador | cabeza, torso, ala ×2, cola; **sin piernas, flotación en vez de marcha** |
| T5 | Cuadrúpedo | Perro, Hipopótamo, Unicornio, Foca | cabeza, torso, pata ×4 (2 pares), cola |
| T6 | Sin extremidades | Serpientes, aleta (Anfibio), La Máscara | segmentos/ondulación o flotación |

**Necesidad de piezas:** 6–9 por unidad (media ~8) **[ESTIMACIÓN]**. Si el rasgo distintivo (cuernos, escudo, púas, cresta) es una pieza propia, se mueve con inercia (segunda ley de Disney, barata y muy legible).

**Asignación:** cada unidad lleva `skeleton: 'T1'…'T6'` en datos. Un enemigo que cambia de forma o una evolución que añade pieza solo cambia el atlas, no el rig.

---

## 7. Pipeline automatizado (paso a paso)

### 7.1 Visión general

```
cats.ts / seedData.ts / imperioCap1Design.ts
        │ (S1 brief automático)
        ▼
 prompts/<id>.md ──(S2)──▶ ref_neutral.png  ──(S3 despiece)──▶ parts/*.png
                                                  │
              (S5 QA: reglas + visión de Claude) ◀┘
                                                  ▼
                       (S6 atlas)  public/units/<id>/atlas.png+json
                                                  ▼
                       (S7 rig: plantilla Tn + pivotes)  →  registro en el juego
                                                  ▼
                       (S8 manifiesto + miniaturas a 24 px + captura Playwright)
```

### 7.2 Etapas

| Etapa | Qué hace | Herramienta | ¿Automatizable? | Salida |
|---|---|---|---|---|
| S1 Brief | Convierte datos de la unidad en ficha (forma, rasgo, color único, rareza, esqueleto, tipo de ataque) | Script + Claude | **Sí** | `prompts/<id>.md` |
| S2 Referencia | Genera la ilustración canónica, pose neutra de frente-derecha, extremidades separadas, fondo plano | Nano Banana **Pro** (1–3 llamadas) | **Sí** | `ref_neutral.png` |
| S3 Despiece | Obtiene piezas: (a) pedir al modelo la misma imagen con "piezas desplegadas" o (b) Seedream *layer separation* o (c) recortes por cajas definidas por plantilla | Nano Banana 2 / Seedream / script | **Parcial** (sin probar; la parte de piezas mal cortadas se revisa) | `parts/*.png` |
| S4 Fondo→alfa | Quitar fondo por pieza (no sobre la hoja completa: las herramientas tipo remove.bg recortan al conjunto y destruyen la geometría [WEB]); croma si el fondo es verde plano | Script | **Sí** | PNG RGBA |
| S5 QA | Reglas medibles + revisión por visión de Claude (ver § 7.5) | Script + Claude | **Sí** con aprobación humana final | informe JSON |
| S6 Atlas | Empaquetar piezas en un atlas y JSON compatible con `Assets` de Pixi | Script (empaquetador a elegir) | **Sí** | `atlas.png/json` |
| S7 Rig | Asignar plantilla, calcular pivotes a partir de las cajas de las piezas, previsualizar | Script + ajuste manual por plantilla (una vez) | **Parcial** | `rig.json` |
| S8 Registro | Actualizar manifiesto, miniaturas 24 px, captura en el juego a escala real | Script + Playwright | **Sí** | `asset-manifest.md` |

**Qué NO se automatiza (conviene que lo haga una persona):** aprobar el diseño final (gusto), afinar una vez los 6 esqueletos, decidir qué unidades suben de nivel, validar licencias.

### 7.3 Consistencia de estilo entre 65 personajes

- **Bloque "ADN felino" compartido** (ya definido en `ASSET-001` del Gato Básico): se reutiliza como prefijo del prompt de los 47 gatos. Enemigos llevan un bloque análogo ("criatura de caricatura, nunca gato").
- **3–5 imágenes ancla** de estilo, aprobadas una vez, enviadas como referencia en toda llamada (⚠ comprobar el máximo de referencias que admite el modelo).
- **Un solo modelo por tipo de asset**, con modelo + versión + semilla registrados en `prompts/<id>.md` para poder reproducir.
- **Color único por unidad** (regla de la biblia): el script comprueba que el relleno principal no coincide con ningún otro ni con un color `--bc-*`.

### 7.4 Presupuesto de llamadas **[ESTIMACIÓN]**

Por unidad: ~1–3 referencias (Pro) + ~2–4 despiece/variantes + ~1–2 reintentos = **6–10 llamadas**. Para 65 unidades: **~400–650 llamadas** a modelos de imagen, más la visión de Claude para QA. El coste monetario **no está medido**: mídelo en el piloto con `/estimate` antes de aprobar el lote.

### 7.5 Reglas de QA (automatizables)

1. Contorno ≥ 8 px a 300 px y color `#0a0c14` (biblia §3/§4).
2. Sin degradados, sin brillo, sin borde neón (detectable: número de colores únicos por región, ausencia de píxeles con saturación y luminosidad máximas fuera del `primaryColor`).
3. Silueta legible reducida a **24 px de alto** (prueba de la biblia §1): Claude identifica el arquetipo en la miniatura.
4. Aliados: orejas visibles en la silueta; enemigos: no son gatos.
5. Mira a la derecha; pies en la línea del suelo.
6. Piezas con transparencia correcta, sin halos (borde de 1 px sin croma residual).
7. Ocupa ≥ 85 % del lienzo (los márgenes vacíos se pagan en resolución).
8. Relleno principal único y fuera de los tokens de información.

---

## 8. Estructura de carpetas y datos

### 8.1 Carpetas

```
assets-source/art/
  anchors/                     # 3–5 imágenes ancla de estilo (aprobadas)
  units/<id>/
    ref_neutral.png            # S2
    parts/                     # S3–S4
    qa.json                    # S5
  prompts/<id>.md              # prompt, modelo, versión, semilla
scripts/art/
  brief.mjs  generate.mjs  cutout.mjs  qa.mjs  pack.mjs  register.mjs
public/units/<id>/
  atlas.png  atlas.json        # lo que carga el juego
src/data/
  unitArt.ts                   # registro por unidad (ver 8.2)
  rigTemplates.ts              # T1…T6 y clips
docs/art/asset-manifest.md     # estado (ya existe)
```

### 8.2 Esquema de datos propuesto (boceto, no implementado)

```ts
// src/data/unitArt.ts
type Skeleton = 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6'

interface UnitArt {
  catId: string
  skeleton: Skeleton
  atlas: string                     // /units/<id>/atlas.json
  parts: Record<PartName, { frame: string; pivot: [number, number] }>
  attackKind?: 'Single' | 'LongRange' | 'Area' | 'MultiHit' | 'Critical'
  fallback: 'procedural' | 'sprite'  // respaldo si falla la carga
}

// src/game/animation.ts (extensión)
type AnimationState = 'Moving' | 'Attacking' | 'Hit' | 'Dying' | 'Spawning' | 'Knockback'
```

La lógica de `getAnimationState` sigue leyendo `BattleUnit.state`; `Hit`, `Spawning` y `Knockback` son efímeras (como el `DeathEcho`) y viven fuera de `SimState`, tal como exige la § VI.

---

## 9. Cambios de código y specs sugeridas

| Spec propuesta | Contenido | Depende de |
|---|---|---|
| **042** (en curso, Draft) | Reskin cartoon de B y C, anillo de equipo, orejas, 4 colores | — |
| **043 Sistema de rig por plantillas** | `UnitArt`, `rigTemplates`, carga de atlas, respaldo procedural, extensión de `AnimationState`, desfase de reloj, reducido movimiento | 042 |
| **044 Animaciones de evento** | Golpeado, Muerte nueva, Aparición, Retroceso (procedurales) | 043 |
| **045 Pipeline de arte** (scripts, no juego) | S1–S8, QA, manifiesto | Biblia §8 |
| **046 Reemplazo de héroes A** | Sustituir `hero_1..12` por gatos (R1 o R3) y conteo por unidad si se mantiene fotogramas | 043, 045 |
| **047 UI/UX** | Biblia §7, fondos, iconos, retratos | 045 |

Dos tareas previas que **no** son specs de juego: completar la **biblia §8 (estándares de assets)** y resolver la **licencia del pack de fondos**.

---

## 10. Plan por fases

| Fase | Entregable | Criterio de aceptación |
|---|---|---|
| **0. Decidir** | R3 + R1 confirmado; 3–5 anclas de estilo; biblia §8 escrita | Anclas aprobadas por ti |
| **1. Piloto Gato Básico** | `ref_neutral.png`, 8 piezas, rig T1, Marcha y Ataque | Se ve bien **a 16×18 px en el juego real**; Claude identifica "gato" en la miniatura de 24 px; coste real medido |
| **2. Plantillas** | T1–T6 con Marcha y Ataque, modificadores de ataque, 4 clips genéricos | Una unidad de cada esqueleto aprobada en pantalla |
| **3. Spec 043/044** | Código del rig y animaciones de evento | Tests; sin re-render por tick; respaldo procedural verificado |
| **4. Lote** | 65 unidades por el pipeline (script; n8n solo si lo pides) | ≥ 95 % pasan QA automático; revisión humana del resto |
| **5. Promoción** | Héroes/jefes a R1 según rareza (biblia §5) | Prioridad: jefes y Cap. 1 |

**Decisión de parada:** si el piloto falla (las extremidades no se separan bien o el rig se ve rígido a escala), pasar a R1 solo para héroes y mantener el procedural pulido (spec 042) para el resto.

---

## 11. UI/UX: rediseño de menús y pantallas

### 11.1 Situación **[REPO]**
- Tokens `--bc-*` (~80) con test de contraste (4,5:1). Pantallas: Título, Hub, Mapa de etapas, Equipo, Gacha, Tienda, Misiones, Noticias, Ajustes, Resultado, Guías de gatos y enemigos, Perfil, Gamatoto, Ototo, Mejoras, Biblioteca, Tesoros, detalle de unidad.
- Iconos: `lucide-react` genérico. No hay ilustración de menús ni retratos de personaje.
- Biblia: §2 (atmósfera por pantalla) y §4 (daltonismo, iconos por estado) ya dan dirección; **falta §7**.

### 11.2 Propuesta

1. **Escribir biblia §7:** jerarquía de menús, componentes, estados (normal/hover/foco/desactivado), densidad, patrones de tarjeta de unidad.
2. **Retratos gratis:** `ref_neutral.png` de cada unidad sirve de retrato en tarjetas, guías, gacha y ficha → 65 retratos sin trabajo extra. Se recortan con el mismo script.
3. **Fondos ilustrados** (soporte, desaturados para que el neón destaque): Título/Hub atardecer, Mapa (4 biomas), Gacha oscuro, Tienda, Resultado victoria/derrota ≈ **9–10 ilustraciones** **[ESTIMACIÓN]**, generadas con Nano Banana 2 sobre las anclas.
4. **Set de iconos propio en SVG** (Claude puede escribirlo, coste de créditos cero): estados de nodo (candado, ✓, ✦), rareza con estrellas, recursos, pestañas ≈ **30 iconos** **[ESTIMACIÓN]**.
5. **Corregir deuda de accesibilidad de la biblia §4:** nodos distinguibles por forma/icono además de color; rótulo o estrellas bajo cada orbe del gacha (dorado vs naranja).
6. **Verificación:** capturas Playwright por pantalla; prueba "gris al 50 %"; contraste con el test de tokens existente.
7. **Prototipado:** HTML/artifacts o el navegador del app; Figma solo si lo autorizas.

---

## 12. Riesgos y decisiones abiertas

**Riesgos**
- **Licencias:** pack de fondos sin licencia; términos comerciales de cada generador (Google, BFL, ByteDance, etc.) ⚠ por revisar antes de publicar.
- **Despiece con IA sin validar:** puede requerir más trabajo manual del estimado; el piloto lo mide.
- **Coste no medido:** 400–650 llamadas es un orden de magnitud, no un presupuesto.
- **Deriva de estilo** entre modelos o versiones: fijar modelo por tipo y registrar semilla.
- **Preview/deprecación de modelos:** varios IDs de Gemini aparecen como `-preview` ⚠; aislar el modelo detrás del script para poder cambiarlo.
- **Rendimiento:** más `Sprite` por unidad en pantalla; medir con muchas unidades (usar atlas único, `cacheAsTexture` si hace falta; ver skill `pixijs-performance`).

**Decisiones que necesito de ti**
1. ¿Confirmas R3 + R1 (rig por piezas para todos, fotogramas solo para héroes/jefes)?
2. ¿Los 12 héroes actuales se reemplazan por gatos (336 fotogramas / ~96 piezas) o se conservan como están?
3. ¿Alcance de animaciones: mínimo (2), recomendado (6) o completo (9)?
4. ¿Presupuesto máximo para generación en el piloto?
5. ¿Quieres n8n desde el principio o scripts primero?

---

## 13. Fuentes

- [Google explica las diferencias entre sus tres modelos Nano Banana (The Decoder)](https://the-decoder.com/google-explains-the-differences-between-its-three-nano-banana-image-generation-models/)
- [Gemini 3 Pro Image Preview (Google AI)](https://ai.google.dev/gemini-api/docs/models/gemini-3-pro-image-preview)
- [Guía de generación de imágenes con Gemini (Google AI)](https://ai.google.dev/gemini-api/docs/image-generation)
- [Consistencia de personajes en ComfyUI](https://aigaming.nuilab.org/workflows/character-consistency/)
- [Automatizar generación de imágenes con n8n y ComfyUI (DEV)](https://dev.to/worldlinetech/automating-image-generation-with-n8n-and-comfyui-521p)
- [Imagen→vídeo→sprites (Sorceress)](https://sorceress.games/blog/ai-animation-generator-from-image-game-ready-in-minutes)
- [Generadores de pixel art y sprites 2026 (Cinevva)](https://app.cinevva.com/guides/ai-pixel-art-generators)
- [Runtime spine-pixi-v8 (Esoteric Software)](https://esotericsoftware.com/blog/spine-pixi-v8-runtime-released)

> Los datos de [REPO] provienen de: `src/game/animation.ts`, `src/game/spriteAssets.ts`, `src/game/UnitSprite.tsx`, `src/game/DeathEchoSprite.tsx`, `src/engine/types.ts`, `src/data/imperioCap1Design.ts`, `src/data/cats.ts`, `.specify/memory/constitution.md` (§ III), `docs/art/*` y el catálogo de modelos del MCP de Comfy Cloud conectado.
