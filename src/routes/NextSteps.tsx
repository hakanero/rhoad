import { Link } from 'react-router-dom'
import { useWs } from '../lib/ctx'
import { Button } from '../components/ui'

export default function NextSteps() {
  const ws = useWs()

  const hasName = !!ws.workspace!.name?.trim()
  const hasPitch = (ws.workspace!.pitch ?? '').trim().length > 0
  const hasPeople = ws.members.length > 1
  const hasSpend = ws.entries.some((e) => e.is_expense)

  // Phrased as observations, never as tasks. The two informational rows
  // deliberately don't gate anything.
  const rows: [boolean, string, string][] = [
    [hasName, "you've named it", "this doesn't have a name yet"],
    [hasPitch, "you've described what it does", "you haven't described what it does yet"],
    [hasPeople, 'two of you are working on this', "it's just you so far"],
    [hasSpend, "you've put real money in", 'no money has gone in yet'],
  ]

  const ready = hasName && hasPitch

  return (
    <>
      <ul className="space-y-3">
        {rows.map(([ok, yes, no], i) => (
          <li key={i} className="flex items-start gap-3 text-sm">
            <span className={ok ? 'text-umber' : 'text-muted'}>{ok ? '●' : '○'}</span>
            <span className={ok ? '' : 'text-muted'}>{ok ? yes : no}</span>
          </li>
        ))}
      </ul>

      {ready && (
        <div className="mt-10 border-t border-line pt-8">
          <Link to={`/w/${ws.workspace!.share_slug}/incorporate`}>
            <Button>Incorporate with Rho</Button>
          </Link>
        </div>
      )}

      <div className="mt-10 border-t border-line pt-6">
        <p className="text-xs text-muted">Invite link</p>
        <code className="mt-1 block text-xs break-all text-ink/70">
          {window.location.origin}/join/{ws.workspace!.share_slug}
        </code>
      </div>
    </>
  )
}
