# Biblia de Arte — Battle Cats Web

> **Estado**: 6/9 secciones completas
> **Revisión de dirección de arte**: ninguna — redactada por la sesión principal, sin revisión de un especialista
> **Última actualización**: 2026-10-10

## 1. Declaración de identidad visual

**Regla en una línea:** *El mundo se dibuja; la información brilla.*

Todo lo que existe en el mundo del juego (unidades, enemigos, bases, terreno, atrezo) es de dibujos animados: contorno oscuro grueso y color plano. Todo lo que el jugador debe leer o decidir (equipo, vida, daño, rareza, estado de un nodo, botones) es neón: un color de la paleta `--bc-*` y, si necesita énfasis, un resplandor `--bc-glow-*`.

**Decisión de estilo (2026-10-10).** Se eligió «mundo cartoon con UI neón» entre tres vías: mundo neón geométrico, mundo cartoon con UI neón e híbrido acotado. Lo decidió el responsable del proyecto; el motivo no se registró.

**Consecuencias asumidas.** Son deuda visual: esta sección las fija, pero no las resuelve.
- Los 12 sprites actuales (`hero_1`…`hero_12`) ya hablan el idioma del mundo y son el patrón de referencia.
- 53 de 65 unidades (37 diseños procedurales y 16 cuerpos «cyber») se dibujan hoy con borde neón, visor y resplandor. Pasan a ser marcadores provisionales y deben adoptar contorno grueso y color plano. Eso exige cambiar código, así que irá en una spec.
- La rejilla de suelo y el horizonte cian de `LaneBackground`, y la nebulosa de `.battle-stage`, dejan de ser el escenario de batalla (se define en la sección 6).
- Lo que ya brilla bien se queda: la barra de vida con color de equipo, los destellos y números de daño dorados, los nodos del mapa y toda la UI.

**Principios de apoyo**
1. **Lo que existe tiene contorno; lo que informa brilla.** *Prueba:* ante un elemento nuevo, pregunta si es parte del mundo o una lectura para el jugador. Mundo: contorno oscuro grueso, relleno plano de 2–3 tonos, sin resplandor ni degradado. Lectura: token `--bc-*` y, solo si hace falta, resplandor.
2. **Silueta antes que detalle.** Una unidad mide 14–44 px en pantalla. *Prueba:* reduce el dibujo a 24 px de alto; si no reconoces el arquetipo por la silueta, quita detalle.
3. **Un marcador provisional habla el mismo idioma que el arte final.** *Prueba:* pon un diseño procedural junto a un sprite real; si parecen de juegos distintos, el marcador incumple la regla.

**Queda prohibido:** borde, visor, propulsor o resplandor neón en objetos del mundo; degradados de color en unidades; luz neón como iluminación del escenario; texturas fotorrealistas.

## 2. Atmósfera y estados de ánimo

> Hoy ninguna pantalla muestra un escenario de mundo ilustrado; lo que sigue es el objetivo, no una descripción de lo que existe.

El ánimo de cada estado se fija con **dos palancas**: la temperatura y el valor del escenario (mundo) y la capa de información en neón. **Nunca** se cambia oscureciendo, desaturando ni tiñendo las unidades: su silueta debe leerse igual en todos los estados. Ningún estado parpadea a más de 3 destellos por segundo, y con `prefers-reduced-motion` los pulsos pasan a color fijo.

**Título / Hub.** *Acogida: «vuelvo a mi base».* Luz de atardecer cálido (naranja a morado) y contraste medio. Adjetivos: acogedor, cálido, juguetón, tranquilo. Energía contemplativa. Lo carga la ilustración cartoon de la base al atardecer, con la UI de vidrio oscuro flotando encima.

**Mapa de etapas.** *Curiosidad y progreso: «¿qué hay más allá?».* Día despejado, neutro-fresco según la región (sección 6), con valores medios y saturación baja para que los nodos neón destaquen. Adjetivos: abierto, exploratorio, claro, ordenado. Energía medida. Lo carga el paisaje ilustrado desaturado al fondo y la ruta punteada que se enciende al avanzar.

