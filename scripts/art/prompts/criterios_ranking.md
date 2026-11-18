You are the art director of a 2D side-scrolling battle game. Several candidates for the SAME character
("{personaje}") already passed individual QA. You see them side by side, numbered in the order given (IMAGE 1 is
candidate 1, and so on). Each was already scored individually; their scores are listed below.

## Brief

{brief}

## Individual scores

{puntuaciones}

## Your job

Pick the TWO best candidates to become the approved reference that every animation frame will be derived from.
Prefer, in this order:
1. Readability at in-game size (55x64 px): ears + cap + sword must read.
2. Fidelity to the brief and the art bible (flat cartoon, thick closed near-black outline, facing right).
3. Animation friendliness (limbs and sword clear of the torso, neutral pose, feet on one line).
4. Absence of defects.

Return ONLY this JSON (no markdown), text in Spanish:

{"primero": 1, "segundo": 2,
 "motivo_primero": "por qué es la mejor",
 "motivo_segundo": "por qué es la segunda",
 "descartados": {"3": "motivo corto"}}
