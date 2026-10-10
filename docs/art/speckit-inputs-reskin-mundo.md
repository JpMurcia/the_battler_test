# Entradas para `/speckit-specify` — reskin «mundo cartoon»

**Origen**: `docs/art/art-bible.md` (secciones 1–6), `docs/art/entity-inventory.md` y `docs/art/asset-specs/basic-cat-assets.md`, 2026-10-10.

**Propósito**: la biblia de arte decide que el mundo (unidades, enemigos, bases, escenarios) es de dibujos animados y que la información (equipo, vida, estado, rareza) brilla en neón. Casi toda la deuda visual que eso genera vive en `src/game/`, `src/data/` y `src/screens/`, así que según la Constitución (§ Flujo de trabajo) pasa por una spec antes de tocar código. Esto **no es una spec**: son tres textos listos para pegar en `/speckit-specify`, en este orden.

| Orden | Spec | Necesita assets nuevos | Estado |
|---|---|---|---|
| 1 | A. Unidades cartoon | no | lista para especificar |
| 2 | B. Estado no cromático | no | lista para especificar; independiente de A |
| 3 | C. Escenarios y bases | sí (fondos, torres) y licencia verificada | bloqueada hasta tener los assets (`/asset-spec region:…` y `base`) |

---

## A. Unidades cartoon

```
Reskin "mundo cartoon" de las unidades de combate de "Battle Cats Web": aplicar la Biblia de Arte (docs/art/art-bible.md, secciones 1, 3, 4 y 5) a cómo se dibujan en batalla las unidades que no usan sprites de fotogramas, y añadir la señal de equipo en el suelo, sin cambiar ninguna regla de combate, estadística ni balance.

Qué debe percibir el jugador:
- Todo aliado y enemigo sin sprite de fotogramas se ve como un dibujo de dibujos animados: contorno oscuro grueso y relleno plano, sin borde neón, visor, placas brillantes, propulsor ni degradados.
- Todo aliado muestra orejas de gato siempre visibles en la silueta, además de su rasgo distintivo de arquetipo (el rasgo no las sustituye). Ningún enemigo las lleva.
- El cuerpo "cyber" genérico deja de existir como apariencia: las 16 unidades que hoy lo usan (Golpe Certero, Cazazombis, Cazametal, Escudo, Invocador, Enfurecido, Escurridizo, Superviviente, Empujón, Cobrador, Ancla, Cavernícola Garrochista y los 4 gatos de gacha: Eclipse, Supremo, Errante del Vacío, Ídolo Estelar) reciben un diseño propio (forma base, color único en todo el catálogo, tamaño igual a su ancho y un rasgo según su arquetipo, según la sección 3 de la biblia).
- Todas las unidades en batalla, incluidas las 12 con sprite, muestran un anillo de equipo bajo los pies: cian para aliados y rojo para enemigos, de color de paleta con resplandor. La barra de vida con color de equipo se mantiene.
- Cuatro unidades cuyo color de cuerpo coincide exactamente con un color de información (cat-deidad, seed-cat-ranged, seed-cat-titan, enemy-saltarin-alado) pasan a un tono más apagado, sin repetir el color de ninguna otra unidad.
- La unidad muerta (eco de muerte) conserva el mismo estilo cartoon, apagado.

Reglas que deben seguir cumpliéndose: toda unidad conserva animación de reposo y de ataque (Constitución § III); nada de esto provoca re-renderizados de React por el tick de combate (§ VI); el color principal de cada unidad sigue siendo único; los 12 sprites actuales no cambian en esta spec (se reemplazarán por gatos más adelante, fuera de alcance).

Fuera de alcance: sprites nuevos, fondos de batalla, torres de base, mapa de etapas, pantallas de UI, y cualquier cambio de estadísticas o balance.

Criterios de éxito: ninguna unidad del catálogo (65) se dibuja con el cuerpo "cyber"; hay una comprobación automática de que toda unidad tiene sprite o diseño; una unidad de 14 px se distingue por su silueta y su anillo de equipo sobre cualquier fondo actual.
```

---

