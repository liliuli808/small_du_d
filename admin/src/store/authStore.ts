import { create } from 'zustand'

interface User {
  id: number
  username: string
  nickname: string
  role: number
}

interface AuthState {
  isLoggedIn: boolean
  user: User | null
  token: string | null
  login: (token: string, user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: !!localStorage.getItem('admin_token'),
  user: localStorage.getItem('admin_user') ? JSON.parse(localStorage.getItem('admin_user')!) : null,
  token: localStorage.getItem('admin_token') || null,

  login: (token, user) => {
    localStorage.setItem('admin_token', token)
    localStorage.setItem('admin_user', JSON.stringify(user))
    set({ isLoggedIn: true, token, user })
  },

  logout: () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    set({ isLoggedIn: false, token: null, user: null })
  },
}))
