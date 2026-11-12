import { Heart, Minus, Plus } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { maxFor, useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { useWishlist } from '../context/WishlistContext'
import { formatPKR, stockLabel } from '../lib/format'

export function QuantitySelector({ value, onChange, min = 1, max = 20, disabled }) {
  return (
    <div className="inline-flex items-center rounded-full border border-slate-200">
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={disabled || value <= min}
        className="grid h-9 w-9 place-items-center disabled:opacity-40"
        onClick={() => onChange(value - 1)}
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-8 text-center text-sm font-semibold">{value}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={disabled || value >= max}
        className="grid h-9 w-9 place-items-center disabled:opacity-40"
        onClick={() => onChange(value + 1)}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}

export function ProductCard({ product }) {
  const { addItem, items, setQuantity } = useCart()
  const { has, toggle } = useWishlist()
  const { push } = useToast()
  const navigate = useNavigate()
  const inCart = items.find((i) => i.id === product.id)
  const out = product.stock <= 0
  const wished = has(product.id)

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_8px_30px_rgb(0_194_209_/_0.08)] transition hover:-translate-y-0.5 hover:shadow-lg">
      <Link to={`/products/${product.slug}`} className="relative block overflow-hidden bg-white">
        <img
          src={product.image}
          alt={product.name}
          className="h-48 w-full object-contain p-4 transition duration-500 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium">
          {product.category}
        </span>
        <button
          type="button"
          aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/95 shadow-sm"
          onClick={(e) => {
            e.preventDefault()
            toggle(product.id)
          }}
        >
          <Heart className={`h-4 w-4 ${wished ? 'fill-primary text-primary' : 'text-slate-700'}`} />
        </button>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-primary-dark">{product.brand}</p>
        <Link to={`/products/${product.slug}`} className="mt-1 font-semibold leading-snug">
          {product.name}
        </Link>
        <p className="mt-1 text-sm text-slate-500">{product.size}</p>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-lg font-bold">{formatPKR(product.price)}</p>
          <p className={`text-xs font-medium ${out ? 'text-red-600' : 'text-emerald-600'}`}>
            {stockLabel(product.stock)}
          </p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          {inCart ? (
            <QuantitySelector
              value={inCart.quantity}
              max={maxFor(product.stock)}
              disabled={out}
              onChange={(q) => setQuantity(product.id, q)}
            />
          ) : (
            <span className="text-xs text-slate-500">Qty 1+</span>
          )}
          <button
            type="button"
            disabled={out}
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:bg-slate-200"
            onClick={() => {
              if (out) return
              if (!addItem(product, 1)) {
                push(`You already have the most you can order (${maxFor(product.stock)}) in your cart`, 'error')
                return
              }
              push(`${product.name} added to cart`)
            }}
          >
            Add to Cart
          </button>
        </div>
        <button
          type="button"
          className="mt-2 text-left text-xs font-medium text-slate-500 hover:text-black"
          onClick={() => navigate(`/products/${product.slug}`)}
        >
          View details
        </button>
      </div>
    </article>
  )
}
