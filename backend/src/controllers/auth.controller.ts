import type { Request, Response } from 'express'
import { z } from 'zod'
import { User, hashPassword, comparePassword } from '../models/User.js'
import { signToken } from '../services/jwt.service.js'
import { ApiError } from '../middleware/error.middleware.js'

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
})

export async function register(req: Request, res: Response) {
  const { email, password } = credentialsSchema.parse(req.body)

  const existing = await User.findOne({ email })
  if (existing) throw new ApiError(409, 'An account with this email already exists.')

  const passwordHash = await hashPassword(password)
  const user = await User.create({ email, passwordHash })

  const token = signToken({ sub: user.id, email: user.email })
  res.status(201).json({ status: 'ok', token, user: { id: user.id, email: user.email } })
}

export async function login(req: Request, res: Response) {
  const { email, password } = credentialsSchema.parse(req.body)

  const user = await User.findOne({ email })
  if (!user) throw new ApiError(401, 'Invalid email or password.')

  const valid = await comparePassword(password, user.passwordHash)
  if (!valid) throw new ApiError(401, 'Invalid email or password.')

  const token = signToken({ sub: user.id, email: user.email })
  res.json({ status: 'ok', token, user: { id: user.id, email: user.email } })
}
