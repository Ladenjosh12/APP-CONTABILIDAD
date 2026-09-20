import os

import psycopg2

DATABASE_URL = os.environ.get("DATABASE_URL")

DDL = """
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    fecha DATE NOT NULL,
    anio INTEGER NOT NULL,
    trimestre TEXT NOT NULL,
    empresa TEXT NOT NULL,
    nif TEXT NOT NULL,
    base_imponible NUMERIC(12, 2) NOT NULL,
    descuento NUMERIC(12, 2) NOT NULL DEFAULT 0,
    iva NUMERIC(12, 2) NOT NULL,
    total NUMERIC(12, 2) NOT NULL,
    pdf_filename TEXT NOT NULL,
    pdf_data BYTEA NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_invoices_anio_trimestre ON invoices (anio, trimestre);
"""


def get_connection():
    if not DATABASE_URL:
        raise RuntimeError(
            "Falta la variable de entorno DATABASE_URL (cadena de conexión a Postgres). "
            "En Render, enlaza el servicio a la base de datos Postgres para que se inyecte sola."
        )
    return psycopg2.connect(DATABASE_URL)


def init_db() -> None:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(DDL)
        conn.commit()
