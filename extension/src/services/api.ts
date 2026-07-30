import type { ScrapedProduct, VerificationResult, VerifyResponse } from '../types'

const API_BASE = 'https://authra-7ca9.onrender.com' // swap for your deployed API URL
const USE_MOCK = false // flip to true for offline UI work without the backend running

export async function verifyProduct(product: ScrapedProduct): Promise<VerifyResponse> {
  if (USE_MOCK) return mockVerify(product)

  try {
    const res = await fetch(`${API_BASE}/v1/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product }),
    })

    if (!res.ok) {
      return { status: 'error', message: `Verification failed (${res.status}).` }
    }

    const body = (await res.json()) as { status: 'ok'; result: VerificationResult } | { status: 'error'; message: string }
    if (body.status === 'error') {
      return { status: 'error', message: body.message }
    }
    return { status: 'ok', result: body.result }
  } catch {
    return { status: 'error', message: 'Could not reach the Authra server.' }
  }
}

// --- Mock analyzer -----------------------------------------------------
// Produces a plausible, stable-per-product result so the UI can be built
// and demoed before the real backend + AI service exist. Swapped out in
// the backend stage.

function seedFromString(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function mockVerify(product: ScrapedProduct): VerifyResponse {
  const seed = seedFromString(product.title ?? product.url)
  const score = 45 + (seed % 50) // 45–94
  const confidence = 70 + (seed % 25)

  const riskLevel = score >= 75 ? 'safe' : score >= 55 ? 'caution' : 'danger'

  const listedPrice = product.price ? parseFloat(product.price.replace(/,/g, '')) : null
  const marketAverage = listedPrice ? Math.round(listedPrice * (1 + ((seed % 20) - 10) / 100)) : null
  const officialPrice = listedPrice ? Math.round(listedPrice * (1 + ((seed % 14) - 4) / 100)) : null

  const factors: VerificationResult['factors'] = [
    {
      label: 'Seller credibility',
      status: seed % 3 === 0 ? 'caution' : 'safe',
      detail: product.seller
        ? `${product.seller} has a consistent order history on this marketplace.`
        : 'No seller name was found on this listing.',
    },
    {
      label: 'Price comparison',
      status: listedPrice && marketAverage && listedPrice < marketAverage * 0.6 ? 'danger' : 'safe',
      detail:
        listedPrice && marketAverage
          ? `Listed price sits within the expected range of similar listings.`
          : 'Not enough pricing data to compare against the market.',
    },
    {
      label: 'Review authenticity',
      status: score < 60 ? 'caution' : 'safe',
      detail:
        product.reviewCount && product.reviewCount > 0
          ? 'Review language and timing patterns look organic.'
          : 'This listing has very few reviews to analyze.',
    },
    {
      label: 'Image match',
      status: 'safe',
      detail: product.images.length
        ? 'Product photos match the style and quality of official listings.'
        : 'No product images were available to check.',
    },
    {
      label: 'Specification completeness',
      status: Object.keys(product.specs).length < 2 ? 'caution' : 'safe',
      detail:
        Object.keys(product.specs).length < 2
          ? 'This listing is missing several specifications shoppers usually see.'
          : 'Specifications are detailed and consistent with the brand.',
    },
  ]

  const recommendation =
    riskLevel === 'safe'
      ? 'Safe to buy — this listing checks out across every signal we analyzed.'
      : riskLevel === 'caution'
        ? 'Buy carefully — a few signals are inconclusive, so double-check the seller before ordering.'
        : 'We recommend avoiding this listing until the seller and pricing can be verified.'

  const reasoning =
    riskLevel === 'safe'
      ? `This product appears to be genuine. ${product.seller ?? 'The seller'} has a strong history, pricing is within the expected range, and reviews show low signs of manipulation.`
      : riskLevel === 'caution'
        ? `This listing is mostly consistent, but ${factors.find((f) => f.status !== 'safe')?.label.toLowerCase() ?? 'one signal'} couldn't be fully confirmed. Proceed with a closer look at the seller profile before buying.`
        : `Multiple signals on this listing are inconsistent with a genuine product, including pricing and seller history. We'd hold off on this purchase.`

  return {
    status: 'ok',
    result: {
      score,
      confidence,
      riskLevel,
      recommendation,
      reasoning,
      factors,
      priceComparison: {
        marketAverage,
        officialPrice,
        listedPrice,
        currency: product.currency ?? 'INR',
      },
      reviewAnalysis: {
        authenticScore: Math.min(99, score + 5),
        flaggedPatterns: riskLevel === 'danger' ? ['Repeated review phrasing', 'Burst of 5-star reviews in a single week'] : [],
      },
      checkedAt: new Date().toISOString(),
    },
  }
}
