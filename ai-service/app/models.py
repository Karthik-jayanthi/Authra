from typing import Literal

from pydantic import BaseModel, Field

RiskLevel = Literal["safe", "caution", "danger"]


class ScrapedProduct(BaseModel):
    title: str | None
    brand: str | None
    seller: str | None
    price: str | None
    currency: str | None
    url: str
    images: list[str] = Field(default_factory=list)
    description: str | None
    specs: dict[str, str] = Field(default_factory=dict)
    rating: float | None
    review_count: int | None = Field(alias="reviewCount", default=None)
    availability: str | None
    site: str

    model_config = {"populate_by_name": True}


class RiskFactor(BaseModel):
    label: str
    status: RiskLevel
    detail: str


class PriceContext(BaseModel):
    listed_price: float | None = Field(alias="listedPrice", default=None)
    market_average: float | None = Field(alias="marketAverage", default=None)
    currency: str = "INR"

    model_config = {"populate_by_name": True}


class AnalyzeRequest(BaseModel):
    product: ScrapedProduct
    rule_factors: list[RiskFactor] = Field(alias="ruleFactors", default_factory=list)
    price_context: PriceContext = Field(alias="priceContext", default_factory=PriceContext)

    model_config = {"populate_by_name": True}


class AnalyzeResult(BaseModel):
    ai_factors: list[RiskFactor]
    reasoning: str
    recommendation: str
    score_adjustment: int = Field(ge=-20, le=20)
    confidence: int = Field(ge=0, le=100)


class AnalyzeResponse(BaseModel):
    status: Literal["ok"] = "ok"
    result: AnalyzeResult
