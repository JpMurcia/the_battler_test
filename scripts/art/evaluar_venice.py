"""Filtro de calidad y consistencia de sprites con Venice (visión) + comprobaciones por código.

Dos capas, como el curador de Sofía (sofia-pipeline-v2, S2-N03A):
  1. Código (gratis, determinista): fondo blanco uniforme, personaje no recortado, ocupación del lienzo,
     contorno oscuro en el borde de la silueta y proporción de la silueta.
  2. Venice visión (`nvidia-nemotron-3-5-super-vl-120b-a12b`): 5 puertas sí/no y 5-6 criterios de 0 a 10
     según `prompts/criterios_referencia.md`. Recibe la imagen, la vista a tamaño de batalla (55x64 px, specs/045)
     y, si existe, la referencia aprobada (para medir consistencia).
  Al final, `ranking()` compara las aprobadas lado a lado y elige las 2 mejores (`prompts/criterios_ranking.md`).

La clave se lee de la variable de entorno VENICE_API_KEY (nunca de un archivo, nunca se imprime).
Requiere Pillow y numpy (usar el venv de ComfyUI).
"""
import base64
import io
import json
import os
import re
import time
import urllib.error
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

VENICE_URL = "https://api.venice.ai/api/v1/chat/completions"
MODELO_VISION = "nvidia-nemotron-3-5-super-vl-120b-a12b"
PROMPTS = Path(__file__).resolve().parent / "prompts"

TAM_BATALLA = (55, 64)          # caja en pantalla del Gato Básico a la escala de specs/045 (antes 16x19)
AMPLIA_VISTA = 2                # ampliación de la vista previa (vecino más cercano)
COLOR_SUELO = (111, 125, 92)    # tono medio de campo de batalla para la vista previa
PESOS = {"c_diseno": 0.25, "c_silueta": 0.20, "c_contorno": 0.20, "c_animable": 0.20, "c_defectos": 0.15}
PESO_CONSISTENCIA = 0.25        # si hay referencia, pesa esto y el resto se reescala al 75 %
UMBRAL_NOTA = 8.0               # nota ponderada mínima para aprobar (con 7 aprobaba 7 de 8 a la primera, incluida una fuera de diseño)
UMBRAL_CRITERIO = 6             # ningún criterio por debajo de esto
REPETICIONES = 2                # pasadas de Venice por imagen
PUERTAS = ("g_especie", "g_orientacion", "g_estilo", "g_fondo", "g_diseno")


# ------------------------------------------------------------------ capa 1: código

