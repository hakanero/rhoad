import { createContext, useContext, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

type AuthState = { session: Session | null; loading: boolean }

const Ctx = createContext<AuthState>({ session: null, loading: true })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ session: null, loading: true })

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) =>
      setState({ session: data.session, loading: false }),
    )
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setState({ session, loading: false }),
    )
    return () => sub.subscription.unsubscribe()
  }, [])

  return <Ctx.Provider value={state}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
