# Implementation Plan: Navegación Hub + Modales (acercamiento al Mockup)

**Branch**: `026-navegacion-hub-mockup` | **Date**: 2026-08-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/026-navegacion-hub-mockup/spec.md`

## Summary

Reemplazar la navegación de página-completa actual (`App.tsx` hace `switch(screen)` y reemplaza toda la vista) por un Hub persistente (`HubScreen`, sustituto de `MainMenuScreen`) con HUD superior (rango/energía/moneda) y dock inferior (Biblioteca, Cápsula, Almacén), sobre el cual Equipar, Mejorar, Cápsula, Guías, Ajustes y Menú de Tesoros se abren como paneles superpuestos apilables (no pantallas nuevas), más dos paneles nuevos (Perfil de Jugador, Buzón de Noticias) y un acceso directo a Tesoros desde el Mapa de Etapas. La lógica interna de cada pantalla existente (handlers, llamadas al store, texto/nombres accesibles) no cambia — solo cambia el *shell* que la aloja, envolviendo cada pantalla convertida en un contenedor de overlay reutilizable en vez de reescribir su contenido.

## Technical Context

**Language/Version**: TypeScript 5 (proyecto existente, sin cambios)

**Primary Dependencies**: React 19, Zustand 5, lucide-react, Dexie 4 — todas ya en `package.json`; esta feature no agrega dependencias nuevas (el stack de paneles/overlay se construye con React + CSS propios, sin librería de modal/router)

**Storage**: Dexie/IndexedDB vía `src/db/index.ts` y `useMetaStore` — se añade una tabla singleton nueva (`newsRead`) siguiendo el patrón `version(N).stores({...})` ya usado por `gachaStorage`, `userRank`, etc.

**Testing**: Vitest + @testing-library/react (ya presentes); se extienden los tests existentes de navegación (`App.tsx`/pantallas) para cubrir apertura/cierre de paneles y el stack de FR-013

**Target Platform**: Navegador, layout fijo móvil-horizontal (ya establecido en specs/021 Fase 9) — sin cambios de plataforma

**Project Type**: Aplicación web single-project (frontend puro, sin backend — Constitución, Restricciones Técnicas)

**Performance Goals**: N/A — no toca el bucle de combate (60fps) de `src/engine/`/`BattleStage`; abrir/cerrar un panel debe sentirse instantáneo (transición CSS ≤200ms), sin requisito numérico adicional

**Constraints**: Ningún handler, llamada al store, texto visible ni nombre accesible verificado por las pruebas existentes puede cambiar (FR-015, mismo criterio que specs/021); el estado de los paneles superpuestos es UI pura de React y no debe tocar `useGameStore` (Constitución VI)

**Scale/Scope**: 1 pantalla reestructurada (`MainMenu` → `HubScreen`), 7 pantallas convertidas a panel superpuesto (Equipar, Mejorar, Cápsula, Guía de Gatos, Guía de Enemigos, Ajustes, Menú de Tesoros), 2 paneles nuevos (Perfil de Jugador, Buzón de Noticias), 1 acceso nuevo (Tesoros desde Mapa de Etapas)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación |
|---|---|
| I. Combate Automático por Despliegue | N/A — no se toca `src/engine/` ni las reglas de combate. |
| II. Progresión por Niveles con Desbloqueo Secuencial | N/A — el nuevo acceso a Tesoros en el Mapa de Etapas es aditivo (FR-010); no cambia lógica de desbloqueo. |
| III. Identidad Visual Animada | N/A — no se agregan gatos ni sprites nuevos. |
| IV. Balance Dirigido por Datos | Cumple — las Entradas de Noticias (FR-008) viven en `src/data/news.ts`, no hardcodeadas en el componente del panel. |
| V. Persistencia Local-First, Sin Backend | Cumple — el estado de lectura del Buzón (FR-009) se persiste en Dexie/`useMetaStore` como el resto del progreso, sin backend. |
| VI. Separación Estricta entre Motor y UI | Cumple — el stack de paneles superpuestos es estado de React (`useState`/store de UI), nunca observado por `src/engine/`; `BattleScreen`/`BattleStage` no se modifican por esta feature (FR-018 mantiene Resultado como pantalla separada, no panel). |
| VII. Simplicidad desde el MVP | Cumple — Gamatoto, Tienda, Misiones, Leadership y Meow Medals quedan explícitamente fuera de alcance (FR-016/FR-017, Assumptions), evitando construir mecánicas nuevas sin spec propia. |

Sin violaciones — no se requiere la tabla de Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/026-navegacion-hub-mockup/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── panel-shell.md
├── checklists/
│   └── requirements.md
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
battle-cats-web/
├── src/
│   ├── App.tsx                        # Se reduce a un switch de "vistas base" (Title/Hub/LevelSelect/Battle/Result);
│   │                                   #   ya no incluye MainMenu/Gacha/Upgrade/Team/Settings/CatGuide/EnemyGuide/
│   │                                   #   TreasureMenu como destinos de página completa.
│   ├── types/
│   │   └── screen.ts                  # Se agrega `PanelId` (nuevo, separado de `Screen`) para el stack de paneles.
│   ├── state/
│   │   └── useMetaStore.ts            # Se agregan `readNewsIds` + `markNewsRead` (persistidos vía Dexie).
│   ├── db/
│   │   └── index.ts                   # Se agrega tabla singleton `newsRead` (version(11), patrón existente).
│   ├── data/
│   │   └── news.ts                    # NUEVO — catálogo estático de Entradas de Noticias (Constitución IV).
│   └── screens/
│       ├── HubScreen.tsx              # NUEVO — sustituye a MainMenuScreen como caso 'MainMenu' de App.tsx.
│       │                              #   HUD superior + accesos destacados + dock inferior + hosting del panel stack.
│       ├── PlayerProfilePanel.tsx     # NUEVO panel (US3).
│       ├── NewsPanel.tsx              # NUEVO panel (US4).
│       ├── MainMenuScreen.tsx         # Se retira (reemplazada por HubScreen); su lógica de currency/accesos se
│       │                              #   redistribuye en HubScreen sin cambiar destinos ni textos.
│       ├── TeamScreen.tsx             # Sin cambios internos — se monta dentro de PanelOverlay en vez de <main className="screen">
│       ├── UpgradeScreen.tsx          # Sin cambios internos — ídem
│       ├── GachaScreen.tsx            # Sin cambios internos — ídem
│       ├── CatGuideScreen.tsx         # Sin cambios internos — ídem (agrupada con EnemyGuideScreen bajo tabs de un
│       │                              #   único panel "Biblioteca", ver research.md Decisión 3)
│       ├── EnemyGuideScreen.tsx       # Sin cambios internos — ídem
│       ├── SettingsScreen.tsx         # Sin cambios internos — ídem
│       ├── TreasureMenuScreen.tsx     # Sin cambios internos — ídem; ganan un segundo punto de apertura desde LevelSelectScreen
│       ├── LevelSelectScreen.tsx      # Se agrega el botón "Tesoros X%" (FR-010) que abre TreasureMenuScreen como panel
│       │                              #   sobre el propio Mapa de Etapas (no sobre el Hub).
│       └── shared/
│           └── PanelOverlay.tsx       # NUEVO — contenedor de overlay reutilizable: fondo Hub/vista-base oscurecido,
│                                       #   control de cierre, focus trap + restauración de foco (FR-012/FR-014).
└── tests/
    └── unit/
        └── (extiende los tests de App.tsx / HubScreen / PanelOverlay existentes)
```

**Structure Decision**: Proyecto único (frontend React existente, sin backend). No se crean paquetes ni directorios de nivel superior nuevos — todo el trabajo vive dentro de `src/` reutilizando la separación ya establecida (`screens/`, `state/`, `data/`, `db/`, `types/`). La única carpeta nueva es `src/screens/shared/` para el contenedor de overlay compartido por los siete paneles.

## Complexity Tracking

*Sin violaciones a la Constitución — tabla omitida.*
