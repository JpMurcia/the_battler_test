# Quickstart: Reskin Visual Cyber-Modern + Sprites Reales de Combate

Guía de validación manual + automatizada. No reemplaza `tasks.md` (Fase 2) — asume que la implementación de cada historia de usuario (`spec.md`) ya está hecha y solo confirma que funciona.

## Prerrequisitos

- Dependencias instaladas: `npm install` (sin dependencias nuevas que añadir — `lucide-react`, `pixi.js`, `@pixi/react` ya están en `package.json`).
- Progreso local limpio o existente da igual — ninguna aserción de esta spec depende del estado de guardado.

## 1. Regresión automatizada (ejecutar antes y después de cada historia de usuario)

```bash
npm test
npm run build
```

**Esperado**: ambos comandos terminan en verde, sin ninguna aserción de test modificada respecto al estado previo a esta spec (spec.md SC-003) — solo casos nuevos añadidos (`animation.test.ts`, `spriteAssets.test.ts`, ver `data-model.md`).

## 2. Historia 1 — Fundación visual (Título / Menú Principal / Ajustes)

```bash
npm run dev
```

1. Abrir la URL del dev server. **Esperado**: fondo casi negro con acentos de color en vez del fondo blanco/gris actual; sin progreso guardado, el botón dice "Jugar".
2. Pulsar el botón principal → llega al Menú Principal. **Esperado**: mismo estilo cyber-modern; accesos a Niveles/Gacha/Mejora/Ajustes visibles con iconos (no emoji/ASCII).
3. Pulsar "Ajustes" → mover los sliders de volumen, cambiar idioma, pulsar Aplicar. **Esperado**: el panel se ve con el nuevo estilo y el comportamiento (cambios pendientes hasta Aplicar) es idéntico al de antes de esta spec.
4. Recargar con `localStorage`/IndexedDB con progreso ya guardado (jugar y ganar un nivel primero, ver §5). **Esperado**: el botón de Título ahora dice "Continuar".

## 3. Historia 2 — Navegación y consulta

Repetir para cada pantalla: Mapa de Etapas, Menú de Tesoros, Equipar, Mejorar (unidades + rango), Guía de Gatos, Guía de Enemigos, Resultado, Cápsula.

1. Navegar a la pantalla desde su punto de entrada habitual. **Esperado**: estilo cyber-modern aplicado; ningún dato mostrado (nombres, stats, porcentajes, estados de nivel) cambia respecto a antes de esta spec.
2. Para Equipar/Mejorar/Guía de Gatos específicamente: confirmar que cada rareza (`Normal`…`Colaboración`) se distingue por color (`data-model.md` § RarityColorMap).
3. Ejecutar una acción representativa por pantalla (seleccionar equipo en Equipar, mejorar una unidad en Mejorar, reclamar un umbral de rango alcanzado) y confirmar que el resultado (moneda descontada, nivel subido, recompensa reclamada) es idéntico al de antes de esta spec.

## 4. Historia 3 — Batalla (HUD + escenario)

1. Entrar a una batalla desde el Mapa de Etapas.
2. **Esperado en el HUD**: energía, HP de base propia/enemiga con barra de progreso con color, controles de velocidad/pausa y fila de despliegue muestran el nuevo estilo; los valores numéricos son idénticos a los que mostraría el HUD sin estilizar.
3. Desplegar una unidad cuyo costo supere la energía disponible → botón deshabilitado igual que antes. Desplegar una unidad válida → entra en cooldown con la indicación visual nueva, y vuelve a estar disponible exactamente cuando su `cooldownSeconds` termina.
4. **Esperado en el escenario**: fondo del carril con el tratamiento cyber-modern (no el azul plano `0x1a1a2e` anterior); unidades con anillo de resplandor cian (jugador) / rojo (enemigo).
5. Dejar que la batalla termine (victoria o derrota). **Esperado**: pantalla de Resultado con el nuevo estilo, mismo mensaje/recompensa que antes.

## 5. Historia 4 — Sprites reales de combate

1. Ejecutar una sola vez (si aún no se hizo) el script de copia de sprites:
   ```bash
   node scripts/copy-sprites.mjs
   ```
   **Esperado**: `public/sprites/hero_1/idle/1.png`…`16.png`, `public/sprites/hero_1/attack/1.png`…`12.png` … hasta `hero_12/...` existen (336 archivos); el script falla con un mensaje claro si alguna carpeta origen se desvía del recuento esperado (`data-model.md` § SpriteManifest, Validation rules).
2. Jugar una batalla y observar el campo. **Esperado**: cada unidad (propia y enemiga) se muestra como una figura de personaje animada, no un rectángulo de color.
3. Observar una unidad en reposo vs. una unidad `Engaged` en combate. **Esperado**: la pose cambia de reposo a ataque en sincronía con su cadencia de daño real (mismo timing que el pulso procedural anterior).
4. Observar una unidad enemiga. **Esperado**: su figura está orientada en espejo respecto a una unidad propia (mira hacia la izquierda/base del jugador).
5. Dejar que una unidad muera en combate. **Esperado**: el mismo efecto de eco (encogimiento/desvanecimiento) que existía antes de esta spec, ahora sobre la figura animada.
6. **Caso de fallback**: temporalmente comentar el `spriteKey` de un `Cat` en `src/data/cats.ts`, repetir el paso 2 solo para ese gato. **Esperado**: esa unidad específica vuelve a mostrarse como el rectángulo `Graphics` placeholder, sin error en consola ni hueco vacío — luego revertir el cambio.

## 6. Verificación de accesibilidad de movimiento

1. Activar la preferencia del sistema operativo "reducir movimiento" (`prefers-reduced-motion: reduce`).
2. Recargar cualquier pantalla con animación cosmética (p. ej. el botón "¡Batalla!" con pulso en el Menú Principal). **Esperado**: la animación de pulso/glow no se reproduce, pero el botón sigue siendo pulsable con normalidad.

## 7. Verificación de valores de tema (spec.md SC-002)

Revisión de código, no runtime: en cada archivo de pantalla tocado por esta spec, confirmar que no queda ningún color hexadecimal, tamaño de fuente o radio de esquina literal fuera de `src/theme.css` — todo referencia un token o una clase utilitaria (`data-model.md` § ThemeTokens).
