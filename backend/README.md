# Authra — Backend (Stage 2)

Express + MongoDB API backing the extension. This stage replaces the
extension's mock verifier with a real endpoint, plus JWT auth and saved
history — the AI reasoning itself (Stage 3) will slot into
`src/services/verification.service.ts` without touching anything else.

## Setup

```bash
cd backend
npm install
cp .env.example .env   # then fill in MONGO_URI and a real JWT_SECRET
npm run dev
```

Needs a MongoDB instance — either `mongod` running locally
(`mongodb://localhost:27017/authra`) or a free Atlas cluster; either way,
put the connection string in `MONGO_URI`.

Once it's running: `GET http://localhost:4000/health` should return
`{ "status": "ok" }`.

The extension's `src/services/api.ts` now points at
`http://localhost:4000` with `USE_MOCK = false` — swap `API_BASE` for
wherever you deploy this, and flip `USE_MOCK` back to `true` if you want to
work on the UI without the server running.

## Endpoints

| Method | Path            | Auth      | Purpose                                  |
|--------|-----------------|-----------|-------------------------------------------|
| POST   | `/v1/auth/register` | —     | Create an account, returns a JWT          |
| POST   | `/v1/auth/login`    | —     | Returns a JWT                             |
| POST   | `/v1/verify`         | optional | Score a scraped product                   |
| GET    | `/v1/history`        | required | List the signed-in user's past checks     |
| DELETE | `/v1/history/:id`    | required | Delete one saved verification             |

`/v1/verify` doesn't require sign-in — you shouldn't need an account just to
check a product — but it's rate-limited (20/min per IP) and, when a JWT
*is* sent, the check gets attached to that user's history automatically.

Auth is `Authorization: Bearer <token>`.

## How scoring works right now

`verification.service.ts` is rule-based, not AI, on purpose — that's
Stage 3. What it does do that the Stage 1 mock didn't:

- **Seller credibility** looks at past `Verification` documents for that
  seller + site and factors in how those scored, not just a random guess.
- **Price comparison** pulls other stored listings with a similar title on
  the same site to build a real market-average, instead of faking one.
- Everything else (review authenticity, image presence, spec completeness)
  is still a straightforward rule per signal — this is exactly what Stage 3
  will upgrade to real language/image analysis, without changing the
  `ScrapedProduct → VerificationResult` shape the extension already expects.

## Structure

```
src/
  config/env.ts        env var loading + validation
  db/connection.ts      mongoose connection
  models/                User, Verification (Mongoose schemas)
  middleware/            requireAuth / attachUserIfPresent, error handler
  controllers/            auth, verify, history route handlers
  routes/                 route wiring + rate limiting
  services/
    jwt.service.ts         sign/verify tokens
    verification.service.ts   the scoring logic (Stage 3's seam)
  utils/asyncHandler.ts   wraps controllers so thrown errors reach errorHandler
  types/                  shared request/response types (mirrors the extension's)
```

## Notes

- Passwords are hashed with bcrypt (10 rounds) — never stored in plain text.
- `helmet` + a same-origin-aware CORS check (allows any `chrome-extension://`
  origin, since each unpacked/installed extension gets a different ID) are
  on by default.
- `NODE_ENV=production` hides internal error messages from API responses.
