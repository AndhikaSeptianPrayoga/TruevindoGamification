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
    globalThis.__truevindoPrisma__ = null
    return null
  }

  try {
    const prisma = new PrismaClient()

    if (process.env.NODE_ENV !== 'production') {
      globalThis.__truevindoPrisma__ = prisma
    }

    return prisma
  } catch {
    globalThis.__truevindoPrisma__ = null
    return null
  }
}
