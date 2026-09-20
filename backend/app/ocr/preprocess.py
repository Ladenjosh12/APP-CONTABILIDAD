import cv2
import numpy as np
from PIL import Image, ImageOps


def preprocess_image(image: Image.Image) -> Image.Image:
    """Mejora una foto de factura para maximizar la precisión de Tesseract:
    escala de grises, quitar ruido, enderezar (deskew), binarizar y
    escalar si la resolución es baja.
    """
    gray = np.array(ImageOps.grayscale(image))
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
