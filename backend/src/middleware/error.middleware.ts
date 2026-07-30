import type { NextFunction, Request, Response } from 'express'
import { isProd } from '../config/env.js'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    res.status(err.status).json({ status: 'error', message: err.message })
    return
  }

  console.error(err)
  res.status(500).json({
    status: 'error',
    message: isProd ? 'Something went wrong.' : (err as Error)?.message ?? 'Unknown error',
  })
}

export function notFound(req: Request, res: Response) {
  res.status(404).json({ status: 'error', message: `No route for ${req.method} ${req.path}` })
}
