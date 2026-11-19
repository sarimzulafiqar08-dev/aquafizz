import { Banknote, Building2, CheckCircle2, ExternalLink, Smartphone, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { EmptyState, ErrorState, FormError, PageHeader, Spinner } from '../../components/Feedback'
import { Field, inputClass } from '../../components/Field'
import { useConfirm } from '../../context/ConfirmContext'
import { useToast } from '../../context/ToastContext'
import { useAsync } from '../../hooks/useAsync'
import { usePageSeo } from '../../hooks/usePageSeo'
import { PAYMENT_STATUSES } from '../../lib/constants'
import { formatPKR } from '../../lib/format'
import { listOrders, updateOrderStatus, updatePaymentStatus } from '../../services/orderService'
import { getPaymentSettings, getProofUrl, savePaymentSettings } from '../../services/paymentService'

const TABS = [
  { id: 'verify', label: 'Confirm payments' },
  { id: 'settings', label: 'Payment settings' },
]

function PaymentBadge({ status }) {
  const tone =
    status === PAYMENT_STATUSES.paid || status === PAYMENT_STATUSES.codConfirmed
      ? 'bg-emerald-50 text-emerald-700'
      : status === PAYMENT_STATUSES.rejected
        ? 'bg-red-50 text-red-700'
        : status === PAYMENT_STATUSES.refunded
          ? 'bg-slate-100 text-slate-700'
          : 'bg-amber-50 text-amber-700'
  return <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${tone}`}>{status}</span>
}

function ProofImage({ proof }) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    let live = true
    getProofUrl(proof)
      .then((u) => live && setUrl(u))
      .catch((err) => live && setError(err.message))
    return () => {
      live = false
    }
  }, [proof])
  if (!proof) return <p className="text-xs text-slate-500">No screenshot uploaded.</p>
  if (error) return <p className="text-xs text-red-600">{error}</p>
  if (!url) return <div className="h-56 w-40 animate-pulse rounded-2xl bg-slate-100" />
  return (
    <a href={url} target="_blank" rel="noreferrer" className="group relative block w-40" title="Open full size">
      <img src={url} alt="Payment screenshot" className="h-56 w-40 rounded-2xl border border-slate-100 bg-white object-contain" />
      <span className="absolute right-2 bottom-2 grid h-7 w-7 place-items-center rounded-full bg-white/95 shadow-sm">
        <ExternalLink className="h-3.5 w-3.5" />
      </span>
    </a>
  )
}

function VerifyPayments() {
  const { push } = useToast()
  const { confirm } = useConfirm()
  const { data: orders, setData: setOrders, loading, error, reload } = useAsync(listOrders, [], [])
  const [filter, setFilter] = useState(PAYMENT_STATUSES.pending)
  const [busyId, setBusyId] = useState('')

  // Online payments wait for a screenshot check; Cash on Delivery orders wait for a confirmation.
  const FILTERS = [
    { status: PAYMENT_STATUSES.pending, label: 'Online to verify' },
    { status: PAYMENT_STATUSES.codPending, label: 'COD to confirm' },
    { status: PAYMENT_STATUSES.paid, label: 'Paid' },
    { status: PAYMENT_STATUSES.codConfirmed, label: 'COD confirmed' },
    { status: PAYMENT_STATUSES.rejected, label: 'Rejected' },
    { status: '', label: 'All' },
  ]
  const visible = filter ? orders.filter((o) => o.paymentStatus === filter) : orders
  const count = (status) => (status ? orders.filter((o) => o.paymentStatus === status).length : orders.length)
  const isCod = (o) =>
    (o.payment?.method || '') === 'cod' ||
    o.paymentStatus === PAYMENT_STATUSES.codPending ||
    o.paymentStatus === PAYMENT_STATUSES.codConfirmed

  const review = async (order, status) => {
    if (status === PAYMENT_STATUSES.rejected) {
      const ok = await confirm({
        title: isCod(order) ? `Reject COD order ${order.id}?` : `Reject payment for ${order.id}?`,
        message: isCod(order)
          ? 'Use this when the order looks fake or the customer cannot be reached. Cancel the order from Orders afterwards.'
          : 'Use this when the money did not arrive or the screenshot is not valid. Contact the customer before cancelling the order.',
        confirmLabel: 'Reject',
      })
      if (!ok) return
    }
    setBusyId(order.id)
    try {
      let updated = await updatePaymentStatus(order.id, status)
      // Confirming a payment (or a COD order) also confirms a freshly placed order, so the
      // customer sees "Confirmed" on their order page.
      const confirming = status === PAYMENT_STATUSES.paid || status === PAYMENT_STATUSES.codConfirmed
      if (confirming && updated.status === 'Placed') updated = await updateOrderStatus(order.id, 'Confirmed')
      setOrders((list) => list.map((o) => (o.id === updated.id ? updated : o)))
      push(
        status === PAYMENT_STATUSES.codConfirmed
          ? `${order.id}: COD order confirmed — the customer can see it now`
          : `${order.id}: payment ${status.toLowerCase()}`,
      )
    } catch (err) {
      push(err.message, 'error')
    } finally {
      setBusyId('')
    }
  }

  return (
    <div>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.status || 'all'}
            type="button"
            className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-medium ${
              filter === f.status ? 'bg-primary text-black' : 'border border-slate-200 bg-white text-slate-600'
            }`}
            onClick={() => setFilter(f.status)}
          >
            {f.label} ({count(f.status)})
          </button>
        ))}
      </div>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-3xl bg-slate-100" />
          ))}
        </div>
      ) : error ? (
        <ErrorState description={error} onRetry={reload} />
      ) : visible.length === 0 ? (
        <EmptyState
          title={
            filter === PAYMENT_STATUSES.pending || filter === PAYMENT_STATUSES.codPending ? 'Nothing to confirm' : 'No orders here'
          }
          description="Online payments appear here with their screenshots; Cash on Delivery orders appear under COD to confirm."
        />
      ) : (
        <ul className="space-y-3">
          {visible.map((o) => {
            const p = o.payment || {}
            return (
              <li key={o.id} className="grid gap-4 rounded-3xl border border-slate-100 bg-white p-4 sm:grid-cols-[10rem_1fr]">
                {isCod(o) ? (
                  <div className="grid h-56 w-40 place-items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-3 text-center text-xs text-slate-500">
                    <span>
                      <Banknote className="mx-auto mb-2 h-8 w-8 text-emerald-600" />
                      Cash on Delivery
                      <br />
                      No screenshot needed
                    </span>
                  </div>
                ) : (
                  <ProofImage proof={p.proof} />
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{o.id}</p>
                    <PaymentBadge status={o.paymentStatus} />
                  </div>
                  <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-slate-500">Amount due</dt>
                      <dd className="text-lg font-bold">{formatPKR(o.totals?.total)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Method</dt>
                      <dd className="font-medium">{o.paymentMethod}</dd>
                    </div>
                    {isCod(o) ? (
                      <div>
                        <dt className="text-xs text-slate-500">Deliver to</dt>
                        <dd className="break-words">{[o.delivery?.address, o.delivery?.area].filter(Boolean).join(', ')}</dd>
                      </div>
                    ) : (
                      <div>
                        <dt className="text-xs text-slate-500">Transaction ID</dt>
                        <dd className="font-mono font-medium break-all">{p.transactionId || '—'}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-xs text-slate-500">Customer</dt>
                      <dd>
                        {o.delivery?.name} · <a className="text-primary-dark" href={`tel:${o.delivery?.phone}`}>{o.delivery?.phone}</a>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Placed</dt>
                      <dd>{new Date(o.createdAt).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' })}</dd>
                    </div>
                    {p.reviewedAt ? (
                      <div>
                        <dt className="text-xs text-slate-500">Reviewed</dt>
                        <dd>{new Date(p.reviewedAt).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' })}</dd>
                      </div>
                    ) : null}
                  </dl>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {o.paymentStatus === PAYMENT_STATUSES.codPending ? (
                      <button
                        type="button"
                        disabled={busyId === o.id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                        onClick={() => review(o, PAYMENT_STATUSES.codConfirmed)}
                      >
                        {busyId === o.id ? <Spinner /> : <CheckCircle2 className="h-4 w-4" />}
                        Confirm COD order
                      </button>
                    ) : null}
                    {o.paymentStatus !== PAYMENT_STATUSES.paid && o.paymentStatus !== PAYMENT_STATUSES.codPending ? (
                      <button
                        type="button"
                        disabled={busyId === o.id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                        onClick={() => review(o, PAYMENT_STATUSES.paid)}
                      >
                        {busyId === o.id ? <Spinner /> : <CheckCircle2 className="h-4 w-4" />}
                        {isCod(o) ? 'Cash received' : 'Mark as paid'}
                      </button>
                    ) : null}
                    {o.paymentStatus !== PAYMENT_STATUSES.rejected ? (
                      <button
                        type="button"
                        disabled={busyId === o.id}
                        className="inline-flex items-center gap-1.5 rounded-full border border-red-100 px-4 py-2 text-sm font-semibold text-red-600 disabled:opacity-60"
                        onClick={() => review(o, PAYMENT_STATUSES.rejected)}
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                    ) : null}
                    {o.paymentStatus === PAYMENT_STATUSES.paid ? (
                      <button
                        type="button"
                        disabled={busyId === o.id}
                        className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium disabled:opacity-60"
                        onClick={() => review(o, PAYMENT_STATUSES.refunded)}
                      >
                        Mark refunded
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function MethodCard({ icon: Icon, title, enabled, onToggle, children }) {
  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-light-aqua text-primary-dark">
            <Icon className="h-4 w-4" />
          </span>
          {title}
        </h2>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
          <span className="text-slate-500">{enabled ? 'Enabled' : 'Disabled'}</span>
          <input type="checkbox" className="peer sr-only" checked={enabled} onChange={(e) => onToggle(e.target.checked)} />
          <span className="relative h-6 w-11 rounded-full bg-slate-200 transition after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:bg-primary peer-checked:after:translate-x-5 peer-focus-visible:outline-2 peer-focus-visible:outline-primary" />
        </label>
      </div>
      {enabled && children ? <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div> : null}
    </section>
  )
}

function PaymentSettings() {
  const { push } = useToast()
  const { data: saved, loading, error: loadError, reload } = useAsync(getPaymentSettings, [], null)
  const [form, setForm] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (saved) setForm(saved)
  }, [saved])

  if (loading || (!form && !loadError)) {
    return (
      <div className="grid min-h-[30vh] place-items-center text-primary">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }
  if (loadError) return <ErrorState description={loadError} onRetry={reload} />

  const set = (method, key) => (e) => setForm((f) => ({ ...f, [method]: { ...f[method], [key]: e.target.value } }))
  const toggle = (method) => (enabled) => setForm((f) => ({ ...f, [method]: { ...f[method], enabled } }))

  return (
    <form
      className="grid gap-4"
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        setError('')
        try {
          setForm(await savePaymentSettings(form))
          push('Payment settings saved — customers see them at checkout now')
        } catch (err) {
          setError(err.message)
        } finally {
          setBusy(false)
        }
      }}
    >
      <FormError message={error} />
      <MethodCard icon={CheckCircle2} title="Cash on Delivery" enabled={form.cod.enabled} onToggle={toggle('cod')} />
      <MethodCard icon={Smartphone} title="JazzCash" enabled={form.jazzcash.enabled} onToggle={toggle('jazzcash')}>
        <Field id="jc-title" label="Account title">
          <input id="jc-title" className={inputClass} value={form.jazzcash.accountTitle} onChange={set('jazzcash', 'accountTitle')} />
        </Field>
        <Field id="jc-number" label="JazzCash number" hint="11 digits, e.g. 03001234567">
          <input id="jc-number" inputMode="tel" className={inputClass} value={form.jazzcash.accountNumber} onChange={set('jazzcash', 'accountNumber')} />
        </Field>
      </MethodCard>
      <MethodCard icon={Smartphone} title="Easypaisa" enabled={form.easypaisa.enabled} onToggle={toggle('easypaisa')}>
        <Field id="ep-title" label="Account title">
          <input id="ep-title" className={inputClass} value={form.easypaisa.accountTitle} onChange={set('easypaisa', 'accountTitle')} />
        </Field>
        <Field id="ep-number" label="Easypaisa number" hint="11 digits, e.g. 03451234567">
          <input id="ep-number" inputMode="tel" className={inputClass} value={form.easypaisa.accountNumber} onChange={set('easypaisa', 'accountNumber')} />
        </Field>
      </MethodCard>
      <MethodCard icon={Building2} title="Bank transfer" enabled={form.bank.enabled} onToggle={toggle('bank')}>
        <Field id="bank-name" label="Bank name">
          <input id="bank-name" placeholder="e.g. Meezan Bank" className={inputClass} value={form.bank.bankName} onChange={set('bank', 'bankName')} />
        </Field>
        <Field id="bank-title" label="Account title">
          <input id="bank-title" className={inputClass} value={form.bank.accountTitle} onChange={set('bank', 'accountTitle')} />
        </Field>
        <Field id="bank-number" label="Account number">
          <input id="bank-number" inputMode="numeric" className={inputClass} value={form.bank.accountNumber} onChange={set('bank', 'accountNumber')} />
        </Field>
        <Field id="bank-iban" label="IBAN (optional)" hint="24 characters, starts with PK">
          <input id="bank-iban" className={`${inputClass} uppercase`} value={form.bank.iban} onChange={set('bank', 'iban')} />
        </Field>
      </MethodCard>
      <section className="rounded-3xl border border-slate-100 bg-white p-5">
        <Field id="pay-instructions" label="Instructions shown at checkout">
          <textarea
            id="pay-instructions"
            rows={2}
            className={inputClass}
            value={form.instructions}
            onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
          />
        </Field>
      </section>
      <p className="text-xs text-slate-500">
        JazzCash, Easypaisa and bank transfer only show at checkout once their account details are filled in.
      </p>
      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center justify-center gap-2 justify-self-start rounded-full bg-primary px-6 py-3 text-sm font-semibold disabled:opacity-60"
      >
        {busy ? <Spinner /> : null}
        Save payment settings
      </button>
    </form>
  )
}

export function AdminPaymentsPage() {
  usePageSeo({ title: 'Admin payments | AquaFizz' })
  const [tab, setTab] = useState('verify')
  return (
    <div>
      <PageHeader
        title="Payments"
        description="Verify online payments, confirm Cash on Delivery orders and set the accounts customers pay into."
      />
      <div role="tablist" aria-label="Payments" className="mb-6 inline-flex rounded-full bg-white p-1 shadow-[0_8px_30px_rgb(19_143_150_/_0.1)]">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`rounded-full px-4 py-2 text-sm font-medium ${tab === t.id ? 'bg-primary text-black' : 'text-slate-600'}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'verify' ? <VerifyPayments /> : <PaymentSettings />}
    </div>
  )
}
