export const THAILAB2026_PROJECT_UUID = '07626a19-001d-4675-addd-3a92e3f46d47'

export const businessMatchingEnabled = true

export function isBusinessMatchingEnabled(projectId?: string) {
  return projectId === THAILAB2026_PROJECT_UUID
}
