# Data Model: Unidades del Mundo Cartoon

**Feature**: `specs/042-unidades-mundo-cartoon` · Nada de este modelo se persiste (Constitución § V): son datos estáticos de contenido y geometría de render.

## 1. `ProceduralDesign` (sin cambios de forma)

Tipo existente en `src/data/seedData.ts`:

```ts
interface ProceduralDesign {
  primaryColor: number            // 0xRRGGBB
  baseShape: 'circle' | 'rect' | 'poly'
  size: number                    // = Cat.width (para el catálogo semilla, width = size × 0,8, sin cambios)
  distinctiveFeature: 'cat-ears' | 'fangs' | 'fin' | 'crest' | 'none' | 'horns' | 'wings' | 'shield' | 'spikes' | 'tail'
}
```

**Reglas de validación** (FR-005, FR-012; test nuevo `tests/unit/data/unitDesigns.test.ts`):
- Toda unidad de `CATS` (las 65) tiene `spriteKey` o `resolveUnitDesign(id) !== undefined`. Además, las 12 con `spriteKey` también tienen diseño (FR-004).
- `primaryColor` es único entre todos los diseños.
- `primaryColor` no coincide con ningún `--bc-cyan|orange|purple|gold|red|green|pink` (leídos de `src/theme.css`, no copiados).
- Los 28 diseños nuevos y los 5 colores corregidos cumplen `S < 0.69` y `L < 0.48` en HSL (research.md, Decisión 7).
- `size` de cada diseño nuevo = `width` de su `Cat`.

## 2. Registro `src/data/unitDesigns.ts` (nuevo)

```ts
export const EXTRA_UNIT_DESIGNS: Record<string, ProceduralDesign>   // 28 entradas
export function resolveUnitDesign(catId: string): ProceduralDesign | undefined
// orden: SEED_UNITS → SEED_ENEMIES → IMPERIO_CAP1_DESIGNS → EXTRA_UNIT_DESIGNS
```

`IMPERIO_CAP1_DESIGNS` mantiene sus 30 entradas.

### 2.1 Respaldo de las 12 unidades con sprite (aliados)

| id | Nombre | size | Forma | Rasgo | Motivo (datos) | Color |
|---|---|---|---|---|---|---|
| `basic-cat` | Gato Básico | 16 | circle | none | equilibrado, recluta inicial | `0x8a7a63` |
| `tank-cat` | Gato Tanque | 24 | rect | horns | tanque: vida 200, daño 3 | `0x6e5a4b` |
| `speed-cat` | Gato Veloz | 12 | poly | tail | rápido: velocidad 40 | `0x5f7a3a` |
| `heavy-cat` | Gato Pesado | 28 | rect | spikes | agresivo: daño 20 | `0x7a3b2e` |
| `solar-cat` | Gato Solar | 14 | circle | crest | divinidad («Solar»), a distancia | `0xa8742a` |
| `armored-cat` | Gato Blindado | 30 | rect | shield | defensivo: vida 250, velocidad 6 | `0x3e5b80` |
| `frost-cat` | Gato Escarcha | 18 | circle | none | control: Congelar | `0x568694` |
| `weaken-cat` | Gato Debilitador | 16 | circle | none | control: Debilitar | `0x6b4f7a` |
| `slow-cat` | Gato Grillete | 16 | rect | none | control: Ralentizar (grillete pesado) | `0x5c5348` |
| `zombie-ward-cat` | Gato Guardián Antizombi | 26 | rect | shield | defensivo: resistencia a Zombi y a Congelar | `0x4d6b4f` |
| `triple-strike-cat` | Gato Triple Golpe | 18 | poly | spikes | agresivo: MultiHit | `0x8c3f52` |
| `lucky-cat` | Gato Afortunado | 16 | circle | spikes | agresivo: Critical | `0x3f7a5f` |

### 2.2 Las 16 unidades que dejan el cuerpo "cyber" (aliados)

