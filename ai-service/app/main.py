from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routes import router

app = FastAPI(title="Authra AI Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

app.include_router(router)
