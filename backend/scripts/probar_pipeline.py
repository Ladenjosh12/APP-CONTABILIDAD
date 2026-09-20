"""Prueba manual del pipeline OCR completo: preprocesado -> Tesseract -> extracción de campos."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from PIL import Image

from app.ocr.engine import image_to_text
from app.ocr.extraction import extraer_campos
from app.ocr.preprocess import preprocess_image

IMG_PATH = Path(__file__).resolve().parent / "factura_prueba.png"

with Image.open(IMG_PATH) as img:
    procesada = preprocess_image(img)

texto = image_to_text(procesada)
print("--- TEXTO OCR CRUDO ---")
print(texto)

resultado = extraer_campos(texto)
print("--- CAMPOS EXTRAIDOS ---")
print(json.dumps(resultado, indent=2, ensure_ascii=False))
