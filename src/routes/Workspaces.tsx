import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { Button, Card, Empty, money } from '../components/ui'
import { I } from '../components/icons'
import type { Workspace } from '../lib/types'

type Row = Workspace & { invested: number; members: number }

export default function Workspaces() {
  const { session } = useAuth()
  const [rows, setRows] = useState<Row[] | null>(null)

  useEffect(() => {
    // RLS limits `workspaces` to ones the user is a member of.
    ;(async () => {
      const { data: ws } = await supabase.from('workspaces').select('*')
        .order('created_at', { ascending: false })
      const ids = (ws ?? []).map((w) => w.id)
      const [{ data: totals }, { data: members }] = await Promise.all([
        supabase.from('workspace_totals').select('workspace_id, invested').in('workspace_id', ids),
        supabase.from('members').select('workspace_id').in('workspace_id', ids),
      ])
      const inv = new Map((totals ?? []).map((t: any) => [t.workspace_id, Number(t.invested)]))
      const cnt = new Map<string, number>()
      for (const m of members ?? []) cnt.set(m.workspace_id, (cnt.get(m.workspace_id) ?? 0) + 1)
      setRows((ws ?? []).map((w) => ({
        ...w, invested: inv.get(w.id) ?? 0, members: cnt.get(w.id) ?? 1,
      })))
    })()
  }, [])

  return (
    <div className="mx-auto max-w-2xl px-8 py-10">
      <header className="mb-8 flex items-center justify-between">
        <Link to="/" className="text-[15px] font-semibold lowercase tracking-tight">
          rhoad<span className="text-umber">.</span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted">{session?.user.email}</span>
          <button onClick={() => supabase.auth.signOut()}
            className="text-muted hover:text-ink">Sign out</button>
        </div>
      </header>

      <div className="mb-4 flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Workspaces</h1>
        </div>
        <Link to="/new"><Button size="sm">New workspace</Button></Link>
      </div>

      <Card>
        {rows === null ? (
          <p className="px-4 py-6 text-sm text-muted">Loading…</p>
        ) : rows.length === 0 ? (
          <Empty icon={<I.home />} title="No workspaces"
          />
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((w) => (
              <li key={w.id}>
                <Link to={`/w/${w.share_slug}`}
                  className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-hover/30">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-sunken
                    text-sm font-semibold text-umber">
                    {w.name.trim().charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{w.name}</span>
                    <span className="block truncate text-xs text-muted">
                      {w.pitch?.trim() || 'No description'}
                    </span>
                  </span>
                  <span className="text-right text-xs text-muted tabular-nums">
                    <span className="block text-sm text-ink">{money(w.invested)}</span>
                    {w.members} {w.members === 1 ? 'member' : 'members'}
                  </span>
                  <span className="text-faint"><I.next /></span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
