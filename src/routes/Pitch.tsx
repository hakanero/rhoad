import { useEffect, useRef, useState } from 'react'
import { useWs } from '../lib/ctx'
import { supabase } from '../lib/supabase'
import { Card, PageHeader } from '../components/ui'

export default function Pitch() {
  const ws = useWs()
  const [value, setValue] = useState(ws.workspace!.pitch ?? '')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const first = useRef(true)

  useEffect(() => {
    if (first.current) { first.current = false; return }
    setStatus('saving')
    const t = setTimeout(async () => {
      await supabase.from('workspaces').update({ pitch: value }).eq('id', ws.workspace!.id)
      ws.setPitchLocal(value)
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 1800)
    }, 600)
    return () => clearTimeout(t)
  }, [value])

  const words = value.trim() ? value.trim().split(/\s+/).length : 0

  return (
    <>
      <PageHeader
        title="Pitch"
        sub="What this company does. Posts keep a copy of this as it reads when they're logged."
        action={
          <span className="text-xs text-muted tabular-nums">
            {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' :
              `${words} ${words === 1 ? 'word' : 'words'}`}
          </span>
        }
      />

      <Card className="max-w-3xl p-2">
        <textarea
          rows={18}
          value={value}
          placeholder="Describe the company."
          onChange={(e) => setValue(e.target.value)}
          className="w-full resize-none bg-transparent px-4 py-3 text-[15px]
            leading-relaxed outline-none placeholder:text-faint"
        />
      </Card>
    </>
  )
}
