# Feature Specification: Sistema Visual Cyber-Modern — Tema Compartido y Reskin de Menú Principal

**Feature Branch**: `022-cyber-modern-theme`

**Created**: 2026-08-06

**Status**: Draft

**Input**: User description: "Sistema visual \"Cyber-Modern\" de \"The Battler\": crear un ScriptableObject de tema compartido (UIThemeCatalog — colores de acento cian/naranja/púrpura, gradientes, radios de esquina, referencias a fuentes) en Assets/ScriptableObjects/Battler/UI/, como base reutilizable para futuras pantallas, y aplicar el primer reskin visual sobre la pantalla de Título/Menú Principal ya existente (003-main-menu-config: MainMenuUIController, SettingsPanelController, MainMenuFlowController), sin cambiar su contrato funcional (Start/Continue si hay progreso guardado/Settings). Estilo de referencia: mockup \"Battle Cats Modernizado\" (proyecto Claude Design, iOS device frame, paneles tipo glass aproximados con sprites 9-slice semitransparentes en vez de blur real, glow mediante sprite de gradiente radial detrás de iconos/botones, tipografía Orbitron —ya importada sin usar— para títulos/botones + Inter nueva —a importar como TMP Font Asset— para cuerpo/labels, animaciones de pulso/fade vía DOTween como única dependencia nueva del proyecto, sin librería de blur/shader). Fuera de alcance explícito: el widget de \"código de respaldo de partida\" y el \"buzón de noticias\" del mockup, y cualquier otra pantalla del mockup (Hub, Mapa de Etapas, Batalla, Equipar, Mejorar, Biblioteca, Perfil, Cápsula/Gacha) — quedan para specs posteriores que reutilizarán este mismo UIThemeCatalog."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver el Menú Principal con la nueva identidad visual (Priority: P1)

Un jugador abre el juego y ve la pantalla de Título/Menú Principal con la nueva estética "cyber-modern" (paneles oscuros con acentos de color, resplandor sutil, tipografía distintiva) en vez del menú blanco sin estilizar actual. Los botones "Jugar", "Continuar" (si aplica) y "Ajustes" siguen funcionando exactamente igual que antes del reskin.

**Why this priority**: Es el objetivo central y único resultado visible de esta spec — sin esto no hay ningún cambio perceptible para el jugador.

**Independent Test**: Abrir `MainMenu.unity` en el Editor o en build, y confirmar visualmente que la pantalla usa el nuevo tema, sin ninguna regresión en el flujo Start/Continue/Settings ya cubierto por la spec `003-main-menu-config`.

**Acceptance Scenarios**:

1. **Given** el juego arranca sin progreso guardado, **When** se muestra el Menú Principal, **Then** se ve con el nuevo estilo visual y solo el botón "Jugar" está visible (sin "Continuar"), igual que en el comportamiento actual.
2. **Given** existe progreso guardado, **When** se muestra el Menú Principal, **Then** aparecen los botones "Jugar" y "Continuar" con el nuevo estilo, y pulsar cada uno dispara exactamente el mismo destino que antes del reskin.
3. **Given** el jugador pulsa "Ajustes", **When** se abre el panel de configuración, **Then** el panel (sliders de audio, selector de idioma, Aplicar/Cerrar) se ve con el nuevo tema y conserva su comportamiento actual de cambios pendientes vs. confirmados.

---

### User Story 2 - Reutilizar el tema visual sin duplicar valores (Priority: P2)

Quien construya la siguiente pantalla rediseñada de esta iniciativa (Hub, Mapa de Etapas, etc., en specs futuras) puede tomar colores, fuentes y radios desde un único asset central en lugar de volver a definir los mismos valores por pantalla.

**Why this priority**: Es el habilitador de todas las specs siguientes de esta iniciativa de rediseño; sin un catálogo compartido, cada pantalla futura repetiría (y con el tiempo desincronizaría) los mismos valores visuales.

**Independent Test**: Abrir el asset `UIThemeCatalog` en el Editor y confirmar que expone todos los valores usados por el Menú Principal (colores de acento, gradiente, radios, referencias de fuente); cambiar un valor en el asset y confirmar que el Menú Principal lo refleja sin tocar código.

**Acceptance Scenarios**:

1. **Given** el asset `UIThemeCatalog` existe con valores de acento cian/naranja/púrpura, **When** el Menú Principal se renderiza, **Then** usa esos valores en vez de colores fijados por componente.
2. **Given** alguien cambia un color de acento en el asset, **When** vuelve a abrir la escena, **Then** el cambio se refleja en el Menú Principal sin recompilar código.

---

### Edge Cases

