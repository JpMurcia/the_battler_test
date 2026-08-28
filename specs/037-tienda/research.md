# Research: Tienda

## Decisión 1: Qué vende la Tienda — resuelto con el jugador antes de escribir la spec

**Decisión**: 2 secciones — Objetos de Batalla (specs/017) e Ítems de Evolución por gato (specs/010), ambas compradas con `currency`.

**Rationale**: El "Cat Food Shop" real (manual técnico §12) vende moneda premium con dinero real y ofertas de terceros — incompatible con Constitución § V (sin backend, sin pagos). En vez de omitir la spec o construir un sustituto arbitrario, se presentaron 3 alcances concretos al jugador vía pregunta directa (AskUserQuestion) antes de escribir el spec: (a) sumidero de moneda por objetos ya existentes, (b) solo recarga de energía de misión, (c) omitir la spec. Se eligió (a) por dar valor a 2 sistemas ya construidos y sin vía de compra directa.

**Hallazgo que refuerza la decisión**: durante la investigación se confirmó que `evolutionItems` (`useMetaStore`) no tiene ningún productor en todo el código — ni recompensa de nivel, ni tesoro, ni rango de usuario lo incrementa nunca (grep exhaustivo sin resultados fuera de la definición y su consumo en `evolveCat`). El mecanismo de verificación (`evolveCat` ya exige `evolutionItems[catId] >= requiredItemCount` para pasar a Forma Verdadera, specs/010) está completo y probado, pero es inalcanzable en la práctica en cuanto `requiredItemCount` sea mayor que 0 para cualquier gato. Hoy el catálogo de producción no exige ítems para ninguno de los 12 gatos con Forma Verdadera definida (`requiredItemCount` ausente = 0, así que evolucionan solo por nivel) — pero eso es una elección de balance del bootstrap ("valores de diseño provisionales, no balanceados"), no una garantía permanente. Esta spec no depende de que el balance actual cambie para tener valor: cierra por adelantado un hueco que de otro modo bloquearía silenciosamente cualquier futura pasada de balance que sí exigiera ítems, y en el ínterin ya funciona como un segundo sumidero de moneda verificable con datos de prueba dedicados (mismo criterio que los tests de `evolveCat` en `specs/010`, que tampoco dependen del catálogo de producción).

**Alternativas consideradas**: sustituto ficticio de Cat Food (moneda premium falsa, sin backend real de por medio): rechazado — introduciría una economía paralela sin ningún propósito real en un juego sin monetización, violando Simplicidad (Constitución § VII). Omitir la spec por completo: rechazada por el jugador al elegir la opción (a).

## Decisión 2: Precios en un módulo nuevo (`src/data/shop.ts`), no en `battleItems.ts`/`cats.ts`

**Decisión**: Los precios de Objetos de Batalla e ítems de evolución viven en `src/data/shop.ts`, un catálogo nuevo e independiente — no se añade un campo `price` a `BattleItem` (`src/data/battleItems.ts`) ni a `Cat`/`EvolutionFormData` (`src/data/cats.ts`).

**Rationale**: El precio de compra es un concepto de la economía de la Tienda, no una propiedad intrínseca del ítem de combate o del gato — mismo criterio de separación de conceptos que llevó a `src/data/baseUpgrades.ts`/`src/data/talents.ts` a vivir en sus propios módulos en vez de mezclarse con `cats.ts`. Mantiene `battleItems.ts` enfocado exclusivamente en la definición de combate del ítem (specs/017), sin acoplarlo a un sistema (la Tienda) que ni siquiera existía cuando se escribió.

**Alternativas consideradas**: añadir `price` directamente a `BattleItem`: rechazado por acoplar 2 conceptos independientes (definición de combate vs. economía de compra) en la misma interfaz, dificultando iterar uno sin tocar el otro.

## Decisión 3: Precio fijo, sin escalado — a diferencia de specs/031/specs/036

**Decisión**: Cada Objeto de Batalla tiene un precio fijo en `currency`; cada ítem de evolución tiene un único precio fijo aplicable a cualquier gato (`EVOLUTION_ITEM_PRICE`), sin crecer con la cantidad ya comprada.

**Rationale**: A diferencia de Mejoras de Base (specs/031) o Talentos (specs/036), donde el costo creciente desincentiva un nivel infinito, aquí ambas entidades ya tienen su propio techo natural: un ítem de evolución está topado por `requiredItemCount` del gato (FR-005), y un Objeto de Batalla no tiene ningún techo de diseño que un precio creciente deba proteger (es consumible, se gasta en cada batalla que se usa). Un precio fijo es la opción más simple sin perder ningún control de balance relevante (Constitución § VII).

## Decisión 4: Ubicación de la UI — panel nuevo del Hub, no dentro de `UnitDetailPanel`

**Decisión**: La Tienda es un nuevo `PanelId` (`'Shop'`) con su propio botón en el dock del Hub, mismo patrón que Misiones/Gamatoto/Ototo Corps (specs/033-035) — a diferencia de Talentos (specs/036), que vivía dentro de la ficha de un gato específico.

**Rationale**: A diferencia de Talentos (propiedad 1:1 de un gato), la Tienda vende Objetos de Batalla (sistema de cuenta, no por-unidad) e ítems de evolución para *cualquier* gato elegible a la vez (lista completa, no un gato preseleccionado) — el punto de entrada natural es un panel de sistema, no la ficha de un gato individual.

**Alternativas consideradas**: integrar la compra de ítems de evolución dentro de `UnitDetailPanel` (junto a Talentos): rechazado — obligaría a navegar gato por gato para comprar, cuando el flujo natural es "veo de un vistazo qué gatos necesitan ítems y compro para el que quiera" en una sola pantalla, igual que ya hace la Tienda real con su catálogo completo visible a la vez.
