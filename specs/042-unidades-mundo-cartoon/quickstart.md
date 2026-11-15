# Quickstart: validar Unidades del Mundo Cartoon

## Requisitos

- Dependencias instaladas (`npm install`).
- Rama con la implementación de `specs/042-unidades-mundo-cartoon/tasks.md`.

## 1. Pruebas automáticas

```bash
npx vitest run
```

```bash
npx tsc -b
```

```bash
npm run lint
```

Resultado esperado: todo en verde y sin modificar las pruebas de motor, combate ni balance (SC-006 y SC-008). En concreto:

| Prueba | Qué demuestra |
|---|---|
| `tests/unit/data/unitDesigns.test.ts` (nueva) | FR-004, FR-005, FR-012: las 65 unidades tienen sprite o diseño, las 12 con sprite tienen respaldo, los colores son únicos, ninguno coincide con un token y los nuevos cumplen `S < 0,69` y `L < 0,48` (ver [data-model.md](./data-model.md) § 1) |
| `tests/unit/data/imperioCap1Design.test.ts` | sigue con 30 entradas y sin combinaciones repetidas |
| `tests/unit/game/unitFactory.test.ts` (ampliada) | determinismo; aliado con orejas y enemigo sin ellas; `cat-ears` se dibuja una sola vez; los 10 rasgos no lanzan; una sola `generateTexture` por `(id, rol)` y con `resolution: 2` |
| `tests/unit/game/teamRing.test.ts` (nueva) | geometría proporcional y acotada; el anillo no lanza para ningún equipo |
| `tests/unit/game/unitHpBar.test.ts` (ajustada) | la barra de vida no cambia y recibe solo el tamaño |
| `tests/unit/engine/*`, `tests/unit/data/cats.test.ts` | sin cambios (FR-011) |

## 2. Comprobación estructural

```bash
git grep -n "cyberUnitBody\|drawCyber\|getGlowPulseAlpha\|CYBER_TEAM_COLOR" -- src tests
```

Resultado esperado: ninguna coincidencia (FR-002, SC-001). Hoy el comentario de `tests/unit/game/baseTower.test.ts:63` cita `cyberUnitBody.test.ts`: hay que reescribirlo al borrar ese test.

## 3. Revisión visual en el juego

```bash
npm run dev
```

1. Entra en una batalla del Capítulo 1 y despliega unidades de los tres orígenes: una con sprite (p. ej. Gato Básico), una con diseño del Capítulo 1 (p. ej. Gato Yunque) y una antes "cyber" (p. ej. Gato Golpe Certero).
2. Por cada unidad viva comprueba:
   - el contorno oscuro continuo y el relleno plano, sin visor, placas, propulsor, degradado ni borde brillante;
   - las orejas en todo aliado con diseño, a los lados del rasgo si este ocupa la cabeza (Gato Forzudo, cuernos), y ninguna en los enemigos;
   - el anillo cian bajo los aliados y rojo bajo los enemigos, pegado al suelo mientras la unidad rebota o ataca, sin pulsar;
   - la barra de vida igual que antes.
3. Revisa los triángulos (p. ej. Gato Cornamenta, Gato Sigiloso): orejas y rasgos de cabeza apoyados en el borde del triángulo, no flotando. Si se ven mal, ajusta los valores iniciales de [data-model.md](./data-model.md) § 3 y vuelve a mirar.
4. Pausa la batalla: los anillos siguen en su sitio.
5. Deja morir una unidad con diseño: el eco conserva la forma, tintada y apagada, se encoge en ~0,35 s y no tiene anillo.
6. Simula un sprite que falla: renombra temporalmente `public/sprites/hero_1/idle/1.png`, recarga y despliega el Gato Básico. Debe verse su diseño cartoon (círculo taupe con orejas), nunca el cuerpo "cyber". Restaura el archivo.
7. **Prueba de lectura** (SC-005): haz una captura con el campo lleno, redúcela al 50 % y pásala a gris. Cada unidad debe leerse por silueta y su bando por el anillo.
8. **Fluidez** (SC-007): con 20 o más unidades en pantalla, compara a ojo con `master`; no debe haber tirones nuevos. Opcional: el panel Performance del navegador durante 10 s.

## 4. Inventario

Actualiza `docs/art/entity-inventory.md`: el nivel C queda a 0 y los 12 sprites tienen respaldo B. Vuelve a ejecutar la prueba de tokens (`tests/unit/theme/designTokens.test.ts`) si tocaste CSS (no debería hacer falta).
