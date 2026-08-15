# Feature Specification: Evolución de Gatos

**Feature Branch**: `010-evolucion-de-gatos`

**Created**: 2026-08-15

**Status**: Draft

**Input**: Adaptación a battle-cats-web de `the_battler_test/specs/009-unit-evolution` (proyecto Unity origen): cada gato puede evolucionar en etapas (Base, Segunda Forma, Forma Verdadera) al alcanzar ciertos niveles, la última requiere además un ítem de evolución, y la Forma Verdadera mejora significativamente sus estadísticas. Cada forma requiere su propia animación de idle/ataque (Constitución § III).

**Nota de adaptación**: depende de `specs/006-dashboard-base-jugador` (nivel/XP de gato ya persistidos en `ownedCats`) y reutiliza el mecanismo ya existente de `specs/003-identidad-visual-animada`: `getVisualProfile(cat)` deriva la identidad visual **de los stats**, no de arte por gato. Por eso, en vez de autorar animaciones nuevas por forma, esta spec logra el requisito de Constitución § III "gratis" con un cambio mínimo: `UnitSprite` deriva el perfil visual de los stats **efectivos** del `BattleUnit` en combate (ya incluyen el multiplicador de evolución), no de los stats base de `Cat` — una Forma Verdadera con el doble de HP ya produce automáticamente un cuerpo más grande/con más HP-derived height, sin tocar `src/game/animation.ts`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Evolucionar un gato a su Segunda Forma al alcanzar el nivel (Priority: P1)

Un jugador con un gato que alcanzó el nivel requerido lo evoluciona desde la Base (`specs/006-dashboard-base-jugador`), obteniendo de inmediato estadísticas distintas.

**Why this priority**: Comportamiento central — sin esto, la evolución no existe como mecánica.

**Independent Test**: Subir un gato al nivel requerido para Segunda Forma, evolucionarlo desde la Base y confirmar que sus stats de combate cambian de inmediato.

**Acceptance Scenarios**:

1. **Given** un gato alcanzó el nivel requerido para Segunda Forma, **When** el jugador elige evolucionarlo, **Then** pasa a Segunda Forma con sus estadísticas correspondientes.
2. **Given** un gato no alcanzó el nivel requerido, **When** el jugador intenta evolucionarlo, **Then** `useMetaStore.evolveCat` devuelve `false` y no cambia nada.

---

### User Story 2 - Evolucionar a Forma Verdadera requiere nivel e ítem (Priority: P2)

Un gato en Segunda Forma, con el nivel superior requerido y el ítem de evolución correspondiente, evoluciona a Forma Verdadera consumiendo el ítem.

**Why this priority**: Etapa final de progresión; depende de la Historia 1.

**Independent Test**: Con un gato en Segunda Forma que cumple nivel y con el ítem disponible, evolucionarlo y confirmar el consumo del ítem junto con el cambio de forma.

**Acceptance Scenarios**:

1. **Given** un gato en Segunda Forma cumple el nivel de Forma Verdadera y el jugador posee el ítem, **When** evoluciona, **Then** pasa a Forma Verdadera y el ítem se descuenta en 1.
2. **Given** el jugador no posee el ítem, **When** intenta evolucionar, **Then** el sistema lo bloquea sin descontar nada.
3. **Given** el gato no alcanzó el nivel pero el jugador sí tiene el ítem, **When** intenta evolucionar, **Then** el sistema lo bloquea sin descontar el ítem.

---

### User Story 3 - La Forma Verdadera mejora significativamente los stats (Priority: P2)

Un gato en Forma Verdadera muestra una mejora notable de `hp`/`damage` respecto a su Forma Base.

**Why this priority**: Da recompensa tangible a completar la progresión.

**Independent Test**: Comparar los stats efectivos de un `BattleUnit` en Forma Base contra el mismo gato en Forma Verdadera.

**Acceptance Scenarios**:

1. **Given** un gato evolucionó a Forma Verdadera, **When** se despliega en batalla, **Then** su `hp`/`damage` efectivos reflejan el multiplicador de esa forma (definido en `src/data/cats.ts`), no los stats base.

---

### User Story 4 - Cada forma se ve distinta en batalla (Priority: P3)

Un jugador distingue visualmente en qué forma está un gato desplegado, porque su cuerpo cambia con sus stats efectivos.

**Why this priority**: Requisito de identidad visual (Constitución § III); depende de que existan formas (Historias 1-2).

**Independent Test**: Desplegar el mismo gato en sus 3 formas (en sesiones de prueba distintas) y confirmar que `getVisualProfile` produce un `bodyHeight`/`accentColor` distinto por forma, vía los stats efectivos del `BattleUnit`.

**Acceptance Scenarios**:

1. **Given** un gato tiene una forma de evolución activa, **When** se despliega, **Then** `UnitSprite` deriva su perfil visual de los stats efectivos de esa forma (no de los stats base de `Cat`).

---

### Edge Cases

