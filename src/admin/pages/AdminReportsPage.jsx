import { ChevronLeft, ChevronRight, Download, Printer } from 'lucide-react'
import { useMemo, useState } from 'react'
import { EmptyState, ErrorState, PageHeader, Spinner } from '../../components/Feedback'
import { inputClass } from '../../components/Field'
import { useAsync } from '../../hooks/useAsync'
import { usePageSeo } from '../../hooks/usePageSeo'
import { PAYMENT_STATUSES } from '../../lib/constants'
import { formatPKR } from '../../lib/format'
import { listOrdersBetween } from '../../services/orderService'

/* Dates are handled in the browser's local time (Pakistan time for the shop). */
const pad = (n) => String(n).padStart(2, '0')
const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const monthKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
const parseDay = (key) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}
const parseMonth = (key) => {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1)
}

function rangeFor(mode, key) {
  if (mode === 'day') {
    const from = parseDay(key)
    return { from, to: new Date(from.getFullYear(), from.getMonth(), from.getDate() + 1) }
  }
  const from = parseMonth(key)
  return { from, to: new Date(from.getFullYear(), from.getMonth() + 1, 1) }
}

function shiftKey(mode, key, step) {
  if (mode === 'day') {
    const d = parseDay(key)
    return dayKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() + step))
  }
  const d = parseMonth(key)
  return monthKey(new Date(d.getFullYear(), d.getMonth() + step, 1))
}

const titleFor = (mode, key) =>
  mode === 'day'
    ? parseDay(key).toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : parseMonth(key).toLocaleDateString('en-PK', { month: 'long', year: 'numeric' })

const NOT_SOLD_PAYMENTS = [PAYMENT_STATUSES.rejected, PAYMENT_STATUSES.refunded]

/** A sale counts unless the order was cancelled or its payment was rejected/refunded. */
const isSale = (o) => o.status !== 'Cancelled' && !NOT_SOLD_PAYMENTS.includes(o.paymentStatus)
const orderTotal = (o) => Number(o.totals?.total) || 0
const orderItems = (o) => (o.items || []).reduce((n, i) => n + (Number(i.quantity) || 0), 0)

function summarize(orders, mode, key) {
  const sales = orders.filter(isSale)
  const revenue = sales.reduce((s, o) => s + orderTotal(o), 0)
  const items = sales.reduce((s, o) => s + orderItems(o), 0)

  const products = new Map()
  for (const o of sales) {
    for (const i of o.items || []) {
      const id = `${i.id}`
      const row = products.get(id) || { name: i.name, size: i.size, quantity: 0, amount: 0 }
      row.quantity += Number(i.quantity) || 0
      row.amount += (Number(i.price) || 0) * (Number(i.quantity) || 0)
      products.set(id, row)
    }
  }

  const methods = new Map()
  for (const o of sales) {
    const m = o.paymentMethod || 'Other'
    const row = methods.get(m) || { method: m, orders: 0, amount: 0 }
    row.orders += 1
    row.amount += orderTotal(o)
    methods.set(m, row)
  }

  // Month view: one row per day, up to today for the current month.
  let days = []
  if (mode === 'month') {
    const start = parseMonth(key)
    const last = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate()
    const today = new Date()
    const isCurrent = monthKey(today) === key
    const upto = isCurrent ? today.getDate() : last
    const byDay = new Map()
    for (const o of sales) {
      const k = dayKey(new Date(o.createdAt))
      const row = byDay.get(k) || { orders: 0, items: 0, amount: 0 }
      row.orders += 1
      row.items += orderItems(o)
      row.amount += orderTotal(o)
      byDay.set(k, row)
    }
    for (let d = 1; d <= upto; d += 1) {
      const k = dayKey(new Date(start.getFullYear(), start.getMonth(), d))
      days.push({ key: k, ...(byDay.get(k) || { orders: 0, items: 0, amount: 0 }) })
    }
  }

  return {
    revenue,
    orders: sales.length,
    items,
    average: sales.length ? Math.round(revenue / sales.length) : 0,
    cancelled: orders.filter((o) => o.status === 'Cancelled').length,
    delivered: sales.filter((o) => o.status === 'Delivered').reduce((s, o) => s + orderTotal(o), 0),
    products: [...products.values()].sort((a, b) => b.quantity - a.quantity || b.amount - a.amount),
    methods: [...methods.values()].sort((a, b) => b.amount - a.amount),
    days,
    bestDay: days.reduce((best, d) => (d.amount > (best?.amount || 0) ? d : best), null),
  }
}

