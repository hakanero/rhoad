import { useEffect, useRef, useState } from 'react'
import { useWs } from '../../lib/ctx'
import { supabase } from '../../lib/supabase'
import { Card, CardHeader, Input, Label, money } from '../../components/ui'
import { projectMonths } from '../../lib/finance'

export default function Budget() {
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
  }, [value])

  const budget = w.budget == null ? null : Number(w.budget)
  const spent = ws.invested
  const remaining = budget == null ? null : budget - spent
  const pctUsed = budget && budget > 0 ? Math.min(spent / budget, 1) : 0

  // Runway: how long the remaining budget covers committed monthly spend.
  const months = projectMonths(ws.entries, 24)
  let runwayMonths: number | null = null
  let exhaustedIn: string | null = null
  if (remaining != null) {
    let left = remaining
    let i = 0
    for (; i < months.length; i++) {
      if (months[i].committed <= 0) continue
      left -= months[i].committed
      if (left < 0) { exhaustedIn = months[i].label; break }
    }
    const monthly = months[0].committed
    runwayMonths = monthly > 0 ? remaining / monthly : null
  }

  return (
    <>
      <div className="mb-5 grid grid-cols-4 gap-4">
        <Card className="px-4 py-3.5">
          <p className="text-xs text-muted">Budget</p>
          <p className="mt-1.5 text-[22px] font-semibold tracking-tight tabular-nums">
            {budget == null ? '—' : money(budget)}
          </p>
          <p className="mt-1 text-xs text-faint">Set by the founders</p>
        </Card>
        <Card className="px-4 py-3.5">
          <p className="text-xs text-muted">Spent</p>
          <p className="mt-1.5 text-[22px] font-semibold tracking-tight tabular-nums text-umber">
            {money(spent)}
          </p>
          <p className="mt-1 text-xs text-faint">
            {budget ? `${Math.round(pctUsed * 100)}% of budget` : 'All expenses to date'}
          </p>
        </Card>
        <Card className="px-4 py-3.5">
          <p className="text-xs text-muted">Remaining</p>
          <p className={`mt-1.5 text-[22px] font-semibold tracking-tight tabular-nums ${
            remaining != null && remaining < 0 ? 'text-berry' : ''}`}>
            {remaining == null ? '—' : money(remaining)}
          </p>
          <p className="mt-1 text-xs text-faint">
            {remaining != null && remaining < 0 ? 'Over budget' : 'Budget less spent'}
          </p>
        </Card>
        <Card className="px-4 py-3.5">
          <p className="text-xs text-muted">Runway</p>
          <p className="mt-1.5 text-[22px] font-semibold tracking-tight tabular-nums">
            {runwayMonths == null ? '—' : `${runwayMonths.toFixed(1)} mo`}
          </p>
          <p className="mt-1 text-xs text-faint">
            {remaining == null ? 'Set a budget'
              : months[0].committed <= 0 ? 'No monthly costs committed'
              : exhaustedIn ? `Exhausted ${exhaustedIn}` : 'Beyond 24 months'}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-5">
        <Card>
          <CardHeader title="Budget use" sub="Spent against the amount set aside" />
          <div className="px-4 py-4">
            {budget == null ? (
              <p className="text-sm text-muted">Set a budget to track use and runway.</p>
            ) : (
              <>
                <div className="h-2.5 overflow-hidden rounded-full bg-sunken">
                  <div className={`h-full rounded-full ${pctUsed >= 1 ? 'bg-berry' : 'bg-umber'}`}
                    style={{ width: `${pctUsed * 100}%` }} />
                </div>
                <div className="mt-2 flex justify-between text-xs text-muted tabular-nums">
                  <span>{money(spent)} spent</span>
                  <span>{money(budget)}</span>
                </div>
              </>
            )}

            {budget != null && months[0].committed > 0 && (
              <table className="mt-6 w-full text-[13px]">
                <thead>
                  <tr className="border-b border-line text-left text-[11px] font-medium
                    tracking-wide text-faint uppercase">
                    <th className="py-2 font-medium">Month</th>
                    <th className="py-2 text-right font-medium">Committed</th>
                    <th className="py-2 text-right font-medium">Remaining after</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {(() => {
                    let left = remaining!
                    return months.slice(0, 12).map((m) => {
                      left -= m.committed
                      return (
                        <tr key={m.key}>
                          <td className="py-2">{m.label}</td>
                          <td className="py-2 text-right tabular-nums">{money(m.committed)}</td>
                          <td className={`py-2 text-right tabular-nums ${left < 0 ? 'text-berry' : 'text-muted'}`}>
                            {money(left)}
                          </td>
                        </tr>
                      )
                    })
                  })()}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        <Card className="self-start p-4">
          <div className="flex items-baseline justify-between">
            <Label>Budget</Label>
            <span className="text-[11px] text-faint">
              {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : ''}
            </span>
          </div>
          <Input type="number" step="1" min="0" placeholder="0"
            value={value} onChange={(e) => setValue(e.target.value)} />
          <p className="mt-2 text-xs leading-relaxed text-muted">
            The total the founders have set aside to spend before deciding what comes next.
            Shared across the workspace.
          </p>
        </Card>
      </div>
    </>
  )
}
