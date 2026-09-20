import pytesseract
from PIL import Image

from .. import config

if config.TESSERACT_CMD:
    pytesseract.pytesseract.tesseract_cmd = config.TESSERACT_CMD


def image_to_text(image: Image.Image) -> str:
    """Ejecuta Tesseract sobre una imagen ya preprocesada y devuelve el texto crudo."""
    return pytesseract.image_to_string(image, lang=config.TESSERACT_LANG)
