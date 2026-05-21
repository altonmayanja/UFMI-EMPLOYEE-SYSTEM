import { create } from 'zustand'

export interface UserProfile {
  employeeId?: string
  position?: string
  department?: string
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
    localStorage.setItem('token', token)
    set({
      token,
      user,
      isAuthenticated: true,
      isAdmin: user.role === 'admin',
    })
  },

  logout: () => {
    localStorage.removeItem('token')
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      isAdmin: false,
    })
  },

  initialize: async () => {
    try {
      const storedToken = localStorage.getItem('token')
      if (!storedToken) {
        set({ isInitialized: true })
        return
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      })

      if (response.ok) {
        const user = await response.json()
        set({
          token: storedToken,
          user,
          isAuthenticated: true,
          isAdmin: user.role === 'admin',
          isInitialized: true,
        })
      } else {
        localStorage.removeItem('token')
        set({ isInitialized: true })
      }
    } catch {
      localStorage.removeItem('token')
      set({ isInitialized: true })
    }
  },
}))
