import { cookies } from 'next/headers'

const AUTH_COOKIE_NAMES = ['access_token', 'project_uuid', 'user_role'] as const
export type ServerUserRole = 'ADMIN' | 'ORGANIZER'

export interface ServerAuthContext {
  accessToken: string
  projectUuid?: string
  userRole: ServerUserRole | null
}

function parseServerUserRole(value?: string): ServerUserRole | null {
  return value === 'ADMIN' || value === 'ORGANIZER' ? value : null
}

export async function getServerAuthContext(options?: {
  projectUuid?: string
}): Promise<ServerAuthContext | null> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access_token')?.value

  if (!accessToken) {
    return null
  }

  return {
    accessToken,
    projectUuid: options?.projectUuid ?? cookieStore.get('project_uuid')?.value,
    userRole: parseServerUserRole(cookieStore.get('user_role')?.value),
  }
}

export async function getServerAuthHeaders(options?: {
  projectUuid?: string
  includeProjectUuid?: boolean
}): Promise<Record<string, string> | null> {
  const authContext = await getServerAuthContext({
    projectUuid: options?.projectUuid,
  })

  if (!authContext) {
    return null
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${authContext.accessToken}`,
  }

  if (options?.includeProjectUuid !== false && authContext.projectUuid) {
    headers['X-Project-UUID'] = authContext.projectUuid
  }

  return headers
}

export async function requireServerAuthContext(options?: {
  projectUuid?: string
}): Promise<ServerAuthContext> {
  const authContext = await getServerAuthContext(options)

  if (!authContext) {
    throw new Error('Unauthorized')
  }

  return authContext
}

export async function requireServerAuthHeaders(options?: {
  projectUuid?: string
  includeProjectUuid?: boolean
}): Promise<Record<string, string>> {
  const headers = await getServerAuthHeaders(options)

  if (!headers) {
    throw new Error('Unauthorized')
  }

  return headers
}

export async function clearServerAuthCookies(): Promise<void> {
  const cookieStore = await cookies()

  for (const cookieName of AUTH_COOKIE_NAMES) {
    cookieStore.delete(cookieName)
  }
}
