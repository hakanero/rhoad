import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { Button, Card } from '../components/ui'
import { I } from '../components/icons'

const FEATURES = [
  { icon: I.home, title: 'A shared log',
    body: 'What happened, who did it, when. A private feed for the people actually working on it.' },
  { icon: I.ledger, title: 'The money, kept properly',
    body: 'Every domain, subscription, and tool, with receipts. Per-person totals so nobody has to remember who paid.' },
  { icon: I.pitch, title: 'What it is, written down',
    body: 'The problem, the product, who it is for. It changes; the record of how it changed stays.' },
  { icon: I.content, title: 'What you have said publicly',
    body: 'Each post you log keeps the pitch as it read that day.' },
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
          A private workspace for a company that isn't one yet.
        </h1>
        <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted">
          Keep track of what you're building, what it costs, and what you've said
          about it — with the people you're building it with. When it's time to make
          it official, everything is already there.
        </p>
        <div className="mt-8 flex items-center gap-4">
          <Link to={cta}><Button>Create a workspace</Button></Link>
          <span className="text-sm text-faint">Invite-only. Nothing is public.</span>
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
            <p className="text-xs font-medium tracking-wide text-faint uppercase">When you're ready</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Incorporate with Rho, prefilled.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Name, description, founders, and what each of them has put in — carried
              straight over from the workspace. No forms to fill in from memory, and no
              pressure to get there before you want to.
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