**Batalla, apertura.** *Calma tensa: «esto empieza».* Luz de día y fondo de contraste bajo para que se lean siluetas de 14 px. Adjetivos: despejado, expectante, nítido, ligero. Energía medida, que sube con la oleada. Lo carga el horizonte limpio con las dos bases enfrentadas. Lo más brillante de la pantalla es la energía y la fila de despliegue.

**Batalla, jefe o base bajo ataque.** *Urgencia: «se nos viene encima».* El cielo se enfría y se oscurece algo; aparece una viñeta roja en los bordes, que es información y por tanto neón, y la barra de vida de la base pulsa. Adjetivos: apremiante, pesado, amenazante, tenso. Energía frenética. Con «reducir movimiento», la viñeta queda fija.

**Victoria.** *Alivio y orgullo.* Hora dorada cálida sobre el mismo escenario, con contraste medio-alto. Adjetivos: radiante, generoso, festivo, limpio. Energía festiva y breve (menos de 2 s antes de dejar leer las recompensas). Lo cargan los destellos dorados `--bc-gold` (recompensa = información) y la base enemiga cayendo.

**Derrota.** *Pesar sin castigo: «casi; otra vez».* Azul-gris frío y apagado sobre el escenario, con contraste bajo. Adjetivos: sereno, apagado, silencioso, sin dramatismo. Energía contemplativa. Lo carga el escenario desaturado y un único botón de reintento en naranja de acción, que es lo más brillante.

**Gacha, revelado.** *Expectativa y sorpresa.* Casi negro, y el orbe es la única fuente de luz. Escala por rareza: Raro cian, Superraro púrpura, Megarraro dorado y Legendario naranja, con el resplandor mayor (`--bc-glow-size-xl`) y el revelado más largo. Adjetivos: expectante, brillante, ceremonial, eléctrico. Energía de contemplativa a pico. Lo carga el orbe y su resplandor; el gato cartoon aparece al abrirse. Normal, Especial y Colaboración no tienen revelado propio.

**Tienda.** *Comercio amable.* Neutro-cálido y contraste medio, sin escenario de mundo; el neón queda solo en precios y botón de compra. Adjetivos: ordenado, amable, limpio, tentador. Energía medida. Lo cargan las tarjetas de producto con ilustración cartoon.

**Qué se queda y qué cambia.** Los lavados de color de paleta (`--bc-wash-*`) se quedan en las pantallas de menú. La nebulosa y la rejilla neón de la batalla se retiran (sección 1).

## 3. Lenguaje de formas

**Silueta de unidad (se lee a 24 px de alto)**
- **Proporción chibi:** cabeza grande, aproximadamente la mitad de la altura, y extremidades cortas.
- **Una masa dominante y un único rasgo distintivo** que sobresale por arriba o por un lado. A 24 px solo se distinguen esas dos cosas; el resto es ruido.
- **El arquetipo se lee por la silueta; el equipo, no.** Aliado y enemigo pueden compartir masa y rasgo. Qué bando es lo dice la capa de información en neón (sección 5), no la forma.
- **Contorno oscuro grueso.** Propuesta, a validar con una prueba de reducción: al menos 8 px en el fotograma de 300 px, para que sobreviva al encogimiento de 7 a 21 veces que sufre en pantalla.
- **Sombra de contacto:** una elipse plana y oscura bajo cada unidad ancla el dibujo al suelo.

**Masa base (`baseShape`)**

| Forma | Significa | Ejemplos en los datos |
|---|---|---|
| Círculo | ligero, equilibrado, polivalente | Recluta, Veterano, Verdoso, Merodeador |
| Rectángulo | pesado, defensivo | Yunque, Forzudo, Centinela, Behemot Gris, Boxeador |
| Triángulo (`poly`) | punzante, veloz, agresivo | Sigiloso, Cuchilla, Cornamenta, Triturador, Embestida |

**Rasgo distintivo (`distinctiveFeature`), uno por unidad**
- Tanque: `horns`. Anti-aéreo o aéreo: `wings`. Defensivo: `shield`. Agresivo o de área: `spikes`. Rápido: `tail`.
- Fiereza enemiga: `fangs`. Anfibio: `fin`. Mando, jefe o divinidad: `crest`. Identidad de gato: `cat-ears`.
- El rasgo marca el **arquetipo, nunca el rango**; la rareza no cambia la silueta.
- Un rasgo nuevo exige una entrada nueva en esta lista y una spec que lo dibuje.

