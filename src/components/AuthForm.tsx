import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button, Input, Label } from './ui'

type Mode = 'signin' | 'signup' | 'link'

// Password by default: sign-in that doesn't depend on an inbox.
// Magic link kept as a fallback.
export default function AuthForm({ next = '/workspaces' }: { next?: string }) {
  const nav = useNavigate()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setErr(null)

    if (mode === 'link') {
      const { error } = await supabase.auth.signInWithOtp({
        email, options: { emailRedirectTo: `${window.location.origin}${next}`, data: { name: name.trim() } },
      })
      setBusy(false)
      if (error) setErr(error.message); else setSent(true)
      return
    }

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email, password, options: { data: { name: name.trim() } },
      })
      setBusy(false)
      if (error) return setErr(error.message)
      // With email confirmation off, a session comes back immediately.
      if (data.session) nav(next)
      else setSent(true)
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) return setErr(error.message)
    nav(next)
  }

  if (sent)
    return (
      <p className="text-sm">
        {mode === 'link' ? 'A sign-in link' : 'A confirmation link'} has been sent to{' '}
        <span className="text-umber">{email}</span>.
      </p>
    )

  const tab = (m: Mode, label: string) => (
    <button type="button" onClick={() => { setMode(m); setErr(null) }}
      className={`-mb-px border-b-2 pb-2 text-sm ${mode === m ? 'border-umber font-medium text-ink' : 'border-transparent text-muted hover:text-ink'}`}>
      {label}
    </button>
  )

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="mb-4 flex gap-4 border-b border-line">
        {tab('signin', 'Sign in')}
        {tab('signup', 'Create account')}
      </div>

      {mode !== 'signin' && (
        <div>
          <Label>Name</Label>
          <Input required placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
      )}
      <div>
        <Label>Email address</Label>
        <Input type="email" required placeholder="you@example.com" value={email}
          onChange={(e) => setEmail(e.target.value)} />
      </div>
      {mode !== 'link' && (
        <div>
          <Label>Password</Label>
          <Input type="password" required minLength={6} value={password}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            onChange={(e) => setPassword(e.target.value)} />
        </div>
      )}

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" disabled={busy}>
          {busy ? '…' : mode === 'signup' ? 'Create account' : mode === 'link' ? 'Email me a link' : 'Sign in'}
        </Button>
        {mode === 'link' ? (
          <button type="button" onClick={() => setMode('signin')} className="text-xs text-muted hover:text-ink">
            Use a password
          </button>
        ) : (
          <button type="button" onClick={() => setMode('link')} className="text-xs text-muted hover:text-ink">
            Email me a link instead
          </button>
        )}
      </div>
      {err && <p className="text-sm text-berry">{err}</p>}
    </form>
  )
}
