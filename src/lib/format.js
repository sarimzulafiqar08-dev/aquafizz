export function formatPKR(value) {
  const amount = Number(value) || 0
  return `Rs ${amount.toLocaleString('en-PK')}`
}

export function stockLabel(stock) {
  if (stock <= 0) return 'Out of stock'
  if (stock <= 10) return `Only ${stock} left`
  return 'In stock'
}

export function generateOrderNumber() {
  const n = Math.floor(100000 + Math.random() * 900000)
  return `AF-${n}`
}

/** Value for <input type="datetime-local" min>: now + `minutes`, in local time. */
export function localDateTimeInput(minutes = 0) {
  const d = new Date(Date.now() + minutes * 60000)
  d.setSeconds(0, 0)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

/** Earliest scheduled slot customers can pick, in minutes from now. */
export const MIN_SCHEDULE_MINUTES = 60

export function scheduleError(value) {
  if (!value) return 'Please choose your preferred delivery date and time.'
  const when = new Date(value)
  if (Number.isNaN(when.getTime())) return 'Please choose a valid date and time.'
  if (when.getTime() < Date.now() + (MIN_SCHEDULE_MINUTES - 1) * 60000) {
    return 'Scheduled delivery must be at least 1 hour from now.'
  }
  if (when.getTime() > Date.now() + 14 * 24 * 60 * 60000) return 'You can schedule up to 14 days ahead.'
  return ''
}

export function estimateDelivery(windowId, scheduledAt) {
  switch (windowId) {
    case 'asap':
      return '25–45 minutes'
    case '30-60':
      return '30–60 minutes'
    case '1-2':
      return '1–2 hours'
    case 'evening':
      return 'Today evening, 6:00 PM – 10:00 PM'
    case 'schedule': {
      const when = scheduledAt ? new Date(scheduledAt) : null
      return when && !Number.isNaN(when.getTime())
        ? `Scheduled: ${when.toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' })}`
        : 'As scheduled'
    }
    default:
      return '30–60 minutes'
  }
}
