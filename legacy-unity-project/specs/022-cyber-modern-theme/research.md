# Research: Sistema Visual Cyber-Modern — Tema Compartido y Reskin de Menú Principal

## §1. Adquisición de DOTween

**Decision**: DOTween (versión gratuita, Demigiant) se añade como paso manual de configuración — el usuario lo importa una sola vez desde el Unity Asset Store (canal oficial de distribución) dentro del propio Editor, antes de la primera tarea que lo use. No se descarga ni se referencia ningún paquete/URL desde este pipeline automatizado.

**Rationale**: Demigiant no publica DOTween en el registro UPM por defecto de Unity ni en un repositorio git oficial instalable vía `manifest.json`; su único canal de distribución oficial es el Asset Store (o el `.unitypackage` firmado desde `dotween.demigiant.com`), ambos flujos que requieren interacción autenticada con la ventana del Editor — no son automatizables por edición de archivos ni por este agente. Descargar un paquete desde una fuente no verificada por mí (p. ej. un mirror de terceros en GitHub) introduciría riesgo de cadena de suministro innecesario para una dependencia puramente cosmética; además, las reglas de este entorno exigen permiso explícito del usuario en el momento de cualquier descarga de archivo, así que de todos modos no puede resolverse por adelantado en esta fase de planificación.

**Alternatives considered**:
- Mirror de terceros en GitHub instalable vía `manifest.json` con URL git — rechazado: no hay forma de verificar que un mirror no oficial coincide con la distribución real de Demigiant; riesgo de cadena de suministro sin necesidad real (research.md relacionado: Complexity Tracking en plan.md ya justifica la dependencia en sí).
- Volver a la alternativa "0 dependencias nuevas" (corrutinas a mano) — ya evaluada y descartada explícitamente durante el brainstorming previo a esta spec (ver spec.md Assumptions); no se reabre aquí.

**Task-level consequence**: `tasks.md` debe incluir un paso de Setup explícito ("confirmar que DOTween está importado en el proyecto, o pedir permiso al usuario para guiarlo por el Asset Store") ANTES de cualquier tarea que escriba código que referencie `DG.Tweening`.

## §2. Adquisición de la fuente Inter

**Decision**: Se importa "Inter" (Google Fonts, licencia SIL Open Font License 1.1 — uso comercial libre) como TMP Font Asset, igual que ya se hizo con Orbitron. La descarga del archivo fuente (.ttf/.zip desde fonts.google.com, el origen oficial) requiere permiso explícito del usuario en el momento de ejecutarse — no se descarga durante esta fase de planificación.

**Rationale**: A diferencia de Orbitron (ya presente en `Assets/Mod Assets/Mod Resources/Fonts/`, sin uso), no existe ningún archivo de Inter en el repositorio — hay que traerlo de una fuente externa. Es un archivo pequeño, de origen oficial e inequívoco (Google Fonts), y su licencia permite uso comercial sin restricción, pero las reglas de este entorno tratan toda descarga de archivo como una acción que requiere confirmación explícita en el chat, sin importar cuán benigna — no se generaliza el permiso ya dado para el diseño de esta spec a la acción concreta de descargar.

**Alternatives considered**:
- Reutilizar "Raleway" (ya importado en `Assets/Mod Assets/Mod Resources/Fonts/`, sin uso) en vez de Inter, evitando la descarga por completo — descartado como decisión unilateral: el usuario ya aprobó explícitamente "Inter" como fuente de cuerpo durante el brainstorming de esta spec (referenciando el mockup original); sustituirla en silencio por otra tipografía sería una desviación de diseño no autorizada. Se documenta como alternativa disponible por si el usuario prefiere evitar la descarga al ejecutar `tasks.md`.

**Task-level consequence**: `tasks.md` debe incluir un paso de Setup explícito que pida permiso antes de descargar el archivo de Inter (nombre, origen `fonts.google.com`, tamaño aproximado), con la sustitución por "Raleway" ya importado como opción de respaldo si el usuario prefiere no descargar nada nuevo.

## §3. Paneles "glass" y resplandor sin blur en tiempo real

**Decision**: Los dos sprites necesarios (panel 9-slice semitransparente con borde suave, y glow radial) se generan procedimentalmente con un script de Editor nuevo (`Assets/Editor/Battler/UIThemeSpriteGenerator.cs`) que construye un `Texture2D` en memoria, lo codifica a PNG (`ImageConversion.EncodeToPNG`) y lo escribe directamente bajo `Assets/Sprites/Battler/UI/`, configurando después su `TextureImporter` (tipo Sprite, modo 9-slice para el panel). Cero descargas externas.

