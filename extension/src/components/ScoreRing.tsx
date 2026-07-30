import { motion } from 'framer-motion'
import type { RiskLevel } from '../types'

const RING_COLORS: Record<RiskLevel, string> = {
  safe: '#34D399',
  caution: '#F5B942',
  danger: '#F0546B',
}

interface ScoreRingProps {
  score: number
  riskLevel: RiskLevel
  size?: number
}

export function ScoreRing({ score, riskLevel, size = 132 }: ScoreRingProps) {
  const stroke = 7
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const color = RING_COLORS[riskLevel]

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* faint scanning sweep behind the ring, only while settling in */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(from 0deg, transparent 0%, ${color}33 12%, transparent 24%)`,
        }}
        initial={{ opacity: 0.9, rotate: 0 }}
        animate={{ opacity: 0, rotate: 300 }}
        transition={{ duration: 1.1, ease: 'easeOut' }}
      />

      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#232830"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - score / 100) }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        />
      </svg>

      <div className="absolute flex flex-col items-center">
        <motion.span
          className="font-mono text-3xl font-medium text-ink tabular-nums"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {score}
        </motion.span>
        <span className="text-[10px] uppercase tracking-widest text-faint">score</span>
      </div>
    </div>
  )
}
