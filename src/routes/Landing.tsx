import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { Button, Card } from '../components/ui'
import { I } from '../components/icons'
import AuthForm from '../components/AuthForm'

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

  return (
    <div className="min-h-full">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-8 py-6">
        <span className="text-[15px] font-semibold lowercase tracking-tight">
          rhoad<span className="text-umber">.</span>
        </span>
        <nav className="flex items-center gap-4 text-sm">
          {session ? (
            <Link to="/workspaces"><Button size="sm">Your workspaces</Button></Link>
          ) : (
            <a href="#signin" className="text-muted hover:text-ink">Sign in</a>
          )}
        </nav>
      </header>

      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-6 pt-10 pb-12 md:grid-cols-[1.3fr_1fr] md:gap-16 md:px-8 md:pt-16 md:pb-16">
        <div>
          <p className="text-[48px] leading-none font-semibold lowercase tracking-tighter md:text-[64px]">
            rhoad<span className="text-umber">.</span>
          </p>
          <p className="mt-3 text-[15px] text-umber">road from idea to company</p>
          <h1 className="mt-8 text-[28px] leading-[1.12] font-semibold tracking-tight md:text-[34px]">
            The workspace for a company before incorporation.
          </h1>
          <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted">
            Record activity, expenses, and public communication for an early-stage
            company in a private, invite-only workspace. When the company is ready to
            incorporate, the required information is already on record.
          </p>
          {session && (
            <div className="mt-8 flex items-center gap-4">
              <Link to="/workspaces"><Button>Your workspaces</Button></Link>
              <Link to="/new" className="text-sm text-muted hover:text-ink">New workspace</Link>
            </div>
          )}
        </div>

        <Card id="signin" className="self-start p-5">
          {session ? (
            <>
              <p className="text-sm font-medium">{session.user.email}</p>
              <div className="mt-4">
                <Link to="/workspaces"><Button size="sm">Open workspaces</Button></Link>
              </div>
            </>
          ) : (
            <>
              <p className="mb-4 text-sm font-medium">Sign in</p>
              <AuthForm />
            </>
          )}
        </Card>
      </section>

      <section className="mx-auto max-w-5xl px-8 pb-20">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-6 py-12 md:grid-cols-[1fr_1.2fr] md:gap-12 md:px-8 md:py-16">
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
