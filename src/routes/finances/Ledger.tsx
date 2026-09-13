import { useState } from 'react'
import { useWs } from '../../lib/ctx'
import { supabase } from '../../lib/supabase'
import ExpenseComposer from '../../components/ExpenseComposer'
import {
  Avatar, Badge, Button, Card, CardHeader, Empty, money,
} from '../../components/ui'
import { I } from '../../components/icons'
import { CATEGORIES, CATEGORY_LABEL, type Category } from '../../lib/types'
import { ledgerCsv, download, sum } from '../../lib/finance'

export default function Ledger() {
  const ws = useWs()
  const byId = new Map(ws.members.map((m) => [m.id, m]))
  const [filter, setFilter] = useState<Category | 'all'>('all')

  const all = ws.entries.filter((e) => !e.is_income && (e.is_expense || e.is_free_tier))
  const upcoming = all.filter((e) => e.is_free_tier)
  const rows = filter === 'all' ? all : all.filter((e) => e.category === filter)
  const paid = all.filter((e) => e.is_expense)

  const byCategory = CATEGORIES
    .map((c) => ({ c, total: sum(paid.filter((e) => e.category === c).map((e) => Number(e.amount))) }))
    .filter((x) => x.total > 0)
    .sort((a, b) => b.total - a.total)

  async function toggleReimbursed(id: string, current: string | null) {
    await supabase.from('entries')
      .update({ reimbursed_at: current ? null : new Date().toISOString() })
      .eq('id', id)
    ws.refresh()
  }

  return (
    <>
      <div className="mb-5 grid grid-cols-3 gap-4">
        <Card className="px-4 py-3.5">
          <p className="text-xs text-muted">Total paid</p>
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
            {upcoming.length} expected {upcoming.length === 1 ? 'cost' : 'costs'} per month
          </p>
        </Card>
        <Card className="px-4 py-3.5">
          <p className="text-xs text-muted">By category</p>
          {byCategory.length === 0 ? (
            <p className="mt-2 text-xs text-faint">No expenses yet.</p>
          ) : (
            <ul className="mt-2 space-y-1">
              {byCategory.slice(0, 4).map(({ c, total }) => (
                <li key={c} className="flex items-center justify-between text-xs">
                  <span className="text-muted">{CATEGORY_LABEL[c]}</span>
                  <span className="tabular-nums">{money(total)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <ExpenseComposer workspaceId={ws.workspace!.id} me={ws.me} onDone={ws.refresh} />

      <Card>
        <CardHeader
          title="Ledger"
          sub={`${rows.length} ${rows.length === 1 ? 'item' : 'items'}`}
          action={
            <div className="flex items-center gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as Category | 'all')}
                className="rounded-md border border-line bg-surface px-2 py-1 text-xs outline-none"
              >
                <option value="all">All categories</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
              </select>
              <Button size="sm" variant="quiet"
                onClick={() => download(
                  `${ws.workspace!.name.replace(/\s+/g, '-').toLowerCase()}-ledger.csv`,
                  ledgerCsv(all, byId),
                )}>
                Export CSV
              </Button>
            </div>
          }
        />
        {rows.length === 0 ? (
          <Empty icon={<I.receipt />} title="No expenses"
            sub="Payments and expected costs appear here." />
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-[11px] font-medium
                tracking-wide text-faint uppercase">
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="py-2 font-medium">Description</th>
                <th className="py-2 font-medium">Paid by</th>
                <th className="py-2 text-right font-medium">Paid</th>
                <th className="py-2 text-right font-medium">Upcoming</th>
                <th className="py-2 pr-4 text-right font-medium">Status</th>
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
                        <Badge>{CATEGORY_LABEL[e.category] ?? 'Other'}</Badge>
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
                    <td className="py-2.5 text-right tabular-nums">
                      {e.is_free_tier ? (
                        <span className="inline-flex flex-col items-end">
                          <span>{e.expected_cost != null ? money(Number(e.expected_cost)) : '—'}</span>
                          {e.converts_at && (
                            <span className="text-[11px] text-faint">from {e.converts_at}</span>
                          )}
                        </span>
                      ) : <span className="text-faint">—</span>}
                    </td>
                    <td className="py-2.5 pr-4 text-right">
                      {e.is_expense ? (
                        <button
                          onClick={() => toggleReimbursed(e.id, e.reimbursed_at)}
                          title={e.reimbursed_at ? 'Mark as outstanding' : 'Mark as reimbursed'}
                          className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
                            e.reimbursed_at
                              ? 'bg-sunken text-muted hover:text-ink'
                              : 'bg-umber/8 text-umber hover:bg-umber/15'
                          }`}
                        >
                          {e.reimbursed_at ? 'Reimbursed' : 'Outstanding'}
                        </button>
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
