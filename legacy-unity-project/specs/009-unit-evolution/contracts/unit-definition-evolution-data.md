# Contract: UnitDefinition — datos de evolución (`TryGetStageData` / `GetEffectiveCombatProfile`)

Capa: `TheBattler.Model`. Este documento no describe una interfaz nueva — describe el contrato de comportamiento exacto que los dos métodos nuevos de `UnitDefinition` (`Assets/Scripts/Model/Battler/UnitDefinition.cs`) deben cumplir. Es el punto donde se resuelve, para una forma de evolución dada, qué animaciones/variante/stats están efectivamente en vigor (FR-008, FR-009, FR-011, FR-012, FR-013).

## Firmas

```csharp
public bool TryGetStageData(UnitEvolutionStage stage, out UnitEvolutionStageData data);

public UnitCombatProfile GetEffectiveCombatProfile(UnitEvolutionStage stage);
```

## `TryGetStageData(UnitEvolutionStage stage, out UnitEvolutionStageData data)`

- **Precondición**: ninguna — `stage` puede ser cualquier valor del enum, incluido uno fuera del rango declarado si llegara corrupto desde otra capa (ver `UnitEvolutionStageResolver`, que ya garantiza un valor válido antes de llegar aquí, pero este método no depende de esa garantía).
- **Comportamiento**:
  1. Si `stage == UnitEvolutionStage.FormaBase` → devuelve `false`, `data = default`. La Forma Base **nunca** tiene una `UnitEvolutionStageData` propia — está representada por los campos base ya existentes de `UnitDefinition` (`IdleAnimation`, `AttackAnimation`, `VisualVariant`, `Damage`, `MaxHealth`).
  2. Si `stage == UnitEvolutionStage.SegundaForma` → devuelve `true`/`data = m_EvolutionStages[0]` solo si `m_EvolutionStages.Length >= 1`; si no, `false`/`data = default`.
  3. Si `stage == UnitEvolutionStage.FormaVerdadera` → devuelve `true`/`data = m_EvolutionStages[1]` solo si `m_EvolutionStages.Length >= 2`; si no, `false`/`data = default`.
  4. Cualquier otro valor de `stage` (fuera del rango del enum) → devuelve `false`, `data = default` (mismo criterio de "dato ausente = fallback", nunca lanza).
- **Postcondición**: función pura, sin efectos secundarios. `false` significa siempre "usa los campos base de Forma Base para esta forma" — nunca significa "esta unidad no puede desplegarse" ni ningún otro estado de error.

## `GetEffectiveCombatProfile(UnitEvolutionStage stage)`

```csharp
public UnitCombatProfile GetEffectiveCombatProfile(UnitEvolutionStage stage)
{
    if (TryGetStageData(stage, out var data))
    {
        return new UnitCombatProfile(
            data.IdleAnimation,
            data.AttackAnimation,
            data.VisualVariant,
            data.Damage,
            data.MaxHealth);
    }

    // Fallback completo a los campos base de Forma Base (FR-011, FR-013):
    // nunca se mezclan campos de dos formas distintas en el mismo perfil.
    return new UnitCombatProfile(
        IdleAnimation,
        AttackAnimation,
        VisualVariant,
        Damage,
        MaxHealth);
}
```

- **Precondición**: ninguna (mismas garantías que `TryGetStageData`).
- **Comportamiento**: delega en `TryGetStageData(stage, out data)`. Si devuelve `true`, construye el `UnitCombatProfile` íntegramente a partir de esa `UnitEvolutionStageData` (los 5 campos, todos de la misma forma). Si devuelve `false` — por ser `FormaBase`, por no tener datos autorados para la forma vigente (FR-011), o por un valor de `stage` fuera de rango (FR-013) — construye el `UnitCombatProfile` íntegramente a partir de los campos base ya existentes de esta misma `UnitDefinition`.
- **Postcondición**: función pura. **Nunca** devuelve un `UnitCombatProfile` con campos mezclados de dos formas distintas (p. ej. `IdleAnimation` de Forma Verdadera pero `Damage` de Forma Base) — es una decisión binaria de todo-o-nada por llamada, no un fallback campo por campo. Se resuelve una única vez por unidad, dentro de `UnitRuntime.Initialize` (al desplegarse) — no se invoca por frame (research.md §5, mismo criterio de "sin asignaciones nuevas por ciclo de Update/Attack" que 008 documentó para `ApplyAbilitiesTo`).

## Tabla de comportamiento (cobertura completa de FR-011/FR-013)

| `stage` | `m_EvolutionStages.Length` | `TryGetStageData` | `GetEffectiveCombatProfile` usa | FR/Escenario cubierto |
|---|---|---|---|---|
| `FormaBase` | (cualquiera) | `false` | Campos base de `UnitDefinition` | Caso normal — la unidad no ha evolucionado. |
| `SegundaForma` | `>= 1` | `true` (`m_EvolutionStages[0]`) | `UnitEvolutionStageData` de Segunda Forma | FR-012, Historia 1 — unidad evolucionada muestra su forma. |
| `SegundaForma` | `0` | `false` | Campos base de `UnitDefinition` | **FR-011** — unidad de 001 sin datos de evolución autorados, persistida (erróneamente o no) en `SegundaForma`; se comporta como Forma Base sin romperse. |
| `FormaVerdadera` | `>= 2` | `true` (`m_EvolutionStages[1]`) | `UnitEvolutionStageData` de Forma Verdadera | FR-012, Historia 2/3 — mejora significativa de stats visible en batalla. |
| `FormaVerdadera` | `0` o `1` | `false` | Campos base de `UnitDefinition` | **FR-011** — mismo criterio que la fila anterior, aplicado a Forma Verdadera sin datos autorados. |
| Valor fuera de rango del enum | (cualquiera) | `false` | Campos base de `UnitDefinition` | **FR-013** — dato corrupto tratado como Forma Base, sin bloquear batalla ni dashboard. |

## Doble de test

`UnitDefinitionEffectiveCombatProfileTests` (EditMode, sin motor): `ScriptableObject.CreateInstance<UnitDefinition>()` + reflexión sobre `m_EvolutionStages`/campos base (mismo mecanismo que `UnitDefinitionClassificationDefaultsTests`, 008) para sembrar 0, 1 y 2 entradas y verificar cada fila de la tabla anterior, incluida la ausencia total de mezcla de campos entre formas.
