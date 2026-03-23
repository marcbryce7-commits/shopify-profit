"""
ProfitPilot AI Shipping Agent — FastAPI service that scans connected email
accounts for shipping invoices and extracts cost data using an LLM.
"""

import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Header

load_dotenv()

from app.routes import router  # noqa: E402


def verify_api_secret(authorization: str = Header(default="")) -> None:
    """Validate the bearer token matches INTERNAL_API_SECRET."""
    expected = os.getenv("INTERNAL_API_SECRET", "")
    if not expected:
        return  # no secret configured — allow all (dev mode)
    token = authorization.removeprefix("Bearer ").strip()
    if token != expected:
        raise HTTPException(status_code=401, detail="Invalid API secret")


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None, None]:
    yield


app = FastAPI(
    title="ProfitPilot Shipping Agent",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(router, dependencies=[Depends(verify_api_secret)])


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
