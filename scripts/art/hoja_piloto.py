"""Hoja de contacto del piloto: cada candidata a 256 px + la misma reducida al tamaño de batalla (55x64 px, specs/045)
y ampliada x2 por vecino más cercano, para juzgar la silueta como la verá el jugador.

Uso (con un Python que tenga Pillow, p. ej. el venv de ComfyUI):
  python -I scripts/art/hoja_piloto.py assets-source/units/cats/basic-cat/piloto/ref
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw

LADO = 256
BATALLA = (55, 64)        # caja en pantalla del Gato Básico a la escala de specs/045
AMPLIA = 2


def recorte_util(im):
    """Recorta al contenido (lo que no es fondo plano), para que la reducción use el personaje y no el margen."""
    rgb = im.convert("RGB")
    fondo = rgb.getpixel((2, 2))
    dif = Image.new("RGB", rgb.size, fondo)
    from PIL import ImageChops
    caja = ImageChops.difference(rgb, dif).convert("L").point(lambda v: 255 if v > 40 else 0).getbbox()
    return rgb.crop(caja) if caja else rgb


def main(carpeta: Path):
    pngs = sorted(p for p in carpeta.glob("ref_*.png"))
    columnas = 4
    alto_celda = LADO + BATALLA[1] * AMPLIA + 30
    hoja = Image.new("RGB", (columnas * (LADO + 10) + 10, ((len(pngs) + columnas - 1) // columnas) * (alto_celda + 10) + 10), "#2a2d3a")
    d = ImageDraw.Draw(hoja)
    for i, p in enumerate(pngs):
        x = 10 + (i % columnas) * (LADO + 10)
        y = 10 + (i // columnas) * (alto_celda + 10)
        im = Image.open(p).convert("RGB")
        hoja.paste(im.resize((LADO, LADO), Image.LANCZOS), (x, y))
        util = recorte_util(im)
        mini = util.resize(BATALLA, Image.LANCZOS).resize((BATALLA[0] * AMPLIA, BATALLA[1] * AMPLIA), Image.NEAREST)
        hoja.paste(mini, (x + (LADO - mini.width) // 2, y + LADO + 4))
        d.text((x + 4, y + LADO + BATALLA[1] * AMPLIA + 10), p.stem.replace("ref_", ""), fill="white")
    destino = carpeta / "hoja_contacto.png"
    hoja.save(destino)
    print(destino)


if __name__ == "__main__":
    main(Path(sys.argv[1]))