- Un gato con nivel muy superior al de Forma Verdadera pero todavía en Base: las evoluciones son secuenciales — no puede saltar directamente a Forma Verdadera sin pasar antes por Segunda Forma, aunque ya cumpla ambos niveles.
- Intento de evolución sin nivel suficiente: bloqueado, sin consumir ítem.
- Ítem disponible pero nivel insuficiente: bloqueado, ítem no se consume.
- Gatos existentes sin datos de evolución (`evolutions` no declarado en `Cat`): permanecen en Forma Base indefinidamente, sin romper su funcionamiento actual.
- Equipo activo (`specs/006-dashboard-base-jugador` § `TeamFormation`) al evolucionar un gato: el gato sigue en el equipo sin cambios; solo se actualizan sus stats efectivos.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `Cat` (`src/data/cats.ts`) DEBE permitir declarar opcionalmente `evolutions: { second: EvolutionFormData; true: EvolutionFormData }`, donde `EvolutionFormData = { requiredLevel: number; hpMultiplier: number; damageMultiplier: number; requiredItemCount?: number }` (`requiredItemCount` solo en `true`).
- **FR-002**: `useMetaStore.ownedCats[catId]` DEBE incluir `evolutionStage: 'Base' | 'Second' | 'True'` (por defecto `'Base'`).
- **FR-003**: `useMetaStore` DEBE mantener `evolutionItems: Record<string, number>` (cantidad de ítem de evolución por `catId`), persistido en una tabla Dexie nueva.
- **FR-004**: `useMetaStore.evolveCat(catId): boolean` DEBE evolucionar un gato una etapa a la vez (`Base → Second`, `Second → True`), verificando `ownedCats[catId].level >= requiredLevel` de la etapa siguiente y, para `True`, además `evolutionItems[catId] >= requiredItemCount`.
- **FR-005**: `evolveCat` NO DEBE permitir evolucionar si no se cumplen los requisitos de la etapa siguiente, y en ese caso NO DEBE consumir ítems ni cambiar `evolutionStage`.
- **FR-006**: Evolucionar a `True` DEBE descontar `requiredItemCount` de `evolutionItems[catId]`.
- **FR-007**: `evolveCat` NO DEBE permitir saltar etapas — evolucionar solo avanza a la etapa inmediatamente siguiente a la actual.
- **FR-008**: `useGameStore.deployUnit` DEBE leer `evolutionStage` desde `useMetaStore.ownedCats[catId]` y aplicar `hpMultiplier`/`damageMultiplier` de esa etapa (si `evolutionStage !== 'Base'`) al crear el `BattleUnit` — `hp`/`maxHp`/`damage` efectivos reflejan la evolución, no los stats base de `Cat`.
- **FR-009**: `src/game/UnitSprite.tsx` DEBE derivar `getVisualProfile` de los stats efectivos del `BattleUnit` (ya afectados por FR-008), no de un nuevo lookup de `Cat` por `catId` sin evolución aplicada.
- **FR-010**: `evolutionStage`/`evolutionItems` DEBEN persistir localmente (Dexie), igual que el resto del progreso de `specs/006-dashboard-base-jugador`.
- **FR-011**: Gatos sin `evolutions` declarado DEBEN permanecer en `'Base'` indefinidamente, sin romper su funcionamiento actual.

### Key Entities

- **`EvolutionFormData`**: ver FR-001.
- **`ownedCats[catId].evolutionStage`**: ver FR-002.
- **`evolutionItems`**: ver FR-003.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un gato que cumple el nivel de Segunda Forma evoluciona en una sola acción, reflejando de inmediato sus nuevos stats efectivos en el próximo despliegue.
- **SC-002**: Un intento de evolución sin nivel y/o ítem requerido es bloqueado el 100% de las veces, sin consumir el ítem.
- **SC-003**: Un gato en Forma Verdadera muestra `hp`/`damage` efectivos multiplicados según `src/data/cats.ts`, verificado en el 100% de las unidades de prueba evolucionadas.
- **SC-004**: `evolutionStage`/`evolutionItems` se mantienen intactos el 100% de las veces tras recargar la aplicación.
- **SC-005**: `getVisualProfile` produce un perfil distinto (al menos `bodyHeight` o `accentColor`) entre Forma Base y Forma Verdadera del mismo gato, verificado en al menos un gato de prueba con `evolutions` declarado.

## Assumptions

- Evolucionar es una acción manual y explícita desde la Base (`specs/006-dashboard-base-jugador`), no automática al subir de nivel — igual que el origen.
- El "ítem de evolución" se resuelve como un contador simple por gato (`evolutionItems[catId]`), sin sistema de inventario general ni tienda — su origen (recompensa de nivel, gacha futuro, etc.) queda fuera de esta spec; por defecto no hay ninguna forma de obtenerlo todavía dentro del alcance de esta spec (se añade en specs de contenido/gacha futuras).
- Las evoluciones son estrictamente secuenciales (`Base → Second → True`).
- El multiplicador exacto de stats por forma se define por gato en `src/data/cats.ts`; esta spec no exige una fórmula universal, solo que Forma Verdadera represente una mejora significativa.
- Ningún gato del catálogo actual (4) tiene `evolutions` declarado por defecto — esta spec entrega el mecanismo; autorar datos de evolución para gatos concretos es contenido de seguimiento, no bloqueante para cerrar esta spec.
