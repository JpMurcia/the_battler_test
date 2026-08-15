# Phase 0 Research: Capítulo 1 — Vertical Slice Jugable

No quedaron marcadores `NEEDS CLARIFICATION` en el Technical Context del plan (la constitución ya fija motor, lenguaje y pipeline). Esta investigación cubre decisiones de patrón/arquitectura necesarias para bajar la spec a un diseño técnico concreto en Unity.

## 1. Arquitectura de unidades data-driven

**Decision**: Cada unidad se define con dos partes separadas: un ScriptableObject `UnitDefinition` (datos: coste, cooldown, salud, daño, rango, referencias a Animator Controller y a la variante visual) y un prefab `UnitRuntime` (MonoBehaviour) que lee esa definición al instanciarse y ejecuta el comportamiento autónomo (mover por el carril, detectar objetivo en rango, atacar, reproducir animaciones).

**Rationale**: Cumple el Principio V (Balance Dirigido por Datos) de forma directa — un diseñador ajusta stats sin tocar C#. Separar "definición" de "instancia runtime" es el patrón estándar en Unity para unidades reutilizables (equivalente a cómo Battle Cats/otros auto-battlers separan "unit data" de "unit behaviour").

**Alternatives considered**:
- *Hardcodear stats en subclases de MonoBehaviour por unidad*: rechazado, viola el Principio V explícitamente y obliga a recompilar para balancear.
- *Un único ScriptableObject "God Object" para toda la configuración del capítulo*: rechazado, dificulta reutilizar `UnitDefinition` en capítulos futuros y mezcla responsabilidades (unidad vs. capítulo).

## 2. Amenaza del bando enemigo

**Decision**: `EnemyWaveDefinition` (ScriptableObject) describe una lista de entradas `(tiempo de spawn, UnitDefinition enemigo, punto de carril)`. Un `EnemyWaveSpawner` en runtime recorre esa lista contra un timer de batalla y spawnea instancias `UnitRuntime` del lado enemigo, reutilizando la misma clase runtime que las unidades del jugador (solo cambia el "bando"/team).

**Rationale**: Evita construir una IA de decisión para el enemigo (fuera de alcance de esta slice, ver Assumptions de spec.md) mientras genera desafío real y ajustable por datos. Reutilizar `UnitRuntime` para ambos bandos evita duplicar lógica de movimiento/ataque/animación.

**Alternatives considered**:
- *IA enemiga que "decide" qué desplegar y cuándo, simétrica al jugador*: rechazado por complejidad innecesaria para un MVP (Principio VI); se puede añadir en una iteración futura sin romper el modelo de datos actual (bastaría con generar `EnemyWaveDefinition` dinámicamente).
- *Enemigo puramente estático (solo torre, sin unidades)*: rechazado porque reduce el combate a "esperar", contradice el loop descrito en la constitución donde ambos lados tienen presencia en el carril.

## 3. Sistema de diálogo pre/post-batalla

**Decision**: Cada línea de diálogo es un `DialogueLine` (ScriptableObject: retrato, nombre de hablante, texto). Una secuencia (`ChapterDefinition.PreBattleDialogue` / `PostBattleDialogue`) es una lista ordenada de `DialogueLine`. La reproducción usa un Timeline simple con un Signal Track que avanza línea a línea (o avanza por input del jugador), renderizando retrato + texto vía TextMeshPro en un Canvas dedicado (`DialoguePlaybackController`).

**Rationale**: Cumple el Principio I (formato retrato + texto + Timeline, no texto plano) usando las dependencias ya fijadas en la constitución (Timeline, TextMeshPro) sin introducir un plugin de diálogo externo, consistente con Principio VI (simplicidad).

**Alternatives considered**:
- *Texto plano en un `Debug.Log`/UI mínima sin retrato*: rechazado, viola el Principio I explícitamente.
- *Plugin de terceros de dialogue-tree (Ink, Yarn Spinner, etc.)*: rechazado para esta slice — añade una dependencia no listada en Restricciones Técnicas y resuelve ramificación de diálogo que esta slice no necesita (diálogo lineal pre/post, sin decisiones del jugador).

## 4. Input de despliegue de unidades

**Decision**: `DeploymentUIController` usa el paquete `com.unity.inputsystem` para capturar el tap/click sobre los botones de las 5 unidades (Action Map dedicado a batalla), habilitando/deshabilitando visualmente cada botón según coste disponible y cooldown restante.

**Rationale**: La constitución fija Input System como dependencia obligatoria; usarlo también para UI (no solo movimiento) mantiene una única fuente de input en el proyecto.

**Alternatives considered**:
- *Input Manager legacy de Unity (`UnityEngine.Input`)*: rechazado, contradice la Restricción Técnica explícita del Input System.

## 5. Estrategia de testing

**Decision**: EditMode tests validan datos (`UnitDefinition`/`EnemyWaveDefinition` con coste/cooldown/daño en rangos válidos, sin referencias nulas a animación) y lógica pura sin depender de MonoBehaviours (cálculo de acumulación de recurso, resolución de victoria/derrota dado un par de valores de salud). PlayMode tests cubren el loop completo (spawnear escena mínima, simular acumulación de recurso, desplegar, verificar cooldown, verificar condición de fin de partida) descrito en User Story 1.

**Rationale**: Separar validación de datos (rápida, sin escena) de validación de comportamiento (necesita PlayMode) sigue la práctica estándar de Unity Test Framework y da cobertura directa a los criterios de aceptación Given/When/Then de la spec.

**Alternatives considered**:
- *Solo pruebas manuales en el Editor*: rechazado, no es verificable de forma repetible ni sirve como gate de `/speckit.tasks` → `/speckit.implement`.
