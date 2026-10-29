/**
 * MongoDB connection utility.
 * Reuses the existing connection across hot-reloads in dev mode.
 */
import mongoose from 'mongoose'

declare global {
  // eslint-disable-next-line no-var
  var __mongooseConnection: Promise<typeof mongoose> | undefined
}

export async function connectDB(): Promise<void> {
  if (mongoose.connection.readyState >= 1) return

  const config = useRuntimeConfig()
  const uri = config.mongodbUri

  if (!uri) {
    throw new Error('MONGODB_URI is not configured. See .env.example.')
  }

  if (!global.__mongooseConnection) {
    global.__mongooseConnection = mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    })
  }

  await global.__mongooseConnection
}
