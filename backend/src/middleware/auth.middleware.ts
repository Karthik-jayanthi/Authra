import type { NextFunction, Request, Response } from 'express'
import { verifyToken } from '../services/jwt.service.js'
import type { AuthTokenPayload } from '../types/index.js'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthTokenPayload
    }
  }
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return null
  return header.slice('Bearer '.length).trim()
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req)
  if (!token) {
    res.status(401).json({ status: 'error', message: 'Sign in required.' })
    return
  }

  try {
    req.user = verifyToken(token)
    next()
  } catch {
    res.status(401).json({ status: 'error', message: 'Session expired, sign in again.' })
  }
}

export function attachUserIfPresent(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req)
  if (token) {
    try {
      req.user = verifyToken(token)
    } catch {
      // an invalid/expired token on an optional route just means "anonymous"
    }
  }
  next()
}
