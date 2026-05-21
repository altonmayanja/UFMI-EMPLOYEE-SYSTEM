import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL!

  // In production (Vercel), use the pg adapter for serverless compatibility
  // This prevents connection exhaustion in serverless environments
  if (process.env.NODE_ENV === 'production') {
    const adapter = new PrismaPg(connectionString)
    return new PrismaClient({ adapter })
  }

  // In development, use the standard Prisma client
  return new PrismaClient({
    log: ['query'],
  })
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
