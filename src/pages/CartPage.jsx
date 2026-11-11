import { Link } from 'react-router-dom'
import { EmptyState, PageHeader } from '../components/Feedback'
import { QuantitySelector } from '../components/ProductCard'
import { useCart } from '../context/CartContext'
import { useConfirm } from '../context/ConfirmContext'
import { useToast } from '../context/ToastContext'
import { usePageSeo } from '../hooks/usePageSeo'
import { FREE_DELIVERY_MIN } from '../lib/constants'
import { formatPKR } from '../lib/format'

export function OrderSummary({ cta, ctaTo }) {
  const { summary, promo, setPromo } = useCart()
  return (
    <aside className="h-fit rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_8px_30px_rgb(0_194_209_/_0.08)]">
      <h2 className="text-lg font-semibold">Order summary</h2>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd>{formatPKR(summary.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Delivery charges</dt>
          <dd>{summary.delivery === 0 ? 'Free' : formatPKR(summary.delivery)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Discount</dt>
          <dd>{formatPKR(summary.discount)}</dd>
        </div>
        <div className="flex justify-between border-t pt-3 text-base font-bold">
          <dt>Grand total</dt>
          <dd>{formatPKR(summary.total)}</dd>
        </div>
      </dl>
      <p className="mt-2 text-xs text-slate-500">Free delivery over {formatPKR(FREE_DELIVERY_MIN)}.</p>
      <div className="mt-4">
        <label htmlFor="promo" className="text-sm font-medium">
          Promo code
        </label>
        <input
          id="promo"
          value={promo}
          onChange={(e) => setPromo(e.target.value)}
          placeholder="WELCOME10"
          className="mt-1 w-full rounded-2xl border px-3 py-2.5 text-sm"
        />
        {promo && !summary.promoValid ? (
          <p className="mt-1 text-xs text-red-600">This code is not valid.</p>
        ) : null}
        {summary.promoValid ? (
          <p className="mt-1 text-xs text-emerald-600">WELCOME10 applied — 10% off.</p>
        ) : null}
      </div>
      {cta ? (
        <Link
          to={ctaTo}
          className="mt-5 block rounded-full bg-primary py-3 text-center text-sm font-semibold"
        >
          {cta}
        </Link>
      ) : null}
    </aside>
  )
}

export function CartPage() {
  usePageSeo({
    title: 'Cart | AquaFizz',
    description: 'Review your AquaFizz cart and checkout for fast delivery.',
  })
  const { items, setQuantity, removeItem } = useCart()
  const { confirm } = useConfirm()
  const { push } = useToast()

  return (
    <div>
      <PageHeader title="Cart" description="Adjust quantities or continue to checkout." />
      {items.length === 0 ? (
        <EmptyState
          title="Your cart is empty"
          description="Add chilled drinks and we’ll bring them to your door."
          action={
            <Link to="/products" className="rounded-full bg-primary px-5 py-3 text-sm font-semibold">
              Start Shopping
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <ul className="space-y-4">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex gap-4 rounded-3xl border border-slate-100 p-4"
              >
                <img src={item.image} alt={item.name} className="h-24 w-24 rounded-2xl border border-slate-100 bg-white object-contain p-1" />
                <div className="flex flex-1 flex-col">
                  <Link to={`/products/${item.slug}`} className="font-semibold">
                    {item.name}
                  </Link>
                  <p className="text-sm text-slate-500">
                    {item.size} · {formatPKR(item.price)}
                  </p>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <QuantitySelector
                      value={item.quantity}
                      onChange={(q) => setQuantity(item.id, q)}
                    />
                    <button
                      type="button"
                      className="text-sm text-red-600"
                      onClick={async () => {
                        const ok = await confirm({
                          title: 'Remove item?',
                          message: `Remove ${item.name} from your cart?`,
                          confirmLabel: 'Remove',
                        })
                        if (ok) {
                          removeItem(item.id)
                          push('Item removed', 'error')
                        }
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <OrderSummary cta="Checkout" ctaTo="/checkout" />
        </div>
      )}
    </div>
  )
}
