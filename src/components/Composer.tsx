import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Button, Card, Input, Label } from './ui'
import type { Member } from '../lib/types'

export default function Composer({
  workspaceId, me, onDone,
}: { workspaceId: string; me: Member | null; onDone: () => void }) {
  const [text, setText] = useState('')
  const [isExpense, setIsExpense] = useState(false)
  const [amount, setAmount] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isFreeTier, setIsFreeTier] = useState(false)
  const [expected, setExpected] = useState('')
  const [convertsAt, setConvertsAt] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!me) return
    setBusy(true)
    setErr(null)

    let receipt_url: string | null = null
    if (file) {
      const path = `${workspaceId}/${crypto.randomUUID()}-${file.name}`
      const { error } = await supabase.storage.from('receipts').upload(path, file)
      if (error) { setErr(error.message); setBusy(false); return }
      receipt_url = supabase.storage.from('receipts').getPublicUrl(path).data.publicUrl
    }

    const { error } = await supabase.from('entries').insert({
      workspace_id: workspaceId,
      member_id: me.id,
      text,
      is_expense: isExpense,
      amount: isExpense && amount ? Number(amount) : null,
      receipt_url,
      is_free_tier: isFreeTier,
      expected_cost: isFreeTier && expected ? Number(expected) : null,
      converts_at: isFreeTier && convertsAt ? convertsAt : null,
    })
    setBusy(false)
    if (error) return setErr(error.message)

    setText(''); setIsExpense(false); setAmount(''); setFile(null)
    setIsFreeTier(false); setExpected(''); setConvertsAt('')
    onDone()
  }

  const check = 'flex items-center gap-2 text-sm text-muted'

  return (
    <Card className="mb-8 p-4">
      <form onSubmit={submit}>
      <textarea
        rows={2}
        required
        placeholder="Add an entry"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full resize-none bg-transparent text-sm outline-none
          placeholder:text-muted"
      />

      <div className="mt-3 flex flex-wrap gap-5 border-t border-line pt-3">
        <label className={check}>
          <input type="checkbox" checked={isExpense}
            onChange={(e) => setIsExpense(e.target.checked)} />
          Expense
        </label>
        <label className={check}>
          <input type="checkbox" checked={isFreeTier}
            onChange={(e) => setIsFreeTier(e.target.checked)} />
          Free tier
        </label>
      </div>

      {isExpense && (
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <Label>Amount</Label>
            <Input type="number" step="0.01" min="0" placeholder="0.00"
              value={amount} onChange={(e) => setAmount(e.target.value)}
              className="w-32" />
          </div>
          <div>
            <Label>Receipt</Label>
            <input type="file" accept="image/*,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="pb-2 text-xs text-muted file:mr-2 file:rounded file:border
                file:border-line file:bg-surface file:px-2 file:py-1 file:text-xs" />
          </div>
        </div>
      )}

      {isFreeTier && (
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <Label>Expected cost</Label>
            <Input type="number" step="0.01" min="0" placeholder="0.00"
              value={expected} onChange={(e) => setExpected(e.target.value)}
              className="w-36" />
          </div>
          <div>
            <Label>Converts on</Label>
            <Input type="date" value={convertsAt}
              onChange={(e) => setConvertsAt(e.target.value)} className="w-40" />
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <Button type="submit" disabled={busy || !me}>
          {busy ? 'Saving…' : 'Add entry'}
        </Button>
        {err && <span className="text-sm text-berry">{err}</span>}
      </div>
      </form>
    </Card>
  )
}
