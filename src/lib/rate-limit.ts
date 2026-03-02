import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

/**
 * Rate limiter for Next.js API routes and Server Actions using Upstash Redis
 */

// Initialize Redis client using environment variables
// Note: If UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN are missing,
// the client will throw or fail silently depending on configuration.
// We handle this gracefully in the checkRateLimit function via fail-open strategy.
const redisUrl = process.env.UPSTASH_REDIS_REST_URL || ''
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || ''

// We only initialize the real Redis client if variables are present,
// otherwise we use a dummy fallback so the app still runs locally without `.env`.
const redisClient = redisUrl && redisToken 
  ? new Redis({ url: redisUrl, token: redisToken })
  : null

/**
 * Rate limiter configuration for different endpoints
 */
export const rateLimiters = {
  // Strict limit for authentication endpoints (5 attempts per 15 mins)
  auth: redisClient ? new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    analytics: true,
  }) : null,
  
  // Moderate limit for data mutations (30 requests per 1 min)
  mutation: redisClient ? new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(30, '1 m'),
  }) : null,
  
  // Higher limit for read operations (100 requests per 1 min)
  read: redisClient ? new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
  }) : null,
  
  // Export operations - expensive, so stricter limits (5 exports per 1 min)
  export: redisClient ? new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
  }) : null,
} as const

type RateLimitKey = keyof typeof rateLimiters

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param configName - Name of the rate limit config to use
 * @returns { allowed: boolean, remaining: number, resetTime: number }
 */
export async function checkRateLimit(
  identifier: string,
  configName: RateLimitKey = 'read'
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const limiter = rateLimiters[configName]
  
  // Fail-Open strategy: If Redis isn't configured, allow the request to pass.
  // This is crucial for local dev testing without Upstash keys.
  if (!limiter) {
    return {
      allowed: true,
      remaining: 999,
      resetTime: Date.now() + 60000,
    }
  }

  try {
    const { success, remaining, reset } = await limiter.limit(identifier)
    return {
      allowed: success,
      remaining,
      resetTime: reset,
    }
  } catch (error) {
    console.error(`[Rate Limit] Redis Error for ${configName} - ${identifier}:`, error)
    // Fail-open Strategy: if Redis goes down, we shouldn't block all users
    return {
      allowed: true,
      remaining: 1,
      resetTime: Date.now() + 60000,
    }
  }
}

// Server Action wrapper with rate limiting
import { headers } from 'next/headers'

/**
 * Rate limiter for Server Actions
 * @param actionName - Name of the action for logging
 * @param configName - Rate limit config to use
 */
export async function withRateLimit<T>(
  actionName: string,
  configName: RateLimitKey = 'mutation',
  callback: () => Promise<T>
): Promise<T> {
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0] || 
             headersList.get('x-real-ip') || 
             'unknown'
  
  // Await the new async checkRateLimit function
  const result = await checkRateLimit(ip, configName)
  
  if (!result.allowed) {
    const waitTime = Math.ceil((result.resetTime - Date.now()) / 1000)
    throw new Error(`Too many requests. Please try again in ${waitTime} seconds.`)
  }
  
  return callback()
}

/**
 * Rate limiter specifically for authentication actions
 */
export async function withAuthRateLimit<T>(
  callback: () => Promise<T>
): Promise<T> {
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0] || 
             headersList.get('x-real-ip') || 
             'unknown'
  
  // Await the new async checkRateLimit function
  const result = await checkRateLimit(ip, 'auth')
  
  if (!result.allowed) {
    const waitTime = Math.ceil((result.resetTime - Date.now()) / 1000)
    throw new Error(`Too many login attempts. Please try again in ${waitTime} seconds.`)
  }
  
  return callback()
}
