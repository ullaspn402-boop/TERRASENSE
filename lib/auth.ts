import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'

const isProduction = process.env.NODE_ENV === 'production'
const defaultBaseUrl = process.env.BETTER_AUTH_URL || (isProduction ? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) : 'http://localhost:3000')

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  secret: process.env.BETTER_AUTH_SECRET || '9a4f20e8b1d34c7a6e5b8d2f10c9e7a4b8d6f3e2a1c0d5e8f7a9b2c4e6f8a0b2',
  baseURL: defaultBaseUrl,
  emailAndPassword: { enabled: true, autoSignIn: true },
  trustedOrigins: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
    ...(isProduction ? [
      ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
      ...(process.env.VERCEL_PROJECT_PRODUCTION_URL ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`] : [])
    ] : []),
  ],
  session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
  advanced: {
    defaultCookieAttributes: {
      sameSite: 'lax',
      secure: isProduction,
      httpOnly: true,
    },
  },
})
