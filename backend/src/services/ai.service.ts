import { env } from '../config/env.js'
import type { RiskFactor, ScrapedProduct } from '../types/index.js'

export interface AiAnalysis {
  aiFactors: RiskFactor[]
  reasoning: string
  recommendation: string
  scoreAdjustment: number
  confidence: number
}

interface AnalyzeApiResponse {
  status: 'ok'
  result: {
    ai_factors: RiskFactor[]
    reasoning: string
    recommendation: string
    score_adjustment: number
    confidence: number
  }
}

export async function requestAiAnalysis(
  product: ScrapedProduct,
  ruleFactors: RiskFactor[],
  priceContext: { listedPrice: number | null; marketAverage: number | null; currency: string },
): Promise<AiAnalysis | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), env.aiServiceTimeoutMs)

  try {
    const res = await fetch(`${env.aiServiceUrl}/v1/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        product,
        ruleFactors,
        priceContext,
      }),
    })

    if (!res.ok) {
      console.warn(`AI service returned ${res.status}, falling back to rule-based result.`)
      return null
    }

    const body = (await res.json()) as AnalyzeApiResponse
    return {
      aiFactors: body.result.ai_factors,
      reasoning: body.result.reasoning,
      recommendation: body.result.recommendation,
      scoreAdjustment: body.result.score_adjustment,
      confidence: body.result.confidence,
    }
  } catch (err) {
    console.warn('AI service unreachable, falling back to rule-based result.', (err as Error).message)
    return null
  } finally {
    clearTimeout(timeout)
  }
}
