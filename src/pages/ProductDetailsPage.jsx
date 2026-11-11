import { Heart } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ErrorState, PageHeader, ProductSkeleton } from '../components/Feedback'
import { ProductCard, QuantitySelector } from '../components/ProductCard'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { useWishlist } from '../context/WishlistContext'
import { usePageSeo } from '../hooks/usePageSeo'
import { formatPKR, stockLabel } from '../lib/format'
import { useProducts } from '../hooks/useProducts'
import { getProductBySlug, getRelatedProducts } from '../services/productService'

export function ProductDetailsPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { push } = useToast()
  const { has, toggle } = useWishlist()
  const [qty, setQty] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const { products: allProducts } = useProducts()
  const [product, setProduct] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  usePageSeo({
    title: product ? `${product.name} | AquaFizz` : 'Product | AquaFizz',
    description: product?.description,
  })

  useEffect(() => {
    let live = true
    setLoading(true)
    setError('')
    setActiveImage(0)
    setQty(1)
    getProductBySlug(slug)
      .then((data) => {
        if (!live) return
        setProduct(data)
        if (!data) setError('This product is not available.')
      })
      .catch((err) => {
        if (live) setError(err.message || 'Could not load this product.')
      })
      .finally(() => {
        if (live) setLoading(false)
      })
    return () => {
      live = false
    }
  }, [slug])

  if (loading) return <ProductSkeleton />
  if (error || !product) return <ErrorState title="Product not found" description={error} />

  const out = product.stock <= 0
  const related = getRelatedProducts(allProducts, product)

  const add = () => {
    addItem(product, qty)
    push(`${product.name} added to cart`)
  }

  return (
    <div>
      <PageHeader eyebrow={product.category} title={product.name} />
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <img
            src={product.images[activeImage] || product.image}
            alt={product.name}
            className="h-80 w-full rounded-[2rem] border border-slate-100 bg-white object-contain p-6 md:h-[28rem]"
          />
          {product.images.length > 1 ? (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {product.images.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Show image ${i + 1}`}
                  aria-pressed={i === activeImage}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 md:h-20 md:w-20 ${
                    i === activeImage ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                  onClick={() => setActiveImage(i)}
                >
                  <img src={src} alt="" className="h-full w-full bg-white object-contain p-1" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div>
          <p className="text-sm font-medium text-primary-dark">{product.brand}</p>
          <p className="mt-1 text-slate-500">{product.size}</p>
          <p className="mt-4 text-3xl font-bold">{formatPKR(product.price)}</p>
          <p className={`mt-2 text-sm font-medium ${out ? 'text-red-600' : 'text-emerald-600'}`}>
            {stockLabel(product.stock)}
          </p>
          <p className="mt-4 text-slate-600">{product.description}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <QuantitySelector value={qty} onChange={setQty} max={Math.max(1, Math.min(20, product.stock))} disabled={out} />
            <button
              type="button"
              disabled={out}
              className="rounded-full bg-primary px-5 py-3 text-sm font-semibold disabled:bg-slate-200"
              onClick={add}
            >
              Add to Cart
            </button>
            <button
              type="button"
              disabled={out}
              className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white disabled:bg-slate-200"
              onClick={() => {
                add()
                navigate('/checkout')
              }}
            >
              Buy Now
            </button>
            <button
              type="button"
              aria-label="Wishlist"
              className="grid h-11 w-11 place-items-center rounded-full border"
              onClick={() => toggle(product.id)}
            >
              <Heart className={has(product.id) ? 'h-4 w-4 fill-primary text-primary' : 'h-4 w-4'} />
            </button>
          </div>
        </div>
      </div>
      <section className="mt-14">
        <h2 className="mb-4 text-2xl font-bold">Related products</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {related.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        <Link to="/products" className="mt-6 inline-block text-sm font-medium text-primary-dark">
          Back to shop
        </Link>
      </section>
    </div>
  )
}
