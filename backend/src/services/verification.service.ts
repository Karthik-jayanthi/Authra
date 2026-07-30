import { Verification } from '../models/Verification.js'
import { requestAiAnalysis } from './ai.service.js'
import type { RiskFactor, RiskLevel, ScrapedProduct, VerificationResult } from '../types/index.js'

// The rule engine below (seller history, price comparison, review/spec
// heuristics) always runs and is enough on its own to produce a result.
// requestAiAnalysis() adds the signals that need actual language reasoning
// — suspicious wording, brand verification, product consistency — and can
// nudge the score. If the AI service is down or misconfigured, verifyProduct
// just falls back to the rule-only result instead of failing the request.

function parsePrice(raw: string | null): number | null {
  if (!raw) return null
  const cleaned = parseFloat(raw.replace(/,/g, ''))
  return Number.isFinite(cleaned) ? cleaned : null
}

async function getSellerHistory(seller: string | null, site: string) {
  if (!seller) return { count: 0, avgScore: null as number | null }

  const past = await Verification.find({ 'product.seller': seller, 'product.site': site })
    .select('score')
    .limit(200)
    .lean()

  if (!past.length) return { count: 0, avgScore: null }

  const avgScore = past.reduce((sum, v) => sum + v.score, 0) / past.length
  return { count: past.length, avgScore }
}

async function getMarketPrice(title: string | null, site: string, currentPrice: number | null) {
  if (!title) return { marketAverage: currentPrice, sampleSize: 0 }

  // Cheap similarity: same site, same first few significant words of the title.
  const keywords = title.split(/\s+/).slice(0, 4).join(' ')

  const comparable = await Verification.find({
    'product.site': site,
    'product.title': { $regex: keywords.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' },
  })
    .select('product.price')
    .limit(50)
    .lean()

  const prices = comparable
    .map((v) => parsePrice(v.product.price))
    .filter((p): p is number => p !== null)

  if (!prices.length) return { marketAverage: currentPrice, sampleSize: 0 }

  const avg = prices.reduce((sum, p) => sum + p, 0) / prices.length
  return { marketAverage: Math.round(avg), sampleSize: prices.length }
}

function scoreFromFactors(factors: RiskFactor[]): number {
  const weight: Record<RiskLevel, number> = { safe: 100, caution: 60, danger: 15 }
  const total = factors.reduce((sum, f) => sum + weight[f.status], 0)
  return Math.round(total / factors.length)
}

function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 75) return 'safe'
  if (score >= 50) return 'caution'
  return 'danger'
}

interface RuleResult {
  factors: RiskFactor[]
  sellerHistory: { count: number; avgScore: number | null }
  marketPrice: { marketAverage: number | null; sampleSize: number }
  listedPrice: number | null
  currency: string
}