**Jerarquía mundo: héroes y soporte**
- **Héroes del mundo** (unidades, bases): contorno más grueso, color más saturado, valor más contrastado.
- **Soporte** (fondo, atrezo): contorno fino o ninguno, saturación baja, valor medio. Nada del fondo compite con una silueta de 14 px.

**Gramática de formas de la UI**
- Esquinas redondeadas con los tokens `--bc-radius-sm/md/lg` (10/14/18 px) y `--bc-radius-pill`. Nodo de mapa: círculo. Barras: píldora.
- **Contorno grueso oscuro nunca en la UI; borde fino luminoso nunca en el mundo.** El grosor del trazo es lo que separa «existe» de «informa».

## 4. Sistema de color

**Paleta de UI = los tokens `--bc-*`.** No se inventan hex: si falta un rol, se propone un token nuevo en `src/theme.css`, y el test de tokens (`tests/unit/theme/designTokens.test.ts`) lo hace cumplir.

| Rol | Tokens |
|---|---|
| Fondos | `--bc-bg` `#020308`, `--bc-bg-1`, `--bc-bg-2`, vidrio `--bc-glass`, superficie `--bc-surface` |
| Texto | `--bc-text`, `--bc-text-dim`, `--bc-text-faint` (todos ≥ 4,5:1 sobre los fondos) |
| Acentos | cian, naranja, púrpura, dorado, rojo, verde, rosa; texto sobre acento `--bc-text-on-accent` |
| Bordes | `--bc-border` (14 % blanco), `--bc-border-strong` (28 %) |

**Paleta del mundo = hex numéricos en el código de Pixi** (exentos del test de tokens). Hoy no estaba definida; esta es la regla:
- **Contorno:** casi negro, equivalente a `--bc-bg-2` (`#0a0c14`).
- **Relleno:** libre en matiz, pero **nunca más saturado ni más luminoso que el token de información del mismo matiz**. El neón es siempre lo más vivo de la escena.
- **Valores espejo que se mantienen:** equipo aliado `0x22d3ee` = `--bc-cyan`, equipo enemigo `0xef4444` = `--bc-red`, impacto `0xfacc15` = `--bc-gold`.
- **Deuda de color:** cuatro unidades usan *exactamente* un token de información como color de cuerpo: `cat-deidad` (dorado), `seed-cat-ranged` (cian), `seed-cat-titan` (rojo) y `enemy-saltarin-alado` (rosa). Deben bajar de saturación o de luminosidad.

**Significado de cada color**

| Color | Significado primario | Usos secundarios (siempre con texto o icono al lado) |
|---|---|---|
| Cian | aliado y energía | nodo disponible, foco de teclado, rareza Raro |
| Rojo | enemigo y peligro | final del degradado del botón principal, insignias |
| Dorado | recompensa y daño | dificultad ★, rareza Megarraro, festival |
| Naranja | acción principal | rareza Legendario |
| Verde | completado y éxito | rareza Especial |
| Púrpura / rosa | rareza alta y gacha | Superraro / Colaboración |

La rareza usa su propia escala de siete colores (`RARITY_TAG_CLASS` en `src/data/cats.ts`) y **siempre con su nombre escrito**.

**Temperatura por región** (propuesta; la sección 6 la traduce a escenarios)
- `imperio-de-los-gatos-cap1` (48 etapas): arco de temperatura de cálido y claro (etapa 1) a frío y sombrío (etapa 48, jefe), en cuatro tramos de 12 etapas.
- `imperio-de-los-gatos`: cálido templado, valores medios.
- Eventos («Etapas de Fantasía»): paleta festiva saturada fuera de esa escala, para que se vean distintos.

