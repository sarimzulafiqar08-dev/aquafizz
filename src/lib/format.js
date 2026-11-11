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

export function estimateDelivery(windowId) {
  switch (windowId) {
    case 'asap':
      return '25–45 minutes'
    case '30-60':
      return '30–60 minutes'
    case '1-2':
      return '1–2 hours'
    case 'evening':
      return 'Today evening, 6:00 PM – 10:00 PM'
    case 'schedule':
      return 'As scheduled'
    default:
      return '30–60 minutes'
  }
}
