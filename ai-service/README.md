# Authra — AI Service (Stage 3)

FastAPI service that adds the analysis a rules engine can't do on its own:
reading the listing's actual text for suspicious wording, judging whether
the brand/seller/price combination makes sense, and checking that the
title/description/specs are internally consistent. The Node backend calls
this for every `/v1/verify` request and merges the result with its
rule-based factors (seller history, price-vs-market, review counts, etc).

## Setup

```bash
cd ai-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in OPENAI_API_KEY
uvicorn app.main:app --reload --port 8000
```

`GET http://localhost:8000/v1/health` should return `{"status": "ok"}`.

Then point the Node backend at it — `backend/.env`'s `AI_SERVICE_URL` should
be `http://localhost:8000` (already the default).

## Endpoint

`POST /v1/analyze`

```jsonc
// request
{
  "product": { /* same ScrapedProduct shape the extension scrapes */ },
  "ruleFactors": [{ "label": "Seller credibility", "status": "safe", "detail": "..." }],
  "priceContext": { "listedPrice": 1499, "marketAverage": 8999, "currency": "INR" }
}
```

```jsonc
// response
{
  "status": "ok",
  "result": {
    "ai_factors": [
      { "label": "Suspicious wording", "status": "danger", "detail": "..." },
      { "label": "Brand verification", "status": "danger", "detail": "..." },
      { "label": "Product consistency", "status": "safe", "detail": "..." }
    ],
    "reasoning": "one paragraph, plain English",
    "recommendation": "one sentence",
    "score_adjustment": -18,
    "confidence": 88
  }
}
```

`score_adjustment` (-20 to +20) is added to the Node backend's rule-based
score, not a replacement for it — the two are meant to move together.

## Why it's built this way

- **`llm_client.py`** hides the actual provider behind one method,
  `complete_json`. `OpenAIClient` is implemented; `GeminiClient` is a stub
  with the same interface so switching `LLM_PROVIDER=gemini` later doesn't
  touch `analyzer.py` or `routes.py` at all.
- **`analyzer.py`** always returns a valid `AnalyzeResult`, even if the LLM
  call fails or returns something that doesn't parse as JSON — it falls back
  to a neutral, zero-adjustment result instead of raising, so one bad model
  response doesn't break verification for the user. The Node backend takes
  the same approach one level up: if this whole service is unreachable,
  `/v1/verify` still responds using rule-based signals alone.
- **`prompts.py`** is deliberately narrow — it only asks the model for the
  three things a rules engine can't do (wording, brand/seller/price sense,
  internal consistency), not a full re-score. Keeping the model's job small
  is what keeps its output reliable enough to merge programmatically.

## Testing without an API key

```bash
pip install -r requirements-dev.txt
pytest
```

`tests/test_analyzer.py` swaps in a fake `LLMClient` so the parsing/fallback
logic is tested without hitting OpenAI — useful for CI or working offline.

## Structure

```
app/
  main.py         FastAPI app + CORS
  routes.py        POST /v1/analyze, GET /v1/health
  analyzer.py       orchestration + fallback handling
  llm_client.py     provider-agnostic LLM wrapper (OpenAI implemented, Gemini stubbed)
  prompts.py        system prompt + per-request prompt builder
  models.py         pydantic request/response schemas
  config.py         env var settings
tests/
  test_analyzer.py
```
