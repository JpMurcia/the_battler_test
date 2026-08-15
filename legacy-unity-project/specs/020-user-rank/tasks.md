---

description: "Task list template for feature implementation"
---

# Tasks: Sistema de Rango de Usuario

**Input**: Design documents from `/specs/020-user-rank/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/user-rank-claim.md](./contracts/user-rank-claim.md), [quickstart.md](./quickstart.md)

**Tests**: Incluidos — mismo patrón de verificación real (EditMode) ya establecido en 001-019.

**Organization**: Tareas agrupadas por historia de usuario (US1-US2, según spec.md).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: Historia de usuario a la que pertenece la tarea
- Cada tarea incluye la ruta exacta del archivo

## Path Conventions

Proyecto único de Unity — capas `Assets/Scripts/{Model,Gameplay,View}/Battler/`, herramientas de contenido en `Assets/Editor/Battler/`, tests en `Assets/Tests/EditMode/Battler/`, según [plan.md § Project Structure](./plan.md#project-structure).

---

## Phase 1: Setup

**Purpose**: Confirmar línea base antes de tocar código.

- [X] T001 Correr la suite EditMode + PlayMode existente (001-019) en modo batch de Unity sobre `C:\Users\Usuario\Documents\GitHub\IA GAME\the_battler_test` y confirmar que sigue en verde antes de empezar, como línea base de referencia. (257 EditMode + 133 PlayMode, 0 fallos — confirmado inmediatamente tras el commit de `019-library-screens`)

**Checkpoint**: Línea base verde confirmada antes de tocar código.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Los tipos de datos de umbrales y el registro de reclamos, compartidos por ambas historias de usuario.

**⚠️ CRITICAL**: Ninguna tarea de Fase 3+ puede empezar hasta completar esta fase.

- [X] T002 [P] Crear `UserRankThreshold` (clase `[Serializable]` plana: `m_ThresholdId`, `m_RequiredRank`, `m_Reward: BattleItemDefinition`, `m_RewardCount`; `IsValid`) en `Assets/Scripts/Model/Battler/UserRankThreshold.cs`, según [data-model.md § UserRankThreshold](./data-model.md#userrankthreshold-nuevo-serializable-plano-assetsscriptsmodelbattleruserrankthresholdcs)
- [X] T003 Crear `UserRankRewardCatalog` (`ScriptableObject`: `m_Thresholds: UserRankThreshold[]`) en `Assets/Scripts/Model/Battler/UserRankRewardCatalog.cs`, mismo patrón que `TreasureSetCatalog` — depende de T002
- [X] T004 [P] Añadir `claimedThresholdIds: string[]` (default vacío) a `Assets/Scripts/Model/Battler/PlayerProgressSaveData.cs`, sin bump de `formatVersion`

**Checkpoint**: Tipos de datos listos — las 2 historias de usuario pueden empezar.

---

## Phase 3: User Story 1 - Ver el Rango de Usuario actual (Priority: P1) 🎯 MVP

**Goal**: El jugador ve su Rango de Usuario (reutilizando el cálculo ya existente de `005`) y la lista de umbrales con su estado, desde la Base del Jugador.

**Independent Test**: Entrar a la Base del Jugador y confirmar que el Rango de Usuario mostrado coincide con la suma de los niveles de todas las unidades poseídas (spec.md US1).

### Tests for User Story 1 ⚠️

- [X] T005 [P] [US1] EditMode test en `Assets/Tests/EditMode/Battler/UserRankControllerTests.cs` (archivo nuevo): `CurrentRank` coincide exactamente con `PlayerCharacterLevelCalculator.Calculate` sobre el mismo `unitProgress`/`ownedUnits` (FR-001); `Thresholds` refleja `Reached`/`Claimed` correctos para una combinación de umbrales alcanzados/no alcanzados; `m_Catalog == null` ⇒ `Thresholds` vacío sin error (FR-010) — este archivo se extiende en T010 (US2) — depende de T002, T003, T004

### Implementation for User Story 1

- [X] T006 [US1] Crear `UserRankController` (clase plana, no `MonoBehaviour`: constructor `(IPlayerProgressStore, UserRankRewardCatalog, IReadOnlyList<UnitDefinition>)`, propiedad `CurrentRank` delegando en `PlayerCharacterLevelCalculator.Calculate`, propiedad `Thresholds: IReadOnlyList<UserRankThresholdStatus>`) en `Assets/Scripts/Gameplay/Battler/UserRankController.cs`, según [contracts/user-rank-claim.md § CurrentRank/Thresholds](./contracts/user-rank-claim.md) (hace pasar T005) — depende de T002, T003, T004
- [X] T007 [P] [US1] Extender `Assets/Scripts/Gameplay/Battler/PlayerBaseFlowController.cs`: añadir el campo opcional `m_UserRankCatalog` (`[SerializeField]`) y la propiedad `UserRank`, instanciada en `Awake()` junto a `Leveling`/`TeamFormation`/`Evolution` — depende de T006
- [X] T008 [P] [US1] Crear `UserRankUIController` (componente View: muestra `CurrentRank` y la lista de `Thresholds` con su estado `Reached`/`Claimed`, sin botón de reclamo todavía) en `Assets/Scripts/View/Battler/UserRankUIController.cs`, mismo patrón de solo-renderizado que `TeamFormationUIController` — depende de T007
- [X] T009 [US1] Extender `Assets/Editor/Battler/PlayerBaseContentBuilder.cs`: crear un `UserRankRewardCatalog` de ejemplo con umbrales iniciales (`Assets/ScriptableObjects/Battler/UserRankRewardCatalog.asset`), instanciar el template de `UserRankUIController` en `PlayerBase.unity` y cablearlo — depende de T008

**Checkpoint**: US1 completa y verificable de forma independiente — el Rango de Usuario y sus umbrales son visibles.

---

## Phase 4: User Story 2 - Reclamar la recompensa de un umbral alcanzado (Priority: P1) 🎯 MVP

**Goal**: El jugador reclama manualmente la recompensa de objetos de batalla de un umbral ya alcanzado.

**Independent Test**: Con el Rango de Usuario ya por encima de un umbral sin reclamar, reclamarlo y confirmar que la recompensa se añade al inventario (spec.md US2).

### Tests for User Story 2 ⚠️

- [X] T010 [US2] Extender `Assets/Tests/EditMode/Battler/UserRankControllerTests.cs` (mismo archivo que T005, secuencial): `TryClaim` rechaza un umbral no alcanzado (FR-005) y uno ya reclamado (FR-006), sin ninguna escritura en esos casos; rechaza un `thresholdId` desconocido sin lanzar; un reclamo válido añade exactamente `RewardCount` unidades de `Reward.ItemId` a `battleItemInventory`, marca el umbral en `claimedThresholdIds` de forma permanente (FR-007), y persiste (`IPlayerProgressStore.Save`); reclamar dos umbrales en orden inverso (mayor primero) funciona igual (FR-008) — depende de T006

### Implementation for User Story 2

- [X] T011 [US2] Extender `Assets/Scripts/Gameplay/Battler/UserRankController.cs` (mismo archivo que T006, secuencial): implementar `TryClaim(string thresholdId) : bool` según [contracts/user-rank-claim.md § TryClaim](./contracts/user-rank-claim.md) (hace pasar T010) — depende de T006
- [X] T012 [US2] Extender `Assets/Scripts/View/Battler/UserRankUIController.cs` (mismo archivo que T008, secuencial): añadir un botón "Reclamar" por umbral con `Reached == true` y `Claimed == false`, invocando `UserRankController.TryClaim` — depende de T011

**Checkpoint**: Las 2 historias de usuario quedan completas e independientemente funcionales — el ciclo completo (ver rango → reclamar recompensa) es jugable de punta a punta.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T013 [P] Revisar que la implementación final no se haya desviado de [contracts/user-rank-claim.md](./contracts/user-rank-claim.md) / [data-model.md](./data-model.md); actualizar esos documentos si hubo un cambio deliberado durante la implementación. Sin desviaciones — `PlayerBaseFlowController.UserRank` se instancia con `m_ChapterDefinition.AvailableUnits` (el mismo `ownedUnits` que `Leveling`), no con la propiedad `OwnedUnits` (que incluye unidades bonus), para que `CurrentRank` coincida bit a bit con `CharacterLevel` ya mostrado por el dashboard — consistente con FR-001 ("sin introducir un segundo cálculo") y con research.md §1, aunque el contrato no explicitó ese detalle de construcción.
- [X] T014 Correr la suite completa EditMode + PlayMode (001-020) en modo batch de Unity y confirmar 0 errores/0 warnings de compilación y 100% de tests en verde. **Resultado**: 265 EditMode (257 heredados + 8 nuevos) y 133 PlayMode (heredados, sin cambios — esta feature no introduce comportamiento de batalla) — 100% en verde, 0 fallos. Adicionalmente se corrió `PlayerBaseContentBuilder.Build`/`ValidateScene` en modo batch: escena generada y validada sin referencias nulas ni datos faltantes.
- [ ] T015 Ejecutar los 8 pasos de validación manual de [quickstart.md](./quickstart.md) contra `PlayerBase.unity` — **probablemente requiera el Editor con GUI**, mismo criterio documentado para pasos equivalentes en specs anteriores

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Fase 1)**: sin dependencias
- **Foundational (Fase 2)**: depende de Setup — bloquea las 2 historias de usuario
- **US1 (Fase 3)**: depende de Foundational
- **US2 (Fase 4)**: depende de Foundational en su lógica de datos; en la práctica se implementa después de US1 porque `TryClaim` (T011) extiende el mismo `UserRankController.cs` que T006 (US1) ya creó, y su UI (T012) extiende el mismo `UserRankUIController.cs` que T008 (US1) ya creó
- **Polish (Fase 5)**: depende de que las 2 historias estén completas

### User Story Dependencies

- **US1 (P1)**: tras Foundational — sin dependencia de otras historias; entrega visibilidad del rango y los umbrales, aunque todavía sin poder reclamar
- **US2 (P1)**: tras Foundational — conceptualmente independiente de US1 (`TryClaim` no depende de cómo se muestra `CurrentRank`/`Thresholds`), pero comparte archivo con T006/T008 (research.md §3: es la misma clase atómica, no una abstracción separada)

### Parallel Opportunities

- T002, T004 (Fase 2) son independientes entre sí — archivos distintos
- T007, T008 (US1) son independientes entre sí una vez completado T006 — archivos distintos

---

## Parallel Example: Foundational (Fase 2)

```bash
# Lanzar juntos los tipos de datos independientes entre si (archivos distintos):
Task: "Crear UserRankThreshold en Assets/Scripts/Model/Battler/UserRankThreshold.cs"
Task: "Añadir claimedThresholdIds a Assets/Scripts/Model/Battler/PlayerProgressSaveData.cs"
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 2)

