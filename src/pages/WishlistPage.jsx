import { Link } from 'react-router-dom'
import { EmptyState, ErrorState, PageHeader, ProductSkeleton } from '../components/Feedback'
import { ProductCard } from '../components/ProductCard'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { useWishlist } from '../context/WishlistContext'
import { usePageSeo } from '../hooks/usePageSeo'
import { useProducts } from '../hooks/useProducts'

export function WishlistPage() {
  usePageSeo({ title: 'Wishlist | AquaFizz', description: 'Drinks you saved for later.' })
  const { ids, toggle } = useWishlist()
  const { addItem } = useCart()
  const { push } = useToast()
  const { products, loading, error, reload } = useProducts()
  const saved = products.filter((p) => ids.includes(p.id))
  const available = saved.filter((p) => p.stock > 0)

  return (
    <div>
      <PageHeader eyebrow="Saved" title="Wishlist" description="Your favourite drinks, ready when you are." />
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <ErrorState description={error} onRetry={reload} />
      ) : saved.length === 0 ? (
        <EmptyState
          title="Your wishlist is empty"
          description="Tap the heart on any drink to save it here."
          action={
            <Link to="/products" className="rounded-full bg-primary px-5 py-3 text-sm font-semibold">
              Browse drinks
            </Link>
          }
        />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">{saved.length} saved</p>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-full border border-slate-200 px-4 py-2 text-sm"
                onClick={() => saved.forEach((p) => toggle(p.id))}
              >
                Clear all
              </button>
              <button
                type="button"
                disabled={available.length === 0}
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold disabled:bg-slate-200"
                onClick={() => {
                  const added = available.filter((p) => addItem(p, 1) > 0).length
                  if (added) push(`${added} ${added === 1 ? 'item' : 'items'} added to cart`)
                  else push('These items are already in your cart at the most you can order', 'error')
                }}
              >
                Add all to cart
              </button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {saved.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
