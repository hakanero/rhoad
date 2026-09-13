import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Button, Input } from './ui'
import type { Member } from '../lib/types'

// pitch_snapshot is deliberately absent here — a DB trigger fills it
// from the live workspace pitch, so a stale tab can't snapshot wrong.
export default function PostComposer({
  workspaceId, me, onDone, onCancel,
}: {
  workspaceId: string
  me: Member | null
  onDone: () => void
  onCancel: () => void
}) {
  const [platform, setPlatform] = useState<'linkedin' | 'x' | 'other'>('linkedin')
  const [caption, setCaption] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!me) return
    setBusy(true)
    setErr(null)
    const { error } = await supabase.from('posts').insert({
      workspace_id: workspaceId,
      member_id: me.id,
      platform,
      caption,
    })
    setBusy(false)
    if (error) return setErr(error.message)
    setCaption('')
    onDone()
  }

  return (
    <form onSubmit={submit} className="mb-8 rounded-lg border border-line bg-white/50 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value as typeof platform)}
          className="rounded-md border border-line bg-white/60 px-2 py-2 text-sm outline-none"
        >
          <option value="linkedin">LinkedIn</option>
          <option value="x">X</option>
          <option value="other">Other</option>
        </select>
        <Input
          required
          placeholder="caption or link"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="flex-1"
        />
      </div>
      <p className="mt-2 text-xs text-muted">
        Your pitch as it reads right now gets saved alongside this.
      </p>
      <div className="mt-4 flex items-center gap-3">
        <Button type="submit" disabled={busy || !me}>
          {busy ? 'Saving…' : 'Log post'}
        </Button>
        <Button type="button" variant="quiet" onClick={onCancel}>Cancel</Button>
        {err && <span className="text-sm text-berry">{err}</span>}
      </div>
    </form>
  )
}
