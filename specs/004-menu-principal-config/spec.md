# Feature Specification: Menú Principal y Configuración

**Feature Branch**: `004-menu-principal-config`

**Created**: 2026-08-15

**Status**: Draft

**Input**: Adaptación a battle-cats-web de `the_battler_test/specs/003-main-menu-config` (proyecto Unity origen): pantalla de menú principal con acceso a "Jugar"/"Continuar" y una pantalla de configuración básica (audio, idioma) con persistencia local, sin cuentas ni backend.

**Nota de adaptación**: en battle-cats-web, `TitleScreen.tsx` y `MainMenuScreen.tsx` ya existen y ya resuelven la mayor parte de las Historias 1 y 2 de la spec origen — `TitleScreen` ya muestra "Continuar" en vez de "Jugar" cuando `useMetaStore.completedLevelIds.length > 0`, y `db/index.ts` ya persiste `SettingsRow` (`musicVolume`, `sfxVolume`, `language`) vía Dexie con `useMetaStore.updateSettings`. Lo que falta, y es el alcance real de esta spec, es la **pantalla de Configuración** en sí (UI para esos ajustes) y su acceso desde el menú principal. A diferencia del origen (Unity, sin voces/diálogo alguno), battle-cats-web no tiene canal de audio de voces porque no existe sistema de diálogo — se mantienen los dos canales que ya persiste `db/index.ts` (música, efectos).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ajustar audio e idioma desde el menú principal (Priority: P1)

Un jugador entra a una pantalla de Configuración desde el Menú Principal, cambia el volumen de música y de efectos y el idioma, confirma con "Aplicar/Guardar", y esos valores se mantienen tras cerrar y reabrir la aplicación.

**Why this priority**: Es el único trabajo nuevo real de esta spec — el resto (mostrar "Continuar"/"Jugar", persistencia de ajustes) ya existe en el código. Sin esta pantalla, `SettingsRow` en Dexie no tiene ninguna forma de editarse.

**Independent Test**: Desde `MainMenuScreen`, entrar a "Configuración", cambiar volumen de música/efectos e idioma, confirmar con "Aplicar/Guardar", recargar la app (`npm run dev` sigue corriendo) y verificar que `useMetaStore.settings` refleja los valores confirmados, no los de fábrica.

**Acceptance Scenarios**:

1. **Given** el jugador entra a Configuración por primera vez, **When** la pantalla carga, **Then** muestra los valores ya hidratados desde Dexie (`DEFAULT_SETTINGS` si es la primera sesión: música 1, efectos 1, idioma `es`).
2. **Given** el jugador cambia volumen y/o idioma y presiona "Aplicar/Guardar", **When** recarga la aplicación, **Then** ve los valores confirmados, no los de fábrica.
3. **Given** el jugador cambia volumen y/o idioma pero sale de Configuración sin presionar "Aplicar/Guardar", **When** vuelve a entrar, **Then** ve los últimos valores confirmados anteriormente, no los cambios descartados.

---

### User Story 2 - Elegir idioma de la interfaz (Priority: P2)

Un jugador cambia el idioma en Configuración entre Español, Inglés, Chino y Francés, y confirma que el texto de las pantallas ya traducidas (Título, Menú Principal, Configuración) cambia en consecuencia.

**Why this priority**: Le da valor real al campo `language` que ya persiste `SettingsRow` — hoy se guarda pero ninguna pantalla lo lee para traducir nada.

**Independent Test**: Cambiar el idioma a Inglés en Configuración, confirmar, y verificar que `TitleScreen`, `MainMenuScreen` y la propia pantalla de Configuración muestran sus textos en inglés.

**Acceptance Scenarios**:

1. **Given** el jugador selecciona un idioma y confirma, **When** navega a Título, Menú Principal o Configuración, **Then** los textos de esas pantallas se muestran en el idioma elegido.
2. **Given** un texto de la interfaz no tiene traducción cargada para el idioma elegido, **When** se renderiza, **Then** cae de vuelta al texto en español (idioma por defecto) en vez de mostrar una clave sin traducir o un vacío.

---

### Edge Cases

