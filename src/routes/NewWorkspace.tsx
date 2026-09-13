import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button, Card, Input, Label } from '../components/ui'
import type { Workspace } from '../lib/types'

export default function NewWorkspace() {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const nav = useNavigate()

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErr(null)
    const { data, error } = await supabase.rpc('create_workspace', { ws_name: name })
    setBusy(false)
    if (error) return setErr(error.message)
    nav(`/w/${(data as Workspace).share_slug}`)
  }

  return (
    <div className="mx-auto flex min-h-full max-w-sm flex-col justify-center px-6">
      <Link to="/workspaces" className="mb-6 text-xs text-muted hover:text-ink">
        ← Workspaces
      </Link>
      <h1 className="mb-1 text-lg tracking-tight">New workspace</h1>
      <Card className="p-5">
      <form onSubmit={create} className="space-y-3">
        <div>
          <Label>Company name</Label>
          <Input
            required
            placeholder="Acme"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={busy}>
          {busy ? 'Creating…' : 'Create workspace'}
        </Button>
        {err && <p className="text-sm text-berry">{err}</p>}
      </form>
      </Card>
    </div>
  )
}
