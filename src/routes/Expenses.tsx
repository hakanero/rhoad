import { useWs } from '../lib/ctx'
import ExpenseComposer from '../components/ExpenseComposer'
import {
  Avatar, Card, CardHeader, Empty, PageHeader, money,
} from '../components/ui'
import { I } from '../components/icons'

const COLOR_BG: Record<string, string> = {
  dusk: 'bg-dusk', slate: 'bg-slate', plum: 'bg-plum', berry: 'bg-berry',
}

export default function Expenses() {
  const ws = useWs()
  const byId = new Map(ws.members.map((m) => [m.id, m]))
  const rows = ws.entries.filter((e) => e.is_expense || e.is_free_tier)
  const paid = rows.filter((e) => e.is_expense)
  const upcoming = rows.filter((e) => e.is_free_tier)

  return (
    <>
      <PageHeader
        title="Expenses"
        sub="Money put in so far, and what's expected to follow."
      />

      <div className="mb-5 grid grid-cols-3 gap-4">
        <Card className="px-4 py-3.5">
          <p className="text-xs text-muted">Total invested</p>
          <p className="mt-1.5 text-[22px] font-semibold tracking-tight tabular-nums text-umber">
            {money(ws.invested)}
          </p>
          <p className="mt-1 text-xs text-faint">
            {paid.length} {paid.length === 1 ? 'expense' : 'expenses'} ·{' '}
            {paid.filter((e) => e.receipt_url).length} with receipts
          </p>
        </Card>
        <Card className="px-4 py-3.5">
          <p className="text-xs text-muted">Upcoming</p>
          <p className="mt-1.5 text-[22px] font-semibold tracking-tight tabular-nums">
            {money(ws.queued)}
          </p>
          <p className="mt-1 text-xs text-faint">
            {upcoming.length} expected {upcoming.length === 1 ? 'cost' : 'costs'}
          </p>
        </Card>
        <Card className="px-4 py-3.5">
          <p className="text-xs text-muted">By person</p>
          <ul className="mt-2 space-y-1.5">
            {ws.members.map((m) => {
              const v = ws.perMember[m.id] ?? 0
              const pct = ws.invested > 0 ? (v / ws.invested) * 100 : 0
              return (
                <li key={m.id}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className={`size-1.5 rounded-sm ${COLOR_BG[m.color]}`} />
                      {m.name ?? 'Unnamed'}
                    </span>
                    <span className="tabular-nums">{money(v)}</span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-sunken">
                    <div className={`h-full ${COLOR_BG[m.color]}`} style={{ width: `${pct}%` }} />
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>

      <ExpenseComposer workspaceId={ws.workspace!.id} me={ws.me} onDone={ws.refresh} />

      <Card>
        <CardHeader title="Ledger" sub={`${rows.length} ${rows.length === 1 ? 'item' : 'items'}`} />
        {rows.length === 0 ? (
          <Empty icon={<I.receipt />} title="No expenses yet"
            sub="Anything paid for or expected to cost money appears here." />
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-[11px] font-medium
                tracking-wide text-faint uppercase">
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="py-2 font-medium">Description</th>
                <th className="py-2 font-medium">Person</th>
                <th className="py-2 text-right font-medium">Paid</th>
                <th className="py-2 pr-4 text-right font-medium">Upcoming</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((e) => {
                const m = byId.get(e.member_id)
                return (
                  <tr key={e.id} className="transition-colors hover:bg-hover/30">
                    <td className="px-4 py-2.5 whitespace-nowrap text-muted tabular-nums">
                      {new Date(e.created_at).toLocaleDateString(undefined,
                        { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{e.text}</span>
                        {e.receipt_url && (
                          <a href={e.receipt_url} target="_blank" rel="noreferrer"
                            title="Receipt" className="text-faint hover:text-ink">
                            <I.receipt />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="flex items-center gap-1.5 whitespace-nowrap">
                        <Avatar color={m?.color ?? 'dusk'} name={m?.name ?? null} />
                        <span className="text-muted">{m?.name ?? 'Unnamed'}</span>
                      </span>
                    </td>
                    <td className="py-2.5 text-right tabular-nums">
                      {e.is_expense && e.amount != null
                        ? <span className="font-medium text-umber">{money(Number(e.amount))}</span>
                        : <span className="text-faint">—</span>}
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums">
                      {e.is_free_tier ? (
                        <span className="inline-flex flex-col items-end">
                          <span>{e.expected_cost != null ? money(Number(e.expected_cost)) : '—'}</span>
                          {e.converts_at && (
                            <span className="text-[11px] text-faint">from {e.converts_at}</span>
                          )}
                        </span>
                      ) : <span className="text-faint">—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Card>
    </>
  )
}
