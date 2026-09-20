# Contabilidad de facturas — captura, OCR y Excel por trimestres

App de contabilidad que permite fotografiar o subir una factura desde el
móvil, extraer automáticamente sus campos fiscales mediante OCR, guardar la
imagen original como PDF, y registrar cada documento como una fila en un
Excel único organizado por pestañas de trimestre (`{año}-T{n}`).

## Arquitectura

```
[App móvil RN/Expo] --(foto)--> POST /invoices/extract --> [FastAPI backend]
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
                                          guarda en data/facturas/{año}/{trimestre}/
                                          añade fila en hoja "{año}-T{n}" de Contabilidad.xlsx
                                                                 |
[Historial / Detalle] <--- GET /invoices?anio=&trimestre=   (lee el Excel)
                       <--- GET /invoices/pdf/{ruta}         (sirve el PDF)
```

- **Backend**: Python + FastAPI (`backend/`)
- **OCR**: Tesseract vía `pytesseract` (gratuito, local, sin dependencia de API externa)
- **Extracción de campos**: reglas/regex especializadas en facturas españolas (NIF/CIF, fechas, importes con IVA)
- **App móvil**: React Native + Expo (`mobile/`)
- **Persistencia**: PDFs individuales por factura + un único libro Excel continuo (`openpyxl`)

## Puesta en marcha rápida

1. **Backend** — ver [`backend/README.md`](backend/README.md) (instalar Tesseract, crear venv, `pip install -r requirements.txt`, `uvicorn app.main:app --reload --host 0.0.0.0`)
2. **App móvil** — ver [`mobile/README.md`](mobile/README.md) (`npm install`, configurar la IP del backend en `src/api/client.ts`, `npx expo start`)

## Por qué Tesseract (gratuito) en vez de una IA de pago

Se eligió Tesseract por ser gratuito y funcionar localmente, sin coste por
imagen ni dependencia de una API externa. Como contrapartida, es menos
robusto que un modelo multimodal de pago (Claude/GPT-4 Vision) ante facturas
con diseños muy variados o fotos de baja calidad. Por eso el flujo de la app
**siempre** pasa por una pantalla de revisión editable antes de guardar,
donde los campos que el OCR no pudo detectar con confianza se resaltan en
rojo para que el usuario los complete a mano. Si en el futuro se necesita
más precisión automática, basta con sustituir `backend/app/ocr/engine.py` y
`backend/app/ocr/extraction.py` por una llamada a un modelo multimodal, sin
tocar el resto de la aplicación.

## Verificación realizada

El backend se instaló y probó de extremo a extremo en este entorno: se
generó una factura sintética en español, se envió a `POST /invoices/extract`
(OCR + extracción, los 8 campos se detectaron correctamente), se confirmó
con `POST /invoices` y se comprobó que el PDF se creó en
`data/facturas/2026/T1/...` y que la fila apareció correctamente en la
pestaña `2026-T1` de `Contabilidad.xlsx`. También se comprobó que el
servidor real (`uvicorn`) arranca sin errores. Ver
`backend/scripts/probar_api.py` para repetir esta prueba.

La app móvil (React Native/Expo) **no** se ha podido ejecutar en este
entorno por no haber un emulador ni un dispositivo conectado — el código
está completo y listo para probarse con `npx expo start` + Expo Go siguiendo
[`mobile/README.md`](mobile/README.md).

## Limitaciones conocidas de esta primera versión

- El backend corre en local (tu máquina o red privada); no incluye despliegue en la nube.
- El libro Excel es un único archivo en disco protegido con un lock de archivo — pensado para uso de una sola persona/pequeño negocio, no para escritura concurrente a gran escala.
- El OCR gratuito (Tesseract) puede fallar en facturas con diseños poco habituales, letra manuscrita o fotos de baja calidad; por eso la revisión manual en la app es obligatoria antes de guardar.
