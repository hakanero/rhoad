export type MemberColor = 'dusk' | 'slate' | 'plum' | 'berry'

export const MEMBER_COLORS: MemberColor[] = ['dusk', 'slate', 'plum', 'berry']

export type IdentityKey = 'problem' | 'what' | 'who' | 'model' | 'stage'
export type Identity = Partial<Record<IdentityKey, string>>

export type Workspace = {
  id: string
  name: string
  pitch: string | null
  identity: Identity
  share_slug: string
  created_at: string
}

export type Member = {
  id: string
  workspace_id: string
  user_id: string
  color: MemberColor
  name: string | null
  intended_equity: number | null
  created_at: string
}

export const CATEGORIES = ['software', 'domain', 'legal', 'equipment', 'marketing', 'other'] as const
export type Category = (typeof CATEGORIES)[number]
export const CATEGORY_LABEL: Record<Category, string> = {
  software: 'Software', domain: 'Domain', legal: 'Legal', equipment: 'Equipment',
  marketing: 'Marketing', other: 'Other',
}

export type MemberLedger = { invested: number; reimbursed: number; outstanding: number }

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
  category: Category
  reimbursed_at: string | null
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
