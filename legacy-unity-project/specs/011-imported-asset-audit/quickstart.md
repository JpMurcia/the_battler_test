# Quickstart: Validar el catálogo de assets importados

Esta feature no tiene build ni tests automatizados (ver plan.md Technical Context — Testing: N/A). La validación es leer `asset-catalog.md` y confirmar que cubre lo que pide cada historia de usuario de spec.md.

## Prerrequisitos

- `specs/011-imported-asset-audit/asset-catalog.md` generado (Fase de implementación, US1-US4).
- Acceso de solo lectura al árbol `Assets/` del repositorio (no requiere abrir Unity).

## US1 — Catálogo de packs

```bash
grep -c "^##" specs/011-imported-asset-audit/asset-catalog.md
```

**Esperado**: al menos una sección por cada uno de los 5 packs (`Characters`, `Assets/Assets`, `Dragon Warrior Files`, `Free 2D Cartoon Parallax Background`, `Hyper_Casual_UI`), cada una con ruta, tipo de contenido y conteo de archivos (SC-001).

## US2 — Cumplimiento del Principio III

Confirmar que la tabla de personajes tiene 30 filas `hero_N` + 1 fila `Dragon Warrior`, cada una marcada `cumple`/`incompleto` (SC-002).

```bash
grep -c "hero_" specs/011-imported-asset-audit/asset-catalog.md
```

**Esperado**: 30 referencias a `hero_N` distintas en la tabla de cumplimiento, ninguna sin marca de cumplimiento.

## US3 — Recomendación de UI por pantalla

Confirmar que las 4 pantallas núcleo (`MainMenu`, `AdventureMap`, `PlayerBase`, HUD de batalla) tienen una fila con recomendación explícita o "requiere decisión de diseño" (SC-003) — cero filas vacías.

## US4 — Riesgos de licencia

Confirmar que cada archivo de licencia/léame detectado en `Assets/` (ver research.md §2) aparece listado con su ruta exacta (SC-004).

```bash
find Assets -iname "*readme*" -o -iname "*license*" | grep -v "\.meta$"
```

Comparar la salida contra la sección de licencias del catálogo — deben coincidir uno a uno.

## Confirmación de que no se tocó ningún asset (FR-007)

```bash
git status --short -- Assets | wc -l
```

**Esperado**: el número de archivos untracked/modified bajo `Assets/` es idéntico antes y después de generar el catálogo — esta feature solo agrega `specs/011-imported-asset-audit/asset-catalog.md`.
