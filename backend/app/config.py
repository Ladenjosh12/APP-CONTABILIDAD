import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent  # backend/
DATA_DIR = BASE_DIR / "data"
TMP_UPLOADS_DIR = DATA_DIR / "tmp_uploads"

DATA_DIR.mkdir(parents=True, exist_ok=True)
TMP_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# Si Tesseract no está en el PATH del sistema, define esta variable de entorno
# con la ruta al ejecutable, p.ej. en Windows:
#   C:\Program Files\Tesseract-OCR\tesseract.exe
TESSERACT_CMD = os.environ.get("TESSERACT_CMD", "")

# Idioma del modelo de Tesseract instalado (requiere el paquete de idioma "spa").
TESSERACT_LANG = os.environ.get("TESSERACT_LANG", "spa")

EXCEL_HEADERS = [
    "Fecha",
    "Trimestre",
    "Empresa",
    "NIF",
    "Base Imponible",
    "Descuento",
    "IVA",
    "Total",
    "Archivo PDF",
]
