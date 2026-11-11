import { Link, useParams } from 'react-router-dom'
import { EmptyState, ErrorState, PageHeader, Spinner } from '../components/Feedback'
import { useAuth } from '../context/AuthContext'
import { useAsync } from '../hooks/useAsync'
import { usePageSeo } from '../hooks/usePageSeo'
import { formatPKR } from '../lib/format'
import { getOrder, listMyOrders } from '../services/orderService'

function Loading() {
  return (
    <div className="grid min-h-[30vh] place-items-center text-primary" role="status" aria-label="Loading orders">
      <Spinner className="h-8 w-8" />
    </div>
  )
}

export function OrdersPage() {
  usePageSeo({ title: 'Orders | AquaFizz', description: 'Track your AquaFizz orders.' })
  const { user, ready } = useAuth()
  const { data: orders, loading, error, reload } = useAsync(
    () => (ready ? listMyOrders(user?.id) : new Promise(() => {})),
    [ready, user?.id],
    [],
  )

  return (
    <div>
      <PageHeader
        title="Orders"
        description={user ? 'Orders placed with your account.' : 'Orders placed on this device. Sign in to see orders from your account.'}
      />
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState description={error} onRetry={reload} />
      ) : orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          action={
            <Link to="/products" className="rounded-full bg-primary px-5 py-3 text-sm font-semibold">
              Start Shopping
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li key={order.id} className="rounded-3xl border border-slate-100 p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{order.id}</p>
                <span className="rounded-full bg-light-aqua px-3 py-1 text-xs font-medium">{order.status}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                {formatPKR(order.totals.total)} · {order.paymentMethod}
              </p>
              <Link to={`/orders/${order.id}`} className="mt-3 inline-block text-sm font-medium text-primary-dark">
                View details
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function OrderDetailPage() {
  const { id } = useParams()
  const { ready } = useAuth()
  const { data: order, loading, error, reload } = useAsync(
    () => (ready ? getOrder(id) : new Promise(() => {})),
    [id, ready],
    null,
  )
  usePageSeo({ title: order ? `Order ${order.id}` : 'Order | AquaFizz' })

  if (loading) return <Loading />
  if (error) return <ErrorState description={error} onRetry={reload} />
  if (!order) {
    return <EmptyState title="Order not found" description="Sign in with the account that placed it, or open it on the device you ordered from." />
  }

  return (
    <div>
      <PageHeader title={order.id} description={order.status} />
      <div className="rounded-3xl border border-slate-100 p-5 text-sm">
        <p><strong>Payment:</strong> {order.paymentMethod} · {order.paymentStatus}</p>
        <p className="mt-2"><strong>ETA:</strong> {order.estimatedDelivery}</p>
        <p className="mt-2">
          <strong>Address:</strong> {order.delivery.address}, {order.delivery.area}, {order.delivery.city}
        </p>
        <ul className="mt-4 space-y-2">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between">
              <span>
                {item.name} × {item.quantity}
              </span>
              <span>{formatPKR(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 font-bold">Total {formatPKR(order.totals.total)}</p>
      </div>
    </div>
  )
}
