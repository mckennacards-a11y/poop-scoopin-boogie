import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

interface AuthState {
  /** undefined while loading */
  session: Session | null | undefined
  /** undefined while loading or signed out */
  role: 'staff' | 'customer' | undefined
}

const AuthContext = createContext<AuthState>({ session: undefined, role: undefined })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [role, setRole] = useState<AuthState['role']>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id
  useEffect(() => {
    if (!userId) {
      setRole(undefined)
      return
    }
    supabase.rpc('is_staff').then(({ data }) => setRole(data === true ? 'staff' : 'customer'))
  }, [userId])

  return <AuthContext.Provider value={{ session, role }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
