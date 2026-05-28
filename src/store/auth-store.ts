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

// Inactivity timeout: 20 minutes in milliseconds
const INACTIVITY_TIMEOUT = 20 * 60 * 1000

let inactivityTimer: ReturnType<typeof setTimeout> | null = null

function resetInactivityTimer(logoutFn: () => void) {
  if (typeof window === 'undefined') return
  if (inactivityTimer) clearTimeout(inactivityTimer)
  inactivityTimer = setTimeout(() => {
    logoutFn()
  }, INACTIVITY_TIMEOUT)
}

function startActivityTracking(logoutFn: () => void) {
  if (typeof window === 'undefined') return
  const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click']
  events.forEach((event) => {
    window.addEventListener(event, () => resetInactivityTimer(logoutFn), { passive: true })
  })
}

function stopActivityTracking() {
  if (typeof window === 'undefined') return
  if (inactivityTimer) {
    clearTimeout(inactivityTimer)
    inactivityTimer = null
  }
}

// Mark the current tab session as active (sessionStorage clears when tab closes)
function markTabSession() {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('ufmi_tab_active', '1')
  }
}

function isTabSessionActive(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem('ufmi_tab_active') === '1'
}

function updateLastActivity() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('ufmi_last_activity', Date.now().toString())
  }
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

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isAdmin: false,
  isInitialized: false,

  login: (token: string, user: User) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ufmi_token', token)
      localStorage.setItem('ufmi_user', JSON.stringify(user))
      markTabSession()
      updateLastActivity()
    }
    set({
      token,
      user,
      isAuthenticated: true,
      isAdmin: user.role === 'admin',
    })
    startActivityTracking(get().logout)
    resetInactivityTimer(get().logout)
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ufmi_token')
      localStorage.removeItem('ufmi_user')
      localStorage.removeItem('ufmi_last_activity')
      sessionStorage.removeItem('ufmi_tab_active')
    }
    stopActivityTracking()
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

    // Tab was closed and reopened — require login again
    if (token && !isTabSessionActive()) {
      localStorage.removeItem('ufmi_token')
      localStorage.removeItem('ufmi_user')
      localStorage.removeItem('ufmi_last_activity')
      set({ isInitialized: true })
      return
    }

    // Check inactivity timeout (20 min)
    const lastActivity = localStorage.getItem('ufmi_last_activity')
    if (token && lastActivity) {
      const elapsed = Date.now() - parseInt(lastActivity, 10)
      if (elapsed > INACTIVITY_TIMEOUT) {
        localStorage.removeItem('ufmi_token')
        localStorage.removeItem('ufmi_user')
        localStorage.removeItem('ufmi_last_activity')
        sessionStorage.removeItem('ufmi_tab_active')
        set({ isInitialized: true })
        return
      }
    }

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as User
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const freshUser = await res.json()
          localStorage.setItem('ufmi_user', JSON.stringify(freshUser))
          updateLastActivity()
          markTabSession()
          set({
            token,
            user: freshUser,
            isAuthenticated: true,
            isAdmin: freshUser.role === 'admin',
            isInitialized: true,
          })
          startActivityTracking(get().logout)
          resetInactivityTimer(get().logout)
          return
        }
      } catch {
        // Token invalid or expired
      }
      localStorage.removeItem('ufmi_token')
      localStorage.removeItem('ufmi_user')
      localStorage.removeItem('ufmi_last_activity')
      sessionStorage.removeItem('ufmi_tab_active')
    }

    set({ isInitialized: true })
  },
}))
