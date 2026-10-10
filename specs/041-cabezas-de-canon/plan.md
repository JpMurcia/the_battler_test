# Implementation Plan: Cabezas de Cañón (Ototo Corps)

**Branch**: `041-cabezas-de-canon` | **Date**: 2026-10-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/041-cabezas-de-canon/spec.md`

## Summary

Añade una tercera construcción al Cuerpo Ototo (`cannonHead`, `specs/035`) y hace que el cañón especial (`useGameStore.activateSpecialCannon`) aplique un efecto secundario a los enemigos alcanzados que sobreviven: Retroceso (reutilizando el desplazamiento de `specs/039`) o uno de los cuatro efectos de estado de `specs/015`. El comportamiento de efectos vive en el motor como una función pura nueva (`applyCannonHead`, `src/engine/combat.ts`) que comparte con el combate normal las mismas reglas de inmunidad, resistencia y desplazamiento — para ello se extrae `applyEffectToDefender` del `applyOnHitEffect` existente sin cambiar su comportamiento. El resto es plomería de datos y UI sobre el flujo ya validado de las otras dos construcciones: catálogo (`src/data/ototoCorps.ts`), store/persistencia (`useMetaStore`, tabla `ototoCorps` sin nueva versión de esquema), panel (`OtotoCorpsPanel`) y la etiqueta del control de cañón del HUD.

## Technical Context

**Language/Version**: TypeScript

**Primary Dependencies**: Ninguna nueva.

**Storage**: Dexie sobre IndexedDB — la fila singleton existente `ototoCorps` (`specs/035`) gana una clave opcional `cannonHead` dentro de `buildings`; al ser una propiedad no indexada de un objeto ya almacenado no requiere nueva versión de esquema.

**Testing**: Vitest — `tests/unit/engine/combat.test.ts` (función pura nueva y refactor), `tests/unit/useGameStore.test.ts` (`activateSpecialCannon` con y sin cabeza), `tests/unit/useMetaStore.test.ts` (construir/reclamar/persistir/hidratar), `tests/unit/data/ototoCorps.test.ts`, `tests/unit/OtotoCorpsPanel.test.tsx` y `tests/unit/BattleScreen.test.tsx`.

**Target Platform**: Navegador.

**Project Type**: Web app single-project.

**Performance Goals**: sin cambio — el disparo del cañón es un evento discreto del jugador (no un tick), y la función nueva es O(enemigos en rango).

**Constraints**: `src/engine/` sigue sin importar `src/data/` (Constitución § VI) — el catálogo de la cabeza (`src/data/ototoCorps.ts`) la traduce a un `CannonHeadSpec` (tipo del motor) que la store pasa a `applyCannonHead`. El tope de carril del Retroceso del cañón llega del `laneLength` de la partida, igual que el de `specs/039`. El efecto se lee de `useMetaStore` en el momento de disparar, nunca se copia al estado efímero de batalla (Constitución § V).

**Scale/Scope**: `engine/types.ts` (`CannonHeadSpec`), `engine/combat.ts` (refactor + `applyCannonHead`), `state/useGameStore.ts` (`activateSpecialCannon`), `state/useMetaStore.ts` (tipos + validación de la elección), `db/index.ts` (tipo de la fila), `data/ototoCorps.ts` (catálogo y constantes), `screens/OtotoCorpsPanel.tsx`, `screens/BattleScreen.tsx` (`CannonControl`).

## Constitution Check

- **§ IV Balance Dirigido por Datos**: costo, duración, distancia de Retroceso y duración/magnitud de cada debuff viven en `src/data/ototoCorps.ts` — cumple.
- **§ VI Separación Motor/UI**: el efecto es una función pura de `src/engine/` (sin canvas/DOM); la store solo orquesta; el panel y el HUD solo leen — cumple.
- **§ V Persistencia Local-First**: la elección se persiste al reclamar (misma escritura inmediata que Base/Estilo); nada de la batalla en curso se persiste — cumple.
- **§ VII Simplicidad/YAGNI**: cinco elecciones sobre efectos que ya existen; sin nuevos tipos de cañón, sin animaciones, sin migración de esquema — cumple.
- **§ I Combate Automático**: el cañón ya era una acción discrecional del jugador (`specs/012`); esta spec no añade control sobre unidades desplegadas — cumple.

## Project Structure

### Documentation (this feature)

```text
specs/041-cabezas-de-canon/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── spec.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

(Sin `contracts/`: el proyecto no expone interfaces externas.)

### Source Code (repository root)

```text
src/
├── engine/
│   ├── types.ts        # CannonHeadSpec = { kind: 'Knockback'; distance } | { kind: 'Effect'; effect: AppliesEffect }
│   └── combat.ts        # applyOnHitEffect → extrae applyEffectToDefender(effect, defender); knockBack se comparte;
│                         # export applyCannonHead(unit, head, laneLength): BattleUnit (pura)
├── data/
│   └── ototoCorps.ts    # OtotoBuildingId += 'cannonHead'; OTOTO_BUILDINGS += Cabeza de Cañón; CannonHeadEffect;
│                         # CANNON_HEAD_OPTIONS/LABELS; CANNON_KNOCKBACK_DISTANCE; CANNON_DEBUFFS; getCannonHeadSpec
├── db/
│   └── index.ts         # OtotoCorpsRow.buildings += cannonHead?: CannonHeadEffect
├── state/
│   ├── useMetaStore.ts  # ototoBuildings += cannonHead?; startOtotoConstruction acepta OtotoBuildingId (valida la elección de cannonHead)
│   └── useGameStore.ts  # activateSpecialCannon aplica applyCannonHead a los enemigos alcanzados que sobreviven
└── screens/
    ├── OtotoCorpsPanel.tsx  # tercera fila (Cabeza de Cañón) con selector de 5 efectos y etiquetas en español
    └── BattleScreen.tsx     # CannonControl: "Cañón · {efecto}" si hay cabeza construida
```

**Structure Decision**: extensión aditiva de los mismos módulos que ya implementan el Cuerpo Ototo (`specs/035`) y el cañón especial (`specs/012`/`specs/029`); la única adición al motor es una función pura y un tipo, más un refactor sin cambio de comportamiento.

## Key Design Decisions

Ver `research.md` para el detalle de cada decisión — resumen:

1. Tercera entrada de `OTOTO_BUILDINGS` con el mismo flujo (`OtotoConstruction`, timestamp, fila `ototoCorps`) — cero infraestructura nueva de construcción.
2. El efecto es una función pura del motor (`applyCannonHead`), no lógica inline en la store — testeable sin Zustand (Constitución § VI) y reutilizable por un futuro cañón enemigo.
3. Se extrae `applyEffectToDefender` de `applyOnHitEffect`: así el cañón aplica los efectos de estado con exactamente las mismas reglas de inmunidad/resistencia/refresco que el combate normal, sin duplicarlas.
4. El desplazamiento de Retroceso del cañón reutiliza `knockBack` de `specs/039` y respeta `immuneAbilities: ['Knockback']` de `specs/040`.
5. El cañón sigue sin ser un golpe de unidad: no pasa por `applyHit` (no activa Esquivar/Sobrevivir/Escudo ni Dinero Extra) — decisión ya tomada por `specs/039` Decisión 7 y mantenida.
6. La elección se lee de `useMetaStore` al disparar, igual que `deployUnit` lee Base/Estilo al desplegar.
7. La validación de la elección vive en `startOtotoConstruction` solo para la construcción nueva (la UI ya restringe las de Base/Estilo; no se toca su comportamiento).

## Complexity Tracking

*Sin violaciones — tabla omitida.*
