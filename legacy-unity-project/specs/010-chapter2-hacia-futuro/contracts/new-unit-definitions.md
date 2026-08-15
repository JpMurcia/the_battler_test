# Contract: Diseño de las 1-2 unidades jugables nuevas del Capítulo 2

Fija el rol de combate de cada unidad nueva (decisión delegada por spec.md a `/speckit.plan`, ver research.md §3). No fija valores numéricos de balance (`cost`/`damage`/`maxHealth`/etc. concretos) — esos son autoría de contenido en `/speckit.tasks`/`/speckit.implement`, mismo criterio que `001` ya aplicó a sus 5 unidades. Ambas son instancias de `UnitDefinition` (`001`, sin cambios de clase) — ver [contracts/scriptableobject-data-contract.md de 001](../../001-chapter1-vertical-slice/contracts/scriptableobject-data-contract.md) para las reglas de validación de campo que heredan.

## `player_unit_6` — Unidad de apoyo/tecnología

| Aspecto | Definición |
|---|---|
| Rol de combate | Daño a distancia mediante un dron/torreta desplegable — refuerza visualmente la ambientación tecnológica de "Hacia el Futuro" sin duplicar el rol del Mago (`001`, daño mágico a distancia). |
| Relación con el roster de `001` | Complementa, no reemplaza: coexiste con las 5 unidades de `001` en `Chapter2.availableUnits` (contracts/chapter2-scriptableobject-data-contract.md). |
| `team` | `Player`. |
| Expectativa de stats (relativa, no valor fijo) | Coste y salud similares o menores al Mago (unidad de soporte, no de línea de frente); daño y `cooldownSeconds` a definir en autoría de contenido. |
| Identidad visual (Principio III, FR-005a) | `idleAnimation` (dron en reposo/patrullando), `attackAnimation` (disparo/activación del dron, distinta de la idle), `visualVariant` obligatoria (p. ej. un acabado/color de chasis distintivo) — assets en `Assets/ScriptableObjects/Battler/Chapter2/PlaceholderArt/`. |
| Compatibilidad con `007`/`008` (research.md §2) | Sin campo `attackType`/clasificación hoy (no existen en `UnitDefinition.cs`); cuando `007` se implemente, es candidata natural a `AttackType.Area` o `AttackType.LongDistance` por su rol declarado aquí — no se fuerza en esta feature. |

## `player_unit_7` — Unidad blindada pesada

| Aspecto | Definición |
|---|---|
| Rol de combate | Tanque cuerpo a cuerpo con armadura avanzada — mayor `maxHealth` relativo que el Escudero de `001` (que representa protección "convencional"), a costa de mayor `cost`/`cooldownSeconds`. Refuerza el salto tecnológico del capítulo frente a la ambientación del Capítulo 1. |
| Relación con el roster de `001` | Complementa al Escudero sin duplicar su rol exacto — mayor inversión de recurso a cambio de mayor resistencia, no un simple reskin. |
| `team` | `Player`. |
| Expectativa de stats (relativa, no valor fijo) | `maxHealth` mayor que el de cualquiera de las 5 unidades de `001`; `damage`/`range` bajos o medios (rol defensivo/de absorción, no de daño principal); `cost`/`cooldownSeconds` mayores que el promedio del roster de `001`, a definir en autoría de contenido. |
| Identidad visual (Principio III, FR-005a) | `idleAnimation` (postura defensiva/reposo con armadura visible), `attackAnimation` (ataque cuerpo a cuerpo con el equipo blindado, distinta de la idle), `visualVariant` obligatoria (accesorio/equipo que refuerce la lectura "blindado pesado") — assets en `Assets/ScriptableObjects/Battler/Chapter2/PlaceholderArt/`. |
| Compatibilidad con `007`/`008` | Sin campo `attackType`/clasificación hoy; candidata natural a `AttackType.SingleTarget` (comportamiento por defecto, sin acción requerida) cuando `007` se implemente. |

## Validación común a ambas (FR-005a)

- `HasValidVisualIdentity == true` (`UnitDefinition`, `001`, sin cambios): `idleAnimation != null && attackAnimation != null && visualVariant != null && idleAnimation != attackAnimation`. Cubierto por el mismo validador EditMode que ya corre sobre las 5 `UnitDefinition` de `001` — no requiere un test nuevo, solo que el recorrido de assets del proyecto incluya la carpeta `Chapter2/`.
- `unitId` único en el proyecto — `"player_unit_6"`/`"player_unit_7"` no colisionan con `"player_unit_1"`…`"player_unit_5"` de `001`.
