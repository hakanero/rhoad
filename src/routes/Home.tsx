import { Link } from 'react-router-dom'
import { useWs } from '../lib/ctx'
import Composer from '../components/Composer'
import Replies from '../components/Replies'
import {
  Avatar, Badge, Card, CardHeader, Empty, PageHeader, money, relDate,
} from '../components/ui'
import { I } from '../components/icons'
import type { Entry, Member } from '../lib/types'

const COLOR_BG: Record<string, string> = {
  dusk: 'bg-dusk', slate: 'bg-slate', plum: 'bg-plum', berry: 'bg-berry',
}

export default function Home() {
  const ws = useWs()
  const byId = new Map(ws.members.map((m) => [m.id, m]))
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  return (
    <>
      <PageHeader title="Home" sub={today} />
      <Stats />

      <div className="grid grid-cols-[minmax(0,1fr)_300px] gap-5">
        <div>
          <Composer workspaceId={ws.workspace!.id} me={ws.me} onDone={ws.refresh} />

          <Card>
            <CardHeader
              title="Activity"
              sub={`${ws.entries.length} ${ws.entries.length === 1 ? 'entry' : 'entries'}`}
            />
            {ws.entries.length === 0 ? (
              <Empty
                icon={<I.clock />}
                title="No activity yet"
                sub="Entries you log appear here, newest first."
              />
            ) : (
              <div className="divide-y divide-line">
                {ws.entries.map((e) => (
                  <EntryRow key={e.id} e={e} byId={byId} />
                ))}
              </div>
            )}
          </Card>
        </div>

        <aside className="space-y-5">
          <SpendChart />
          <Contributions />
          <PitchCard />
          <RecentContent />
        </aside>
      </div>
    </>
  )
}

/* ---------- top row ---------- */

function Stats() {
  const ws = useWs()
  const expenses = ws.entries.filter((e) => e.is_expense)
  const freeTiers = ws.entries.filter((e) => e.is_free_tier)
  const last = expenses[0]

  const tiles = [
    {
      label: 'Total invested', value: money(ws.invested), accent: true,
      sub: last ? `Last expense ${relDate(last.created_at).toLowerCase()}` : 'Nothing logged',
    },
    {
      label: 'Upcoming', value: money(ws.queued),
      sub: `${freeTiers.length} expected ${freeTiers.length === 1 ? 'cost' : 'costs'}`,
    },
    {
      label: 'Expenses', value: String(expenses.length),
      sub: `${expenses.filter((e) => e.receipt_url).length} with receipts`,
    },
    {
      label: 'People', value: String(ws.members.length),
      sub: ws.members.length === 1 ? 'Just you' : 'Contributing',
    },
  ]

  return (
    <div className="mb-5 grid grid-cols-4 gap-4">
      {tiles.map((t) => (
        <Card key={t.label} className="px-4 py-3.5">
          <p className="text-xs text-muted">{t.label}</p>
          <p className={`mt-1.5 text-[22px] font-semibold tracking-tight tabular-nums ${
            t.accent ? 'text-umber' : ''}`}>
            {t.value}
          </p>
          <p className="mt-1 text-xs text-faint">{t.sub}</p>
        </Card>
      ))}
    </div>
  )
}

/* ---------- right rail ---------- */

