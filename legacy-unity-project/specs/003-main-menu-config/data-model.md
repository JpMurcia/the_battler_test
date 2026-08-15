# Data Model: Menú Principal y Configuración

## SupportedLanguage

Enum en `TheBattler.Core` (mismo nivel que `BattleOutcome`, `Team` — valores compartidos sin dependencias de motor).

```csharp
public enum SupportedLanguage
{
    Spanish,
    English,
    Chinese,
    French
}
```

**Reglas de validación**: `Spanish` es el idioma fuente/por defecto (ver FR-002 y Assumptions de spec.md — el proyecto se desarrolla en español); toda clave de `LocalizedTextTable` debe tener como mínimo una traducción en `Spanish`.

## MenuSettings

Ajustes de menú persistidos localmente. Vive en `TheBattler.Model`.

| Campo | Tipo | Descripción |
|---|---|---|
| `formatVersion` | `int` | Versión del esquema de guardado, igual patrón que `ProgressSaveData.formatVersion`. Empieza en `1`. |
| `musicVolume` | `float` | Volumen lineal `[0, 1]` del canal de música. Por defecto `1.0`. |
| `sfxVolume` | `float` | Volumen lineal `[0, 1]` del canal de efectos (SFX). Por defecto `1.0`. |
| `voiceVolume` | `float` | Volumen lineal `[0, 1]` del canal de voces/diálogo. Por defecto `1.0`. |
| `language` | `SupportedLanguage` | Idioma seleccionado. Por defecto `Spanish`. |

**Reglas de validación**:
- `musicVolume`, `sfxVolume`, `voiceVolume` se clampan a `[0, 1]` al cargar y al guardar (un valor fuera de rango en un archivo editado a mano no debe propagar un `dB` inválido al `AudioMixer`).
- Un `formatVersion` desconocido, o un JSON que no deserializa a esta forma, se trata como "ajustes ausentes" → se usan los valores por defecto (mismo comportamiento de fallback que `ProgressSaveData`, FR-013).
- Independiente de `ProgressSaveData` (002): viven en archivos distintos, se cargan/guardan por separado, ninguno referencia al otro.

## LocalizedStringEntry

Entrada individual de traducción. Vive en `TheBattler.Model`, anidada dentro de `LocalizedTextTable`.

| Campo | Tipo | Descripción |
|---|---|---|
| `key` | `string` | Identificador estable de la cadena (p. ej. `"menu.start"`, `"menu.continue"`, `"hud.pause"`). Único dentro de la tabla. |
| `spanish` | `string` | Texto en español. Obligatorio (idioma fuente). |
| `english` | `string` | Texto en inglés. |
| `chinese` | `string` | Texto en chino. |
| `french` | `string` | Texto en francés. |

## LocalizedTextTable (ScriptableObject)

Activo de datos en `TheBattler.Model`, siguiendo el mismo patrón que `ChapterDefinition`/`UnitDefinition` (Principio V).

| Campo | Tipo | Descripción |
|---|---|---|
| `entries` | `LocalizedStringEntry[]` | Todas las claves traducibles del menú y de la UI existente (001, 002). |

**Comportamiento de lookup** (`GetText(string key, SupportedLanguage language)`):
1. Si `key` no existe en la tabla → devuelve la propia `key` entre corchetes (p. ej. `"[menu.start]"`), nunca lanza excepción ni deja un campo vacío en pantalla (facilita detectar claves faltantes en el Editor/QA).
2. Si `key` existe pero la traducción para `language` está vacía/nula → hace fallback a `spanish` (idioma fuente, ver `SupportedLanguage`).
3. Si `key` existe y tiene traducción no vacía para `language` → la devuelve tal cual.

**Reglas de validación**:
- A lo sumo una `LocalizedStringEntry` por `key` (claves duplicadas son un error de datos de diseño, verificable en un test EditMode que recorra el asset).
- `spanish` no puede quedar vacío en ninguna entrada (es el fallback universal).

## ISceneNavigator (contrato)

Ver [contracts/scene-navigator.md](./contracts/scene-navigator.md) para la interfaz completa. Introducido para que `MainMenuFlowController` (`StartNewGame()`/`ContinueGame()`) sea testeable en PlayMode sin depender de una carga de escena real — ver research.md §7.

## IMenuSettingsStore (contrato)

Ver [contracts/menu-settings-store.md](./contracts/menu-settings-store.md) para la interfaz completa.

## Relación con entidades existentes

- **`ProgressSaveData` / `IChapterProgressStore`** (feature 002): esta feature los reutiliza tal cual, en modo solo lectura, únicamente para decidir si el menú principal muestra "Continuar" (`data.chapters.Length > 0`, mismo criterio que spec.md User Story 2 Escenario 1). No se añade ningún campo ni método nuevo a `ProgressSaveData`/`IChapterProgressStore`.
- **`ChapterDefinition`** (feature 001): no se modifica; el botón "Empezar"/"Continuar" navega a la escena `Chapter1_Battle` por nombre de escena (vía `ISceneNavigator`), no por referencia directa a un `ChapterDefinition` (la resolución de "a qué capítulo ir" queda delegada a esa escena, tal como hoy — ver spec.md Assumptions sobre la Fase 4 pendiente).
- **UI existente (`001-chapter1-vertical-slice`)**: revisado directamente en el código (`DeploymentUIController`, `DialoguePlaybackController` — los únicos componentes de esa feature con texto en pantalla), no existe hoy ningún texto estático traducible: el HUD solo muestra un valor numérico de coste (no localizable) y el contenido narrativo de diálogo (explícitamente fuera de alcance de FR-004). Por eso esta feature **no** modifica `Chapter1_Battle.unity` ni esos componentes — `LocalizedTextTable`/`LocalizedTextBinder` quedan disponibles como mecanismo reutilizable para UI no narrativa futura, sin nada que cablear retroactivamente hoy.
