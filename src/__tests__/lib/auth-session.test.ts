import { calculateExpiresAt, getJwtExp, getRemainingTokenLifetime, getSessionTiming } from '@/lib/auth-session'

describe('auth-session', () => {
  const fixedNow = 1_700_000_000_000

  it('should calculate expiresAt from expiresIn seconds', () => {
    expect(calculateExpiresAt(60, fixedNow)).toBe(fixedNow + 60_000)
  })

  it('should decode JWT exp from the payload', () => {
    const exp = Math.floor(fixedNow / 1000) + 3600
    const payload = Buffer.from(JSON.stringify({ exp })).toString('base64url')
    const token = `header.${payload}.signature`

    expect(getJwtExp(token)).toBe(exp)
  })

  it('should calculate remaining lifetime from JWT exp', () => {
    const exp = Math.floor(fixedNow / 1000) + 1800
    const payload = Buffer.from(JSON.stringify({ exp })).toString('base64url')
    const token = `header.${payload}.signature`

    expect(getRemainingTokenLifetime(token, fixedNow)).toBe(1800)
  })

  it('should prefer JWT exp when resolving session timing', () => {
    const exp = Math.floor(fixedNow / 1000) + 900
    const payload = Buffer.from(JSON.stringify({ exp })).toString('base64url')
    const token = `header.${payload}.signature`

    expect(getSessionTiming(token, 604800, fixedNow)).toEqual({
      expiresAt: exp * 1000,
      maxAge: 900,
    })
  })

  it('should fall back to expiresIn when the token does not expose exp', () => {
    expect(getSessionTiming('opaque-token', 300, fixedNow)).toEqual({
      expiresAt: fixedNow + 300_000,
      maxAge: 300,
    })
  })

  it('should return null when the JWT is already expired', () => {
    const exp = Math.floor(fixedNow / 1000) - 1
    const payload = Buffer.from(JSON.stringify({ exp })).toString('base64url')
    const token = `header.${payload}.signature`

    expect(getSessionTiming(token, undefined, fixedNow)).toBeNull()
  })
})
