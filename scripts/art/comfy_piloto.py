"""Piloto de sprites cartoon con ComfyUI local (docs/art/investigacion-pipeline-sprites-n8n-comfyui.md § 7.3).

Cliente mínimo de la API de ComfyUI (puerto 8189, el de sofia2-workspace): encola un grafo en formato API,
espera en /history y descarga las imágenes por /view a una carpeta del repo.

Uso:
  python -I scripts/art/comfy_piloto.py ref --semillas 101 102 103 104
      Paso 1: referencia del Gato Básico (ASSET-001) con Z-Image Turbo, fondo blanco y fondo verde.
"""
import argparse
import json
import sys
import time
import urllib.parse
import urllib.request
import uuid
from pathlib import Path

COMFY = "http://127.0.0.1:8189"
RAIZ = Path(__file__).resolve().parents[2]
SALIDA_REF = RAIZ / "assets-source" / "units" / "cats" / "basic-cat" / "piloto" / "ref"


def _json(url, cuerpo=None, timeout=30):
    datos = json.dumps(cuerpo).encode() if cuerpo is not None else None
    req = urllib.request.Request(url, data=datos, headers={"Content-Type": "application/json"} if datos else {})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.load(r)


def ejecutar(grafo, espera_max_s=1800):
    """Encola el grafo y devuelve (segundos, lista de imágenes {filename, subfolder, type})."""
    t0 = time.time()
    pid = _json(f"{COMFY}/prompt", {"prompt": grafo, "client_id": str(uuid.uuid4())})["prompt_id"]
    while time.time() - t0 < espera_max_s:
        hist = _json(f"{COMFY}/history/{pid}")
        if pid in hist:
            h = hist[pid]
            estado = h.get("status", {})
            if estado.get("status_str") == "error":
                raise RuntimeError(json.dumps(estado.get("messages", []))[:2000])
            imgs = [img for salida in h.get("outputs", {}).values() for img in salida.get("images", [])]
            return time.time() - t0, imgs
        time.sleep(1.5)
    raise TimeoutError(f"{pid} no terminó en {espera_max_s} s")


def descargar(img, destino: Path):
    qs = urllib.parse.urlencode({k: img[k] for k in ("filename", "subfolder", "type")})
    destino.parent.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(f"{COMFY}/view?{qs}", timeout=60) as r:
        destino.write_bytes(r.read())


def subir(ruta: Path, subcarpeta="battlecats_piloto"):
    """Sube una imagen a la carpeta input de ComfyUI (POST /upload/image) y devuelve el nombre para LoadImage."""
    limite = uuid.uuid4().hex
    cab = (f"--{limite}\r\nContent-Disposition: form-data; name=\"subfolder\"\r\n\r\n{subcarpeta}\r\n"
           f"--{limite}\r\nContent-Disposition: form-data; name=\"overwrite\"\r\n\r\ntrue\r\n"
           f"--{limite}\r\nContent-Disposition: form-data; name=\"image\"; filename=\"{ruta.name}\"\r\n"
           f"Content-Type: image/png\r\n\r\n").encode()
    cuerpo = cab + ruta.read_bytes() + f"\r\n--{limite}--\r\n".encode()
    req = urllib.request.Request(f"{COMFY}/upload/image", data=cuerpo,
                                 headers={"Content-Type": f"multipart/form-data; boundary={limite}"})
    with urllib.request.urlopen(req, timeout=60) as r:
        d = json.load(r)
    return f"{d['subfolder']}/{d['name']}" if d.get("subfolder") else d["name"]


# ---------------------------------------------------------------- edición con Qwen Image Edit 2509

PROMPT_EDICION = (
    "Edit this game character image. Keep EXACTLY the same character: same species, face, pose, proportions, "
    "colours, thick near-black outline, flat cartoon style, plain white background and framing. "
    "Change only this: {cambio}"
)


