# Research: Sistema de Gacha Completo ("Cápsula de Gatos")

## Decisión 1 — "XP" de intercambio de duplicados = la `currency` ya existente (sin wallet nuevo)

**Decision**: El "XP" que `spec.md` FR-008 usa como resultado de intercambiar una cápsula del Almacén **es** la `currency` ya existente en `useMetaStore`/`playerProfile` (la misma que gasta `upgradeCat`) — no se crea un cuarto wallet de persistencia.

**Rationale**: Hoy `currency` ya cumple exactamente el rol que el manual técnico asigna a "XP": es el único recurso que se gasta para subir de nivel a un gato (`upgradeCost = currentLevel * 100`, `UpgradeScreen`). No existe en el código ningún wallet separado llamado "XP" — `OwnedCatRow.experienceInvested` es un contador de auditoría por gato (cuánto se invirtió en él), no un saldo gastable. Inventar un wallet "XP" nuevo y distinto de `currency` duplicaría el mismo concepto con otro nombre, violando YAGNI (Constitución § VII) y contradiciendo la propia Asunción de `spec.md` ("tres monedas persistentes en total": `currency` ya existente + moneda de gacha + NP — no cuatro).

**Alternatives considered**: Wallet `xp: number` nuevo en `playerProfile`, separado de `currency` — descartado: no hay ningún requisito funcional que dependa de que XP y `currency` sean saldos distintos (ambos financian lo mismo: subir de nivel), y mantenerlos separados solo añade una tabla/campo más que sincronizar sin beneficio de diseño.

## Decisión 2 — Unidades gacha-exclusivas nuevas usan el fallback `Graphics` genérico, no el pipeline procedural de `specs/022`

**Decision**: Los gatos nuevos que pueblan `Legendario`/`Colaboración` (FR-013) se definen como `Cat` normales en un archivo nuevo `src/data/gachaUnits.ts` (mismo shape que `cats.ts`), **sin** `spriteKey` y **sin** registrarlos en `SEED_UNITS`/`SEED_ENEMIES`. Caen en el tercer nivel de fallback que `UnitSprite.tsx` ya tiene desde `specs/003`/`specs/021`: el `Graphics` genérico derivado de stats vía `animation.ts` (`getVisualProfile`/`getAnimationPose`), con su propia animación idle/ataque por transform.

**Rationale**: Ese fallback genérico ya es, desde `specs/003-identidad-visual-animada`, una animación real (idle + ataque, nunca un sprite estático) — cumple Constitución § III sin necesidad de ningún asset ni pipeline nuevo. El pipeline procedural de `specs/022` (`ProceduralDesign` + `drawSeedUnit` + caché de textura por `generateTexture`) se adoptó ahí por una razón de rendimiento específica — los enemigos semilla se instancian en oleadas repetidas (`unitFactory.ts`) y se benefician de cachear una textura reutilizable — que no aplica a un puñado de gatos de gacha (unidades de jugador, no de oleada masiva). Reintroducir ese pipeline para 4 cats nuevos sería trabajo sin beneficio medible.

**Alternatives considered**: Extender `SeedRarity`/`ProceduralDesign` (specs/022) con tiers `Legendario`/`Colaboración` y usar `drawSeedUnit` para los gatos nuevos — descartado: el pipeline procedural fue diseñado y justificado en `specs/022/plan.md` para enemigos de oleada, no para ampliarlo aquí sin una razón de rendimiento nueva (YAGNI, Constitución § VII).

## Decisión 3 — "Nivel +" (`plusLevel`) es un contador aditivo sin fórmula de stats propia

**Decision**: `plusLevel` se agrega como campo opcional nuevo en `OwnedCatMeta`/`OwnedCatRow` (mismo patrón que `evolutionStage?` de `specs/010`, ausente en filas viejas = `0` al leer, sin migración). Activar una cápsula duplicada incrementa `plusLevel` en 1. `characterLevelOf` (Rango de Usuario, `specs/019`) pasa a sumar `cat.level + (cat.plusLevel ?? 0)` por gato. La UI muestra "Nivel N+M" (mismo formato "20+10" que documenta el manual técnico § 5.7) donde corresponda (`CatGuideScreen`, `UpgradeScreen`).

**Rationale**: Se auditó `getEffectiveCatStats` (`src/data/cats.ts:74`) y se confirmó que **el nivel natural (`owned.level`) hoy no afecta hp/daño de combate en absoluto** — solo participa en gates de evolución (`requiredLevel`), en `characterLevelOf` (Rango de Usuario) y en el tope de energía de misión (`computeMissionEnergyMax`). Los stats de combate dependen únicamente de `evolutionStage` (`Base`/`Second`/`True`). Por lo tanto, la Asunción de `spec.md` ("reutiliza la misma curva de estadísticas por nivel ya implementada para el nivel natural") se resuelve con la curva real que existe: ninguna curva de combate, solo progresión de Rango de Usuario — inventar una fórmula de stats para `plusLevel` sería añadir una mecánica que el propio nivel natural no tiene hoy, un alcance mayor al que la spec pide.

**Alternatives considered**: Multiplicador de hp/daño por `plusLevel` (ej. `+2% por nivel +`) — descartado: no hay ningún requisito funcional (`FR-*`/`SC-*` de `spec.md`) que exija que un duplicado mejore el poder de combate del gato, solo que "aumente estadística y nivel" en el sentido de Rango de Usuario/progreso — y añadir una curva de combate nueva exigiría rebalancear todo el catálogo, fuera de alcance (Constitución § VII).

## Decisión 4 — El Almacén de Gatos vive como pestaña dentro de `GachaScreen`, sin `Screen` nuevo

