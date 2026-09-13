import { Link } from 'react-router-dom'
import { useWs } from '../lib/ctx'
import { Avatar, Button, Card, CardHeader, PageHeader, money } from '../components/ui'

// Mocked handoff. The point being demonstrated is that every field
// arrives already filled from what the workspace already knows.
export default function Incorporate() {
  const ws = useWs()
  const w = ws.workspace!

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
          <Field label="Description">
            <p className="font-medium">{w.pitch}</p>
            {(['problem', 'what', 'who', 'model', 'stage'] as const)
              .filter((k) => (w.identity?.[k] ?? '').trim())
              .map((k) => (
                <div key={k} className="mt-3">
                  <p className="text-xs text-muted">
                    {{ problem: 'The problem', what: 'What it does', who: 'Who it is for',
                       model: 'How it makes money', stage: 'Where it is now' }[k]}
                  </p>
                  <p className="mt-0.5 whitespace-pre-wrap text-ink/80">{w.identity[k]}</p>
                </div>
              ))}
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
                  <span>{money(ws.perMember[m.id] ?? 0)}</span>
                </li>
              ))}
              <li className="flex justify-between border-t border-line pt-1 font-medium
                tabular-nums">
                <span>Total</span><span>{money(ws.invested)}</span>
              </li>
            </ul>
          </Field>
        </Card>

        <Card className="self-start p-5">
          <p className="text-sm font-medium">Ready to file</p>
          <p className="mt-1 text-sm text-muted">
            Rho will form the entity, open a business account, and record founder
            advances as amounts owed by the company.
          </p>
          <div className="mt-4">
            <Button onClick={() => alert('Demo only — no filing is submitted.')}>
              Continue to Rho
            </Button>
          </div>
        </Card>
      </div>
    </>
  )
}
