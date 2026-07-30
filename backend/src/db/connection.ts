import mongoose from 'mongoose'
import { env } from '../config/env.js'

let connecting: Promise<typeof mongoose> | null = null

export function connectDb() {
  if (connecting) return connecting

  mongoose.set('strictQuery', true)

  connecting = mongoose.connect(env.mongoUri).then((conn) => {
    console.log(`Mongo connected → ${conn.connection.host}/${conn.connection.name}`)
    return conn
  })

  connecting.catch((err) => {
    console.error('Mongo connection failed:', err.message)
    process.exit(1)
  })

  return connecting
}
