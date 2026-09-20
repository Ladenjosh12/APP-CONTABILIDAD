import cv2
import numpy as np
from PIL import Image, ImageOps


# Las fotos de móvil actuales (12+ MP) son muchísimo más grandes de lo que
# Tesseract necesita para leer bien el texto, y operaciones como el
# denoising son muy costosas en píxeles: sin este límite, una foto de
# 3024x4032 tarda ~90 s en preprocesarse en un servidor con poca CPU/RAM
# (como el plan gratuito de Render). 2000 px de lado mayor es de sobra
# para OCR de una factura y reduce ese tiempo a unos pocos segundos.
MAX_DIMENSION_ENTRADA = 2000


def preprocess_image(image: Image.Image) -> Image.Image:
    """Mejora una foto de factura para maximizar la precisión de Tesseract:
    reduce el tamaño si es muy grande, escala de grises, quitar ruido,
    enderezar (deskew), binarizar y volver a escalar si la resolución
    resultante es baja.
    """
    gray = np.array(ImageOps.grayscale(image))

    max_dim_entrada = max(gray.shape)
    if max_dim_entrada > MAX_DIMENSION_ENTRADA:
        escala = MAX_DIMENSION_ENTRADA / max_dim_entrada
        gray = cv2.resize(gray, None, fx=escala, fy=escala, interpolation=cv2.INTER_AREA)

    gray = cv2.fastNlMeansDenoising(gray, h=10)
    gray = _deskew(gray)

    binary = cv2.adaptiveThreshold(
        gray,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31,
        11,
    )

    max_dim = max(binary.shape)
    if max_dim < 1800:
        scale = 1800 / max_dim
        binary = cv2.resize(binary, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)

    return Image.fromarray(binary)


def _deskew(gray: np.ndarray) -> np.ndarray:
    _, binary_inv = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    coords = np.column_stack(np.where(binary_inv > 0))
    if coords.shape[0] < 20:
        return gray

    angle = cv2.minAreaRect(coords)[-1]
    angle = -(90 + angle) if angle < -45 else -angle
    if abs(angle) < 0.5 or abs(angle) > 15:
        # Ángulo insignificante o probablemente mal calculado: no rotar.
        return gray

    h, w = gray.shape
    matrix = cv2.getRotationMatrix2D((w // 2, h // 2), angle, 1.0)
    return cv2.warpAffine(gray, matrix, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
