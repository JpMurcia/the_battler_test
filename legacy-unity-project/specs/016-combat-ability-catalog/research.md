# Research: Ampliación del Catálogo de Habilidades de Combate

## §1. ¿Dónde vive `magnitude` — campo nuevo en `TraitTargetingAbility`/`NeutralAbility`, o clase separada por efecto?

**Decisión**: campo `float m_Magnitude` añadido a las dos clases ya existentes, con default `0f`.

**Rationale**: `Weaken` y `Slow` necesitan una intensidad configurable (cuánto daño se reduce, cuánta velocidad se pierde) además de la duración que ya existe; `Freeze` y `Curse` no la necesitan (son efectos binarios: activo o no). Añadir un campo opcional que algunos efectos ignoran es exactamente el mismo criterio que el proyecto ya aplicó con `durationSeconds` en 008 (`AbilityEffectType` sin comportamiento runtime definido "no tiene uso observable" para ese campo) — no es una inconsistencia nueva, es continuar el patrón existente.

**Alternativas consideradas**:
- Una clase de habilidad separada por cada `AbilityEffectType` (`WeakenAbility`, `FreezeAbility`, `SlowAbility`, cada una con sus propios campos): rechazada — multiplica el número de arrays en `UnitDefinition` (uno por efecto, en vez de dos genéricos) y el número de bucles en `ApplyAbilitiesTo`, sin ganar nada que `magnitude` (ignorado cuando no aplica) no resuelva ya con menos superficie.
- Un `Dictionary<AbilityEffectType, float>` de parámetros por efecto dentro de `TraitTargetingAbility`: rechazada por el mismo motivo que 008 rechazó un diccionario runtime de efectos activos (research.md §6 de 008) — Unity serializa mal diccionarios genéricos sin una envoltura adicional, y aquí no hace falta ninguna generalidad extra: son, como mucho, dos parámetros conocidos (duración, magnitud).

## §2. "Fuerte Contra" — ¿reutilizar `TraitTargetingAbility` o una clase nueva?

**Decisión**: clase nueva `StrongAgainstModifier`, con su propio par `targetClassificationTypes`/`includedSpecialTypes` y el mismo algoritmo de coincidencia que `TraitTargetingAbility.MatchesTarget` (duplicado, no compartido por herencia/composición).

**Rationale**: `TraitTargetingAbility` está acoplada por diseño a `AbilityEffectType` + `durationSeconds` — un efecto que se *aplica* y *expira*. "Fuerte Contra" no es un efecto que se aplica sobre un objetivo: es una relación permanente entre la unidad y un rasgo, activa mientras dure el combate, con dos magnitudes numéricas (multiplicador de daño infligido, multiplicador de daño recibido) en vez de un `AbilityEffectType` + duración. Forzarlo dentro de `TraitTargetingAbility` (por ejemplo, con `durationSeconds == 0` como código para "permanente") mezclaría dos ciclos de vida distintos en una clase que 008 ya dejó testeada y estable — el mismo criterio de "no tocar un archivo ya probado sin necesidad real" documentado en `docs/plan-tecnico-manual-completo.md` §1.3.

**Alternativas consideradas**:
- Extraer una clase base/interfaz común `ClassificationTargetFilter` de la que ambas hereden el algoritmo de matching: evaluada y rechazada por ahora — hoy solo hay dos consumidores (`TraitTargetingAbility`, `StrongAgainstModifier`); extraer una abstracción compartida para dos casos es la generalización especulativa que el Principio VI pide evitar. Si aparece un tercer consumidor en una fase futura, se puede revisitar (documentado como nota, no como deuda bloqueante).
- Modelar Fuerte Contra como dos `TraitTargetingAbility` con un `AbilityEffectType.StrongAgainstDealt`/`StrongAgainstReceived` nuevo y `magnitude` como el multiplicador: rechazada — el "objetivo" de un `TraitTargetingAbility` es *a quién se le aplica un efecto tras dañarlo* (postcondición de `ApplyDamage`); Fuerte Contra necesita evaluarse *antes* de calcular el daño (para el multiplicador de daño infligido) y del lado del receptor (para el de daño recibido) — no encaja en el punto de inserción ya contractado por `unit-runtime-ability-behavior.md` de 008 (`ApplyAbilitiesTo`, invocado *después* de `ApplyDamage`).

