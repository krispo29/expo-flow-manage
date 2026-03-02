/**
 * Session storage keys for auth and project data
 */
export const AUTH_STORAGE_KEYS = {
  USER: 'auth_user',
  PROJECTS: 'auth_projects',
  SELECTED_PROJECT: 'selected_project',
} as const

/**
 * Type definitions for stored auth data
 */
export interface StoredUser {
  id: string
  username: string
  role: string
  projectId?: string
}

export interface StoredProject {
  project_uuid: string
  project_name: string
  project_code: string
  logo_url?: string
}

/**
 * Helper functions for managing auth state in sessionStorage
 * This allows auth state to persist across page navigation within the same session
 */

// Check if we're in a browser environment
function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

/**
 * Save user data to sessionStorage
 */
export function setStoredUser(user: StoredUser | null): void {
  if (!isBrowser()) return
  
  if (user) {
    sessionStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(user))
  } else {
    sessionStorage.removeItem(AUTH_STORAGE_KEYS.USER)
  }
}

/**
 * Get user data from sessionStorage
 */
export function getStoredUser(): StoredUser | null {
  if (!isBrowser()) return null
  
  const userStr = sessionStorage.getItem(AUTH_STORAGE_KEYS.USER)
  if (!userStr) return null
  
  try {
    return JSON.parse(userStr) as StoredUser
  } catch {
    return null
  }
}

/**
 * Save projects list to sessionStorage
 */
export function setStoredProjects(projects: StoredProject[] | null): void {
  if (!isBrowser()) return
  
  if (projects) {
    sessionStorage.setItem(AUTH_STORAGE_KEYS.PROJECTS, JSON.stringify(projects))
  } else {
    sessionStorage.removeItem(AUTH_STORAGE_KEYS.PROJECTS)
  }
}

/**
 * Get projects list from sessionStorage
 */
export function getStoredProjects(): StoredProject[] {
  if (!isBrowser()) return []
  
  const projectsStr = sessionStorage.getItem(AUTH_STORAGE_KEYS.PROJECTS)
  if (!projectsStr) return []
  
  try {
    return JSON.parse(projectsStr) as StoredProject[]
  } catch {
    return []
  }
}

/**
 * Save selected project to sessionStorage
 */
export function setSelectedProject(projectId: string | null): void {
  if (!isBrowser()) return
  
  if (projectId) {
    sessionStorage.setItem(AUTH_STORAGE_KEYS.SELECTED_PROJECT, projectId)
  } else {
    sessionStorage.removeItem(AUTH_STORAGE_KEYS.SELECTED_PROJECT)
  }
}

/**
 * Get selected project from sessionStorage
 */
export function getSelectedProject(): string | null {
  if (!isBrowser()) return null
  return sessionStorage.getItem(AUTH_STORAGE_KEYS.SELECTED_PROJECT)
}

/**
 * Clear all auth-related sessionStorage data
 */
export function clearAuthStorage(): void {
  if (!isBrowser()) return
  
  sessionStorage.removeItem(AUTH_STORAGE_KEYS.USER)
  sessionStorage.removeItem(AUTH_STORAGE_KEYS.PROJECTS)
  sessionStorage.removeItem(AUTH_STORAGE_KEYS.SELECTED_PROJECT)
}

/**
 * Check if user is authenticated (has stored user data)
 */
export function isAuthenticated(): boolean {
  return getStoredUser() !== null
}