## B. Estado no cromático

```
Hacer legible sin depender solo del color el estado de los nodos del mapa de etapas y la rareza en el revelado de gacha de "Battle Cats Web", según la sección 4 de la Biblia de Arte (docs/art/art-bible.md).

Qué debe percibir el jugador:
- Cada estado de nodo del mapa de etapas lleva un icono además de su color: candado en bloqueado, marca de verificación en completado, estrella o destello en evento. El estado disponible se distingue por su anillo y por no llevar candado ni marca. Hoy completado (verde), evento (dorado) y disponible (cian) solo se distinguen por color y todos muestran la misma etiqueta de dificultad.
- En la cuadrícula de 11 tiradas del gacha cada orbe muestra el nombre de su rareza (o su número de estrellas) debajo; hoy Megarraro (dorado) y Legendario (naranja) solo se distinguen por color y tamaño de resplandor.
- El nombre accesible de cada nodo incluye su estado.

Reglas: sin colores literales nuevos (solo tokens de tema); los iconos salen de la librería de iconos ya usada; el tamaño de 40 px del nodo no cambia; respeta "reducir movimiento".

Fuera de alcance: ilustraciones de fondo del mapa, trazo doble de los enlaces (spec C), cambios de paleta, y cualquier cambio de mecánica de desbloqueo.

Criterios de éxito: los cuatro estados de nodo se distinguen en una captura en escala de grises; los cuatro orbes de rareza se distinguen sin color; hay pruebas que verifican icono y nombre accesible por estado.
```

---

## C. Escenarios y bases cartoon (bloqueada por assets)

```
Reskin "mundo cartoon" de los escenarios y las bases de "Battle Cats Web": aplicar la Biblia de Arte (docs/art/art-bible.md, secciones 1, 4 y 6) al mapa de etapas, al fondo de batalla y a las torres de base, usando las ilustraciones y fichas de docs/art/asset-specs/ ya aprobadas.

Qué debe percibir el jugador:
- Cada región del mapa de etapas tiene un fondo ilustrado de soporte (sin contorno, saturación baja). El Capítulo 1 recorre cuatro biomas de abajo arriba: Montaña, Desierto, Nieve y Cementerio, con transiciones suaves; la región inicial usa Montaña; el evento usa una ilustración propia.
- Los enlaces entre nodos se dibujan con dos trazos (uno oscuro más ancho y uno claro punteado encima) para leerse sobre cualquier bioma.
- Cada etapa de batalla usa el bioma de su región (hoy el nivel no declara bioma) con la línea de suelo alineada al carril; la nebulosa y la rejilla neón actuales desaparecen del escenario de batalla.
- Las torres aliada (atalaya felina) y enemiga (guarida con púas) pasan de degradados con borde brillante a cartoon con contorno grueso y color plano; su barra de vida sigue siendo neón.

Reglas: nada del fondo es más oscuro que el contorno de una unidad ni más saturado que su relleno en la franja de unidades; el carril y las posiciones de nodo (mapPosition) no cambian para cuadrar con el arte; "reducir movimiento" apaga cualquier deriva; la licencia de cualquier pack de terceros debe estar verificada antes de publicar.

Fuera de alcance: unidades, UI, balance, nuevos niveles.

Criterios de éxito: una unidad de 14 px se distingue de su fondo en los cuatro biomas (prueba de lectura en gris a 50 % de escala); ningún nodo cambia de posición; el peso total de los fondos cabe en el presupuesto que fije la sección 8 de la biblia (aún por definir).
```

---

## Notas para `/speckit-clarify`
- **A:** ¿el grosor del contorno se escala con el tamaño de la unidad o tiene un mínimo de 1 px? ¿el anillo de equipo es una elipse fina o rellena? ¿las orejas se dibujan también en la unidad muerta?
- **B:** ¿icono propio para `disponible` o solo ausencia de icono?
- **C:** ¿se reubica el arte (subir ≈ 22 % su alto y extender el suelo) o se cambia `LANE_Y_FRACTION`? ¿dónde se declara el bioma de cada nivel?
