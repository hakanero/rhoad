import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Button, Card, Input, Label, Select } from './ui'
import { CATEGORIES, CATEGORY_LABEL, type Category, type Member } from '../lib/types'

export default function ExpenseComposer({
  workspaceId, me, onDone,
}: { workspaceId: string; me: Member | null; onDone: () => void }) {
  const [text, setText] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<Category>('software')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [file, setFile] = useState<File | null>(null)
  const [upcoming, setUpcoming] = useState(false)
  const [expected, setExpected] = useState('')
  const [startsAt, setStartsAt] = useState('')
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

    // Column names predate the rename: is_upcoming / upcoming_amount /
    // upcoming_from now mean "has an upcoming cost" / amount / start date.
    const { error } = await supabase.from('entries').insert({
      workspace_id: workspaceId,
      member_id: me.id,
      text,
      category,
      occurred_at: date,
      is_expense: amount !== '',
      amount: amount !== '' ? Number(amount) : null,
      receipt_url,
      is_upcoming: upcoming,
      upcoming_amount: upcoming && expected ? Number(expected) : null,
      upcoming_from: upcoming && startsAt ? startsAt : null,
    })
    setBusy(false)
    if (error) return setErr(error.message)

    setText(''); setAmount(''); setFile(null); setDate(new Date().toISOString().slice(0, 10))
    setUpcoming(false); setExpected(''); setStartsAt('')
    onDone()
  }

  return (
    <Card className="mb-5 p-4">
      <form onSubmit={submit}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-[minmax(0,1fr)_140px_150px_130px]">
          <div>
            <Label>Description</Label>
            <Input required placeholder="Domain, subscription, tool…"
              value={text} onChange={(e) => setText(e.target.value)} />
          </div>
          <div>
            <Label>Date</Label>
            <Input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
            </Select>
          </div>
          <div>
            <Label>Amount paid</Label>
            <Input type="number" step="0.01" min="0" placeholder="0.00"
              value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
          <div>
            <Label>Receipt</Label>
            <input type="file" accept="image/*,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full pb-1.5 text-xs text-muted file:mr-2 file:rounded-md
                file:border file:border-line file:bg-surface file:px-2.5 file:py-1
                file:text-xs file:font-medium file:text-ink" />
          </div>
          <label className="flex items-center gap-2 pb-2 text-sm text-muted">
            <input type="checkbox" checked={upcoming}
              onChange={(e) => setUpcoming(e.target.checked)} />
            Upcoming cost
          </label>
        </div>

        {upcoming && (
          <div className="mt-3 grid grid-cols-2 gap-3 rounded-lg bg-sunken p-3">
            <div>
              <Label>Expected amount</Label>
              <Input type="number" step="0.01" min="0" placeholder="0.00"
                value={expected} onChange={(e) => setExpected(e.target.value)} />
            </div>
            <div>
              <Label>Starting</Label>
              <Input type="date" value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)} />
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center gap-3 border-t border-line pt-3">
          <Button type="submit" size="sm"
            disabled={busy || !me || !text.trim() || (amount === '' && !upcoming)}>
            {busy ? 'Saving…' : 'Add expense'}
          </Button>
          {err && <span className="text-sm text-berry">{err}</span>}
        </div>
      </form>
    </Card>
  )
}
