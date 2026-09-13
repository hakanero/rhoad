import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Button, Card, Input, Label, Select } from './ui'
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
    <Card className="mb-4 p-4">
      <form onSubmit={submit}>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label>Platform</Label>
          <Select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as typeof platform)}
            className="w-36"
          >
            <option value="linkedin">LinkedIn</option>
            <option value="x">X</option>
            <option value="other">Other</option>
          </Select>
        </div>
        <div className="min-w-48 flex-1">
          <Label>Caption or link</Label>
          <Input
            required
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
        </div>
      </div>
      <p className="mt-2 text-xs text-muted">
        The current pitch is saved with this post.
      </p>
      <div className="mt-4 flex items-center gap-3">
        <Button type="submit" disabled={busy || !me}>
          {busy ? 'Saving…' : 'Add post'}
        </Button>
        <Button type="button" variant="quiet" onClick={onCancel}>Cancel</Button>
        {err && <span className="text-sm text-berry">{err}</span>}
      </div>
      </form>
    </Card>
  )
}
