import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSessionTiming } from '@/lib/auth-session'

function redirectToLogin(request: NextRequest, clearCookies = false) {
  const response = NextResponse.redirect(new URL('/login', request.url))

  if (clearCookies) {
    response.cookies.delete('access_token')
    response.cookies.delete('project_uuid')
    response.cookies.delete('user_role')
  }

  return response
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const accessToken = request.cookies.get('access_token')?.value
  const userRole = request.cookies.get('user_role')?.value

  // Public routes that don't require authentication
  const publicPaths = ['/login', '/api', '/_next', '/favicon.ico']
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

  if (isPublicPath) {
    return NextResponse.next()
  }

  // If no token, redirect to login
  if (!accessToken) {
    return redirectToLogin(request)
  }

  if (!getSessionTiming(accessToken)) {
    return redirectToLogin(request, true)
  }

  // Role-based route protection
  if (pathname.startsWith('/admin') && userRole === 'ORGANIZER') {
    return NextResponse.redirect(new URL('/organizer/exhibitors', request.url))
  }

  if (pathname.startsWith('/organizer') && userRole !== 'ORGANIZER') {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
