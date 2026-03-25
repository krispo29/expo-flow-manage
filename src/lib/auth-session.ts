export function calculateExpiresAt(expiresInSeconds: number, now = Date.now()): number {
  return now + expiresInSeconds * 1000
}

export function isSessionExpired(expiresAt?: number | null, now = Date.now()): boolean {
  if (!expiresAt) {
    return true
  }

  return expiresAt <= now
}

function decodeBase64Url(value: string): string | null {
  try {
    return Buffer.from(value, 'base64url').toString('utf8')
  } catch {
    return null
  }
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
