# Quickstart: Sistema de Gacha Completo ("Cápsula de Gatos")

Guía de validación manual/automatizada — no repite el detalle de diseño ya cubierto en `data-model.md`/`research.md`.

## Prerrequisitos

```bash
npm install
npm run dev
```

Sin variables de entorno ni backend — todo corre en el navegador (IndexedDB local vía Dexie).

## 1. Validación de distribución de probabilidad (SC-003)

```bash
npx vitest run tests/unit/data/gacha.test.ts
```

Debe incluir un test que ejecute `rollMany(UBERFEST_BANNER, 1000, seededRandom)` y confirme que la proporción observada de cada rareza cae dentro de ±2 puntos porcentuales de `banner.odds` — mismo criterio que SC-003 de `spec.md`. Repetir para al menos un segundo banner (`estandar`) para cubrir el caso sin `Legendario`.

## 2. Tirada simple → Almacén (US1)

1. `npm run dev`, navegar Título → Menú Principal → "Gacha".
2. Confirmar que se ve el desglose de tasas del banner activo (suman 100%) antes de tirar.
3. Con `gachaCurrency` inicial insuficiente (0 al arrancar una partida nueva): confirmar que "Tirada Simple" está deshabilitada o rechaza sin descontar nada (FR-004).
4. Otorgar `gachaCurrency` de prueba (vía consola de dev o un ajuste temporal de `ensureDefaultProfile` para el smoke test) y repetir la tirada: confirmar animación de revelado con color distinto según rareza, y que la cápsula aparece en la pestaña "Almacén" — **no** en `ownedCats` todavía.
5. Confirmar en `TeamScreen`/`BattleScreen` que el gato de la cápsula recién obtenida **no** aparece como seleccionable/desplegable (FR-010, SC-005).

## 3. Activar una cápsula nueva (US3)

1. Desde la pestaña "Almacén", activar la cápsula del paso anterior.
2. Confirmar que el gato aparece de inmediato en `CatGuideScreen`, es seleccionable en `TeamScreen` y desplegable en una batalla — mismo comportamiento que cualquier gato obtenido por otro camino (SC-004).

## 4. Tirada x11 (US4)

```bash
npx vitest run tests/unit/GachaScreen.test.tsx
```

Con saldo suficiente para `1.500`, confirmar que una tirada x11 deposita exactamente 11 cápsulas en el Almacén y que la pantalla de revelado muestra los 11 resultados en una sola vista (SC-002).

## 5. Duplicado — nivel "+" vs. intercambio (US6)

1. Con un gato ya poseído (p. ej. el gato inicial garantizado), forzar (vía test o tirada repetida) una cápsula del mismo `catId`.
2. Activarla desde el Almacén: confirmar que `ownedCats[catId].plusLevel` sube en 1, que **no** aparece una segunda entrada de ese `catId`, y que `characterLevelOf`/Rango de Usuario refleja el incremento.
3. Con una segunda cápsula duplicada, elegir "Intercambiar por XP" en vez de activar: confirmar que `currency` sube y la cápsula desaparece del Almacén sin afectar `plusLevel`.
4. Con una cápsula duplicada de rareza `Megarraro`/`Legendario`, confirmar que además de "Intercambiar por XP" aparece la opción "Intercambiar por NP", y que elegirla suma a `npCurrency` en vez de a `currency` (FR-009).

## 6. Persistencia (SC-007)

1. Con al menos una cápsula pendiente en el Almacén y saldo de `gachaCurrency`/`npCurrency` distinto de cero, recargar la página (F5).
2. Confirmar que el Almacén, `gachaCurrency` y `npCurrency` sobreviven la recarga — misma garantía que el resto del progreso (Dexie/IndexedDB).

## 7. Suite completa y cero regresiones (SC-008)

```bash
npx tsc -b
npm test
npm run lint
npm run build
```

Las 4 deben terminar sin errores; `npm test` debe seguir reportando en verde las 23 specs previas (`001`-`023`) además de las suites nuevas de esta spec.
