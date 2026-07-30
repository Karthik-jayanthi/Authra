import type { RiskFactor } from '../types'

const ICON: Record<RiskFactor['status'], string> = {
  safe: '✓',
  caution: '!',
  danger: '✕',
}

const ICON_COLOR: Record<RiskFactor['status'], string> = {
  safe: 'text-risk-safe bg-risk-safe/10',
  caution: 'text-risk-caution bg-risk-caution/10',
  danger: 'text-risk-danger bg-risk-danger/10',
}

export function FactorRow({ factor }: { factor: RiskFactor }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${ICON_COLOR[factor.status]}`}
      >
        {ICON[factor.status]}
      </span>
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-ink">{factor.label}</p>
        <p className="mt-0.5 text-xs leading-snug text-muted">{factor.detail}</p>
      </div>
    </div>
  )
}
