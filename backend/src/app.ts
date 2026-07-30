import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { env, isProd } from './config/env.js'
import { authRouter } from './routes/auth.routes.js'
import { verifyRouter } from './routes/verify.routes.js'
import { historyRouter } from './routes/history.routes.js'
import { errorHandler, notFound } from './middleware/error.middleware.js'

export function createApp() {
  const app = express()

  app.use(helmet())
  app.use(
    cors({
      origin(origin, callback) {
        // No Origin header (e.g. curl, some extension contexts) — allow.
        if (!origin) return callback(null, true)

        const allowed = env.corsOrigins.some((pattern) => {
          if (pattern === '*') return true
          if (pattern === 'chrome-extension://*') return origin.startsWith('chrome-extension://')
          return pattern === origin
        })

        callback(allowed ? null : new Error(`Origin ${origin} not allowed by CORS`), allowed)
      },
      credentials: true,
    }),
  )
  app.use(express.json({ limit: '1mb' }))
  app.use(morgan(isProd ? 'combined' : 'dev'))

  app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }))

  app.use('/v1/auth', authRouter)
  app.use('/v1/verify', verifyRouter)
  app.use('/v1/history', historyRouter)

  app.use(notFound)
  app.use(errorHandler)

  return app
}
