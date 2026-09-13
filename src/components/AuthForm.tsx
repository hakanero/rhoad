import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Button, Input, Label } from './ui'

// Magic-link sign-in and sign-up are one flow. `name` is stored in user
// metadata for new accounts (the profiles trigger copies it) and ignored
// for existing ones.
export default function AuthForm({ next = '/workspaces' }: { next?: string }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function send(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErr(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}${next}`,
        data: { name: name.trim() },
      },
    })
    setBusy(false)
    if (error) setErr(error.message)
    else setSent(true)
  }

  if (sent)
    return (
      <p className="text-sm">
        A sign-in link has been sent to <span className="text-umber">{email}</span>.
      </p>
    )

  return (
    <form onSubmit={send} className="space-y-3">
      <div>
        <Label>Name</Label>
        <Input required placeholder="Full name" value={name}
          onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <Label>Email address</Label>
        <Input type="email" required placeholder="you@example.com" value={email}
          onChange={(e) => setEmail(e.target.value)} />
      </div>
      <Button type="submit" disabled={busy}>
        {busy ? 'Sending…' : 'Continue with email'}
      </Button>
      {err && <p className="text-sm text-berry">{err}</p>}
    </form>
  )
}
