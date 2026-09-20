"""Genera una imagen de factura a una resolución realista de foto de móvil
(similar a lo que produce una cámara de smartphone) para probar rendimiento."""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT_PATH = Path(__file__).resolve().parent / "factura_grande.jpg"

LINEAS = [
    "SUMINISTROS INDUSTRIALES DEL NORTE SL",
    "NIF: B12345674",
    "Calle Mayor 12, 28001 Madrid",
    "",
    "FACTURA N. 2026-0456",
    "Fecha: 14/02/2026",
    "",
    "Descripcion            Cantidad   Precio",
    "Material de oficina         10     45,00",
    "",
    "Base imponible:           450,00",
    "Descuento:                 20,00",
    "IVA (21%):                 90,30",
    "Total a pagar:            520,30",
]


def generar():
    # Resolucion tipica de camara de movil (ej. 12MP en orientacion vertical)
    ancho, alto = 3024, 4032
    img = Image.new("RGB", (ancho, alto), "white")
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("arial.ttf", 70)
    except OSError:
        font = ImageFont.load_default()

    y = 200
    for linea in LINEAS:
        draw.text((150, y), linea, fill="black", font=font)
        y += 120

    img.save(OUT_PATH, "JPEG", quality=90)
    print(f"Factura grande generada en: {OUT_PATH} ({OUT_PATH.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    generar()
