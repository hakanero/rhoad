import { useState } from 'react'
import { useWs } from '../../lib/ctx'
import { supabase } from '../../lib/supabase'
import {
  Avatar, Button, Card, CardHeader, Empty, Figures, Input, Label, money,
} from '../../components/ui'
import { I } from '../../components/icons'
import EntryEditor from '../../components/EntryEditor'
import type { Entry } from '../../lib/types'

export default function Income() {
  const ws = useWs()
  const byId = new Map(ws.members.map((m) => [m.id, m]))
  const [editing, setEditing] = useState<Entry | null>(null)
  const rows = ws.entries.filter((e) => e.is_income)
    .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))
  const sources = new Set(rows.map((r) => (r.source ?? '').trim()).filter(Boolean))

  return (
    <>
      <Figures items={[
        { label: 'Total received', value: money(ws.received), accent: true },
        { label: 'Payments', value: `${rows.length} · ${rows.filter((e) => e.receipt_url).length} with proof` },
        { label: 'Sources', value: sources.size === 0 ? 'None' : [...sources].slice(0, 3).join(', ') },
        { label: 'Total paid, for comparison', value: money(ws.invested) },
      ]} />

      <IncomeComposer />

      <Card>
        <CardHeader title="Payments received" sub={`${rows.length} ${rows.length === 1 ? 'item' : 'items'}`} />
        {rows.length === 0 ? (
          <Empty icon={<I.receipt />} title="No income recorded"
            sub="Money the company has received appears here." />
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-[11px] font-medium
                tracking-wide text-faint uppercase">
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="py-2 font-medium">Description</th>
                <th className="py-2 font-medium">From</th>
                <th className="py-2 font-medium">Received by</th>
                <th className="py-2 text-right font-medium">Amount</th>
                <th className="py-2 pr-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((e) => {
                const m = byId.get(e.member_id)
                return (
                  <tr key={e.id} className="group transition-colors hover:bg-hover/30">
                    <td className="px-4 py-2.5 whitespace-nowrap text-muted tabular-nums">
                      {new Date(e.occurred_at + 'T00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="flex items-center gap-2">
                        <span className="truncate">{e.text}</span>
                        {e.receipt_url && (
                          <a href={e.receipt_url} target="_blank" rel="noreferrer" title="Proof"
                            className="text-faint hover:text-ink"><I.receipt /></a>
                        )}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-muted">{e.source || '—'}</td>
                    <td className="py-2.5 pr-4">
                      <span className="flex items-center gap-1.5 whitespace-nowrap">
                        <Avatar color={m?.color ?? 'dusk'} name={m?.name ?? null} />
                        <span className="text-muted">{m?.name ?? 'Unnamed'}</span>
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-medium tabular-nums text-slate">
                      {money(Number(e.amount ?? 0))}
                    </td>
                    <td className="py-2.5 pr-3 text-right">
                      <button onClick={() => setEditing(e)} title="Edit"
                        className="rounded p-1 text-faint opacity-0 transition-opacity group-hover:opacity-100 hover:bg-hover hover:text-ink">
                        <I.edit />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        )}
      </Card>

      {editing && <EntryEditor entry={editing} onClose={() => setEditing(null)} onDone={ws.refresh} />}

      {rows.length > 0 && (
        <p className="mt-4 text-[11px] leading-relaxed text-faint">
          Money received before an entity exists is generally received by a person, not
          a company. How it is treated depends on structure and jurisdiction; this record
          is informational.
        </p>
      )}
    </>
  )
}

function IncomeComposer() {
  const ws = useWs()
  const [text, setText] = useState('')
  const [source, setSource] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!ws.me) return
    setBusy(true)
    setErr(null)
    let receipt_url: string | null = null
    if (file) {
      const path = `${ws.workspace!.id}/${crypto.randomUUID()}-${file.name}`
      const { error } = await supabase.storage.from('receipts').upload(path, file)
      if (error) { setErr(error.message); setBusy(false); return }
      receipt_url = supabase.storage.from('receipts').getPublicUrl(path).data.publicUrl
    }
    const { error } = await supabase.from('entries').insert({
      workspace_id: ws.workspace!.id, member_id: ws.me.id, text,
      is_income: true, amount: Number(amount), source: source.trim() || null, receipt_url,
      category: 'other', occurred_at: date,
    })
    setBusy(false)
    if (error) return setErr(error.message)
    setText(''); setSource(''); setAmount(''); setFile(null); setDate(new Date().toISOString().slice(0, 10))
    ws.refresh()
  }

  return (
    <Card className="mb-5 p-4">
      <form onSubmit={submit}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-[minmax(0,1fr)_140px_160px_130px]">
          <div>
            <Label>Description</Label>
            <Input required placeholder="Pilot fee, deposit, consulting…"
              value={text} onChange={(e) => setText(e.target.value)} />
          </div>
          <div>
            <Label>Date</Label>
            <Input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label>From</Label>
            <Input placeholder="Customer or payer"
              value={source} onChange={(e) => setSource(e.target.value)} />
          </div>
          <div>
            <Label>Amount received</Label>
            <Input type="number" step="0.01" min="0.01" required placeholder="0.00"
              value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
        </div>
        <div className="mt-3">
          <Label>Proof of payment</Label>
          <input type="file" accept="image/*,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block pb-1.5 text-xs text-muted file:mr-2 file:rounded-md file:border
              file:border-line file:bg-surface file:px-2.5 file:py-1 file:text-xs
              file:font-medium file:text-ink" />
        </div>
        <div className="mt-4 flex items-center gap-3 border-t border-line pt-3">
          <Button type="submit" size="sm" disabled={busy || !ws.me || !text.trim() || !amount}>
            {busy ? 'Saving…' : 'Add income'}
          </Button>
          {err && <span className="text-sm text-berry">{err}</span>}
        </div>
      </form>
    </Card>
  )
}