## §3. "Resistente" — ¿generalizar `Immunity` o clase nueva?

**Decisión**: clase nueva `Resistance` (`effectType` + `reductionFactor` entre 0 y 1), independiente de `Immunity`.

**Rationale**: ver Complexity Tracking en plan.md — `Immunity.Blocks(effectType) => bool` es un contrato binario ya testeado; introducir un factor de reducción ahí cambiaría su semántica pública. US5 Escenario 2 de spec.md además exige explícitamente que una unidad pueda declarar Resistencia e Inmunidad como capacidades independientes y coexistentes, lo cual es más simple de expresar con dos colecciones separadas (`m_Immunities`, `m_Resistances`) que con una sola donde cada entrada decide si es "binaria" o "parcial" según un campo adicional.

**Orden de aplicación dentro de `ApplyEffect`** (ver contracts/ability-effect-catalog.md): primero se consulta `IsImmuneTo` (008, sin cambios — bloqueo total, no llega a evaluarse duración); si no hay inmunidad, se busca una `Resistance` que declare el mismo `effectType` y se reduce `durationSeconds` por su `reductionFactor` antes de aplicar el efecto. Si la duración resultante es `<= 0`, el efecto se trata como no aplicado (mismo resultado observable que una inmunidad, cubre el Edge Case de spec.md sobre resistencia total por acumulación de reducción).

## §4. ¿Por qué no un sistema de modificadores/efectos genérico de propósito abierto?

**Decisión**: no se construye ninguna capa de "resolución de combate" ni de scripting de efectos genérico; cada uno de los 5 efectos se implementa como el mínimo necesario, siguiendo el mismo criterio que 008 aplicó (research.md §§3-6 de 008).

**Rationale**: la constitución (Principio VI) exige justificar explícitamente cualquier complejidad fuera de la vertical slice — no asumir que "más genérico" es gratis. El manual técnico de referencia documenta más de 40 variantes de habilidad en total (ver `docs/plan-tecnico-manual-completo.md` §1.2); construir un framework genérico ahora, para cubrir efectos que ni siquiera están priorizados en esta feature, sería la generalización especulativa que el propio proyecto ya rechazó una vez en 008. Cada efecto futuro (Golpe Letal, Zombie Killer, Deformación/Warp, etc., fuera de alcance de esta spec) puede seguir añadiéndose con el mismo patrón aditivo: nuevo miembro de enum +, si necesita datos propios, una clase `[Serializable]` nueva — sin tocar lo ya construido.

## §5. Congelar + Ralentizar simultáneos — ¿necesita una regla de precedencia explícita?

**Decisión**: no. Se resuelve por construcción del orden de evaluación en `Update()`, sin código de precedencia dedicado.

**Rationale**: `Freeze` se implementa como un guard temprano en `Update()` — mientras `IsFrozen` es verdadero, el método retorna antes de llegar al bloque de adquisición de objetivo/`Move()`/`Attack()` (mismo lugar donde hoy se decide `hasTarget`). Como `Slow` solo tiene efecto observable *dentro* de `Move()` (reduce la velocidad con la que avanza `m_LanePosition`), si `Move()` nunca se ejecuta porque la unidad está congelada, `Slow` simplemente no tiene nada que modificar ese frame — no compiten por prioridad, uno de los dos deja de ser relevante mecánicamente. Esto cubre el Edge Case/US3 Escenario 2 de spec.md sin una tabla de precedencia ni un campo de prioridad adicional.

