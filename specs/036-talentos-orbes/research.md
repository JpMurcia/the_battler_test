# Research: Talentos y Orbes

## Decisión 1: Ubicación de la UI — sección dentro de `UnitDetailPanel`, no un panel nuevo del Hub

**Decisión**: Talentos se implementa como una sección adicional dentro de `UnitDetailPanel.tsx` (`src/screens/shared/UnitDetailPanel.tsx`), visible solo si el gato mostrado es elegible — no como un nuevo `PanelId` en el dock del Hub.

**Rationale**: A diferencia de Misiones/Gamatoto/Ototo Corps (specs/033-035), que son sistemas globales de cuenta con su propio panel, Talentos es una propiedad *por gato individual*. El punto de entrada natural ya existe: `UnitDetailPanel` ya muestra stats, forma de evolución y el botón de evolucionar para un `catId` específico, y ya es compartido entre `TeamScreen` y `LibraryPanel`/`CatGuideScreen` (specs/030). Añadir un panel nuevo del Hub obligaría al jugador a elegir el gato dos veces (una para verlo, otra para asignarle talentos) sin ningún beneficio.

**Alternativas consideradas**:
- Nuevo panel `Talentos` en el dock del Hub con selector de gato propio: rechazado — duplica selección de gato ya resuelta por `UnitDetailPanel`, y estos paneles de dock (Misiones/Gamatoto/Ototo) son para sistemas de cuenta, no por-unidad.
- Pantalla dedicada de pantalla completa: rechazado por la misma razón que specs/026 ya estableció paneles superpuestos como el patrón por defecto.

## Decisión 2: Modelo de datos — `talents` opcional en `OwnedCatRow`, sin tabla Dexie nueva

**Decisión**: `CatTalents` se persiste como campo opcional dentro de la fila existente de `db.ownedCats` (tabla `ownedCats`, clave `catId`) y dentro de `OwnedCatMeta` en `useMetaStore`. No se crea una tabla Dexie nueva ni se incrementa la versión del esquema.

**Rationale**: El estado de talentos es 1:1 con un gato poseído, exactamente como `evolutionStage` y `plusLevel` ya lo son — añadir un campo opcional a una fila existente no requiere bump de versión en Dexie (solo cambios de índice/keyPath lo requieren), y una fila vieja sin el campo se lee como "sin talentos invertidos" sin necesidad de migración, mismo patrón documentado en los comentarios de `evolutionStage`/`plusLevel` (`src/db/index.ts`).

**Alternativas consideradas**:
- Tabla Dexie nueva `catTalents` (clave `catId`): rechazada — introduce una segunda fuente de verdad para datos que ya viven 1:1 con `ownedCats`, sin ningún beneficio (a diferencia de `gachaStorage`, que sí necesita ser una tabla separada por tener múltiples filas por `catId`).

## Decisión 3: Orden de las 3 pistas de efecto — cada una usa el mecanismo ya validado por specs previas

**Decisión**:
- **Resistencia a Debuff** → entrada `resistantTo: { effect, durationMultiplier }` antepuesta (`prepend`, no `push`) al array `resistantTo` del `BattleUnit`, igual que `specs/035-ototo-corps` (research.md Decisión 3 de esa spec).
- **Aumento de Estadísticas** → multiplicador adicional aplicado directamente sobre `effectiveStats.hp`/`effectiveStats.damage` en `deployUnit()`, *después* de `getEffectiveCatStats()` (que ya aplica el multiplicador de forma de evolución) — no se modifica `getEffectiveCatStats` porque esa función toma un `Cat` genérico + `EvolutionStage`, sin conocimiento de datos por-gato-poseído (igual que `plusLevel` tampoco pasa por ahí).
- **Orbe** → nueva entrada `Ability` de tipo `TraitTargeting` antepuesta (`prepend`, no `push`) al array `abilities` del `BattleUnit`, mismo patrón que la Decisión 3 de `specs/035`.

**Rationale**: `src/engine/combat.ts::resolveAbilityMultiplier` recorre `attacker.abilities` en orden y devuelve el multiplicador de la **primera** `Ability` que coincida (`Neutral` coincide siempre; `TraitTargeting` coincide si el rasgo del defensor está en `targetClassifications`) — ver líneas 10-28. Si el Orbe se añadiera al final del array (`push`), un gato cuya primera habilidad ya sea `Neutral` o `TraitTargeting` de otro rasgo nunca llegaría a evaluar el Orbe. Anteponerlo garantiza que el bono del Orbe se evalúe primero; si no coincide con el rasgo del defensor, el bucle continúa con las habilidades propias del gato sin cambio de comportamiento — exactamente la misma garantía que ya validó `specs/035` para `TraitResistance`.

**Alternativas consideradas**:
- Sumar/fusionar el multiplicador del Orbe con el de una `TraitTargeting` propia coincidente: rechazado — mismo criterio de "no fusión especial" que `specs/035` ya documentó para evitar complejidad no solicitada; el orden de inserción decide, consistente con cómo ya se resuelve el resto del array.
- Aplicar el Aumento de Estadísticas como un nuevo campo en `Cat`/`EvolutionFormData`: rechazado — esos son datos de catálogo (`src/data/cats.ts`, compartidos por todos los jugadores), mientras que el bono de Talentos es específico del progreso de un jugador con un gato poseído concreto; mezclar ambos violaría la separación catálogo/progreso ya usada en el resto del proyecto (`Cat` vs `OwnedCatMeta`).

## Decisión 4: Costo creciente por punto — fórmula lineal simple, mismo criterio que specs anteriores

**Decisión**: `costo(puntosActuales) = TALENT_POINT_BASE_COST * (puntosActuales + 1)`, con `TALENT_POINT_BASE_COST = 100` NP y un máximo de 5 puntos por pista/contador. La Resistencia a Debuff usa `durationMultiplier = max(0.5, 1 - puntos * 0.1)`; el Aumento de Estadísticas usa `multiplicador = 1 + puntos * 0.02` por contador; el Orbe usa `damageMultiplier = 1 + puntos * 0.04`.

**Rationale**: Mismo criterio de simplicidad que `getBaseUpgradeCost` (`specs/031`) — una fórmula lineal legible en vez de una curva exponencial que requeriría justificación de balance adicional no solicitada por la spec. Los topes (0.5 mínimo de duración, +10%/+20% máximo) evitan que un valor extremo de puntos rompa el balance de una unidad sin necesitar un techo distinto por pista.

**Alternativas consideradas**: costo exponencial o tabla de costos por punto explícita — rechazadas por añadir superficie de balance no pedida por la spec; puede ajustarse en una spec de balance futura sin cambiar la arquitectura aquí definida.

## Decisión 5: Validación de elegibilidad en el store, no solo en la UI

**Decisión**: Las 3 acciones de inversión (`investDebuffResistanceTalent`, `investStatBoostTalent`, `investOrbTalent`) en `useMetaStore` validan internamente que el gato exista, que su `evolutionStage` sea `'True'` y que su `rarity` esté en `['Megarraro', 'Legendario']`, devolviendo `false` sin mutar estado si no se cumple — no se confía únicamente en que la UI oculte el botón.

**Rationale**: Mismo patrón defensivo que `evolveCat()` (que valida `target` antes de mutar) y `startOtotoConstruction()` (que valida materiales antes de descontar) — las acciones del store son la única fuente de verdad de las reglas de negocio, la UI solo refleja su resultado.