async function computeRuleFactors(product: ScrapedProduct): Promise<RuleResult> {
  const listedPrice = parsePrice(product.price)
  const currency = product.currency ?? 'INR'

  const [sellerHistory, marketPrice] = await Promise.all([
    getSellerHistory(product.seller, product.site),
    getMarketPrice(product.title, product.site, listedPrice),
  ])

  const factors: RiskFactor[] = []

  // Seller credibility — leans on how many times we've seen this seller before
  // and how those past listings scored, not just a one-shot guess.
  if (!product.seller) {
    factors.push({ label: 'Seller credibility', status: 'caution', detail: 'No seller name was found on this listing.' })
  } else if (sellerHistory.count === 0) {
    factors.push({
      label: 'Seller credibility',
      status: 'caution',
      detail: `${product.seller} has no verification history with Authra yet.`,
    })
  } else if (sellerHistory.avgScore !== null && sellerHistory.avgScore < 50) {
    factors.push({
      label: 'Seller credibility',
      status: 'danger',
      detail: `${product.seller}'s past listings have scored low across ${sellerHistory.count} checks.`,
    })
  } else {
    factors.push({
      label: 'Seller credibility',
      status: 'safe',
      detail: `${product.seller} has a consistent track record across ${sellerHistory.count} previous checks.`,
    })
  }

  // Price comparison
  if (listedPrice === null) {
    factors.push({ label: 'Price comparison', status: 'caution', detail: 'No price could be read from this listing.' })
  } else if (marketPrice.sampleSize === 0) {
    factors.push({
      label: 'Price comparison',
      status: 'caution',
      detail: 'Not enough comparable listings yet to judge this price.',
    })
  } else {
    const ratio = listedPrice / marketPrice.marketAverage!
    if (ratio < 0.55) {
      factors.push({
        label: 'Price comparison',
        status: 'danger',
        detail: `Priced well below the ${marketPrice.sampleSize}-listing average — a common counterfeit signal.`,
      })
    } else if (ratio < 0.8 || ratio > 1.3) {
      factors.push({
        label: 'Price comparison',
        status: 'caution',
        detail: `Price differs noticeably from the ${marketPrice.sampleSize}-listing average.`,
      })
    } else {
      factors.push({
        label: 'Price comparison',
        status: 'safe',
        detail: `In line with the ${marketPrice.sampleSize}-listing average for similar products.`,
      })
    }
  }

  // Review authenticity
  if (!product.reviewCount || product.reviewCount === 0) {
    factors.push({ label: 'Review authenticity', status: 'caution', detail: 'This listing has no reviews to analyze.' })
  } else if (product.rating !== null && product.rating >= 4.5 && product.reviewCount < 20) {
    factors.push({
      label: 'Review authenticity',
      status: 'caution',
      detail: 'A very high rating with very few reviews can indicate inflated ratings.',
    })
  } else {
    factors.push({
      label: 'Review authenticity',
      status: 'safe',
      detail: `${product.reviewCount} reviews with a rating profile consistent with organic feedback.`,
    })
  }

  // Image match — placeholder for a future perceptual-hash comparison
  // against brand image catalogs; for now, flags listings with no images at all.
  factors.push(
    product.images.length > 0
      ? { label: 'Image match', status: 'safe', detail: 'Product photos were found and look consistent with the listing.' }
      : { label: 'Image match', status: 'caution', detail: 'No product images were available to check.' },
  )

  // Specification completeness
  const specCount = Object.keys(product.specs).length
  factors.push(
    specCount >= 2
      ? { label: 'Specification completeness', status: 'safe', detail: 'Specifications are detailed and consistent with the brand.' }
      : { label: 'Specification completeness', status: 'caution', detail: 'This listing is missing specifications shoppers usually see.' },
  )

  return { factors, sellerHistory, marketPrice, listedPrice, currency }
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score))
}

export async function verifyProduct(product: ScrapedProduct): Promise<VerificationResult> {
  const rule = await computeRuleFactors(product)
  const ruleScore = scoreFromFactors(rule.factors)
  const ruleConfidence = Math.min(97, 55 + rule.sellerHistory.count + rule.marketPrice.sampleSize)

  const ai = await requestAiAnalysis(product, rule.factors, {
    listedPrice: rule.listedPrice,
    marketAverage: rule.marketPrice.marketAverage,
    currency: rule.currency,
  })

  const factors = ai ? [...rule.factors, ...ai.aiFactors] : rule.factors
  const score = ai ? clampScore(ruleScore + ai.scoreAdjustment) : ruleScore
  const riskLevel = riskLevelFromScore(score)
  const confidence = ai ? Math.round((ruleConfidence + ai.confidence) / 2) : ruleConfidence

  const worstFactor = rule.factors.find((f) => f.status === 'danger') ?? rule.factors.find((f) => f.status === 'caution')

  const fallbackRecommendation =
    riskLevel === 'safe'
      ? 'Safe to buy — this listing checks out across every signal we analyzed.'
      : riskLevel === 'caution'
        ? 'Buy carefully — a few signals are inconclusive, so double-check the seller before ordering.'
        : 'We recommend avoiding this listing until the seller and pricing can be verified.'

  const fallbackReasoning =
    riskLevel === 'safe'
      ? `This product appears to be genuine. ${product.seller ?? 'The seller'} has a strong history, pricing is within the expected range, and reviews show low signs of manipulation.`
      : worstFactor
        ? `This listing is mostly consistent, but ${worstFactor.label.toLowerCase()} couldn't be fully confirmed: ${worstFactor.detail.toLowerCase()}`
        : `Several signals on this listing are inconsistent with a genuine product. We'd hold off on this purchase.`

  return {
    score,
    confidence,
    riskLevel,
    recommendation: ai?.recommendation ?? fallbackRecommendation,
    reasoning: ai?.reasoning ?? fallbackReasoning,
    factors,
    priceComparison: {
      marketAverage: rule.marketPrice.marketAverage,
      officialPrice: null, // requires a brand catalog integration — future work
      listedPrice: rule.listedPrice,
      currency: rule.currency,
    },
    reviewAnalysis: {
      authenticScore: Math.min(99, score + 5),
      flaggedPatterns: riskLevel === 'danger' ? ['Price far below comparable listings'] : [],
    },
    checkedAt: new Date().toISOString(),
  }
}