def recorte_por_relleno(im: Image.Image, tolerancia=30):
    """Quita el fondo blanco rellenando desde los bordes (el contorno grueso cerrado frena el relleno).
    Devuelve la máscara del personaje (bool HxW)."""
    rgb = im.convert("RGB").copy()
    centinela = (255, 0, 254)
    w, h = rgb.size
    semillas = [(x, y) for x in range(0, w, max(1, w // 32)) for y in (0, h - 1)] + \
               [(x, y) for y in range(0, h, max(1, h // 32)) for x in (0, w - 1)]
    for s in semillas:
        p = rgb.getpixel(s)
        if p != centinela and min(p) >= 225:
            ImageDraw.floodfill(rgb, s, centinela, thresh=tolerancia)
    a = np.asarray(rgb)
    fondo = (a[..., 0] == 255) & (a[..., 1] == 0) & (a[..., 2] == 254)
    return ~fondo


def medir(ruta: Path):
    im = Image.open(ruta).convert("RGB")
    a = np.asarray(im).astype(np.int16)
    h, w = a.shape[:2]
    lum = a.mean(axis=2)
    borde = np.concatenate([lum[:3].ravel(), lum[-3:].ravel(), lum[:, :3].ravel(), lum[:, -3:].ravel()])
    mascara = recorte_por_relleno(im)
    ys, xs = np.nonzero(mascara)
    if len(ys) == 0:
        return {"ok": False, "motivo_codigo": "no se encontró personaje"}, None
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    m_img = Image.fromarray((mascara * 255).astype(np.uint8))
    erosion = np.asarray(m_img.filter(ImageFilter.MinFilter(7))) > 0
    banda = mascara & ~erosion
    oscuro = float((lum[banda] < 70).mean()) if banda.any() else 0.0
    m = {
        "fondo_blanco": round(float((borde >= 235).mean()), 3),
        "margen_px": int(min(y0, x0, w - 1 - x1, h - 1 - y1)),
        "ocupacion_alto": round(float((y1 - y0 + 1) / h), 3),
        "area_silueta": round(float(mascara.mean()), 3),
        "contorno_oscuro": round(oscuro, 3),
    }
    fallos = []
    if m["fondo_blanco"] < 0.97: fallos.append("fondo no blanco uniforme")
    if m["margen_px"] < 3: fallos.append("personaje recortado por el borde")
    if m["ocupacion_alto"] < 0.70: fallos.append(f"ocupa poco alto ({m['ocupacion_alto']:.0%})")
    if not 0.12 <= m["area_silueta"] <= 0.75: fallos.append("silueta de tamaño anómalo (¿fuga del recorte?)")
    if m["contorno_oscuro"] < 0.45: fallos.append(f"contorno poco oscuro o abierto ({m['contorno_oscuro']:.0%})")
    m["ok"] = not fallos
    m["fallos_codigo"] = fallos
    # vista a tamaño de batalla: recorte, encaje sin deformar, pies abajo-centro, sobre color de suelo
    rgba = im.convert("RGBA")
    rgba.putalpha(m_img)
    pj = rgba.crop((x0, y0, x1 + 1, y1 + 1))
    esc = min(TAM_BATALLA[0] / pj.width, TAM_BATALLA[1] / pj.height)
    pj = pj.resize((max(1, round(pj.width * esc)), max(1, round(pj.height * esc))), Image.LANCZOS)
    lienzo = Image.new("RGBA", TAM_BATALLA, COLOR_SUELO + (255,))
    lienzo.alpha_composite(pj, ((TAM_BATALLA[0] - pj.width) // 2, TAM_BATALLA[1] - pj.height))
    vista = lienzo.convert("RGB").resize((TAM_BATALLA[0] * AMPLIA_VISTA, TAM_BATALLA[1] * AMPLIA_VISTA), Image.NEAREST)
    return m, vista


# ------------------------------------------------------------------ capa 2: Venice

def _b64(im: Image.Image, lado_max=768):
    im = im.convert("RGB")
    if max(im.size) > lado_max:
        im = im.copy(); im.thumbnail((lado_max, lado_max), Image.LANCZOS)
    buf = io.BytesIO(); im.save(buf, "PNG")
    return {"type": "image_url", "image_url": {"url": "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()}}


def _clave():
    """VENICE_API_KEY del entorno del proceso o, en Windows, de las variables de usuario (HKCU\\Environment),
    para que una variable recién creada valga sin reiniciar la terminal."""
    clave = os.environ.get("VENICE_API_KEY")
    if not clave and os.name == "nt":
        import winreg
        try:
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, "Environment") as k:
                clave = winreg.QueryValueEx(k, "VENICE_API_KEY")[0]
        except OSError:
            clave = None
    if not clave:
        raise RuntimeError("Falta la variable de entorno VENICE_API_KEY")
    return clave


def _venice(sistema, contenido, max_tokens=900):
    clave = _clave()
    cuerpo = {"model": MODELO_VISION, "temperature": 0.1, "max_tokens": max_tokens, "reasoning_effort": "none",
              "venice_parameters": {"include_venice_system_prompt": False},
              "messages": [{"role": "system", "content": sistema}, {"role": "user", "content": contenido}]}
    datos = json.dumps(cuerpo).encode()
    for intento in range(6):
        req = urllib.request.Request(VENICE_URL, data=datos, headers={"Authorization": f"Bearer {clave}", "Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                texto = json.load(r)["choices"][0]["message"]["content"]
            return _extraer_json(texto)
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503, 504) and intento < 5:
                time.sleep(5 * (intento + 1)); continue
            raise RuntimeError(f"Venice {e.code}: {e.read()[:400]!r}") from None
        except (ValueError, KeyError):
            if intento < 2: continue
            raise


def _extraer_json(texto):
    texto = re.sub(r"<think>.*?</think>", "", texto, flags=re.S)
    i, j = texto.find("{"), texto.rfind("}")
    return json.loads(texto[i:j + 1])


def nota_ponderada(v):
    pesos = dict(PESOS)
    if v.get("c_consistencia") is not None:
        pesos = {k: p * (1 - PESO_CONSISTENCIA) for k, p in pesos.items()}
        pesos["c_consistencia"] = PESO_CONSISTENCIA
    return round(sum(float(v.get(k) or 0) * p for k, p in pesos.items()), 2)


def evaluar(ruta: Path, personaje: str, brief: str, referencia: Path | None = None):
    """Evalúa una imagen. Devuelve dict con medidas de código, veredicto de Venice, nota y `aprobada`."""
    medidas, vista = medir(ruta)
    r = {"archivo": str(ruta), "codigo": medidas}
    if vista is None:
        r.update(aprobada=False, nota=0.0, motivo="sin personaje"); return r
    sistema = (PROMPTS / "criterios_referencia.md").read_text(encoding="utf-8").replace("{personaje}", personaje).replace("{brief}", brief)
    contenido = [{"type": "text", "text": "IMAGE 1 = candidate. IMAGE 2 = in-game size preview." + (" IMAGE 3 = approved reference." if referencia else "")},
                 _b64(Image.open(ruta)), _b64(vista, 256)]
    if referencia:
        contenido.append(_b64(Image.open(referencia)))
    try:
        # REPETICIONES pasadas: el modelo no es determinista. Una puerta tiene que pasar en TODAS; las notas se promedian.
        vs = [_venice(sistema, contenido) for _ in range(REPETICIONES)]
    except Exception as e:  # un fallo de Venice no aprueba nunca
        r.update(aprobada=False, nota=0.0, motivo=f"error de Venice: {e}"); return r
    v = dict(vs[0])
    for g in PUERTAS:
        v[g] = all(bool(x.get(g)) for x in vs)
    for k in list(PESOS) + ["c_consistencia"]:
        vals = [float(x[k]) for x in vs if x.get(k) is not None]
        v[k] = round(sum(vals) / len(vals), 1) if vals else None
    v["defectos"] = sorted({d for x in vs for d in (x.get("defectos") or [])})
    v["motivos"] = [x.get("motivo") for x in vs]
    v["notas_por_pasada"] = [nota_ponderada({**x, "c_consistencia": x.get("c_consistencia") if referencia else None}) for x in vs]
    if not referencia:
        v["c_consistencia"] = None
    nota = nota_ponderada(v)
    puertas_ok = all(bool(v.get(g)) for g in PUERTAS)
    criterios = [k for k in list(PESOS) + (["c_consistencia"] if referencia else [])]
    minimo_ok = all(float(v.get(k) or 0) >= UMBRAL_CRITERIO for k in criterios)
    razones = []
    if not medidas["ok"]: razones += medidas["fallos_codigo"]
    razones += [f"puerta {g} = no" for g in PUERTAS if not v.get(g)]
    razones += [f"{k} = {v.get(k)} < {UMBRAL_CRITERIO}" for k in criterios if float(v.get(k) or 0) < UMBRAL_CRITERIO]
    if nota < UMBRAL_NOTA: razones.append(f"nota {nota} < {UMBRAL_NOTA}")
    r.update(venice=v, nota=nota, aprobada=medidas["ok"] and puertas_ok and minimo_ok and nota >= UMBRAL_NOTA,
             razones_rechazo=razones)
    r["_vista"] = vista
    return r


def ranking(evaluadas: list[dict], personaje: str, brief: str, maximo=6):
    """Compara las aprobadas lado a lado (las `maximo` de mejor nota) y elige las 2 mejores."""
    cands = sorted(evaluadas, key=lambda e: e["nota"], reverse=True)[:maximo]
    if len(cands) < 2:
        return {"error": "menos de 2 candidatas aprobadas", "candidatas": [c["archivo"] for c in cands]}
    puntos = "\n".join(
        f"- Candidate {i + 1} ({Path(c['archivo']).name}): weighted score {c['nota']}, "
        + ", ".join(f"{k}={c['venice'].get(k)}" for k in PESOS) + f". Note: {c['venice'].get('motivo', '')}"
        for i, c in enumerate(cands))
    sistema = (PROMPTS / "criterios_ranking.md").read_text(encoding="utf-8").replace("{personaje}", personaje) \
        .replace("{brief}", brief).replace("{puntuaciones}", puntos)
    contenido = [{"type": "text", "text": f"{len(cands)} candidates follow, in order."}] + [_b64(Image.open(c["archivo"]), 512) for c in cands]
    v = _venice(sistema, contenido, max_tokens=700)
    elegir = lambda n: cands[int(v[n]) - 1]["archivo"] if 1 <= int(v.get(n, 0)) <= len(cands) else None
    return {"primero": elegir("primero"), "segundo": elegir("segundo"), "venice": v,
            "candidatas": [{"archivo": c["archivo"], "nota": c["nota"]} for c in cands]}
