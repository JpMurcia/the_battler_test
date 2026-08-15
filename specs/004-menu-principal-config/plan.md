# Implementation Plan: Menú Principal y Configuración

**Branch**: `004-menu-principal-config` | **Date**: 2026-08-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-menu-principal-config/spec.md`

## Summary

Añadir una pantalla `Settings` (patrón borrador + "Aplicar/Guardar") accesible desde `MainMenuScreen`, que edita `useMetaStore.settings` (ya persistido en Dexie sin cambios de esquema), y un mecanismo mínimo de i18n (`src/i18n/`) aplicado a `TitleScreen`, `MainMenuScreen` y `Settings`.

## Technical Context

**Language/Version**: TypeScript, React 19 (sin cambios de stack)

**Primary Dependencies**: Ninguna nueva — reutiliza Zustand (`useMetaStore`) y Dexie (`db.settings`) ya existentes.

**Storage**: `db.settings` (Dexie/IndexedDB) — esquema sin cambios.

**Testing**: Vitest + Testing Library, mismo patrón que `tests/unit/TitleScreen.test.tsx`.

**Target Platform**: Navegador (sin cambio).

**Project Type**: Web app single-project (sin cambio de estructura).

**Performance Goals**: N/A — pantalla estática sin loop de render en tiempo real.

**Constraints**: El borrador de `Settings` vive en estado local de componente (`useState`), nunca en `useMetaStore` hasta confirmar (FR-002/FR-004).

**Scale/Scope**: 1 pantalla nueva (`Settings`), 1 botón nuevo en `MainMenuScreen`, 1 módulo de i18n (diccionario + hook), 1 entrada nueva en `Screen`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **§ IV Balance Dirigido por Datos**: el diccionario de traducción vive en `src/i18n/` (contenido), no hardcodeado en componentes de pantalla — cumple.
- **§ V Persistencia Local-First**: reutiliza `db.settings` existente sin backend — cumple, sin cambios de esquema.
- **§ VI Separación Motor/UI**: esta feature no toca `src/engine/` en absoluto — cumple trivialmente.
- **§ VII Simplicidad/YAGNI**: i18n se limita a 3 pantallas ya existentes más pequeñas, sin traducir narrativa (no existe) ni contenido de datos (`cats.ts`/`levels.ts`) — cumple.

Sin violaciones. No aplica Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/004-menu-principal-config/
├── plan.md              # Este archivo
├── spec.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── i18n/
│   ├── translations.ts   # Record<TranslationKey, Record<Locale, string>>
│   └── useTranslation.ts # hook: t(key) → string, lee useMetaStore.settings.language, fallback a 'es'
├── screens/
│   ├── SettingsScreen.tsx   # nuevo — borrador local + Aplicar/Guardar → useMetaStore.updateSettings
│   ├── MainMenuScreen.tsx   # + botón "Configuración" → onNavigate('Settings')
│   └── TitleScreen.tsx      # usa useTranslation() para su texto
└── types/screen.ts       # Screen añade 'Settings'
```

**Structure Decision**: sigue el patrón ya establecido — una pantalla nueva en `src/screens/`, sin tocar `src/engine/` ni `src/game/`. `i18n/` es un directorio de contenido nuevo, paralelo a `src/data/`, consistente con Constitución § IV (contenido fuera de la lógica).

## Complexity Tracking

*Sin violaciones — tabla omitida.*
