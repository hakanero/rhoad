import { useWs } from '../lib/ctx'
import { Button } from '../components/ui'

// Mocked handoff. The point being demonstrated is that every field
// arrives already filled from what the workspace already knows.
export default function Incorporate() {
  const ws = useWs()

  const Field = ({ label, value }: { label: string; value: string }) => (
    <div className="border-b border-line py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-sm whitespace-pre-wrap">{value}</p>
    </div>
  )

  return (
    <>
      <h2 className="text-lg tracking-tight">Incorporate with Rho</h2>
      <p className="mt-1 mb-6 text-xs text-muted">Prefilled from your workspace.</p>

      <Field label="Company name" value={ws.workspace!.name} />
      <Field label="What it does" value={ws.workspace!.pitch ?? ''} />
      <Field
        label="Founders"
        value={ws.members.map((m) => m.name ?? 'unnamed').join(', ')}
      />
      <Field label="Entity type" value="Delaware C-Corp" />

      <div className="mt-8">
        <Button onClick={() => alert('Demo only — no filing is submitted.')}>
          Continue
        </Button>
      </div>
    </>
  )
}