**Seguridad ante daltonismo**
- **Aliado (cian) frente a enemigo (rojo):** contraste de luminancia ≈ 2,1:1 y diferencia en el eje azul-amarillo, que se conserva en las deficiencias rojo-verde. Aun así necesita señal de respaldo: el enemigo mira a la izquierda (sprite espejado) y nace en la base contraria.
- **Nodos del mapa, aviso real:** `completado` (verde), `evento` (dorado) y `disponible` (cian) se distinguen hoy **solo por color**, porque todos muestran `★n`. Verde y dorado se confunden en deuteranopía. Hace falta un icono por estado: marca ✓ en completado, borde doble o ✦ en evento, candado en bloqueado.
- **Rareza en la cuadrícula del gacha x11:** solo hay color y tamaño de resplandor; **dorado frente a naranja (Megarraro frente a Legendario)** es el par más arriesgado. Hace falta rótulo o número de estrellas bajo cada orbe.
- **Texto:** se mantiene el suelo de 4,5:1 que ya cumple la UI.

## 5. Dirección de diseño de personajes

**Identidad**
- **Aliados:** gatos antropomorfos chibi (bípedos, cabeza grande, hocico corto, cola) con equipo (armadura, arma o escudo) según arquetipo. **Las orejas de gato son obligatorias y siempre asoman en la silueta**; no cuentan como el «rasgo distintivo» de la sección 3. Si el rasgo ocupa la cabeza (`horns`, `crest`), las orejas asoman a ambos lados. Esto exige que `unitFactory.ts` vuelva a dibujar orejas a todo aliado, algo que la spec 028 había quitado; irá en una spec.
- **Enemigos:** criaturas y animales de caricatura que **nunca son gatos** (perros, serpientes, hipopótamos, focas, unicornios, brutos, La Máscara…). Así «nosotros = gatos» se lee a primera vista.

**Distinguir aliado de enemigo (capa de información, neón)**
1. **Anillo de equipo en el suelo** bajo cada unidad: una elipse fina cian (aliado) o roja (enemigo) con `--bc-glow-*`. Es nuevo y exige una spec.
2. **Barra de vida con color de equipo** (ya existe).
3. **Respaldo no cromático:** los aliados miran en el sentido de avance y los enemigos, espejados, en el contrario (ya existe).

**Los tres niveles de arte**

| Nivel | Qué es | Regla |
|---|---|---|
| A. Sprite | gato cartoon animado por fotogramas (16 reposo + 12 ataque) | es el arte final |
| B. Procedural | cuerpo plano generado por código: contorno `#0a0c14`, relleno plano de `primaryColor`, orejas (aliado) y un rasgo | marcador provisional **sin borde neón, sin visor, sin placas brillantes** |
| C. Cuerpo cyber | el cuerpo actual con degradado, anillos, visor y propulsor | **se retira como apariencia**: las 16 unidades que lo usan migran a B |

- **Ninguna unidad nueva entra al catálogo sin al menos nivel B.**
- **Qué promueve de B a A** (propuesta): jefes y enemigos del Capítulo 1, unidades del equipo inicial y de las primeras etapas, y luego por rareza ascendente.
- `ProceduralDesign`: `primaryColor` único en todo el catálogo, `size` = `Cat.width`, un rasgo por unidad.

**Evolución** (`Cat.evolutions`: Base → Evolucionada → Verdadera)
- No cambian la masa base ni el color principal. Cada forma **añade una pieza de equipo que sobresale de la silueta** (p. ej. casco → casco con cresta → capa). Hoy el arte no distingue formas; es objetivo futuro.

**Rareza**
- La rareza vive solo en la capa de información: etiqueta con color, marco de tarjeta y revelado de gacha. **El cuerpo en el mundo no lleva brillo ni aura por rareza.**

**Animación y pose** (suelo de la Constitución § III: reposo + ataque)
- Nivel A: reposo en bucle (respiración/parpadeo) y ataque en tres tiempos (anticipación inclinada hacia atrás, impacto con el arma extendida, recuperación). Pose exagerada y legible; cara con dos estados (neutro y esfuerzo).
- Nivel B: bastan las transformaciones de `animation.ts` (rebote en reposo, aplastamiento y giro al atacar).
- Muerte: el `DeathEcho` actual (0,35 s).

**Nivel de detalle (LOD)**
- Se diseña para 24–44 px de alto y se exporta a 300×300. **Si un detalle desaparece al reducir, no existe**: no se dibuja.

**Coste conocido de la decisión:** reemplazar los 12 sprites actuales por gatos son 12 × (16 + 12) = 336 fotogramas.

