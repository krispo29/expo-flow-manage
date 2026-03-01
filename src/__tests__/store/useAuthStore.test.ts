import { useAuthStore } from '@/store/useAuthStore'

// Helper to reset the store before each test
const resetStore = () => {
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
    isHydrated: false,
  })
}

describe('useAuthStore', () => {
  beforeEach(() => {
    resetStore()
  })

  describe('Initial State', () => {
    it('should have null user initially', () => {
      const { user } = useAuthStore.getState()
      expect(user).toBeNull()
    })

    it('should not be authenticated initially', () => {
      const { isAuthenticated } = useAuthStore.getState()
      expect(isAuthenticated).toBe(false)
    })

    it('should not be hydrated initially', () => {
      const { isHydrated } = useAuthStore.getState()
      expect(isHydrated).toBe(false)
    })
  })

  describe('login action', () => {
    it('should set user when logging in', () => {
      const testUser = {
        id: '123',
        username: 'testuser',
        role: 'ADMIN',
      }

      useAuthStore.getState().login(testUser)

      const { user, isAuthenticated } = useAuthStore.getState()
      expect(user).toEqual(testUser)
      expect(isAuthenticated).toBe(true)
    })

    it('should set isAuthenticated to true when logging in', () => {
      const testUser = {
        id: '123',
        username: 'testuser',
        role: 'ORGANIZER',
        projectId: 'project-123',
      }

      useAuthStore.getState().login(testUser)

      const { isAuthenticated } = useAuthStore.getState()
      expect(isAuthenticated).toBe(true)
    })

    it('should preserve existing user data when logging in again', () => {
      const firstUser = {
        id: '1',
        username: 'first',
        role: 'ADMIN',
      }

      const secondUser = {
        id: '2',
        username: 'second',
        role: 'ORGANIZER',
        projectId: 'project-123',
      }

      useAuthStore.getState().login(firstUser)
      useAuthStore.getState().login(secondUser)

      const { user } = useAuthStore.getState()
      expect(user).toEqual(secondUser)
    })
  })

  describe('logout action', () => {
    it('should set user to null when logging out', () => {
      // First login
      useAuthStore.getState().login({
        id: '123',
        username: 'testuser',
        role: 'ADMIN',
      })

      // Then logout
      useAuthStore.getState().logout()

      const { user, isAuthenticated } = useAuthStore.getState()
      expect(user).toBeNull()
      expect(isAuthenticated).toBe(false)
    })

    it('should set isAuthenticated to false when logging out', () => {
      useAuthStore.getState().login({
        id: '123',
        username: 'testuser',
        role: 'ADMIN',
      })

      useAuthStore.getState().logout()

      const { isAuthenticated } = useAuthStore.getState()
      expect(isAuthenticated).toBe(false)
    })

    it('should handle logout when not logged in', () => {
      // Should not throw
      expect(() => {
        useAuthStore.getState().logout()
      }).not.toThrow()

      const { user, isAuthenticated } = useAuthStore.getState()
      expect(user).toBeNull()
      expect(isAuthenticated).toBe(false)
    })
  })

  describe('setHydrated action', () => {
    it('should set isHydrated to true', () => {
      useAuthStore.getState().setHydrated()

      const { isHydrated } = useAuthStore.getState()
      expect(isHydrated).toBe(true)
    })

    it('should preserve user data when hydrating', () => {
      const testUser = {
        id: '123',
        username: 'testuser',
        role: 'ADMIN',
      }

      useAuthStore.getState().login(testUser)
      useAuthStore.getState().setHydrated()

      const { user, isHydrated } = useAuthStore.getState()
      expect(user).toEqual(testUser)
      expect(isHydrated).toBe(true)
    })
  })

  describe('State Transitions', () => {
    it('should transition from unauthenticated to authenticated', () => {
      const { isAuthenticated } = useAuthStore.getState()
      expect(isAuthenticated).toBe(false)

      useAuthStore.getState().login({
        id: '123',
        username: 'testuser',
        role: 'ADMIN',
      })

      const { isAuthenticated: isAuth } = useAuthStore.getState()
      expect(isAuth).toBe(true)
    })

    it('should transition from authenticated to unauthenticated', () => {
      useAuthStore.getState().login({
        id: '123',
        username: 'testuser',
        role: 'ADMIN',
      })

      useAuthStore.getState().logout()

      const { isAuthenticated } = useAuthStore.getState()
      expect(isAuthenticated).toBe(false)
    })

    it('should handle complete auth flow', () => {
      // 1. Initial state
      expect(useAuthStore.getState().isAuthenticated).toBe(false)

      // 2. Login
      useAuthStore.getState().login({
        id: '123',
        username: 'admin',
        role: 'ADMIN',
        projectId: 'proj-1',
      })
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
      expect(useAuthStore.getState().user?.username).toBe('admin')

      // 3. Hydrate
      useAuthStore.getState().setHydrated()
      expect(useAuthStore.getState().isHydrated).toBe(true)

      // 4. Logout
      useAuthStore.getState().logout()
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
      expect(useAuthStore.getState().user).toBeNull()
    })
  })
})
