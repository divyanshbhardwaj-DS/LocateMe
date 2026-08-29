import os

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402

import models  # noqa: E402
from database import engine, run_migrations  # noqa: E402
from routes import admin, location  # noqa: E402

models.Base.metadata.create_all(bind=engine)

run_migrations()

app = FastAPI(title="LocateMe API")

origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(location.router)
app.include_router(admin.router)


@app.get("/")
def health_check():
    return {"message": "Location API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}

