# Authra

AI-powered product authenticity checker. Building this in three stages, per
the brief:

- [x] **Stage 1 — Extension UI + scraping**: `extension/`
- [x] **Stage 2 — Backend**: `backend/` — Express + MongoDB + JWT, `/v1/verify` API
- [x] **Stage 3 — AI service**: `ai-service/` — FastAPI + OpenAI, adds suspicious-wording,
      brand-verification, and product-consistency analysis on top of the backend's
      rule-based signals

See `extension/README.md`, `backend/README.md`, and `ai-service/README.md` for setup.

## Running the whole thing

Three processes, in this order (each needs its own terminal):

1. `ai-service` — `uvicorn app.main:app --reload --port 8000`
2. `backend` — `npm run dev` (needs `AI_SERVICE_URL=http://localhost:8000` in its `.env`, which is the default)
3. `extension` — `npm run dev`, then load `extension/dist` as an unpacked extension

If step 1 isn't running, step 2 still works — `/v1/verify` just falls back to
rule-based-only scoring and logs a warning.
