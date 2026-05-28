import { create } from 'zustand'

export interface UserProfile {
  employeeId?: string
  position?: string
}

export interface User {
  id: string
  username: string
  role: 'admin' | 'employee'
  status: string
  profile: UserProfile | null
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  isInitialized: boolean
  login: (token: string, user: User) => void
  logout: () => void
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isAdmin: false,
  isInitialized: false,

  login: (token: string, user: User) => {
    // Persist token and user to localStorage so refresh keeps user logged in
    if (typeof window !== 'undefined') {
      localStorage.setItem('ufmi_token', token)
      localStorage.setItem('ufmi_user', JSON.stringify(user))
    }
    set({
      token,
      user,
      isAuthenticated: true,
      isAdmin: user.role === 'admin',
    })
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ufmi_token')
      localStorage.removeItem('ufmi_user')
    }
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      isAdmin: false,
    })
  },

  initialize: async () => {
    if (typeof window === 'undefined') {
      set({ isInitialized: true })
      return
    }

    const token = localStorage.getItem('ufmi_token')
    const userJson = localStorage.getItem('ufmi_user')

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as User
        // Verify token is still valid by calling /api/auth/me
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const freshUser = await res.json()
          // Update stored user with fresh data from server
          localStorage.setItem('ufmi_user', JSON.stringify(freshUser))
          set({
            token,
            user: freshUser,
            isAuthenticated: true,
            isAdmin: freshUser.role === 'admin',
            isInitialized: true,
          })
          return
        }
      } catch {
        // Token invalid or expired — fall through to logout
      }
      // Clear stale data
      localStorage.removeItem('ufmi_token')
      localStorage.removeItem('ufmi_user')
    }

    set({ isInitialized: true })
  },
}))
