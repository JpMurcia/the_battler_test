# Research: Reskin Visual Cyber-Modern — Base del Jugador / Hub

## §1 — Reutilización de los componentes `Themed*` de 022

**Decision**: Añadir `ThemedGlassPanel`/`ThemedAccentButton`/`ThemedGlowIcon` como componentes hermanos sobre la cabecera de nivel/XP y sobre cada uno de los 9 botones de navegación del Hub (los 7 ya construidos + los 4 nuevos de FR-007), exactamente igual a como `022-cyber-modern-theme` los añadió sobre `MainMenu.unity`.

**Rationale**: Es la razón de ser de la Historia de Usuario 2 de `022` (spec.md: "quien construya la siguiente pantalla rediseñada... puede tomar colores, fuentes y radios desde un único asset central"). No hay ninguna decisión nueva que tomar aquí — el patrón ya está validado y probado (`UIThemeCatalogTests`, quickstart.md de `022`).

**Alternatives considered**: Ninguna — replantear el patrón por pantalla violaría directamente el propósito declarado de `UIThemeCatalog`.

## §2 — Diseño de `ComingSoonUIController`: uno compartido vs. cuatro paneles a medida

**Decision**: Un único componente `ComingSoonUIController` con un método `ShowSystem(string systemName)` que actualiza un solo `TMP_Text`, reutilizado por los 4 accesos (Gamatoto/Cápsula/Almacén/Tienda) — un solo `GameObject`/panel en la escena, no cuatro.

**Rationale**: Ninguno de los 4 sistemas tiene todavía una spec funcional propia (quedan en el backlog Grupo B de `docs/roadmap-rediseno-visual.md`) — construir un panel a medida por sistema significaría anticipar contenido que ni siquiera está diseñado. Un componente compartido resuelve FR-007/SC-005 con la superficie mínima posible (Principio VI, Simplicidad desde el MVP) y es trivial de extender: cuando cualquiera de los 4 sistemas reciba su propia spec, ese botón deja de apuntar a `ComingSoonUIController` y empieza a apuntar a su panel real, sin tocar los otros tres.

**Alternatives considered**: Cuatro `GameObject`/prefab distintos con texto fijo por sistema — rechazado por duplicar la misma estructura visual 4 veces sin ninguna diferencia funcional entre ellos hoy.

## §3 — Ubicación de los 4 botones nuevos en `PlayerBase.unity`

**Decision**: Se agregan a la jerarquía ya existente que construye `PlayerBaseContentBuilder.cs`, sin asumir una posición de píxel concreta aquí — es una decisión de layout de `tasks.md`/implementación, no del diseño de esta spec.

**Rationale**: El Hub actual no tiene el concepto de "barra inferior de iconos" que sí tiene el mockup (los 7 accesos existentes se construyeron para `005`/`018`/`019`/`020` sin ese patrón). Definir aquí una posición exacta sería inventar un detalle visual que `PlayerBaseContentBuilder.cs` ya resuelve por código para el resto de botones del Hub — la implementación sigue el mismo criterio de layout ya usado ahí.

**Alternatives considered**: Especificar coordenadas/anchors exactos en el plan — rechazado, es un detalle de implementación que le compete a `tasks.md`, no a la investigación de diseño.

## §4 — Patrón nulo-seguro para los 4 botones nuevos

**Decision**: Los 4 campos nuevos en `PlayerBaseDashboardUIController` (`m_GamatotoNavigationButton`, `m_GachaNavigationButton`, `m_StorageNavigationButton`, `m_ShopNavigationButton`) más `m_ComingSoonPanel`/`m_ComingSoonUIController` siguen exactamente el mismo patrón `[SerializeField]` opcional + chequeo de `null` en `Awake()`/`OpenXPanel()` ya usado por los 7 campos existentes (`m_UpgradeNavigationButton`, etc., ver `PlayerBaseDashboardUIController.cs:12-68`).

**Rationale**: Consistencia con el resto del archivo — no introducir un segundo patrón de null-safety en la misma clase.

**Alternatives considered**: Ninguna.

## §5 — Fallback si `UIThemeCatalog` no está asignado

**Decision**: Ninguna lógica de fallback nueva — se reutiliza tal cual el fallback silencioso ya implementado dentro de cada `Themed*` (`if (m_Theme == null || ...) return;`, ver `ThemedGlassPanel.cs:23`/`ThemedAccentButton.cs:27`/`ThemedGlowIcon.cs:22`). `ComingSoonUIController` no depende de `UIThemeCatalog` directamente (solo de su propio `TMP_Text`), así que no necesita ningún fallback propio.

**Rationale**: Evita duplicar la lógica de fallback ya centralizada y probada en `022` (`UIThemeCatalogTests`).

**Alternatives considered**: Ninguna.
