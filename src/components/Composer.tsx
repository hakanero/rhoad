import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Button, Card } from './ui'
import type { Member } from '../lib/types'

// Plain activity log. Money goes through ExpenseComposer.
export default function Composer({
  workspaceId, me, onDone,
}: { workspaceId: string; me: Member | null; onDone: () => void }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!me) return
    setBusy(true)
    setErr(null)
    const { error } = await supabase.from('entries').insert({
      workspace_id: workspaceId, member_id: me.id, text,
    })
    setBusy(false)
    if (error) return setErr(error.message)
    setText('')
    onDone()
  }

  return (
    <Card className="mb-5 p-4">
      <form onSubmit={submit}>
        <textarea
          rows={2}
          required
          placeholder="What happened?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submit(e)
          }}
          className="w-full resize-none bg-transparent text-sm outline-none
            placeholder:text-faint"
        />
        <div className="mt-3 flex items-center gap-3 border-t border-line pt-3">
          <Button type="submit" size="sm" disabled={busy || !me || !text.trim()}>
            {busy ? 'Saving…' : 'Add entry'}
          </Button>
          <span className="text-[11px] text-faint">⌘↵</span>
          {err && <span className="text-sm text-berry">{err}</span>}
        </div>
      </form>
    </Card>
  )
}
