import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { verify } from '../controllers/verify.controller.js'
import { attachUserIfPresent } from '../middleware/auth.middleware.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const verifyRouter = Router()

// Verification is public (no sign-in needed to check a product), but rate
// limited per IP since each call does a bit of DB work on top of the
// eventual AI service call.
const verifyLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
})

verifyRouter.post('/', verifyLimiter, attachUserIfPresent, asyncHandler(verify))
