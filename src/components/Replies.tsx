import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Avatar, relDate } from './ui'
import { I } from './icons'
import type { Member, Reply } from '../lib/types'

export default function Replies({
  workspaceId, target, replies, members, me, onDone,
}: {
  workspaceId: string
  target: { entry_id: string } | { post_id: string }
  replies: Reply[]
  members: Map<string, Member>
  me: Member | null
  onDone: () => void
}) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)

  async function remove(id: string) {
    await supabase.from('replies').delete().eq('id', id)
    onDone()
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!me || !text.trim()) return
    setBusy(true)
    await supabase.from('replies').insert({
      workspace_id: workspaceId, member_id: me.id, text: text.trim(), ...target,
    })
    setBusy(false)
    setText('')
    onDone()
  }

  return (
    <div className="mt-3">
      {replies.length > 0 && (
        <ul className="mb-2 space-y-2 border-l-2 border-line pl-3">
          {replies.map((r) => {
            const m = members.get(r.member_id)
            return (
              <li key={r.id} className="group/r flex gap-2">
                <Avatar color={m?.color ?? 'dusk'} name={m?.name ?? null} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-xs text-muted">
                    {m?.name ?? 'Unnamed'} · {relDate(r.created_at)}
                    {r.member_id === me?.id && (
                      <button onClick={() => remove(r.id)} title="Delete reply"
                        className="rounded p-0.5 text-faint opacity-0 transition-opacity group-hover/r:opacity-100 hover:text-berry">
                        <I.trash />
                      </button>
                    )}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{r.text}</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {open ? (
        <form onSubmit={submit} className="flex gap-2">
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={() => !text && setOpen(false)}
            placeholder="Add a reply"
            className="flex-1 border-b border-line bg-transparent pb-1 text-sm
              outline-none placeholder:text-muted focus:border-umber"
          />
          <button
            type="submit"
            disabled={busy || !text.trim()}
            className="text-xs text-umber disabled:opacity-40"
          >
            Reply
          </button>
        </form>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="text-xs text-muted hover:text-ink"
        >
          {replies.length > 0 ? 'Add a reply' : 'Reply'}
        </button>
      )}
    </div>
  )
}
