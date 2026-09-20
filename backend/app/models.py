from typing import Dict, Optional

from pydantic import BaseModel, Field


class InvoiceDraft(BaseModel):
    """Resultado del OCR + extracción automática, antes de que el usuario lo confirme."""

    fecha: Optional[str] = None
    trimestre: Optional[str] = None
    empresa: Optional[str] = None
    nif: Optional[str] = None
    base_imponible: Optional[str] = None
    descuento: Optional[str] = None
    iva: Optional[str] = None
    total: Optional[str] = None
    campos_detectados: Dict[str, bool] = Field(default_factory=dict)
    texto_ocr: Optional[str] = None
    upload_token: str


class InvoiceConfirm(BaseModel):
    """Datos finales confirmados/editados por el usuario, listos para guardar."""

    fecha: str  # formato YYYY-MM-DD
    trimestre: Optional[str] = None
    empresa: str
    nif: str
    base_imponible: str
    descuento: str = "0.00"
    iva: str
    total: str
    upload_token: str


class InvoiceRecord(BaseModel):
    """Una factura ya guardada en la base de datos."""

    id: str
    fecha: str
    trimestre: str
    empresa: str
    nif: str
    base_imponible: str
    descuento: str
    iva: str
    total: str
    pdf_filename: str
