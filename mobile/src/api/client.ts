import axios from "axios";

// URL pública del backend desplegado en Render. Verificada en producción:
// extracción OCR, guardado, listado, PDF y exportación a Excel funcionando.
export const API_BASE_URL = "https://contabilidad-backend-1sgr.onrender.com";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export function pdfUrl(invoiceId: string): string {
  return `${API_BASE_URL}/invoices/${invoiceId}/pdf`;
}

export function excelExportUrl(anio?: number): string {
  return anio
    ? `${API_BASE_URL}/invoices/export/excel?anio=${anio}`
    : `${API_BASE_URL}/invoices/export/excel`;
}
