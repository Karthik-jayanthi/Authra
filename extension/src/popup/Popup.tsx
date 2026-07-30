import { AnimatePresence, motion } from 'framer-motion'
import { useVerification } from '../hooks/useVerification'
import { ScoreRing } from '../components/ScoreRing'
import { RiskBadge } from '../components/RiskBadge'
import { FactorRow } from '../components/FactorRow'
import { RecommendationCard } from '../components/RecommendationCard'
import { ProductHeader } from '../components/ProductHeader'
import { formatCurrency } from '../utils/format'
import type { ScrapedProduct, VerificationResult } from '../types'

export function Popup() {
  const { status, product, result, error, retry } = useVerification()

  return (
    <div className="flex w-[420px] flex-col bg-base font-body">
      <Header />

      <div className="flex-1 px-4 pb-4">
        <AnimatePresence mode="wait">
          {(status === 'scraping' || status === 'analyzing') && (
            <LoadingState key="loading" phase={status} />
          )}

          {status === 'error' && <ErrorState key="error" message={error ?? 'Something went wrong.'} onRetry={retry} />}

          {status === 'done' && product && result && (
            <ResultState key="result" product={product} result={result} />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function Header() {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/15">
          <div className="h-2 w-2 rounded-full bg-accent" />
        </div>
        <span className="font-display text-[15px] font-semibold tracking-tight text-ink">Authra</span>
      </div>
      <span className="text-[10px] uppercase tracking-widest text-faint">beta</span>
    </div>
  )
}

function LoadingState({ phase }: { phase: 'scraping' | 'analyzing' }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center gap-4 py-16"
    >
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full border-2 border-border" />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
        />
      </div>
      <p className="text-xs text-muted">
        {phase === 'scraping' ? 'Reading the product page…' : 'Cross-checking signals…'}
      </p>
    </motion.div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface px-5 py-10 text-center"
    >
      <p className="text-sm font-medium text-ink">Couldn&rsquo;t verify this page</p>
      <p className="text-xs text-muted">{message}</p>
      <button
        onClick={onRetry}
        className="mt-1 rounded-lg bg-accent/15 px-3.5 py-1.5 text-xs font-medium text-accent transition hover:bg-accent/25"
      >
        Try again
      </button>
    </motion.div>
  )
}

function ResultState({ product, result }: { product: ScrapedProduct; result: VerificationResult }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex flex-col gap-4 animate-fade-up"
    >
      <ProductHeader product={product} />

      <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface py-5 shadow-card">
        <ScoreRing score={result.score} riskLevel={result.riskLevel} />
        <RiskBadge level={result.riskLevel} />
        <p className="text-[11px] text-faint">
          <span className="font-mono text-muted">{result.confidence}%</span> confidence
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-3.5">
        <p className="mb-1 text-[11px] uppercase tracking-wide text-faint">Price comparison</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <PriceCell label="Listed" value={result.priceComparison.listedPrice} currency={result.priceComparison.currency} highlight />
          <PriceCell label="Market avg." value={result.priceComparison.marketAverage} currency={result.priceComparison.currency} />
          <PriceCell label="Official" value={result.priceComparison.officialPrice} currency={result.priceComparison.currency} />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-3.5">
        <p className="mb-1 text-[11px] uppercase tracking-wide text-faint">Risk factors</p>
        <div className="divide-y divide-border/60">
          {result.factors.map((factor) => (
            <FactorRow key={factor.label} factor={factor} />
          ))}
        </div>
      </div>

      <RecommendationCard
        riskLevel={result.riskLevel}
        recommendation={result.recommendation}
        reasoning={result.reasoning}
      />

      <div className="flex gap-2 pb-1">
        <ActionButton label="Save" />
        <ActionButton label="Export PDF" />
        <ActionButton label="Share" />
      </div>
    </motion.div>
  )
}

function PriceCell({
  label,
  value,
  currency,
  highlight,
}: {
  label: string
  value: number | null
  currency: string
  highlight?: boolean
}) {
  return (
    <div className="rounded-lg bg-surface-raised py-2">
      <p className={`font-mono text-sm ${highlight ? 'text-ink' : 'text-muted'}`}>
        {formatCurrency(value, currency)}
      </p>
      <p className="mt-0.5 text-[10px] text-faint">{label}</p>
    </div>
  )
}

function ActionButton({ label }: { label: string }) {
  return (
    <button className="flex-1 rounded-lg border border-border bg-surface py-2 text-xs font-medium text-muted transition hover:border-accent/40 hover:text-ink">
      {label}
    </button>
  )
}
