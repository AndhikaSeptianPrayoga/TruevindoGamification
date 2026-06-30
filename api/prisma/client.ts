import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var __truevindoPrisma__: PrismaClient | null | undefined
}

export function getPrismaClient() {
  if (globalThis.__truevindoPrisma__ !== undefined) {
    return globalThis.__truevindoPrisma__
  }

  if (!process.env.DATABASE_URL) {
    console.error('[prisma] DATABASE_URL is not set in the environment — cannot initialize Prisma Client.')
    globalThis.__truevindoPrisma__ = null
    return null
  }

  try {
    const prisma = new PrismaClient()
    // Cache the client in every environment so a single instance is reused.
    globalThis.__truevindoPrisma__ = prisma
    return prisma
  } catch (error) {
    console.error('[prisma] Failed to initialize Prisma Client:', error)
    globalThis.__truevindoPrisma__ = null
    return null
  }
}
