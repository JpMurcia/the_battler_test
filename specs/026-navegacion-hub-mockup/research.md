# Research: Navegación Hub + Modales

## Decisión 1 — Modelo de navegación: `Screen` (vista base) separado de `PanelId` (overlay)

**Decisión**: Introducir un tipo `PanelId` distinto de `Screen`, y un stack (`PanelId[]`) de UI pura en `HubScreen`/`LevelSelectScreen` en vez de reutilizar el `switch(screen)` de `App.tsx` para las siete pantallas convertidas a panel.

**Rationale**: `App.tsx` hoy hace `switch(screen)` y siempre reemplaza toda la vista — es exactamente el comportamiento que el spec pide dejar de tener para Equipar/Mejorar/Cápsula/Guías/Ajustes/Menú de Tesoros (FR-004). Forzar esas siete pantallas a seguir siendo casos de `Screen` obligaría a que `App.tsx` supiera "renderizar Hub + panel encima" con lógica ad-hoc por caso. Separar `PanelId` deja `App.tsx` con un switch simple de vistas base (Title/Hub/LevelSelect/Battle/Result — igual de simple que hoy) y mueve el stack de paneles al componente que los abre (`HubScreen` para los seis paneles del Hub + Perfil + Buzón; `LevelSelectScreen` para el punto de entrada adicional a Menú de Tesoros de FR-010), que es también quien conoce el estado "detrás" del panel (FR-005).

**Alternatives considered**:
- *Mantener todo en `Screen` y renderizar condicionalmente el Hub debajo*: obligaría a `App.tsx` a inspeccionar "¿el screen actual es uno de los siete paneles?" para decidir si también monta `HubScreen` detrás — lógica frágil y acoplada, y no resuelve FR-013 (apilar Ajustes sobre Perfil) sin un stack explícito de todos modos.
- *Router de terceros (react-router u otro)*: el proyecto no usa ninguno hoy (Constitución/Restricciones Técnicas no lo menciona; navegación actual es 100% `useState<Screen>` + props `onNavigate`); agregar uno sería una dependencia nueva sin beneficio claro para 7 paneles conocidos de antemano — viola Principio VII (Simplicidad).

## Decisión 2 — Reutilizar las pantallas existentes sin tocar su interior

**Decisión**: `TeamScreen`, `UpgradeScreen`, `GachaScreen`, `CatGuideScreen`, `EnemyGuideScreen`, `SettingsScreen` y `TreasureMenuScreen` no cambian su JSX interno, sus hooks de store ni su texto — cada una se monta hoy en un `<main className="screen">`; para abrirla como panel, ese `<main>` se sustituye por un contenedor `PanelOverlay` (ver Decisión 4) que aporta el fondo oscurecido, el cierre y el focus trap. La prop `onNavigate` de cada pantalla se sigue pasando, pero el `onNavigate('MainMenu')`/`onNavigate('Upgrade')` que hoy usan para "volver" se redirige a "cerrar el panel actual" (pop del stack) en vez de un cambio de `Screen`.

**Rationale**: Es el requisito más estricto del spec (FR-006/FR-015) y el mismo criterio ya aplicado en specs/021: cero regresión de comportamiento verificado por tests. Envolver en vez de reescribir minimiza el diff y el riesgo sobre siete pantallas que ya tienen cobertura de tests.

**Alternatives considered**:
- *Reescribir cada pantalla como "panel" desde cero, con nuevo layout tipo Mockup (slots, tabs internas, etc.)*: se descartó — el spec pide acercar la *navegación*, no rediseñar el contenido interno de cada función; rehacer el contenido de siete pantallas es una superficie de riesgo y de alcance mucho mayor, y no lo pide ninguna historia de usuario de esta spec.

## Decisión 3 — Guía de Gatos y Guía de Enemigos comparten un panel "Biblioteca" con tabs

**Decisión**: `CatGuideScreen` y `EnemyGuideScreen` se montan como dos pestañas dentro de un mismo panel "Biblioteca" (un `PanelOverlay` con un selector de tabs simple encima, reutilizando el patrón de tabs que ya existe en `GachaScreen` — `activeTab === 'roll' ? ... : ...`), en vez de dos paneles separados.

