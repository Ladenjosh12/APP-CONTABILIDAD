# Backend — Contabilidad OCR API

API en FastAPI que recibe fotos de facturas, ejecuta OCR con Tesseract, extrae
los campos fiscales y los guarda en una base de datos Postgres (una fila por
factura, con el PDF como bytea), organizados por trimestre. El Excel se genera
al vuelo bajo demanda a partir de la base de datos (`GET /invoices/export/excel`).

## Despliegue en Render (recomendado — así funciona desde cualquier móvil)

1. Crea una cuenta gratuita en https://render.com (no requiere tarjeta para el plan Free).
2. Sube este proyecto a un repositorio en tu GitHub.
3. En el Dashboard de Render: **New → Blueprint**, conecta ese repositorio.
   Render detectará `render.yaml` en la raíz y creará automáticamente:
   - Un **Web Service** (`contabilidad-backend`) construido desde `backend/Dockerfile`.
   - Una base de datos **Postgres gratuita** (`contabilidad-db`), enlazada vía `DATABASE_URL`.
4. Aprueba el despliegue. La primera build tarda varios minutos (instala Tesseract).
5. Cuando termine, copia la URL pública (algo como `https://contabilidad-backend.onrender.com`)
   y pégala en `mobile/src/api/client.ts` (`API_BASE_URL`), luego recompila el APK.

**Importante — límites del plan gratuito de Render:**
- El servicio web gratuito "se duerme" tras 15 min sin tráfico; la primera petición tras
  dormirse tarda ~1 minuto en responder (arranque en frío). Es normal, no es un fallo.
- **La base de datos Postgres gratuita expira 30 días después de creada** (con 14 días de
  gracia tras eso antes de borrarse). Antes de que expire, súbela a un plan de pago
  (~6-7$/mes) desde el Dashboard de Render si quieres seguir usando la app sin perder
  el histórico de facturas. Render avisa por email antes de que expire.

## Desarrollo / pruebas locales

Necesitas un Postgres accesible (local o la propia base de datos de Render, que
también admite conexión externa desde su Dashboard → "External Database URL").

```powershell
cd backend
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt

$env:DATABASE_URL = "postgresql://usuario:contraseña@localhost:5432/contabilidad"
$env:TESSERACT_CMD = "C:\Program Files\Tesseract-OCR\tesseract.exe"  # si no está en el PATH
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

La tabla `invoices` se crea sola en el arranque si no existe.

### Instalar Tesseract OCR en local

**Windows:** instalador en https://github.com/UB-Mannheim/tesseract/wiki (marca el
paquete de idioma **Spanish**). **macOS:** `brew install tesseract tesseract-lang`.
**Linux:** `sudo apt install tesseract-ocr tesseract-ocr-spa`. En Render esto ya
viene instalado por el `Dockerfile`, no hace falta nada.

## Endpoints

| Método | Ruta                          | Descripción                                                |
|--------|-------------------------------|--------------------------------------------------------------|
| POST   | `/invoices/extract`           | Sube una imagen, devuelve los campos extraídos (borrador)   |
| POST   | `/invoices`                    | Confirma y guarda una factura en la base de datos            |
| GET    | `/invoices?anio=&trimestre=`   | Lista las facturas guardadas de un trimestre                 |
| GET    | `/invoices/{id}/pdf`           | Descarga/visualiza el PDF original de una factura            |
| GET    | `/invoices/export/excel?anio=` | Descarga un .xlsx con todas las facturas (todas o de un año) |
| GET    | `/health`                      | Comprobación de estado                                        |

## Scripts de verificación (opcional)

`scripts/` incluye herramientas usadas para probar el pipeline sin necesidad
de una factura real ni de la app móvil:

- `generar_factura_prueba.py` — crea una imagen de factura sintética en español (`scripts/factura_prueba.png`).
- `probar_pipeline.py` — ejecuta preprocesado + OCR + extracción directamente sobre esa imagen e imprime el resultado.
- `probar_api.py` — prueba de extremo a extremo contra la API (extract → guardar → listar → exportar → servir el PDF) usando `TestClient` y una base de datos Postgres real (necesita `DATABASE_URL`).

```powershell
venv\Scripts\Activate.ps1
python scripts\generar_factura_prueba.py
python scripts\probar_pipeline.py
python scripts\probar_api.py
```

## Notas sobre la precisión del OCR

Tesseract es gratuito pero menos robusto que una IA multimodal de pago frente
a facturas con diseños muy variados, letra manuscrita o fotos de baja calidad.
Por eso `/invoices/extract` devuelve `campos_detectados` indicando qué campos
NO se pudieron extraer con confianza: la app móvil siempre muestra una
pantalla de revisión editable antes de guardar. Si necesitas mayor precisión
en el futuro, se puede sustituir `app/ocr/engine.py` y
`app/ocr/extraction.py` por una llamada a un modelo multimodal (Claude/GPT-4
Vision) sin tocar el resto del backend.
