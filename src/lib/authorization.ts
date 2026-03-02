'use server'

import { cookies } from 'next/headers'
import api from '@/lib/api'

export type UserRole = 'ADMIN' | 'ORGANIZER'

export interface AuthUser {
  id: string
  username: string
  role: UserRole
  projectUuid?: string
  comUuid?: string
}

/**
 * Get the current authenticated user from cookies
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  
  const accessToken = cookieStore.get('access_token')?.value
  const userRole = cookieStore.get('user_role')?.value as UserRole | undefined
  const projectUuid = cookieStore.get('project_uuid')?.value
  const comUuid = cookieStore.get('com_uuid')?.value

  if (!accessToken) {
    return null
  }

  return {
    id: '',
    username: '',
    role: userRole || 'ADMIN',
    projectUuid,
    comUuid
  }
}

/**
 * Check if the current user has admin privileges
 */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await getCurrentUser()
  
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized: Admin access required')
  }
  
  return user
}

/**
 * Check if the current user has organizer privileges
 */
export async function requireOrganizer(): Promise<AuthUser> {
  const user = await getCurrentUser()
  
  if (!user || (user.role !== 'ORGANIZER' && user.role !== 'ADMIN')) {
    throw new Error('Unauthorized: Organizer access required')
  }
  
  return user
}

/**
 * Verify that the user has access to the specified project
 * This prevents IDOR by ensuring the user can only access data within their assigned project
 */
export async function verifyProjectAccess(projectUuid: string): Promise<boolean> {
  const user = await getCurrentUser()
  
  if (!user) {
    return false
  }

  // Admins can access any project
  if (user.role === 'ADMIN') {
    return true
  }

  // Organizers can only access their assigned project
  if (user.role === 'ORGANIZER' && user.projectUuid) {
    return user.projectUuid === projectUuid
  }

  return false
}

/**
 * Get authorization headers with project context validation
 * Throws error if user doesn't have access to the project
 */
export async function getAuthorizedHeaders(projectUuid: string) {
  const hasAccess = await verifyProjectAccess(projectUuid)
  
  if (!hasAccess) {
    throw new Error(`Unauthorized: Access denied to project ${projectUuid}`)
  }

  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value
  
  return {
    'X-Project-UUID': projectUuid,
    ...(token && { Authorization: `Bearer ${token}` })
  }
}

/**
 * Helper to require both authentication and project context
 */
export async function requireProjectContext(projectUuid: string): Promise<AuthUser> {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Unauthorized: Please log in')
  }

  if (projectUuid) {
    const hasAccess = await verifyProjectAccess(projectUuid)
    if (!hasAccess) {
      throw new Error('Unauthorized: You do not have access to this project')
    }
  }
  
  return user
}
