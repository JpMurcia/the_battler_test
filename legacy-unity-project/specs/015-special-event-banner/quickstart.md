# Quickstart: Banner Especial de Eventos: "Etapas de Fantasía"

Validación manual end-to-end tras `/speckit-implement`. Requiere el Editor de Unity (no ejecutable en modo batch `-nographics`, mismo criterio que el resto de quickstarts del proyecto).

## Prerrequisitos

1. Abrir el proyecto en Unity 6000.3.20f1+.
2. Ejecutar, en orden: `The Battler > Build Adventure Map Content` (si no se corrió antes) y luego `The Battler > Build Special Event Banner Content` (nuevo, generado por esta feature).
3. Ejecutar `The Battler > Validate Special Event Banner Content` y confirmar que no reporta errores en Console.

## Paso 1 — El banner no aparece fuera de su ventana

1. Editar temporalmente `Assets/ScriptableObjects/Battler/Events/FantasyStagesEventBanner.asset` en el Inspector: dejar su única `EventTimeWindow` con `Start`/`End` en el pasado (ej. ayer).
2. Abrir `Assets/Scenes/AdventureMap.unity`, entrar en Play.
3. **Esperado**: el banner "Etapas de Fantasía" no aparece en la lista de banners (o aparece pero su botón "Select" no es interactuable — según la variante de FR-003 implementada).

## Paso 2 — El banner aparece y es jugable dentro de su ventana

1. Editar la misma `EventTimeWindow` a un rango que incluya la hora actual del equipo (ej. `now - 1h` a `now + 1h`).
2. Volver a Play en `AdventureMap.unity`.
3. **Esperado**: el banner aparece, es seleccionable. Con energía suficiente, seleccionarlo carga `SpecialEventMastodonHunt_Battle.unity`.
4. Confirmar que el diálogo pre-batalla se reproduce (Principio I) y que la batalla es jugable (desplegar unidades, oleada enemiga activa).

## Paso 3 — Energía insuficiente bloquea sin penalización

1. En `AdventureMap.unity`, con la ventana activa (Paso 2), gastar energía hasta quedar por debajo del `EnergyCost` del evento (jugando otras misiones o editando el save de energía).
2. Seleccionar el banner de evento.
3. **Esperado**: no navega, no se descuenta energía (comparar `CurrentEnergy` antes/después).

## Paso 4 — Recompensas al completar

1. Con la ventana activa y energía suficiente, entrar a la fase especial y ganar la batalla (destruir la base enemiga).
2. Volver al mapa.
3. **Esperado**: `PlayerProgressSaveData.availableExperience` aumentó en el `XpReward` configurado; `obtainedTreasureIds` contiene el `TreasureRewardId` del evento (primera vez).

## Paso 5 — Una batalla en curso no se interrumpe al cerrar la ventana

1. Con la ventana activa, entrar a la fase especial (sin terminarla).
2. Mientras la batalla está en curso, editar `FantasyStagesEventBanner.asset` para que la ventana ya haya expirado (ej. `End` = hace 1 minuto).
3. Continuar jugando la batalla ya cargada hasta victoria o derrota.
4. **Esperado**: la batalla se resuelve con normalidad (sin congelarse, sin volver forzosamente al mapa); si fue victoria, las recompensas del Paso 4 se otorgan igual.
5. Volver al mapa de aventuras: el banner de evento ya no aparece/es seleccionable (ventana expirada), consistente con el Paso 1.

## Paso 6 — Recurrencia (múltiples ventanas)

1. Añadir una segunda `EventTimeWindow` a `FantasyStagesEventBanner.asset` que cubra la hora actual, dejando la primera en el pasado.
2. Play en `AdventureMap.unity`.
3. **Esperado**: el banner aparece activo (la segunda ventana basta), sin ningún cambio de código — solo el dato agregado.

## Resultado esperado global

Los 6 pasos confirman FR-001 a FR-011 y SC-001 a SC-005 de [spec.md](./spec.md) sobre contenido real, no solo sobre dobles de prueba (esos ya se cubren por EditMode/PlayMode tests, ver tasks.md).
