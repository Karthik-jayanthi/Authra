import type { Request, Response } from 'express'
import { z } from 'zod'
import { verifyProduct } from '../services/verification.service.js'
import { Verification } from '../models/Verification.js'

const productSchema = z.object({
  title: z.string().nullable(),
  brand: z.string().nullable(),
  seller: z.string().nullable(),
  price: z.string().nullable(),
  currency: z.string().nullable(),
  url: z.string().url(),
  images: z.array(z.string()),
  description: z.string().nullable(),
  specs: z.record(z.string()),
  rating: z.number().nullable(),
  reviewCount: z.number().nullable(),
  availability: z.string().nullable(),
  site: z.string(),
})

const verifyRequestSchema = z.object({ product: productSchema })

export async function verify(req: Request, res: Response) {
  const { product } = verifyRequestSchema.parse(req.body)

  const result = await verifyProduct(product)

  await Verification.create({
    user: req.user?.sub ?? null,
    product: {
      title: product.title,
      brand: product.brand,
      seller: product.seller,
      price: product.price,
      currency: product.currency,
      url: product.url,
      images: product.images,
      site: product.site,
    },
    score: result.score,
    confidence: result.confidence,
    riskLevel: result.riskLevel,
    recommendation: result.recommendation,
    reasoning: result.reasoning,
    factors: result.factors,
  })

  res.json({ status: 'ok', result })
}
