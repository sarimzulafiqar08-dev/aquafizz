import { CheckCircle } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { EmptyState, PageHeader } from '../components/Feedback'
import { usePageSeo } from '../hooks/usePageSeo'
import { CONTACT } from '../lib/constants'
import { formatPKR } from '../lib/format'
import { getLocalOrder } from '../services/orderService'

export function OrderSuccessPage() {
  usePageSeo({
    title: 'Order placed | AquaFizz',
    description: 'Your AquaFizz order was placed successfully.',
  })
  const [params] = useSearchParams()
  const order = getLocalOrder(params.get('id'))

  if (!order) {
    return (
      <EmptyState
        title="No recent order found"
        action={
          <Link to="/products" className="rounded-full bg-primary px-5 py-3 text-sm font-semibold">
            Continue Shopping
          </Link>
        }
      />
    )
  }

  const address = `${order.delivery.address}, ${order.delivery.area}, ${order.delivery.city}`
  const waText = encodeURIComponent(
    `Hi AquaFizz, I just placed order ${order.id}. Total ${formatPKR(order.totals.total)}.`,
  )

  return (
    <div className="mx-auto max-w-lg text-center">
      <CheckCircle className="mx-auto h-14 w-14 text-primary" />
      <PageHeader title="Order Placed Successfully!" />
      <div className="rounded-3xl border border-slate-100 p-6 text-left text-sm">
        <p><strong>Order number:</strong> {order.id}</p>
        <p className="mt-2"><strong>Total:</strong> {formatPKR(order.totals.total)}</p>
        <p className="mt-2"><strong>Payment method:</strong> {order.paymentMethod}</p>
        <p className="mt-2"><strong>Payment status:</strong> {order.paymentStatus}</p>
        <p className="mt-2"><strong>Delivery address:</strong> {address}</p>
        <p className="mt-2"><strong>Estimated delivery:</strong> {order.estimatedDelivery}</p>
      </div>
      <div className="mt-6 grid gap-3">
        <Link to={`/orders/${order.id}`} className="rounded-full bg-primary py-3 font-semibold">
          Track Order
        </Link>
        <Link to="/products" className="rounded-full border py-3 font-semibold">
          Continue Shopping
        </Link>
        <a
          href={`https://wa.me/${CONTACT.whatsapp}?text=${waText}`}
          className="rounded-full bg-black py-3 font-semibold text-white"
        >
          Order on WhatsApp
        </a>
      </div>
    </div>
  )
}