**Rationale**: El Mockup agrupa ambas guías bajo un único acceso "Biblioteca" del dock (FR-002); el dock del Hub tiene un solo ícono de Biblioteca, no dos. Cada pantalla conserva su contenido y lógica intactos (Decisión 2) — el panel solo decide cuál de las dos está montada.

**Alternatives considered**: Dos accesos separados en el dock (uno por guía) — rechazado porque el dock del Mockup y el spec (FR-002) contemplan un único acceso "Biblioteca".

## Decisión 4 — `PanelOverlay` como contenedor compartido, sin librería de modal

**Decisión**: Construir un componente `src/screens/shared/PanelOverlay.tsx` reutilizado por los siete paneles y los dos nuevos, con: fondo fijo (`position: absolute; inset: 0`) sobre la vista base, oscurecido/blur reutilizando el token visual ya usado por `.glass-panel`/`.battle-overlay` en `src/theme.css`, un control de cierre (botón con `aria-label`), captura de foco al abrir (`focus()` sobre el primer elemento interactivo o el propio panel con `tabIndex=-1`) y devolución de foco al elemento que lo abrió al cerrarse (`ref` guardado antes de abrir).

**Rationale**: El proyecto no tiene ninguna librería de diálogo/modal en `package.json` y agregar una violaría Principio VII para un caso de uso acotado (7+2 paneles conocidos, sin necesidad de portales anidados complejos). El patrón nativo (`position:absolute` + estado de foco manual) ya tiene precedente visual en `.battle-overlay` (`src/theme.css:399`), que también se superpone a una vista existente.

**Alternatives considered**:
- *`<dialog>` nativo de HTML*: se evaluó por el manejo de foco/Escape gratuito, pero su `::backdrop` y comportamiento de apilamiento (`showModal` no soporta bien varios diálogos apilados sin gestión manual, requerida igual por FR-013) no simplifica lo suficiente frente al costo de introducir un elemento nuevo en un layout ya fijado a pantalla completa (specs/021 Fase 9); se puede reconsiderar en una iteración futura si el focus-trap manual resulta insuficiente.
- *Librería externa (Radix Dialog, react-modal, etc.)*: rechazada por Principio VII — ninguna dependencia nueva sin necesidad clara.

## Decisión 5 — Persistencia del estado "leído" del Buzón de Noticias

**Decisión**: Nueva tabla Dexie singleton `newsRead: { id: 1; readIds: string[] }`, agregada como `version(11).stores({ newsRead: 'id' })` en `src/db/index.ts`, siguiendo el mismo patrón aditivo que `userRank`/`gachaStorage`/etc. `useMetaStore` expone `readNewsIds: string[]` y `markNewsRead(id: string)`, hidratados/persistidos igual que el resto del estado de progreso (Constitución V).

**Rationale**: Es el único dato verdaderamente nuevo de esta feature (las Entradas de Noticias en sí son estáticas, ver `data/news.ts`); debe persistir localmente como cualquier otro progreso del jugador, sin backend.

**Alternatives considered**: Guardar el estado de lectura en `localStorage` directo, fuera de Dexie — rechazado por inconsistencia con el resto del proyecto, que centraliza todo el progreso persistente en Dexie vía `useMetaStore` (Constitución V, Restricciones Técnicas).

## Decisión 6 — Contenido inicial del Buzón de Noticias

**Decisión**: `src/data/news.ts` se siembra con un puñado de entradas (3–5) que resuman hitos ya shippeados del proyecto (p. ej. "Sistema de Gacha", "Cat Combos", "Reskin Cyber-Modern"), como contenido de ejemplo verificable — no un feed en vivo.

**Rationale**: Cumple FR-008 (lista con título/fecha/descripción) con datos reales y trazables del propio historial de specs del proyecto, sin inventar contenido de producto ajeno al repo, y sin depender de ningún servicio externo (Assumptions: contenido estático).

**Alternatives considered**: Dejar el Buzón vacío por defecto — rechazado porque el Edge Case de "sin novedades" ya está cubierto como estado explícito (spec.md Edge Cases) y probarlo requiere al menos una siembra con contenido real para validar el caso "con novedades".
