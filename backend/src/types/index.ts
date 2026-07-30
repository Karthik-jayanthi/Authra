export interface ScrapedProduct {
  title: string | null
  brand: string | null
  seller: string | null
  price: string | null
  currency: string | null
  url: string
  images: string[]
  description: string | null
  specs: Record<string, string>
  rating: number | null
  reviewCount: number | null
  availability: string | null
  site: string
}

export type RiskLevel = 'safe' | 'caution' | 'danger'

export interface RiskFactor {
  label: string
  status: RiskLevel
  detail: string
}

export interface VerificationResult {
  score: number
  confidence: number
  riskLevel: RiskLevel
  recommendation: string
  reasoning: string
  factors: RiskFactor[]
  priceComparison: {
    marketAverage: number | null
    officialPrice: number | null
    listedPrice: number | null
    currency: string
  }
  reviewAnalysis: {
    authenticScore: number
    flaggedPatterns: string[]
  }
  checkedAt: string
}

export interface AuthTokenPayload {
  sub: string
  email: string
}
