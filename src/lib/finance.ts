import type { Entry, Member, MemberLedger } from './types'

export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

/* ---------- projection ---------- */

export type MonthRow = {
  key: string          // yyyy-mm
  label: string        // "Oct 2026"
  committed: number    // upcoming costs active that month
  items: { text: string; amount: number }[]
}

// Six months of committed spend from upcoming costs. A cost is active
// from its start month (or now, if none) onward.
export function projectMonths(entries: Entry[], months = 6, from = new Date()): MonthRow[] {
  const upcoming = entries.filter((e) => e.is_free_tier && e.expected_cost != null)
  const rows: MonthRow[] = []
  for (let i = 0; i < months; i++) {
    const d = new Date(from.getFullYear(), from.getMonth() + i, 1)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    const items = upcoming
      .filter((e) => {
        const start = e.converts_at ? new Date(e.converts_at) : new Date(0)
        return start < end
      })
      .map((e) => ({ text: e.text, amount: Number(e.expected_cost) }))
    rows.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }),
      committed: sum(items.map((x) => x.amount)),
      items,
    })
  }
  return rows
}

/* ---------- contribution vs. intended split ---------- */

export type SplitRow = {
  member: Member
  invested: number
  share: number | null      // 0..1 of total invested, null if nothing invested
  intended: number | null   // 0..1
  delta: number | null      // share - intended
}

export function contributionSplit(
  members: Member[], perMember: Record<string, MemberLedger>,
): { rows: SplitRow[]; total: number; intendedTotal: number | null } {
  const total = sum(members.map((m) => perMember[m.id]?.invested ?? 0))
  const anyIntended = members.some((m) => m.intended_equity != null)
  const intendedTotal = anyIntended
    ? sum(members.map((m) => Number(m.intended_equity ?? 0)))
    : null
  const rows = members.map((m) => {
    const invested = perMember[m.id]?.invested ?? 0
    const share = total > 0 ? invested / total : null
    const intended = m.intended_equity != null ? Number(m.intended_equity) / 100 : null
    const delta = share != null && intended != null ? share - intended : null
    return { member: m, invested, share, intended, delta }
  })
  return { rows, total, intendedTotal }
}

/* ---------- export ---------- */

export function ledgerCsv(entries: Entry[], byId: Map<string, Member>): string {
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const head = ['date', 'type', 'description', 'category', 'member', 'source', 'amount',
    'reimbursed_at', 'upcoming_amount', 'upcoming_from', 'receipt_url']
  const rows = entries
    .filter((e) => e.is_expense || e.is_free_tier || e.is_income)
    .map((e) => [
      e.created_at.slice(0, 10), e.is_income ? 'income' : 'expense', e.text, e.category,
      byId.get(e.member_id)?.name ?? '', e.source ?? '',
      e.is_expense || e.is_income ? Number(e.amount ?? 0).toFixed(2) : '',
      e.reimbursed_at?.slice(0, 10) ?? '',
      e.is_free_tier && e.expected_cost != null ? Number(e.expected_cost).toFixed(2) : '',
      e.converts_at ?? '', e.receipt_url ?? '',
    ])
  return [head, ...rows].map((r) => r.map(esc).join(',')).join('\n')
}

export function download(name: string, text: string, type = 'text/csv') {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([text], { type }))
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}
