import type { RiskLevel } from '../types'

const BORDER: Record<RiskLevel, string> = {
  safe: 'border-risk-safe/25',
  caution: 'border-risk-caution/25',
  danger: 'border-risk-danger/25',
}

interface RecommendationCardProps {
  riskLevel: RiskLevel
  recommendation: string
  reasoning: string
}

export function RecommendationCard({ riskLevel, recommendation, reasoning }: RecommendationCardProps) {
  return (
    <div className={`rounded-xl border ${BORDER[riskLevel]} bg-surface-raised p-3.5`}>
      <p className="text-[13px] font-medium text-ink">{recommendation}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-muted">{reasoning}</p>
    </div>
  )
}
