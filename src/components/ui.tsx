import type { MemberColor } from '../lib/types'

export function Button({
  children, variant = 'primary', size = 'md', ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'quiet' | 'ghost'
  size?: 'sm' | 'md'
}) {
  const base =
    'inline-flex items-center justify-center rounded-md font-medium transition-colors ' +
    'disabled:cursor-not-allowed disabled:opacity-45'
  const sizes = size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-sm'
  const variants = {
    primary: 'bg-umber text-cream hover:bg-umber/90',
    quiet: 'border border-line bg-surface text-ink hover:bg-hover',
    ghost: 'text-muted hover:bg-hover hover:text-ink',
  }[variant]
  return <button className={`${base} ${sizes} ${variants}`} {...props}>{children}</button>
}

const field =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink ' +
  'outline-none transition-colors placeholder:text-muted ' +
  'focus:border-umber focus:ring-2 focus:ring-umber/15'

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${field} ${props.className ?? ''}`} />
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${field} resize-none ${props.className ?? ''}`} />
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${field} ${props.className ?? ''}`} />
}

export function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1.5 block text-xs font-medium text-muted">{children}</span>
  )
}

export function Card({
  children, className = '', id,
}: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <div id={id} className={`rounded-xl bg-surface shadow-card ${className}`}>
      {children}
    </div>
  )
}

export function CardHeader({
  title, action, sub,
}: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-line px-4 py-3">
      <div>
        <h3 className="text-[13px] font-medium">{title}</h3>
        {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  )
}

export function PageHeader({
  title, sub, action,
}: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  )
}

export function SectionHeader({
  title, action,
}: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <h2 className="text-xs font-medium tracking-wide text-muted uppercase">{title}</h2>
      {action}
    </div>
  )
}

export function Empty({ icon, title, sub }: {
  icon?: React.ReactNode; title: string; sub?: string
}) {
  return (
    <div className="flex flex-col items-center px-4 py-12 text-center">
      {icon && (
        <span className="mb-3 flex size-9 items-center justify-center rounded-lg
          bg-sunken text-muted">{icon}</span>
      )}
      <p className="text-sm font-medium">{title}</p>
      {sub && <p className="mt-1 max-w-xs text-xs text-muted">{sub}</p>}
    </div>
  )
}

const DOT: Record<MemberColor, string> = {
  dusk: 'bg-dusk', slate: 'bg-slate', plum: 'bg-plum', berry: 'bg-berry',
}
const RING: Record<MemberColor, string> = {
  dusk: 'bg-dusk/12 text-dusk', slate: 'bg-slate/12 text-slate',
  plum: 'bg-plum/12 text-plum', berry: 'bg-berry/12 text-berry',
}

export function Dot({ color }: { color: MemberColor }) {
  return <span className={`inline-block size-2 rounded-sm ${DOT[color] ?? DOT.dusk}`} />
}

export function Avatar({ color, name }: { color: MemberColor; name: string | null }) {
  return (
    <span
      className={`inline-flex size-6 shrink-0 items-center justify-center rounded-md
        text-[10px] font-semibold ${RING[color] ?? RING.dusk}`}
    >
      {(name ?? '?').trim().charAt(0).toUpperCase()}
    </span>
  )
}

export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-sunken px-1.5 py-0.5 text-[11px] font-medium text-muted">
      {children}
    </span>
  )
}

export const money = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

export function relDate(iso: string) {
  const d = new Date(iso)
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
