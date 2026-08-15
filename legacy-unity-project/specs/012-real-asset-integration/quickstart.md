# Quickstart: Integración de Arte Real Importado

Guía de validación end-to-end tras implementar `tasks.md`. No sustituye a los tests automatizados (EditMode/PlayMode) — cubre lo que solo se puede confirmar visualmente en el Editor.

## Prerrequisitos

- Unity 6000.3.20f1 abierto sobre este proyecto, sin errores de compilación en la Consola.
- Los 8 packs de `011-imported-asset-audit` siguen presentes en `Assets/` (no requieren reimportación).

## 1. Regenerar todo el contenido desde cero

En el Editor, menú **The Battler**, en este orden (cada uno es idempotente — puede reejecutarse sin duplicar assets):

```text
The Battler > Build Chapter 1 Placeholder Content
The Battler > Build Chapter 2 Placeholder Content
The Battler > Build Main Menu Content
The Battler > Build Adventure Map Content
The Battler > Build Player Base Content
```

**Resultado esperado**: cero errores en Consola. (Nota: los `MenuItem` conservan su nombre histórico "Placeholder"/"Content" — renombrarlos no es parte del alcance de esta feature, ver Assumptions de spec.md.)

## 2. Validar ausencia de placeholder procedural

```bash
grep -rn "CreateSquareSprite\|CreateScaleClip" Assets/Editor/Battler/*.cs
```

**Resultado esperado**: sin resultados (las dos funciones fueron eliminadas/reemplazadas por `BattlerArtLibrary`), o si se conservan como fallback documentado, ningún `MenuItem` de "Build ... Content" las invoca ya en su camino feliz.

## 3. Correr los content builders de validación existentes

```text
The Battler > Validate Chapter 1 Scene
The Battler > Validate Adventure Map Scene
```

**Resultado esperado**: `OK, sin referencias nulas ni datos faltantes` en ambos (estas validaciones ya existían — deben seguir pasando sin modificación de sus aserciones, research.md §7).

## 4. Correr los tests automatizados

Unity Test Runner (EditMode primero, luego PlayMode):

- `Assets/Tests/EditMode/Battler/*` — incluye los tests nuevos de `UnitDefinition.Portrait` y de estabilidad del mapeo unidad→sprite (tasks.md).
- `Assets/Tests/PlayMode/Battler/*` — `AdventureMapFlowPlayModeTests`, `Chapter2BattleLoopPlayModeTests`, etc. deben seguir en verde sin cambios en sus aserciones (son de flujo, no de presentación).

**Resultado esperado**: 100% en verde.

## 5. Comparación visual contra el sketch de referencia

Abrir cada escena reconstruida y compararla contra la pestaña equivalente de `.planning/sketches/001-full-game-mockup/index.html`:

| Escena Unity | Pestaña del sketch | Qué mirar |
|---|---|---|
| `MainMenu.unity` (Play) | Menú Principal | Fondo de montaña real, botones ilustrados con etiqueta propia |
| `AdventureMap.unity` (Play) | Mapa de Aventuras | Cada banner con fondo de bioma real y candado/estrella superpuesto |
| `PlayerBase.unity` (Play) | Base del Jugador | Cada fila de unidad con su sprite `hero_N` (frame idle) |
| `Chapter1_Battle.unity` / `Chapter2_Battle.unity` (Play) | Batalla (Cap. 1) | Base propia = Obelisco+bandera, base enemiga = Arco+calavera, unidades con sprite real caminando/atacando, HUD con iconos planos |

**Resultado esperado**: coincidencia de estilo de pack por pantalla (SC-004) — sin mezclar `Hyper_Casual_UI` ilustrado y `UI Elements` plano dentro de la misma pantalla.

## 6. Verificación cruzada unidad↔sprite (SC-003)

Con el juego en Play, comparar el sprite de una misma unidad (p. ej. `player_unit_1` "Espadachín") en `PlayerBase` (fila de plantel), `TeamFormation` (fila de roster) y `Chapter1_Battle` (unidad desplegada en el carril) — debe ser el mismo `hero_N`/frame en las tres pantallas, según [contracts/unit-visual-identity-mapping.md](./contracts/unit-visual-identity-mapping.md).
