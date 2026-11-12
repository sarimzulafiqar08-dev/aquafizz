import { ORDER_STATUSES, PAYMENT_STATUSES, STORAGE_KEYS } from '../lib/constants'
import { readJson, wait, writeJson } from '../lib/storage'
import { generateOrderNumber } from '../lib/format'
import { refreshProducts, releaseStock, reserveStock } from './productService'
import { supabase, unwrap } from './supabaseClient'

/**
 * Orders data layer. With Supabase, orders are created by the place_order()
 * database function; a copy is also kept on this device so guests can still
 * open their confirmation / tracking pages.
 */

export function listLocalOrders() {
  return readJson(STORAGE_KEYS.orders, [])
}

export function getLocalOrder(id) {
  return listLocalOrders().find((o) => o.id === id) || null
}

export function saveLocalOrder(payload) {
  const orders = listLocalOrders()
  const order = {
    ...payload,
    id: payload.id || generateOrderNumber(),
    createdAt: payload.createdAt || new Date().toISOString(),
  }
  writeJson(STORAGE_KEYS.orders, [order, ...orders.filter((o) => o.id !== order.id)])
  return order
}

const fromRow = (r) => ({
  id: r.id,
  userId: r.user_id,
  items: r.items,
  totals: r.totals,
  delivery: r.delivery,
  paymentMethod: r.payment_method,
  paymentStatus: r.payment_status,
  payment: r.payment || {},
  status: r.status,
  estimatedDelivery: r.estimated_delivery,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
})

/** Validates stock, saves the order and returns it. Throws a readable Error. */
export async function placeOrder(payload) {
  if (supabase) {
    const row = unwrap(await supabase.rpc('place_order', { p_order: payload }))
    const order = fromRow(row)
    saveLocalOrder(order)
    refreshProducts().catch(() => {})
    return order
  }
  reserveStock(payload.items)
  return saveLocalOrder({ ...payload, status: 'Placed' })
}

/** All orders (admin). */
export async function listOrders() {
  if (supabase) {
    const rows = unwrap(await supabase.from('orders').select('*').order('created_at', { ascending: false }))
    return rows.map(fromRow)
  }
  return listLocalOrders()
}

/** Orders for the signed-in user, or orders placed on this device for guests. */
export async function listMyOrders(userId) {
  if (supabase && userId) {
    const rows = unwrap(
      await supabase.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    )
    return rows.map(fromRow)
  }
  const local = listLocalOrders()
  return userId ? local.filter((o) => o.userId === userId) : local
}

export async function getOrder(id) {
  if (supabase) {
    const row = unwrap(await supabase.from('orders').select('*').eq('id', id).maybeSingle())
    if (row) return fromRow(row)
  }
  return getLocalOrder(id)
}

export async function updateOrderStatus(id, status) {
  if (!ORDER_STATUSES.includes(status)) throw new Error('Unknown order status.')
  if (supabase) {
    // The orders_status_change trigger puts stock back when an order is cancelled.
    const row = unwrap(
      await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .maybeSingle(),
    )
    if (!row) throw new Error('Order not found, or you are not allowed to update it.')
    if (status === 'Cancelled') refreshProducts().catch(() => {})
    return fromRow(row)
  }
  await wait(200)
  const orders = listLocalOrders()
  const current = orders.find((o) => o.id === id)
  if (!current) throw new Error('Order not found.')
  if (current.status === status) return current
  if (current.status === 'Cancelled') throw new Error('A cancelled order cannot be reopened. Ask the customer to order again.')
  if (status === 'Cancelled') releaseStock(current.items || [])
  const next = orders.map((o) => (o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o))
  writeJson(STORAGE_KEYS.orders, next)
  return next.find((o) => o.id === id)
}

export async function updatePaymentStatus(id, paymentStatus, note = '') {
  if (!Object.values(PAYMENT_STATUSES).includes(paymentStatus)) throw new Error('Unknown payment status.')
  const reviewedAt = new Date().toISOString()
  if (supabase) {
    const current = unwrap(await supabase.from('orders').select('payment').eq('id', id).maybeSingle())
    if (!current) throw new Error('Order not found, or you are not allowed to update it.')
    const row = unwrap(
      await supabase
        .from('orders')
        .update({
          payment_status: paymentStatus,
          payment: { ...(current.payment || {}), reviewNote: note, reviewedAt },
          updated_at: reviewedAt,
        })
        .eq('id', id)
        .select()
        .maybeSingle(),
    )
    return fromRow(row)
  }
  await wait(200)
  const orders = listLocalOrders()
  if (!orders.some((o) => o.id === id)) throw new Error('Order not found.')
  const next = orders.map((o) =>
    o.id === id
      ? { ...o, paymentStatus, payment: { ...(o.payment || {}), reviewNote: note, reviewedAt }, updatedAt: reviewedAt }
      : o,
  )
  writeJson(STORAGE_KEYS.orders, next)
  return next.find((o) => o.id === id)
}
