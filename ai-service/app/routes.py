from fastapi import APIRouter, HTTPException

from .analyzer import analyze
from .llm_client import get_llm_client
from .models import AnalyzeRequest, AnalyzeResponse

router = APIRouter(prefix="/v1")


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_product(payload: AnalyzeRequest) -> AnalyzeResponse:
    try:
        client = get_llm_client()
    except Exception as err:  # missing API key, bad provider config, etc.
        raise HTTPException(status_code=503, detail=f"AI service not configured: {err}") from err

    result = await analyze(payload, client)
    return AnalyzeResponse(result=result)


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
