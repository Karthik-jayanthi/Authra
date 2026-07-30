import { Schema, model, Types } from 'mongoose'
import type { RiskFactor, RiskLevel } from '../types/index.js'

interface ProductSnapshot {
  title: string | null
  brand: string | null
  seller: string | null
  price: string | null
  currency: string | null
  url: string
  images: string[]
  site: string
}

export interface VerificationDoc {
  user: Types.ObjectId | null
  product: ProductSnapshot
  score: number
  confidence: number
  riskLevel: RiskLevel
  recommendation: string
  reasoning: string
  factors: RiskFactor[]
  createdAt: Date
}

const factorSchema = new Schema<RiskFactor>(
  {
    label: { type: String, required: true },
    status: { type: String, enum: ['safe', 'caution', 'danger'], required: true },
    detail: { type: String, required: true },
  },
  { _id: false },
)

const verificationSchema = new Schema<VerificationDoc>({
  user: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  product: {
    title: String,
    brand: String,
    seller: String,
    price: String,
    currency: String,
    url: { type: String, required: true },
    images: [String],
    site: String,
  },
  score: { type: Number, required: true },
  confidence: { type: Number, required: true },
  riskLevel: { type: String, enum: ['safe', 'caution', 'danger'], required: true },
  recommendation: { type: String, required: true },
  reasoning: { type: String, required: true },
  factors: [factorSchema],
  createdAt: { type: Date, default: () => new Date(), index: true },
})

verificationSchema.index({ 'product.url': 1, createdAt: -1 })

export const Verification = model<VerificationDoc>('Verification', verificationSchema)
