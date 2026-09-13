export type MemberColor = 'dusk' | 'slate' | 'plum' | 'berry'

export const MEMBER_COLORS: MemberColor[] = ['dusk', 'slate', 'plum', 'berry']

export type Workspace = {
  id: string
  name: string
  pitch: string | null
  share_slug: string
  created_at: string
}

export type Member = {
  id: string
  workspace_id: string
  user_id: string
  color: MemberColor
  name: string | null
  created_at: string
}

export type Entry = {
  id: string
  workspace_id: string
  member_id: string
  text: string
  is_expense: boolean
  amount: number | null
  receipt_url: string | null
  is_free_tier: boolean
  expected_cost: number | null
  converts_at: string | null
  created_at: string
}

export type Post = {
  id: string
  workspace_id: string
  member_id: string
  platform: 'linkedin' | 'x' | 'other'
  caption: string
  pitch_snapshot: string | null
  created_at: string
}

export type Reply = {
  id: string
  workspace_id: string
  member_id: string
  entry_id: string | null
  post_id: string | null
  text: string
  created_at: string
}

export type Totals = {
  invested: number
  queued: number
  per_member: { member_id: string; invested: number }[]
}
