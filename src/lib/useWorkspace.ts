import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import type { Entry, Member, Post, Workspace } from './types'

export type WorkspaceData = {
  workspace: Workspace | null
  members: Member[]
  entries: Entry[]
  posts: Post[]
  invested: number
  queued: number
  perMember: Record<string, number>
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  setPitchLocal: (pitch: string) => void
}

export function useWorkspace(slug: string | undefined): WorkspaceData {
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [entries, setEntries] = useState<Entry[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [invested, setInvested] = useState(0)
  const [queued, setQueued] = useState(0)
  const [perMember, setPerMember] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!slug) return
    const { data: ws, error: wsErr } = await supabase
      .from('workspaces')
      .select('*')
      .eq('share_slug', slug)
      .maybeSingle()

    if (wsErr) {
      setError(wsErr.message)
      setLoading(false)
      return
    }
    // RLS hides workspaces you aren't a member of, so "not found" and
    // "not yours" are the same case here — both mean: you need an invite.
    if (!ws) {
      setError('not-a-member')
      setLoading(false)
      return
    }
    setWorkspace(ws)

    const [m, e, p, t, mt] = await Promise.all([
      supabase.from('members').select('*, profiles(name)').eq('workspace_id', ws.id)
        .order('created_at'),
      supabase.from('entries').select('*').eq('workspace_id', ws.id)
        .order('created_at', { ascending: false }),
      supabase.from('posts').select('*').eq('workspace_id', ws.id)
        .order('created_at', { ascending: false }),
      supabase.from('workspace_totals').select('*').eq('workspace_id', ws.id).maybeSingle(),
      supabase.from('member_totals').select('*').eq('workspace_id', ws.id),
    ])

    setMembers(
      (m.data ?? []).map((row: any) => ({
        ...row,
        name: row.profiles?.name ?? null,
      })),
    )
    setEntries(e.data ?? [])
    setPosts(p.data ?? [])
    setInvested(Number(t.data?.invested ?? 0))
    setQueued(Number(t.data?.queued ?? 0))
    setPerMember(
      Object.fromEntries(
        (mt.data ?? []).map((r: any) => [r.member_id, Number(r.invested)]),
      ),
    )
    setError(null)
    setLoading(false)
  }, [slug])

  useEffect(() => {
    setLoading(true)
    refresh()
  }, [refresh])

  const setPitchLocal = useCallback(
    (pitch: string) => setWorkspace((w) => (w ? { ...w, pitch } : w)),
    [],
  )

  return {
    workspace, members, entries, posts,
    invested, queued, perMember,
    loading, error, refresh, setPitchLocal,
  }
}
