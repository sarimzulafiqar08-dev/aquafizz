import { AlertTriangle, ChevronDown, Package, Pencil, Plus, Search, ShoppingBag, Trash2, Users, Wallet } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, ErrorState, PageHeader, Spinner } from '../../components/Feedback'
import { LazyLocationPicker } from '../../components/LazyLocationPicker'
import { inputClass } from '../../components/Field'
import { useAuth } from '../../context/AuthContext'
import { useConfirm } from '../../context/ConfirmContext'
import { useToast } from '../../context/ToastContext'
import { usePageSeo } from '../../hooks/usePageSeo'
import { useProducts } from '../../hooks/useProducts'
import { categories } from '../../lib/catalog'
import { DISTRICTS, ORDER_STATUSES, PAYMENT_STATUSES, ROLES } from '../../lib/constants'
import { formatPKR } from '../../lib/format'
import { deleteUser, listUsers, setUserRole } from '../../services/authService'
import { useAsync } from '../../hooks/useAsync'
import { listOrders, updateOrderStatus } from '../../services/orderService'
import { createProduct, deleteProduct, updateProduct } from '../../services/productService'
import { isSupabaseConfigured } from '../../services/supabaseClient'
import { ProductFormModal } from '../components/ProductFormModal'

function useUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = useCallback(() => {
    setLoading(true)
    setError('')
    return listUsers()
      .then(setUsers)
      .catch((err) => setError(err.message || 'Could not load users.'))
      .finally(() => setLoading(false))
  }, [])
  useEffect(() => {
    load()
  }, [load])
  return { users, loading, error, reload: load }
}

function Stat({ label, value, icon: Icon, to, loading }) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        {Icon ? (
          <span className="grid h-9 w-9 place-items-center rounded-full bg-light-aqua text-primary-dark">
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      {loading ? <div className="mt-3 h-7 w-20 animate-pulse rounded bg-slate-200" /> : <p className="mt-2 text-2xl font-bold">{value}</p>}
    </>
  )
  const cls = 'block rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_8px_30px_rgb(0_194_209_/_0.08)]'
  return to ? (
    <Link to={to} className={`${cls} transition hover:-translate-y-0.5`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  )
}

function StatusBadge({ status }) {
  const tone =
    status === 'Delivered'
      ? 'bg-emerald-50 text-emerald-700'
      : status === 'Cancelled'
        ? 'bg-red-50 text-red-700'
        : status === 'Out for delivery'
          ? 'bg-amber-50 text-amber-700'
          : 'bg-light-aqua text-slate-800'
  return <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${tone}`}>{status}</span>
}

function TableShell({ children }) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-100 bg-white">
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  )
}

function SearchInput({ id, value, onChange, placeholder }) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <label htmlFor={id} className="sr-only">{placeholder}</label>
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${inputClass} rounded-full py-2.5 pl-10`} />
    </div>
  )
}

/* ─────────────────────────── Dashboard ─────────────────────────── */

