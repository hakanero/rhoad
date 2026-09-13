import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Button, Card, CardHeader, Input, Label, Select } from './ui'
import { CATEGORIES, CATEGORY_LABEL, type Category, type Entry } from '../lib/types'

// Edit or delete any entry — log line, expense, or income. One dialog
// so every surface corrects data the same way.
export default function EntryEditor({ entry, onClose, onDone }: {
  entry: Entry; onClose: () => void; onDone: () => void
}) {
  const kind = entry.is_income ? 'income' : entry.is_expense || entry.is_upcoming ? 'expense' : 'log'
  const [text, setText] = useState(entry.text)
  const [date, setDate] = useState(entry.occurred_at)
  const [amount, setAmount] = useState(entry.amount == null ? '' : String(entry.amount))
  const [category, setCategory] = useState<Category>(entry.category ?? 'other')
  const [source, setSource] = useState(entry.source ?? '')
  const [upcoming, setUpcoming] = useState(entry.is_upcoming)
  const [upAmount, setUpAmount] = useState(entry.upcoming_amount == null ? '' : String(entry.upcoming_amount))
  const [upFrom, setUpFrom] = useState(entry.upcoming_from ?? '')
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setErr(null)
    const patch: Partial<Entry> = { text: text.trim(), occurred_at: date }
    if (kind === 'expense') {
      Object.assign(patch, {
        is_expense: amount !== '', amount: amount !== '' ? Number(amount) : null, category,
        is_upcoming: upcoming,
        upcoming_amount: upcoming && upAmount ? Number(upAmount) : null,
        upcoming_from: upcoming && upFrom ? upFrom : null,
      })
    }
    if (kind === 'income') Object.assign(patch, { amount: Number(amount), source: source.trim() || null })
    const { error } = await supabase.from('entries').update(patch).eq('id', entry.id)
    setBusy(false)
    if (error) return setErr(error.message)
    onDone(); onClose()
  }

  async function remove() {
    setBusy(true)
    const { error } = await supabase.from('entries').delete().eq('id', entry.id)
    setBusy(false)
    if (error) return setErr(error.message)
    onDone(); onClose()
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-ink/30 p-4" onClick={onClose}>
      <Card className="w-full max-w-lg" >
        <div onClick={(e) => e.stopPropagation()}>
          <CardHeader title={kind === 'income' ? 'Edit income' : kind === 'expense' ? 'Edit expense' : 'Edit entry'} />
          <form onSubmit={save} className="space-y-3 p-4">
            <div>
              <Label>Description</Label>
              <Input required value={text} onChange={(e) => setText(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date</Label>
                <Input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              {kind !== 'log' && (
                <div>
                  <Label>{kind === 'income' ? 'Amount received' : 'Amount paid'}</Label>
                  <Input type="number" step="0.01" min="0" value={amount}
                    required={kind === 'income'} onChange={(e) => setAmount(e.target.value)} />
                </div>
              )}
            </div>
            {kind === 'expense' && (
              <>
                <div className="grid grid-cols-2 items-end gap-3">
                  <div>
                    <Label>Category</Label>
                    <Select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
                    </Select>
                  </div>
                  <label className="flex items-center gap-2 pb-2 text-sm text-muted">
                    <input type="checkbox" checked={upcoming} onChange={(e) => setUpcoming(e.target.checked)} />
                    Upcoming cost
                  </label>
                </div>
                {upcoming && (
                  <div className="grid grid-cols-2 gap-3 rounded-lg bg-sunken p-3">
                    <div>
                      <Label>Expected amount</Label>
                      <Input type="number" step="0.01" min="0" value={upAmount} onChange={(e) => setUpAmount(e.target.value)} />
                    </div>
                    <div>
                      <Label>Starting</Label>
                      <Input type="date" value={upFrom} onChange={(e) => setUpFrom(e.target.value)} />
                    </div>
                  </div>
                )}
              </>
            )}
            {kind === 'income' && (
              <div>
                <Label>From</Label>
                <Input value={source} onChange={(e) => setSource(e.target.value)} />
              </div>
            )}
            {err && <p className="text-sm text-berry">{err}</p>}
            <div className="flex items-center gap-2 border-t border-line pt-3">
              <Button type="submit" size="sm" disabled={busy}>Save</Button>
              <Button type="button" size="sm" variant="quiet" onClick={onClose}>Cancel</Button>
              <span className="ml-auto">
                {confirm ? (
                  <span className="flex items-center gap-2 text-xs">
                    <span className="text-muted">Delete this entry?</span>
                    <button type="button" onClick={remove} disabled={busy} className="font-medium text-berry">Delete</button>
                    <button type="button" onClick={() => setConfirm(false)} className="text-muted">Keep</button>
                  </span>
                ) : (
                  <button type="button" onClick={() => setConfirm(true)} className="text-xs text-muted hover:text-berry">
                    Delete
                  </button>
                )}
              </span>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}
