import axios from "axios";

// URL pública del backend desplegado en Render (HTTPS). Se actualiza una vez
// que el servicio esté desplegado — mientras tanto puedes apuntar temporalmente
// a tu IP local para probar contra el backend corriendo en tu PC, ej.
// "http://192.168.1.18:8000" ("localhost" no funciona desde un dispositivo físico).
export const API_BASE_URL = "https://contabilidad-backend.onrender.com";

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
