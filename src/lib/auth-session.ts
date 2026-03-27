export function calculateExpiresAt(expiresInSeconds: number, now = Date.now()): number {
  return now + expiresInSeconds * 1000
}

export function isSessionExpired(expiresAt?: number | null, now = Date.now()): boolean {
  if (!expiresAt) {
    return true
  }

  return expiresAt <= now
}

function normalizeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const paddingLength = (4 - (normalized.length % 4)) % 4
  return normalized.padEnd(normalized.length + paddingLength, '=')
}

function decodeBase64Url(value: string): string | null {
  const normalized = normalizeBase64Url(value)

  try {
    if (typeof atob === 'function') {
      return atob(normalized)
    }
  } catch {
    return null
  }

  try {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(value, 'base64url').toString('utf8')
    }
  } catch {
    return null
  }

  return null
}

export function getJwtExp(accessToken?: string): number | null {
  if (!accessToken) {
    return null
  }

  const [, payload] = accessToken.split('.')
  if (!payload) {
    return null
  }

  const decoded = decodeBase64Url(payload)
  if (!decoded) {
    return null
  }

  try {
    const parsed = JSON.parse(decoded) as { exp?: number }
    return typeof parsed.exp === 'number' ? parsed.exp : null
  } catch {
    return null
  }
}

export function getRemainingTokenLifetime(accessToken?: string, now = Date.now()): number | null {
  const exp = getJwtExp(accessToken)
  if (!exp) {
    return null
  }

  const remainingSeconds = Math.floor(exp - now / 1000)
  return remainingSeconds > 0 ? remainingSeconds : null
}

export interface SessionTiming {
  expiresAt: number
  maxAge: number
}

export function getSessionTiming(
  accessToken?: string,
  fallbackExpiresInSeconds?: number,
  now = Date.now()
): SessionTiming | null {
  const exp = getJwtExp(accessToken)
  if (exp) {
    const maxAge = Math.floor(exp - now / 1000)

    if (maxAge <= 0) {
      return null
    }

    return {
      expiresAt: exp * 1000,
      maxAge,
    }
  }

  if (
    typeof fallbackExpiresInSeconds === 'number' &&
    Number.isFinite(fallbackExpiresInSeconds) &&
    fallbackExpiresInSeconds > 0
  ) {
    return {
      expiresAt: calculateExpiresAt(fallbackExpiresInSeconds, now),
      maxAge: fallbackExpiresInSeconds,
    }
  }

  return null
}
