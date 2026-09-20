from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import init_db
from .routers import invoices

app = FastAPI(title="Contabilidad OCR API", version="1.0.0")

# CORS abierto: backend pensado para ser llamado desde la app móvil.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(invoices.router)


@app.on_event("startup")
async def on_startup():
    init_db()


@app.get("/health")
async def health():
    return {"status": "ok"}
