# Research: Guardado Local de Progreso

## 1. Mecanismo de persistencia

**Decision**: Archivo JSON (vía `UnityEngine.JsonUtility`) en `Application.persistentDataPath`, gestionado por un servicio dedicado (`LocalChapterProgressStore`) que recibe la ruta del archivo por constructor.

**Rationale**: Los datos son estructurados (una lista de registros por capítulo que crecerá con futuros capítulos, más un marcador de versión de formato para poder distinguir guardados antiguos — ver FR-009 y el edge case de formato no reconocido). Un archivo JSON con un objeto raíz tipado representa esa estructura de forma directa y es trivial de versionar (`formatVersion` como primer campo). Recibir la ruta por constructor (en vez de leer `Application.persistentDataPath` internamente) permite testear el servicio en EditMode contra un archivo temporal, sin tocar el guardado real del usuario ni depender del entorno de Unity Player.

**Alternatives considered**:
- `PlayerPrefs`: rechazado — es un almacén plano de claves string, adecuado para settings simples. Modelar una lista de capítulos ahí exigiría inventar convenciones de prefijo de clave (`chapter_1_completed`, `chapter_1_outcome`, ...) ad-hoc, sin lugar natural para un marcador de versión de formato, y sin forma limpia de "leer todo el guardado" para el edge case de corrupción.
- Base de datos embebida (SQLite, etc.): rechazado por YAGNI (Principio VI) — enorme sobre-ingeniería para un registro de completado por capítulo con un único slot de guardado.

## 2. Seguridad ante escritura/lectura fallida

**Decision**: Escritura atómica — se escribe primero a un archivo temporal (`progress.json.tmp`) y luego se reemplaza el archivo real (`File.Copy`/`File.Delete` o `File.Replace` según disponibilidad); la lectura envuelve el `JsonUtility.FromJson` en un `try/catch` y cualquier excepción (archivo ausente, JSON malformado, campos inesperados) se trata como "sin progreso guardado" — nunca se relanza ni bloquea el arranque.

**Rationale**: Cubre directamente FR-004 (sin guardado ⇒ sin error) y FR-005 (guardado corrupto ⇒ sin error) y el edge case de fallo de escritura (espacio en disco, etc. — la sesión sigue jugable, el intento de guardado simplemente no persiste). Escribir a un archivo temporal y reemplazar evita que un cierre abrupto a mitad de escritura dañe el único archivo de guardado existente.

**Alternatives considered**:
- Sobrescritura directa del archivo real: rechazado — si el proceso muere durante el `File.WriteAllText`, el archivo puede quedar truncado/corrupto, lo cual viola la garantía que FR-005 pide sostener.

## 3. Ubicación en la arquitectura (capas)

**Decision**: `ChapterProgressRecord` y `ProgressSaveData` (datos planos) más `IChapterProgressStore` (contrato) viven en `TheBattler.Model`, junto a `ChapterDefinition` cuyo `chapterId` reutilizan como clave. `LocalChapterProgressStore` (implementación con `System.IO`) vive en `TheBattler.Gameplay`, junto al resto del estado de runtime (`BattleResourceController`, etc.), y se inyecta en `BattleStateManager` en vez de que la orquestación de batalla acceda al sistema de archivos directamente.

**Rationale**: Sigue el mismo patrón de capas ya establecido para `IDeployable`/`IDialogueSequencePlayer` (contrato en Model, implementación e integración en Gameplay/View) y mantiene `TheBattler.Model` sin dependencias de `System.IO`, consistente con que hoy solo contiene datos y contratos. Inyectar el store permite testear `BattleStateManager` en PlayMode con un store falso (doble de test), sin tocar disco durante los tests.

**Alternatives considered**:
- Lógica de archivo directamente dentro de `BattleStateManager`: rechazado — acopla la orquestación de la batalla al mecanismo de persistencia concreto y complica testear ambas cosas por separado.

## 4. Punto de disparo del guardado

**Decision**: Enganchar el guardado al método existente `BattleStateManager.SetOutcome()` (o el punto inmediatamente posterior donde `EvaluateOutcome()` fija `CurrentOutcome` a `Victory`/`Defeat` por primera vez), llamando a `progressStore.Save(...)` ahí.

**Rationale**: Es el único lugar del código donde la batalla pasa a un resultado final — ya existe y ya se ejecuta exactamente una vez por resolución (ver el fix de tie-break de la feature 001). No hace falta ningún bus de eventos ni sistema de guardado nuevo; satisface FR-002 (guardado automático) con la mínima superficie de cambio.

**Alternatives considered**:
- Un `SaveManager` que sondea el estado de la batalla cada frame: rechazado por YAGNI — ya existe un punto de cambio de estado único y determinista.

## 5. Estrategia de testing

**Decision**: Tests EditMode puros para `LocalChapterProgressStore` (round-trip guardar→cargar, archivo ausente, archivo corrupto, `ClearProgress()`), usando una ruta de archivo temporal por test. Un test PlayMode (extensión del patrón de `BattleLoopPlayModeTests` de la feature 001) que verifica que resolver la batalla en Victoria invoca al store inyectado con el `chapterId` y el resultado correctos, usando un store falso en memoria como doble de test.

**Rationale**: Mismo split EditMode/PlayMode ya validado y en verde para el Capítulo 1; el servicio de guardado no necesita una escena para probarse (es C# puro + `System.IO`), mientras que la integración con `BattleStateManager` sí depende del ciclo de vida de Unity (`MonoBehaviour`), igual que el resto de esa clase.

**Alternatives considered**: Ninguna — es una continuación directa del patrón de testing ya establecido y verificado en la feature 001.
