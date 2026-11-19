import { CheckCircle2, Clock, RotateCcw, XCircle } from 'lucide-react'
import { PAYMENT_STATUS_INFO } from '../lib/constants'

const TONES = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  amber: 'bg-amber-50 text-amber-800 border-amber-100',
  red: 'bg-red-50 text-red-700 border-red-100',
  slate: 'bg-slate-50 text-slate-700 border-slate-200',
}
const ICONS = { emerald: CheckCircle2, amber: Clock, red: XCircle, slate: RotateCcw }

function info(status) {
  return PAYMENT_STATUS_INFO[status] || { label: status || 'Pending', tone: 'amber', note: '' }
}

/** Small coloured pill for order lists, e.g. "Order confirmed". */
export function PaymentStatusBadge({ status }) {
  const { label, tone } = info(status)
  const Icon = ICONS[tone]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap ${TONES[tone]}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  )
}

/** Larger box for the order page: label plus a one-line explanation. */
export function PaymentStatusBox({ status, method }) {
  const { label, tone, note } = info(status)
  const Icon = ICONS[tone]
  return (
    <div className={`flex items-start gap-3 rounded-2xl border p-4 ${TONES[tone]}`} role="status">
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="font-semibold">{label}</p>
        <p className="mt-0.5 text-sm opacity-90">
          {method ? `${method} · ` : ''}
          {note}
        </p>
      </div>
    </div>
  )
}
