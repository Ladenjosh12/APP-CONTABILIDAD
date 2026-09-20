import re
import unicodedata
import uuid
from pathlib import Path
from typing import Optional, Tuple

import img2pdf
from PIL import Image

from .. import config


def _sanitize(texto: str) -> str:
    texto = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode("ascii")
    texto = re.sub(r"[^A-Za-z0-9]+", "_", texto).strip("_")
    return texto or "documento"


def nombre_archivo(fecha: str, empresa: str, nif: str) -> str:
    return f"{fecha}_{_sanitize(empresa)}_{_sanitize(nif)}.pdf"


def guardar_temporal(contenido: bytes, extension: str) -> Tuple[str, Path]:
    """Guarda la imagen recién subida en una carpeta temporal local, identificada por un
    token, para que /invoices/extract y /invoices (confirmación) puedan compartirla sin
    reenviar los bytes de la imagen dos veces desde el móvil. Es almacenamiento de corta
    duración (segundos/minutos mientras el usuario revisa) — no necesita sobrevivir a un
    redeploy, a diferencia de los datos ya confirmados (que van a la base de datos)."""
    token = uuid.uuid4().hex
    extension = extension if extension.startswith(".") else f".{extension}"
    ruta = config.TMP_UPLOADS_DIR / f"{token}{extension}"
    ruta.write_bytes(contenido)
    return token, ruta


def ruta_temporal(token: str) -> Optional[Path]:
    # El token es un uuid hex generado por el propio backend; no proviene de una
    # ruta arbitraria del cliente, así que el glob controlado es seguro.
    if not re.fullmatch(r"[0-9a-f]{32}", token):
        return None
    coincidencias = list(config.TMP_UPLOADS_DIR.glob(f"{token}.*"))
    return coincidencias[0] if coincidencias else None


def imagen_a_pdf_bytes(imagen_path: Path) -> bytes:
    """Convierte la imagen original a los bytes de un PDF de una página."""
    rgb_tmp_path = imagen_path.with_name(f"{imagen_path.stem}__rgb.jpg")
    with Image.open(imagen_path) as img:
        img.convert("RGB").save(rgb_tmp_path, "JPEG", quality=92)

    try:
        return img2pdf.convert(str(rgb_tmp_path))
    finally:
        rgb_tmp_path.unlink(missing_ok=True)