- ¿Falla la escritura en Dexie al confirmar un ajuste (por ejemplo, cuota de almacenamiento)? El ajuste elegido se mantiene aplicado en memoria durante esa sesión; el fallo se captura sin romper la pantalla, igual que el resto de `useMetaStore` (no hay manejo especial nuevo que introducir, `db.settings.update` ya es la única escritura).
- ¿Qué pasa si el jugador entra a Configuración sin haber hidratado todavía (`isHydrated === false`)? No debería ser alcanzable — `App.tsx` ya bloquea el render de cualquier pantalla hasta que `isHydrated` es `true`.
- ¿Se puede cambiar el idioma/audio durante una batalla? No — igual que el origen, Configuración solo es accesible desde `MainMenuScreen`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE ofrecer una pantalla `Settings` nueva, accesible desde un botón en `MainMenuScreen`, que muestra los valores actuales de `useMetaStore.settings` (música, efectos, idioma).
- **FR-002**: La pantalla `Settings` DEBE mantener los cambios de audio/idioma en estado local de componente (borrador) hasta que el jugador confirme explícitamente con un botón "Aplicar/Guardar" — no debe llamar a `updateSettings` en cada cambio de control.
- **FR-003**: Al confirmar, el sistema DEBE llamar a `useMetaStore.updateSettings` con los valores del borrador, que ya persiste en `db.settings` (sin cambios necesarios en `db/index.ts`).
- **FR-004**: Salir de `Settings` sin confirmar NO DEBE alterar `useMetaStore.settings` ni `db.settings`.
- **FR-005**: El sistema DEBE introducir un mecanismo de traducción reutilizable (diccionario `es`/`en`/`zh`/`fr` + función `t(key)` que lee `useMetaStore.settings.language`), aplicado como mínimo a `TitleScreen`, `MainMenuScreen` y `Settings`. Otras pantallas pueden adoptarlo después sin rediseñar el mecanismo.
- **FR-006**: Una clave de texto sin traducción para el idioma activo DEBE mostrar su texto en español (fallback), nunca la clave cruda ni un espacio vacío.
- **FR-007**: El sistema NO DEBE requerir cuenta, login ni conectividad de red para acceder o usar Configuración.

### Key Entities

- **`SettingsRow`** (existente, `src/db/index.ts`): sin cambios de esquema — `musicVolume`, `sfxVolume`, `language`.
- **Diccionario de traducción**: mapa `Record<string, Record<Locale, string>>` nuevo en `src/i18n/` (o similar), consumido por un hook `useTranslation()`/función `t()` que lee `useMetaStore.settings.language`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un cambio de audio o idioma confirmado con "Aplicar/Guardar" se mantiene tras recargar la aplicación el 100% de las veces; un cambio no confirmado nunca sobrevive a salir de la pantalla.
- **SC-002**: Las 4 pantallas traducidas (Título, Menú, Configuración) muestran el 100% de sus textos en el idioma elegido cuando existe traducción, y en español cuando no.
- **SC-003**: `npx tsc -b` limpio y suite de Vitest existente sin regresiones tras añadir la pantalla y el diccionario.

## Assumptions

- Las Historias 1 y 2 de la spec origen (`the_battler_test/specs/003-main-menu-config`) sobre mostrar "Continuar" vs. "Empezar" **ya están resueltas** por `TitleScreen.tsx` y no se repiten aquí como requisito nuevo.
- No hay canal de audio de voces/diálogo (a diferencia del origen) porque battle-cats-web no tiene sistema de diálogo/narrativa en su alcance actual; solo música y efectos, consistente con `SettingsRow` ya existente.
- El alcance de i18n de esta spec se limita a Título/Menú/Configuración; extender el diccionario al resto de pantallas (`LevelSelectScreen`, `BattleScreen`, etc.) es trabajo de seguimiento fuera de esta spec, sin necesidad de rediseñar el mecanismo.
- "Hardware objetivo" (rendimiento de carga) no aplica aquí como criterio nuevo — battle-cats-web ya corre 100% en navegador de escritorio/móvil sin una plataforma objetivo formalizada en su constitución; se omite el SC de tiempo de carga del origen por no ser medible de forma consistente en este contexto.
