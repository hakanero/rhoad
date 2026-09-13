import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button, Input } from '../components/ui'

export default function Login() {
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  // Preserve where they were headed (e.g. an invite link) across sign-in.
  const next = params.get('next') ?? '/new'

  async function send(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}${next}` },
    })
    error ? setErr(error.message) : setSent(true)
  }

  return (
    <div className="mx-auto flex min-h-full max-w-sm flex-col justify-center px-6">
      <h1 className="mb-1 text-2xl tracking-tight lowercase">
        rhoad<span className="text-umber">.</span>
      </h1>
      <p className="mb-8 text-sm text-muted">a quiet place to keep track of it.</p>

      {sent ? (
        <p className="text-sm">
          Check <span className="text-umber">{email}</span> for a link.
        </p>
      ) : (
        <form onSubmit={send} className="space-y-3">
          <Input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit">Send me a link</Button>
          {err && <p className="text-sm text-berry">{err}</p>}
        </form>
      )}
    </div>
  )
}
