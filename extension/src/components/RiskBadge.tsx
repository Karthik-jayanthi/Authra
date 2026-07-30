import type { RiskLevel } from '../types'
import { riskLabel } from '../utils/format'

const DOT_COLOR: Record<RiskLevel, string> = {
  safe: 'bg-risk-safe',
  caution: 'bg-risk-caution',
  danger: 'bg-risk-danger',
}

const TEXT_COLOR: Record<RiskLevel, string> = {
  safe: 'text-risk-safe',
  caution: 'text-risk-caution',
  danger: 'text-risk-danger',
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs font-medium ${TEXT_COLOR[level]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${DOT_COLOR[level]}`} />
      {riskLabel(level)}
    </div>
  )
}
