import type { MemberColor } from '../lib/types'

export function Button({
  children,
  variant = 'primary',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'quiet'
}) {
  const base =
    'rounded-md px-4 py-2 text-sm transition disabled:opacity-40 disabled:cursor-not-allowed'
  const styles =
    variant === 'primary'
      ? 'bg-umber text-cream hover:opacity-90'
      : 'border border-line text-ink hover:bg-black/[0.03]'
  return (
    <button className={`${base} ${styles}`} {...props}>
      {children}
    </button>
  )
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-md border border-line bg-white/60 px-3 py-2 text-sm
        outline-none placeholder:text-muted focus:border-umber ${props.className ?? ''}`}
    />
  )
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full resize-none rounded-md border border-line bg-white/60 px-3 py-2 text-sm
        outline-none placeholder:text-muted focus:border-umber ${props.className ?? ''}`}
    />
  )
}

const DOT: Record<MemberColor, string> = {
  dusk: 'bg-dusk',
  slate: 'bg-slate',
  plum: 'bg-plum',
  berry: 'bg-berry',
}

export function Dot({ color }: { color: MemberColor }) {
  return <span className={`inline-block size-2 rounded-sm ${DOT[color] ?? DOT.dusk}`} />
}

export const money = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
