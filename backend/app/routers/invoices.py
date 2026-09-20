from datetime import date
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import Response
from PIL import Image, UnidentifiedImageError

from ..models import InvoiceConfirm, InvoiceDraft, InvoiceRecord
from ..ocr.engine import image_to_text
from ..ocr.extraction import extraer_campos
from ..ocr.preprocess import preprocess_image
from ..storage import excel_manager, pdf_storage

router = APIRouter(prefix="/invoices", tags=["invoices"])


@router.post("/extract", response_model=InvoiceDraft)
async def extraer_factura(archivo: UploadFile = File(...)):
    """Recibe la foto de una factura, ejecuta OCR + extracción de campos y
    devuelve un borrador. No guarda nada en la base de datos todavía."""
    contenido = await archivo.read()
    if not contenido:
        raise HTTPException(400, "El archivo está vacío")

    extension = Path(archivo.filename or "imagen.jpg").suffix or ".jpg"
    token, ruta_temp = pdf_storage.guardar_temporal(contenido, extension)

    try:
        with Image.open(ruta_temp) as imagen:
            imagen.load()
            imagen_procesada = preprocess_image(imagen)
    except UnidentifiedImageError as exc:
        raise HTTPException(422, "El archivo subido no es una imagen válida") from exc

    texto = image_to_text(imagen_procesada)
    resultado = extraer_campos(texto)
    campos = resultado["campos"]

    return InvoiceDraft(
        fecha=campos["fecha"],
        trimestre=campos["trimestre"],
        empresa=campos["empresa"],
        nif=campos["nif"],
        base_imponible=campos["base_imponible"],
        descuento=campos["descuento"],
        iva=campos["iva"],
        total=campos["total"],
        campos_detectados=resultado["detectados"],
        texto_ocr=texto,
        upload_token=token,
    )


def _decimal(valor: str, campo: str) -> Decimal:
    try:
        return Decimal(valor.replace(",", "."))
    except InvalidOperation as exc:
        raise HTTPException(400, f"Importe inválido en el campo '{campo}': {valor}") from exc


@router.post("", response_model=InvoiceRecord)
async def guardar_factura(datos: InvoiceConfirm):
    """Guarda la factura ya revisada/confirmada por el usuario: convierte la imagen
    original a PDF y la inserta, junto al resto de campos, en la base de datos."""
    ruta_origen = pdf_storage.ruta_temporal(datos.upload_token)
    if ruta_origen is None:
        raise HTTPException(
            404,
            "No se encontró la imagen subida (upload_token inválido o expirado). "
            "Vuelve a capturar la foto e inténtalo de nuevo.",
        )

    try:
        fecha_obj = date.fromisoformat(datos.fecha)
    except ValueError as exc:
        raise HTTPException(400, "Fecha inválida, se espera formato YYYY-MM-DD") from exc

    trimestre = datos.trimestre or f"T{((fecha_obj.month - 1) // 3) + 1}"
    pdf_filename = pdf_storage.nombre_archivo(datos.fecha, datos.empresa, datos.nif)
    pdf_bytes = pdf_storage.imagen_a_pdf_bytes(ruta_origen)

    nuevo_id = excel_manager.insertar_factura(
        fecha=fecha_obj,
        trimestre=trimestre,
        empresa=datos.empresa,
        nif=datos.nif,
        base_imponible=_decimal(datos.base_imponible, "base_imponible"),
        descuento=_decimal(datos.descuento, "descuento"),
        iva=_decimal(datos.iva, "iva"),
        total=_decimal(datos.total, "total"),
        pdf_filename=pdf_filename,
        pdf_data=pdf_bytes,
    )

    ruta_origen.unlink(missing_ok=True)

    return InvoiceRecord(
        id=str(nuevo_id),
        fecha=datos.fecha,
        trimestre=trimestre,
        empresa=datos.empresa,
        nif=datos.nif,
        base_imponible=datos.base_imponible,
        descuento=datos.descuento,
        iva=datos.iva,
        total=datos.total,
        pdf_filename=pdf_filename,
    )


@router.get("", response_model=List[InvoiceRecord])
async def listar_facturas(anio: int, trimestre: str):
    """Lista las facturas guardadas de un año y trimestre concretos."""
    filas = excel_manager.listar_filas(anio, trimestre)
    return [InvoiceRecord(**fila) for fila in filas]


@router.get("/export/excel")
async def exportar_excel(anio: Optional[int] = None):
    """Descarga un libro Excel (una pestaña por año-trimestre) generado al vuelo
    desde la base de datos. Sin `anio`, exporta el histórico completo."""
    contenido = excel_manager.exportar_excel(anio)
    nombre = f"Contabilidad_{anio}.xlsx" if anio else "Contabilidad.xlsx"
    return Response(
        content=contenido,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{nombre}"'},
    )


@router.get("/{invoice_id}/pdf")
async def obtener_pdf(invoice_id: int):
    """Sirve el PDF original de una factura a partir de su id."""
    resultado = excel_manager.obtener_pdf(invoice_id)
    if resultado is None:
        raise HTTPException(404, "Factura no encontrada")
    return Response(
        content=resultado["pdf_data"],
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{resultado["pdf_filename"]}"'},
    )
