import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { Button, Card } from '../components/ui'
import { I } from '../components/icons'

const FEATURES = [
  { icon: I.home, title: 'Activity log',
    body: 'A chronological record of work, attributed to the member who logged it.' },
  { icon: I.ledger, title: 'Expense ledger',
    body: 'Every payment with amount, payer, and receipt. Totals per person, and expected future costs.' },
  { icon: I.pitch, title: 'Company profile',
    body: 'Problem, product, customer, business model, and stage, maintained in one place.' },
  { icon: I.content, title: 'Published content',
    body: 'A record of public posts, each with the company profile as it stood at the time.' },
]

export default function Landing() {
  const { session } = useAuth()
  const cta = session ? '/new' : '/login'

  return (
    <div className="min-h-full">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-8 py-6">
        <span className="text-[15px] font-semibold lowercase tracking-tight">
          rhoad<span className="text-umber">.</span>
        </span>
        <nav className="flex items-center gap-4 text-sm">
          {session ? (
            <Link to="/new"><Button size="sm">Open workspace</Button></Link>
          ) : (
            <Link to="/login" className="text-muted hover:text-ink">Sign in</Link>
          )}
        </nav>
      </header>

      <section className="mx-auto max-w-5xl px-8 pt-20 pb-16">
        <p className="text-sm text-umber">road from idea to company</p>
        <h1 className="mt-3 max-w-2xl text-[44px] leading-[1.08] font-semibold tracking-tight">
          The workspace for a company before incorporation.
        </h1>
        <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted">
          Record activity, expenses, and public communication for an early-stage
          company in a private, invite-only workspace. When the company is ready to
          incorporate, the required information is already on record.
        </p>
        <div className="mt-8 flex items-center gap-4">
          <Link to={cta}><Button>Create a workspace</Button></Link>
          <span className="text-sm text-faint">Invite-only. Private by default.</span>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-8 pb-20">
        <div className="grid grid-cols-2 gap-4">
          {FEATURES.map((f) => (
            <Card key={f.title} className="p-5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-sunken
                text-umber"><f.icon /></span>
              <p className="mt-4 text-[15px] font-medium">{f.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto grid max-w-5xl grid-cols-[1fr_1.2fr] gap-12 px-8 py-16">
          <div>
            <p className="text-xs font-medium tracking-wide text-faint uppercase">Incorporation</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Incorporate with Rho.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Company name, description, founders, and founder contributions are
              transferred directly from the workspace. Incorporation is available when
              the required information is on record, and is never required.
            </p>
          </div>
          <Card className="self-start">
            <div className="border-b border-line px-4 py-3">
              <p className="text-[13px] font-medium">Company</p>
              <p className="text-xs text-muted">Prefilled from this workspace</p>
            </div>
            {[
              ['Legal name', 'Acme'],
              ['Entity type', 'Delaware C-Corp'],
              ['Founders', 'Hakan, Sam'],
              ['Founder advances', '$1,240.00'],
            ].map(([k, v]) => (
              <div key={k} className="grid grid-cols-[140px_1fr] gap-4 border-b border-line
                px-4 py-2.5 text-sm last:border-0">
                <span className="text-xs text-muted">{k}</span>
                <span className={k === 'Founder advances' ? 'tabular-nums' : ''}>{v}</span>
              </div>
            ))}
          </Card>
        </div>
      </section>

      <footer className="mx-auto flex max-w-5xl items-center justify-between px-8 py-8
        text-xs text-faint">
        <span>rhoad</span>
        <span>road from idea to company</span>
      </footer>
    </div>
  )
}
