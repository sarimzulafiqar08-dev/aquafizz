import { Banknote, Building2, Check, Copy, ImagePlus, Smartphone, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Field, inputClass } from '../components/Field'
import { EmptyState, ErrorState, PageHeader, Spinner } from '../components/Feedback'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useCheckout } from '../context/CheckoutContext'
import { useToast } from '../context/ToastContext'
import { useAsync } from '../hooks/useAsync'
import { usePageSeo } from '../hooks/usePageSeo'
import { CONTACT, PAYMENT_METHODS, PAYMENT_STATUSES } from '../lib/constants'
import { estimateDelivery, formatPKR } from '../lib/format'
import { placeOrder as placeOrderRequest } from '../services/orderService'
import { getPaymentSettings, isMethodReady, uploadPaymentProof } from '../services/paymentService'
import { OrderSummary } from './CartPage'

const ICONS = { cod: Banknote, jazzcash: Smartphone, easypaisa: Smartphone, bank: Building2 }

function CopyRow({ label, value }) {
  const { push } = useToast()
  const [copied, setCopied] = useState(false)
  if (!value) return null
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="truncate font-semibold tracking-wide">{value}</p>
      </div>
      <button
        type="button"
        aria-label={`Copy ${label}`}
        className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          } catch {
            push('Could not copy — please copy it manually.', 'error')
          }
        }}
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}

function AccountDetails({ methodId, settings, total }) {
  const m = settings[methodId]
  if (methodId === 'cod') {
    return <p className="rounded-3xl bg-slate-50 p-5 text-sm text-slate-600">Pay the rider in cash when your drinks arrive.</p>
  }
  const label = PAYMENT_METHODS.find((x) => x.id === methodId).label
  return (
    <div className="rounded-3xl bg-light-aqua p-5 text-sm">
      <p className="font-semibold">
        Send <span className="text-primary-dark">{formatPKR(total)}</span> via {label}
      </p>
      <div className="mt-2 divide-y divide-white">
        {methodId === 'bank' ? <CopyRow label="Bank" value={m.bankName} /> : null}
        <CopyRow label="Account title" value={m.accountTitle} />
        <CopyRow label={methodId === 'bank' ? 'Account number' : `${label} number`} value={m.accountNumber} />
        {methodId === 'bank' ? <CopyRow label="IBAN" value={m.iban} /> : null}
      </div>
      {settings.instructions ? <p className="mt-2 text-xs text-slate-600">{settings.instructions}</p> : null}
    </div>
  )
}