| id | Nombre | size | Forma | Rasgo | Motivo (datos) | Color |
|---|---|---|---|---|---|---|
| `massive-strike-cat` | Gato Golpe Certero | 26 | rect | spikes | agresivo: daño 40, Daño Masivo | `0x6b3a4a` |
| `zombie-hunter-cat` | Gato Cazazombis | 20 | poly | spikes | agresivo: Asesino de Zombi | `0x5e6b2a` |
| `metal-hunter-cat` | Gato Cazametal | 22 | poly | spikes | agresivo: Asesino de Metal | `0x5a6470` |
| `shield-cat` | Gato Escudo | 16 | circle | shield | defensivo: Escudo 100 | `0x4a6d8c` |
| `summoner-cat` | Gato Invocador | 20 | circle | crest | mando: invoca al morir | `0x5b4a8a` |
| `strengthen-cat` | Gato Enfurecido | 20 | poly | spikes | agresivo: Enfurecer | `0x8a4a2a` |
| `dodge-cat` | Gato Escurridizo | 16 | poly | tail | rápido: velocidad 22, Esquivar | `0x6e5f8c` |
| `survivor-cat` | Gato Superviviente | 20 | circle | shield | defensivo: Sobrevivir | `0x6f6a3a` |
| `knockback-cat` | Gato Empujón | 22 | rect | horns | tanque/empuje: Retroceso, vida 130 | `0x82583a` |
| `wallet-cat` | Gato Cobrador | 18 | circle | none | economía: Dinero Extra | `0x2f5f4f` |
| `anchor-cat` | Gato Ancla | 24 | rect | shield | defensivo: inmune a Retroceso, vida 160 | `0x3a4a5c` |
| `cat-garrochista` | Cavernícola Garrochista | 18 | poly | tail | rápido: velocidad 48 | `0x8f7a3a` |
| `legend-cat-eclipse` | Gato Eclipse | 40 | circle | crest | divinidad legendaria | `0x2e2a4a` |
| `legend-cat-supreme` | Gato Supremo | 42 | rect | crest | mando legendario | `0x6a4a1f` |
| `collab-cat-voidwalker` | Gato Errante del Vacío | 26 | poly | spikes | agresivo: daño 45 a distancia | `0x4f2e4a` |
| `collab-cat-star-idol` | Gato Ídolo Estelar | 24 | circle | wings | aéreo: clasificación Angel | `0x8c5a7a` |

Totales de los 28 diseños: forma circle 11 · rect 9 · poly 8; rasgo spikes 8 · shield 5 · none 5 · crest 4 · tail 3 · horns 2 · wings 1.

### 2.3 Colores corregidos en registros existentes

| id | Registro | Antes | Después | Motivo |
|---|---|---|---|---|
| `seed-cat-ranged` | `seedData.ts` | `0x22d3ee` (= cian) | `0x2b8a99` | FR-005, coincide con token |
| `seed-cat-titan` | `seedData.ts` | `0xef4444` (= rojo) | `0xa33a3a` | FR-005, coincide con token |
| `cat-deidad` | `imperioCap1Design.ts` | `0xfacc15` (= dorado) | `0xa88a2c` | FR-005, coincide con token |
| `enemy-saltarin-alado` | `imperioCap1Design.ts` | `0xf472b6` (= rosa) | `0x9c4a76` | FR-005, coincide con token |
| `cat-cuchilla` | `imperioCap1Design.ts` | `0xdc2626` (= `seed-enemy-red-snake`) | `0xa5512f` | FR-005, duplicado (research.md, Decisión 8) |

## 3. Dibujo cartoon (`src/game/graphics/unitFactory.ts`)

| Constante | Valor | Origen |
|---|---|---|
| `OUTLINE_COLOR` | `0x0a0c14` | biblia §4 (= `--bc-bg-2`) |
| `outlineWidth(size)` | `max(1.5, size × 0.08)` | research.md, Decisión 2 |
| `FANG_COLOR` | `0xe8e2d4` | blanco roto plano |
| `TEXTURE_RESOLUTION` | `2` | research.md, Decisión 10 |

**Orden de capas** (`drawSeedUnit(g, design, role)`, determinista):
1. sombra de contacto (sin cambios);
2. orejas, solo si `role === 'ally'` y el rasgo no es `cat-ears` (relleno `primaryColor` y contorno);
3. rasgo trasero (`cat-ears`, `horns`, `crest`, `fin`, `spikes`, `wings`, `tail`) con relleno y contorno;
4. cuerpo: relleno plano y contorno;
5. cara (ojos y boca en `OUTLINE_COLOR`);
6. rasgo delantero (`shield`, `fangs`) con relleno plano y contorno.

Desaparecen `drawArmorPlates`, `drawVisorPanel` y `drawNeonRim`.

**Marco de cabeza** (rasgos `horns`, `crest`, `spikes`, `fin`; también orejas de círculo y rectángulo). Valores finales tras la revisión visual (quickstart § 3):

| Forma | `top` | `halfWidth` |
|---|---|---|
| circle | `-half` | `half` |
| rect | `-half` | `half` |
| poly | `-0.75 × half` | `0.25 × half` |

