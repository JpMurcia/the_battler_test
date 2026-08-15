# Contract: TraitTargetingAbility.MatchesTarget — algoritmo de coincidencia

Capa: `TheBattler.Model`. Este documento no describe una interfaz nueva — describe el contrato de comportamiento exacto que `TraitTargetingAbility.MatchesTarget(...)` (`Assets/Scripts/Model/Battler/TraitTargetingAbility.cs`) debe cumplir. Es el algoritmo central de esta feature (FR-003, FR-004, FR-005, SC-001, SC-003) — la razón de ser de los tipos especiales dentro de la clasificación (Historia 4 de spec.md).

## Firma

```csharp
public bool MatchesTarget(ClassificationType targetClassification, SpecialClassificationType targetSpecialType);
```

Invocada por `UnitRuntime.ApplyAbilitiesTo(...)` (ver [unit-runtime-ability-behavior.md](./unit-runtime-ability-behavior.md)) con `targetClassification = target.ClassificationType` y `targetSpecialType = target.SpecialClassificationType`, donde `target` es un `IEffectReceiver`.

## Algoritmo

```csharp
public bool MatchesTarget(ClassificationType targetClassification, SpecialClassificationType targetSpecialType)
{
    if (targetSpecialType != SpecialClassificationType.None)
    {
        // El objetivo declara un tipo especial (incluido Typeless — ver data-model.md,
        // None != Typeless): solo coincide si esta habilidad lo incluye explícitamente.
        // El contenido de m_TargetClassificationTypes se IGNORA por completo aquí (FR-004).
        return Contains(m_IncludedSpecialTypes, targetSpecialType);
    }

    // El objetivo no declara tipo especial (SpecialClassificationType.None):
    // coincide según la lista de tipos estándar de esta habilidad (FR-003).
    // m_IncludedSpecialTypes se IGNORA por completo aquí.
    return Contains(m_TargetClassificationTypes, targetClassification);
}
```

(`Contains` es una búsqueda lineal simple sobre el array, p. ej. `System.Array.IndexOf(array, value) >= 0`, con guard `array != null`.)

## Tabla de verdad (cobertura completa de FR-003/FR-004)

| `targetSpecialType` del objetivo | ¿Está en `m_IncludedSpecialTypes`? | ¿`targetClassification` está en `m_TargetClassificationTypes`? | Resultado | FR/Escenario cubierto |
|---|---|---|---|---|
| `None` | (no aplica) | Sí | `true` | FR-003 — sin tipo especial, alcanzable por "contra todos"/lista estándar. |
| `None` | (no aplica) | No | `false` | Habilidad de trait-targeting específica (p. ej. "solo Flotante") no coincide con un objetivo de otro tipo estándar — US2 Escenario 2. |
| ≠ `None` (p. ej. `Metal`) | No | Sí (irrelevante) | `false` | **FR-004, US4 Escenario 1** — objetivo con tipo especial, habilidad "contra todos los tipos estándar" (`m_TargetClassificationTypes` con los 8 valores) pero sin inclusión explícita de `Metal` → no se alcanza, sin importar que la lista estándar esté completa. |
| ≠ `None` (p. ej. `Metal`) | Sí | Sí/No (irrelevante) | `true` | **FR-004, US4 Escenario 2** — la misma habilidad, con `Metal` añadido a `m_IncludedSpecialTypes`, sí alcanza a ese objetivo. |

La cuarta fila es, literalmente, la validación de SC-003 ("un enemigo con tipo especial no recibe el efecto de una habilidad 'contra todos' el 100% de las veces, salvo que esa habilidad lo incluya explícitamente, en cuyo caso lo recibe el 100% de las veces") expresada como un único caso determinista, no probabilístico — el algoritmo no tiene ninguna rama de aleatoriedad ni de estado mutable entre llamadas.

## Invariantes

- La función es pura: sin efectos secundarios, sin lectura de `Time`/`UnityEngine.Random`/estado externo. Dos llamadas con los mismos argumentos devuelven siempre el mismo resultado.
- `m_TargetClassificationTypes` y `m_IncludedSpecialTypes` nunca se consultan ambos en la misma evaluación — son mutuamente excluyentes según `targetSpecialType` (ver algoritmo arriba). Esto es intencional: evita que una habilidad "contra todos los tipos estándar" alcance accidentalmente un tipo especial por una coincidencia cruzada entre ambas listas.
- Un array `null` (campo nunca autorado en el Inspector) se trata como lista vacía — `Contains` devuelve `false`, nunca lanza `NullReferenceException`.

## Doble de test

`TraitTargetingAbilityMatchingTests` (EditMode, sin motor/escena): instancia `TraitTargetingAbility` directamente (clase `[Serializable]` plana, no requiere `ScriptableObject.CreateInstance`) y verifica las 4 filas de la tabla de verdad, más: `m_IncludedSpecialTypes` vacío + objetivo con tipo especial → `false`; `m_TargetClassificationTypes` con un único valor (no los 8) + objetivo sin tipo especial de ese mismo valor → `true`; de otro valor → `false`.
