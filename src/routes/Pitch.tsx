import { useEffect, useRef, useState } from 'react'
import { useWs } from '../lib/ctx'
import { supabase } from '../lib/supabase'
import { Card, CardHeader, PageHeader } from '../components/ui'
import { I } from '../components/icons'
import type { Identity, IdentityKey } from '../lib/types'

const SECTIONS: { key: IdentityKey; title: string; hint: string; rows: number }[] = [
  { key: 'problem', title: 'The problem', rows: 4,
    hint: 'The problem being addressed, and who has it.' },
  { key: 'what', title: 'What it does', rows: 5,
    hint: 'The product or service, described concretely.' },
  { key: 'who', title: 'Who it is for', rows: 3,
    hint: 'The initial customer segment.' },
  { key: 'model', title: 'How it makes money', rows: 3,
    hint: 'Revenue model, if determined.' },
  { key: 'stage', title: 'Where it is now', rows: 3,
    hint: 'Current stage: idea, prototype, initial users, or revenue.' },
]

export default function Pitch() {
  const ws = useWs()
  const w = ws.workspace!
  const [oneLiner, setOneLiner] = useState(w.pitch ?? '')
  const [identity, setIdentity] = useState<Identity>(w.identity ?? {})
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const first = useRef(true)

  // One debounced save for everything on the page.
  useEffect(() => {
    if (first.current) { first.current = false; return }
    setStatus('saving')
    const t = setTimeout(async () => {
      await supabase.from('workspaces')
        .update({ pitch: oneLiner, identity })
        .eq('id', w.id)
      ws.setPitchLocal(oneLiner)
      ws.setIdentityLocal(identity)
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 1800)
    }, 700)
    return () => clearTimeout(t)
  }, [oneLiner, identity])

  const filled = [oneLiner, ...SECTIONS.map((s) => identity[s.key] ?? '')]
    .filter((v) => v.trim()).length
  const total = SECTIONS.length + 1

  const set = (k: IdentityKey, v: string) => setIdentity((i) => ({ ...i, [k]: v }))

  return (
    <>
      <PageHeader
        title="Pitch"
        sub="The business purpose, and the longer profile behind it."
        action={
          <span className="text-xs text-muted tabular-nums">
            {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : ''}
          </span>
        }
      />

      <div className="grid grid-cols-[minmax(0,1fr)_280px] gap-5">
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Business purpose"
              sub="One or two sentences. This is the description used on incorporation."
            />
            <textarea
              rows={2}
              value={oneLiner}
              onChange={(e) => setOneLiner(e.target.value)}
              placeholder={`${w.name} is…`}
              className="block w-full resize-none bg-transparent px-4 py-3 text-[16px]
                font-medium leading-relaxed tracking-tight outline-none
                placeholder:font-normal placeholder:text-faint"
            />
          </Card>

          <p className="pt-3 text-[11px] font-medium tracking-wide text-faint uppercase">
            Profile
          </p>

          {SECTIONS.map((s) => (
            <Card key={s.key}>
              <CardHeader title={s.title} sub={s.hint} />
              <textarea
                rows={s.rows}
                value={identity[s.key] ?? ''}
                onChange={(e) => set(s.key, e.target.value)}
                className="block w-full resize-none bg-transparent px-4 py-3 text-[14px]
                  leading-relaxed outline-none placeholder:text-faint"
              />
            </Card>
          ))}
        </div>

        <aside className="space-y-5">
          <Card>
            <CardHeader title="Completeness" sub={`${filled} of ${total} sections`} />
            <div className="px-4 pt-3 pb-1">
              <div className="h-1 overflow-hidden rounded-full bg-sunken">
                <div className="h-full rounded-full bg-umber transition-all"
                  style={{ width: `${(filled / total) * 100}%` }} />
              </div>
            </div>
            <ul className="px-4 py-3 text-[13px]">
              {[{ title: 'Business purpose', done: !!oneLiner.trim() },
                ...SECTIONS.map((s) => ({ title: s.title, done: !!(identity[s.key] ?? '').trim() }))
              ].map((r) => (
                <li key={r.title} className="flex items-center gap-2 py-1">
                  <span className={r.done ? 'text-umber' : 'text-faint'}>
                    {r.done ? <I.check /> : <span className="block size-4" />}
                  </span>
                  <span className={r.done ? '' : 'text-muted'}>{r.title}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Where this is used" />
            <ul className="divide-y divide-line text-[13px]">
              <li className="px-4 py-2.5">
                <p className="font-medium">Incorporation</p>
                <p className="mt-0.5 text-xs text-muted">
                  Business purpose only. The profile is not transferred.
                </p>
              </li>
              <li className="px-4 py-2.5">
                <p className="font-medium">Next steps</p>
                <p className="mt-0.5 text-xs text-muted">
                  A business purpose satisfies the description requirement.
                </p>
              </li>
              <li className="px-4 py-2.5">
                <p className="font-medium">Content</p>
                <p className="mt-0.5 text-xs text-muted">
                  Business purpose and profile are recorded with each post as they stood.
                </p>
              </li>
            </ul>
          </Card>
        </aside>
      </div>
    </>
  )
}