**Alternativa considerada**: un campo explícito de prioridad por `AbilityEffectType`, consultado antes de decidir qué efecto "gana": rechazada por innecesaria — el orden de evaluación ya existente en `Update()` (guard de Freeze antes que cualquier lógica de movimiento) produce el resultado correcto sin dato adicional que mantener sincronizado.

## §7. Addendum post-`/speckit.analyze` — `magnitude` como tercer parámetro de `IEffectReceiver.ApplyEffect`, no como llamada separada

**Contexto**: el diseño original de §1 (más el contrato inicial de `contracts/ability-effect-catalog.md`) proponía un método `ApplyMagnitudeIfApplicable`, separado de `IEffectReceiver.ApplyEffect` para no tocar esa interfaz (008). `/speckit.analyze` encontró un bug real en ese diseño (hallazgo F1): como `ApplyMagnitudeIfApplicable` se invocaba *antes* que `ApplyEffect` evaluara `IsImmuneTo`/`ReduceByResistance`, una reaplicación de Debilitar/Ralentizar bloqueada por inmunidad o resistencia-a-cero igual sobrescribía `m_WeakenMagnitude`/`m_SlowMagnitude` de un efecto ya activo y legítimo, aunque su duración no se tocara — violando el propio Edge Case de esta spec ("el efecto se trata como si no se hubiera aplicado").

**Decisión revisada**: `IEffectReceiver.ApplyEffect` gana un tercer parámetro `float magnitude = 0f` (valor por defecto), en vez de un método paralelo:

```csharp
public interface IEffectReceiver
{
    ClassificationType ClassificationType { get; }
    SpecialClassificationType SpecialClassificationType { get; }
    bool IsImmuneTo(AbilityEffectType effectType);
    void ApplyEffect(AbilityEffectType effectType, float durationSeconds, float magnitude = 0f);
}
```

`ApplyAbilitiesTo` pasa a hacer una sola llamada — `receiver.ApplyEffect(ability.EffectType, ability.DurationSeconds, ability.Magnitude);` — en vez de dos. Dentro de `ApplyEffect`, la escritura de `m_WeakenMagnitude`/`m_SlowMagnitude` ahora ocurre en la misma rama del `switch` que ya escribe la duración correspondiente, **después** de los guards de inmunidad/resistencia — por construcción, ambos valores quedan sincronizados y protegidos por el mismo guard, eliminando la clase entera de bug que F1 encontró.

**Por qué se acepta ahora tocar `IEffectReceiver` (008), pese al criterio original de §1/plan.md Complexity Tracking de "no tocarla"**: el parámetro nuevo tiene valor por defecto `0f` — ningún call site existente (solo hay uno, `ApplyAbilitiesTo`) se rompe, y no hay otro implementador de `IEffectReceiver` además de `UnitRuntime` hoy (008). Es el mismo criterio de "extensión aditiva, sin migración" que el proyecto ya aplica a enums (miembro nuevo al final) — aquí aplicado a un parámetro de método con default, no a un miembro de enum. La alternativa (mantener dos llamadas separadas) es la que producía el bug real; una interfaz "sin tocar" que permite un bug de corrupción de estado no es preferible a una interfaz con una extensión aditiva mínima que lo elimina por diseño.

**Impacto en Complexity Tracking (plan.md)**: se actualiza la entrada correspondiente para reflejar esta decisión — ver plan.md.

## §6. Estabilidad de valores de enum (obligatorio, mismo criterio que 007/008)

`AbilityEffectType` pasa de `{ Curse }` a `{ Curse, Weaken, Freeze, Slow }`. `Curse` permanece en valor `0` — ninguna `TraitTargetingAbility`/`NeutralAbility`/`Immunity` ya serializada por 008 cambia de significado. Los tres miembros nuevos se añaden al final, sin valor `None`/`0` adicional (mismo criterio que 008 documentó para este enum: no se usa como campo "opcional que puede estar ausente" — toda habilidad ya autorada declara explícitamente a qué efecto se refiere).
