from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.api.router import router

app = FastAPI(
    title="AskDocs API",
    description="AI-Powered Document Intelligence Platform",
    version="1.0.0",
)

# -----------------------------
# CORS
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:5501",
        "http://localhost:5501",
        "http://127.0.0.1:3000",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Session Middleware
# Required for Google OAuth
# -----------------------------
app.add_middleware(
    SessionMiddleware,
    secret_key="askdocs_super_secret_key",
    same_site="lax",
    https_only=False,
)

# -----------------------------
# Include All API Routes
# -----------------------------
app.include_router(router)

# -----------------------------
# Root Endpoint
# -----------------------------
@app.get("/", tags=["Root"])
async def root():
    return {
        "application": "AskDocs",
        "version": "1.0.0",
        "status": "Running",
    }

# -----------------------------
# Health Check
# -----------------------------
@app.get("/health", tags=["Health"])
async def health():
    return {
        "status": "healthy",
        "message": "AskDocs Backend is running successfully.",
    }