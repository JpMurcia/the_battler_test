# Contract: Constructores de Biblioteca (`CatGuideBuilder` / `EnemyGuideBuilder` / `TreasureMenuBuilder`)

Ver [research.md §3-§6](../research.md) para las decisiones de diseño detrás de este contrato. Las tres funciones son puras: sin efectos secundarios, sin escritura de ningún dato (FR-007), recalculadas por completo en cada llamada (FR-008).

## `CatGuideBuilder.Build(ownedUnits, leveling, evolution)`

```text
Build(ownedUnits, leveling, evolution):
    resultado = []
    para cada unit en ownedUnits:
        stage = evolution.GetEvolutionStage(unit.UnitId)
        resultado.Add(new CatGuideEntry {
            Unit = unit,
            Level = leveling.GetUnitLevel(unit.UnitId),
            Stage = stage,
            EffectiveStats = unit.GetEffectiveCombatProfile(stage)   # 009, ya existente
        })
    return resultado
```

- **FR-002/FR-009**: `ownedUnits` vacío (no debería ocurrir en la práctica, `AvailableUnits` de `ChapterDefinition` nunca está vacío) ⇒ lista vacía, sin error.
- **SC-002**: cada entrada refleja el nivel/forma de evolución vigente en el momento de la llamada — llamar de nuevo tras mejorar una unidad devuelve datos actualizados sin ningún paso adicional (no hay caché).

## `EnemyGuideBuilder.Build(catalog, progress)`

```text
Build(catalog, progress):
    si catalog == null: return []   # FR-009

    resultado = []
    para cada enemy en catalog.Enemies:
        si enemy == null: continue   # defensivo
        si Array.IndexOf(progress.encounteredEnemyIds, enemy.UnitId) >= 0:
            resultado.Add(new EnemyGuideEntry { Enemy = enemy })
    return resultado
```

- **FR-003**: solo incluye enemigos presentes en `progress.encounteredEnemyIds` — un enemigo del catálogo nunca enfrentado no aparece (US2 Escenario 3).
- **FR-009**: `encounteredEnemyIds` vacío (jugador nunca jugó una batalla) ⇒ lista vacía, sin error (US2 Escenario 2).

## `TreasureMenuBuilder.Build(catalog, progress)`

```text
Build(catalog, progress):
    si catalog == null: return []   # FR-009

    resultado = []
    para cada set en catalog.Sets:
        si set == null: continue   # defensivo
        obtenidos = set.TreasureIds.Count(id => Array.IndexOf(progress.obtainedTreasureIds, id) >= 0)
        resultado.Add(new TreasureMenuEntry {
            Set = set,
            ObtainedCount = obtenidos,
            TotalCount = set.TreasureIds.Length,
            BonusGranted = TreasureSetProgressEvaluator.HasRewardsGranted(set.SetId, progress)   # 014, ya existente
        })
    return resultado
```

- **FR-006**: cada entrada expone el conteo exacto de tesoros obtenidos sobre el total, y si la bonificación pasiva ya fue otorgada — ambos ya calculables con la infraestructura de `014` sin lógica nueva de negocio.
- **FR-009**: un set sin ningún tesoro obtenido produce `ObtainedCount == 0`, `BonusGranted == false`, sin error (US3 Escenario 3).

## Invariante compartido (FR-007, SC-005)

Ninguna de las tres funciones recibe una referencia mutable a `PlayerProgressSaveData` con intención de escritura, ni llama a `IPlayerProgressStore.Save` — todas reciben el snapshot ya cargado por quien las invoca (la capa View, vía los controllers/catálogos ya existentes) y solo lo leen.
