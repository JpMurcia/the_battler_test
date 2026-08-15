# Contrato: Mapeo Unidad → Sprite Real

Determinista y estable entre regeneraciones (research.md §3). Verificado contra las 7 `UnitDefinition` de jugador y 2 `UnitDefinition` de enemigo que existen hoy en `Chapter1ContentBuilder.cs`/`Chapter2ContentBuilder.cs`.

## Unidades jugables (`Characters/hero_N`)

| `unitId` | Nombre | Content builder | `hero_N` asignado | Variante de género usada para idle/attack |
|---|---|---|---|---|
| `player_unit_1` | Espadachín | Chapter1 | `hero_1` | `male` |
| `player_unit_2` | Lancero | Chapter1 | `hero_2` | `male` |
| `player_unit_3` | Arquero | Chapter1 | `hero_3` | `female` |
| `player_unit_4` | Escudero | Chapter1 | `hero_4` | `male` |
| `player_unit_5` | Mago | Chapter1 | `hero_5` | `female` |
| `player_unit_6` | Dron de Apoyo | Chapter2 | `hero_6` | `female` |
| `player_unit_7` | Centinela Blindado | Chapter2 | `hero_7` | `male` |

Regla: `hero_N = índice posicional de la unidad dentro de su array de specs del content builder + offset de continuidad del capítulo anterior` (Cap. 1 empieza en `hero_1`; Cap. 2 continúa en `hero_6` porque Cap. 1 ya usó `hero_1`..`hero_5` — evita que dos unidades de capítulos distintos compartan sprite). La alternancia `male`/`female` no tiene una regla semántica — es solo para que las 7 unidades no luzcan idénticas entre sí incluso reutilizando pocos `hero_N`; puede ajustarse libremente en tasks.md siempre que quede registrada aquí.

## Unidades enemigas (`Monsters Creatures Fantasy 2`)

| `unitId` | Nombre | Content builder | Criatura asignada | Motivo |
|---|---|---|---|---|
| `enemy_grunt` | Recluta Enemigo | Chapter1 | `Slime` | Set de estados mínimo pero completo (idle/attack/hurt/death) — suficiente para un enemigo raso genérico. |
| `enemy_unit_2` | Centinela del Enjambre | Chapter2 | `Bat` | Único con estado de vuelo (`fly`) entre las 4 criaturas — coherente con "enjambre de máquinas autónomas" (research.md §3); usa `fly` como estado de reposo/movimiento por defecto (ya señalado en `asset-catalog.md` como sin `idle` explícito). |

## Frames por estado (origen de los `AnimationClip` horneados por `BattlerArtLibrary.CreateSpriteFrameClip`)

| Estado de `UnitDefinition` | Carpeta `hero_N` (jugador) | Carpeta criatura (enemigo) | Frame rate sugerido |
|---|---|---|---|
| `IdleAnimation` | `Characters/hero_N/<género>/1_idle/` (16 frames) | `Monsters Creatures Fantasy 2/Sprites/<Criatura>/idle|fly/` | 10 fps, loop |
| `AttackAnimation` | `Characters/hero_N/<género>/4_attack/` (12 frames) | `.../attack/` (`attack_bite` para Rat, `attack` para Slime, `attack` para Bat) | 12 fps, sin loop |
| `Portrait` (nuevo campo) | Frame `1` de la carpeta `idle` de arriba | Frame `1` de la carpeta `idle`/`fly` de arriba | N/A (estático) |

## Variante visual adicional (Principio III)

Overlay hijo (mismo patrón que `CreateVariantPrefab` ya existente) con un ícono de `Hyper_Casual_UI/Sprites/Icons/` en el color de acento ya definido por unidad (`PlayerUnitSpecs`/`NewPlayerUnitSpecs`). No aplica a unidades enemigas (Principio III solo exige esto para "personaje jugable").

| `unitId` | Ícono sugerido |
|---|---|
| `player_unit_1`..`player_unit_5` | `Icons/star.png` (o equivalente disponible) teñido con el `accentColor` ya definido en `PlayerUnitSpecs` |
| `player_unit_6`/`player_unit_7` | Ídem, con el `accentColor` de `NewPlayerUnitSpecs` |

## Verificación de contrato

- `UnitDefinition.HasValidVisualIdentity` debe seguir siendo `true` para las 7 unidades de jugador tras la migración (idle/attack/variante no nulos y distintos entre sí) — sin cambio de regla, solo de contenido.
- Ninguna unidad de un capítulo distinto comparte `hero_N`/criatura con otra (verificable listando las asignaciones de esta tabla — 0 duplicados).
- Re-ejecutar el content builder de un capítulo no cambia la asignación `hero_N`/criatura de ninguna unidad ya existente (idempotencia, FR-009).
