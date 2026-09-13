import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  throw new Error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY. Copy .env.example to .env.local.',
  )
}

// VITE_* vars are inlined into the client bundle, so only the publishable
// key belongs here. A secret key would bypass RLS for every visitor.
if (key.startsWith('sb_secret_') || key.includes('service_role')) {
  throw new Error(
    'That is a SECRET key. It bypasses RLS and must never ship in a browser bundle. ' +
      'Use the publishable key (sb_publishable_…) instead.',
  )
}

export const supabase = createClient(url, key)
