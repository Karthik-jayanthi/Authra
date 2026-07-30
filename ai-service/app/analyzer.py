import json
import logging

from .llm_client import LLMClient, LLMError
from .models import AnalyzeRequest, AnalyzeResult, RiskFactor
from .prompts import SYSTEM_PROMPT, build_user_prompt

logger = logging.getLogger("authra.analyzer")


def _fallback_result(reason: str) -> AnalyzeResult:
    # If the AI call fails or returns something we can't parse, we don't want
    # to crash the whole verification — we return a neutral, zero-adjustment
    # result so the Node backend can still respond with its rule-based score.
    logger.warning("AI analysis unavailable, falling back: %s", reason)
    return AnalyzeResult(
        ai_factors=[
            RiskFactor(
                label="AI analysis",
                status="caution",
                detail="Deeper language analysis is temporarily unavailable; relying on rule-based signals.",
            )
        ],
        reasoning="A deeper text analysis of this listing wasn't available, so this result reflects rule-based signals only.",
        recommendation="Review the other signals below before deciding.",
        score_adjustment=0,
        confidence=40,
    )


async def analyze(payload: AnalyzeRequest, client: LLMClient) -> AnalyzeResult:
    user_prompt = build_user_prompt(payload)

    try:
        raw = await client.complete_json(SYSTEM_PROMPT, user_prompt)
    except LLMError as err:
        return _fallback_result(str(err))

    try:
        data = json.loads(raw)
        return AnalyzeResult.model_validate(data)
    except (json.JSONDecodeError, ValueError) as err:
        return _fallback_result(f"unparseable model output: {err}")
