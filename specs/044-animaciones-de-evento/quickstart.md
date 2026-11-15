# Quickstart: validar Animaciones de Evento

## Automático

```bash
npx tsc -b
```

```bash
npx vitest run
```

```bash
npx oxlint
```

```bash
git diff --stat master -- src/engine
```

Esperado: tipos y lint limpios, suite en verde (incluye `eventAnimations.test.ts` y `motionPreference.test.ts`) y **ningún** archivo de `src/engine/` modificado (SC-007).

## Manual (servidor de desarrollo, batalla de cualquier etapa)

1. **Aparición** (US3): despliega un aliado → surge aplastado, salta y aterriza en ~0,3 s; su anillo aparece a la vez y sin moverse. Espera una oleada enemiga → misma animación.
2. **Golpeado** (US1): deja que dos unidades choquen → cada golpe destella y sacude el cuerpo golpeado; el anillo no tiembla; chispas y número de daño siguen. En un choque con varios atacantes, contar ≤ 3 destellos/s.
3. **Muerte** (US2): derrota a un enemigo y a un aliado → cada eco salta hacia su propia base, gira y desaparece en < 0,5 s, sin encogerse.
4. **Retroceso** (US4): despliega el Gato Empujón (o dispara el cañón con cabeza de empujón) → el enemigo se desliza hacia atrás inclinado, sin teletransportarse; el anillo lo acompaña por el suelo.
5. **Reducir movimiento**: emula `prefers-reduced-motion: reduce` (DevTools › Rendering) → aparición y muerte son solo fundidos, el empujón coloca a la unidad directamente, no hay destellos ni sacudidas.
6. **Rendimiento** (SC-008): batalla con ~40 unidades en contacto → la fluidez es igual que en `master` (comparar el contador de FPS de DevTools).
7. **Pausa**: pausa durante una muerte → el eco termina; no aparecen reacciones nuevas mientras dura la pausa.
