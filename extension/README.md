# Authra — Browser Extension (Stage 1)

This stage covers the Chrome extension: popup UI, page scraping, and a mock
verification response so the full flow can be tried end to end before the
real backend exists. Stage 2 will add the Express/MongoDB API, and Stage 3
will wire in the AI analysis service — `src/services/api.ts` has a single
`USE_MOCK` flag to flip once that's ready.

## Setup

```bash
cd extension
npm install
npm run dev
```

`npm run dev` builds the extension into `dist/` in watch mode (via
`@crxjs/vite-plugin`), which handles the MV3-specific bundling that a plain
Vite build can't (manifest processing, service worker HMR, etc).

## Load it in Chrome

1. Run `npm run dev` (or `npm run build` for a production bundle).
2. Open `chrome://extensions`.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select the `extension/dist` folder.
5. Open any product page (Amazon, Flipkart, Myntra, Ajio, Nykaa, Meesho,
   eBay, or any standard listing page) and click the Authra icon.

## How scraping works

There's no persistent content script running on every page. Instead, the
background service worker injects `scrapeProductPage` (from
`src/content/scraper.ts`) into the active tab only when you open the popup,
using `chrome.scripting.executeScript`. This keeps the extension idle until
you actually ask it to check something.

The scraper has selector maps for Amazon and Flipkart today, with a generic
fallback that reads OpenGraph and schema.org product markup — that fallback
is what makes "any standard e-commerce website" work without a bespoke
selector set for every storefront. Myntra/Ajio/Nykaa/Meesho/eBay selector
maps are the natural next addition once we're testing against live pages.

## What's mocked right now

`verifyProduct()` in `src/services/api.ts` returns a deterministic mock
result (same product → same score) so the UI, animations, and states are
real even though nothing is hitting a server yet. Nothing about the popup
needs to change when the real API is connected — the response shape is the
same `VerificationResult` type either way.

## Structure

```
src/
  popup/        popup UI shell + entry point
  content/      the page-scraping function (injected on demand)
  background/   service worker: injects scraper, relays messages, saves history
  components/   ScoreRing, RiskBadge, FactorRow, RecommendationCard, ProductHeader
  hooks/        useVerification — scrape → verify orchestration + state
  services/     api.ts — backend calls (mocked for now)
  types/        shared ScrapedProduct / VerificationResult types
  utils/        formatting helpers
```

## Design notes

Dark theme, near-black base (`#0B0E11`) with a mint-teal accent
(`#4DE8C9`) rather than the more common near-black/acid-green combo — the
color and the ring's scan-sweep animation are meant to read as "scanning
for authenticity" rather than a generic brand accent. Score and price
figures use IBM Plex Mono to feel like a readout rather than body copy;
everything else is Inter, with Space Grotesk reserved for the wordmark.
