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
    // Token is only kept in memory (Zustand) — never persisted.
    // Closing the browser or refreshing will always return to login.
    set({
      token,
      user,
      isAuthenticated: true,
      isAdmin: user.role === 'admin',
    })
  },

  logout: () => {
    // Clean up any stale tokens from previous versions
    localStorage.removeItem('token')
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      isAdmin: false,
    })
  },

  initialize: async () => {
    // Always start at login — remove any cached tokens from previous versions
    localStorage.removeItem('token')
    set({ isInitialized: true })
  },
}))