function downloadCsv(filename, rows) {
  const esc = (v) => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = rows.map((r) => r.map(esc).join(',')).join('\r\n')
  // BOM so Excel opens it as UTF-8.
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function csvRows(mode, key, report, orders) {
  const rows = [
    ['AquaFizz sales report', titleFor(mode, key)],
    [],
    ['Total sale (Rs)', report.revenue],
    ['Orders', report.orders],
    ['Items sold', report.items],
    ['Average order (Rs)', report.average],
    ['Delivered sale (Rs)', report.delivered],
    ['Cancelled orders', report.cancelled],
    [],
    ['Payment method', 'Orders', 'Amount (Rs)'],
    ...report.methods.map((m) => [m.method, m.orders, m.amount]),
    [],
    ['Product', 'Size', 'Quantity', 'Amount (Rs)'],
    ...report.products.map((p) => [p.name, p.size, p.quantity, p.amount]),
  ]
  if (mode === 'month') {
    rows.push([], ['Date', 'Orders', 'Items', 'Sale (Rs)'], ...report.days.map((d) => [d.key, d.orders, d.items, d.amount]))
  } else {
    rows.push(
      [],
      ['Time', 'Order', 'Customer', 'Items', 'Total (Rs)', 'Status', 'Payment'],
      ...orders.map((o) => [
        new Date(o.createdAt).toLocaleTimeString('en-PK', { hour: 'numeric', minute: '2-digit' }),
        o.id,
        o.delivery?.name || '',
        orderItems(o),
        orderTotal(o),
        o.status,
        o.paymentStatus,
      ]),
    )
  }
  return rows
}

function Stat({ label, value, note, strong }) {
  return (
    <div className={`rounded-3xl p-5 ${strong ? 'bg-light-aqua' : 'border border-slate-100 bg-white'}`}>
      <p className="text-sm text-slate-600">{label}</p>
      <p className={`mt-1 font-bold ${strong ? 'text-3xl' : 'text-2xl'}`}>{value}</p>
      {note ? <p className="mt-1 text-xs text-slate-500">{note}</p> : null}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-5 print:break-inside-avoid">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  )
}

export function AdminReportsPage() {
  usePageSeo({ title: 'Sales reports | AquaFizz' })
  const now = new Date()
  const [mode, setMode] = useState('day')
  const [day, setDay] = useState(dayKey(now))
  const [month, setMonth] = useState(monthKey(now))
  const key = mode === 'day' ? day : month
  const setKey = mode === 'day' ? setDay : setMonth
  const isLatest = key === (mode === 'day' ? dayKey(now) : monthKey(now))

  const { data: orders, loading, error, reload } = useAsync(
    () => {
      const { from, to } = rangeFor(mode, key)
      return listOrdersBetween(from, to)
    },
    [mode, key],
    [],
  )
  const report = useMemo(() => summarize(orders, mode, key), [orders, mode, key])
  const maxDay = Math.max(1, ...report.days.map((d) => d.amount))

  return (
    <div className="grid min-w-0 gap-4 [&>*]:min-w-0">
      <PageHeader title="Sales reports" description="Daily and monthly sales. Cancelled orders and rejected payments are not counted." />

      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <div className="inline-flex rounded-full bg-slate-100 p-1" role="tablist" aria-label="Report period">
          {[
            ['day', 'Daily'],
            ['month', 'Monthly'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={mode === id}
              onClick={() => setMode(id)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${mode === id ? 'bg-white shadow-sm' : 'text-slate-600'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={mode === 'day' ? 'Previous day' : 'Previous month'}
            onClick={() => setKey(shiftKey(mode, key, -1))}
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-slate-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <input
            type={mode === 'day' ? 'date' : 'month'}
            value={key}
            max={mode === 'day' ? dayKey(now) : monthKey(now)}
            onChange={(e) => e.target.value && setKey(e.target.value)}
            aria-label={mode === 'day' ? 'Report date' : 'Report month'}
            className={`${inputClass} w-auto py-2`}
          />
          <button
            type="button"
            aria-label={mode === 'day' ? 'Next day' : 'Next month'}
            disabled={isLatest}
            onClick={() => setKey(shiftKey(mode, key, 1))}
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-slate-100 disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="flex gap-2 sm:ml-auto">
          <button
            type="button"
            disabled={loading || !!error}
            onClick={() => downloadCsv(`aquafizz-report-${key}.csv`, csvRows(mode, key, report, orders))}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Excel (CSV)
          </button>
          <button
            type="button"
            disabled={loading || !!error}
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
        </div>
      </div>

      <p className="text-base font-semibold">{titleFor(mode, key)}</p>

      {error ? (
        <ErrorState description={error} onRetry={reload} />
      ) : loading ? (
        <div className="grid min-h-[30vh] place-items-center text-primary" role="status" aria-label="Loading report">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 [&>*]:min-w-0">
            <div className="col-span-2 lg:col-span-1">
              <Stat strong label="Total sale" value={formatPKR(report.revenue)} note={`Delivered: ${formatPKR(report.delivered)}`} />
            </div>
            <Stat label="Orders" value={report.orders} note={report.cancelled ? `${report.cancelled} cancelled` : 'None cancelled'} />
            <Stat label="Items sold" value={report.items.toLocaleString('en-PK')} note="Bottles / packs" />
            <div className="col-span-2 lg:col-span-1">
              <Stat
                label={mode === 'month' ? 'Best day' : 'Average order'}
                value={
                  mode === 'month'
                    ? report.bestDay
                      ? parseDay(report.bestDay.key).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })
                      : '—'
                    : formatPKR(report.average)
                }
                note={mode === 'month' ? (report.bestDay ? formatPKR(report.bestDay.amount) : 'No sales yet') : null}
              />
            </div>
          </div>

          {report.orders === 0 ? (
            <EmptyState
              title={mode === 'day' ? 'No sales on this day' : 'No sales in this month'}
              description="Use the arrows to look at another date."
            />
          ) : (
            <>
              {mode === 'month' ? (
                <Section title="Day by day">
                  <div className="-mx-2 overflow-x-auto">
                    <table className="w-full min-w-[28rem] text-sm">
                      <thead className="text-left text-xs text-slate-500">
                        <tr>
                          <th className="px-2 py-2 font-medium">Date</th>
                          <th className="px-2 py-2 text-right font-medium">Orders</th>
                          <th className="px-2 py-2 text-right font-medium">Items</th>
                          <th className="px-2 py-2 text-right font-medium">Sale</th>
                          <th className="w-1/3 px-2 py-2 print:hidden" />
                        </tr>
                      </thead>
                      <tbody>
                        {report.days.map((d) => (
                          <tr key={d.key} className={`border-t border-slate-100 ${d.orders ? '' : 'text-slate-400'}`}>
                            <td className="px-2 py-2">
                              <button
                                type="button"
                                className="font-medium hover:underline print:no-underline"
                                onClick={() => {
                                  setDay(d.key)
                                  setMode('day')
                                }}
                              >
                                {parseDay(d.key).toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short' })}
                              </button>
                            </td>
                            <td className="px-2 py-2 text-right">{d.orders}</td>
                            <td className="px-2 py-2 text-right">{d.items}</td>
                            <td className="px-2 py-2 text-right font-semibold">{formatPKR(d.amount)}</td>
                            <td className="px-2 py-2 print:hidden">
                              <div className="h-2 rounded-full bg-slate-100">
                                <div className="h-2 rounded-full bg-primary" style={{ width: `${(d.amount / maxDay) * 100}%` }} />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Section>
              ) : null}

              <div className="grid gap-4 lg:grid-cols-[2fr_1fr] [&>*]:min-w-0">
                <Section title="Products sold">
                  <div className="-mx-2 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-left text-xs text-slate-500">
                        <tr>
                          <th className="px-2 py-2 font-medium">Product</th>
                          <th className="px-2 py-2 text-right font-medium">Qty</th>
                          <th className="px-2 py-2 text-right font-medium">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.products.map((p) => (
                          <tr key={`${p.name}-${p.size}`} className="border-t border-slate-100">
                            <td className="px-2 py-2">
                              {p.name} <span className="text-slate-500">{p.size}</span>
                            </td>
                            <td className="px-2 py-2 text-right font-semibold">{p.quantity}</td>
                            <td className="px-2 py-2 text-right">{formatPKR(p.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Section>
                <Section title="By payment method">
                  <ul className="grid gap-2 text-sm">
                    {report.methods.map((m) => (
                      <li key={m.method} className="flex items-center justify-between gap-2">
                        <span>
                          {m.method} <span className="text-slate-500">({m.orders})</span>
                        </span>
                        <span className="font-semibold">{formatPKR(m.amount)}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              </div>

              {mode === 'day' ? (
                <Section title="Orders">
                  <div className="-mx-2 overflow-x-auto">
                    <table className="w-full min-w-[30rem] text-sm">
                      <thead className="text-left text-xs text-slate-500">
                        <tr>
                          <th className="px-2 py-2 font-medium">Time</th>
                          <th className="px-2 py-2 font-medium">Customer</th>
                          <th className="px-2 py-2 text-right font-medium">Items</th>
                          <th className="px-2 py-2 text-right font-medium">Total</th>
                          <th className="px-2 py-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((o) => (
                          <tr key={o.id} className={`border-t border-slate-100 ${isSale(o) ? '' : 'text-slate-400 line-through'}`}>
                            <td className="px-2 py-2 whitespace-nowrap">
                              {new Date(o.createdAt).toLocaleTimeString('en-PK', { hour: 'numeric', minute: '2-digit' })}
                            </td>
                            <td className="px-2 py-2 font-medium">{o.delivery?.name || o.id}</td>
                            <td className="px-2 py-2 text-right">{orderItems(o)}</td>
                            <td className="px-2 py-2 text-right font-semibold">{formatPKR(orderTotal(o))}</td>
                            <td className="px-2 py-2 whitespace-nowrap">{o.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Section>
              ) : null}
            </>
          )}
        </>
      )}
    </div>
  )
}