export function AdminDashboardPage() {
  usePageSeo({ title: 'Admin | AquaFizz' })
  const { products, loading: productsLoading } = useProducts()
  const { users, loading: usersLoading } = useUsers()
  const { data: orders, loading: ordersLoading } = useAsync(listOrders, [], [])
  const live = orders.filter((o) => o.status !== 'Cancelled')
  const revenue = live.reduce((sum, o) => sum + (o.totals?.total || 0), 0)
  const lowStock = products.filter((p) => p.stock <= 10).sort((a, b) => a.stock - b.stock)
  const toVerify = orders.filter((o) => o.paymentStatus === PAYMENT_STATUSES.pending).length

  return (
    <div>
      <PageHeader title="Overview" description="Store health at a glance." />
      {toVerify > 0 ? (
        <Link
          to="/admin/payments"
          className="mb-4 flex items-center justify-between gap-3 rounded-3xl bg-amber-50 px-5 py-4 text-sm font-medium text-amber-800"
        >
          <span>
            {toVerify} online {toVerify === 1 ? 'payment is' : 'payments are'} waiting for verification
          </span>
          <span className="whitespace-nowrap underline">Review now</span>
        </Link>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Products" value={products.length} icon={Package} to="/admin/products" loading={productsLoading} />
        <Stat label="Users" value={users.length} icon={Users} to="/admin/users" loading={usersLoading} />
        <Stat label="Orders" value={orders.length} icon={ShoppingBag} to="/admin/orders" loading={ordersLoading} />
        <Stat label="Revenue (excl. cancelled)" value={formatPKR(revenue)} icon={Wallet} loading={ordersLoading} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent orders</h2>
            <Link to="/admin/orders" className="text-sm font-medium text-primary-dark">View all</Link>
          </div>
          {ordersLoading ? (
            <div className="h-40 animate-pulse rounded-3xl bg-slate-100" />
          ) : orders.length === 0 ? (
            <EmptyState title="No orders yet" description="Orders placed on the storefront show up here." />
          ) : (
            <TableShell>
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3">Order</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 6).map((o) => (
                  <tr key={o.id} className="border-t border-slate-100">
                    <td className="p-3 font-medium">{o.id}</td>
                    <td className="p-3">{o.delivery?.name}</td>
                    <td className="p-3">{formatPKR(o.totals?.total)}</td>
                    <td className="p-3"><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </TableShell>
          )}
        </section>
        <section className="h-fit rounded-3xl border border-slate-100 bg-white p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Low stock
          </h2>
          {productsLoading ? (
            <Spinner className="mt-4 h-5 w-5 text-primary" />
          ) : lowStock.length === 0 ? (
            <p className="mt-2 text-sm text-slate-600">Everything is well stocked.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {lowStock.slice(0, 8).map((p) => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                  <span className="truncate pr-2">{p.name}</span>
                  <span className={`font-semibold ${p.stock === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                    {p.stock === 0 ? 'Out' : p.stock}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

/* ─────────────────────────── Products ─────────────────────────── */

export function AdminProductsPage() {
  usePageSeo({ title: 'Admin products | AquaFizz' })
  const { products, loading, error, reload } = useProducts()
  const { push } = useToast()
  const { confirm } = useConfirm()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [editing, setEditing] = useState(null) // null = closed, {} = new, product = edit
  const [deletingId, setDeletingId] = useState('')

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter(
      (p) =>
        (!category || p.categorySlug === category) &&
        (!q || `${p.name} ${p.brand} ${p.size}`.toLowerCase().includes(q)),
    )
  }, [products, query, category])

  const remove = async (product) => {
    const ok = await confirm({
      title: `Delete ${product.name}?`,
      message: 'It will disappear from the shop immediately. This cannot be undone.',
      confirmLabel: 'Delete',
    })
    if (!ok) return
    setDeletingId(product.id)
    try {
      await deleteProduct(product.id)
      push(`${product.name} deleted`)
    } catch (err) {
      push(err.message, 'error')
    } finally {
      setDeletingId('')
    }
  }

  const save = async (values) => {
    if (editing?.id) {
      await updateProduct(editing.id, values)
      push('Product updated')
    } else {
      await createProduct(values)
      push('Product created')
    }
    setEditing(null)
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader title="Products" description={`${products.length} products in the catalog.`} />
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold"
          onClick={() => setEditing({})}
        >
          <Plus className="h-4 w-4" />
          Add product
        </button>
      </div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput id="admin-product-search" value={query} onChange={setQuery} placeholder="Search products" />
        <select aria-label="Filter by category" value={category} onChange={(e) => setCategory(e.target.value)} className={`${inputClass} rounded-full py-2.5 sm:w-52`}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : error ? (
        <ErrorState description={error} onRetry={reload} />
      ) : visible.length === 0 ? (
        <EmptyState title="No products match" description="Try another search, or add a new product." />
      ) : (
        <>
          {/* Mobile cards */}
          <ul className="grid gap-3 md:hidden">
            {visible.map((p) => (
              <li key={p.id} className="flex gap-3 rounded-3xl border border-slate-100 bg-white p-3">
                <img src={p.image} alt="" className="h-20 w-20 shrink-0 rounded-2xl border border-slate-100 bg-white object-contain p-1" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{p.name}</p>
                  <p className="text-xs text-slate-500">{p.category} · {p.images.length} img</p>
                  <p className="mt-1 text-sm">
                    <strong>{formatPKR(p.price)}</strong>
                    <span className={`ml-2 text-xs ${p.stock === 0 ? 'text-red-600' : 'text-slate-500'}`}>Stock {p.stock}</span>
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button type="button" className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium" onClick={() => setEditing(p)}>Edit</button>
                    <button type="button" disabled={deletingId === p.id} className="rounded-full border border-red-100 px-3 py-1 text-xs font-medium text-red-600" onClick={() => remove(p)}>Delete</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {/* Desktop table */}
          <div className="hidden md:block">
            <TableShell>
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3">Images</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <img src={p.image} alt="" className="h-12 w-12 rounded-xl border border-slate-100 bg-white object-contain p-0.5" />
                        <div>
                          <Link to={`/products/${p.slug}`} className="font-medium hover:text-primary-dark">{p.name}</Link>
                          <p className="text-xs text-slate-500">
                            {p.brand}{p.size ? ` · ${p.size}` : ''}{p.featured ? ' · Featured' : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">{p.category}</td>
                    <td className="p-3 font-medium">{formatPKR(p.price)}</td>
                    <td className={`p-3 font-medium ${p.stock === 0 ? 'text-red-600' : p.stock <= 10 ? 'text-amber-600' : ''}`}>{p.stock}</td>
                    <td className="p-3 text-slate-500">{p.images.length}</td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1">
                        <button type="button" aria-label={`Edit ${p.name}`} className="grid h-9 w-9 place-items-center rounded-full hover:bg-slate-100" onClick={() => setEditing(p)}>
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button type="button" aria-label={`Delete ${p.name}`} disabled={deletingId === p.id} className="grid h-9 w-9 place-items-center rounded-full text-red-600 hover:bg-red-50" onClick={() => remove(p)}>
                          {deletingId === p.id ? <Spinner /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableShell>
          </div>
        </>
      )}

      {editing ? (
        <ProductFormModal product={editing.id ? editing : null} onClose={() => setEditing(null)} onSubmit={save} />
      ) : null}
    </div>
  )
}

/* ─────────────────────────── Users ─────────────────────────── */

export function AdminUsersPage() {
  usePageSeo({ title: 'Admin users | AquaFizz' })
  const { users, loading, error, reload } = useUsers()
  const { user: me } = useAuth()
  const { push } = useToast()
  const { confirm } = useConfirm()
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('')
  const [busyId, setBusyId] = useState('')
  const { data: orders } = useAsync(listOrders, [], [])

  const visible = users.filter(
    (u) =>
      (!role || u.role === role) &&
      (!query || `${u.name} ${u.email} ${u.phone} ${u.cnic || ''}`.toLowerCase().includes(query.trim().toLowerCase())),
  )

  const run = async (id, fn, message) => {
    setBusyId(id)
    try {
      await fn()
      push(message)
      await reload()
    } catch (err) {
      push(err.message, 'error')
    } finally {
      setBusyId('')
    }
  }

  return (
    <div>
      <PageHeader title="Users" description={`${users.length} registered accounts.`} />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput id="admin-user-search" value={query} onChange={setQuery} placeholder="Search name, email, phone, CNIC" />
        <select aria-label="Filter by role" value={role} onChange={(e) => setRole(e.target.value)} className={`${inputClass} rounded-full py-2.5 sm:w-40`}>
          <option value="">All roles</option>
          <option value={ROLES.user}>Users</option>
          <option value={ROLES.admin}>Admins</option>
        </select>
      </div>
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : error ? (
        <ErrorState description={error} onRetry={reload} />
      ) : visible.length === 0 ? (
        <EmptyState title="No users found" description="New sign-ups appear here." />
      ) : (
        <TableShell>
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3">User</th>
              <th className="hidden p-3 sm:table-cell">Phone</th>
              <th className="hidden p-3 lg:table-cell">CNIC</th>
              <th className="hidden p-3 md:table-cell">Joined</th>
              <th className="p-3">Orders</th>
              <th className="p-3">Role</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {visible.map((u) => {
              const isMe = u.id === me?.id
              return (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="p-3">
                    <p className="font-medium">{u.name}{isMe ? <span className="ml-1 text-xs text-slate-500">(you)</span> : null}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </td>
                  <td className="hidden p-3 sm:table-cell">
                    {u.phone || '—'}
                  </td>
                  <td className="hidden p-3 whitespace-nowrap lg:table-cell">{u.cnic || '—'}</td>
                  <td className="hidden p-3 md:table-cell">{new Date(u.createdAt).toLocaleDateString('en-PK')}</td>
                  <td className="p-3">{orders.filter((o) => o.userId === u.id).length}</td>
                  <td className="p-3">
                    <select
                      aria-label={`Role for ${u.email}`}
                      value={u.role}
                      disabled={isMe || busyId === u.id}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium disabled:opacity-60"
                      onChange={(e) => run(u.id, () => setUserRole(u.id, e.target.value), `${u.email} is now ${e.target.value}`)}
                    >
                      <option value={ROLES.user}>user</option>
                      <option value={ROLES.admin}>admin</option>
                    </select>
                  </td>
                  <td className="p-3 text-right">
                    {!isMe && u.role !== ROLES.admin ? (
                      <button
                        type="button"
                        aria-label={`Delete ${u.email}`}
                        disabled={busyId === u.id}
                        className="grid h-9 w-9 place-items-center rounded-full text-red-600 hover:bg-red-50"
                        onClick={async () => {
                          const ok = await confirm({
                            title: `Delete ${u.name}?`,
                            message: 'Their account will be removed. Past orders are kept.',
                            confirmLabel: 'Delete',
                          })
                          if (ok) run(u.id, () => deleteUser(u.id), 'User deleted')
                        }}
                      >
                        {busyId === u.id ? <Spinner /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    ) : null}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </TableShell>
      )}
    </div>
  )
}

/* ─────────────────────────── Orders ─────────────────────────── */

export function AdminOrdersPage() {
  usePageSeo({ title: 'Admin orders | AquaFizz' })
  const { push } = useToast()
  const { confirm } = useConfirm()
  const { data: orders, setData: setOrders, loading, error, reload } = useAsync(listOrders, [], [])
  const [status, setStatus] = useState('')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState('')
  const [busyId, setBusyId] = useState('')

  const visible = orders.filter(
    (o) =>
      (!status || o.status === status) &&
      (!query || `${o.id} ${o.delivery?.name} ${o.delivery?.phone}`.toLowerCase().includes(query.trim().toLowerCase())),
  )

  const changeStatus = async (order, next) => {
    if (next === 'Cancelled') {
      const ok = await confirm({
        title: `Cancel ${order.id}?`,
        message: 'Stock for its items goes back to the shop. A cancelled order cannot be reopened.',
        confirmLabel: 'Cancel order',
      })
      if (!ok) return
    }
    setBusyId(order.id)
    try {
      const updated = await updateOrderStatus(order.id, next)
      setOrders((list) => list.map((o) => (o.id === updated.id ? updated : o)))
      push(`${order.id} → ${next}`)
    } catch (err) {
      push(err.message, 'error')
    } finally {
      setBusyId('')
    }
  }

  return (
    <div>
      <PageHeader title="Orders" description={`${orders.length} total orders.`} />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput id="admin-order-search" value={query} onChange={setQuery} placeholder="Search order, name, phone" />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['', ...ORDER_STATUSES].map((s) => (
            <button
              key={s || 'all'}
              type="button"
              className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-medium ${status === s ? 'bg-primary text-black' : 'bg-white text-slate-600 border border-slate-200'}`}
              onClick={() => setStatus(s)}
            >
              {s || 'All'} ({s ? orders.filter((o) => o.status === s).length : orders.length})
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-3xl bg-slate-100" />
          ))}
        </div>
      ) : error ? (
        <ErrorState description={error} onRetry={reload} />
      ) : visible.length === 0 ? (
        <EmptyState title="No orders" description={orders.length ? 'No orders match these filters.' : 'Orders placed on the storefront show up here.'} />
      ) : (
        <ul className="space-y-3">
          {visible.map((o) => {
            const expanded = open === o.id
            return (
              <li key={o.id} className="rounded-3xl border border-slate-100 bg-white">
                <div className="flex flex-wrap items-center gap-3 p-4">
                  <button
                    type="button"
                    aria-expanded={expanded}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    onClick={() => setOpen(expanded ? '' : o.id)}
                  >
                    <ChevronDown className={`h-4 w-4 shrink-0 transition ${expanded ? 'rotate-180' : ''}`} />
                    <span className="min-w-0">
                      <span className="block font-semibold">{o.id}</span>
                      <span className="block truncate text-xs text-slate-500">
                        {o.delivery?.name} · {new Date(o.createdAt).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </span>
                  </button>
                  <span className="font-semibold">{formatPKR(o.totals?.total)}</span>
                  <div className="flex items-center gap-2">
                    {busyId === o.id ? <Spinner className="h-4 w-4 text-primary" /> : null}
                    <select
                      aria-label={`Status for ${o.id}`}
                      value={o.status}
                      disabled={busyId === o.id || o.status === 'Cancelled'}
                      title={o.status === 'Cancelled' ? 'Cancelled orders cannot be reopened' : undefined}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium disabled:opacity-60"
                      onChange={(e) => changeStatus(o, e.target.value)}
                    >
                      {[...new Set([o.status, ...ORDER_STATUSES])].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {expanded ? (
                  <div className="grid gap-4 border-t border-slate-100 p-4 text-sm md:grid-cols-2">
                    <div>
                      <p className="font-medium">Delivery</p>
                      <p className="mt-1 text-slate-600">
                        {o.delivery?.name} · {o.delivery?.phone}
                        <br />
                        {o.delivery?.address}, {o.delivery?.area}, {o.delivery?.city}
                        {o.delivery?.location ? (
                          <>
                            <br />
                            <a
                              className="font-medium text-primary-dark"
                              target="_blank"
                              rel="noreferrer"
                              href={`https://www.google.com/maps?q=${o.delivery.location.lat},${o.delivery.location.lng}`}
                            >
                              Open pin in Google Maps
                            </a>
                          </>
                        ) : null}
                        {o.delivery?.instructions ? <><br />Note: {o.delivery.instructions}</> : null}
                      </p>
                      {o.estimatedDelivery ? (
                        <>
                          <p className="mt-3 font-medium">Delivery time</p>
                          <p className="mt-1 text-slate-600">{o.estimatedDelivery}</p>
                        </>
                      ) : null}
                      <p className="mt-3 font-medium">Payment</p>
                      <p className="mt-1 text-slate-600">{o.paymentMethod} · {o.paymentStatus}</p>
                    </div>
                    <div>
                      <p className="font-medium">Items</p>
                      <ul className="mt-1 space-y-1 text-slate-600">
                        {o.items.map((item) => (
                          <li key={item.id} className="flex justify-between gap-3">
                            <span>{item.name} × {item.quantity}</span>
                            <span>{formatPKR(item.price * item.quantity)}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 flex justify-between border-t border-slate-100 pt-2 font-semibold">
                        <span>Total</span>
                        <span>{formatPKR(o.totals?.total)}</span>
                      </p>
                    </div>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/* ─────────────────────────── Existing pages ─────────────────────────── */

export function AdminAnalyticsPage() {
  usePageSeo({ title: 'Admin analytics | AquaFizz' })
  const { data: orders } = useAsync(listOrders, [], [])
  const byStatus = ORDER_STATUSES.map((s) => [s, orders.filter((o) => o.status === s).length])
  return (
    <div>
      <PageHeader title="Analytics" description="Lightweight local snapshot." />
      <div className="grid gap-4 md:grid-cols-[16rem_1fr]">
        <div className="rounded-3xl bg-light-aqua p-6">
          <p className="text-sm text-slate-600">Orders placed</p>
          <p className="mt-2 text-4xl font-bold">{orders.length}</p>
        </div>
        <ul className="grid gap-2 rounded-3xl border border-slate-100 bg-white p-6 text-sm">
          {byStatus.map(([s, n]) => (
            <li key={s} className="flex items-center justify-between">
              <StatusBadge status={s} />
              <span className="font-semibold">{n}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function DeliveryAreaSettings() {
  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-5">
      <h2 className="text-lg font-semibold">Delivery area: all of Sindh</h2>
      <p className="mt-1 text-sm text-slate-600">
        Customers choose one of Sindh&apos;s {DISTRICTS.length} districts and pin their location anywhere inside the province.
      </p>
      <div className="mt-4">
        <LazyLocationPicker readOnly height="h-96" />
      </div>
    </section>
  )
}

export function AdminSettingsPage() {
  usePageSeo({ title: 'Admin settings | AquaFizz' })
  return (
    <div>
      <PageHeader title="Settings" />
      <div className="grid gap-4">
        <DeliveryAreaSettings />
        <div className="rounded-3xl border border-slate-100 bg-white p-5 text-sm text-slate-600">
          <p>Theme: AquaFizz primary #00C2D1</p>
          <p className="mt-2">
            Data backend: {isSupabaseConfigured ? 'Supabase (live)' : 'Browser storage (local development)'}.
          </p>
        </div>
      </div>
    </div>
  )
}
