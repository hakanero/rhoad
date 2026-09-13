import { useState } from 'react'
import { Link, NavLink, Outlet, useParams } from 'react-router-dom'
import { useWorkspace } from '../lib/useWorkspace'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { Avatar, Button, Card, Input, money } from '../components/ui'
import { I } from '../components/icons'

const NAV = [
  { to: '', label: 'Home', icon: I.home, end: true },
  { to: 'finances', label: 'Finances', icon: I.ledger, end: false },
  { to: 'pitch', label: 'Pitch', icon: I.pitch, end: false },
  { to: 'content', label: 'Content', icon: I.content, end: false },
  { to: 'next', label: 'Next steps', icon: I.next, end: false },
]

export default function WorkspaceLayout() {
  const { slug } = useParams()
  const data = useWorkspace(slug)
  const { session } = useAuth()
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)      // mobile nav
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState('')

  if (data.loading) return <p className="p-10 text-sm text-muted">Loading…</p>
  if (data.error === 'not-a-member')
    return <p className="p-10 text-sm text-muted">You don't have access to this workspace. An invite link is required.</p>
  if (data.error) return <p className="p-10 text-sm text-berry">{data.error}</p>

  const ws = data.workspace!
  const me = data.members.find((m) => m.user_id === session?.user.id) ?? null
  const invite = `${window.location.origin}/join/${ws.share_slug}`

  function copyInvite() {
    navigator.clipboard.writeText(invite)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  async function rename(e: React.FormEvent) {
    e.preventDefault()
    const n = name.trim()
    if (n && n !== ws.name) {
      await supabase.from('workspaces').update({ name: n }).eq('id', ws.id)
      data.patchWorkspace({ name: n })
    }
    setRenaming(false)
  }

  const link = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors ${
      isActive ? 'bg-hover font-medium text-ink' : 'text-muted hover:bg-hover/70 hover:text-ink'}`

  const sidebar = (
    <>
      <div className="flex items-center justify-between px-2.5">
        <Link to="/workspaces" className="text-[15px] font-semibold lowercase tracking-tight">
          rhoad<span className="text-umber">.</span>
        </Link>
        <Link to="/workspaces" title="All workspaces" className="rounded p-0.5 text-faint hover:bg-hover hover:text-ink">
          <I.menu />
        </Link>
      </div>

      <div className="mt-6 rounded-lg bg-surface px-3 py-2.5 shadow-card">
        {renaming ? (
          <form onSubmit={rename} className="flex items-center gap-1.5">
            <Input autoFocus value={name} onChange={(e) => setName(e.target.value)}
              onBlur={rename} className="px-2 py-1 text-[13px]" />
          </form>
        ) : (
          <button onClick={() => { setName(ws.name); setRenaming(true) }} title="Rename"
            className="group flex w-full items-center justify-between text-left">
            <span className="truncate text-[13px] font-medium">{ws.name}</span>
            <span className="text-faint opacity-0 group-hover:opacity-100"><I.edit /></span>
          </button>
        )}
        <p className="mt-0.5 text-xs text-muted tabular-nums">{money(data.invested)} invested</p>
      </div>

      <nav className="mt-5 space-y-0.5">
        {NAV.map((n) => (
          <NavLink key={n.label} end={n.end} to={`/w/${slug}/${n.to}`} className={link} onClick={() => setOpen(false)}>
            <n.icon />{n.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-7">
        <div className="mb-1.5 flex items-center justify-between px-2.5">
          <p className="text-[11px] font-medium tracking-wide text-faint uppercase">People</p>
          <button onClick={copyInvite} title="Copy invite link" className="rounded p-0.5 text-faint hover:bg-hover hover:text-ink">
            {copied ? <I.check /> : <I.plus />}
          </button>
        </div>
        <ul className="space-y-0.5">
          {data.members.map((m) => (
            <li key={m.id} className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5">
              <Avatar color={m.color} name={m.name} />
              <span className="truncate text-[13px]">
                {m.name ?? 'Unnamed'}{m.id === me?.id && <span className="text-faint"> · you</span>}
              </span>
            </li>
          ))}
        </ul>
        {copied && <p className="mt-1.5 px-2.5 text-[11px] text-umber">Invite link copied</p>}
      </div>

      <div className="mt-auto border-t border-line pt-3">
        <button onClick={() => supabase.auth.signOut()}
          className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] text-muted hover:bg-hover hover:text-ink">
          <I.out /> Sign out
        </button>
      </div>
    </>
  )

  return (
    <div className="flex min-h-full flex-col md:flex-row">
      {/* mobile bar */}
      <div className="flex items-center justify-between border-b border-line px-4 py-3 md:hidden">
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 text-[13px] font-medium">
          <I.menu /> {ws.name}
        </button>
        <span className="text-[13px] font-semibold lowercase tracking-tight">rhoad<span className="text-umber">.</span></span>
      </div>
      {open && (
        <div className="fixed inset-0 z-30 flex md:hidden">
          <aside className="flex h-full w-[260px] flex-col bg-cream px-3 py-4 shadow-xl">{sidebar}</aside>
          <div className="flex-1 bg-ink/30" onClick={() => setOpen(false)} />
        </div>
      )}

      {/* desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[232px] shrink-0 flex-col border-r border-line bg-cream px-3 py-4 md:flex">
        {sidebar}
      </aside>

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-[1080px] px-4 py-5 md:px-10 md:py-8">
          {me && !me.name && <NamePrompt userId={me.user_id} onDone={data.refresh} />}
          <Outlet context={{ ...data, me }} />
        </div>
      </main>
    </div>
  )
}

// Magic-link accounts created before the sign-up form asked for a name.
function NamePrompt({ onDone }: { userId: string; onDone: () => void }) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setErr(null)
    const { error } = await supabase.rpc('set_display_name', { display_name: name.trim() })
    setBusy(false)
    if (error) return setErr(error.message)
    onDone()
  }
  return (
    <Card className="mb-6 flex flex-wrap items-center gap-3 px-4 py-3">
      <p className="text-sm font-medium">Display name</p>
      <form onSubmit={save} className="flex flex-1 items-center gap-2">
        <Input autoFocus required placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="max-w-xs" />
        <Button type="submit" size="sm" disabled={busy || !name.trim()}>{busy ? 'Saving…' : 'Save'}</Button>
        {err && <span className="text-sm text-berry">{err}</span>}
      </form>
    </Card>
  )
}