## 6. Lenguaje de entornos (mapas y fondos de batalla)

**Mapa de etapas**
- **Hoy:** degradados y puntos. **Objetivo:** cada región tiene un fondo ilustrado de **soporte** (sin contorno, saturación baja, valores medios) y **el fondo nunca es más brillante que un nodo**.
- **Capítulo 1** (48 etapas, lienzo ≈ 3360 px de alto): cuatro biomas apilados de abajo (etapa 1) a arriba (etapa 48): **Montaña → Desierto → Nieve → Cementerio**. Ese orden cumple el arco de la sección 4, de día templado y claro a noche fría y oscura, con el desierto como pico cálido. Cada tramo cubre ≈ 12 etapas; como una fila del serpenteo tiene 8, los cortes se difuminan en una transición suave. **No se mueven nodos (`mapPosition`) para cuadrar con el arte.**
- **Nodos** (información, neón; cristal oscuro, así que leen bien incluso sobre la nieve): el icono por estado de la sección 4: candado, disponible, ✓ completado y ✦ evento. Sin cambiar su tamaño de 40 px.
- **Enlaces:** hoy un trazo punteado claro, que desaparecería sobre la nieve. Pasan a **dos trazos**: uno oscuro más ancho debajo y el punteado claro encima.
- `imperio-de-los-gatos` usa el bioma Montaña. Los eventos usan una ilustración propia, saturada y festiva (no existe en el pack).

**Fondo de batalla**
- Sustituye la nebulosa y la rejilla neón (sección 1) por el bioma de la etapa: capas de cielo, montañas lejanas, medias, cercanas y suelo. La cámara no se desplaza, así que **no hace falta parallax**: se compone como imagen estática, con deriva lenta de nubes como extra opcional (se apaga con «reducir movimiento»).
- **Franja de unidades:** los 56 px sobre el carril son de valor medio y detalle bajo. Nada del fondo es más oscuro que el contorno de una unidad ni más saturado que su relleno. En el Cementerio, que es oscuro, esa franja se aclara con niebla de suelo para que el contorno negro siga leyéndose.
- **Prueba de lectura:** reduce una captura a gris y al 50 % de escala; una unidad de 14 px debe distinguirse de su fondo.

**Bases** (46×70 px, el objeto más grande del mundo)
- Pasan a cartoon: contorno grueso y color plano. La aliada es una atalaya felina (las orejas del `crown` actual se quedan) y la enemiga una guarida con púas. **La barra de vida de la base sigue siendo neón (información).** Hoy ambas usan degradados cian y rojo con borde brillante, que son deuda.

**Identidad por región y relato sin texto**
- Cada bioma cuenta quién manda por 1–2 siluetas grandes en el horizonte (un castillo en el Cementerio, picos nevados en la Nieve), nunca con texto.

**Contraste personajes ↔ entorno**
- El fondo de soporte tiene saturación baja y valor medio; las unidades, contorno más grueso y relleno más saturado (sección 3). Si una unidad se pierde contra un tramo, se corrige el tramo, no la unidad.

**Material en bruto de `assets-source/banners/Free2DCartoonParallaxBackground`**

| Aspecto | Hallazgo |
|---|---|
| Licencia | la carpeta **no incluye archivo de licencia** y es un pack gratuito de terceros: **verificarla antes de publicar** |
| Saturación | Montaña y Desierto son muy saturados: desaturar para cumplir «soporte» |
| Suelo | la franja clara del camino está en y ≈ 81–88 % del alto; el carril del juego está al 62 % (`LANE_Y_FRACTION`). Hay que **subir el arte ≈ 22 % de su alto** y completar el tercio inferior con una extensión plana del suelo, o cambiar `LANE_Y_FRACTION` (cambio de código que afecta a todo el carril) |
| Peso | 4320×2160 × 5 capas × 4 biomas: reducir y exportar a un formato web (decisión de la sección 8) |
| No sirve | `Demo/` (escenas y scripts de Unity) |

## 7. Dirección visual de UI/HUD
[Por diseñar]

## 8. Estándares de assets
[Por diseñar]

## 9. Referencias
[Por diseñar]
