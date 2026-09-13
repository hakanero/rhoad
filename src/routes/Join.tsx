import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Join() {
  const { slug } = useParams()
  const nav = useNavigate()
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    // Idempotent: re-clicking an invite link just lands you back inside.
    supabase.rpc('join_workspace', { slug }).then(({ error }) => {
      error ? setErr(error.message) : nav(`/w/${slug}`, { replace: true })
    })
  }, [slug, nav])

  return (
    <p className="p-8 text-sm text-muted">
      {err ? `Unable to join this workspace: ${err}` : 'Joining…'}
    </p>
  )
}
