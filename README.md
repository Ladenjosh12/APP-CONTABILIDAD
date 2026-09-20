# Contabilidad de facturas — captura, OCR y Excel por trimestres

App de contabilidad que permite fotografiar o subir una factura desde el
móvil, extraer automáticamente sus campos fiscales mediante OCR, guardar el
PDF original y registrar cada documento en una base de datos organizada por
trimestre, con exportación a Excel bajo demanda.

**Backend en producción:** https://contabilidad-backend-1sgr.onrender.com

## Arquitectura

```
[App móvil RN/Expo] --(foto)--> POST /invoices/extract --> [FastAPI backend, Render]
                                                                 |
                                                    preprocesado (OpenCV/PIL)
                                                                 |
                                                    OCR (Tesseract, gratuito)
                                                                 |
                                                    extracción por reglas (regex)
                                                                 |
                                              <-- JSON borrador (campos + detectado sí/no)
[Pantalla de revisión editable] --(usuario corrige y confirma)-->
                                        POST /invoices (JSON final + imagen)
                                                                 |
                                          imagen -> PDF (img2pdf)
                                          guarda fila + PDF (bytea) en Postgres (Render)
                                                                 |
[Historial / Detalle] <--- GET /invoices?anio=&trimestre=      (consulta Postgres)
                       <--- GET /invoices/{id}/pdf               (sirve el PDF)
                       <--- GET /invoices/export/excel?anio=     (genera el .xlsx al vuelo)
```

- **Backend**: Python + FastAPI, desplegado en Render (Docker) — `backend/`
- **Base de datos**: Postgres (Render, plan gratuito) — una fila por factura, PDF incluido como dato binario
- **OCR**: Tesseract vía `pytesseract` (gratuito, sin dependencia de una API de pago)
- **Extracción de campos**: reglas/regex especializadas en facturas españolas (NIF/CIF, fechas, importes con IVA)
- **App móvil**: React Native + Expo — `mobile/`
- **Excel**: no es un archivo fijo en disco; se genera al vuelo desde la base de datos cada vez que se pide (`GET /invoices/export/excel`), con una pestaña por `{año}-T{n}`

## Por qué la base de datos en vez de un archivo Excel fijo

La primera versión guardaba un único `.xlsx` en disco. Al desplegar en la nube
(para que la app funcione desde cualquier móvil, no solo en la red local) esto
dejó de ser viable: los servidores gratuitos tienen almacenamiento efímero, y
un archivo en disco se perdería en cada reinicio. Por eso los datos ahora
viven en Postgres (persistente) y el Excel se genera bajo demanda a partir de
ahí — el resultado es el mismo (una pestaña por trimestre, todas las
columnas pedidas), solo cambia cómo se guarda internamente.

## Puesta en marcha

1. **Backend** — ya está desplegado y funcionando en Render (ver URL arriba).
   Para desplegar tu propia copia o desarrollar en local, ver [`backend/README.md`](backend/README.md).
2. **App móvil** — el APK ya compilado apunta al backend en producción. Para
   generar uno nuevo o modificar la app, ver [`mobile/README.md`](mobile/README.md).

## Por qué Tesseract (gratuito) en vez de una IA de pago

Se eligió Tesseract por ser gratuito, sin coste por imagen ni dependencia de
una API externa de pago. Como contrapartida, es menos robusto que un modelo
multimodal (Claude/GPT-4 Vision) ante facturas con diseños muy variados o
fotos de baja calidad. Por eso el flujo de la app **siempre** pasa por una
pantalla de revisión editable antes de guardar, donde los campos que el OCR
no pudo detectar con confianza se resaltan en rojo. Si en el futuro se
necesita más precisión automática, basta con sustituir
`backend/app/ocr/engine.py` y `backend/app/ocr/extraction.py` por una llamada
a un modelo multimodal, sin tocar el resto de la aplicación.

## Verificación realizada

- Backend probado de extremo a extremo **contra el despliegue real en Render**:
  extracción OCR (8/8 campos detectados en la factura de prueba), guardado en
  Postgres, listado, descarga del PDF y exportación a Excel — todo funcionando
  en producción (`backend/scripts/probar_produccion.ps1`).
- App móvil compilada como **APK release real** (JS empaquetado dentro, sin
  depender de Metro ni de ningún PC encendido) y verificada por el usuario
  instalándola en su propio teléfono.
- La factura de prueba usada para verificar se eliminó de la base de datos de
  producción antes de la entrega (vía `DELETE /invoices/{id}`).

## Límites del plan gratuito (a tener en cuenta)

- El servicio web de Render "se duerme" tras 15 min sin tráfico; la primera
  petición tras dormirse tarda ~1 minuto en responder. Normal, no es un fallo.
- **La base de datos Postgres gratuita de Render expira 30 días después de
  creada** (con 14 días de gracia antes de borrarse). Para no perder el
  histórico de facturas, súbela a un plan de pago (~6-7 $/mes) desde el
  Dashboard de Render antes de que expire — Render avisa por email con
  antelación.
- El OCR gratuito puede fallar en facturas con diseños poco habituales o
  fotos de baja calidad; por eso la revisión manual en la app es obligatoria
  antes de guardar.
