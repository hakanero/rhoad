import { NavLink, Outlet, useParams } from 'react-router-dom'
import { useWorkspace } from '../lib/useWorkspace'
import { useAuth } from '../lib/auth'

export default function WorkspaceLayout() {
  const { slug } = useParams()
  const data = useWorkspace(slug)
  const { session } = useAuth()

  if (data.loading) return <p className="p-8 text-sm text-muted">…</p>

  if (data.error === 'not-a-member')
    return (
      <p className="p-8 text-sm text-muted">
        You're not part of this workspace. Ask for an invite link.
      </p>
    )
  if (data.error) return <p className="p-8 text-sm text-berry">{data.error}</p>

  const me = data.members.find((m) => m.user_id === session?.user.id) ?? null

  const tab = ({ isActive }: { isActive: boolean }) =>
    `pb-1 text-sm ${isActive ? 'border-b border-umber text-ink' : 'text-muted hover:text-ink'}`

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-8">
        <div className="flex items-baseline justify-between">
          <h1 className="text-xl tracking-tight">{data.workspace!.name}</h1>
          <span className="text-xs lowercase tracking-tight text-muted">
            rhoad<span className="text-umber">.</span>
          </span>
        </div>
        <nav className="mt-5 flex gap-5">
          <NavLink end to={`/w/${slug}`} className={tab}>Home</NavLink>
          <NavLink to={`/w/${slug}/pitch`} className={tab}>Pitch</NavLink>
          <NavLink to={`/w/${slug}/next`} className={tab}>Next Steps</NavLink>
        </nav>
      </header>

      <Outlet context={{ ...data, me }} />
    </div>
  )
}
