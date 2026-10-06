import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import api from '../lib/api'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3002').replace(/\/+$/, '')
import type { User } from '../types'

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  initialize: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: true,

  initialize: () => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        try {
          const { data } = await api.post('/api/auth/google/sync', {
            user: session.user,
          })
          if (data.user?.id) {
            localStorage.setItem('vaagai_user_id', data.user.id)
          }
          if (data.token) {
            localStorage.setItem('vaagai_token', data.token)
          }
          set({ user: data.user, token: data.token || null, loading: false })
        } catch {
          set({ loading: false })
        }
      } else {
        localStorage.removeItem('vaagai_token')
        localStorage.removeItem('vaagai_user_id')
        set({ user: null, token: null, loading: false })
      }
    })
  },

  signInWithGoogle: async () => {
    // Redirect to backend OAuth endpoint to use server-side Google flow
    window.location.href = `${API_URL}/api/auth/google`
  },

  signInWithEmail: async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password })
      const data = response.data
      localStorage.setItem('vaagai_token', data.token)
      localStorage.setItem('token', data.token)
      if (data.user?.id) {
        localStorage.setItem('vaagai_user_id', data.user.id)
        try {
          localStorage.setItem('user', JSON.stringify(data.user))
        } catch {}
      } else {
        localStorage.setItem('vaagai_user_id', data.user?.email || email)
        try {
          localStorage.setItem('user', JSON.stringify({ email: data.user?.email || email }))
        } catch {}
      }
      set({ user: data.user, token: data.token })
    } catch (err) {
      throw err
    }
  },

  signUpWithEmail: async (name, email, password) => {
    const nameParts = name.split(' ')
    const { data } = await api.post<{ user: any; token: string }>('/api/auth/register', {
      firstName: nameParts[0],
      lastName: nameParts.slice(1).join(' ') || undefined,
      email,
      password
    })
    localStorage.setItem('vaagai_token', data.token)
    localStorage.setItem('token', data.token)
    localStorage.setItem('vaagai_user_id', data.user?.id || email)
    try { localStorage.setItem('user', JSON.stringify(data.user || { email })) } catch {}
    set({ user: data.user, token: data.token })
  },

  signOut: async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('vaagai_token')
    localStorage.removeItem('token')
    localStorage.removeItem('vaagai_user_id')
    localStorage.removeItem('user')
    set({ user: null, token: null })
  },
}))