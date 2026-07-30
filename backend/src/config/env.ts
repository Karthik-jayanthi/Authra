import 'dotenv/config'

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

export const env = {
  port: parseInt(process.env.PORT ?? '4000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  mongoUri: required('MONGO_URI', 'mongodb://localhost:27017/authra'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  aiServiceUrl: process.env.AI_SERVICE_URL ?? 'http://localhost:8000',
  aiServiceTimeoutMs: parseInt(process.env.AI_SERVICE_TIMEOUT_MS ?? '8000', 10),
  corsOrigins: (process.env.CORS_ORIGINS ?? 'chrome-extension://*').split(',').map((s) => s.trim()),
}

export const isProd = env.nodeEnv === 'production'