def grafo_qwen_edit(imagen_input, instruccion, semilla, prefijo="battlecats/piloto/edit"):
    """Qwen Image Edit 2509 (GGUF Q4_K_S) + Lightning 8 pasos, cfg 1. Una imagen de entrada."""
    return {
        "1": {"class_type": "UnetLoaderGGUF", "inputs": {"unet_name": "Qwen-Image-Edit-2509-Q4_K_S.gguf"}},
        "2": {"class_type": "LoraLoaderModelOnly", "inputs": {"model": ["1", 0], "lora_name": "Qwen-Image-Edit-2509-Lightning-8steps-V1.0-bf16.safetensors", "strength_model": 1.0}},
        "3": {"class_type": "ModelSamplingAuraFlow", "inputs": {"model": ["2", 0], "shift": 3.0}},
        "4": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen_2.5_vl_7b_nvfp4.safetensors", "type": "qwen_image", "device": "default"}},
        "5": {"class_type": "VAELoader", "inputs": {"vae_name": "qwen_image_vae.safetensors"}},
        "6": {"class_type": "LoadImage", "inputs": {"image": imagen_input}},
        "7": {"class_type": "ImageScaleToTotalPixels", "inputs": {"image": ["6", 0], "upscale_method": "lanczos", "megapixels": 1.0, "resolution_steps": 1}},
        "8": {"class_type": "TextEncodeQwenImageEditPlus", "inputs": {"clip": ["4", 0], "prompt": instruccion, "vae": ["5", 0], "image1": ["7", 0]}},
        "9": {"class_type": "ConditioningZeroOut", "inputs": {"conditioning": ["8", 0]}},
        "10": {"class_type": "VAEEncode", "inputs": {"pixels": ["7", 0], "vae": ["5", 0]}},
        "11": {"class_type": "KSampler", "inputs": {
            "model": ["3", 0], "positive": ["8", 0], "negative": ["9", 0], "latent_image": ["10", 0],
            "seed": semilla, "steps": 8, "cfg": 1.0, "sampler_name": "euler", "scheduler": "simple", "denoise": 1.0}},
        "12": {"class_type": "VAEDecode", "inputs": {"samples": ["11", 0], "vae": ["5", 0]}},
        "13": {"class_type": "SaveImage", "inputs": {"images": ["12", 0], "filename_prefix": prefijo}},
    }


def editar(origen: Path, cambio: str, destino: Path, semilla=7):
    seg, imgs = ejecutar(grafo_qwen_edit(subir(origen), PROMPT_EDICION.format(cambio=cambio), semilla))
    descargar(imgs[0], destino)
    return seg


# ---------------------------------------------------------------- paso 1: referencia (ASSET-001)

PROMPT_REF = (
    "Chibi 2D game character sprite in a flat cartoon style for a side-scrolling battle game. {orientacion} "
    "Very thick, clean, "
    "near-black outlines around every shape (about 3% of the character height), flat cel-shaded coloring "
    "with only 2 or 3 flat tones per material, no gradients, no glow, no rim light, matte, simple and bold, "
    "readable as a silhouette even when very small. "
    "Subject: an anthropomorphic CAT warrior, bipedal, oversized head about half of the total height, short "
    "stubby arms and legs, short muzzle, large pointed cat ears clearly visible in the silhouette, a short "
    "tail, simple expressive face with dot eyes and a tiny mouth. "
    "Design: 'Basic Cat', the standard recruit. Warm grey-cream fur (#cfc4b3) with a slightly darker shade "
    "tone (#a89b86), pink inner ears (#c98f8a), a small round dome-shaped brown leather cap (#8a5a3b) with no "
    "visor and no brim, the ears poking out on both sides, a plain brown leather tunic (#5e3b25), a SHORT plain "
    "iron sword (#9aa6b5), its blade shorter than the cat's head, held in the front paw with the paw clearly "
    "visible around the hilt. One dominant round body mass, no shield, no armor plates, no extra accessories. "
    "Neutral idle stance, arms relaxed, sword pointing slightly down and forward, feet apart, full body "
    "visible from the top of the ears to the feet. "
    "A single character, centered, filling about 90% of the image height with a tight margin, standing on an "
    "invisible ground line. {fondo} No text, no letters, no watermark, no shadow on the ground, no scenery, "
    "no frame or border."
)
ORIENTACIONES = {
    # Ronda 1: casi todas salieron de frente.
    "r1": "Side view facing right.",
    # Ronda 2: se insiste en el giro a la derecha.
    "r2": ("Three-quarter side view: the whole body and the head are turned toward the RIGHT edge of the image, "
           "the cat looks to the right, its muzzle points right, the sword is held forward on the right side, "
           "the tail sticks out on the left behind it. It is walking into battle toward the right."),
}
FONDOS = {
    "blanco": "Plain, perfectly uniform solid white background.",
    "verde": "Plain, perfectly uniform solid pure green (#00FF00) chroma-key background.",
}


def grafo_zimage(prompt, semilla, ancho=1024, alto=1024, prefijo="battlecats/piloto/ref"):
    return {
        "1": {"class_type": "UNETLoader", "inputs": {"unet_name": "z_image_turbo_nvfp4.safetensors", "weight_dtype": "default"}},
        "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen_3_4b.safetensors", "type": "lumina2", "device": "default"}},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": "ae.safetensors"}},
        "4": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["2", 0]}},
        "5": {"class_type": "ConditioningZeroOut", "inputs": {"conditioning": ["4", 0]}},
        "6": {"class_type": "EmptySD3LatentImage", "inputs": {"width": ancho, "height": alto, "batch_size": 1}},
        "7": {"class_type": "ModelSamplingAuraFlow", "inputs": {"model": ["1", 0], "shift": 3.0}},
        "8": {"class_type": "KSampler", "inputs": {
            "model": ["7", 0], "positive": ["4", 0], "negative": ["5", 0], "latent_image": ["6", 0],
            "seed": semilla, "steps": 8, "cfg": 1.0, "sampler_name": "res_multistep", "scheduler": "simple", "denoise": 1.0}},
        "9": {"class_type": "VAEDecode", "inputs": {"samples": ["8", 0], "vae": ["3", 0]}},
        "10": {"class_type": "SaveImage", "inputs": {"images": ["9", 0], "filename_prefix": prefijo}},
    }


