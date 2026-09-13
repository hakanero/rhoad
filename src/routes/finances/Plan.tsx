import { useEffect, useRef, useState } from 'react'
import { useWs } from '../../lib/ctx'
import { supabase } from '../../lib/supabase'
import { Card, CardHeader, Empty, Figures, Input, Label, money } from '../../components/ui'
import { I } from '../../components/icons'
import { projectMonths } from '../../lib/finance'

// Budget and projection in one place: what's set aside, what's
// committed each month, and how long the one covers the other.
export default function Plan() {
  const ws = useWs()
  const w = ws.workspace!
  const [value, setValue] = useState(w.budget == null ? '' : String(w.budget))
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const first = useRef(true)

  useEffect(() => {
    if (first.current) { first.current = false; return }
    setStatus('saving')
    const t = setTimeout(async () => {
      const n = value.trim() === '' ? null : Number(value)
      await supabase.from('workspaces').update({ budget: n }).eq('id', w.id)
      ws.patchWorkspace({ budget: n })
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 1500)
    }, 600)
    return () => clearTimeout(t)
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  const budget = w.budget == null ? null : Number(w.budget)
  const spent = ws.invested
  const remaining = budget == null ? null : budget - spent
  const pctUsed = budget && budget > 0 ? Math.min(spent / budget, 1) : 0

  const months = projectMonths(ws.entries, 12)
  const upcoming = ws.entries.filter((e) => e.is_upcoming && e.upcoming_amount != null)
  const max = Math.max(...months.map((m) => m.committed), 1)
  const monthly = months[0].committed

  // Walk remaining budget forward against committed spend.
  let exhausted: string | null = null
  const after: number[] = []
  if (remaining != null) {
    let left = remaining
    for (const m of months) {
      left -= m.committed
      after.push(left)
      if (left < 0 && !exhausted) exhausted = m.label
    }
  }
  const runway = remaining != null && monthly > 0 ? remaining / monthly : null

  const stepUps = months
    .map((m, i) => ({ m, added: i === 0 ? 0 : m.committed - months[i - 1].committed }))
    .filter((x) => x.added > 0)

  return (
    <>
      <Figures items={[
        { label: 'Budget', value: budget == null ? '—' : money(budget) },
        { label: 'Spent', value: money(spent), accent: true },
        { label: 'Remaining', value: remaining == null ? '—' : money(remaining) },
        { label: 'Committed / month', value: money(monthly) },
        { label: 'Runway', value: runway == null ? '—' : `${runway.toFixed(1)} mo${exhausted ? ` · to ${exhausted}` : ''}` },
      ]} />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          <Card>
            <CardHeader title="Budget" sub="Set aside by the founders; shared across the workspace" />
            <div className="p-4">
              <div className="flex items-end gap-3">
                <div className="w-44">
                  <Label>Amount</Label>
                  <Input type="number" step="1" min="0" placeholder="0"
                    value={value} onChange={(e) => setValue(e.target.value)} />
                </div>
                <span className="pb-2 text-[11px] text-faint">
                  {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : ''}
                </span>
              </div>
              {budget != null && (
                <>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-sunken">
                    <div className={`h-full rounded-full ${pctUsed >= 1 ? 'bg-berry' : 'bg-umber'}`}
                      style={{ width: `${pctUsed * 100}%` }} />
                  </div>
                  <div className="mt-1.5 flex justify-between text-xs text-muted tabular-nums">
                    <span>{money(spent)} spent · {Math.round(pctUsed * 100)}%</span>
                    <span>{money(budget)}</span>
                  </div>
                </>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Committed spend" sub="Next 12 months, from upcoming costs and their start dates" />
            {upcoming.length === 0 ? (
              <Empty icon={<I.clock />} title="No upcoming costs"
                sub="Mark an expense as an upcoming cost to project it here." />
            ) : (
              <div className="px-4 pt-6 pb-4">
                <div className="flex h-32 items-end gap-2">
                  {months.map((m) => (
                    <div key={m.key} className="group relative flex h-full flex-1 flex-col justify-end">
                      <div className="rounded-sm bg-umber transition-opacity group-hover:opacity-80"
                        style={{ height: `${Math.max((m.committed / max) * 100, 2)}%` }} />
                      <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-ink
                        px-1.5 py-0.5 text-[10px] whitespace-nowrap text-cream opacity-0 group-hover:opacity-100">
                        {money(m.committed)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  {months.map((m) => (
                    <span key={m.key} className="flex-1 text-center text-[10px] text-faint">{m.label.split(' ')[0]}</span>
                  ))}
                </div>
                <div className="overflow-x-auto">
                <table className="mt-5 w-full min-w-[420px] text-[13px]">
                  <thead>
                    <tr className="border-b border-line text-left text-[11px] font-medium tracking-wide text-faint uppercase">
                      <th className="py-2 font-medium">Month</th>
                      <th className="py-2 text-right font-medium">Committed</th>
                      {remaining != null && <th className="py-2 text-right font-medium">Budget after</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {months.map((m, i) => (
                      <tr key={m.key}>
                        <td className="py-2">{m.label}</td>
                        <td className="py-2 text-right tabular-nums">{money(m.committed)}</td>
                        {remaining != null && (
                          <td className={`py-2 text-right tabular-nums ${after[i] < 0 ? 'text-berry' : 'text-muted'}`}>
                            {money(after[i])}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Step-ups" sub="When committed spend increases" />
            {stepUps.length === 0 ? (
              <p className="px-4 py-3 text-xs text-faint">
                {upcoming.length === 0 ? 'No upcoming costs.' : 'No increases in the next 12 months.'}
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {stepUps.map(({ m, added }) => (
                  <li key={m.key} className="flex items-baseline justify-between px-4 py-2.5 text-[13px]">
                    <span>{m.label}</span>
                    <span className="tabular-nums text-umber">+{money(added)}/mo</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <CardHeader title="Upcoming costs" sub={`${upcoming.length} tracked`} />
            {upcoming.length === 0 ? (
              <p className="px-4 py-3 text-xs text-faint">None tracked.</p>
            ) : (
              <ul className="divide-y divide-line">
                {upcoming.map((e) => (
                  <li key={e.id} className="px-4 py-2.5 text-[13px]">
                    <div className="flex items-baseline justify-between">
                      <span className="truncate">{e.text}</span>
                      <span className="ml-3 tabular-nums">{money(Number(e.upcoming_amount))}/mo</span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-faint">
                      {e.upcoming_from ? `From ${e.upcoming_from}` : 'Start date not set'}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  )
}
