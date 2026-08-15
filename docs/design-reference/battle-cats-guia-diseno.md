# Guía de Diseño: Sincronización de Balance 'The Battle Cats' vs. 'the_battler_test' (Spec 013)

Esta documentación técnica establece los parámetros de ingeniería reversa y las especificaciones de arquitectura para la implementación de la saga "Imperio de los Gatos" (EoC) en el motor *the_battler_test*. El objetivo es garantizar la paridad sistémica con los datos de balance originales mediante estructuras de datos desacopladas y lógica de escalamiento en tiempo de ejecución.

### 1. Análisis de Multiplicadores por Capítulo (EoC Saga)

El sistema utiliza multiplicadores globales que el `BattleResourceController` aplica dinámicamente a los `UnitDefinition` y `EnemyDefinition` sin mutar los assets base.

| Capítulo | Multiplicador de Costo (Unidades) | Multiplicador de Fuerza Enemiga |
| :--- | :--- | :--- |
| **1: Levantamiento Felino** | -33.3% ($50 vs. $75 base) | 100% |
| **2: Imperio de Oscuridad** | 0% (Costo nominal / +50% vs Cap 1) | 150% |
| **3: El Renacer del Gato Bégimo** | +33.3% ($100 vs. $75 base) | 400% |

**Especificaciones de Implementación (FR-001 a FR-003):**
*   **Lógica de Redondeo:** Para evitar inconsistencias de moneda en punto flotante, el sistema debe utilizar `Mathf.RoundToInt` (o equivalente en C#) tras aplicar el multiplicador. Por ejemplo, en el Capítulo 1, el cálculo para una unidad de $75 es `Round(75 * 0.667) = 50`.
*   **Escalamiento en Runtime:** Los multiplicadores son "Battle-Only". El `EnemyGenerator` debe inyectar el factor de fuerza (HP y Atk) al instanciar la entidad, asegurando que los datos persistentes del ScriptableObject permanezcan inalterados.

### 2. Dinámica de Niveles y Umbrales de Vida de Base

La arquitectura del nivel debe soportar el rastreo de estados persistentes durante la batalla para gestionar eventos disparados por umbrales de salud de la base enemiga (**FR-006**).

#### Corea
*   **Base HP:** 500 (Cap. 1) / 1,000 (Cap. 2) / 1,500 (Cap. 3).
*   **Disparador de Refuerzos:** Activación única (Single-fire logic) al alcanzar el **50% de HP**.
*   **Configuración de Oleada:** Genera 8 Chuchos. El intervalo de instanciación está sujeto a una dependencia de frame-rate de **30fps** (1 segundo 30f), lo que se traduce técnicamente en un `spawnInterval` de 1.5s o 45 frames fijos.

#### Mongolia
*   **Base HP:** 1,000 (Cap. 1) / 2,000 (Cap. 2) / 3,000 (Cap. 3).
*   **Disparador de Refuerzos:** Activación única al alcanzar el **50% de HP**.
*   **Configuración de Oleada:** Genera 4 Serpis con un intervalo variable de entre 1 y 2 segundos (30f a 60f).

**Lógica de Estado:** Cada `ChapterDefinition` debe contener un booleano `hasTriggered` por cada umbral configurado para prevenir disparos múltiples si la salud de la base fluctúa o si un solo impacto masivo cruza múltiples umbrales simultáneamente.

### 3. Restricciones de Campo y Escalamiento de Dificultad

Para optimizar el rendimiento del carril y el ritmo de combate, se implementa una "Lógica de Retención" (**FR-007**).

*   **Límites de Población (MaxSimultaneousEnemies):**
    *   **Corea:** 3 unidades.
    *   **Mongolia:** 4 unidades.
*   **Dimensiones del Nivel:** El ancho estándar se define como una constante de **3,600 unidades** para garantizar la consistencia visual de las cámaras Cinemachine.

**Arquitectura del Generador:** Si `currentEnemyCount >= MaxSimultaneousEnemies`, el `EnemyGenerator` debe pausar el timer de la oleada actual o encolar la unidad. La generación se reanuda inmediatamente en el siguiente tick lógico tras la destrucción de una unidad enemiga en campo.

### 4. Economía del Jugador: Energía, XP y Regeneración

| Nivel | Energía (Cap. 1/2/3) | Recompensa base XP |
| :--- | :--- | :--- |
| **Corea** | 5 / 15 / 25 | 1,000 XP |
| **Mongolia** | 5 / 15 / 25 | 1,300 XP |

**Optimización de Tasa de Flujo (FR-012):** La mejora de regeneración de dinero en batalla actúa como un modificador directo sobre el `TickRate` del `BattleResourceController`. A diferencia de las mejoras pasivas de cuenta, este es un multiplicador volátil que solo persiste durante la sesión de combate actual, permitiendo una profundidad táctica de gestión de recursos macro en tiempo real.

### 5. Sistema de Tesoros y Progresión de Capítulo

La progresión se gestiona mediante el `ProgressSaveData` para rastrear hitos de desbloqueo y coleccionables.

*   **Estructura de Tesoros (Set: Energy Drink):**
    *   Corea: Kimchi.
    *   Mongolia: Tienda de campaña.
*   **Desbloqueo de Primera Victoria (FR-009):** Tras superar Corea (Cap. 1), el **Gato Defensor** no se añade al inventario activo, sino que se marca con el flag `IsPurchasable = true` en el Menú de Mejorar. El jugador debe adquirirlo formalmente para desplegarlo.
*   **Hitos de Finalización:**
    *   **Capítulo 1:** Prerrequisito para la saga "Hacia el Futuro" (ItF). Desbloquea a Moneko.
    *   **Capítulo 2 (FR-018):** Incrementa el `MaxUnitLevel` a 20. Desbloquea a Gata Valquiria.
    *   **Capítulo 3 (FR-005):** Habilita el Sistema de Frutas y desbloquea al Gato Bégimo.

### 6. Mecánicas Especiales y Brotes Zombi

#### Gatorreta (FR-010 y FR-011)
El sistema de defensa de la base requiere una activación **estrictamente manual** por parte del jugador. Técnicamente, se define por:
*   **Daño de Área (AOE):** Aplicación de daño radial instantáneo a todas las entidades enemigas dentro del `AttackRange` de la torre.
*   **Reset de Timer:** El temporizador de recarga se inicializa a cero tras la ejecución exitosa del evento de disparo, ignorando inputs adicionales durante el estado de enfriamiento.

#### Brotes Zombi (FR-013 a FR-015)
Este modo altera el `EnemyPool` del nivel mediante un sistema de reemplazo de elenco:
*   **Variantes Detectadas:** Reemplazo de Chucho por **Chucho Z.**, Serpi por **Zerpi**, y adición de **Kodrizzz**.
*   **Supresión de Jefes (FR-014):** Si el nivel original tiene un jefe programado, el flag `isBossActive` se fuerza a `false`. La condición de victoria se limita exclusivamente a la reducción de HP de la base enemiga a cero.

### 7. Recomendaciones de Mecánicas: Gap Analysis (Wiki vs. Spec)

Para futuras iteraciones de la arquitectura de datos, se recomiendan las siguientes implementaciones basadas en el contraste de fuentes:

*   **Sistema de Rarezas (FR-017):** Implementar en la UI del Dashboard las siete categorías de clasificación: **Normal, Especial, Raro, Superraro, Megarraro, Legendario y Colaboración**.
*   **Identificación de Jefes (FR-004):** Añadir un flag `isBossLevel` en la `ChapterDefinition`. Cuando sea verdadero, el sistema debe disparar un evento de UI (Alert) y cambiar el track de audio a la variante de jefe (Careto, Nyandam o Profe Bun Bun).
*   **Tutoriales Narrativos (Principio I):** Siguiendo el principio de **Narrativa Integrada**, los diálogos instructivos detectados en Corea deben implementarse estrictamente en formato de novela visual (Portrait + Text) mediante el sistema de Timeline, evitando el uso de pop-ups de texto plano.