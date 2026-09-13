import { Link } from 'react-router-dom'
import { useWs } from '../lib/ctx'
import { Button, Card, CardHeader, PageHeader, money } from '../components/ui'

export default function NextSteps() {
  const ws = useWs()

  const hasName = !!ws.workspace!.name?.trim()
  const hasPitch = (ws.workspace!.pitch ?? '').trim().length > 0
  const collaborators = ws.members.length - 1
  const expenses = ws.entries.filter((e) => e.is_expense).length
  const posts = ws.posts.length

  // Status, not tasks: each row states what is on record. Only name and
  // description gate anything; the rest is reported and left alone.
  const rows = [
    { label: 'Company name', value: hasName ? ws.workspace!.name : 'Not set', done: hasName },
    { label: 'Business purpose', value: hasPitch ? 'Written' : 'Not written', done: hasPitch },
    { label: 'Collaborators', value: collaborators > 0 ? `${collaborators}` : 'None',
      done: collaborators > 0 },
    { label: 'Logged expenses', value: expenses > 0 ? `${expenses}` : 'None',
      done: expenses > 0 },
    { label: 'Income received', value: ws.received > 0 ? money(ws.received) : 'None',
      done: ws.received > 0 },
    { label: 'Published content', value: posts > 0 ? `${posts}` : 'None', done: posts > 0 },
  ]

  const ready = hasName && hasPitch
  const missing = [!hasName && 'a name', !hasPitch && 'a business purpose'].filter(Boolean)

  return (
    <>
      <PageHeader
        title="Next steps"
      />
      <div className="grid max-w-3xl grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="divide-y divide-line self-start">
        <CardHeader title="On record" />
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-3 px-4 py-3">
            <span className={`size-1.5 shrink-0 rounded-full ${
              r.done ? 'bg-umber' : 'bg-line'}`} />
            <span className="flex-1 text-sm text-muted">{r.label}</span>
            <span className={`max-w-[55%] truncate text-sm tabular-nums ${
              r.done ? 'text-ink' : 'text-muted'}`}>
              {r.value}
            </span>
          </div>
        ))}
      </Card>

      <div className="space-y-5">
      <Card className="self-start p-5">
        {(
          <>
            <p className="text-sm font-medium">Incorporate</p>
            <p className="mt-1 text-sm text-muted">
              {ready
                ? 'Name, business purpose, and founders will be transferred.'
                : `Requires ${missing.join(' and ')}.`}
            </p>
            <div className="mt-4">
              {ready ? (
                <Link to={`/w/${ws.workspace!.share_slug}/incorporate`}>
                  <Button>Incorporate with Rho</Button>
                </Link>
              ) : (
                <Button disabled>Incorporate with Rho</Button>
              )}
            </div>
          </>
        )}
      </Card>

      {ws.received > 0 && (
        <Card className="p-4">
          <p className="text-xs font-medium">On income</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            {money(ws.received)} has been received without an entity in place. Money
            received this way is generally received by a person rather than a company;
            treatment depends on structure and jurisdiction.
          </p>
        </Card>
      )}
      </div>
      </div>
    </>
  )
}
