import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useWorkspace } from '../lib/useWorkspace'
import { rho } from '../lib/rho'
import { money } from '../components/ui'

// Mock of Rho's incorporation flow. Full-screen takeover, Rho's register
// rather than rhoad's: this is the point where the workspace hands off.
// Fields the workspace can supply are prefilled and marked; the rest are
// shown as Rho would ask for them.

const STEPS = ['Company', 'Founders', 'Equity', 'Review'] as const
type Step = (typeof STEPS)[number]

const AUTHORIZED = 10_000_000
const ISSUED = 8_000_000
const PAR = 0.00001

export default function Incorporate() {
  const { slug } = useParams()
  const ws = useWorkspace(slug)
  const [step, setStep] = useState<Step>('Company')
  const [state, setState] = useState<'edit' | 'submitting' | 'done'>('edit')
  const [filingId, setFilingId] = useState<string | null>(null)

  const w = ws.workspace
  const founders = ws.members
  const equity = useMemo(() => {
    const anySet = founders.some((m) => m.intended_equity != null)
    return founders.map((m) => ({
      member: m,
      pct: anySet ? Number(m.intended_equity ?? 0) : founders.length ? 100 / founders.length : 0,
      fromWorkspace: anySet && m.intended_equity != null,
    }))
  }, [founders])

  if (ws.loading || !w) return <div className="min-h-full bg-white" />

  const idx = STEPS.indexOf(step)
  const next = () => setStep(STEPS[Math.min(idx + 1, STEPS.length - 1)])
  const back = () => setStep(STEPS[Math.max(idx - 1, 0)])

  async function submit() {
    setState('submitting')
    const res = await rho.submitIncorporation({
      name: w!.name, purpose: w!.pitch ?? '', state: 'Delaware', entityType: 'C Corporation',
      founders: equity.map((e) => ({ name: e.member.name ?? 'Founder', equity: e.pct })),
      founderAdvances: founders.map((m) => ({
        name: m.name ?? 'Founder', amount: ws.perMember[m.id]?.outstanding ?? 0,
      })),
    })
    setFilingId(res.filingId)
    setState('done')
  }

  return (
    <div className="flex min-h-full flex-col bg-white text-[#0B0B0C]"
      style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      {/* Rho chrome */}
      <header className="flex items-center justify-between border-b border-black/10 bg-[#0B0B0C]
        px-8 py-4 text-white">
        <div className="flex items-center gap-6">
          <span className="text-[17px] font-semibold tracking-tight">Rho</span>
          <span className="text-sm text-white/60">Incorporation</span>
        </div>
        <Link to={`/w/${slug}/next`} className="text-sm text-white/60 hover:text-white">
          Return to rhoad
        </Link>
      </header>

      {state === 'done' ? (
        <Done name={w.name} filingId={filingId!} slug={slug!} />
      ) : (
        <div className="mx-auto grid w-full max-w-5xl flex-1 grid-cols-1 gap-8 px-5 py-8 md:grid-cols-[220px_1fr] md:gap-12 md:px-8 md:py-12">
          {/* stepper */}
          <ol className="flex gap-1 overflow-x-auto md:block md:space-y-1">
            {STEPS.map((s, i) => (
              <li key={s}>
                <button
                  onClick={() => i <= idx && setStep(s)}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm ${
                    s === step ? 'bg-black/[0.05] font-medium' : i < idx ? 'text-black/70' : 'text-black/35'
                  }`}
                >
                  <span className={`flex size-5 items-center justify-center rounded-full text-[11px] ${
                    i < idx ? 'bg-[#0B0B0C] text-white' : s === step ? 'border-2 border-[#0B0B0C]' : 'border border-black/25'
                  }`}>
                    {i < idx ? '✓' : i + 1}
                  </span>
                  {s}
                </button>
              </li>
            ))}
            <li className="hidden px-3 pt-6 text-[11px] leading-relaxed text-black/40 md:block">
              Fields marked <Tag /> were supplied by your rhoad workspace.
            </li>
          </ol>

          {/* content */}
          <div className="max-w-2xl">
            {step === 'Company' && (
              <Section title="Company details" sub="How the entity will be formed in Delaware.">
                <Field label="Legal name" value={`${w.name}, Inc.`} from />
                <Field label="Business purpose" value={w.pitch ?? ''} from multiline />
                <Field label="State of incorporation" value="Delaware" />
                <Field label="Entity type" value="C Corporation" />
                <Field label="Registered agent" placeholder="Provided by Rho" />
                <Field label="Principal business address" placeholder="Street, city, state, ZIP" />
              </Section>
            )}

            {step === 'Founders' && (
              <Section title="Founders" sub="Each founder will be a stockholder and, where noted, an officer.">
                {founders.map((m, i) => (
                  <div key={m.id} className="mb-6 rounded-lg border border-black/10 p-4">
                    <p className="mb-3 text-xs font-medium text-black/50 uppercase">Founder {i + 1}</p>
                    <Field label="Full legal name" value={m.name ?? ''} from />
                    <Field label="Email" placeholder="name@example.com" />
                    <Field label="Residential address" placeholder="Street, city, state, ZIP" />
                    <Field label="Government ID" placeholder="Required for identity verification" />
                    <Field label="Title" placeholder={i === 0 ? 'e.g. Chief Executive Officer' : 'e.g. Secretary'} />
                  </div>
                ))}
              </Section>
            )}

            {step === 'Equity' && (
              <Section title="Equity" sub="Authorized shares, and how issued shares are split among founders.">
                <Field label="Authorized shares" value={AUTHORIZED.toLocaleString()} />
                <Field label="Par value" value={`$${PAR}`} />
                <Field label="Issued to founders" value={ISSUED.toLocaleString()} />
                <div className="mt-6 overflow-hidden rounded-lg border border-black/10">
                  <table className="w-full text-sm">
                    <thead className="bg-black/[0.03] text-left text-xs text-black/50">
                      <tr>
                        <th className="px-4 py-2 font-medium">Founder</th>
                        <th className="px-4 py-2 text-right font-medium">Equity</th>
                        <th className="px-4 py-2 text-right font-medium">Shares</th>
                        <th className="px-4 py-2 font-medium">Vesting</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/10">
                      {equity.map((e) => (
                        <tr key={e.member.id}>
                          <td className="px-4 py-2.5">{e.member.name ?? 'Founder'}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums">
                            {e.pct.toFixed(1)}% {e.fromWorkspace && <Tag />}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums">
                            {Math.round(ISSUED * e.pct / 100).toLocaleString()}
                          </td>
                          <td className="px-4 py-2.5 text-black/60">4 years, 1-year cliff</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!equity.some((e) => e.fromWorkspace) && (
                  <p className="mt-3 text-xs text-black/50">
                    No intended split was set in rhoad; an equal split is shown.
                  </p>
                )}
              </Section>
            )}

            {step === 'Review' && (
              <Section title="Review and submit" sub="Rho will file with the Delaware Division of Corporations.">
                <Summary label="Entity" rows={[
                  ['Name', `${w.name}, Inc.`], ['Type', 'Delaware C Corporation'],
                  ['Purpose', w.pitch ?? ''],
                ]} />
                <Summary label="Founders" rows={equity.map((e) => [
                  e.member.name ?? 'Founder', `${e.pct.toFixed(1)}%`,
                ])} />
                <Summary label="Founder advances to be recorded" rows={[
                  ...founders.map((m): [string, string] => [
                    m.name ?? 'Founder', money(ws.perMember[m.id]?.outstanding ?? 0),
                  ]),
                  ['Total', money(Object.values(ws.perMember).reduce((a, l) => a + l.outstanding, 0))],
                ]} />
                <p className="mt-6 text-xs leading-relaxed text-black/50">
                  By submitting, you authorize Rho to prepare and file a certificate of
                  incorporation on your behalf. After formation, EIN, banking, and founder
                  reimbursement continue in Rho.
                </p>
              </Section>
            )}

            <div className="mt-8 flex items-center gap-3 border-t border-black/10 pt-6">
              {idx > 0 && (
                <button onClick={back} className="rounded-md border border-black/15 px-4 py-2 text-sm hover:bg-black/[0.03]">
                  Back
                </button>
              )}
              {step !== 'Review' ? (
                <button onClick={next} className="rounded-md bg-[#0B0B0C] px-4 py-2 text-sm font-medium text-white hover:bg-black/85">
                  Continue
                </button>
              ) : (
                <button onClick={submit} disabled={state === 'submitting'}
                  className="rounded-md bg-[#0B0B0C] px-4 py-2 text-sm font-medium text-white hover:bg-black/85 disabled:opacity-50">
                  {state === 'submitting' ? 'Submitting…' : 'Submit filing'}
                </button>
              )}
              <span className="ml-auto text-[11px] text-black/40">Demo — no filing is made.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- pieces ---------- */

function Tag() {
  return (
    <span className="ml-1 inline-block rounded bg-[#F7F5EF] px-1.5 py-px align-middle text-[10px]
      font-medium lowercase tracking-tight text-[#7A5C3E]">
      rhoad
    </span>
  )
}

function Section({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 mb-8 text-sm text-black/55">{sub}</p>
      {children}
    </>
  )
}

function Field({ label, value, placeholder, from, multiline }: {
  label: string; value?: string; placeholder?: string; from?: boolean; multiline?: boolean
}) {
  const cls = 'w-full rounded-md border px-3 py-2 text-sm outline-none ' +
    (value ? 'border-black/15 bg-black/[0.02]' : 'border-black/15 bg-white placeholder:text-black/30 focus:border-black')
  return (
    <label className="mb-4 block">
      <span className="mb-1.5 block text-xs font-medium text-black/60">
        {label}{from && <Tag />}
      </span>
      {multiline
        ? <textarea rows={3} defaultValue={value} readOnly={!!value} placeholder={placeholder} className={`${cls} resize-none`} />
        : <input defaultValue={value} readOnly={!!value} placeholder={placeholder} className={cls} />}
    </label>
  )
}

function Summary({ label, rows }: { label: string; rows: [string, string][] }) {
  return (
    <div className="mb-5 overflow-hidden rounded-lg border border-black/10">
      <p className="border-b border-black/10 bg-black/[0.03] px-4 py-2 text-xs font-medium text-black/50 uppercase">
        {label}
      </p>
      <dl className="divide-y divide-black/10 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[180px_1fr] gap-4 px-4 py-2.5">
            <dt className="text-black/55">{k}</dt>
            <dd className="whitespace-pre-wrap tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function Done({ name, filingId, slug }: { name: string; filingId: string; slug: string }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-8 py-16">
      <span className="mb-5 flex size-10 items-center justify-center rounded-full bg-[#0B0B0C] text-white">✓</span>
      <h1 className="text-2xl font-semibold tracking-tight">Filing submitted</h1>
      <p className="mt-2 text-sm text-black/60">
        {name}, Inc. has been submitted to the Delaware Division of Corporations.
        Filing reference <span className="font-medium text-black">{filingId}</span>.
      </p>
      <ul className="mt-6 space-y-2 text-sm text-black/70">
        <li>· Formation typically completes within 1–2 business days.</li>
        <li>· EIN, bylaws, and stock purchase agreements follow in Rho.</li>
        <li>· A Rho business account opens on formation.</li>
      </ul>
      <div className="mt-8 flex items-center gap-3">
        <button className="rounded-md bg-[#0B0B0C] px-4 py-2 text-sm font-medium text-white">
          Continue in Rho
        </button>
        <Link to={`/w/${slug}/next`} className="text-sm text-black/60 hover:text-black">
          Return to rhoad
        </Link>
      </div>
      <p className="mt-6 text-[11px] text-black/40">Demo — no filing is made.</p>
    </div>
  )
}
