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
    { label: 'Description', value: hasPitch ? 'Written' : 'Not written', done: hasPitch },
    { label: 'Collaborators', value: collaborators > 0 ? `${collaborators}` : 'None',
      done: collaborators > 0 },
    { label: 'Logged expenses', value: expenses > 0 ? `${expenses}` : 'None',
      done: expenses > 0 },
    { label: 'Owed to founders',
      value: money(Object.values(ws.perMember).reduce((a, l) => a + l.outstanding, 0)),
      done: expenses > 0 },
    { label: 'Published content', value: posts > 0 ? `${posts}` : 'None', done: posts > 0 },
  ]

  const ready = hasName && hasPitch
  const missing = [!hasName && 'a name', !hasPitch && 'a description'].filter(Boolean)

  return (
    <>
      <PageHeader
        title="Next steps"
        sub="Information on record and available actions."
      />
      <div className="grid max-w-3xl grid-cols-[minmax(0,1fr)_320px] gap-5">
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

      <Card className="self-start p-5">
        <p className="text-sm font-medium">Incorporate</p>
        <p className="mt-1 text-sm text-muted">
          Rho can incorporate this company using the information in this workspace.
        </p>
        <p className="mt-1 text-sm text-muted">
          {ready
            ? 'Name, description, and founders will be transferred.'
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
      </Card>
      </div>
    </>
  )
}
