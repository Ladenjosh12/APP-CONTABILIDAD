import re
from datetime import date
from typing import Dict, List, Optional

from dateutil import parser as dateutil_parser

# NIF (letra+8 dígitos, u 8 dígitos+letra) y CIF (letra+7 dígitos+dígito/letra).
NIF_RE = re.compile(r"\b([A-Z]\d{7}[A-Z0-9]|\d{8}[A-Z])\b")

DATE_RE = re.compile(r"\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})\b")

AMOUNT_RE = re.compile(r"(\d{1,3}(?:[.\s]\d{3})*(?:,\d{1,2})?|\d+(?:,\d{1,2})?)\s*(?:€|EUR)?")

MESES = {
    "enero": 1, "febrero": 2, "marzo": 3, "abril": 4, "mayo": 5, "junio": 6,
    "julio": 7, "agosto": 8, "septiembre": 9, "octubre": 10, "noviembre": 11, "diciembre": 12,
}

BASE_LABELS = ["base imponible", "base imp"]
IVA_LABELS = ["iva", "i.v.a"]
DESCUENTO_LABELS = ["descuento", "dto.", "dto "]
TOTAL_LABELS = ["total a pagar", "importe total", "total factura", "total"]


def trimestre_de(fecha: date) -> str:
    return f"T{((fecha.month - 1) // 3) + 1}"


def _normaliza_importe(texto: str) -> Optional[str]:
    texto = texto.strip()
    if not texto:
        return None
    limpio = texto.replace(" ", "")
    if "," in limpio and "." in limpio:
        limpio = limpio.replace(".", "").replace(",", ".")
    elif "," in limpio:
        limpio = limpio.replace(",", ".")
    try:
        return f"{float(limpio):.2f}"
    except ValueError:
        return None


def _busca_importe_en_lineas(lineas: List[str], etiquetas: List[str]) -> Optional[str]:
    for i, linea in enumerate(lineas):
        linea_lower = linea.lower()
        if not any(etiqueta in linea_lower for etiqueta in etiquetas):
            continue

        candidatos = [c for c in AMOUNT_RE.findall(linea) if c.strip()]
        if candidatos:
            importe = _normaliza_importe(candidatos[-1])
            if importe is not None:
                return importe

        if i + 1 < len(lineas):
            candidatos_siguiente = [c for c in AMOUNT_RE.findall(lineas[i + 1]) if c.strip()]
            if candidatos_siguiente:
                importe = _normaliza_importe(candidatos_siguiente[-1])
                if importe is not None:
                    return importe
    return None


def _extrae_fecha(texto: str) -> Optional[date]:
    match = DATE_RE.search(texto)
    if match:
        dia, mes, anio = match.groups()
        anio_num = int(anio)
        if anio_num < 100:
            anio_num += 2000
        try:
            return date(anio_num, int(mes), int(dia))
        except ValueError:
            pass

    texto_lower = texto.lower()
    for nombre_mes, numero_mes in MESES.items():
        patron = re.compile(rf"(\d{{1,2}})\s+de\s+{nombre_mes}\s+de\s+(\d{{4}})")
        match = patron.search(texto_lower)
        if match:
            dia, anio = match.groups()
            try:
                return date(int(anio), numero_mes, int(dia))
            except ValueError:
                pass

    try:
        return dateutil_parser.parse(texto, dayfirst=True, fuzzy=True).date()
    except (ValueError, OverflowError):
        return None


def _extrae_nif(texto: str) -> Optional[str]:
    match = NIF_RE.search(texto.upper())
    return match.group(1) if match else None


def _extrae_empresa(lineas: List[str], nif: Optional[str]) -> Optional[str]:
    for linea in lineas[:8]:
        limpio = linea.strip()
        if len(limpio) < 3:
            continue
        if nif and nif in limpio.upper():
            continue
        if NIF_RE.search(limpio.upper()):
            continue
        if re.fullmatch(r"[\d\s/.,€\-]+", limpio):
            continue
        return limpio
    return None


def extraer_campos(texto_ocr: str) -> Dict:
    """A partir del texto crudo de Tesseract, intenta extraer los campos de la factura.

    Devuelve tanto los valores como qué campos se detectaron realmente, para que
    la app pueda resaltar en la pantalla de revisión lo que el usuario debe
    completar o corregir a mano.
    """
    lineas = [l for l in texto_ocr.splitlines() if l.strip()]

    fecha = _extrae_fecha(texto_ocr)
    nif = _extrae_nif(texto_ocr)
    empresa = _extrae_empresa(lineas, nif)

    base_imponible = _busca_importe_en_lineas(lineas, BASE_LABELS)
    iva = _busca_importe_en_lineas(lineas, IVA_LABELS)
    descuento = _busca_importe_en_lineas(lineas, DESCUENTO_LABELS)
    total = _busca_importe_en_lineas(lineas, TOTAL_LABELS)

    trimestre = trimestre_de(fecha) if fecha else None

    campos = {
        "fecha": fecha.isoformat() if fecha else None,
        "trimestre": trimestre,
        "empresa": empresa,
        "nif": nif,
        "base_imponible": base_imponible,
        "descuento": descuento if descuento is not None else "0.00",
        "iva": iva,
        "total": total,
    }

    detectados = {
        "fecha": fecha is not None,
        "trimestre": trimestre is not None,
        "empresa": empresa is not None,
        "nif": nif is not None,
        "base_imponible": base_imponible is not None,
        "descuento": descuento is not None,
        "iva": iva is not None,
        "total": total is not None,
    }

    return {"campos": campos, "detectados": detectados}
