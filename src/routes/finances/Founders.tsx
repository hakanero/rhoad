import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useWs } from '../../lib/ctx'
import { supabase } from '../../lib/supabase'
import { Avatar, Button, Card, CardHeader, money } from '../../components/ui'
import { contributionSplit, sum } from '../../lib/finance'
import { rho } from '../../lib/rho'
import type { Member } from '../../lib/types'

const BG: Record<string, string> = {
  dusk: 'bg-dusk', slate: 'bg-slate', plum: 'bg-plum', berry: 'bg-berry',
}
const pct = (x: number | null) => (x == null ? '—' : `${Math.round(x * 100)}%`)

export default function Founders() {
  const ws = useWs()
  const { rows, total, intendedTotal } = contributionSplit(ws.members, ws.perMember)
  const owed = sum(Object.values(ws.perMember).map((l) => l.outstanding))
  const reimbursed = sum(Object.values(ws.perMember).map((l) => l.reimbursed))
  const incorporated = !!ws.workspace!.incorporated_at
  const [reimbursing, setReimbursing] = useState<Member | null>(null)

  // Completed transfers, grouped by reference.
  const transfers = Object.values(
    ws.entries.filter((e) => e.reimbursement_ref).reduce<Record<string, {
      ref: string; member_id: string; amount: number; at: string; count: number
    }>>((acc, e) => {
      const t = acc[e.reimbursement_ref!] ??= {
        ref: e.reimbursement_ref!, member_id: e.member_id, amount: 0,
        at: e.reimbursed_at ?? e.created_at, count: 0,
      }
      t.amount += Number(e.amount ?? 0); t.count += 1
      return acc
    }, {}),
  ).sort((a, b) => b.at.localeCompare(a.at))

  // Largest gap between contribution share and intended share.
  const gaps = rows.filter((r) => r.delta != null)
  const worst = gaps.length
    ? gaps.reduce((a, b) => (Math.abs(b.delta!) > Math.abs(a.delta!) ? b : a))
    : null
  const flagged = worst && Math.abs(worst.delta!) >= 0.15

  return (
    <>
      <div className="mb-5 grid grid-cols-3 gap-4">
        <Card className="px-4 py-3.5">
          <p className="text-xs text-muted">Paid personally</p>
          <p className="mt-1.5 text-[22px] font-semibold tracking-tight tabular-nums text-umber">
            {money(total)}
          </p>
          <p className="mt-1 text-xs text-faint">Across all founders</p>
        </Card>
        <Card className="px-4 py-3.5">
          <p className="text-xs text-muted">Reimbursed</p>
          <p className="mt-1.5 text-[22px] font-semibold tracking-tight tabular-nums">
            {money(reimbursed)}
          </p>
          <p className="mt-1 text-xs text-faint">{money(owed)} not yet reimbursed</p>
        </Card>
        <Card className="px-4 py-3.5">
          <p className="text-xs text-muted">Contribution vs. intended split</p>
          {worst == null ? (
            <p className="mt-2 text-xs text-faint">
              Set intended equity below to compare.
            </p>
          ) : flagged ? (
            <>
              <p className="mt-1.5 text-[15px] font-medium tabular-nums">
                {pct(Math.abs(worst.delta!))} gap
              </p>
              <p className="mt-1 text-xs text-muted">
                {worst.member.name ?? 'Unnamed'} has contributed {pct(worst.share)} of funds
                against an intended {pct(worst.intended)}.
              </p>
            </>
          ) : (
            <>
              <p className="mt-1.5 text-[15px] font-medium">Within range</p>
              <p className="mt-1 text-xs text-muted">
                Largest gap is {pct(Math.abs(worst.delta!))}.
              </p>
            </>
          )}
        </Card>
      </div>

      <Card className="mb-5">
        <CardHeader
          title="Founder ledger"
          sub="What each founder has paid personally, and what has been reimbursed."
          action={incorporated && (
            <span className="text-xs text-muted">
              Incorporated · reimbursement available through Rho
            </span>
          )}
        />
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-line text-left text-[11px] font-medium
              tracking-wide text-faint uppercase">
              <th className="px-4 py-2 font-medium">Founder</th>
              <th className="py-2 text-right font-medium">Paid</th>
              <th className="py-2 text-right font-medium">Reimbursed</th>
              <th className="py-2 text-right font-medium">Balance</th>
              <th className="py-2 pr-4 text-right font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {ws.members.map((m) => {
              const l = ws.perMember[m.id] ?? { invested: 0, reimbursed: 0, outstanding: 0 }
              return (
                <tr key={m.id} className="transition-colors hover:bg-hover/30">
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-2">
                      <Avatar color={m.color} name={m.name} />
                      {m.name ?? 'Unnamed'}
                    </span>
                  </td>
                  <td className="py-2.5 text-right tabular-nums">{money(l.invested)}</td>
                  <td className="py-2.5 text-right tabular-nums text-muted">{money(l.reimbursed)}</td>
                  <td className="py-2.5 text-right font-medium tabular-nums">{money(l.outstanding)}</td>
                  <td className="py-2.5 pr-4 text-right">
                    <span className="inline-flex items-center gap-3">
                      <Link to={`/w/${ws.workspace!.share_slug}/finances/founders/${m.id}`}
                        className="text-xs text-muted hover:text-ink">
                        Statement
                      </Link>
                      {incorporated && l.outstanding > 0 && (
                        <Button size="sm" onClick={() => setReimbursing(m)}>Reimburse</Button>
                      )}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-line font-medium">
              <td className="px-4 py-2.5">Total</td>
              <td className="py-2.5 text-right tabular-nums">{money(total)}</td>
              <td className="py-2.5 text-right tabular-nums text-muted">{money(reimbursed)}</td>
              <td className="py-2.5 text-right tabular-nums">{money(owed)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </Card>

      {transfers.length > 0 && (
        <Card className="mb-5">
          <CardHeader title="Reimbursements" sub="Transfers initiated through Rho" />
          <ul className="divide-y divide-line">
            {transfers.map((t) => {
              const m = ws.members.find((x) => x.id === t.member_id)
              return (
                <li key={t.ref} className="flex items-center gap-3 px-4 py-2.5 text-[13px]">
                  <Avatar color={m?.color ?? 'dusk'} name={m?.name ?? null} />
                  <span className="flex-1">
                    {m?.name ?? 'Unnamed'}
                    <span className="text-faint"> · {t.count} {t.count === 1 ? 'receipt' : 'receipts'} · {t.ref}</span>
                  </span>
                  <span className="text-xs text-muted">{t.at.slice(0, 10)}</span>
                  <span className="font-medium tabular-nums">{money(t.amount)}</span>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      {reimbursing && (
        <ReimburseDialog member={reimbursing} onClose={() => setReimbursing(null)} />
      )}

      <Card>
        <CardHeader
          title="Contribution and intended split"
          sub="Share of funds contributed, against the equity split the founders intend. Informational."
        />
        <div className="divide-y divide-line">
          {rows.map((r) => (
            <SplitRow key={r.member.id} r={r} onSaved={ws.refresh} />
          ))}
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

function SplitRow({
  r, onSaved,
}: { r: ReturnType<typeof contributionSplit>['rows'][number]; onSaved: () => void }) {
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

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_120px_120px_140px] items-center gap-4 px-4 py-3">
      <div className="flex items-center gap-2 text-[13px]">
        <Avatar color={r.member.color} name={r.member.name} />
        <span className="truncate">{r.member.name ?? 'Unnamed'}</span>
      </div>

      <div>
        <p className="text-[11px] text-faint">Contributed</p>
        <p className="text-[13px] tabular-nums">
          {pct(r.share)} <span className="text-faint">· {money(r.invested)}</span>
        </p>
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-sunken">
          <div className={`h-full ${BG[r.member.color]}`}
            style={{ width: `${(r.share ?? 0) * 100}%` }} />
        </div>
      </div>

      <div>
        <p className="text-[11px] text-faint">Intended</p>
        <div className="flex items-center gap-1 text-[13px]">
          <input
            type="number" min="0" max="100" step="0.5" placeholder="—"
            value={v}
            onChange={(e) => setV(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            disabled={busy}
            className="w-14 rounded-md border border-line bg-surface px-1.5 py-0.5 text-right
              tabular-nums outline-none focus:border-umber"
          />
          <span className="text-muted">%</span>
        </div>
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-sunken">
          <div className="h-full bg-line" style={{ width: `${(r.intended ?? 0) * 100}%` }} />
        </div>
      </div>

      <div className="text-right">
        <p className="text-[11px] text-faint">Difference</p>
        <p className={`text-[13px] font-medium tabular-nums ${
          r.delta == null ? 'text-faint' : Math.abs(r.delta) >= 0.15 ? 'text-berry' : ''}`}>
          {r.delta == null ? '—' : `${r.delta > 0 ? '+' : ''}${Math.round(r.delta * 100)} pts`}
        </p>
      </div>
    </div>
  )
}

function ReimburseDialog({ member, onClose }: { member: Member; onClose: () => void }) {
  const ws = useWs()
  const items = ws.entries.filter((e) => e.member_id === member.id && e.is_expense && !e.reimbursed_at)
  const amount = sum(items.map((e) => Number(e.amount ?? 0)))
  const receipts = items.filter((e) => e.receipt_url).map((e) => e.receipt_url!)
  const [state, setState] = useState<'review' | 'sending' | 'done'>('review')
  const [ref, setRef] = useState<string | null>(null)

  async function confirm() {
    setState('sending')
    const res = await rho.initiateReimbursement({
      workspaceId: ws.workspace!.id,
      founderName: member.name ?? 'Founder',
      amount,
      memo: `Reimbursement of pre-incorporation expenses · ${ws.workspace!.name}`,
      attachments: receipts,
    })
    // One present-day transfer settles these entries; the originals stay
    // where they are, tagged with the transfer reference.
    await supabase.from('entries')
      .update({ reimbursed_at: res.initiatedAt, reimbursement_ref: res.ref })
      .in('id', items.map((e) => e.id))
    setRef(res.ref)
    setState('done')
    ws.refresh()
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-ink/30 p-6"
      onClick={state === 'review' ? onClose : undefined}>
      <Card className="w-full max-w-md" >
        <div onClick={(e) => e.stopPropagation()}>
        {state === 'done' ? (
          <div className="p-5">
            <p className="text-sm font-medium">Reimbursement initiated</p>
            <p className="mt-1 text-sm text-muted">
              {money(amount)} to {member.name ?? 'Unnamed'} from the {ws.workspace!.name} account.
            </p>
            <p className="mt-3 text-xs text-faint">Reference {ref}</p>
            <div className="mt-5"><Button size="sm" onClick={onClose}>Done</Button></div>
          </div>
        ) : (
          <>
            <CardHeader title="Reimburse via Rho" sub="A single transfer from the business account" />
            <dl className="divide-y divide-line text-sm">
              <div className="flex justify-between px-4 py-2.5">
                <dt className="text-muted">To</dt><dd>{member.name ?? 'Unnamed'}</dd>
              </div>
              <div className="flex justify-between px-4 py-2.5">
                <dt className="text-muted">Amount</dt>
                <dd className="font-medium tabular-nums">{money(amount)}</dd>
              </div>
              <div className="flex justify-between px-4 py-2.5">
                <dt className="text-muted">Covers</dt>
                <dd>{items.length} {items.length === 1 ? 'expense' : 'expenses'}</dd>
              </div>
              <div className="flex justify-between px-4 py-2.5">
                <dt className="text-muted">Supporting documents</dt>
                <dd>{receipts.length} {receipts.length === 1 ? 'receipt' : 'receipts'} attached</dd>
              </div>
            </dl>
            <p className="px-4 py-3 text-[11px] leading-relaxed text-faint">
              Recorded as one new transfer dated today. The original expenses remain in
              this workspace as supporting records and are not added to the bank ledger.
            </p>
            <div className="flex items-center gap-2 border-t border-line px-4 py-3">
              <Button size="sm" onClick={confirm} disabled={state === 'sending'}>
                {state === 'sending' ? 'Initiating…' : `Transfer ${money(amount)}`}
              </Button>
              <Button size="sm" variant="quiet" onClick={onClose} disabled={state === 'sending'}>
                Cancel
              </Button>
            </div>
          </>
        )}
        </div>
      </Card>
    </div>
  )
}