def paso_ref(semillas, ronda, fondos):
    informe = []
    for fondo in fondos:
        prompt = PROMPT_REF.format(orientacion=ORIENTACIONES[ronda], fondo=FONDOS[fondo])
        for s in semillas:
            seg, imgs = ejecutar(grafo_zimage(prompt, s))
            destino = SALIDA_REF / ronda / f"ref_{fondo}_s{s}.png"
            descargar(imgs[0], destino)
            informe.append({"fondo": fondo, "semilla": s, "segundos": round(seg, 1), "archivo": str(destino.relative_to(RAIZ)), "prompt": prompt})
            print(f"{ronda} {fondo:6} s{s}: {seg:5.1f} s -> {destino.name}", flush=True)
    (SALIDA_REF / ronda / "informe.json").write_text(json.dumps({"ronda": ronda, "imagenes": informe}, ensure_ascii=False, indent=2), encoding="utf-8")


BRIEF_GATO_BASICO = (
    "'Basic Cat', the standard recruit of a cat army (docs/art/asset-specs/basic-cat-assets.md, ASSET-001).\n"
    "MUST (gate): anthropomorphic bipedal chibi cat with an oversized head (roughly half the height); large pointed "
    "ears visible on both sides of a small brown leather cap; light warm fur (cream, grey-cream or light beige); "
    "plain brown leather tunic; exactly ONE short iron sword held in a front paw (a recruit's sword: clearly "
    "shorter than the cat's whole body, not a long sword or greatsword).\n"
    "SHOULD (score only): the cap is a round dome with little or no visor; the blade is about as long as the head; "
    "the paw reads separately from the hilt; short tail; pink inner ears; dot eyes and a tiny mouth.\n"
    "FORBIDDEN (gate): shield, armour plates, horned helmet, extra weapons, cape, jewellery, glow or magic effects."
)