- ¿Qué pasa si falta alguna referencia en `UIThemeCatalog` (p. ej. la fuente Inter sin asignar)? El sistema debe degradar a un fallback razonable (fuente de respaldo de TMP) sin romper la escena ni lanzar una excepción no controlada.
- ¿Qué pasa con las animaciones cosméticas (pulso, fade) en dispositivos de gama baja? No deben bloquear la interacción — si la animación no llega a reproducirse con fluidez, los botones deben seguir siendo pulsables con normalidad.
- ¿Qué pasa con jugadores que ya tienen progreso guardado antes de este cambio? El reskin es una capa puramente visual — no debe alterar el guardado local ni el flujo de progreso ya cubierto por `002-local-save-progress`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE proveer un asset de datos centralizado ("catálogo de tema") con los colores de acento, el gradiente primario, los radios de esquina y las referencias de fuente usados por el Menú Principal, siguiendo el mismo patrón de datos-en-ScriptableObject ya usado en el resto del proyecto (nunca hardcodeado por componente individual).
- **FR-002**: La pantalla de Menú Principal (Título) DEBE mostrar el nuevo estilo visual (paneles, botones, tipografía) sin alterar su comportamiento funcional actual: visibilidad condicional de "Continuar" según progreso guardado, y el mismo destino de navegación de "Jugar"/"Continuar" que existe hoy.
- **FR-003**: El panel de Ajustes DEBE mostrar el nuevo estilo visual conservando exactamente su comportamiento actual (sliders de audio, selector de idioma, patrón de cambios pendientes vs. confirmados al Aplicar/Cerrar).
- **FR-004**: El sistema DEBE usar la tipografía Orbitron (ya presente en el proyecto) para títulos y texto de botones, y DEBE incorporar una tipografía nueva (Inter) para texto de cuerpo/etiquetas.
- **FR-005**: Los efectos visuales de tipo "cristal"/resplandor DEBEN aproximarse mediante sprites (paneles semitransparentes, gradientes radiales) en lugar de efectos de desenfoque en tiempo real, para mantener bajo el coste de rendimiento en dispositivos móviles de gama baja.
- **FR-006**: Las animaciones cosméticas (pulso del botón principal, aparición de paneles) DEBEN implementarse con una única librería de animación (tweening) compartida por todo el proyecto, en vez de mecanismos distintos por pantalla.
- **FR-007**: El sistema NO DEBE incluir el widget de "código de respaldo de partida" ni el "buzón de noticias" presentes en el mockup de referencia — quedan fuera de alcance de esta spec.
- **FR-008**: El sistema NO DEBE modificar ninguna otra pantalla del juego (Hub/Base del jugador, Mapa de Etapas, Batalla, Equipar, Mejorar, Biblioteca, Perfil) — el alcance visual de esta spec se limita al Menú Principal y su panel de Ajustes.

### Key Entities *(include if feature involves data)*

- **UIThemeCatalog**: representa el tema visual compartido del proyecto — colores de acento, gradiente primario, radios de esquina y referencias a las fuentes de título/cuerpo. Es un catálogo de datos de estilo, sin lógica de comportamiento; las pantallas lo consultan pero no lo modifican en tiempo de ejecución.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un jugador que abre el Menú Principal ve una pantalla visualmente distinta a la actual (paneles oscuros con acentos de color, tipografía distintiva) sin ninguna pérdida de funcionalidad respecto al menú anterior — verificado por comparación manual contra el mockup de referencia vía `quickstart.md`, mismo criterio ya usado en las specs 013-021 para verificación perceptual/GUI.
- **SC-002**: El 100% de los valores de color/fuente/radio de los elementos themeados por esta spec (paneles, botones y texto del Menú Principal y su panel de Ajustes) provienen del catálogo de tema compartido — cero valores de estilo fijados por componente individual dentro de ese alcance. Los controles nativos de Unity del panel de Ajustes (handle/fill del slider, flecha/fondo del dropdown de idioma) quedan con su apariencia por defecto — el mockup de referencia no incluye ninguna pantalla equivalente a "Ajustes", así que no hay un objetivo visual concreto para ellos; restyling esos controles queda fuera de alcance hasta que exista esa referencia.
- **SC-003**: Las suites de test existentes (EditMode + PlayMode, specs 001-021) siguen en verde tras el cambio — cero regresión funcional.
- **SC-004**: Cualquier color de acento del tema puede ajustarse editando un único asset, sin tocar código.

## Assumptions

- El resultado final no necesita replicar literalmente el mockup "Battle Cats Modernizado" (construido en CSS/React) píxel a píxel — se adapta a las capacidades y convenciones de uGUI + TextMeshPro ya establecidas en el proyecto; esta spec fija la interpretación Unity de ese lenguaje visual, no una copia exacta.
- La tipografía "Inter" (Google Fonts, licencia Open Font License) puede importarse libremente al proyecto como TMP Font Asset, igual que ya se hizo con Orbitron.
- Añadir DOTween (paquete gratuito, ampliamente usado en desarrollo Unity móvil) como dependencia nueva es aceptable — es la primera dependencia de terceros dedicada a animación/UI que introduce el proyecto.
- El reskin no requiere nuevos assets de arte de personajes/unidades — solo "chrome" de UI (paneles, botones, iconos genéricos), consistente con que el mockup de referencia tampoco muestra arte de personajes real.
- Las pantallas fuera de alcance (Hub, Mapa, Batalla, etc.) seguirán mostrando su estilo visual actual hasta que cada una reciba su propia spec futura reutilizando este mismo catálogo.