export function PaymentPage() {
  usePageSeo({
    title: 'Payment | AquaFizz',
    description: 'Pay with Cash on Delivery, JazzCash, Easypaisa or bank transfer.',
  })
  const { items, summary, clearCart } = useCart()
  const { draft, update, reset } = useCheckout()
  const { push } = useToast()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: settings, loading, error, reload } = useAsync(getPaymentSettings, [], null)
  const [busy, setBusy] = useState(false)
  const [proofFile, setProofFile] = useState(null)
  const [proofPreview, setProofPreview] = useState('')
  const [transactionId, setTransactionId] = useState('')

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        action={
          <Link to="/products" className="rounded-full bg-primary px-5 py-3 text-sm font-semibold">
            Start Shopping
          </Link>
        }
      />
    )
  }
  if (loading) {
    return (
      <div className="grid min-h-[40vh] place-items-center text-primary">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }
  if (error) return <ErrorState title="Could not load payment options" description={error} onRetry={reload} />

  const available = PAYMENT_METHODS.filter((m) => isMethodReady(settings, m.id))
  const method = available.find((m) => m.id === draft.paymentMethod) || available[0]

  if (!method) {
    return (
      <ErrorState
        title="Payments are temporarily unavailable"
        description={`Please contact us on WhatsApp (${CONTACT.whatsapp}) to complete your order.`}
      />
    )
  }
  const needsProof = method.requiresProof

  const pickProof = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      push('Please choose a screenshot image (JPG or PNG).', 'error')
      return
    }
    if (proofPreview) URL.revokeObjectURL(proofPreview)
    setProofFile(file)
    setProofPreview(URL.createObjectURL(file))
  }

  const placeOrder = async () => {
    if (needsProof && !proofFile) {
      push('Please attach your payment screenshot.', 'error')
      return
    }
    if (needsProof && transactionId.trim().length < 4) {
      push('Please enter the transaction ID (TID) from your payment.', 'error')
      return
    }
    setBusy(true)
    let order
    try {
      const proof = needsProof ? await uploadPaymentProof(proofFile) : ''
      order = await placeOrderRequest({
        userId: user?.id || null,
        items,
        totals: summary,
        delivery: draft,
        paymentMethod: method.label,
        paymentStatus: needsProof ? PAYMENT_STATUSES.pending : PAYMENT_STATUSES.codPending,
        payment: needsProof
          ? { method: method.id, transactionId: transactionId.trim(), proof, submittedAt: new Date().toISOString() }
          : { method: method.id },
        estimatedDelivery: estimateDelivery(draft.deliveryWindow),
      })
    } catch (err) {
      push(err.message, 'error')
      setBusy(false)
      return
    }
    clearCart()
    reset()
    push('Order placed successfully')
    navigate(`/order-success?id=${order.id}`)
  }

  return (
    <div>
      <PageHeader
        title="Payment"
        description="Choose how you'd like to pay. Online payments are verified by our team before dispatch."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {available.map((option) => {
              const Icon = ICONS[option.id]
              const selected = method.id === option.id
              return (
                <label
                  key={option.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-3xl border p-4 transition ${
                    selected ? 'border-primary bg-light-aqua' : 'border-slate-200 hover:border-primary/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="pay"
                    className="sr-only"
                    checked={selected}
                    onChange={() => update({ paymentMethod: option.id })}
                  />
                  <span className={`grid h-10 w-10 place-items-center rounded-full ${selected ? 'bg-primary text-black' : 'bg-slate-100'}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-semibold">{option.label}</span>
                    <span className="text-xs text-slate-500">{option.requiresProof ? 'Upload screenshot after paying' : 'Pay when it arrives'}</span>
                  </span>
                </label>
              )
            })}
          </div>

          <AccountDetails methodId={method.id} settings={settings} total={summary.total} />

          {needsProof ? (
            <div className="grid gap-4 rounded-3xl border border-slate-100 p-5">
              <Field id="tid" label="Transaction ID (TID)" hint={`Shown in your ${method.id === 'bank' ? 'banking' : method.label} app or SMS after sending.`}>
                <input
                  id="tid"
                  className={inputClass}
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="e.g. 0123456789"
                  autoComplete="off"
                />
              </Field>
              <div>
                <p className="text-sm font-medium text-slate-800">Payment screenshot</p>
                {proofPreview ? (
                  <div className="relative mt-2 w-40">
                    <img src={proofPreview} alt="Payment screenshot preview" className="h-56 w-40 rounded-2xl border border-slate-100 bg-white object-contain" />
                    <button
                      type="button"
                      aria-label="Remove screenshot"
                      className="absolute top-2 right-2 grid h-8 w-8 place-items-center rounded-full bg-white shadow"
                      onClick={() => {
                        URL.revokeObjectURL(proofPreview)
                        setProofFile(null)
                        setProofPreview('')
                      }}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="proof"
                    className="mt-2 flex cursor-pointer flex-col items-center gap-1 rounded-3xl border-2 border-dashed border-slate-200 px-4 py-8 text-sm text-slate-500 transition hover:border-primary hover:text-primary-dark"
                  >
                    <ImagePlus className="h-6 w-6" />
                    Tap to upload screenshot
                  </label>
                )}
                <input id="proof" type="file" accept="image/*" className="sr-only" onChange={(e) => pickProof(e.target.files?.[0])} />
              </div>
            </div>
          ) : null}

          <button
            type="button"
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 font-semibold disabled:opacity-60"
            onClick={placeOrder}
          >
            {busy ? <Spinner /> : null}
            {busy ? 'Placing order…' : `Place order · ${formatPKR(summary.total)}`}
          </button>
          <a className="block text-center text-sm text-primary-dark" href={`https://wa.me/${CONTACT.whatsapp}`}>
            Need help? WhatsApp support
          </a>
        </div>
        <OrderSummary />
      </div>
    </div>
  )
}