**Rationale**: Mismo patrón ya establecido por el proyecto de generar contenido vía herramienta de Editor en C# (`EmpireOfCatsContentBuilder.cs` ya autora ScriptableObjects/escenas de forma procedimental) — aplicarlo a texturas simples es una extensión natural y evita cualquier necesidad de descarga de assets de arte de terceros para un efecto puramente geométrico (gradiente radial, rectángulo redondeado con alfa).

**Alternatives considered**:
- Shader personalizado de blur en tiempo real (Renderer Feature de URP) — rechazado en el brainstorming previo a esta spec por coste de GPU en gama baja (spec.md FR-005).
- Descargar sprites de glass/glow ya hechos de algún asset pack — rechazado: requiere permiso de descarga y evaluación de licencia sin necesidad real, cuando un gradiente radial y un rectángulo redondeado son trivialmente generables por código.

## §4. Arquitectura de consumo del tema: componentes hermanos, no modificación de controllers

**Decision**: `ThemedGlassPanel`, `ThemedAccentButton` y `ThemedGlowIcon` son `MonoBehaviour`s independientes y pequeños que se añaden como componentes **adicionales** sobre GameObjects ya existentes en `MainMenu.unity` (p. ej. el mismo GameObject `StartButton` recibe un `ThemedAccentButton` además de su `Button` ya existente), cada uno con su propia referencia serializada a `UIThemeCatalog`. Ninguno depende de `MainMenuUIController`/`SettingsPanelController`/`MainMenuFlowController` ni viceversa.

**Rationale**: `MainMenuFlowPlayModeTests.cs` (existente, 9 tests) cubre el contrato funcional completo de esos tres scripts vía acceso directo a campos privados por reflexión (`m_ProgressStore`, `m_SceneNavigator`, `m_SettingsStore`) y a su API pública. Cualquier cambio de firma, aunque sea aditivo, es una superficie de riesgo evitable. Al vivir en componentes hermanos completamente nuevos, esta spec logra "cero cambios a esos tres archivos" en vez de "cambios cuidadosos y no disruptivos" — la garantía más fuerte posible de no-regresión, y además el patrón exacto que las specs futuras de esta iniciativa (Hub, Mapa, etc.) podrán replicar sin tocar sus propios controllers tampoco.

**Alternatives considered**:
- Añadir `[SerializeField] UIThemeCatalog m_Theme` directamente a `MainMenuUIController`/`SettingsPanelController` y aplicar estilo en su `Awake()` — rechazado: cambia esos archivos (aunque de forma aditiva), y acopla lógica de presentación visual a controllers que hoy son puramente de wiring/flujo — mezclaría dos responsabilidades que hoy están limpiamente separadas.

## §5. Fallback ante referencia de fuente faltante (spec.md Edge Cases)

**Decision**: Si `UIThemeCatalog.BodyFont`/`HeadingFont` queda sin asignar en el Inspector, los componentes `Themed*` no sobreescriben el `TMP_FontAsset` del `TMP_Text` afectado (dejan el que ya esté puesto en la escena — hoy, `LiberationSans SDF`), en vez de lanzar una excepción o dejar el texto en blanco. Es el mismo criterio de "fallback silencioso, nunca excepción no controlada" ya usado por `LocalizedTextTable`/`LocalizedTextBinder` ante una clave no encontrada.

**Rationale**: Consistencia con el manejo de errores ya establecido en `View`; una fuente faltante es un error de autoría de contenido (Inspector), no una condición excepcional en tiempo de ejecución — no debe poder romper la escena.

## §6. Testing

**Decision**: `UIThemeCatalogTests.cs` (EditMode, nuevo) cubre: valores por defecto razonables al crear una instancia vacía, y que un `TMP_FontAsset`/color sin asignar no lanza excepción al leerse. `MainMenuFlowPlayModeTests.cs` (existente) se ejecuta sin modificarse como prueba de regresión — su verde continuo es en sí mismo la evidencia de que el reskin no tocó comportamiento. No se añade ningún PlayMode test nuevo para los componentes `Themed*` en sí (aplican estilo visual puro, sin lógica condicional que valga la pena cubrir con test automatizado más allá de "no lanza excepción con `UIThemeCatalog` nulo/incompleto", ya cubierto en EditMode) — la verificación visual real es responsabilidad de `quickstart.md` (comparación manual contra el mockup de referencia), mismo criterio ya usado en specs 013-021 para todo lo perceptual.
