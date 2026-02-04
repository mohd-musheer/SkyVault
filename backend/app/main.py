"""
FastAPI app: CORS, include routers, create tables on startup.
"""
from dotenv import load_dotenv
import os

load_dotenv() 
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import APP_NAME, CORS_ORIGINS, DEBUG
from app.database import engine, Base
from app.routes import router as auth_router
from app.files import router as files_router
from app.admin import router as admin_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create DB tables on startup
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print("⚠️ DB not ready yet:", e)
    yield
    # shutdown if needed
    pass


app = FastAPI(title=APP_NAME, debug=DEBUG, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(files_router)
app.include_router(admin_router)


@app.get("/")
def root():
    return {"app": APP_NAME, "status": "ok"}