En el triángulo el marco baja hasta donde el cuerpo ya tiene anchura: la base del rasgo queda dentro del cuerpo y su punta asoma por encima del vértice. La primera propuesta (`-0.45`, `0.28`) dejaba los rasgos tapados por el cuerpo.

**Disposición de orejas** (`W` = `halfWidth` del marco):
- Círculo y rectángulo sin rasgo de cabeza: base de `±0.15·W` a `±0.70·W`, punta en `±0.75·W` y a `size × 0.28` sobre `top`.
- Círculo y rectángulo con rasgo de cabeza: base de `±0.55·W` a `±0.98·W` y punta en `±1.05·W`, a media altura. En el círculo la base baja a `top + 0.4·half` para seguir pegada al borde.
- Triángulo (las dos disposiciones): nacen de los lados inclinados bajo el vértice, con base `(±0.25·half, −0.4·half)` y `(±0.42·half, −0.1·half)` y punta en `(±0.55·half, −0.8·half)`. El vértice queda libre para el rasgo de cabeza.
- La base de las orejas se hunde dentro del cuerpo para que el contorno del cuerpo la tape.

**Cara**: en el triángulo baja y se estrecha (ojos `±0.2·half` a `y = 0.15·half`, boca a `0.5·half`) para no pisar los lados inclinados; en las demás formas no cambia.

**Escudo**: se sostiene abajo y hacia delante (`roundRect(0.05·half, 0.15·half, 0.75·half, 0.75·half)`) y se dibuja después de la cara, que queda a la vista. Antes tapaba los ojos.

**Caché**: clave `${catId}:${role}`, sin cambios. Unidades repetidas reutilizan la textura (FR-013).

## 4. Anillo de equipo (`src/game/graphics/teamRing.ts`, nuevo)

```ts
interface TeamRingGeometry { cx: number; rx: number; ry: number }   // en coordenadas locales del anillo
function computeTeamRingGeometry(bodyWidth: number): TeamRingGeometry
function drawTeamRing(g: Graphics, geometry: TeamRingGeometry, team: BattleUnit['team']): void
```

| Campo | Fórmula |
|---|---|
| `cx` | `bodyWidth / 2` |
| `rx` | `bodyWidth × 0.62` |
| `ry` | `clamp(bodyWidth × 0.2, 2, 6)` |
| Trazo principal | ancho 1,25, alfa 0,95, `TEAM_INFO_COLOR[team]` |
| Resplandor | dos trazos exteriores del mismo color: ancho 3 con alfa 0,22 y ancho 5 con alfa 0,10 |

**Posición** (solo transform, por fotograma): `ring.x = laneX`, `ring.y = laneY`. No hereda `bobOffsetY`, `scale` ni `rotation`. **Estados**: existe mientras la unidad está viva; nunca en el eco.

## 5. Colores de equipo (`src/game/graphics/teamColors.ts`, nuevo)

```ts
export const TEAM_INFO_COLOR: Record<BattleUnit['team'], number> = { Player: 0x22d3ee, Enemy: 0xef4444 }
```

Son los espejos numéricos de `--bc-cyan` y `--bc-red` (biblia §4). Los usan `drawUnitHpBar` y `drawTeamRing`, y sustituyen a `CYBER_TEAM_COLOR`.

## 6. Barra de vida (`src/game/graphics/unitHpBar.ts`)

```ts
type UnitBodySize = { bodyWidth: number; bodyHeight: number }
function drawUnitHpBar(g: Graphics, body: UnitBodySize, team: BattleUnit['team'], fraction: number): void
```

La geometría no cambia: los valores son los mismos que antes leía de `CyberBodyLayout` (FR-009).

## 7. Eco de muerte (`src/game/DeathEchoSprite.tsx`)

| Caso | Cuerpo | Tinte | Anillo |
|---|---|---|---|
| Sprite cargado | primer fotograma de reposo (sin cambios) | ninguno | no |
| Sin sprite, o sprite que aún carga o que falla | textura del diseño (misma caché, misma clave) | `ECHO_TINT = 0x8a8f99` | no |

`getDeathEchoPose` y la duración de 0,35 s no cambian.

## 8. Eliminados

- `src/game/graphics/cyberUnitBody.ts` (`computeCyberBodyLayout`, `drawCyberBodyBase`, `drawCyberVisor`, `drawCyberThruster`, `getGlowPulseAlpha`, `CYBER_TEAM_COLOR`).
- `tests/unit/game/cyberUnitBody.test.ts`.
- La rama de tres `Graphics` cyber en `UnitSprite.tsx` (`visorRef`, `thrusterRef`, `VISOR_PULSE_HZ`, `THRUSTER_PULSE_HZ`).