def ref_auto(lote, max_rondas, min_aprobadas, incluir, semilla_base):
    """Genera y evalúa en bucle hasta tener `min_aprobadas` referencias que pasen el filtro; luego elige las 2 mejores."""
    import shutil
    sys.path.insert(0, str(Path(__file__).resolve().parent))   # con -I la carpeta del script no está en sys.path
    import evaluar_venice as ev
    base = SALIDA_REF / "auto"
    aprobadas, todas, correcciones = [], [], []
    a_refinar = []          # casi aprobadas que se corrigen con Qwen Edit en la ronda siguiente (cadena de hasta 3 ediciones)

    def evaluar_lote(nombre, archivos, referencia=None):
        ev_lote = []
        for f in archivos:
            e = ev.evaluar(f, "Basic Cat", BRIEF_GATO_BASICO, referencia=referencia)
            vista = e.pop("_vista", None)
            if vista is not None:
                vista.save(f.with_name(f.stem + "_16px.png"))
            ev_lote.append(e)
            marca = "APROBADA" if e["aprobada"] else "rechazada"
            print(f"[{nombre}] {f.name}: {marca} nota={e['nota']}  {'; '.join(e.get('razones_rechazo', []))[:170]}", flush=True)
        return ev_lote

    def recuperable(e):
        """Gato bien orientado, en estilo y con el fondo bien: lo que falle es diseño o detalle, corregible editando."""
        v = e.get("venice") or {}
        return e["codigo"].get("ok") and all(v.get(g) for g in ("g_especie", "g_orientacion", "g_estilo", "g_fondo")) and v.get("correccion")

    for ronda in range(max_rondas + (1 if incluir else 0)):
        nombre = "r0-existentes" if (ronda == 0 and incluir) else f"r{ronda}"
        carpeta = base / nombre
        carpeta.mkdir(parents=True, exist_ok=True)
        if ronda == 0 and incluir:
            archivos = sorted(p for p in Path(incluir).glob("ref_*.png") if not p.stem.endswith("_16px"))
        else:
            # Z-Image ignora las correcciones acumuladas: se usa solo la última, y el arreglo fino lo hace Qwen Edit
            extra = (" " + correcciones[-1]) if correcciones else ""
            prompt = PROMPT_REF.format(orientacion=ORIENTACIONES["r2"], fondo=FONDOS["blanco"]) + extra
            (carpeta / "prompt.txt").write_text(prompt, encoding="utf-8")
            archivos = []
            for k in range(lote):
                s = semilla_base + 100 * ronda + k
                seg, imgs = ejecutar(grafo_zimage(prompt, s))
                destino = carpeta / f"ref_blanco_s{s}.png"
                descargar(imgs[0], destino)
                archivos.append(destino)
        evaluadas = evaluar_lote(nombre, archivos)

        # corrección con Qwen Edit: las casi aprobadas de rondas anteriores + las 2 mejores recuperables de esta ronda
        candidatas = a_refinar + sorted([e for e in evaluadas if not e["aprobada"] and recuperable(e)],
                                        key=lambda e: e["nota"], reverse=True)[:2]
        a_refinar = []
        for e in candidatas:
            origen = Path(e["archivo"])
            n = e.get("ediciones", 0) + 1
            destino = carpeta / f"{origen.stem.split('_e')[0]}_e{n}.png"
            cambio = e["venice"]["correccion"]
            seg = editar(origen, cambio, destino, semilla=1000 + n)
            print(f"[{nombre}] Qwen Edit {origen.name} -> {destino.name} ({seg:.0f} s): {cambio[:120]}", flush=True)
            # la edición se juzga CONTRA su original (c_consistencia): en la v3, Qwen cambió el pelaje a naranja
            # atigrado y la evaluación sin referencia la aprobó igual; solo la detectó la comparación final
            [ed] = evaluar_lote(nombre, [destino], referencia=origen)
            ed.update(ediciones=n, editada_de=str(origen), cambio_pedido=cambio, nota_antes=e["nota"])
            evaluadas.append(ed)
            if not ed["aprobada"] and recuperable(ed) and n < 3 and ed["nota"] >= e["nota"] - 0.3:
                a_refinar.append(ed)

        (carpeta / "evaluacion.json").write_text(json.dumps(evaluadas, ensure_ascii=False, indent=2), encoding="utf-8")
        todas += evaluadas
        aprobadas += [e for e in evaluadas if e["aprobada"]]
        sug = [e["venice"].get("correccion", "").strip() for e in evaluadas if not e["aprobada"] and e.get("venice")]
        sug = [s for s in sug if s]
        if sug:
            correcciones.append(max(set(sug), key=sug.count))
        print(f"[{nombre}] aprobadas acumuladas: {len(aprobadas)}", flush=True)
        if len(aprobadas) >= min_aprobadas:
            break
    resultado = {"aprobadas": len(aprobadas), "evaluadas": len(todas), "correcciones_usadas": correcciones}
    if len(aprobadas) >= 2:
        rk = ev.ranking(aprobadas, "Basic Cat", BRIEF_GATO_BASICO)
        resultado["ranking"] = rk
        eleg = base / "elegidas"; eleg.mkdir(parents=True, exist_ok=True)
        for etiqueta, clave in (("A", "primero"), ("B", "segundo")):
            if rk.get(clave):
                shutil.copy2(rk[clave], eleg / f"ref_neutral_opcion{etiqueta}_{Path(rk[clave]).name}")
    else:
        mejores = sorted(todas, key=lambda e: e["nota"], reverse=True)[:2]
        resultado["sin_aprobar_mejores"] = [{"archivo": e["archivo"], "nota": e["nota"], "razones": e.get("razones_rechazo")} for e in mejores]
    (base / "resultado.json").write_text(json.dumps(resultado, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(resultado, ensure_ascii=False, indent=2))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="paso", required=True)
    r = sub.add_parser("ref", help="Paso 1: referencia ASSET-001 con Z-Image Turbo")
    r.add_argument("--semillas", type=int, nargs="+", default=[101, 102, 103, 104])
    r.add_argument("--ronda", choices=sorted(ORIENTACIONES), default="r2")
    r.add_argument("--fondos", nargs="+", choices=sorted(FONDOS), default=["blanco"])
    ra = sub.add_parser("ref-auto", help="Paso 1 con filtro Venice: genera y evalúa hasta tener referencias aprobadas")
    ra.add_argument("--lote", type=int, default=6)
    ra.add_argument("--max-rondas", type=int, default=5)
    ra.add_argument("--min-aprobadas", type=int, default=3, help="se para al llegar a este número de aprobadas")
    ra.add_argument("--incluir", help="carpeta con candidatas ya generadas para evaluar primero (ronda 0)")
    ra.add_argument("--semilla-base", type=int, default=300)
    a = ap.parse_args()
    if a.paso == "ref":
        paso_ref(a.semillas, a.ronda, a.fondos)
    elif a.paso == "ref-auto":
        ref_auto(a.lote, a.max_rondas, a.min_aprobadas, a.incluir, a.semilla_base)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