1. Completar Fase 1: Setup
2. Completar Fase 2: Foundational (bloqueante — tipos de datos de umbrales)
3. Completar Fase 3: US1 (visibilidad del rango y umbrales)
4. Completar Fase 4: US2 (reclamo real de recompensas) — ambas P1, spec.md las trata como el núcleo funcional del sistema
5. **Detener y validar**: correr T005/T010 en verde de forma aislada, luego el quickstart.md completo con GUI
6. Esto ya es el sistema completo — no hay una Fase 3 opcional más allá de estas dos historias

### Incremental Delivery

1. Setup + Foundational → tipos de datos de umbrales listos
2. + US1 → Rango de Usuario y umbrales visibles
3. + US2 → reclamo de recompensas funcional, cerrando el ciclo completo
4. Fase 5 → verificación final y quickstart manual con GUI

## Notes

- [P] = archivos distintos, sin dependencias pendientes
- T006/T011 (mismo archivo `UserRankController.cs`) y T008/T012 (mismo archivo `UserRankUIController.cs`) se extienden de forma secuencial entre historias, siguiendo el mismo patrón ya usado en specs anteriores para archivos compartidos
- Esta feature no tiene componente PlayMode — a diferencia de `018`/`019`, ningún comportamiento nuevo ocurre dentro de una batalla (research.md, Technical Context de plan.md)
- El hallazgo central de esta feature (research.md §1: el Rango de Usuario reutiliza `PlayerCharacterLevelCalculator` sin duplicarlo) se verifica explícitamente en T005 — cualquier futura refactorización de `PlayerCharacterLevelCalculator` (005) que rompa esa delegación debe hacer fallar este test, no pasar desapercibida
- T015 probablemente requiera un humano en el Editor de Unity (GUI) para la inspección visual de la pantalla y el botón de reclamo, igual que quedó documentado para pasos equivalentes en specs anteriores
