export interface InvoiceDraft {
  fecha: string | null;
  trimestre: string | null;
  empresa: string | null;
  nif: string | null;
  base_imponible: string | null;
  descuento: string | null;
  iva: string | null;
  total: string | null;
  campos_detectados: Record<string, boolean>;
  texto_ocr: string | null;
  upload_token: string;
}

export interface InvoiceConfirm {
  fecha: string;
  trimestre: string;
  empresa: string;
  nif: string;
  base_imponible: string;
  descuento: string;
  iva: string;
  total: string;
  upload_token: string;
}

export interface InvoiceRecord {
  id: string;
  fecha: string;
  trimestre: string;
  empresa: string;
  nif: string;
  base_imponible: string;
  descuento: string;
  iva: string;
  total: string;
  pdf_filename: string;
}
