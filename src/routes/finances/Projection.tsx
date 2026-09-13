import { useWs } from '../../lib/ctx'
import { Card, CardHeader, Empty, money } from '../../components/ui'
import { I } from '../../components/icons'
import { projectMonths, sum } from '../../lib/finance'

export default function Projection() {
  const ws = useWs()
  const months = projectMonths(ws.entries)
  const upcoming = ws.entries.filter((e) => e.is_free_tier && e.expected_cost != null)
  const max = Math.max(...months.map((m) => m.committed), 1)
  const sixMonth = sum(months.map((m) => m.committed))
  const now = months[0].committed
  const end = months[months.length - 1].committed
  const cumulative = months.reduce<number[]>((acc, m) => {
    acc.push((acc[acc.length - 1] ?? 0) + m.committed); return acc
  }, [])

  // Months where a new cost starts.
  const stepUps = months
    .map((m, i) => ({ m, added: i === 0 ? 0 : m.committed - months[i - 1].committed }))
    .filter((x) => x.added > 0)

  return (
    <>
      <div className="mb-5 grid grid-cols-3 gap-4">
        <Card className="px-4 py-3.5">
          <p className="text-xs text-muted">Committed this month</p>
          <p className="mt-1.5 text-[22px] font-semibold tracking-tight tabular-nums text-umber">
            {money(now)}
          </p>
          <p className="mt-1 text-xs text-faint">{months[0].items.length} active costs</p>
        </Card>
        <Card className="px-4 py-3.5">
          <p className="text-xs text-muted">Monthly in {months[5].label}</p>
          <p className="mt-1.5 text-[22px] font-semibold tracking-tight tabular-nums">
            {money(end)}
          </p>
          <p className="mt-1 text-xs text-faint">
            {end > now ? `+${money(end - now)} from today` : 'No change from today'}
          </p>
        </Card>
        <Card className="px-4 py-3.5">
          <p className="text-xs text-muted">Next six months</p>
          <p className="mt-1.5 text-[22px] font-semibold tracking-tight tabular-nums">
            {money(sixMonth)}
          </p>
          <p className="mt-1 text-xs text-faint">Cumulative committed spend</p>
        </Card>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-5">
        <Card>
          <CardHeader title="Committed monthly spend" sub="From upcoming costs and their start dates" />
          {upcoming.length === 0 ? (
            <Empty icon={<I.clock />} title="No upcoming costs"
              sub="Mark an expense as an upcoming cost in the ledger to project it here." />
          ) : (
            <div className="px-4 pt-6 pb-4">
              <div className="flex h-40 items-end gap-3">
                {months.map((m) => (
                  <div key={m.key} className="group relative flex h-full flex-1 flex-col justify-end">
                    <div className="rounded-md bg-umber transition-opacity group-hover:opacity-80"
                      style={{ height: `${Math.max((m.committed / max) * 100, 2)}%` }} />
                    <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2
                      rounded bg-ink px-1.5 py-0.5 text-[10px] whitespace-nowrap text-cream
                      opacity-0 transition-opacity group-hover:opacity-100">
                      {money(m.committed)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-3">
                {months.map((m) => (
                  <span key={m.key} className="flex-1 text-center text-[10px] text-faint">
                    {m.label.split(' ')[0]}
                  </span>
                ))}
              </div>

              <table className="mt-6 w-full text-[13px]">
                <thead>
                  <tr className="border-b border-line text-left text-[11px] font-medium
                    tracking-wide text-faint uppercase">
                    <th className="py-2 font-medium">Month</th>
                    <th className="py-2 text-right font-medium">Committed</th>
                    <th className="py-2 text-right font-medium">Cumulative</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {months.map((m, i) => (
                    <tr key={m.key}>
                      <td className="py-2">{m.label}</td>
                      <td className="py-2 text-right tabular-nums">{money(m.committed)}</td>
                      <td className="py-2 text-right tabular-nums text-muted">{money(cumulative[i])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Step-ups" sub="When committed spend increases" />
            {stepUps.length === 0 ? (
              <p className="px-4 py-3 text-xs text-faint">
                {upcoming.length === 0 ? 'No upcoming costs.' : 'No increases in the next six months.'}
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
                      <span className="ml-3 tabular-nums">{money(Number(e.expected_cost))}/mo</span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-faint">
                      {e.converts_at ? `From ${e.converts_at}` : 'Start date not set'}
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
