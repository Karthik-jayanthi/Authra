import json

import pytest

from app.analyzer import analyze
from app.llm_client import LLMClient, LLMError
from app.models import AnalyzeRequest, PriceContext, RiskFactor, ScrapedProduct


def make_request() -> AnalyzeRequest:
    return AnalyzeRequest(
        product=ScrapedProduct(
            title="Nike Air Zoom Pegasus 40 - AAA High Copy Mirror Quality",
            brand="Nike",
            seller="ShoeBazaarXpress",
            price="1499",
            currency="INR",
            url="https://example.com/product/1",
            images=["https://example.com/img.jpg"],
            description="1:1 replica, not original packaging, ships from warehouse.",
            specs={"Material": "Mesh"},
            rating=4.9,
            reviewCount=3,
            availability="In Stock",
            site="generic",
        ),
        ruleFactors=[
            RiskFactor(label="Seller credibility", status="caution", detail="No history yet."),
        ],
        priceContext=PriceContext(listedPrice=1499, marketAverage=8999, currency="INR"),
    )


class FakeClient(LLMClient):
    def __init__(self, response: str) -> None:
        self._response = response

    async def complete_json(self, system_prompt: str, user_prompt: str) -> str:
        return self._response


class FailingClient(LLMClient):
    async def complete_json(self, system_prompt: str, user_prompt: str) -> str:
        raise LLMError("boom")


@pytest.mark.asyncio
async def test_analyze_parses_valid_model_output():
    payload = make_request()
    fake_json = json.dumps(
        {
            "ai_factors": [
                {"label": "Suspicious wording", "status": "danger", "detail": "Title uses replica/high-copy phrasing."},
                {"label": "Brand verification", "status": "danger", "detail": "Unverified seller for a major brand at a steep discount."},
                {"label": "Product consistency", "status": "safe", "detail": "Specs are internally consistent."},
            ],
            "reasoning": "This listing uses replica terminology and is priced far below market for the brand, both strong counterfeit signals.",
            "recommendation": "Avoid this listing.",
            "score_adjustment": -18,
            "confidence": 88,
        }
    )

    result = await analyze(payload, FakeClient(fake_json))

    assert result.score_adjustment == -18
    assert result.ai_factors[0].label == "Suspicious wording"
    assert result.ai_factors[0].status == "danger"


@pytest.mark.asyncio
async def test_analyze_falls_back_on_llm_error():
    payload = make_request()
    result = await analyze(payload, FailingClient())

    assert result.score_adjustment == 0
    assert result.ai_factors[0].label == "AI analysis"


@pytest.mark.asyncio
async def test_analyze_falls_back_on_malformed_json():
    payload = make_request()
    result = await analyze(payload, FakeClient("not json at all"))

    assert result.score_adjustment == 0
