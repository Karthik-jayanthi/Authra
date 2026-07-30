import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import type { AuthTokenPayload } from '../types/index.js'

export function signToken(payload: AuthTokenPayload): string {
  const options: jwt.SignOptions = { expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'] }
  return jwt.sign(payload, env.jwtSecret, options)
}

export function verifyToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.jwtSecret) as AuthTokenPayload
}
