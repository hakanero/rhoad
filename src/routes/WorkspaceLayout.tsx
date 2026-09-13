import { useState } from 'react'
import { NavLink, Outlet, useParams } from 'react-router-dom'
import { useWorkspace } from '../lib/useWorkspace'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { Avatar, Button, Card, Input, money } from '../components/ui'
import { I } from '../components/icons'

const NAV = [
  { to: '', label: 'Home', icon: I.home, end: true },
  { to: 'pitch', label: 'Pitch', icon: I.pitch, end: false },
  { to: 'content', label: 'Content', icon: I.content, end: false },
  { to: 'next', label: 'Next steps', icon: I.next, end: false },
]

export default function WorkspaceLayout() {
  const { slug } = useParams()
  const data = useWorkspace(slug)
  const { session } = useAuth()
  const [copied, setCopied] = useState(false)

  if (data.loading)
    return <p className="p-10 text-sm text-muted">Loading…</p>
  if (data.error === 'not-a-member')
    return (
      <p className="p-10 text-sm text-muted">
        You don't have access to this workspace. An invite link is required.
      </p>
    )
  if (data.error) return <p className="p-10 text-sm text-berry">{data.error}</p>

  const ws = data.workspace!
  const me = data.members.find((m) => m.user_id === session?.user.id) ?? null
  const invite = `${window.location.origin}/join/${ws.share_slug}`

  function copyInvite() {
    navigator.clipboard.writeText(invite)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  const link = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors ${
      isActive
        ? 'bg-hover font-medium text-ink'
        : 'text-muted hover:bg-hover/70 hover:text-ink'
    }`

  return (
    <div className="flex min-h-full">
      <aside className="sticky top-0 flex h-screen w-[232px] shrink-0 flex-col
        border-r border-line bg-cream px-3 py-4">
        <div className="flex items-center justify-between px-2.5">
          <span className="text-[15px] font-semibold lowercase tracking-tight">
            rhoad<span className="text-umber">.</span>
          </span>
        </div>

        <div className="mt-6 rounded-lg bg-surface px-3 py-2.5 shadow-card">
          <p className="truncate text-[13px] font-medium">{ws.name}</p>
          <p className="mt-0.5 text-xs text-muted tabular-nums">
            {money(data.invested)} invested
          </p>
        </div>

        <nav className="mt-5 space-y-0.5">
          {NAV.map((n) => (
            <NavLink key={n.label} end={n.end} to={`/w/${slug}/${n.to}`} className={link}>
              <n.icon />
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-7">
          <div className="mb-1.5 flex items-center justify-between px-2.5">
            <p className="text-[11px] font-medium tracking-wide text-faint uppercase">
              People
            </p>
            <button
              onClick={copyInvite}
              title="Copy invite link"
              className="rounded p-0.5 text-faint hover:bg-hover hover:text-ink"
            >
              {copied ? <I.check /> : <I.plus />}
            </button>
          </div>
          <ul className="space-y-0.5">
            {data.members.map((m) => (
              <li key={m.id} className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5">
                <Avatar color={m.color} name={m.name} />
                <span className="truncate text-[13px]">
                  {m.name ?? 'Unnamed'}
                  {m.id === me?.id && <span className="text-faint"> · you</span>}
                </span>
              </li>
            ))}
          </ul>
          {copied && (
            <p className="mt-1.5 px-2.5 text-[11px] text-umber">Invite link copied</p>
          )}
        </div>

        <div className="mt-auto border-t border-line pt-3">
          <button
            onClick={() => supabase.auth.signOut()}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5
              text-[13px] text-muted hover:bg-hover hover:text-ink"
          >
            <I.out /> Sign out
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-[1080px] px-10 py-8">
          {me && !me.name && <NamePrompt userId={me.user_id} onDone={data.refresh} />}
          <Outlet context={{ ...data, me }} />
        </div>
      </main>
    </div>
  )
}

// Magic-link accounts have no name. Ask once; it's what the feed
// attributes entries to.
function NamePrompt({ userId, onDone }: { userId: string; onDone: () => void }) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    await supabase.from('profiles').update({ name: name.trim() }).eq('id', userId)
    setBusy(false)
    onDone()
  }
  return (
    <Card className="mb-6 flex items-center gap-3 px-4 py-3">
      <p className="text-sm">What should we call you?</p>
      <form onSubmit={save} className="flex flex-1 items-center gap-2">
        <Input
          autoFocus
          required
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="max-w-xs"
        />
        <Button type="submit" size="sm" disabled={busy || !name.trim()}>Save</Button>
      </form>
    </Card>
  )
}
