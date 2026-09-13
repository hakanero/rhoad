import { useState } from 'react'
import { useWs } from '../../lib/ctx'
import { supabase } from '../../lib/supabase'
import { Avatar, Card, CardHeader, Figures, money } from '../../components/ui'
import { contributionSplit, sum } from '../../lib/finance'

const BG: Record<string, string> = { dusk: 'bg-dusk', slate: 'bg-slate', plum: 'bg-plum', berry: 'bg-berry' }
const pct = (x: number | null) => (x == null ? '—' : `${Math.round(x * 100)}%`)

// One job: who has put in what, against what the founders intend.
export default function Founders() {
  const ws = useWs()
  const { rows, total, intendedTotal } = contributionSplit(ws.members, ws.perMember)
  const reimbursed = sum(Object.values(ws.perMember).map((l) => l.reimbursed))
  const gaps = rows.filter((r) => r.delta != null)
  const worst = gaps.length ? gaps.reduce((a, b) => (Math.abs(b.delta!) > Math.abs(a.delta!) ? b : a)) : null

  return (
    <>
      <Figures items={[
        { label: 'Paid personally', value: money(total), accent: true },
        { label: 'Reimbursed between founders', value: money(reimbursed) },
        { label: 'Largest gap to intended split',
          value: worst == null ? '—' : `${pct(Math.abs(worst.delta!))} · ${worst.member.name ?? 'Unnamed'}` },
      ]} />

      <Card>
        <CardHeader
          title="Contribution and intended split"
          sub="Share of funds each founder has paid, against the equity split they intend. Informational."
        />
        <div className="divide-y divide-line">
          {rows.map((r) => <SplitRow key={r.member.id} r={r} onSaved={ws.refresh} />)}
        </div>
        {intendedTotal != null && Math.abs(intendedTotal - 100) > 0.01 && (
          <p className="border-t border-line px-4 py-2.5 text-xs text-berry">
            Intended equity totals {intendedTotal}%, not 100%.
          </p>
        )}
      </Card>
    </>
  )
}

function SplitRow({ r, onSaved }: { r: ReturnType<typeof contributionSplit>['rows'][number]; onSaved: () => void }) {
  const [v, setV] = useState(r.member.intended_equity == null ? '' : String(r.member.intended_equity))
  const [busy, setBusy] = useState(false)
  async function save() {
    const n = v.trim() === '' ? null : Number(v)
    if (n === (r.member.intended_equity ?? null)) return
    setBusy(true)
    await supabase.from('members').update({ intended_equity: n }).eq('id', r.member.id)
    setBusy(false)
    onSaved()
  }
  const big = r.delta != null && Math.abs(r.delta) >= 0.15
  return (
    <div className="grid grid-cols-2 items-center gap-4 px-4 py-3 md:grid-cols-[minmax(0,1fr)_130px_130px_110px]">
      <div className="flex items-center gap-2 text-[13px]">
        <Avatar color={r.member.color} name={r.member.name} />
        <span className="truncate">{r.member.name ?? 'Unnamed'}</span>
      </div>
      <div>
        <p className="text-[11px] text-faint">Paid · share</p>
        <p className="text-[13px] tabular-nums">{money(r.invested)} <span className="text-faint">· {pct(r.share)}</span></p>
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-sunken">
          <div className={`h-full ${BG[r.member.color]}`} style={{ width: `${(r.share ?? 0) * 100}%` }} />
        </div>
      </div>
      <div>
        <p className="text-[11px] text-faint">Intended</p>
        <div className="flex items-center gap-1 text-[13px]">
          <input type="number" min="0" max="100" step="0.5" placeholder="—" value={v}
            onChange={(e) => setV(e.target.value)} onBlur={save}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} disabled={busy}
            className="w-14 rounded-md border border-line bg-surface px-1.5 py-0.5 text-right tabular-nums outline-none focus:border-umber" />
          <span className="text-muted">%</span>
        </div>
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-sunken">
          <div className="h-full bg-line" style={{ width: `${(r.intended ?? 0) * 100}%` }} />
        </div>
      </div>
      <div className="md:text-right">
        <p className="text-[11px] text-faint">Difference</p>
        <p className={`text-[13px] font-medium tabular-nums ${r.delta == null ? 'text-faint' : big ? 'text-berry' : ''}`}>
          {r.delta == null ? '—' : `${r.delta > 0 ? '+' : ''}${Math.round(r.delta * 100)} pts`}
        </p>
      </div>
    </div>
  )
}
