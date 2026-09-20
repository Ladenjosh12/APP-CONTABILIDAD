"""Genera una imagen de factura sintética en español para probar el pipeline de OCR."""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT_PATH = Path(__file__).resolve().parent / "factura_prueba.png"

LINEAS = [
    "SUMINISTROS INDUSTRIALES DEL NORTE SL",
    "NIF: B12345674",
    "Calle Mayor 12, 28001 Madrid",
    "",
    "FACTURA Nº 2026-0456",
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
    img = Image.new("RGB", (900, 700), "white")
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("arial.ttf", 24)
    except OSError:
        font = ImageFont.load_default()

    y = 30
    for linea in LINEAS:
        draw.text((40, y), linea, fill="black", font=font)
        y += 40

    img.save(OUT_PATH)
    print(f"Factura de prueba generada en: {OUT_PATH}")


if __name__ == "__main__":
    generar()
