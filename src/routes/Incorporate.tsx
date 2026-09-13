import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useWs } from '../lib/ctx'
import { supabase } from '../lib/supabase'
import { rho } from '../lib/rho'
import { Avatar, Button, Card, CardHeader, PageHeader, money } from '../components/ui'

// Mocked handoff. The point being demonstrated is that every field
// arrives already filled from what the workspace already knows.
export default function Incorporate() {
  const ws = useWs()
  const w = ws.workspace!
  const [state, setState] = useState<'review' | 'filing' | 'done'>(w.incorporated_at ? 'done' : 'review')
  const owed = Object.values(ws.perMember).reduce((a, l) => a + l.outstanding, 0)

  async function file() {
    setState('filing')
    const res = await rho.incorporate({
      name: w.name, purpose: w.pitch ?? '', founders: ws.members.map((m) => m.name ?? 'Founder'),
    })
    await supabase.from('workspaces').update({ incorporated_at: res.completedAt }).eq('id', w.id)
    ws.patchWorkspace({ incorporated_at: res.completedAt })
    setState('done')
  }

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="grid grid-cols-[160px_1fr] gap-4 border-b border-line px-4 py-3
      last:border-0">
      <p className="text-xs text-muted">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  )

  return (
    <>
      <PageHeader
        title="Incorporate with Rho"
        sub="Review the information to be transferred. No filing occurs until you continue."
        action={
          <Link to={`/w/${w.share_slug}/next`} className="text-xs text-muted hover:text-ink">
            Back
          </Link>
        }
      />

      <div className="grid max-w-3xl grid-cols-[minmax(0,1fr)_280px] gap-5">
        <Card>
          <CardHeader title="Company" sub="Prefilled from this workspace" />
          <Field label="Legal name">{w.name}</Field>
          <Field label="Entity type">Delaware C-Corp</Field>
          <Field label="Business purpose">
            <p className="whitespace-pre-wrap">{w.pitch}</p>
          </Field>
          <Field label="Founders">
            <ul className="space-y-1.5">
              {ws.members.map((m) => (
                <li key={m.id} className="flex items-center gap-2">
                  <Avatar color={m.color} name={m.name} />
                  <span>{m.name ?? 'Unnamed'}</span>
                </li>
              ))}
            </ul>
          </Field>
          <Field label="Founder advances">
            <ul className="space-y-1">
              {ws.members.map((m) => (
                <li key={m.id} className="flex justify-between tabular-nums">
                  <span className="text-ink/80">{m.name ?? 'Unnamed'}</span>
                  <span>{money(ws.perMember[m.id]?.outstanding ?? 0)}</span>
                </li>
              ))}
              <li className="flex justify-between border-t border-line pt-1 font-medium
                tabular-nums">
                <span>Total</span>
                <span>{money(Object.values(ws.perMember).reduce((a, l) => a + l.outstanding, 0))}</span>
              </li>
            </ul>
          </Field>
        </Card>

        <Card className="self-start p-5">
          {state === 'done' ? (
            <>
              <p className="text-sm font-medium">Incorporated</p>
              <p className="mt-1 text-sm text-muted">
                {w.name} was formed on {(w.incorporated_at ?? '').slice(0, 10)} and a business
                account is open.
              </p>
              {owed > 0 && (
                <p className="mt-3 text-sm text-muted">
                  {money(owed)} of pre-incorporation expenses can now be reimbursed from
                  the business account.
                </p>
              )}
              <div className="mt-4">
                <Link to={`/w/${w.share_slug}/finances/founders`}>
                  <Button>Go to founders</Button>
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-medium">Ready to file</p>
              <p className="mt-1 text-sm text-muted">
                Rho will form the entity and open a business account. Founder advances
                are recorded for reimbursement once the account is open.
              </p>
              <div className="mt-4">
                <Button onClick={file} disabled={state === 'filing'}>
                  {state === 'filing' ? 'Filing…' : 'Continue to Rho'}
                </Button>
              </div>
              <p className="mt-3 text-[11px] text-faint">Demo: the filing is simulated.</p>
            </>
          )}
        </Card>
      </div>
    </>
  )
}
