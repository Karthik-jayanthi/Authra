import { createApp } from './app.js'
import { connectDb } from './db/connection.js'
import { env } from './config/env.js'

async function main() {
  await connectDb()

  const app = createApp()
  app.listen(env.port, () => {
    console.log(`Authra API listening on :${env.port}`)
  })
}

main().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