**Decision**: `GachaScreen.tsx` se reescribe como hub con dos pestañas internas ("Tirar" / "Almacén"), como estado local (`useState<'roll' | 'storage'>`) — no se agrega ningún valor nuevo a `types/screen.ts` ni ninguna ruta nueva en `App.tsx`.

**Rationale**: Mismo patrón ya usado por `UpgradeScreen` (hub con navegación a `Team`/`CatGuide`/`EnemyGuide`/`TreasureMenu` como pantallas propias) pero aplicado con pestañas en vez de sub-pantallas, porque a diferencia de esos casos el Almacén no tiene sentido como destino independiente — solo existe en función de una tirada reciente y su flujo de vuelta es siempre "volver a la Cápsula" (spec.md US1 Acceptance Scenario 3). Evita tocar `types/screen.ts`/`App.tsx` (ya wireados a `Gacha` desde `specs/001`), minimizando el diff de navegación.

**Alternatives considered**: `Screen` nuevo `'CatStorage'`, accesible desde `MainMenu` y desde `GachaScreen` (como el icono de refrigerador del manual, accesible desde dos puntos) — descartado por YAGNI: la spec no pide un segundo punto de entrada al Almacén, y un `Screen` adicional obliga a decidir su propio botón "Volver" y su propio lugar en el flujo de `App.tsx` sin necesidad funcional.

## Decisión 5 — Persistencia: cápsulas del Almacén como tabla Dexie nueva; monedas como campos nuevos de `playerProfile`

**Decision**:
- `gachaCurrency: number` y `npCurrency: number` se agregan como campos **opcionales** nuevos de `PlayerProfileRow` (mismo patrón que `currency` ya existente) — sin bump de versión Dexie, ya que no son índices (Dexie solo versiona el esquema de índices declarados en `.stores()`, no la forma completa de un row); filas viejas leen `?? 0`.
- Las cápsulas pendientes del Almacén sí requieren una tabla nueva con clave primaria autoincremental (a diferencia de `ownedCats`, donde `catId` ya es único, un mismo `catId` puede tener múltiples cápsulas pendientes simultáneas) → `db.version(10).stores({ gachaStorage: '++id' })`, con `GachaStorageRow { id?: number; catId: string; rarity: RarityType }`.
- `plusLevel` en `OwnedCatRow` sigue el mismo patrón opcional que `evolutionStage` (Decisión 3) — sin bump de versión.

**Rationale**: Sigue el mismo criterio ya usado en el historial de `specs/001`-`specs/023`: un campo opcional nuevo en una fila existente no bumpea versión (ver `evolutionStage?` en `specs/010`, sin bump); una colección nueva que necesita su propia clave primaria sí lo hace (ver `treasures`/`arcProgress` en `specs/012`, `userRank` en `specs/019`). El Almacén encaja en el segundo caso porque, a diferencia de todas las tablas singleton (`id: 1`) ya existentes, cada cápsula es una entidad independiente (no un contador ni un conjunto de flags).

**Alternatives considered**: Modelar el Almacén como un array `pendingCapsules: GachaCapsule[]` dentro de una fila singleton (`id: 1`, mismo patrón que `treasures.obtainedIds`) — descartado: cada cápsula necesita poder activarse/intercambiarse individualmente (removerse una entre varias del mismo `catId`), lo que una clave primaria real (`++id`) resuelve de forma más directa que manipular un array por índice; el volumen esperado de cápsulas pendientes (decenas, no miles) no justifica optimizar por el camino del array.

## Decisión 6 — Banners y tasas: reutilizar los 3 banners y costos ya documentados en el mockup y el manual técnico

**Decision**: `src/data/gacha.ts` define exactamente 3 `GachaBanner`: `uberfest` (Legendario 0.3% / Megarraro 9% / Superraro 26% / Raro 64.7%), `epicfest` (Megarraro 9% / Superraro 26% / Raro 65%, sin Legendario), `estandar` (Megarraro 5% / Superraro 15% / Raro 80%, sin Legendario) — mismos valores que `GACHA_BANNERS` del mockup (`docs/the-battle-cats-redesign/project/Battle Cats Modernizado.dc.html:972-974`) y consistentes con la tabla de tasas del manual técnico § 12.3. Costo: 150 de moneda de gacha por tirada simple, 1.500 por tirada x11 (FR-001/FR-002) — mismos valores en ambas fuentes.

**Rationale**: Ninguna de las dos fuentes de referencia (mockup, manual) contradice a la otra en estos números — reutilizarlos tal cual evita inventar un balance nuevo sin justificación y cumple SC-003 (±2pp sobre 1.000 tiradas simuladas) de forma directamente verificable contra una fuente documentada.

**Alternatives considered**: Diseñar tasas propias del proyecto — descartado: `spec.md` § Assumptions ya fija estos valores como "punto de partida", y no hay ninguna razón de balance específica de este proyecto (sin monetización real) que justifique desviarse.

## Decisión 7 — Nombre de la moneda de gacha: "Créditos de Cápsula" (no "Cat Food")

**Decision**: El campo de datos se llama `gachaCurrency`; la etiqueta de UI es "Créditos de Cápsula" (no el término "Cat Food" del juego original).

**Rationale**: El resto del proyecto ya evita los nombres literales de _The Battle Cats_ para conceptos propios reskineados (p. ej. "moneda" en vez de un nombre propio, "energía de misión" en vez de "Energy"/"Stamina" con marca) — mantiene consistencia con la identidad Cyber-Modern de `specs/021` y evita atar el nombre de un recurso de juego a una IP externa.

**Alternatives considered**: Reusar literalmente "Cat Food" (como en el mockup/manual) — descartado por consistencia de identidad visual/de marca ya establecida en el resto del proyecto.
