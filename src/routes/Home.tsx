import { useWs } from '../lib/ctx'
import Composer from '../components/Composer'
import { Dot, money } from '../components/ui'
import type { Entry, Member, Post } from '../lib/types'

type FeedItem =
  | ({ kind: 'entry' } & Entry)
  | ({ kind: 'post' } & Post)

export default function Home() {
  const ws = useWs()
  const byId = new Map(ws.members.map((m) => [m.id, m]))

  const feed: FeedItem[] = [
    ...ws.entries.map((e) => ({ kind: 'entry' as const, ...e })),
    ...ws.posts.map((p) => ({ kind: 'post' as const, ...p })),
  ].sort((a, b) => b.created_at.localeCompare(a.created_at))

  return (
    <>
      <Totals />
      <Composer workspaceId={ws.workspace!.id} me={ws.me} onDone={ws.refresh} />

      {feed.length === 0 && (
        <p className="text-sm text-muted">Nothing logged yet.</p>
      )}

      <ul className="space-y-5">
        {feed.map((item) => (
          <li key={item.id} className="border-b border-line pb-5 last:border-0">
            <Byline member={byId.get(item.member_id)} at={item.created_at} />
            {item.kind === 'entry' ? <EntryBody e={item} /> : <PostBody p={item} />}
          </li>
        ))}
      </ul>
    </>
  )
}

function Totals() {
  const ws = useWs()
  return (
    <section className="mb-8">
      <p className="text-sm">
        <span className="text-muted">In so far</span>{' '}
        <span className="text-umber">{money(ws.invested)}</span>
      </p>
      {ws.queued > 0 && (
        <p className="mt-1 text-xs text-muted">
          {money(ws.queued)} queued once free tiers convert
        </p>
      )}
      {ws.members.length > 1 && (
        <ul className="mt-3 flex flex-wrap gap-4">
          {ws.members.map((m) => (
            <li key={m.id} className="flex items-center gap-2 text-xs text-muted">
              <Dot color={m.color} />
              {m.name ?? 'someone'} · {money(ws.perMember[m.id] ?? 0)}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Byline({ member, at }: { member?: Member; at: string }) {
  return (
    <div className="mb-1.5 flex items-center gap-2 text-xs text-muted">
      <Dot color={member?.color ?? 'dusk'} />
      <span>{member?.name ?? 'someone'}</span>
      <span>·</span>
      <time>{new Date(at).toLocaleDateString()}</time>
    </div>
  )
}

function EntryBody({ e }: { e: Entry }) {
  return (
    <>
      <p className="text-sm whitespace-pre-wrap">{e.text}</p>
      {(e.is_expense || e.is_free_tier) && (
        <p className="mt-1.5 text-xs text-muted">
          {e.is_expense && e.amount != null && (
            <span className="text-umber">{money(Number(e.amount))}</span>
          )}
          {e.is_expense && e.is_free_tier && ' · '}
          {e.is_free_tier && (
            <span>
              free now, {e.expected_cost != null && money(Number(e.expected_cost))}
              {e.converts_at && ` from ${e.converts_at}`}
            </span>
          )}
        </p>
      )}
      {e.receipt_url && (
        <a href={e.receipt_url} target="_blank" rel="noreferrer">
          <img src={e.receipt_url} alt="receipt"
            className="mt-2 max-h-40 rounded border border-line" />
        </a>
      )}
    </>
  )
}

function PostBody({ p }: { p: Post }) {
  return (
    <>
      <p className="text-xs uppercase tracking-wide text-muted">posted on {p.platform}</p>
      <p className="mt-1 text-sm whitespace-pre-wrap">{p.caption}</p>
      {p.pitch_snapshot && (
        <p className="mt-2 border-l-2 border-line pl-3 text-xs text-muted">
          {p.pitch_snapshot}
        </p>
      )}
    </>
  )
}
