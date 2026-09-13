import { Link, useParams } from 'react-router-dom'
import { useWs } from '../../lib/ctx'
import { Button, Card, money } from '../../components/ui'
import { CATEGORY_LABEL } from '../../lib/types'
import { sum } from '../../lib/finance'

// Per-founder statement of advances. Print-friendly; this is the
// document a founder would hand to the company after incorporation.
export default function Statement() {
  const ws = useWs()
  const { memberId } = useParams()
  const m = ws.members.find((x) => x.id === memberId)
  if (!m) return <p className="text-sm text-muted">Founder not found.</p>

  const items = ws.entries
    .filter((e) => e.member_id === m.id && e.is_expense)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
  const advanced = sum(items.map((e) => Number(e.amount ?? 0)))
  const reimbursed = sum(items.filter((e) => e.reimbursed_at).map((e) => Number(e.amount ?? 0)))
  const owed = advanced - reimbursed
  const today = new Date().toLocaleDateString(undefined, { dateStyle: 'long' })

  return (
    <>
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link to={`/w/${ws.workspace!.share_slug}/finances/founders`}
          className="text-xs text-muted hover:text-ink">← Founders</Link>
        <Button size="sm" variant="quiet" onClick={() => window.print()}>Print</Button>
      </div>

      <Card className="mx-auto max-w-2xl p-8 print:max-w-none print:p-0 print:shadow-none">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium tracking-wide text-faint uppercase">
              Statement of founder advances
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">{ws.workspace!.name}</h2>
          </div>
          <div className="text-right text-xs text-muted">
            <p>{today}</p>
            <p className="mt-0.5 lowercase">rhoad<span className="text-umber">.</span></p>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-3 gap-4 border-y border-line py-4">
          <div>
            <dt className="text-xs text-muted">Founder</dt>
            <dd className="mt-0.5 text-sm font-medium">{m.name ?? 'Unnamed'}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Advanced</dt>
            <dd className="mt-0.5 text-sm font-medium tabular-nums">{money(advanced)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Balance owed by company</dt>
            <dd className="mt-0.5 text-sm font-semibold tabular-nums text-umber">{money(owed)}</dd>
          </div>
        </dl>

        <table className="mt-6 w-full text-[13px]">
          <thead>
            <tr className="border-b border-line text-left text-[11px] font-medium
              tracking-wide text-faint uppercase">
              <th className="py-2 font-medium">Date</th>
              <th className="py-2 font-medium">Description</th>
              <th className="py-2 font-medium">Category</th>
              <th className="py-2 font-medium">Receipt</th>
              <th className="py-2 text-right font-medium">Amount</th>
              <th className="py-2 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {items.map((e) => (
              <tr key={e.id}>
                <td className="py-2 whitespace-nowrap text-muted tabular-nums">
                  {e.created_at.slice(0, 10)}
                </td>
                <td className="py-2 pr-3">{e.text}</td>
                <td className="py-2 text-muted">{CATEGORY_LABEL[e.category] ?? 'Other'}</td>
                <td className="py-2 text-muted">{e.receipt_url ? 'Attached' : '—'}</td>
                <td className="py-2 text-right tabular-nums">{money(Number(e.amount ?? 0))}</td>
                <td className="py-2 text-right text-muted">
                  {e.reimbursed_at ? `Reimbursed ${e.reimbursed_at.slice(0, 10)}` : 'Outstanding'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-line">
              <td colSpan={4} className="py-2 text-muted">Total advanced</td>
              <td className="py-2 text-right tabular-nums">{money(advanced)}</td>
              <td />
            </tr>
            <tr>
              <td colSpan={4} className="py-1 text-muted">Reimbursed</td>
              <td className="py-1 text-right tabular-nums">({money(reimbursed)})</td>
              <td />
            </tr>
            <tr className="font-semibold">
              <td colSpan={4} className="py-2">Balance owed</td>
              <td className="py-2 text-right tabular-nums text-umber">{money(owed)}</td>
              <td />
            </tr>
          </tfoot>
        </table>

        <p className="mt-8 text-[11px] leading-relaxed text-faint">
          This statement records expenses paid personally by the named founder on behalf
          of {ws.workspace!.name} prior to incorporation, as logged in this workspace.
          It is a record of amounts advanced and does not itself constitute a loan
          agreement or promissory note.
        </p>
      </Card>
    </>
  )
}