function SpendChart() {
  const ws = useWs()
  // Last 8 weeks of expense totals, oldest → newest.
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const end = new Date(); end.setHours(0, 0, 0, 0)
    end.setDate(end.getDate() - (7 - i) * 7 + 7)
    const start = new Date(end); start.setDate(start.getDate() - 7)
    const sum = ws.entries
      .filter((e) => e.is_expense && e.amount != null)
      .filter((e) => { const d = new Date(e.created_at); return d >= start && d < end })
      .reduce((a, e) => a + Number(e.amount), 0)
    return { sum, label: start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) }
  })
  const max = Math.max(...weeks.map((w) => w.sum), 1)

  return (
    <Card>
      <CardHeader title="Spend" sub="Last 8 weeks" />
      <div className="px-4 pt-4 pb-3">
        <div className="flex h-20 items-end gap-1.5">
          {weeks.map((w, i) => (
            <div key={i} className="group relative flex h-full flex-1 flex-col justify-end">
              <div
                className={`rounded-sm ${w.sum > 0 ? 'bg-umber' : 'bg-sunken'}`}
                style={{ height: `${Math.max((w.sum / max) * 100, 6)}%` }}
              />
              <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2
                rounded bg-ink px-1.5 py-0.5 text-[10px] whitespace-nowrap text-cream
                opacity-0 transition-opacity group-hover:opacity-100">
                {money(w.sum)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-faint">
          <span>{weeks[0].label}</span>
          <span>{weeks[7].label}</span>
        </div>
      </div>
    </Card>
  )
}

function Contributions() {
  const ws = useWs()
  const max = Math.max(...Object.values(ws.perMember), 1)
  return (
    <Card>
      <CardHeader title="Contributions" sub="Per person" />
      <ul className="divide-y divide-line">
        {ws.members.map((m) => {
          const v = ws.perMember[m.id] ?? 0
          return (
            <li key={m.id} className="px-4 py-2.5">
              <div className="flex items-center gap-2">
                <Avatar color={m.color} name={m.name} />
                <span className="flex-1 truncate text-[13px]">{m.name ?? 'Unnamed'}</span>
                <span className="text-[13px] tabular-nums">{money(v)}</span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-sunken">
                <div
                  className={`h-full rounded-full ${COLOR_BG[m.color] ?? 'bg-dusk'}`}
                  style={{ width: `${(v / max) * 100}%` }}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

function PitchCard() {
  const ws = useWs()
  const pitch = (ws.workspace!.pitch ?? '').trim()
  return (
    <Card>
      <CardHeader
        title="Pitch"
        action={
          <Link to={`/w/${ws.workspace!.share_slug}/pitch`}
            className="text-xs text-muted hover:text-ink">
            Edit
          </Link>
        }
      />
      <div className="px-4 py-3">
        {pitch ? (
          <p className="line-clamp-4 text-[13px] leading-relaxed text-ink/80">{pitch}</p>
        ) : (
          <p className="text-xs text-faint">Not written yet.</p>
        )}
      </div>
    </Card>
  )
}

function RecentContent() {
  const ws = useWs()
  const recent = ws.posts.slice(0, 3)
  const P: Record<string, string> = { linkedin: 'LinkedIn', x: 'X', other: 'Other' }
  return (
    <Card>
      <CardHeader
        title="Content"
        sub={`${ws.posts.length} published`}
        action={
          <Link to={`/w/${ws.workspace!.share_slug}/content`}
            className="text-xs text-muted hover:text-ink">
            View all
          </Link>
        }
      />
      {recent.length === 0 ? (
        <p className="px-4 py-3 text-xs text-faint">Nothing published yet.</p>
      ) : (
        <ul className="divide-y divide-line">
          {recent.map((p) => (
            <li key={p.id} className="px-4 py-2.5">
              <div className="flex items-center gap-2">
                <Badge>{P[p.platform]}</Badge>
                <span className="text-[11px] text-faint">{relDate(p.created_at)}</span>
              </div>
              <p className="mt-1 truncate text-[13px]">{p.caption}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

/* ---------- feed row ---------- */

function EntryRow({ e, byId }: { e: Entry; byId: Map<string, Member> }) {
  const ws = useWs()
  const m = byId.get(e.member_id)
  const replies = ws.replies.filter((r) => r.entry_id === e.id)

  return (
    <article className="px-4 py-3.5 transition-colors hover:bg-hover/30">
      <div className="flex gap-3">
        <Avatar color={m?.color ?? 'dusk'} name={m?.name ?? null} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium">{m?.name ?? 'Unnamed'}</span>
            <span className="text-faint">{relDate(e.created_at)}</span>
            {e.is_expense && (
              <span className="ml-auto rounded-md bg-umber/8 px-1.5 py-0.5 text-[12px]
                font-medium tabular-nums text-umber">
                {money(Number(e.amount ?? 0))}
              </span>
            )}
          </div>

          <p className="mt-1 text-[13px] leading-relaxed whitespace-pre-wrap">{e.text}</p>

          {(e.is_free_tier || e.receipt_url) && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {e.is_free_tier && (
                <Badge>
                  Upcoming{e.expected_cost != null && ` · ${money(Number(e.expected_cost))}`}
                  {e.converts_at && ` from ${e.converts_at}`}
                </Badge>
              )}
              {e.receipt_url && (
                <a href={e.receipt_url} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-md bg-sunken px-1.5 py-0.5
                    text-[11px] font-medium text-muted hover:text-ink">
                  <I.receipt /> Receipt
                </a>
              )}
            </div>
          )}

          <Replies
            workspaceId={ws.workspace!.id}
            target={{ entry_id: e.id }}
            replies={replies}
            members={byId}
            me={ws.me}
            onDone={ws.refresh}
          />
        </div>
      </div>
    </article>
  )
}
