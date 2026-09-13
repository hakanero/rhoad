import { useEffect, useRef, useState } from 'react'
import { useWs } from '../lib/ctx'
import { supabase } from '../lib/supabase'
import { Textarea } from '../components/ui'

export default function Pitch() {
  const ws = useWs()
  const [value, setValue] = useState(ws.workspace!.pitch ?? '')
  const [saved, setSaved] = useState(false)
  const first = useRef(true)

  useEffect(() => {
    if (first.current) { first.current = false; return }
    const t = setTimeout(async () => {
      await supabase
        .from('workspaces')
        .update({ pitch: value })
        .eq('id', ws.workspace!.id)
      ws.setPitchLocal(value)
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    }, 600)
    return () => clearTimeout(t)
  }, [value])

  return (
    <>
      <p className="mb-3 text-sm text-muted">What this actually is.</p>
      <Textarea
        rows={12}
        value={value}
        placeholder="say it plainly…"
        onChange={(e) => setValue(e.target.value)}
      />
      <p className="mt-2 h-4 text-xs text-muted">{saved && 'saved'}</p>
    </>
  )
}
