import { NavLink, Outlet, useParams } from 'react-router-dom'
import { useWs } from '../../lib/ctx'
import { PageHeader } from '../../components/ui'

const TABS = [
  { to: '', label: 'Ledger', end: true },
  { to: 'founders', label: 'Founders', end: false },
  { to: 'projection', label: 'Projection', end: false },
]

export default function FinancesLayout() {
  const { slug } = useParams()
  const ctx = useWs()
  const tab = ({ isActive }: { isActive: boolean }) =>
    `-mb-px border-b-2 px-1 pb-2.5 text-sm transition-colors ${
      isActive ? 'border-umber font-medium text-ink' : 'border-transparent text-muted hover:text-ink'
    }`
  return (
    <>
      <PageHeader
        title="Finances"
        sub="Amounts paid, amounts owed to founders, and expected future costs."
      />
      <nav className="mb-6 flex gap-5 border-b border-line">
        {TABS.map((t) => (
          <NavLink key={t.label} end={t.end} to={`/w/${slug}/finances/${t.to}`} className={tab}>
            {t.label}
          </NavLink>
        ))}
      </nav>
      <Outlet context={ctx} />
    </>
  )
}
