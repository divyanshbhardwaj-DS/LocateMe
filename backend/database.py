import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./locations.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def _table_columns(table: str) -> set:
    with engine.connect() as conn:
        rows = conn.execute(text(f"PRAGMA table_info({table})")).fetchall()
    return {row[1] for row in rows}


def run_migrations() -> None:
    """Add new columns to existing tables without dropping data (idempotent)."""
    cols = _table_columns("locations")
    additions = {
        "source": "VARCHAR(64)",
        "captured_at": "DATETIME",
        "formatted_address": "TEXT",
        "street_number": "VARCHAR(128)",
        "street": "VARCHAR(256)",
        "neighborhood": "VARCHAR(256)",
        "locality": "VARCHAR(256)",
        "district": "VARCHAR(256)",
        "country_code": "VARCHAR(8)",
        "place_id": "VARCHAR(256)",
        "plus_code": "VARCHAR(64)",
        "geocode_type": "VARCHAR(64)",
        "geocode_source": "VARCHAR(32)",
    }
    with engine.begin() as conn:
        for name, decl in additions.items():
            if name not in cols:
                conn.execute(text(f"ALTER TABLE locations ADD COLUMN {name} {decl}"))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
