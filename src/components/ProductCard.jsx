import { Heart, Minus, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { maxFor, useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { useWishlist } from '../context/WishlistContext'
import { formatPKR, stockLabel } from '../lib/format'
import { ProductImage } from './ProductImage'

export function QuantitySelector({ value, onChange, min = 1, max = 20, disabled, compact = false, className = '' }) {
  const btn = compact ? 'h-8 w-8' : 'h-9 w-9'
  return (
    <div className={`inline-flex items-center justify-between rounded-full border border-slate-200 ${className}`}>
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={disabled || value <= min}
        className={`grid ${btn} place-items-center disabled:opacity-40`}
        onClick={() => onChange(value - 1)}
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-8 text-center text-sm font-semibold">{value}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={disabled || value >= max}
        className={`grid ${btn} place-items-center disabled:opacity-40`}
        onClick={() => onChange(value + 1)}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}

/** Product tile. Compact on phones (two per row), roomier from the `sm` breakpoint up. */
export function ProductCard({ product }) {
  const { addItem, items, setQuantity } = useCart()
  const { has, toggle } = useWishlist()
  const { push } = useToast()
  const inCart = items.find((i) => i.id === product.id)
  const out = product.stock <= 0
  const low = !out && product.stock <= 10
  const wished = has(product.id)

  const add = () => {
    if (out) return
    if (!addItem(product, 1)) {
      push(`You already have the most you can order (${maxFor(product.stock)}) in your cart`, 'error')
      return
    }
    push(`${product.name} added to cart`)
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_6px_24px_rgb(19_143_150_/_0.1)] transition hover:-translate-y-0.5 hover:shadow-lg sm:rounded-3xl">
      <Link to={`/products/${product.slug}`} className="relative block aspect-square overflow-hidden bg-slate-50">
        <ProductImage
          src={product.image}
          alt={product.name}
          brand={product.brand}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        {/* Heart sits top-left: product photos carry their size badge in the top-right corner. */}
        {out ? (
          <span className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-center text-xs font-semibold text-white">
            Out of stock
          </span>
        ) : null}
        <button
          type="button"
          aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute top-2 left-2 grid h-8 w-8 place-items-center rounded-full bg-white/95 shadow-sm sm:top-3 sm:left-3 sm:h-10 sm:w-10"
          onClick={(e) => {
            e.preventDefault()
            toggle(product.id)
          }}
        >
          <Heart className={`h-4 w-4 ${wished ? 'fill-primary text-primary' : 'text-slate-700'}`} />
        </button>
      </Link>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <p className="text-[11px] font-medium tracking-wide text-primary-dark uppercase sm:text-xs">{product.brand}</p>
        <Link
          to={`/products/${product.slug}`}
          className="mt-0.5 line-clamp-2 text-sm leading-snug font-semibold sm:mt-1 sm:text-base"
        >
          {product.name}
        </Link>
        <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">{product.size}</p>
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-2 sm:mt-3">
          <p className="text-base font-bold sm:text-lg">{formatPKR(product.price)}</p>
          {low ? <p className="text-[11px] font-medium text-amber-600 sm:text-xs">{stockLabel(product.stock)}</p> : null}
        </div>
        <div className="mt-auto pt-3">
          {inCart ? (
            <QuantitySelector
              compact
              className="w-full"
              value={inCart.quantity}
              max={maxFor(product.stock)}
              disabled={out}
              onChange={(q) => setQuantity(product.id, q)}
            />
          ) : (
            <button
              type="button"
              disabled={out}
              className="inline-flex w-full items-center justify-center gap-1 rounded-full bg-primary py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              onClick={add}
            >
              <Plus className="h-4 w-4" />
              {out ? 'Sold out' : 'Add'}
              <span className="hidden sm:inline">{out ? '' : ' to Cart'}</span>
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
